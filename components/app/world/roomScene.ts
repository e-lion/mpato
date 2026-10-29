import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PAL } from "./palette";
import { KES } from "@/lib/format";
import { goodsColor, makeGoods, type Interior } from "./interior";
import { makePerson, randomLook, type Person } from "./people";
import { Tweens, easeInOut, easeOut } from "./tween";
import { walkPath } from "./walk";
import type { RoomSceneEvent } from "./bus";

const BOARD_X = -1.75;
const BOARD_Z = 1.4;
const BAR_W = 0.16;
const BAR_GAP = 0.07;
const BAR_MAX = 1.15;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Choreography for the dashboard, inventory and customers rooms. Like the sale
 * and delivery scenes, nothing moves until the user does something in the
 * drawer: pick a day, pick a product, pick a customer.
 */
export class RoomScene {
  private board: { group: THREE.Group; bars: THREE.Mesh[]; labels: CSS2DObject[] } | null = null;
  private held: { goods: THREE.Object3D; from: THREE.Vector3; tag: CSS2DObject } | null = null;
  private flags: THREE.Object3D[] = [];
  private guest: { person: Person; tag: CSS2DObject; stop: () => void } | null = null;
  private keeperAt: THREE.Vector3 | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private room: Interior,
    private tweens: Tweens,
    private dirty: () => void,
  ) {}

  handle(e: RoomSceneEvent) {
    switch (e.type) {
      case "board":
        this.showBoard(e.values, e.labels);
        break;
      case "boardHi":
        this.highlight(e.index);
        break;
      case "shelf":
        this.fetch(e.name, e.cat, e.stock, e.low);
        break;
      case "shelfClear":
        this.putBack();
        break;
      case "shelfAdded":
        this.drop(e.cat);
        break;
      case "lowStock":
        this.setFlags(e.count);
        break;
      case "visit":
        this.visit(e.name, e.tag, e.spent);
        break;
      case "visitEnd":
        this.sendOff();
        break;
      case "clearAll":
        this.clearAll();
        break;
    }
    this.dirty();
  }

  dispose() {
    for (const t of this.timers) clearTimeout(t);
    const guest = this.guest;
    this.guest = null;
    guest?.stop();
    for (const o of [this.held?.tag, ...(this.board?.labels ?? []), guest?.tag]) {
      o?.element.remove();
    }
  }

  private clearAll() {
    if (this.board) {
      this.room.group.remove(this.board.group);
      this.board.labels.forEach((l) => l.element.remove());
      this.board = null;
    }
    this.putBack(true);
    this.setFlags(0);
    this.sendOff(true);
    // keeper back to the till if they were mid-fetch
    if (this.keeperAt) {
      const k = this.room.shopkeeper;
      k.group.position.copy(this.room.anchors.keeper);
      k.group.rotation.y = 0;
      k.reach(0);
      this.keeperAt = null;
    }
  }

  private later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  private label(text: string, cls = "world3d-label") {
    const el = document.createElement("div");
    el.className = cls;
    el.innerHTML = text;
    return new CSS2DObject(el);
  }

  private face(person: Person, yaw: number, dur = 0.4) {
    const from = person.group.rotation.y;
    let d = yaw - from;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.tweens.add(dur, (p) => (person.group.rotation.y = from + d * p), { ease: easeInOut });
  }

  // ---- dashboard: the week as a bar board -------------------------------

  private showBoard(values: number[], labels: string[]) {
    if (this.board) {
      this.room.group.remove(this.board.group);
      this.board.labels.forEach((l) => l.element.remove());
    }
    const group = new THREE.Group();
    const n = values.length;
    const width = n * (BAR_W + BAR_GAP) + 0.12;
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.05, 0.42),
      new THREE.MeshStandardMaterial({ color: PAL.stone300, roughness: 0.8 }),
    );
    plate.position.set(BOARD_X + (width - 0.12) / 2 - BAR_W / 2, 0.025, BOARD_Z);
    plate.receiveShadow = true;
    group.add(plate);

    const max = Math.max(1, ...values);
    const bars: THREE.Mesh[] = [];
    const tags: CSS2DObject[] = [];
    values.forEach((v, i) => {
      const today = i === n - 1;
      const h = Math.max(0.06, (v / max) * BAR_MAX);
      const mat = new THREE.MeshStandardMaterial({
        color: today ? PAL.ember : PAL.mpesa,
        roughness: 0.55,
        emissive: new THREE.Color(today ? PAL.ember : PAL.mpesa),
        emissiveIntensity: 0,
      });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(BAR_W, 1, BAR_W), mat);
      bar.castShadow = true;
      const x = BOARD_X + i * (BAR_W + BAR_GAP);
      bar.position.set(x, 0.05, BOARD_Z);
      bar.scale.y = 0.001;
      bar.userData.h = h;
      group.add(bar);
      bars.push(bar);
      // bars rise one after another so the week "plays" left to right
      this.tweens.add(
        0.7,
        (p) => {
          bar.scale.y = Math.max(0.001, h * p);
          bar.position.y = 0.05 + (h * p) / 2;
        },
        { delay: i * 0.09, ease: easeOut },
      );
      const tag = this.label(`<span class="nm">${labels[i] ?? ""}</span>`, "world3d-tick");
      tag.position.set(x, 0.0, BOARD_Z + 0.3);
      group.add(tag);
      tags.push(tag);
    });
    this.room.group.add(group);
    this.board = { group, bars, labels: tags };
  }

  private highlight(index: number | null) {
    const b = this.board;
    if (!b) return;
    b.bars.forEach((bar, i) => {
      const on = i === index;
      const mat = bar.material as THREE.MeshStandardMaterial;
      const from = mat.emissiveIntensity;
      const to = on ? 0.7 : 0;
      this.tweens.add(0.25, (p) => (mat.emissiveIntensity = from + (to - from) * p));
      const sx = bar.scale.x;
      const tx = on ? 1.35 : 1;
      this.tweens.add(0.25, (p) => {
        bar.scale.x = sx + (tx - sx) * p;
        bar.scale.z = bar.scale.x;
      });
    });
  }

  // ---- inventory: fetch from the shelf ----------------------------------

  private shelfSpot(name: string) {
    const spots = this.room.anchors.shelfSpots;
    return spots[hash(name) % spots.length];
  }

  private fetch(name: string, cat: string | undefined, stock: number, low: boolean) {
    this.putBack(true);
    const keeper = this.room.shopkeeper;
    const spot = this.shelfSpot(name);
    const stand = new THREE.Vector3(spot.x, 0, -1.2);
    const start = keeper.group.position.clone();
    const goods = makeGoods(goodsColor(cat), 0.26);
    goods.position.set(spot.x, spot.y - 0.12, -1.74);
    this.room.group.add(goods);
    const tag = this.label(
      `<span class="nm">${name}</span><span class="kv">${stock === 0 ? "Out of stock" : stock + " left"}${low && stock > 0 ? " (low)" : ""}</span>`,
      "world3d-label" + (low ? " active" : ""),
    );
    this.room.group.add(tag);
    tag.position.set(spot.x, spot.y + 0.9, -1.5);
    const rec = { goods, from: new THREE.Vector3(spot.x, spot.y - 0.12, -1.74), tag };
    this.held = rec;
    this.keeperAt = stand;
    walkPath(this.tweens, keeper, [start, new THREE.Vector3(start.x, 0, -1.2), stand], 2.2, () => {
      this.face(keeper, Math.PI);
      this.tweens.add(0.5, (p) => keeper.reach(p * 0.9), { ease: easeOut });
      const up = new THREE.Vector3(spot.x, 1.5, -1.25);
      this.tweens.add(
        0.6,
        (p) => {
          goods.position.lerpVectors(rec.from, up, p);
          goods.rotation.y = p * Math.PI * 2;
        },
        { ease: easeInOut },
      );
      tag.position.set(spot.x, 2.1, -1.25);
      this.dirty();
    });
  }

  private putBack(quick = false) {
    const h = this.held;
    if (!h) return;
    this.held = null;
    const keeper = this.room.shopkeeper;
    const from = h.goods.position.clone();
    h.tag.element.remove();
    this.room.group.remove(h.tag);
    this.tweens.add(
      quick ? 0.01 : 0.45,
      (p) => {
        h.goods.position.lerpVectors(from, h.from, p);
        keeper.reach(0.9 * (1 - p));
      },
      { done: () => this.room.group.remove(h.goods) },
    );
    if (!quick && this.keeperAt) {
      const home = this.room.anchors.keeper.clone();
      const at = this.keeperAt;
      this.keeperAt = null;
      this.later(() => {
        walkPath(this.tweens, keeper, [at.clone(), new THREE.Vector3(home.x, 0, -1.2), home], 2.2, () =>
          this.face(keeper, 0),
        );
        this.dirty();
      }, 450);
    }
  }

  private drop(cat?: string) {
    const spot = this.room.anchors.shelfSpots[Math.floor(Math.random() * this.room.anchors.shelfSpots.length)];
    const goods = makeGoods(goodsColor(cat), 0.24);
    const to = new THREE.Vector3(spot.x, spot.y - 0.12, -1.74);
    this.room.group.add(goods);
    this.tweens.add(
      0.7,
      (p) => {
        goods.position.set(to.x, to.y + (1 - easeOut(p)) * 2.2 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.12 * (1 - p), to.z);
        goods.scale.setScalar(0.4 + 0.6 * p);
      },
      { done: () => this.sparkle(to.clone().add(new THREE.Vector3(0, 0.25, 0.3))) },
    );
  }

  private sparkle(at: THREE.Vector3, color: string = PAL.warning) {
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 1 }),
      );
      s.position.copy(at);
      this.room.group.add(s);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add(
        0.7,
        (p) => {
          s.position.set(at.x + Math.cos(a) * 0.5 * p, at.y + Math.sin(p * Math.PI) * 0.4, at.z + Math.sin(a) * 0.3 * p);
          s.scale.setScalar(1 - p);
        },
        { done: () => this.room.group.remove(s) },
      );
    }
    this.dirty();
  }

  private setFlags(count: number) {
    for (const f of this.flags) this.room.group.remove(f);
    this.flags = [];
    const xs = [-2.4, -0.85, 0.85, 2.4].slice(0, Math.min(4, count));
    xs.forEach((x, i) => {
      const f = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.03), new THREE.MeshStandardMaterial({ color: PAL.stone900 }));
      pole.position.y = 0.25;
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.16, 0.02),
        new THREE.MeshStandardMaterial({ color: PAL.ember, emissive: new THREE.Color(PAL.ember), emissiveIntensity: 0.4 }),
      );
      cloth.position.set(0.14, 0.42, 0);
      f.add(pole, cloth);
      f.position.set(x, 1.68, -1.9);
      f.scale.setScalar(0.001);
      this.room.group.add(f);
      this.flags.push(f);
      this.tweens.add(0.45, (p) => f.scale.setScalar(Math.max(0.001, p)), { delay: i * 0.12, ease: easeOut });
    });
  }

  // ---- customers: a regular drops in ------------------------------------

  private visit(name: string, tag: string, spent: number) {
    this.sendOff(true);
    const look = randomLook();
    const person = makePerson(look);
    this.room.group.add(person.group);
    const a = this.room.anchors;
    const label = this.label(
      `<span class="nm">${name}</span><span class="kv">${tag}, ${KES(spent)} spent</span>`,
      "world3d-label active",
    );
    label.position.set(0, 2.05, 0);
    person.group.add(label);
    const g = { person, tag: label, stop: () => {} };
    this.guest = g;
    const keeper = this.room.shopkeeper;
    g.stop = walkPath(this.tweens, person, [a.street, a.curbFar, a.curbNear, a.door, a.customer], 2.6, () => {
      this.face(person, Math.PI);
      this.face(keeper, 0);
      this.tweens.add(0.9, (p) => {
        person.reach(Math.sin(p * Math.PI));
        keeper.reach(Math.sin(p * Math.PI) * 0.8);
      }, { done: () => { person.reach(0); keeper.reach(0); } });
      if (tag === "VIP") this.sparkle(a.customer.clone().add(new THREE.Vector3(0, 1.9, 0)), PAL.warning);
      this.dirty();
    });
  }

  private sendOff(quick = false) {
    const g = this.guest;
    if (!g) return;
    this.guest = null;
    g.stop();
    g.tag.element.remove();
    const a = this.room.anchors;
    const p = g.person;
    walkPath(this.tweens, p, [p.group.position.clone(), a.door, a.curbNear, a.curbFar, a.street.clone().setX(-1.6)], quick ? 4 : 2.6, () =>
      this.room.group.remove(p.group),
    );
    this.dirty();
  }
}
