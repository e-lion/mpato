import * as THREE from "three";
import type { Person } from "./people";
import type { Tweens } from "./tween";

/** Walk a person along waypoints at constant speed, with a stride animation. Returns a cancel fn. */
export function walkPath(
  tweens: Tweens,
  person: Person,
  pts: THREE.Vector3[],
  speed: number,
  done?: () => void,
) {
  const segs: { a: THREE.Vector3; b: THREE.Vector3; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = pts[i].distanceTo(pts[i + 1]);
    segs.push({ a: pts[i], b: pts[i + 1], len });
    total += len;
  }
  person.group.position.copy(pts[0]);
  return tweens.add(
    Math.max(0.2, total / speed),
    (p) => {
      let d = p * total;
      for (const s of segs) {
        if (d <= s.len || s === segs[segs.length - 1]) {
          const k = s.len > 0 ? Math.min(1, d / s.len) : 1;
          person.group.position.lerpVectors(s.a, s.b, k);
          const yaw = Math.atan2(s.b.x - s.a.x, s.b.z - s.a.z);
          let dy = yaw - person.group.rotation.y;
          dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          person.group.rotation.y += dy * 0.25;
          break;
        }
        d -= s.len;
      }
      person.walk((p * total) / 0.38, 1);
    },
    {
      done: () => {
        person.walk(0, 0);
        done?.();
      },
    },
  );
}
