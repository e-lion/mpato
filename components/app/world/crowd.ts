import * as THREE from "three";
import type { Person } from "./people";

/**
 * Street life for the map view: a small, varied crowd (men, women, children, elders) that strolls
 * the pavements around the shops. They are potential customers, not scripted ones: nobody here
 * heads for a till, and nothing about them depends on sales data.
 */

export type Kind = "man" | "woman" | "boy" | "girl" | "elderMan" | "elderWoman";

const SKINS = ["#f1c9a5", "#d9a47c", "#a97550", "#7a4e33", "#5a3825", "#8d5a3b"];
const SHIRTS = ["#e15a3b", "#2f7d6b", "#3b6fb6", "#d9a441", "#8b5cb5", "#c24d7a", "#4b5563", "#e8e2d4", "#6fa8a0", "#f08a5d"];
const PANTS = ["#2d3340", "#3f4a5c", "#5a4a3a", "#1f2937", "#6b6458", "#3b4a3f"];
const HAIR = ["#1c1917", "#2b1d14", "#3a2a1e", "#1c1917", "#4a3425"];
const GREY = ["#d8d4cc", "#bdb8ae", "#e9e6df"];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(R: () => number, a: T[]) => a[Math.floor(R() * a.length)];

const shared = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.85) {
  const k = color + rough;
  let m = shared.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough });
    shared.set(k, m);
  }
  return m;
}
const geos = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry) {
  let g = geos.get(key);
  if (!g) {
    g = make();
    geos.set(key, g);
  }
  return g;
}
function part(g: THREE.BufferGeometry, m: THREE.Material) {
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true;
  return mesh;
}

type Figure = Person & { speed: number; stepLen: number };

