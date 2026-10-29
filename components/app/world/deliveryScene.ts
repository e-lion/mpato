import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PAL } from "./palette";
import { KES } from "@/lib/format";
import { goodsColor, makeGoods, type Interior } from "./interior";
import { makePerson, randomLook, type Person } from "./people";
import { Tweens, easeInOut, easeOut } from "./tween";
import { walkPath } from "./walk";
import { fitModel, loadGltfScene } from "./assets";
import type { DeliverySceneEvent } from "./bus";

const PARK_X = 1.0;
const STREET_Z = 4.15;

function signTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const x = c.getContext("2d")!;
  x.fillStyle = PAL.ember;
  x.fillRect(0, 0, 512, 160);
  x.fillStyle = "#fff";
  x.font = "700 64px system-ui, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  let t = text;
  while (x.measureText(t).width > 470 && t.length > 3) t = t.slice(0, -2);
  if (t !== text) t += "…";
  x.fillText(t, 256, 84);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildTruck(name: string, model: THREE.Group | null) {
  const g = new THREE.Group();
  if (model) return buildModelTruck(g, name, model);
  const add = (geo: THREE.BufferGeometry, color: string, pos: [number, number, number], rough = 0.7) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough }));
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.proc = true;
    g.add(m);
    return m;
  };
  // chassis + cargo box (long axis = x, cab at +x so it drives toward +x)
  add(new THREE.BoxGeometry(3.3, 0.14, 1.28), PAL.stone900, [0, 0.4, 0]);
  add(new THREE.BoxGeometry(2.3, 1.35, 1.3), "#f8f7f4", [-0.45, 1.15, 0], 0.55);
  add(new THREE.BoxGeometry(0.95, 0.95, 1.26), PAL.ember, [1.2, 0.95, 0], 0.5);
  add(new THREE.BoxGeometry(0.06, 0.5, 1.0), "#bfe3f5", [1.69, 1.08, 0], 0.2); // windscreen
  add(new THREE.BoxGeometry(0.22, 0.16, 1.36), PAL.stone600, [1.75, 0.45, 0]); // bumper
  for (const wx of [-1.0, 0.5, 1.3]) {
    for (const wz of [0.66, -0.66]) {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.22, 20),
        new THREE.MeshStandardMaterial({ color: PAL.stone900, roughness: 0.9 }),
      );
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.3, wz);
      w.castShadow = true;
      w.userData.proc = true;
      g.add(w);
    }
  }
  const tex = signTexture(name);
  for (const side of [1, -1]) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 0.6),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }),
    );
    sign.userData.proc = true;
    sign.position.set(-0.45, 1.2, side * 0.656);
    if (side < 0) sign.rotation.y = Math.PI;
    g.add(sign);
  }
  // open rear door (shop-facing side shows cargo through the +z side: leave as a dark hatch)
  return g;
}

/** The real truck model, fitted and labelled with the supplier's name. */
function buildModelTruck(g: THREE.Group, name: string, model: THREE.Group) {
  const alongX = fitModel(model, 3.0);
  if (!alongX) model.rotation.y = Math.PI / 2;
  g.add(model);
  // the model carries its own livery, so show the supplier as a name tag
  const el = document.createElement("div");
  el.className = "world3d-label active";
  const nm = document.createElement("span");
  nm.className = "nm";
  nm.textContent = name;
  el.appendChild(nm);
  const tag = new CSS2DObject(el);
  tag.position.set(0, 2.1, 0);
  g.add(tag);
  return g;
}

/**
 * Choreography for the receive-stock drawer. A supplier's truck pulls up only
 * once the user picks that supplier; when the receipt is saved the driver
 * carries the crates onto the shelves, the shop pays, and the truck leaves.
 */
