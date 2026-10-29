import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Kenney (CC0) models from /public/models/kenney: stylised buildings, vehicles and people.
 * Everything resolves to null when a file is missing, so the scene falls back to the
 * code-built versions and never breaks. Call preloadKenney() once; after it resolves the
 * synchronous kenneyModel() hands out cheap clones (geometry and materials are shared).
 */

const BASE = "/models/kenney/";

export const KENNEY = {
  characters: [
    "female-a", "female-b", "female-c", "female-d", "female-e", "female-f",
    "male-a", "male-b", "male-d", "male-e", "male-f", // male-c is a police officer: left out
  ].map((n) => `characters/character-${n}`),
  buildings: [
    "building-a", "building-b", "building-c", "building-d", "building-e", "building-f",
    "building-g", "building-h", "building-i", "building-j", "building-k", "building-l",
    "building-m", "building-skyscraper-a", "building-skyscraper-b", "building-skyscraper-c",
  ].map((n) => `commercial/${n}`),
  houses: ["a", "b", "c", "d", "e", "f", "g", "h"].map((n) => `suburban/building-type-${n}`),
  trees: ["suburban/tree-large", "suburban/tree-small"],
  lights: ["roads/light-square", "roads/light-curved"],
  cars: ["cars/delivery", "cars/van"],
  props: ["characters/aid-cane"],
} as const;

export type KenneyModel = {
  object: THREE.Group;
  clips: THREE.AnimationClip[];
  /** Size of the model in its own units, and its height-from-ground offset already removed. */
  size: THREE.Vector3;
};

type Entry = { scene: THREE.Group; clips: THREE.AnimationClip[]; size: THREE.Vector3; skinned: boolean };
const cache = new Map<string, Entry>();
let loader: GLTFLoader | null = null;
let loading: Promise<void> | null = null;
let ready = false;

async function loadOne(name: string) {
  try {
    loader ??= new GLTFLoader();
    const gltf = await loader.loadAsync(`${BASE}${name}.glb`);
    let skinned = false;
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        if ((m as THREE.SkinnedMesh).isSkinnedMesh) {
          skinned = true;
          m.frustumCulled = false; // skinned bounds are unreliable
        }
      }
    });
    gltf.scene.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    // sit on y = 0, centred on x/z, whatever the model's own origin was
    const wrap = new THREE.Group();
    const c = box.getCenter(new THREE.Vector3());
    gltf.scene.position.set(-c.x, -box.min.y, -c.z);
    wrap.add(gltf.scene);
    cache.set(name, { scene: wrap, clips: gltf.animations, size: box.getSize(new THREE.Vector3()), skinned });
  } catch {
    /* missing or broken file: callers fall back to the code-built model */
  }
}

/** Load every model the world uses, in parallel. Resolves once (never rejects). */
export function preloadKenney(): Promise<void> {
  loading ??= (async () => {
    const all = [...KENNEY.characters, ...KENNEY.buildings, ...KENNEY.houses, ...KENNEY.trees, ...KENNEY.lights, ...KENNEY.cars, ...KENNEY.props];
    await Promise.all(all.map(loadOne));
    ready = true;
  })();
  return loading;
}

export const kenneyReady = () => ready;

/** A fresh clone of a loaded model, or null if it isn't available. Skinned models get their own skeleton. */
export function kenneyModel(name: string): KenneyModel | null {
  const e = cache.get(name);
  if (!e) return null;
  const object = (e.skinned ? cloneSkinned(e.scene) : e.scene.clone(true)) as THREE.Group;
  return { object, clips: e.clips, size: e.size.clone() };
}

export const hasKenney = (name: string) => cache.has(name);

/** Loaded names from a group, for picking among what actually exists. */
export const available = (names: readonly string[]) => names.filter((n) => cache.has(n));