/** One articulated person, shaped and dressed by `kind`. Shapes and materials are shared across the crowd. */
export function makeFigure(kind: Kind, R: () => number): Figure {
  const child = kind === "boy" || kind === "girl";
  const elder = kind === "elderMan" || kind === "elderWoman";
  const female = kind === "woman" || kind === "girl" || kind === "elderWoman";

  const scale = child ? 0.64 + R() * 0.1 : elder ? 0.9 + R() * 0.05 : female ? 0.93 + R() * 0.05 : 0.99 + R() * 0.07;
  const skinC = pick(R, SKINS);
  const shirtC = pick(R, SHIRTS);
  const pantsC = pick(R, PANTS);
  const skin = mat(skinC, 0.7);
  const shirt = mat(shirtC);
  const pants = mat(pantsC);

  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  group.scale.setScalar(scale);

  const tr = female ? 0.135 : 0.15;
  const torso = part(geo(`torso${tr}`, () => new THREE.CapsuleGeometry(tr, 0.3, 6, 12)), shirt);
  torso.position.y = 0.68;
  torso.scale.z = 0.72;
  body.add(torso);

  const head = part(geo("head", () => new THREE.SphereGeometry(0.125, 16, 12)), skin);
  head.position.y = 1.07;
  if (child) head.scale.setScalar(1.22); // bigger head, smaller body: reads as a child at a glance
  body.add(head);

  // hair, hats and scarves
  const hairC = elder ? pick(R, GREY) : pick(R, HAIR);
  const hairM = mat(hairC, 0.9);
  const cap = () => part(geo("hairCap", () => new THREE.SphereGeometry(0.133, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)), hairM);
  if (kind === "man" || kind === "boy" || kind === "elderMan") {
    const bald = kind === "elderMan" && R() < 0.35;
    if (!bald) {
      const h = cap();
      h.position.y = 1.08;
      body.add(h);
    }
    if (kind === "man" && R() < 0.22) {
      const hat = part(geo("capTop", () => new THREE.CylinderGeometry(0.13, 0.14, 0.07, 14)), mat(pick(R, SHIRTS)));
      hat.position.y = 1.2;
      const brim = part(geo("brim", () => new THREE.BoxGeometry(0.2, 0.015, 0.12)), mat(pick(R, SHIRTS)));
      brim.position.set(0, 1.17, 0.12);
      body.add(hat, brim);
    }
  } else {
    const style = child ? "puffs" : pick(R, ["long", "bun", "scarf", "long", "short"]);
    const h = cap();
    h.position.y = 1.08;
    body.add(h);
    if (style === "long") {
      const back = part(geo("hairLong", () => new THREE.CapsuleGeometry(0.1, 0.2, 4, 10)), hairM);
      back.position.set(0, 0.98, -0.07);
      body.add(back);
    } else if (style === "bun") {
      const bun = part(geo("bun", () => new THREE.SphereGeometry(0.06, 10, 8)), hairM);
      bun.position.set(0, 1.22, -0.05);
      body.add(bun);
    } else if (style === "scarf") {
      const sc = part(geo("scarf", () => new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62)), mat(pick(R, SHIRTS)));
      sc.position.y = 1.075;
      body.add(sc);
    } else if (style === "puffs") {
      for (const sx of [-1, 1]) {
        const p = part(geo("puff", () => new THREE.SphereGeometry(0.06, 10, 8)), hairM);
        p.position.set(sx * 0.13, 1.14, 0);
        body.add(p);
      }
    }
  }

  const limb = (len: number, r: number, m: THREE.Material) => {
    const pivot = new THREE.Group();
    const seg = part(geo(`limb${len}|${r}`, () => new THREE.CapsuleGeometry(r, len, 4, 8)), m);
    seg.position.y = -(len / 2 + r);
    pivot.add(seg);
    return pivot;
  };
  const legL = limb(0.28, 0.065, pants);
  const legR = limb(0.28, 0.065, pants);
  legL.position.set(-0.085, 0.44, 0);
  legR.position.set(0.085, 0.44, 0);
  body.add(legL, legR);

  const armL = limb(0.26, 0.05, shirt);
  const armR = limb(0.26, 0.05, shirt);
  armL.position.set(-tr - 0.06, 0.88, 0);
  armR.position.set(tr + 0.06, 0.88, 0);
  body.add(armL, armR);
  for (const arm of [armL, armR]) {
    const hand = part(geo("hand", () => new THREE.SphereGeometry(0.052, 10, 8)), skin);
    hand.position.y = -0.4;
    arm.add(hand);
  }

  // dresses and skirts over the legs
  if (female && (kind === "girl" || R() < 0.6)) {
    const dressM = R() < 0.5 ? shirt : mat(pick(R, SHIRTS));
    const dress = part(geo("dress", () => new THREE.CylinderGeometry(0.12, 0.2, 0.36, 14, 1, true)), dressM);
    dress.position.y = 0.44;
    (dress.material as THREE.Material).side = THREE.DoubleSide;
    body.add(dress);
  }

  // props that tell a small story
  if (child) {
    const bag = part(geo("schoolbag", () => new THREE.BoxGeometry(0.2, 0.26, 0.1)), mat(pick(R, ["#e15a3b", "#3b6fb6", "#d9a441"])));
    bag.position.set(0, 0.72, -0.14);
    body.add(bag);
  } else if (elder) {
    const cane = part(geo("cane", () => new THREE.CylinderGeometry(0.014, 0.014, 0.74, 6)), mat("#6d5336"));
    cane.position.set(0.02, -0.46, 0.04);
    armR.add(cane);
    body.rotation.x = 0.14; // a slight stoop
  } else if (R() < 0.45) {
    const bag = part(geo("shopbag", () => new THREE.BoxGeometry(0.14, 0.18, 0.08)), mat(pick(R, ["#c8863e", "#f8f7f4", "#2f7d6b"])));
    bag.position.set(0, -0.5, 0.02);
    armL.add(bag);
  }

  const speed = child ? 0.85 + R() * 0.25 : elder ? 0.42 + R() * 0.1 : 0.7 + R() * 0.3;
  const stepLen = child ? 0.26 : elder ? 0.22 : 0.34;
  const amp = elder ? 0.4 : child ? 0.85 : 0.7;
  const handLocal = new THREE.Vector3();
  let wave = 0;
  return {
    group,
    handLocal,
    speed,
    stepLen,
    walk(phase, amt) {
      const s = Math.sin(phase) * amt;
      legL.rotation.x = s * amp;
      legR.rotation.x = -s * amp;
      armL.rotation.x = -s * amp * 0.8;
      if (!wave) armR.rotation.x = elder ? 0.22 : s * amp * 0.8;
      body.position.y = Math.abs(Math.cos(phase)) * 0.03 * amt * (child ? 1.3 : 1);
      body.rotation.z = s * 0.03;
    },
    reach(v) {
      wave = v;
      armR.rotation.x = -v * 1.6;
      armR.rotation.z = -v * 0.15;
    },
  };
}

// ---- behaviour --------------------------------------------------------------------------

type Walker = {
  fig: Figure;
  kind: Kind;
  pos: THREE.Vector3;
  ix: number;
  iz: number;
  tx: number;
  tz: number;
  dx: number;
  dz: number;
  idle: number;
  idleKind: "stand" | "chat";
  dist: number;
  wavePhase: number;
  leader: Walker | null;
  side: number;
  speed: number;
  yaw: number;
  stuck: number;
};

