import type { Mask, Pix } from '../pixel/raster';
import { bevel } from './metal';
import { BASE, type Ramp } from './palette';

// Shared helpers for the medal emblems (emblems.ts, emblems-2.ts): each emblem is laid out in a unit square (−1 … 1)
// around (x, y) scaled by r, painted in the design's mark / accent ramps and kept inside `clip`.

export interface EmblemInk { mark: Ramp; accent: Ramp }

export type Painter = (p: Pix, x: number, y: number, r: number, ink: EmblemInk, clip: Mask) => void;

export const val = (ramp: Ramp, slot = BASE): number => ramp[slot] ?? 0;
/** Unit-square points around (x, y) at scale r → frame units. */
export const map = (x: number, y: number, r: number, pts: readonly number[]): number[] => pts.map((q, i) => (i % 2 === 0 ? x + q * r : y + q * r));
export const stroke = (p: Pix, x: number, y: number, r: number, pts: readonly number[], w: number): Mask => p.thick(map(x, y, r, pts), w * r);

export function quadPts(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const u = 1 - t;
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return out;
}

/** A shaded shape: base colour, light towards the upper left. */
export function solid(p: Pix, m: Mask, ramp: Ramp, x: number, y: number, r: number, clip: Mask): void {
  const inside = m.map((v, i) => (v && clip[i] ? 1 : 0));
  bevel(p, inside, ramp, x, y, r);
}