export class DeliveryScene {
  private truck: THREE.Group | null = null;
  private driver: Person | null = null;
  private crates: THREE.Object3D[] = [];
  private truckName: string | null = null;
  private busy = false;
  private arriving = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private room: Interior,
    private tweens: Tweens,
    private dirty: () => void,
  ) {
    void loadGltfScene("/models/truck.glb"); // warm the cache so the truck can appear straight away
  }

  handle(e: DeliverySceneEvent) {
    switch (e.type) {
      case "supplier":
        this.setSupplier(e.name);
        break;
      case "received":
        this.unload(e.lines, e.paid);
        break;
      case "leave":
        this.clearTimers();
        this.depart();
        break;
    }
    this.dirty();
  }

  dispose() {
    this.clearTimers();
  }

  private later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private setSupplier(name: string | null) {
    if (this.busy) return;
    if (name === this.truckName) return;
    const had = !!this.truck;
    this.truckName = name;
    if (had) this.depart();
    if (name) this.later(() => this.arrive(name), had ? 1600 : 0);
  }

  private arrive(name: string) {
    if (this.truck || this.arriving) return;
    this.arriving = true;
    // Resolve the model BEFORE building anything, so the truck that drives in is the truck that parks
    // (building a placeholder and swapping the real model in mid-drive made it change shape).
    void loadGltfScene("/models/truck.glb").then((model) => {
      this.arriving = false;
      if (this.truck || this.truckName !== name) return; // supplier changed while loading
      const truck = buildTruck(name, model);
      truck.position.set(-9, 0, STREET_Z);
      this.room.group.add(truck);
      this.truck = truck;
      if (!model) {
        // stacked crates visible in the cargo area of the procedural truck
        for (let i = 0; i < 3; i++) {
          const c = makeGoods(PAL.crate, 0.32);
          c.position.set(-0.9 + i * 0.45, 1.8, 0.1);
          truck.add(c);
        }
      }
      const from = truck.position.x;
      this.tweens.add(2.2, (p) => (truck.position.x = from + (PARK_X - from) * p), {
        ease: easeOut,
        done: () => this.driverExits(),
      });
      this.dirty();
    });
  }

  private driverExits() {
    if (!this.truck) return;
    const d = makePerson({ ...randomLook(), shirt: "#2f7d6b" });
    this.room.group.add(d.group);
    this.driver = d;
    const cab = new THREE.Vector3(PARK_X + 1.2, 0, STREET_Z + 0.95);
    const rear = new THREE.Vector3(PARK_X - 1.3, 0, STREET_Z + 0.95);
    walkPath(this.tweens, d, [cab, rear], 1.9, () => {
      d.group.rotation.y = Math.PI * 0.5 * 0; // face the shop (+z)
      this.tweens.add(0.7, (p) => d.reach(Math.sin(p * Math.PI)), { done: () => d.reach(0) });
    });
  }

  private unload(lines: number, paid: number) {
    const d = this.driver;
    if (!this.truck || !d) {
      // truck not here yet (fast save): wait for it
      this.later(() => this.unload(lines, paid), 600);
      return;
    }
    this.busy = true;
    const n = Math.max(1, Math.min(6, lines));
    const a = this.room.anchors;

    // crates in the driver's arms
    const stack = new THREE.Group();
    stack.position.set(0, 0.7, 0.32);
    d.group.add(stack);
    const crates: THREE.Object3D[] = [];
    for (let i = 0; i < n; i++) {
      const c = makeGoods(i % 2 ? PAL.crate : goodsColor("crate" + i), 0.26);
      c.position.set(((i % 2) - 0.5) * 0.14, Math.floor(i / 2) * 0.28, 0);
      stack.add(c);
      crates.push(c);
    }
    d.reach(0.5);

    const rear = new THREE.Vector3(PARK_X - 1.3, 0, STREET_Z + 0.95);
    const path = [
      d.group.position.clone(),
      a.curbFar,
      a.curbNear,
      a.door,
      new THREE.Vector3(2.0, 0, 1.1),
      new THREE.Vector3(2.0, 0, -1.2),
    ];
    walkPath(this.tweens, d, path, 2.3, () => {
      // place crates on shelf spots with a hop
      d.reach(0);
      stack.removeFromParent();
      const base = new THREE.Vector3(2.0, 0.75, -1.2);
      crates.forEach((c, i) => {
        const spot = a.shelfSpots[(i * 2 + 1) % a.shelfSpots.length];
        const crate = makeGoods(goodsColor("stock" + i), 0.22);
        crate.position.copy(base);
        this.room.group.add(crate);
        this.tweens.add(
          0.6,
          (p) => {
            crate.position.lerpVectors(base, new THREE.Vector3(spot.x, spot.y - 0.1, -1.75), p);
            crate.position.y += Math.sin(p * Math.PI) * 0.5;
          },
          { delay: i * 0.18, ease: easeInOut, done: () => this.crates.push(crate) },
        );
      });
      this.tweens.add(0.9, (p) => d.reach(Math.sin(p * Math.PI)), { done: () => d.reach(0) });
      this.later(() => {
        this.pay(paid, d);
        walkPath(this.tweens, d, [d.group.position.clone(), new THREE.Vector3(2.0, 0, 1.1), a.door, a.curbNear, a.curbFar, rear], 2.4, () => {
          this.depart();
        });
      }, 700 + n * 180);
    });
  }

  /** Money leaves the till towards the driver, with a floating "−KES". */
  private pay(paid: number, d: Person) {
    if (paid <= 0) return;
    const a = this.room.anchors;
    const from = a.tillTop.clone();
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.018, 18),
        new THREE.MeshStandardMaterial({ color: PAL.warning, emissive: new THREE.Color(PAL.warning), emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.35 }),
      );
      m.position.copy(from);
      this.room.group.add(m);
      this.tweens.add(
        0.8,
        (p) => {
          const to = d.group.position.clone().setY(0.9);
          m.position.lerpVectors(from, to, p);
          m.position.y += Math.sin(p * Math.PI) * 0.5;
          m.rotation.x = p * 6;
        },
        { delay: i * 0.12, ease: easeInOut, done: () => this.room.group.remove(m) },
      );
    }
    const el = document.createElement("div");
    el.className = "world3d-pop out";
    el.textContent = "−" + KES(paid);
    const o = new CSS2DObject(el);
    o.position.copy(from).add(new THREE.Vector3(0, 0.35, 0));
    this.room.group.add(o);
    this.later(() => {
      this.room.group.remove(o);
      el.remove();
    }, 1700);
  }

  private depart() {
    const t = this.truck;
    const d = this.driver;
    this.truck = null;
    this.driver = null;
    this.truckName = null;
    this.busy = false;
    if (d) this.room.group.remove(d.group);
    if (!t) return;
    const from = t.position.x;
    this.tweens.add(2.0, (p) => (t.position.x = from + (9 - from) * p), {
      ease: easeInOut,
      done: () => this.room.group.remove(t),
    });
  }
}
