import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PAL } from "./palette";

/**
 * The streets and blocks around the shops: clean flat-shaded isometric town built from boxes.
 *
 * Geometry is driven by the shop lattice (spacing SP, one shop per cell):
 *   cell      x in [xk-2.4, xk+2.4], z in [zr-2.7, zr+2.15]   (pavement, the shop sits in the middle)
 *   vertical road    x in [xk+2.4, xk+3.6]
 *   horizontal road  z in [zr+2.15, zr+3.3]                   (delivery trucks park on this one)
 * The pavement left around each shop is the walkway the crowd uses (see crowd.ts).
 */

export const ROAD = {
  vHalf: 0.6, // vertical road half width, centred xk + 3
  zNear: 2.15, // horizontal road starts zr + zNear ...
  zFar: 3.3, // ... and ends zr + zFar
};

const PALETTE = {
  road: "#6b665c",
  roadEdge: "#5a554c",
  paint: "#f4f1ea",
  pave: "#e6e2d9",
  paveDark: "#d9d4c8",
  kerb: "#c9c3b5",
  grass: "#b9d2a6",
  grassDark: "#a4c28f",
  leaf: ["#5f9e63", "#4f8c58", "#76ad6a", "#3f7d4e"],
  trunk: "#8a6a47",
  // muted facade tints in the brand's warm family, plus two cool accents so blocks read as varied
  facade: ["#efe6d6", "#e9d8c5", "#f0d9cf", "#e4dccd", "#d9e2e0", "#dfe0ee", "#f3e3b8", "#e8cfc4"],
  roof: ["#c9b9a6", "#b8a898", "#d3b3a6", "#a99c8d"],
  glass: "#9fc4d6",
  stall: ["#ff5a47", "#e2a019", "#18a558", "#3b6fb6", "#8b5cb5"],
};

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

export class Town {
  readonly group = new THREE.Group();
  private mats = new Map<string, THREE.MeshStandardMaterial>();
  private geos = new Map<string, THREE.BufferGeometry>();
  private key = "";

