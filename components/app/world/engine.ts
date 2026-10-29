"use client";

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PAL } from "./palette";
import { KES } from "@/lib/format";
import type { WorldStore } from "@/lib/data/queries";
import type { WorldEvent } from "./types";
import type { SaleSceneEvent, DeliverySceneEvent, RoomSceneEvent } from "./bus";
import { DeliveryScene } from "./deliveryScene";
import { RoomScene } from "./roomScene";
import { KENNEY, available, kenneyModel, preloadKenney } from "./kenney";
import { Town } from "./town";
import { Crowd } from "./crowd";
import { Tweens, easeSmooth } from "./tween";
import { buildInterior, type Interior } from "./interior";
import { preloadCharacter } from "./assets";
import { makePerson, updatePeople } from "./people";
import { SaleScene } from "./saleScene";

const SP = 6; // lattice spacing between shops

export type EngineCallbacks = {
  onSelectShop: (id: string) => void;
  onReceive: (id: string) => void;
  onPick: (info: { amountKES: number; method?: "mpesa" | "cash" }) => void;
};

type ShopNode = {
  group: THREE.Group;
  /** Materials that glow when the shop is selected or just made a sale. */
  wallMats: THREE.MeshStandardMaterial[];
  store: WorldStore;
  pos: THREE.Vector3;
  pulse: number;
  selected: boolean;
};

type AgentNode = {
  group: THREE.Group;
  update: (dt: number) => boolean; // returns false when finished
};

