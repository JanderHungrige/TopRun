import type { Ramp } from '../pixel/palette';
import type { Path } from '../pixel/path';
import { bayer, type Mask, type Pix } from '../pixel/raster';
import { D1, D2, L1, L2, quadPts } from '../portraits/parts';
import { FIVE, litPiece, type Dome } from './light';

/**
 * Hair painting for the pilot avatars (doc 29): a hair mass is lit as one volume over the head (key light upper
 * left, five tones with dithered seams), then given clumps — dark partings between locks, light strands — and a
 * dithered sheen band where the light catches the crown.
 */

/** The volume all hair on the head is lit as. */
export const HAIR_DOME: Dome = { cx: -4, cy: 30, rx: 25, ry: 28, flat: 1.1 };

/** A hair mass: lit fill with a dark seam where it overlaps earlier paint. */
export function hairPiece(p: Pix, shape: Path | Mask, h: Ramp, dome: Dome = HAIR_DOME): Mask {
  const m = shape instanceof Uint8Array ? shape : p.shape(shape);
  return litPiece(p, m, h, dome, { tones: FIVE, lo: -0.35, hi: 1.25, seam: 2.5 });
}

/** Lines along quadratic curves [x0, y0, cx, cy, x1, y1] inside a mask: `dark` partings between clumps (D2 at
 *  full size, D1 when small), light strands in L1. */
export function clumps(p: Pix, m: Mask, h: Ramp, dark: readonly (readonly number[])[], light: readonly (readonly number[])[] = []): void {
  if (p.k < 0.55) return;
  const tone = (p.k >= 0.8 ? h[D2] : h[D1]) ?? 0;
  for (const q of dark) p.paint(p.thick(quadPts(q), 0), tone, m);
  for (const q of light) p.paint(p.thick(quadPts(q), 0), h[L1] ?? 0, m);
}

/** A dithered sheen band (highlight) along a curve, where the key light catches the hair. */
export function sheen(p: Pix, m: Mask, h: Ramp, q: readonly number[], width = 1.4): void {
  if (p.k < 0.6) return;
  p.paint(p.thick(quadPts(q), width), h[L2] ?? 0, m, bayer(0.5));
  p.paint(p.thick(quadPts(q), width * 0.35), h[L2] ?? 0, m);
}
