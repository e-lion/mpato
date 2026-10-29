export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Tween = {
  t: number;
  delay: number;
  dur: number;
  ease: (t: number) => number;
  update: (p: number) => void;
  done?: () => void;
  cancelled: boolean;
};

/** Minimal time-based tween runner driven by the engine's render loop. */
export class Tweens {
  private list: Tween[] = [];
  /** When true, durations collapse to ~0 (prefers-reduced-motion). */
  instant = false;

  get active() {
    return this.list.length > 0;
  }

  add(
    dur: number,
    update: (p: number) => void,
    opts: { delay?: number; ease?: (t: number) => number; done?: () => void } = {},
  ) {
    const tw: Tween = {
      t: 0,
      delay: this.instant ? 0 : (opts.delay ?? 0),
      dur: this.instant ? 0.001 : Math.max(0.001, dur),
      ease: opts.ease ?? ((t) => t),
      update,
      done: opts.done,
      cancelled: false,
    };
    this.list.push(tw);
    return () => {
      tw.cancelled = true;
    };
  }

  step(dt: number) {
    if (!this.list.length) return;
    const finished: Tween[] = [];
    for (const tw of [...this.list]) {
      if (tw.cancelled) {
        finished.push(tw);
        continue;
      }
      if (tw.delay > 0) {
        tw.delay -= dt;
        continue;
      }
      tw.t += dt;
      const p = Math.min(1, tw.t / tw.dur);
      tw.update(tw.ease(p));
      if (p >= 1) finished.push(tw);
    }
    if (finished.length) {
      this.list = this.list.filter((x) => !finished.includes(x));
      for (const tw of finished) if (!tw.cancelled) tw.done?.();
    }
  }

  clear() {
    for (const tw of this.list) tw.cancelled = true;
    this.list = [];
  }
}