let contactTex: THREE.CanvasTexture | null = null;
/** A soft radial blob, used as a cheap ambient-occlusion stand-in under buildings. */
function contactTexture() {
  if (contactTex) return contactTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 18, 64, 64, 62);
  g.addColorStop(0, "rgba(60,48,32,0.9)");
  g.addColorStop(0.55, "rgba(60,48,32,0.35)");
  g.addColorStop(1, "rgba(60,48,32,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  contactTex = new THREE.CanvasTexture(c);
  return contactTex;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Imperative three.js scene for the Mpato world. Plain three (no react-three-
 * fiber) so there's no React-reconciler/React-version conflict with Next. React
 * drives it through setStores/setSelected/pushEvent; it calls back on clicks.
 */
export class WorldEngine {
  private container: HTMLElement;
  private cb: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private shops = new Map<string, ShopNode>();
  private agents: AgentNode[] = [];
  /** People are only spawned once the character models are in, so nobody pops from a placeholder to a real body. */
  private charsLoaded = false;
  private pendingStores = false;
  private charsReady: Promise<void> = Promise.resolve();
  private posByStore = new Map<string, THREE.Vector3>();
  private stores: WorldStore[] = [];
  private activeStoreId: string | null = null;
  private reducedMotion = false;
  private baseR = 12;
  private home = new THREE.Vector3(12, 13, 12);
  private raf = 0;
  private dirtyUntil = 0;
  private disposed = false;
  private sun!: THREE.DirectionalLight;
  private tweens = new Tweens();
  private focusId: string | null = null;
  private focusReturnId: string | null = null;
  private interior: Interior | null = null;
  private saleScene: SaleScene | null = null;
  private deliveryScene: DeliveryScene | null = null;
  private roomScene: RoomScene | null = null;
  private town = new Town();
  private crowd = new Crowd();
  private crowdKey = "";
  private skipFrame = false;
  private mapPose: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  private inset = { right: 0, bottom: 0 };
  /** Where the (animated) inset is heading; framing maths uses this, not the in-flight value. */
  private insetTo = { right: 0, bottom: 0 };
  private cancelInset: (() => void) | null = null;
  private resizeObs: ResizeObserver;
  private downAt: { x: number; y: number } | null = null;

  constructor(container: HTMLElement, cb: EngineCallbacks) {
    this.container = container;
    this.cb = cb;
    this.reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PAL.stone50);
    this.scene.fog = new THREE.Fog(PAL.stone100, 34, 110);

    this.camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 400);
    this.camera.position.copy(this.home);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    // sharper on desktop, capped on phones where fill rate is the bottleneck
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth >= 900 ? 2 : 1.5));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.NeutralToneMapping; // keeps the brand palette, softens highlights
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.tweens.instant = this.reducedMotion;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    const ld = this.labelRenderer.domElement;
    ld.style.position = "absolute";
    ld.style.top = "0";
    ld.style.left = "0";
    ld.style.pointerEvents = "none";
    container.appendChild(ld);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.12;
    this.controls.maxPolarAngle = 1.15;
    this.controls.minPolarAngle = 0.25;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 90;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener("change", () => (this.dirtyUntil = performance.now() + 150));

    // lights
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, new THREE.Color(PAL.stone300).getHex(), 0.95));
    const dir = new THREE.DirectionalLight(0xfff1dc, 1.05); // warm sun
    dir.position.set(8, 16, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.left = -14;
    dir.shadow.camera.right = 14;
    dir.shadow.camera.top = 14;
    dir.shadow.camera.bottom = -14;
    dir.shadow.camera.far = 60;
    dir.shadow.bias = -0.0004;
    dir.shadow.normalBias = 0.03;
    this.scene.add(dir);
    this.sun = dir;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    // soft image-based light so textured skin/cloth and glossy materials read as real
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.18;
    pmrem.dispose();

    // ground (the town's roads, pavements and backdrop sit on top of it)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({ color: PAL.stone100, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(this.town.group);
    this.scene.add(this.crowd.group);
    this.crowd.freeze(this.reducedMotion);
    // people wait for a delivery truck to pass instead of walking through it
    this.crowd.setBlocker((x, z) =>
      this.agents.some(
        (a) =>
          a.group.userData.kind === "truck" &&
          Math.abs(x - a.group.position.x) < 1.7 &&
          Math.abs(z - a.group.position.z) < 1.0,
      ),
    );

    // input
    const dom = this.renderer.domElement;
    dom.addEventListener("pointerdown", this.onPointerDown);
    dom.addEventListener("pointerup", this.onPointerUp);
    dom.addEventListener("pointermove", this.onPointerMove);

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(container);

    // models load once; the shops wait for them so nothing is built as a placeholder and swapped later
    this.charsReady = Promise.all([preloadCharacter(), preloadKenney()]).then(() => {
      this.charsLoaded = true;
      if (this.pendingStores && !this.disposed) {
        this.pendingStores = false;
        this.setStores(this.stores, this.activeStoreId);
      }
    });
    this.clock.start();
    this.markDirty();
    this.raf = requestAnimationFrame(this.tick);
  }

  // ---- public API -------------------------------------------------------

  setStores(stores: WorldStore[], activeStoreId: string | null) {
    this.stores = stores;
    this.activeStoreId = activeStoreId;
    if (!this.charsLoaded) {
      this.pendingStores = true;
      return;
    }
    this.layout();
    // remove shops no longer present
    for (const [id, node] of this.shops) {
      if (!stores.find((s) => s.storeId === id)) {
        this.disposeGroup(node.group);
        this.shops.delete(id);
      }
    }
    for (const s of stores) {
      const pos = this.posByStore.get(s.storeId)!;
      const existing = this.shops.get(s.storeId);
      if (existing) {
        existing.store = s;
        existing.pos.copy(pos);
        existing.group.position.copy(pos);
      } else {
        this.shops.set(s.storeId, this.buildShop(s, pos));
      }
    }
    if (!this.focusId) this.fitCamera();
    this.markDirty();
  }

  setSelected(id: string | null) {
    for (const [sid, node] of this.shops) node.selected = sid === id;
    this.markDirty();
  }

  pushEvent(e: WorldEvent) {
    // While inside a shop the scene is driven only by what the user is doing.
    if (this.focusId) return;
    const pos = this.posByStore.get(e.storeId);
    if (!pos) return;
    if (e.kind === "delivery") this.spawnTruck(e.storeId, pos);
    else this.spawnCustomer(pos, false, e.amountKES, e.method);
    this.markDirty();
  }

  zoom(factor: number) {
    this.camera.position.lerpVectors(this.controls.target, this.camera.position, factor);
    this.controls.update();
    this.markDirty();
  }

  recenter() {
    this.home.copy(this.computeHome());
    this.controls.target.set(0, 0, 0);
    this.camera.position.copy(this.home);
    this.controls.update();
    this.markDirty();
  }

  // ---- inside a shop ----------------------------------------------------

  /** Fly into a shop's interior (id) or back out to the map (null). */
  focusShop(id: string | null) {
    if (id === this.focusId) return;
    if (id) this.enterShop(id);
    else this.exitShop();
  }

  /** Forward POS-drawer events to the sale choreography. */
  sale(e: SaleSceneEvent) {
    this.saleScene?.handle(e);
    this.markDirty();
  }

  /** Forward receive-drawer events to the delivery choreography. */
  delivery(e: DeliverySceneEvent) {
    this.deliveryScene?.handle(e);
    this.markDirty();
  }

  /** Forward dashboard / inventory / customers drawer events to the room choreography. */
  roomEvent(e: RoomSceneEvent) {
    this.roomScene?.handle(e);
    this.markDirty();
  }

  private setShopsHidden(hidden: boolean, only?: string) {
    for (const [sid, node] of this.shops) {
      if (only && sid !== only) continue;
      node.group.visible = !hidden;
      node.group.traverse((o) => {
        if ((o as CSS2DObject).element) o.visible = !hidden;
      });
    }
  }

  /**
   * Glide the camera on an orbit-style arc: the look-at point travels in a line while the
   * camera swings around it in spherical coordinates (radius, tilt, heading). A straight
   * position lerp cuts through the scene and changes apparent speed as distance changes.
   */
  private flyCamera(
    toPos: THREE.Vector3,
    toTarget: THREE.Vector3,
    done?: () => void,
    onProgress?: (p: number) => void,
    dur = 1.5,
  ) {
    const fromTarget = this.controls.target.clone();
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(fromTarget));
    const to = new THREE.Spherical().setFromVector3(toPos.clone().sub(toTarget));
    // take the short way round
    let dTheta = to.theta - from.theta;
    if (dTheta > Math.PI) dTheta -= Math.PI * 2;
    if (dTheta < -Math.PI) dTheta += Math.PI * 2;
    const tmp = new THREE.Spherical();
    const off = new THREE.Vector3();
    this.controls.enabled = false;
    this.tweens.add(
      dur,
      (p) => {
        this.controls.target.lerpVectors(fromTarget, toTarget, p);
        tmp.radius = from.radius + (to.radius - from.radius) * p;
        tmp.phi = from.phi + (to.phi - from.phi) * p;
        tmp.theta = from.theta + dTheta * p;
        off.setFromSpherical(tmp);
        this.camera.position.copy(this.controls.target).add(off);
        this.camera.lookAt(this.controls.target);
        onProgress?.(p);
      },
      { ease: easeSmooth, done: () => { this.controls.enabled = true; done?.(); } },
    );
  }

  private enterShop(id: string) {
    const pos = this.posByStore.get(id);
    if (!pos) return;
    this.saleScene?.dispose();
    this.deliveryScene?.dispose();
    this.roomScene?.dispose();
    this.mapPose = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    this.focusId = id;
    this.setShopsHidden(true, id);
    let othersHidden = false;
    // the interior brings its own street, so the town and its people step out of frame
    this.town.setVisible(false);
    this.crowd.setVisible(false);
    // drop map-level walkers/trucks so they don't wander through the interior
    for (const a of this.agents) this.disposeGroup(a.group);
    this.agents = [];

    const store = this.stores.find((s) => s.storeId === id);
    void store;
    this.interior = buildInterior(PAL.ember);
    this.interior.group.position.copy(pos);
    this.scene.add(this.interior.group);
    this.saleScene = new SaleScene(this.interior, this.tweens, () => this.markDirty());
    this.deliveryScene = new DeliveryScene(this.interior, this.tweens, () => this.markDirty());
    this.roomScene = new RoomScene(this.interior, this.tweens, () => this.markDirty());

    const target = pos.clone().add(new THREE.Vector3(0, 0.7, 0.9));
    // Pull back far enough that the whole shop fits in the part of the screen the drawer leaves free.
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const fx = Math.max(0.2, (w - this.insetTo.right) / w);
    const fy = Math.max(0.2, (h - this.insetTo.bottom) / h);
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const dist = Math.max(7.2 / (2 * t * ((w * fx) / (h * fy))), 6.4 / (2 * t * fy), 9);
    const dir = new THREE.Vector3(0, 5.6, 9.2).normalize();
    const camPos = pos.clone().add(target.clone().sub(pos).multiplyScalar(0)).add(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 0.7, 0.9));
    this.flyCamera(camPos, target, () => {
      this.controls.minDistance = dist * 0.55;
      this.controls.maxDistance = dist * 1.5;
      this.controls.minAzimuthAngle = -0.6;
      this.controls.maxAzimuthAngle = 0.6;
      this.controls.minPolarAngle = 0.7;
      this.controls.maxPolarAngle = 1.35;
    }, (p) => {
      // neighbours leave once they're out of the way, not on frame one
      if (!othersHidden && p > 0.5) {
        othersHidden = true;
        this.setShopsHidden(true);
      }
    });
    this.markDirty();
  }

  private exitShop() {
    this.saleScene?.dispose();
    this.saleScene = null;
    this.deliveryScene?.dispose();
    this.deliveryScene = null;
    this.roomScene?.dispose();
    this.roomScene = null;
    this.tweens.clear();
    const room = this.interior;
    this.interior = null;
    this.focusReturnId = this.focusId;
    this.focusId = null;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = 1.15;
    this.controls.minDistance = 6;
    this.controls.maxDistance = this.baseR * 2.6;
    const pose = this.mapPose ?? { pos: this.home.clone(), target: new THREE.Vector3() };
    const home = this.focusReturnId;
    let revealed = false;
    this.flyCamera(pose.pos, pose.target, () => {
      if (home) this.setShopsHidden(false, home);
      if (room) this.disposeGroup(room.group);
      this.markDirty();
    }, (p) => {
      // bring the rest of the map back part-way out; this shop returns when we land
      if (revealed || p < 0.3) return;
      revealed = true;
      this.town.setVisible(true);
      this.crowd.setVisible(true);
      for (const [sid, node] of this.shops) {
        if (sid === home) continue;
        node.group.visible = true;
        node.group.traverse((o) => { if ((o as CSS2DObject).element) o.visible = true; });
      }
    });
    this.markDirty();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.saleScene?.dispose();
    this.deliveryScene?.dispose();
    this.roomScene?.dispose();
    this.crowd.dispose();
    this.town.dispose();
    this.tweens.clear();
    this.resizeObs.disconnect();
    const dom = this.renderer.domElement;
    dom.removeEventListener("pointerdown", this.onPointerDown);
    dom.removeEventListener("pointerup", this.onPointerUp);
    dom.removeEventListener("pointermove", this.onPointerMove);
    this.controls.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  // ---- layout / build ---------------------------------------------------

  private layout() {
    const n = this.stores.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const rows = Math.max(1, Math.ceil(n / cols));
    this.posByStore.clear();
    this.stores.forEach((s, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      this.posByStore.set(
        s.storeId,
        new THREE.Vector3((col - (cols - 1) / 2) * SP, 0, (row - (rows - 1) / 2) * SP),
      );
    });
    this.town.build(cols, rows, SP);
    // pavement lines the crowd strolls along: either side of every road, ringing every shop block
    const key = `${cols}x${rows}x${n}`;
    if (key !== this.crowdKey) {
      this.crowdKey = key;
      const xAt = (k: number) => (k - (cols - 1) / 2) * SP;
      const zAt = (r: number) => (r - (rows - 1) / 2) * SP;
      const xs: number[] = [], zs: number[] = [];
      for (let k = -1; k < cols; k++) xs.push(xAt(k) + 1.8, xAt(k) + 4.2);
      for (let r = -1; r < rows; r++) zs.push(zAt(r) + 1.7, zAt(r) + 4.05);
      this.crowd.configure({ xs, zs }, Math.min(14, 4 + n * 3));
    }
    const maxDim = Math.max(cols, rows);
    this.baseR = Math.max(10, maxDim * SP * 1.15);
    // keep shadows covering the whole lattice as it grows (the town is only shadowed inside this box)
    const ext = Math.max(14, maxDim * SP * 0.8);
    const sc = this.sun.shadow.camera;
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
    sc.far = Math.max(60, ext * 4);
    this.sun.position.set(ext * 0.6, ext * 1.2, ext * 0.45);
    sc.updateProjectionMatrix();
    this.controls.maxDistance = this.baseR * 2.6;
  }

  // Pull the camera back on tall/narrow (portrait) viewports so the whole
  // cluster stays in frame.
  private computeHome(): THREE.Vector3 {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const aspect = w / h;
    const f = aspect < 1 ? 1 / Math.sqrt(aspect) : 1;
    const R = this.baseR * f;
    return new THREE.Vector3(R * 0.72, R * 0.82, R * 0.72);
  }

  private fitCamera() {
    this.home.copy(this.computeHome());
    this.camera.position.copy(this.home);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private prominence(store: WorldStore): number {
    const max = this.stores.reduce((m, s) => Math.max(m, s.salesToday), 0);
    return max > 0 ? Math.max(0.3, Math.sqrt(store.salesToday / max)) : 0.4;
  }

  /**
   * A Kenney building for this shop, picked by how busy the shop is (busier = taller), or null when the
   * models aren't available. Materials are cloned per shop so each can glow on its own.
   */
  private kenneyShopBody(store: WorldStore) {
    const names = available(KENNEY.buildings);
    if (!names.length) return null;
    const FIT = 1.9; // footprint of the building, inside the 2.5 plinth
    const ranked = names
      .map((n) => {
        const m = kenneyModel(n)!;
        return { n, h: (m.size.y / Math.max(m.size.x, m.size.z)) * FIT };
      })
      .sort((a, b) => a.h - b.h);
    let seed = 0;
    for (const c of store.storeId) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const base = Math.round(((this.prominence(store) - 0.3) / 0.7) * (ranked.length - 1));
    const idx = Math.max(0, Math.min(ranked.length - 1, base + ((seed % 3) - 1)));
    const pick = ranked[idx];
    const m = kenneyModel(pick.n)!;
    m.object.scale.setScalar(FIT / Math.max(m.size.x, m.size.z));
    m.object.position.y = 0.03;
    const mats: THREE.MeshStandardMaterial[] = [];
    m.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
      mat.emissive = new THREE.Color(PAL.ember);
      mat.emissiveIntensity = 0;
      mesh.material = mat;
      mats.push(mat);
    });
    return { object: m.object, height: pick.h, mats };
  }

  private buildShop(store: WorldStore, pos: THREE.Vector3): ShopNode {
    let h = 0.9 + this.prominence(store) * 2.4;
    const km0 = this.kenneyShopBody(store);
    if (km0) h = km0.height;
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData = { kind: "shop", storeId: store.storeId };

    const active = store.storeId === this.activeStoreId;
    const km = km0;
    const wallMat = new THREE.MeshStandardMaterial({
      color: active ? PAL.stone50 : PAL.stone100,
      emissive: new THREE.Color(PAL.ember),
      emissiveIntensity: 0,
      roughness: 0.92,
    });
    const std = (color: string, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough });
    const add = (w: number, hh: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };
    const glass = new THREE.MeshStandardMaterial({ color: "#9fc4d6", roughness: 0.25, metalness: 0.1 });
    const frame = std(PAL.stone300);
    const brand = active ? PAL.ember : PAL.rose400;
    let seed = 0;
    for (const c of store.storeId) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;

    // soft contact shadow so the building sits on the pavement instead of floating on it
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.0), new THREE.MeshBasicMaterial({ map: contactTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
    cs.rotation.x = -Math.PI / 2;
    cs.position.y = 0.045;
    group.add(cs);

    if (km) {
      group.add(km.object);
      // a small planter by the door keeps the pavement from looking bare
      add(0.3, 0.2, 0.3, std("#8a6a47", 0.9), -1.0, 0.22, 1.45);
      const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), std("#5f9e63", 0.9));
      shrub.position.set(-1.0, 0.45, 1.45);
      group.add(shrub);
    } else {
      // body on a plinth
      add(2.5, 0.12, 2.5, std(PAL.stone400, 0.9), 0, 0.06, 0);
      const body = add(2.4, h, 2.4, wallMat, 0, h / 2, 0);
      void body;

      // shopfront: two display windows either side of the door, framed
      for (const sx of [-0.78, 0.78]) {
        add(0.66, 0.6, 0.04, frame, sx, 0.66, 1.205);
        add(0.56, 0.5, 0.05, glass, sx, 0.66, 1.21);
      }
      // upper floors get a row of windows on the front and both sides
      for (let y = 1.55; y < h - 0.35; y += 0.7) {
        for (const sx of [-0.78, 0, 0.78]) add(0.42, 0.4, 0.05, glass, sx, y, 1.205);
        for (const sx of [-1, 1]) for (const sz of [-0.55, 0.55]) add(0.05, 0.4, 0.42, glass, sx * 1.205, y, sz);
      }
      for (const sx of [-1, 1]) for (const sz of [-0.55, 0.55]) add(0.05, 0.5, 0.42, glass, sx * 1.205, 0.8, sz);

      // door with a frame and a step
      add(0.7, 1.08, 0.05, frame, 0, 0.54, 1.205);
      add(0.58, 0.98, 0.06, std(PAL.stone600, 0.85), 0, 0.5, 1.215);
      add(0.8, 0.06, 0.3, std(PAL.stone300, 0.9), 0, 0.09, 1.36);

      // striped awning, sloped, in the shop's brand colour
      for (let i = 0; i < 6; i++) {
        const seg = add(0.4, 0.05, 0.5, std(i % 2 ? "#f8f7f4" : brand, 0.6), -1 + i * 0.4 + 0.2, 1.3, 1.45);
        seg.rotation.x = 0.32;
      }
      // sign board above the awning when the building is tall enough
      if (h > 2.1) add(1.3, 0.28, 0.06, std(brand, 0.6), 0, Math.min(h - 0.4, 1.82), 1.23);

      // roof: ledge, then a rooftop detail that differs per shop
      add(2.62, 0.14, 2.62, std(PAL.stone300, 0.8), 0, h + 0.07, 0);
      add(2.3, 0.04, 2.3, std(PAL.rose300, 0.75), 0, h + 0.16, 0);
      const detail = seed % 3;
      if (detail === 0) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 14), std("#8a95a5", 0.5));
        tank.position.set(0.6, h + 0.42, -0.5);
        group.add(tank);
        add(0.5, 0.3, 0.5, frame, 0.6, h + 0.2, -0.5);
      } else if (detail === 1) {
        add(0.6, 0.3, 0.45, std("#a9a498", 0.6), -0.5, h + 0.33, -0.4);
        add(0.4, 0.22, 0.3, std("#a9a498", 0.6), 0.5, h + 0.29, 0.3);
      } else {
        add(0.9, 0.5, 0.7, std(PAL.stone200), 0.4, h + 0.4, -0.5);
        add(0.95, 0.05, 0.75, std(PAL.rose400), 0.4, h + 0.68, -0.5);
      }

      // a planter by the door
      add(0.3, 0.2, 0.3, std("#8a6a47", 0.9), -1.0, 0.22, 1.45);
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), std("#5f9e63", 0.9));
      bush.position.set(-1.0, 0.45, 1.45);
      group.add(bush);


    }

    if (store.lowStock > 0) {
      const pennant = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.42, 4),
        new THREE.MeshStandardMaterial({ color: PAL.warning, emissive: new THREE.Color(PAL.warning), emissiveIntensity: 0.35 }),
      );
      pennant.position.set(0.95, h + 0.75, 0);
      group.add(pennant);
    }

    // label
    const el = document.createElement("div");
    el.className = "world3d-label" + (active ? " active" : "");
    el.innerHTML = `<span class="nm"></span><span class="kv"></span>`;
    (el.querySelector(".nm") as HTMLElement).textContent = store.name;
    (el.querySelector(".kv") as HTMLElement).textContent = `${KES(store.salesToday)} · ${store.ordersToday}`;
    const label = new CSS2DObject(el);
    label.position.set(0, h + 1.1, 0);
    group.add(label);

    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    this.scene.add(group);
    return { group, wallMats: km ? km.mats : [wallMat], store, pos: pos.clone(), pulse: 0, selected: false };
  }

  // ---- agents -----------------------------------------------------------

  private spawnTruck(storeId: string, target: THREE.Vector3) {
    const APPROACH = 2.4, DWELL = 2.0, DEPART = 2.2, TOTAL = APPROACH + DWELL + DEPART;
    const streetZ = target.z + 2.7;
    const entryX = target.x - 9, dockX = target.x, exitX = target.x + 9;

    const g = new THREE.Group();
    g.position.set(entryX, 0, streetZ);
    g.userData = { kind: "truck", storeId };
    // same Kenney delivery truck as inside the shop; the code-built box truck is only a fallback
    const km = kenneyModel("cars/delivery");
    if (km) {
      // face +x (the way it drives) and fit the road lane
      km.object.scale.setScalar(1.15 / Math.min(km.size.x, km.size.z));
      km.object.rotation.y = Math.PI / 2;
      km.object.position.y = 0.02;
      g.add(km.object);
    } else {
      g.add(mesh(new THREE.BoxGeometry(2.0, 1.1, 1.1), PAL.stone50, [-0.4, 0.75, 0]));
      g.add(mesh(new THREE.BoxGeometry(0.9, 0.86, 1.04), PAL.ember, [1.0, 0.62, 0]));
      g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), PAL.crate, [-0.6, 1.55, 0.25]));
      g.add(mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), PAL.crate, [-0.1, 1.55, -0.22]));
      for (const [wx, wz] of [[0.8, 0.5], [0.8, -0.5], [-0.9, 0.5], [-0.9, -0.5]] as const) {
        const wheel = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14), PAL.stone900, [wx, 0.28, wz]);
        wheel.rotation.x = Math.PI / 2;
        g.add(wheel);
      }

    }
    this.scene.add(g);

    let t = 0;
    let arrived = false;
    this.agents.push({
      group: g,
      update: (dt) => {
        t += dt;
        let x = dockX;
        if (t < APPROACH) x = entryX + (dockX - entryX) * easeInOut(t / APPROACH);
        else if (t < APPROACH + DWELL) {
          x = dockX;
          if (!arrived) { arrived = true; this.pulseShop(storeId); }
        } else if (t < TOTAL) x = dockX + (exitX - dockX) * easeInOut((t - APPROACH - DWELL) / DEPART);
        else return false;
        g.position.set(x, 0, streetZ);
        return true;
      },
    });
  }

  private spawnCustomer(
    target: THREE.Vector3,
    ambient: boolean,
    amountKES = 0,
    method?: "mpesa" | "cash",
  ) {
    if (!this.charsLoaded) {
      void this.charsReady.then(() => {
        if (!this.disposed) this.spawnCustomer(target, ambient, amountKES, method);
      });
      return;
    }
    const SPEED = 2.3, DWELL = 1.0;
    const V = (x: number, z: number) => new THREE.Vector3(x, 0, z);
    const doorX = target.x, doorZ = target.z + 1.5;
    const laneZ = target.z + 9;
    // Walk down the pavement beside the shop (crossing the road on the zebra), then along the shopfront
    // to the door. The pavement keeps clear of a parked delivery truck.
    const inSide = Math.random() < 0.5 ? -1.8 : 1.8;
    const outSide = Math.random() < 0.5 ? -1.8 : 1.8;
    const jitter = () => (Math.random() - 0.5) * 0.3;
    const inPts = [V(doorX + inSide + jitter(), laneZ), V(doorX + inSide, target.z + 1.7), V(doorX, doorZ)];
    const outPts = [V(doorX, doorZ), V(doorX + outSide, target.z + 1.7), V(doorX + outSide + jitter(), laneZ)];
    const lenOf = (pts: THREE.Vector3[]) => pts.slice(1).reduce((n, p, i) => n + p.distanceTo(pts[i]), 0);
    const inLen = lenOf(inPts), outLen = lenOf(outPts);
    const pointAt = (pts: THREE.Vector3[], d: number, out: THREE.Vector3, dir: THREE.Vector3) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const seg = pts[i].distanceTo(pts[i + 1]);
        if (d <= seg || i === pts.length - 2) {
          const k = seg > 0 ? Math.min(1, d / seg) : 1;
          out.lerpVectors(pts[i], pts[i + 1], k);
          dir.subVectors(pts[i + 1], pts[i]);
          return;
        }
        d -= seg;
      }
    };
    const color = ambient ? PAL.stone400 : method === "cash" ? PAL.stone600 : PAL.mpesa;
    const showCoin = !ambient && amountKES > 0;

    const g = new THREE.Group();
    g.position.copy(inPts[0]);
    g.userData = showCoin
      ? { kind: "customer", pickable: true, amountKES, method }
      : { kind: "customer", pickable: false };
    // a real person (rigged body), scaled to sit right beside the toy-scale shops
    const person = makePerson({ skin: "#d9a47c", shirt: color });
    person.group.scale.setScalar(0.52); // toy-scale people, as tall as the shop doors
    g.add(person.group);
    // generous invisible hit area so tapping a person is easy
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.3, 8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.65;
    g.add(hit);

    let coin: THREE.Mesh | null = null;
    let coinMat: THREE.MeshStandardMaterial | null = null;
    if (showCoin) {
      coinMat = new THREE.MeshStandardMaterial({
        color: PAL.warning,
        emissive: new THREE.Color(PAL.warning),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 1,
      });
      coin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16), coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set(0, 1.4, 0);
      coin.visible = false;
      g.add(coin);
    }
    this.scene.add(g);

    let phase = 0; // 0 in, 1 at the door, 2 out
    let s = 0, dwellT = 0;
    const pos = new THREE.Vector3(), dir = new THREE.Vector3();
    this.agents.push({
      group: g,
      update: (dt) => {
        if (phase === 1) {
          dwellT += dt;
          const cp = Math.min(1, dwellT / DWELL);
          person.walk(0, 0);
          if (coin && coinMat) {
            coin.visible = true;
            coin.position.y = 1.4 + cp * 0.7;
            coinMat.opacity = 1 - cp;
          }
          if (dwellT >= DWELL) {
            phase = 2;
            s = 0;
            if (coin) coin.visible = false;
          }
          return true;
        }
        const pts = phase === 0 ? inPts : outPts;
        const total = phase === 0 ? inLen : outLen;
        // never walk through a delivery truck: hold position until it has passed
        pointAt(pts, Math.min(total, s + 0.9), pos, dir);
        const blocked = this.agents.some((a) => {
          if (a.group.userData.kind !== "truck") return false;
          return Math.abs(pos.x - a.group.position.x) < 1.7 && Math.abs(pos.z - a.group.position.z) < 1.0;
        });
        if (blocked) {
          person.walk(0, 0);
          return true;
        }
        s += SPEED * dt;
        if (s >= total) {
          if (phase === 0) {
            phase = 1;
            g.position.copy(pts[pts.length - 1]);
            g.rotation.y = Math.PI; // face the shop
            return true;
          }
          return false;
        }
        pointAt(pts, s, pos, dir);
        g.position.copy(pos);
        const yaw = Math.atan2(dir.x, dir.z);
        let dy = yaw - g.rotation.y;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        g.rotation.y += dy * Math.min(1, dt * 10);
        person.walk(s / 0.38, 1);
        return true;
      },
    });
  }

  private pulseShop(storeId: string) {
    const node = this.shops.get(storeId);
    if (node) node.pulse = 1;
  }

  // ---- input ------------------------------------------------------------

  private onPointerDown = (e: PointerEvent) => { this.downAt = { x: e.clientX, y: e.clientY }; };
  private onPointerUp = (e: PointerEvent) => {
    const d = this.downAt;
    this.downAt = null;
    if (!d) return;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 5) return; // was a drag
    const hit = this.pick(e);
    if (!hit) return;
    const { kind, storeId, amountKES, method } = hit.userData as Record<string, unknown>;
    if (kind === "shop") this.cb.onSelectShop(storeId as string);
    else if (kind === "truck") this.cb.onReceive(storeId as string);
    else if (kind === "customer" && hit.userData.pickable)
      this.cb.onPick({ amountKES: amountKES as number, method: method as "mpesa" | "cash" | undefined });
  };
  private onPointerMove = (e: PointerEvent) => {
    if (this.downAt) return;
    this.renderer.domElement.style.cursor = this.pick(e) ? "pointer" : "";
  };

  private pick(e: PointerEvent): THREE.Object3D | null {
    if (this.focusId) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const roots = [
      ...Array.from(this.shops.values()).map((s) => s.group),
      ...this.agents.map((a) => a.group),
    ];
    const hits = this.raycaster.intersectObjects(roots, true);
    if (!hits.length) return null;
    let o: THREE.Object3D | null = hits[0].object;
    while (o && !(o.userData && o.userData.kind)) o = o.parent;
    return o;
  }

  private onResize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.applyInset();
    this.markDirty();
  }

  /** Shift the visible scene away from UI docked on the right/bottom. */
  setInset(right: number, bottom: number, animate = true) {
    // already heading there (React re-applies on every render): don't restart the glide
    if (animate && this.cancelInset && this.insetTo.right === right && this.insetTo.bottom === bottom) return;
    this.cancelInset?.();
    this.cancelInset = null;
    this.insetTo = { right, bottom };
    const from = { ...this.inset };
    if (!animate || (from.right === right && from.bottom === bottom)) {
      this.inset = { right, bottom };
      this.applyInset();
      this.markDirty();
      return;
    }
    // Glide the framing offset alongside the camera so docking the drawer never snaps the scene sideways.
    this.cancelInset = this.tweens.add(
      1.1,
      (p) => {
        this.inset = {
          right: from.right + (right - from.right) * p,
          bottom: from.bottom + (bottom - from.bottom) * p,
        };
        this.applyInset();
      },
      { ease: easeSmooth, done: () => { this.cancelInset = null; } },
    );
    this.markDirty();
  }

  private applyInset() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const { right, bottom } = this.inset;
    if (right === 0 && bottom === 0) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, right / 2, bottom / 2, w, h);
    this.camera.updateProjectionMatrix();
  }

  private markDirty() { this.dirtyUntil = performance.now() + 60; }

  // ---- loop -------------------------------------------------------------

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.clock.getDelta());
    let dirty = performance.now() < this.dirtyUntil;

    this.controls.update();

    if (updatePeople(dt)) dirty = true;

    if (this.tweens.active) {
      dirty = true;
      this.tweens.step(dt);
    }

    if (this.agents.length) {
      dirty = true;
      this.agents = this.agents.filter((a) => {
        const alive = a.update(dt);
        if (!alive) this.disposeGroup(a.group);
        return alive;
      });
    }

    for (const node of this.shops.values()) {
      if (node.pulse > 0.001) {
        node.pulse = Math.max(0, node.pulse - dt * 1.4);
        node.group.scale.y = 1 + node.pulse * 0.07;
        dirty = true;
      }
      const targetEmis = (node.selected ? 0.5 : 0) + node.pulse * 0.7;
      const cur = node.wallMats[0].emissiveIntensity;
      if (Math.abs(cur - targetEmis) > 0.002) {
        const next = cur + (targetEmis - cur) * Math.min(1, dt * 8);
        for (const m of node.wallMats) m.emissiveIntensity = next;
        dirty = true;
      }
    }

    // street life animates continuously, so when it's the only thing moving, draw every other frame
    if (this.crowd.active) {
      this.crowd.update(dt);
      if (!dirty) {
        this.skipFrame = !this.skipFrame;
        dirty = !this.skipFrame;
      }
    }

    if (dirty) {
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    }
  };

  private disposeGroup(group: THREE.Group) {
    this.scene.remove(group);
    group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | undefined;
      if (mat) mat.dispose();
      if ((o as CSS2DObject).element) (o as CSS2DObject).element.remove();
    });
  }
}

function mesh(geo: THREE.BufferGeometry, color: string, pos: [number, number, number]) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.82 }));
  m.castShadow = true;
  m.receiveShadow = true;
  m.position.set(pos[0], pos[1], pos[2]);
  return m;
}
