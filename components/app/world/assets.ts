import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Optional glTF models from /public/models. Every loader resolves to null if the
 * file is missing or broken, so scenes fall back to the procedural versions.
 */
const cache = new Map<string, Promise<THREE.Group | null>>();
let loader: GLTFLoader | null = null;

export function loadGltfScene(url: string): Promise<THREE.Group | null> {
  let hit = cache.get(url);
  if (!hit) {
    hit = (async () => {
      try {
        const head = await fetch(url, { method: "HEAD" });
        const type = head.headers.get("content-type") ?? "";
        if (!head.ok || type.includes("text/html")) return null; // 404 pages come back as HTML
        loader ??= new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        gltf.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        return gltf.scene;
      } catch {
        return null;
      }
    })();
    cache.set(url, hit);
  }
  return hit.then((g) => (g ? (g.clone(true) as THREE.Group) : null));
}

/** Scale to `length` along the longest horizontal axis, sit on y=0, centre on x/z. */
export function fitModel(model: THREE.Object3D, length: number) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const k = length / Math.max(size.x, size.z, 0.0001);
  model.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(model);
  const c = b2.getCenter(new THREE.Vector3());
  model.position.x -= c.x;
  model.position.z -= c.z;
  model.position.y -= b2.min.y;
  return size.x >= size.z; // true when the model's long axis is already x
}

// ---- rigged characters ---------------------------------------------------------
// public/models/character.glb (animated mannequin) is the fallback body. Any
// Mixamo-rigged .glb in public/models/people/ (michelle.glb, person-1.glb ...
// person-6.glb) is used instead as a more realistic body; its bones are posed in
// code (arms down, walk swing, hand-over), so it needs no animation clips.

export type CharacterTemplate = {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
  height: number; // model height in its own units
  tintable: boolean; // plain mannequin: tint per person; textured bodies are left alone
};
let templates: CharacterTemplate[] = [];
let characterLoading: Promise<void> | null = null;

const VARIANTS = ["michelle", "person-1", "person-2", "person-3", "person-4", "person-5", "person-6"].map(
  (n) => `/models/people/${n}.glb`,
);

async function loadRaw(url: string) {
  try {
    const head = await fetch(url, { method: "HEAD" });
    const type = head.headers.get("content-type") ?? "";
    if (!head.ok || type.includes("text/html")) return null;
    loader ??= new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    gltf.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        (o as THREE.Mesh).frustumCulled = false; // skinned bounds are unreliable
      }
    });
    gltf.scene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    return { gltf, height: Math.max(0.1, box.max.y - box.min.y) };
  } catch {
    return null;
  }
}

/** Start loading the characters; resolves once (never rejects). */
export function preloadCharacter(): Promise<void> {
  characterLoading ??= (async () => {
    const base = await loadRaw("/models/character.glb");
    if (!base) return;
    const clips = base.gltf.animations;
    const baseTpl: CharacterTemplate = { scene: base.gltf.scene, clips, height: base.height, tintable: true };
    const extra = (await Promise.all(VARIANTS.map(loadRaw)))
      .filter((r): r is NonNullable<typeof r> => !!r)
      // textured bodies have no clips of their own; people.ts poses their bones directly
      .map<CharacterTemplate>((r) => ({ scene: r.gltf.scene, clips: [], height: r.height, tintable: false }));
    templates = extra.length ? extra : [baseTpl];
  })();
  return characterLoading;
}

/** Sync: a random loaded character, or null until loaded / if no model files exist. */
export function getCharacter(): CharacterTemplate | null {
  return templates.length ? templates[Math.floor(Math.random() * templates.length)] : null;
}
