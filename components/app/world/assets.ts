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