export type CrowdLines = { xs: number[]; zs: number[] };

export class Crowd {
  readonly group = new THREE.Group();
  private walkers: Walker[] = [];
  private xs: number[] = [];
  private zs: number[] = [];
  private R = rng(20260);
  private blocked: (x: number, z: number) => boolean = () => false;
  private frozen = false;

  setBlocker(fn: (x: number, z: number) => boolean) {
    this.blocked = fn;
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }
  get active() {
    return this.group.visible && !this.frozen && this.walkers.length > 0;
  }
  /** Reduced-motion: keep people in place rather than animating them. */
  freeze(v: boolean) {
    this.frozen = v;
  }

  /** (Re)populate on the pavement grid; `count` is the number of people, in small groups. */
  configure(lines: CrowdLines, count: number) {
    this.clear();
    this.xs = lines.xs;
    this.zs = lines.zs;
    if (!this.xs.length || !this.zs.length) return;
    const R = this.R;
    while (this.walkers.length < count) {
      const roll = R();
      const left = count - this.walkers.length;
      if (roll < 0.5 || left < 2) this.spawn(pick(R, ["man", "woman", "man", "woman", "elderMan", "elderWoman"] as Kind[]), null);
      else if (roll < 0.75) {
        // parent with a child
        const parent = this.spawn(pick(R, ["man", "woman", "woman"] as Kind[]), null);
        this.spawn(pick(R, ["boy", "girl"] as Kind[]), parent);
      } else {
        // two friends strolling and chatting
        const a = this.spawn(pick(R, ["man", "woman"] as Kind[]), null);
        this.spawn(pick(R, ["man", "woman"] as Kind[]), a);
      }
    }
  }

  private clear() {
    for (const w of this.walkers) this.group.remove(w.fig.group);
    this.walkers = [];
  }

  dispose() {
    this.clear();
    this.group.clear();
  }

  private spawn(kind: Kind, leader: Walker | null): Walker {
    const R = this.R;
    const fig = makeFigure(kind, R);
    const ix = leader ? leader.ix : Math.floor(R() * this.xs.length);
    const iz = leader ? leader.iz : Math.floor(R() * this.zs.length);
    const w: Walker = {
      fig,
      kind,
      pos: leader ? leader.pos.clone() : new THREE.Vector3(this.xs[ix], 0.04, this.zs[iz]),
      ix,
      iz,
      tx: ix,
      tz: iz,
      dx: 0,
      dz: 0,
      idle: R() * 4,
      idleKind: "stand",
      dist: R() * 10,
      wavePhase: 0,
      leader,
      side: leader ? (R() < 0.5 ? -1 : 1) * 0.3 : 0,
      speed: fig.speed,
      yaw: R() * Math.PI * 2,
      stuck: 0,
    };
    if (leader) {
      w.dx = leader.dx;
      w.dz = leader.dz;
      w.pos.x += w.side;
      w.pos.z -= 0.3;
    } else this.pickNext(w);
    fig.group.position.copy(w.pos);
    fig.group.rotation.y = w.yaw;
    this.group.add(fig.group);
    this.walkers.push(w);
    return w;
  }

  /** Choose the next pavement node: mostly keep going, sometimes turn, rarely turn back. */
  private pickNext(w: Walker) {
    const R = this.R;
    const opts: { ix: number; iz: number; wgt: number; dx: number; dz: number }[] = [];
    const add = (dix: number, diz: number) => {
      const ix = w.ix + dix, iz = w.iz + diz;
      if (ix < 0 || ix >= this.xs.length || iz < 0 || iz >= this.zs.length) return;
      const same = dix === Math.sign(w.dx) && diz === Math.sign(w.dz) && (w.dx || w.dz);
      const back = dix === -Math.sign(w.dx) && diz === -Math.sign(w.dz) && (w.dx || w.dz);
      opts.push({ ix, iz, wgt: same ? 4 : back ? 0.15 : 1.2, dx: dix, dz: diz });
    };
    add(1, 0); add(-1, 0); add(0, 1); add(0, -1);
    if (!opts.length) return;
    let total = opts.reduce((n, o) => n + o.wgt, 0);
    let r = R() * total;
    let chosen = opts[0];
    for (const o of opts) {
      r -= o.wgt;
      if (r <= 0) { chosen = o; break; }
    }
    w.tx = chosen.ix;
    w.tz = chosen.iz;
    w.dx = chosen.dx;
    w.dz = chosen.dz;
    total = 0;
  }

  update(dt: number) {
    if (!this.active) return;
    const R = this.R;
    // leaders first so followers read this frame's positions
    for (const w of this.walkers) if (!w.leader) this.stepLeader(w, dt, R);
    for (const w of this.walkers) if (w.leader) this.stepFollower(w, dt);
  }

