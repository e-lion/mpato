import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { getCharacter, type CharacterTemplate } from "./assets";
import { KENNEY, available, kenneyModel } from "./kenney";

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
  /** Per-frame update for rigged people (mixer). Procedural people don't need it. */
  update?: (dt: number) => void;
};

const live = new Set<Person>();
/** Advance every rigged person that's still in the scene. Returns true while any are animating. */
export function updatePeople(dt: number) {
  let any = false;
  for (const p of live) {
    if (!p.group.parent) { live.delete(p); continue; }
    p.update?.(dt);
    any = true;
  }
  return any;
}

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

/** Rigged glTF character when public/models/character.glb has loaded, else the procedural one. */
export function makePerson(look: {
  skin: string;
  shirt: string;
  pants?: string;
  hair?: string;
}): Person {
  // the Kenney characters give the whole world one consistent, friendly look
  const names = available(KENNEY.characters);
  if (names.length) {
    const p = makeKenneyPerson(names[Math.floor(Math.random() * names.length)], { height: 1.1 });
    if (p) return p;
  }
  const tpl = getCharacter();
  if (tpl) {
    try {
      return makeRiggedPerson(tpl, look.shirt);
    } catch {
      /* fall through to procedural */
    }
  }
  return makeProceduralPerson(look);
}

function makeRiggedPerson(tpl: CharacterTemplate, shirt: string): Person {
  const group = new THREE.Group();
  const model = cloneSkinned(tpl.scene) as THREE.Group;
  model.scale.multiplyScalar(1.15 / tpl.height); // shop is built at toy scale; normalise body height
  group.add(model);

  // Tint the body surface per person; give each person their own materials.
  const body = new THREE.Color(shirt);
  model.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !tpl.tintable) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const own = mats.map((mat) => {
      const c = (mat as THREE.MeshStandardMaterial).clone();
      if (/highlimbs|surface/i.test(c.name)) {
        c.color.copy(body);
        c.metalness = 0.15;
        c.roughness = 0.55;
      }
      return c;
    });
    m.material = Array.isArray(m.material) ? own : own[0];
  });

  if (!tpl.tintable) {
    // Textured bodies can't be recoloured, so vary height and give each a slight colour cast.
    model.scale.multiplyScalar(0.94 + Math.random() * 0.12);
    const cast = new THREE.Color(["#ffffff", "#f3e9dc", "#e6eefc", "#fbe6e6", "#e8f5e6"][Math.floor(Math.random() * 5)]);
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const own = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
        const c = (mat as THREE.MeshStandardMaterial).clone();
        c.color.multiply(cast);
        return c;
      });
      m.material = Array.isArray(m.material) ? own : own[0];
    });
    return makePosedPerson(group, model);
  }

  const mixer = new THREE.AnimationMixer(model);
  const find = (re: RegExp) => tpl.clips.find((c) => re.test(c.name));
  const idleClip = find(/idle/i);
  const walkClip = find(/^walk$/i) ?? find(/walk/i);
  const idle = idleClip ? mixer.clipAction(idleClip) : null;
  const walk = walkClip ? mixer.clipAction(walkClip) : null;
  idle?.play();
  walk?.play();
  if (walk) walk.timeScale = 2.8; // matches the shop's walking speed (~2.4 units/s)
  if (idle) idle.time = Math.random() * idle.getClip().duration;
  let amt = 0;
  const setAmt = (a: number) => {
    amt = a;
    if (walk) walk.weight = a;
    if (idle) idle.weight = 1 - a;
  };
  setAmt(0);

  // Right arm override for hand-overs / waving, applied after the mixer each frame.
  const arm = model.getObjectByName("mixamorigRightArm") ?? model.getObjectByName("RightArm");
  const fore = model.getObjectByName("mixamorigRightForeArm") ?? model.getObjectByName("RightForeArm");
  const armQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -1.35)); // raise forward
  const foreQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.5));
  let reachV = 0;

  const handLocal = new THREE.Vector3();
  const person: Person = {
    group,
    handLocal,
    walk: (_phase, a) => setAmt(a),
    reach: (v) => {
      reachV = v;
      handLocal.set(0.21, 0.95, 0.15 + 0.3 * v);
    },
    update: (dt) => {
      mixer.update(dt);
      if (reachV > 0.001 && arm) {
        arm.quaternion.slerp(arm.quaternion.clone().multiply(armQ), reachV);
        if (fore) fore.quaternion.slerp(fore.quaternion.clone().multiply(foreQ), reachV);
      }
      void amt;
    },
  };
  live.add(person);
  return person;
}