  private mat(color: string, rough = 0.9) {
    const k = color + rough;
    let m = this.mats.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
      this.mats.set(k, m);
    }
    return m;
  }
  private geo(key: string, make: () => THREE.BufferGeometry) {
    let g = this.geos.get(key);
    if (!g) {
      g = make();
      this.geos.set(key, g);
    }
    return g;
  }

  private box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, opts: { cast?: boolean; rough?: number } = {}) {
    const m = new THREE.Mesh(this.geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), this.mat(color, opts.rough));
    m.position.set(x, y, z);
    m.castShadow = opts.cast ?? false;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  setVisible(v: boolean) {
    this.group.visible = v;
  }

  dispose() {
    this.group.children.forEach((c) => (c as THREE.Mesh).geometry?.dispose());
    this.group.clear();
    this.geos.forEach((g) => g.dispose());
    this.mats.forEach((m) => m.dispose());
    this.geos.clear();
    this.mats.clear();
  }

  /** Rebuild for a cols x rows lattice with `sp` spacing. No-op if the footprint is unchanged. */
  build(cols: number, rows: number, sp: number) {
    const key = `${cols}x${rows}x${sp}`;
    if (key === this.key) return;
    this.key = key;
    this.group.children.forEach((c) => (c as THREE.Mesh).geometry?.dispose());
    this.group.clear();

    const xAt = (k: number) => (k - (cols - 1) / 2) * sp;
    const zAt = (r: number) => (r - (rows - 1) / 2) * sp;
    const RING = 2; // blocks of backdrop beyond the shops
    const k0 = -RING, k1 = cols - 1 + RING, r0 = -RING, r1 = rows - 1 + RING;

    // ---- roads (asphalt strips with centre dashes) -------------------------------------
    const xMin = xAt(k0) - 3.6, xMax = xAt(k1) + 3.6;
    const zMin = zAt(r0) - 3.85, zMax = zAt(r1) + 3.3;
    for (let r = r0 - 1; r <= r1; r++) {
      const z = zAt(r) + (ROAD.zNear + ROAD.zFar) / 2;
      this.road((xMin + xMax) / 2, z, xMax - xMin, ROAD.zFar - ROAD.zNear);
      for (let x = xMin + 0.5; x < xMax - 0.4; x += 1.2) {
        // leave the junctions clear of dashes
        const inJunction = Array.from({ length: k1 - k0 + 2 }, (_, i) => xAt(k0 - 1 + i) + 3).some((jx) => Math.abs(x - jx) < 0.85);
        if (!inJunction) this.paint(x, z, 0.55, 0.06);
      }
    }
    for (let k = k0 - 1; k <= k1; k++) {
      const x = xAt(k) + 3;
      this.road(x, (zMin + zMax) / 2, ROAD.vHalf * 2, zMax - zMin);
      for (let z = zMin + 0.5; z < zMax - 0.4; z += 1.2) {
        const inJunction = Array.from({ length: r1 - r0 + 2 }, (_, i) => zAt(r0 - 1 + i) + (ROAD.zNear + ROAD.zFar) / 2).some((jz) => Math.abs(z - jz) < 0.95);
        if (!inJunction) this.paint(x, z, 0.06, 0.55);
      }
    }

    // ---- zebra crossings where the walkways meet the roads -------------------------------
    for (let k = k0 - 1; k <= k1; k++) {
      for (let r = r0 - 1; r <= r1; r++) {
        const jz = zAt(r) + (ROAD.zNear + ROAD.zFar) / 2;
        for (const sx of [xAt(k) + 1.8, xAt(k) + 4.2]) {
          if (sx < xMin || sx > xMax) continue;
          for (let i = -2; i <= 2; i++) this.paint(sx + i * 0.11, jz, 0.06, 0.78); // crossing a horizontal road
        }
      }
    }
    for (let k = k0 - 1; k <= k1; k++) {
      const jx = xAt(k) + 3;
      for (let r = r0; r <= r1; r++) {
        for (const sz of [zAt(r) + 1.7, zAt(r) + 4.05]) {
          if (sz < zMin || sz > zMax) continue;
          for (let i = -2; i <= 2; i++) this.paint(jx, sz + i * 0.11, 0.78, 0.06); // crossing a vertical road
        }
      }
    }

    // ---- blocks ------------------------------------------------------------------------
    for (let k = k0; k <= k1; k++) {
      for (let r = r0; r <= r1; r++) {
        const inner = k >= 0 && k < cols && r >= 0 && r < rows;
        const cx = xAt(k), cz = zAt(r) - 0.275; // block centre (the cell is 4.8 x 4.85)
        const R = rng(k * 7919 + r * 104729 + 17);
        const ring = inner ? 0 : Math.max(Math.abs(k - Math.min(Math.max(k, 0), cols - 1)), Math.abs(r - Math.min(Math.max(r, 0), rows - 1)));
        // pavement plate with a kerb
        this.box(4.9, 0.06, 4.95, PALETTE.kerb, cx, 0.0, cz);
        if (inner) {
          this.box(4.7, 0.07, 4.75, PALETTE.pave, cx, 0.003, cz);
          this.innerProps(xAt(k), zAt(r), R);
        } else if (R() < 0.3) {
          this.park(cx, cz, R);
        } else {
          this.box(4.7, 0.07, 4.75, PALETTE.paveDark, cx, 0.003, cz);
          this.backdrop(cx, cz, ring, R);
        }
      }
    }
    this.bake();
  }

  /**
   * The town is a few thousand tiny boxes; merge them into one mesh per material (and shadow flag)
   * so it costs a handful of draw calls instead, which matters on phones.
   */
  private bake() {
    const buckets = new Map<string, { mat: THREE.Material; cast: boolean; parts: THREE.BufferGeometry[] }>();
    for (const child of this.group.children) {
      const m = child as THREE.Mesh;
      if (!m.isMesh) continue;
      m.updateMatrix();
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrix);
      const flat = g.index ? g.toNonIndexed() : g;
      const mat = m.material as THREE.Material;
      const key = mat.uuid + (m.castShadow ? "c" : "n");
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mat, cast: m.castShadow, parts: [] }));
      b.parts.push(flat);
    }
    this.group.clear();
    for (const b of buckets.values()) {
      const merged = mergeGeometries(b.parts, false);
      b.parts.forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.mat);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  // ---- pieces --------------------------------------------------------------------------

  private road(x: number, z: number, w: number, d: number) {
    const m = new THREE.Mesh(this.geo(`r${w.toFixed(2)}|${d.toFixed(2)}`, () => new THREE.PlaneGeometry(w, d)), this.mat(PALETTE.road, 1));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.004, z);
    m.receiveShadow = true;
    this.group.add(m);
  }

  private paint(x: number, z: number, w: number, d: number) {
    const m = new THREE.Mesh(this.geo(`p${w}|${d}`, () => new THREE.PlaneGeometry(w, d)), this.mat(PALETTE.paint, 1));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.007, z);
    this.group.add(m);
  }

  private tree(x: number, z: number, s: number, R: () => number) {
    this.box(0.1 * s, 0.34 * s, 0.1 * s, PALETTE.trunk, x, 0.2 * s, z);
    const leaf = PALETTE.leaf[Math.floor(R() * PALETTE.leaf.length)];
    const crown = new THREE.Mesh(this.geo("crown", () => new THREE.IcosahedronGeometry(0.3, 0)), this.mat(leaf, 0.95));
    crown.position.set(x, 0.55 * s, z);
    crown.scale.setScalar(s);
    crown.castShadow = true;
    this.group.add(crown);
  }

  private lamp(x: number, z: number) {
    this.box(0.04, 0.78, 0.04, "#4a453c", x, 0.4, z, { cast: true });
    this.box(0.16, 0.05, 0.1, "#4a453c", x, 0.8, z);
    this.box(0.12, 0.03, 0.08, "#fff3c9", x, 0.775, z);
  }

  private bench(x: number, z: number, alongZ: boolean) {
    const w = alongZ ? 0.18 : 0.5, d = alongZ ? 0.5 : 0.18;
    this.box(w, 0.04, d, "#a47b50", x, 0.2, z, { cast: true });
    this.box(alongZ ? 0.05 : 0.5, 0.14, alongZ ? 0.5 : 0.05, "#8a6a47", x + (alongZ ? 0.09 : 0), 0.3, z + (alongZ ? 0 : 0.09));
    this.box(0.04, 0.2, 0.04, "#4a453c", x - (alongZ ? 0 : 0.2), 0.1, z - (alongZ ? 0.2 : 0));
    this.box(0.04, 0.2, 0.04, "#4a453c", x + (alongZ ? 0 : 0.2), 0.1, z + (alongZ ? 0.2 : 0));
  }

  /** Awning-and-crate market stall, the kind you see on any Nairobi pavement. */
  private stall(x: number, z: number, R: () => number) {
    const c = PALETTE.stall[Math.floor(R() * PALETTE.stall.length)];
    this.box(0.5, 0.22, 0.34, "#a47b50", x, 0.13, z, { cast: true });
    for (let i = 0; i < 3; i++) this.box(0.1, 0.07, 0.1, ["#e15a3b", "#e2a019", "#3f7d4e"][i], x - 0.15 + i * 0.15, 0.27, z);
    this.box(0.04, 0.5, 0.04, "#4a453c", x - 0.22, 0.4, z - 0.14);
    this.box(0.04, 0.5, 0.04, "#4a453c", x + 0.22, 0.4, z - 0.14);
    const roof = this.box(0.6, 0.03, 0.42, c, x, 0.66, z - 0.06, { cast: true });
    roof.rotation.x = 0.14;
  }

  private innerProps(xk: number, zr: number, R: () => number) {
    // lamps at the road corner, a tree in the back strip, a bench against the shop wall
    this.lamp(xk + 2.25, zr + 2.0);
    this.lamp(xk - 2.25, zr - 2.5);
    // trees sit at the kerb corners, clear of the walkways the crowd uses
    this.tree(xk - 2.25, zr - 2.45, 0.9 + R() * 0.4, R);
    if (R() < 0.7) this.tree(xk + 2.25, zr - 2.45, 0.8 + R() * 0.4, R);
    if (R() < 0.6) this.bench(xk - 1.45, zr + 0.2, true);
    else this.bench(xk + 1.45, zr - 0.4, true);
    if (R() < 0.45) this.stall(xk + 2.38, zr - 0.7, R);
  }

  private park(cx: number, cz: number, R: () => number) {
    this.box(4.7, 0.07, 4.75, PALETTE.grass, cx, 0.003, cz);
    this.box(1.3, 0.075, 1.3, PALETTE.grassDark, cx + (R() - 0.5) * 1.5, 0.004, cz + (R() - 0.5) * 1.5);
    const n = 3 + Math.floor(R() * 4);
    for (let i = 0; i < n; i++) this.tree(cx + (R() - 0.5) * 3.8, cz + (R() - 0.5) * 3.8, 0.9 + R() * 0.7, R);
    this.bench(cx, cz + 1.9, false);
    if (R() < 0.6) this.stall(cx + 1.6, cz - 1.5, R);
  }

  /** Background buildings: varied footprints and heights, taller and calmer the further out. */
  private backdrop(cx: number, cz: number, ring: number, R: () => number) {
    const n = R() < 0.35 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const w = n === 2 ? 1.9 + R() * 0.4 : 2.6 + R() * 1.4;
      const d = n === 2 ? 1.9 + R() * 0.5 : 2.6 + R() * 1.4;
      const base = ring >= 2 ? 1.8 : 0.9;
      const h = base + R() * (ring >= 2 ? 2.8 : 1.5);
      const x = cx + (n === 2 ? (i ? 1.2 : -1.2) : 0);
      const color = PALETTE.facade[Math.floor(R() * PALETTE.facade.length)];
      this.building(x, cz, w, d, h, color, R);
    }
  }

  private building(x: number, z: number, w: number, d: number, h: number, color: string, R: () => number) {
    this.box(w, h, d, color, x, h / 2 + 0.03, z, { cast: true });
    this.box(w + 0.1, 0.1, d + 0.1, PALETTE.roof[Math.floor(R() * PALETTE.roof.length)], x, h + 0.08, z);
    // rows of windows on the street-facing sides, so it reads as a real building not a block
    const floors = Math.max(1, Math.floor(h / 0.55));
    const cols = Math.max(1, Math.floor(w / 0.55));
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const wx = x - w / 2 + (c + 0.5) * (w / cols);
        this.box(0.2, 0.2, 0.02, PALETTE.glass, wx, 0.35 + f * 0.55, z + d / 2 + 0.005, { rough: 0.3 });
      }
    }
    for (let f = 0; f < floors; f++) {
      const rows = Math.max(1, Math.floor(d / 0.55));
      for (let c = 0; c < rows; c++) {
        const wz = z - d / 2 + (c + 0.5) * (d / rows);
        this.box(0.02, 0.2, 0.2, PALETTE.glass, x + w / 2 + 0.005, 0.35 + f * 0.55, wz, { rough: 0.3 });
      }
    }
    if (R() < 0.4) this.box(0.3, 0.2, 0.3, PALETTE.roof[0], x + (R() - 0.5) * w * 0.5, h + 0.23, z + (R() - 0.5) * d * 0.5); // rooftop unit
  }
}

// kept for callers that want the brand colours the town is built around
export const TOWN_PAL = { ...PALETTE, ember: PAL.ember };
