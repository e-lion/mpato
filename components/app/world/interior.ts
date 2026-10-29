import * as THREE from "three";
import { PAL } from "./palette";
import { makePerson, type Person } from "./people";

/**
 * Cut-away shop interior, built in the shop's local space (front faces +z).
 * Everything the sale/delivery choreography needs is exposed as anchors.
 */
export type Interior = {
  group: THREE.Group;
  shopkeeper: Person;
  till: THREE.Object3D;
  anchors: {
    street: THREE.Vector3; // where customers appear from
    door: THREE.Vector3;
    customer: THREE.Vector3; // standing spot in front of counter
    queue: THREE.Vector3;
    keeper: THREE.Vector3;
    tillTop: THREE.Vector3;
    counterSlots: THREE.Vector3[]; // where bought goods rest on the counter
    shelfSpots: THREE.Vector3[]; // where goods are picked from
    bay: THREE.Vector3; // loading-bay door (right wall) for deliveries
  };
};

const GOODS = ["#e15a3b", "#2f7d6b", "#3b6fb6", "#d9a441", "#8b5cb5", "#c24d7a", "#e8e2d4"];

export function goodsColor(cat?: string) {
  let h = 0;
  for (const c of cat ?? "x") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GOODS[h % GOODS.length];
}

export function makeGoods(color: string, size = 0.2) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(size, size * 1.25, size * 0.8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  );
  box.castShadow = true;
  box.position.y = (size * 1.25) / 2;
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(size * 1.02, size * 0.4, size * 0.82),
    new THREE.MeshStandardMaterial({ color: "#f8f7f4", roughness: 0.8 }),
  );
  label.position.y = size * 0.62;
  g.add(box, label);
  return g;
}

function box(
  w: number,
  h: number,
  d: number,
  color: string,
  pos: [number, number, number],
  rough = 0.85,
  cast = true,
) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: rough }),
  );
  m.position.set(...pos);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

function floorTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = PAL.stone200;
  x.fillRect(0, 0, 128, 128);
  x.fillStyle = PAL.stone100;
  x.fillRect(0, 0, 64, 64);
  x.fillRect(64, 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildInterior(accent: string = PAL.ember): Interior {
  const g = new THREE.Group();

  // floor + forecourt/street
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 4.2),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.9 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.01, -0.1);
  floor.receiveShadow = true;
  g.add(floor);
  const street = box(14, 0.02, 3.6, PAL.stone400, [0, 0.0, 4.4], 1, false);
  street.receiveShadow = true;
  g.add(street);
  const kerb = box(14, 0.08, 0.18, PAL.stone300, [0, 0.04, 2.55], 1, false);
  g.add(kerb);
  for (let i = -3; i <= 3; i++) g.add(box(0.8, 0.012, 0.1, PAL.stone50, [i * 1.7, 0.012, 4.9], 1, false));

  // walls (low cut-away): back, left, right (with loading-bay gap)
  g.add(box(5.4, 2.3, 0.14, PAL.stone100, [0, 1.15, -2.2]));
  g.add(box(0.14, 2.3, 4.4, PAL.stone100, [-2.6, 1.15, 0]));
  g.add(box(0.14, 2.3, 1.3, PAL.stone100, [2.6, 1.15, -1.45]));
  g.add(box(0.14, 2.3, 0.9, PAL.stone100, [2.6, 1.15, 1.65]));
  g.add(box(0.14, 0.5, 1.9, PAL.stone100, [2.6, 2.05, 0.2])); // lintel over bay
  // front wall stubs either side of the door
  g.add(box(1.7, 0.5, 0.14, PAL.stone200, [-1.75, 0.25, 2.0]));
  g.add(box(1.7, 0.5, 0.14, PAL.stone200, [1.75, 0.25, 2.0]));
  // brand stripe + sign on back wall
  g.add(box(5.4, 0.12, 0.16, accent, [0, 2.3, -2.2], 0.6, false));
  g.add(box(2.0, 0.34, 0.1, accent, [0, 1.85, -2.11], 0.55, false));

  // shelving along back wall with stocked goods
  const shelfSpots: THREE.Vector3[] = [];
  for (const sx of [-1.7, 0, 1.7]) {
    g.add(box(1.4, 1.55, 0.36, "#8a6a47", [sx, 0.78, -1.9], 0.9));
    for (const sy of [0.22, 0.66, 1.1, 1.52]) {
      g.add(box(1.4, 0.05, 0.38, "#6d5336", [sx, sy, -1.9], 0.9, false));
    }
    let k = 0;
    for (const sy of [0.25, 0.69, 1.13]) {
      for (let i = -2; i <= 2; i++) {
        const goods = makeGoods(GOODS[(k++ + Math.round(sx * 2)) % GOODS.length], 0.19);
        goods.position.set(sx + i * 0.26, sy, -1.88);
        g.add(goods);
        if (i === 0) shelfSpots.push(new THREE.Vector3(sx + i * 0.26, sy + 0.12, -1.7));
      }
    }
  }

  // counter + till
  const counter = box(2.8, 0.55, 0.7, "#b9855a", [0, 0.275, 0.1], 0.8);
  g.add(counter);
  g.add(box(2.9, 0.06, 0.8, "#e8e2d4", [0, 0.58, 0.1], 0.5, false));
  const till = new THREE.Group();
  till.position.set(-1.0, 0.61, 0.0);
  till.add(box(0.46, 0.16, 0.36, PAL.stone600, [0, 0.08, 0], 0.5));
  const screen = box(0.3, 0.2, 0.04, PAL.stone900, [0, 0.27, -0.1], 0.3, false);
  screen.rotation.x = -0.25;
  till.add(screen);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.14),
    new THREE.MeshStandardMaterial({ color: PAL.mpesa, emissive: new THREE.Color(PAL.mpesa), emissiveIntensity: 0.6 }),
  );
  glow.position.set(0, 0.27, -0.075);
  glow.rotation.x = -0.25;
  till.add(glow);
  g.add(till);

  const counterSlots: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    counterSlots.push(new THREE.Vector3(-0.35 + (i % 4) * 0.34, 0.61, 0.0 + Math.floor(i / 4) * 0.2 + 0.05));
  }

  // loading bay: floor mat + hazard stripe on right wall opening
  g.add(box(1.0, 0.02, 1.8, "#d9a441", [2.1, 0.02, 0.2], 0.9, false));
  g.add(box(0.1, 0.06, 1.9, PAL.stone900, [2.62, 0.03, 0.2], 0.9, false));

  // a plant + queue rope for charm
  const pot = box(0.3, 0.3, 0.3, "#8a6a47", [-2.2, 0.15, 1.5]);
  g.add(pot);
  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 1),
    new THREE.MeshStandardMaterial({ color: "#3f7d4e", roughness: 0.9, flatShading: true }),
  );
  leaves.position.set(-2.2, 0.62, 1.5);
  leaves.castShadow = true;
  g.add(leaves);

  // shopkeeper (the user's avatar) behind the counter
  const keeper = makePerson({ skin: "#a97550", shirt: accent, pants: "#2d3340", hair: "#1c1917" });
  keeper.group.position.set(-0.3, 0, -0.75);
  keeper.walk(0, 0);
  g.add(keeper.group);

  return {
    group: g,
    shopkeeper: keeper,
    till,
    anchors: {
      street: new THREE.Vector3(1.6, 0, 6.6),
      door: new THREE.Vector3(0.5, 0, 2.0),
      customer: new THREE.Vector3(0.45, 0, 1.15),
      queue: new THREE.Vector3(1.0, 0, 1.9),
      keeper: new THREE.Vector3(-0.3, 0, -0.75),
      tillTop: new THREE.Vector3(-1.0, 0.95, 0.0),
      counterSlots,
      shelfSpots,
      bay: new THREE.Vector3(2.6, 0, 0.2),
    },
  };
}
