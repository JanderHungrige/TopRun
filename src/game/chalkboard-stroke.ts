import { PX_H, PX_W, type ChalkColor } from './chalkboard';
import type { ChalkOp, WipeOp } from './chalkboard-ops';

// Chalkboard (doc 40): turning a pointer or cursor path into an op. Points closer than MIN_STEP_PX to the last one
// are skipped; a stroke is handed over every SPLIT_POINTS points (and when the pen lifts), so posts stay small.

export const MIN_STEP_PX = 3;
export const SPLIT_POINTS = 120;

/** A screen point (logical px) → board px, rounded and clamped onto the slate at (sx, sy). */
export function toBoardPx(p: { x: number; y: number }, sx: number, sy: number): [number, number] {
  return [Math.max(0, Math.min(PX_W - 1, Math.round(p.x - sx))), Math.max(0, Math.min(PX_H - 1, Math.round(p.y - sy)))];
}

export class Stroke {
  readonly op: ChalkOp | WipeOp;

  /** A chalk stroke (`color`) or a sponge stroke (`wet` = the sponge's wetness now), starting at (x, y). */
  constructor(kind: { color: ChalkColor } | { wet: number }, x: number, y: number) {
    this.op = 'color' in kind ? { t: 'c', c: kind.color, p: [x, y] } : { t: 'w', w: kind.wet, p: [x, y] };
  }

  get last(): [number, number] {
    const p = this.op.p;
    return [p[p.length - 2] ?? 0, p[p.length - 1] ?? 0];
  }

  get full(): boolean {
    return this.op.p.length / 2 >= SPLIT_POINTS;
  }

  /** Adds the point when it is at least MIN_STEP_PX from the last one; returns whether it did. */
  add(x: number, y: number): boolean {
    const [lx, ly] = this.last;
    if (Math.max(Math.abs(x - lx), Math.abs(y - ly)) < MIN_STEP_PX) return false;
    this.op.p.push(x, y);
    return true;
  }
}