export function makeProceduralPerson(look: {
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

/**
 * Poses a textured Mixamo body by driving its bones directly. These bodies ship in a
 * T-pose with no walk/idle clips of their own, so: arms down, legs and arms swing while
 * walking, and the right arm can reach forward for hand-overs. Rotations are defined in
 * the model's own space (y up, +z forward), so they survive the person turning in the shop.
 */
function makePosedPerson(group: THREE.Group, model: THREE.Group): Person {
  model.updateWorldMatrix(true, true);
  const bone = (n: string) => model.getObjectByName("mixamorig" + n) ?? model.getObjectByName("mixamorig:" + n) ?? null;

  const qInModel = (o: THREE.Object3D) => {
    const q = new THREE.Quaternion();
    for (let n: THREE.Object3D | null = o; n && n !== model; n = n.parent) q.premultiply(n.quaternion);
    return q;
  };
  const posInModel = (o: THREE.Object3D) => model.worldToLocal(o.getWorldPosition(new THREE.Vector3()));

  type Joint = { b: THREE.Object3D; rest: THREE.Quaternion; dir: THREE.Vector3 | null };
  const joint = (name: string, childName?: string): Joint | null => {
    const b = bone(name);
    if (!b) return null;
    const c = childName ? bone(childName) : null;
    const dir = c ? posInModel(c).sub(posInModel(b)).normalize() : null;
    return { b, rest: qInModel(b), dir };
  };

  const lArm = joint("LeftArm", "LeftForeArm");
  const rArm = joint("RightArm", "RightForeArm");
  const lUp = joint("LeftUpLeg");
  const rUp = joint("RightUpLeg");
  const lKnee = joint("LeftLeg");
  const rKnee = joint("RightLeg");
  const spine = joint("Spine");

  // Apply a model-space rotation `delta` on top of a joint's rest orientation.
  const apply = (j: Joint | null, delta: THREE.Quaternion) => {
    if (!j) return;
    const parent = j.b.parent ? qInModel(j.b.parent) : new THREE.Quaternion();
    j.b.quaternion.copy(parent.invert().multiply(delta.multiply(j.rest)));
    j.b.updateMatrix();
  };
  const pointArm = (j: Joint | null, target: THREE.Vector3) => {
    if (!j?.dir) return;
    apply(j, new THREE.Quaternion().setFromUnitVectors(j.dir, target.normalize()));
  };
  const rotX = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a);

  const outL = lArm?.dir ? Math.sign(lArm.dir.x) || -1 : -1;
  const outR = rArm?.dir ? Math.sign(rArm.dir.x) || 1 : 1;

  let amt = 0;
  let phase = Math.random() * 6;
  let time = Math.random() * 10;
  let reachV = 0;
  const tmp = new THREE.Vector3();

  const handLocal = new THREE.Vector3();
  const person: Person = {
    group,
    handLocal,
    walk: (_p, a) => {
      amt = a;
    },
    reach: (v) => {
      reachV = v;
      handLocal.set(0.21, 0.95, 0.15 + 0.3 * v);
    },
    update: (dt) => {
      time += dt;
      phase += dt * 9 * amt;
      const s = Math.sin(phase) * amt;
      const sway = Math.sin(time * 1.6) * 0.025 * (1 - amt);

      // legs: thigh swings (forward = negative about +x), knee flexes backwards
      apply(lUp, rotX(-s * 0.55));
      apply(rUp, rotX(s * 0.55));
      apply(lKnee, rotX(Math.max(0, Math.cos(phase)) * 0.7 * amt));
      apply(rKnee, rotX(Math.max(0, -Math.cos(phase)) * 0.7 * amt));
      apply(spine, rotX(sway));

      // arms: hang down, counter-swing against the legs
      pointArm(lArm, tmp.set(outL * 0.1, -1, s * 0.4 + sway));
      const r = reachV;
      pointArm(rArm, tmp.set(outR * 0.1 * (1 - r), -1 * (1 - r) - 0.15 * r, -s * 0.4 * (1 - r) + 1.0 * r + sway));
    },
  };
  person.update?.(0);
  live.add(person);
  return person;
}


/**
 * A Kenney mini character: rigged and animated (idle/walk blend), standing `height` tall.
 * `register: false` leaves per-frame animation to the caller (the street crowd runs its own).
 */
export function makeKenneyPerson(
  name: string,
  opts: { height?: number; walkRate?: number; register?: boolean } = {},
): (Person & { update: (dt: number) => void; model: THREE.Group }) | null {
  const m = kenneyModel(name);
  if (!m) return null;
  const group = new THREE.Group();
  const k = (opts.height ?? 1.0) / m.size.y;
  m.object.scale.setScalar(k);
  group.add(m.object);

  const mixer = new THREE.AnimationMixer(m.object);
  const clip = (n: string) => m.clips.find((c) => c.name === n);
  const idle = clip("idle") ? mixer.clipAction(clip("idle")!) : null;
  const walk = clip("walk") ? mixer.clipAction(clip("walk")!) : null;
  const hold = clip("holding-right") ? mixer.clipAction(clip("holding-right")!) : null;
  idle?.play();
  walk?.play();
  hold?.play();
  if (walk) walk.timeScale = opts.walkRate ?? 1.2;
  if (idle) idle.time = Math.random() * idle.getClip().duration;
  let amt = 0;
  let reachV = 0;
  const apply = () => {
    if (walk) walk.weight = amt * (1 - reachV);
    if (idle) idle.weight = (1 - amt) * (1 - reachV);
    if (hold) hold.weight = reachV;
  };
  apply();

  const handLocal = new THREE.Vector3();
  const person = {
    group,
    handLocal,
    model: m.object,
    walk: (_phase: number, a: number) => {
      amt = a;
      apply();
    },
    reach: (v: number) => {
      reachV = Math.min(1, Math.max(0, v));
      handLocal.set(0.2, 0.6, 0.15 + 0.3 * reachV);
      apply();
    },
    update: (dt: number) => mixer.update(dt),
  };
  if (opts.register !== false) live.add(person);
  return person;
}
