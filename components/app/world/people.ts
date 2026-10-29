import * as THREE from "three";

/**
 * Articulated procedural person: hips/shoulders are pivots so legs and arms
 * swing. This is the stand-in rig until CC0 glTF characters are dropped into
 * public/models (assets.ts will prefer those when present).
 */
export type Person = {
  group: THREE.Group;
  /** Animate a walk cycle. phase in radians, amt 0 (idle) .. 1 (full stride). */
  walk: (phase: number, amt: number) => void;
  /** Raise the right arm forward/up: 0 = down, 1 = held out to hand something over. */
  reach: (v: number) => void;
  /** World-ish position (in the person's parent space) of the right hand. */
  handLocal: THREE.Vector3;
};

const SKINS = ["#f1c9a5", "#d9a47c", "#a97550", "#7a4e33", "#5a3825"];
const SHIRTS = ["#e15a3b", "#2f7d6b", "#3b6fb6", "#d9a441", "#8b5cb5", "#4b5563", "#c24d7a"];

export function randomLook() {
  const r = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return { skin: r(SKINS), shirt: r(SHIRTS), pants: "#2d3340", hair: "#1c1917" };
}

function mat(color: string, rough = 0.85) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough });
}

function part(geo: THREE.BufferGeometry, m: THREE.Material) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makePerson(look: {
  skin: string;
  shirt: string;
  pants?: string;
  hair?: string;
}): Person {
  const group = new THREE.Group();
  const skin = mat(look.skin, 0.7);
  const shirt = mat(look.shirt);
  const pants = mat(look.pants ?? "#2d3340");

  const body = new THREE.Group();
  group.add(body);

  const torso = part(new THREE.CapsuleGeometry(0.15, 0.3, 6, 14), shirt);
  torso.position.y = 0.68;
  torso.scale.z = 0.72;
  body.add(torso);

  const head = part(new THREE.SphereGeometry(0.125, 20, 16), skin);
  head.position.y = 1.07;
  body.add(head);
  const hair = part(
    new THREE.SphereGeometry(0.133, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    mat(look.hair ?? "#1c1917", 0.9),
  );
  hair.position.y = 1.08;
  body.add(hair);

  const limb = (len: number, r: number, m: THREE.Material) => {
    const pivot = new THREE.Group();
    const seg = part(new THREE.CapsuleGeometry(r, len, 4, 10), m);
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
  armL.position.set(-0.21, 0.88, 0);
  armR.position.set(0.21, 0.88, 0);
  body.add(armL, armR);
  for (const arm of [armL, armR]) {
    const hand = part(new THREE.SphereGeometry(0.052, 12, 10), skin);
    hand.position.y = -0.4;
    arm.add(hand);
  }

  const handLocal = new THREE.Vector3();
  return {
    group,
    handLocal,
    walk(phase, amt) {
      const s = Math.sin(phase) * amt;
      legL.rotation.x = s * 0.75;
      legR.rotation.x = -s * 0.75;
      armL.rotation.x = -s * 0.6;
      armR.rotation.x = s * 0.6;
      body.position.y = Math.abs(Math.cos(phase)) * 0.035 * amt;
      body.rotation.z = s * 0.03;
    },
    reach(v) {
      armR.rotation.x = -v * 1.35;
      armR.rotation.z = -v * 0.12;
      // approx hand position relative to the group origin when reaching
      handLocal.set(0.21, 0.88 - 0.4 * Math.cos(v * 1.35), 0.4 * Math.sin(v * 1.35));
    },
  };
}
