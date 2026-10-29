"use client";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PAL } from "./palette";
import { KES } from "@/lib/format";
import type { WorldStore } from "@/lib/data/queries";
import type { WorldEvent } from "./types";
import type { SaleSceneEvent, DeliverySceneEvent } from "./bus";
import { DeliveryScene } from "./deliveryScene";
import { Tweens, easeInOut as ease } from "./tween";
import { buildInterior, type Interior } from "./interior";
import { preloadCharacter } from "./assets";
import { updatePeople } from "./people";
import { SaleScene } from "./saleScene";

const SP = 6; // lattice spacing between shops

export type EngineCallbacks = {
  onSelectShop: (id: string) => void;
  onReceive: (id: string) => void;
  onPick: (info: { amountKES: number; method?: "mpesa" | "cash" }) => void;
};

type ShopNode = {
  group: THREE.Group;
  wallMat: THREE.MeshStandardMaterial;
  store: WorldStore;
  pos: THREE.Vector3;
  pulse: number;
  selected: boolean;
};

type AgentNode = {
  group: THREE.Group;
  update: (dt: number) => boolean; // returns false when finished
};

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
  private mapPose: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  private inset = { right: 0, bottom: 0 };
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(w, h);
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
    this.scene.add(new THREE.HemisphereLight(0xffffff, new THREE.Color(PAL.stone200).getHex(), 0.9));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
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

    // ground + grid
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({ color: PAL.stone100, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
    const grid = new THREE.GridHelper(160, 80, new THREE.Color(PAL.stone300), new THREE.Color(PAL.stone200));
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    this.scene.add(grid);

    // input
    const dom = this.renderer.domElement;
    dom.addEventListener("pointerdown", this.onPointerDown);
    dom.addEventListener("pointerup", this.onPointerUp);
    dom.addEventListener("pointermove", this.onPointerMove);

    this.resizeObs = new ResizeObserver(() => this.onResize());
    this.resizeObs.observe(container);

    void preloadCharacter(); // ready by the time the user steps into a shop
    this.clock.start();
    this.markDirty();
    this.raf = requestAnimationFrame(this.tick);
  }

  // ---- public API -------------------------------------------------------

  setStores(stores: WorldStore[], activeStoreId: string | null) {
    this.stores = stores;
    this.activeStoreId = activeStoreId;
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

  private setShopsHidden(hidden: boolean, only?: string) {
    for (const [sid, node] of this.shops) {
      if (only && sid !== only) continue;
      node.group.visible = !hidden;
      node.group.traverse((o) => {
        if ((o as CSS2DObject).element) o.visible = !hidden;
      });
    }
  }

  private flyCamera(toPos: THREE.Vector3, toTarget: THREE.Vector3, done?: () => void) {
    const fromPos = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    this.controls.enabled = false;
    this.tweens.add(
      1.0,
      (p) => {
        this.camera.position.lerpVectors(fromPos, toPos, p);
        this.controls.target.lerpVectors(fromTarget, toTarget, p);
        this.camera.lookAt(this.controls.target);
      },
      { ease: ease, done: () => { this.controls.enabled = true; done?.(); } },
    );
  }

  private enterShop(id: string) {
    const pos = this.posByStore.get(id);
    if (!pos) return;
    this.saleScene?.dispose();
    this.deliveryScene?.dispose();
    this.mapPose = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
    this.focusId = id;
    this.setShopsHidden(true);
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

    const target = pos.clone().add(new THREE.Vector3(0, 0.7, 0.9));
    // Pull back far enough that the whole shop fits in the part of the screen the drawer leaves free.
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    const fx = Math.max(0.2, (w - this.inset.right) / w);
    const fy = Math.max(0.2, (h - this.inset.bottom) / h);
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
    });
    this.markDirty();
  }

  private exitShop() {
    this.saleScene?.dispose();
    this.saleScene = null;
    this.deliveryScene?.dispose();
    this.deliveryScene = null;
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
    this.flyCamera(pose.pos, pose.target, () => {
      if (home) this.setShopsHidden(false, home);
      if (room) this.disposeGroup(room.group);
      this.markDirty();
    });
    // reveal the rest of the map as we start flying out; this shop returns when we land
    for (const [sid, node] of this.shops) {
      if (sid === home) continue;
      node.group.visible = true;
      node.group.traverse((o) => { if ((o as CSS2DObject).element) o.visible = true; });
    }
    this.markDirty();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.saleScene?.dispose();
    this.deliveryScene?.dispose();
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
    const maxDim = Math.max(cols, rows);
    this.baseR = Math.max(10, maxDim * SP * 1.15);
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

  private buildShop(store: WorldStore, pos: THREE.Vector3): ShopNode {
    const h = 0.9 + this.prominence(store) * 2.4;
    const group = new THREE.Group();
    group.position.copy(pos);
    group.userData = { kind: "shop", storeId: store.storeId };

    const active = store.storeId === this.activeStoreId;
    const wallMat = new THREE.MeshStandardMaterial({
      color: active ? PAL.stone50 : PAL.stone100,
      emissive: new THREE.Color(PAL.ember),
      emissiveIntensity: 0,
      roughness: 0.92,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, h, 2.4), wallMat);
    body.position.y = h / 2;
    group.add(body);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(2.62, 0.24, 2.62),
      new THREE.MeshStandardMaterial({ color: PAL.rose300, roughness: 0.75 }),
    );
    roof.position.y = h + 0.12;
    group.add(roof);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(2.42, 0.32, 0.1),
      new THREE.MeshStandardMaterial({ color: active ? PAL.ember : PAL.rose400, roughness: 0.6 }),
    );
    awning.position.set(0, h * 0.8, 1.22);
    group.add(awning);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 1.0, 0.06),
      new THREE.MeshStandardMaterial({ color: PAL.stone400, roughness: 0.85 }),
    );
    door.position.set(0, 0.5, 1.21);
    group.add(door);

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
    return { group, wallMat, store, pos: pos.clone(), pulse: 0, selected: false };
  }

  // ---- agents -----------------------------------------------------------

  private spawnTruck(storeId: string, target: THREE.Vector3) {
    const APPROACH = 2.4, DWELL = 2.0, DEPART = 2.2, TOTAL = APPROACH + DWELL + DEPART;
    const streetZ = target.z + 2.7;
    const entryX = target.x - 9, dockX = target.x, exitX = target.x + 9;

    const g = new THREE.Group();
    g.position.set(entryX, 0, streetZ);
    g.userData = { kind: "truck", storeId };
    g.add(mesh(new THREE.BoxGeometry(2.0, 1.1, 1.1), PAL.stone50, [-0.4, 0.75, 0]));
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.86, 1.04), PAL.ember, [1.0, 0.62, 0]));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), PAL.crate, [-0.6, 1.55, 0.25]));
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), PAL.crate, [-0.1, 1.55, -0.22]));
    for (const [wx, wz] of [[0.8, 0.5], [0.8, -0.5], [-0.9, 0.5], [-0.9, -0.5]] as const) {
      const wheel = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 14), PAL.stone900, [wx, 0.28, wz]);
      wheel.rotation.x = Math.PI / 2;
      g.add(wheel);
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
    const APPROACH = 1.8, DWELL = 1.0, DEPART = 1.8, TOTAL = APPROACH + DWELL + DEPART;
    const doorX = target.x, doorZ = target.z + 1.5;
    const ox = (Math.random() - 0.5) * 3, ox2 = (Math.random() - 0.5) * 3;
    const entryX = target.x + ox, exitX = target.x + ox2, laneZ = target.z + 9;
    const color = ambient ? PAL.stone400 : method === "cash" ? PAL.stone600 : PAL.mpesa;
    const showCoin = !ambient && amountKES > 0;

    const g = new THREE.Group();
    g.position.set(entryX, 0, laneZ);
    g.userData = showCoin
      ? { kind: "customer", pickable: true, amountKES, method }
      : { kind: "customer", pickable: false };
    g.add(mesh(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10), color, [0, 0.42, 0]));
    g.add(mesh(new THREE.SphereGeometry(0.15, 14, 12), PAL.stone300, [0, 0.84, 0]));

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
      coin.position.set(0, 1.1, 0);
      coin.visible = false;
      g.add(coin);
    }
    this.scene.add(g);

    let t = 0;
    this.agents.push({
      group: g,
      update: (dt) => {
        t += dt;
        let x: number, z: number, coinP = -1;
        if (t < APPROACH) {
          const p = easeInOut(t / APPROACH);
          x = entryX + (doorX - entryX) * p;
          z = laneZ + (doorZ - laneZ) * p;
          g.rotation.y = Math.atan2(doorX - entryX, doorZ - laneZ);
        } else if (t < APPROACH + DWELL) {
          x = doorX; z = doorZ; coinP = (t - APPROACH) / DWELL;
        } else if (t < TOTAL) {
          const p = easeInOut((t - APPROACH - DWELL) / DEPART);
          x = doorX + (exitX - doorX) * p;
          z = doorZ + (laneZ - doorZ) * p;
          g.rotation.y = Math.atan2(exitX - doorX, laneZ - doorZ);
        } else return false;
        g.position.set(x, Math.abs(Math.sin(t * 8)) * 0.04, z);
        if (coin && coinMat) {
          if (coinP >= 0) { coin.visible = true; coin.position.y = 1.1 + coinP * 0.7; coinMat.opacity = 1 - coinP; }
          else coin.visible = false;
        }
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
  setInset(right: number, bottom: number) {
    this.inset = { right, bottom };
    this.applyInset();
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
      const cur = node.wallMat.emissiveIntensity;
      if (Math.abs(cur - targetEmis) > 0.002) {
        node.wallMat.emissiveIntensity = cur + (targetEmis - cur) * Math.min(1, dt * 8);
        dirty = true;
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
