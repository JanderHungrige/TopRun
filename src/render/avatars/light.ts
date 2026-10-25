import { lighter, type Ramp } from '../pixel/palette';
import { bayer, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, D2, L1, L2 } from '../portraits/parts';

/**
 * Painterly lighting for the pilot avatars (doc 29, style rules in doc 20): a shape is shaded as a lit ellipsoid —
 * one key light from the upper left, 3–5 tones of the material's ramp joined by short ordered-dither seams — and the
 * finished figure gets a rim light on the silhouette edges that face the background's sun or moon.
 */

/** The ellipsoid a shape is lit as, in frame units; `flat` > 1 flattens its front (faces, chests). */
export interface Dome { cx: number; cy: number; rx: number; ry: number; flat?: number }

export interface LitOpts {
  /** Ramp slots from dark to light (default deep shadow … highlight). */
  tones?: readonly number[];
  /** Light intensity mapped to the darkest / lightest tone (−1 … 1). */
  lo?: number;
  hi?: number;
  /** Seam sharpness: higher = shorter dither seams between the bands. */
  seam?: number;
}

export const FIVE: readonly number[] = [D2, D1, BASE, L1, L2];
export const FOUR: readonly number[] = [D2, D1, BASE, L1];

const L = ((): readonly [number, number, number] => {
  const v = [-0.55, -0.62, 0.56];
  const n = Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
  return [(v[0] ?? 0) / n, (v[1] ?? 0) / n, (v[2] ?? 0) / n];
})();

/** Light intensity (−1 … 1) of the ellipsoid surface over frame point (x, y). */
export function intensity(d: Dome, x: number, y: number): number {
  let u = (x - d.cx) / d.rx;
  let v = (y - d.cy) / d.ry;
  let q = u * u + v * v;
  if (q > 0.985) {
    const s = Math.sqrt(0.985 / q);
    u *= s;
    v *= s;
    q = 0.985;
  }
  const f = d.flat ?? 1;
  const w = f * Math.pow(q, f - 1);
  const z = Math.sqrt(Math.max(0, 1 - Math.pow(q, f)));
  const nx = u * w;
  const ny = v * w;
  const len = Math.hypot(nx, ny, z) || 1;
  return (nx * L[0] + ny * L[1] + z * L[2]) / len;
}

/** Shades the pixels of `m` in ramp `r` as the lit dome `d`. */
export function litFill(p: Pix, m: Mask, r: Ramp, d: Dome, o: LitOpts = {}): void {
  const slots = o.tones ?? FIVE;
  const lo = o.lo ?? -0.2;
  const hi = o.hi ?? 1;
  const sharp = o.seam ?? 3;
  const n = slots.length - 1;
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const c = i % p.w;
    const row = (i - c) / p.w;
    const [x, y] = p.frame(c + 0.5, row + 0.5);
    const t = Math.max(0, Math.min(1, (intensity(d, x, y) - lo) / (hi - lo))) * n;
    let band = Math.min(n, Math.floor(t));
    const f = Math.max(0, Math.min(1, (t - band - 0.5) * sharp + 0.5));
    if (band < n && bayer(f)(c, row)) band++;
    p.data[i] = r[slots[band] ?? BASE] ?? 0;
  }
}

/** A shaded part: lit fill plus a dark seam wherever it overlaps earlier paint. Returns the mask. */
export function litPiece(p: Pix, m: Mask, r: Ramp, d: Dome, o: LitOpts = {}, seamTone = D2): Mask {
  const seam = p.seam(m);
  litFill(p, m, r, d, o);
  p.paint(seam, r[seamTone] ?? 0);
  return m;
}

/** Paints `v` over `m` on about `level` of its pixels (ordered dither): soft shadows, warmth, stubble. */
export function glaze(p: Pix, m: Mask, v: number, level: number, clip?: Mask): void {
  p.paint(m, v, clip, bayer(level));
}

/** Rim light: figure pixels whose neighbour towards the light is background get `steps` lighter along their own
 *  ramp. `side` = −1 light from the left, 1 from the right; `top` also lights upward-facing edges (high sun). */
export function rimLight(p: Pix, side: -1 | 1, top: boolean, steps: number): void {
  const w = p.w;
  const src = p.data.slice();
  for (let i = 0; i < src.length; i++) {
    const v = src[i] ?? 0;
    if (!v) continue;
    const c = i % w;
    const sideOpen = c + side >= 0 && c + side < w && !src[i + side];
    const topOpen = top && i - w >= 0 && !src[i - w];
    if (sideOpen || topOpen) p.data[i] = lighter(v, steps);
  }
}