  private face(w: Walker, tx: number, tz: number, dt: number) {
    const target = Math.atan2(tx - w.pos.x, tz - w.pos.z);
    let d = target - w.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    w.yaw += d * Math.min(1, dt * 7);
    w.fig.group.rotation.y = w.yaw;
  }

  private stepLeader(w: Walker, dt: number, R: () => number) {
    if (w.idle > 0) {
      w.idle -= dt;
      w.fig.walk(0, 0);
      // a little wave or gesture while standing about
      if (w.idleKind === "chat") {
        w.wavePhase += dt * 4;
        w.fig.reach(Math.max(0, Math.sin(w.wavePhase)) * 0.55);
      }
      if (w.idle <= 0) w.fig.reach(0);
      return;
    }
    const gx = this.xs[w.tx], gz = this.zs[w.tz];
    const ex = gx - w.pos.x, ez = gz - w.pos.z;
    const len = Math.hypot(ex, ez);
    if (len < 0.05) {
      // arrived at a node: maybe linger, then pick where to go next
      w.pos.x = gx;
      w.pos.z = gz;
      w.ix = w.tx;
      w.iz = w.tz;
      if (R() < 0.2) {
        w.idle = 2 + R() * 6;
        w.idleKind = R() < 0.5 ? "chat" : "stand";
        w.wavePhase = 0;
      }
      this.pickNext(w);
      return;
    }
    const step = w.speed * dt;
    const nx = w.pos.x + (ex / len) * Math.min(step, len);
    const nz = w.pos.z + (ez / len) * Math.min(step, len);
    // wait for a delivery truck to pass rather than walking through it
    const truck = this.blocked(w.pos.x + (ex / len) * 0.5, w.pos.z + (ez / len) * 0.5);
    // after a couple of seconds of mutual standoff, ignore personal space so two people never lock up
    if (truck || (w.stuck < 2 && this.crowded(w, nx, nz))) {
      if (!truck) w.stuck += dt;
      w.fig.walk(0, 0);
      return;
    }
    w.stuck = 0;
    w.pos.x = nx;
    w.pos.z = nz;
    w.dist += step;
    this.face(w, gx, gz, dt);
    w.fig.walk(w.dist / w.fig.stepLen, 1);
    w.fig.group.position.copy(w.pos);
  }

  private stepFollower(w: Walker, dt: number) {
    const L = w.leader!;
    // stay a little behind and to one side of the leader; stand when they stand
    const back = 0.4;
    const fx = L.pos.x - Math.sin(L.yaw) * back + Math.cos(L.yaw) * w.side;
    const fz = L.pos.z - Math.cos(L.yaw) * back - Math.sin(L.yaw) * w.side;
    const ex = fx - w.pos.x, ez = fz - w.pos.z;
    const len = Math.hypot(ex, ez);
    if (len < 0.06) {
      w.fig.walk(0, 0);
      if (L.idle > 0) {
        // chat back and forth with whoever they're with
        w.wavePhase += dt * 3;
        w.fig.reach(L.idleKind === "chat" ? Math.max(0, Math.sin(w.wavePhase + 1.5)) * 0.5 : 0);
        w.yaw += Math.atan2(Math.sin(L.yaw - w.yaw), Math.cos(L.yaw - w.yaw)) * Math.min(1, dt * 4);
        w.fig.group.rotation.y = w.yaw;
      }
      return;
    }
    const step = Math.min(len, Math.max(w.speed, L.speed) * 1.25 * dt);
    w.pos.x += (ex / len) * step;
    w.pos.z += (ez / len) * step;
    w.dist += step;
    this.face(w, fx, fz, dt);
    w.fig.walk(w.dist / w.fig.stepLen, Math.min(1, len * 4));
    w.fig.group.position.copy(w.pos);
  }

  /** Soft personal space: don't walk into someone standing right in front. */
  private crowded(w: Walker, nx: number, nz: number) {
    for (const o of this.walkers) {
      if (o === w || o.leader === w || w.leader === o) continue;
      const dx = o.pos.x - nx, dz = o.pos.z - nz;
      if (dx * dx + dz * dz < 0.12) {
        // only yield to someone ahead of us, so two people never lock up facing each other
        const ahead = (o.pos.x - w.pos.x) * Math.sin(w.yaw) + (o.pos.z - w.pos.z) * Math.cos(w.yaw) > 0;
        if (ahead && w.speed <= o.speed + 0.2) return true;
      }
    }
    return false;
  }
}
