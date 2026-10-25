import type { Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { shifted, type Mask, type Pix } from '../pixel/raster';
import { BASE, D1, D2, L1, L2 } from './parts';
import type { Gesture } from './types';

/** Pixel-art hands and arms for the portrait gestures (doc 06 / doc 20), in the portrait frame. */

export interface Hand { skin: Ramp; sleeve: Ramp }

/** Paints a part: base, shadow (a copy of the mask nudged towards the light's far side), and a dark inner edge
 *  wherever it overlaps something already drawn, so overlapping parts stay readable. */
export function part(p: Pix, m: Mask, r: Ramp, shade: Mask): void {
  const seam = p.seam(m);
  p.paint(m, r[BASE] ?? 0);
  p.paint(shade, r[D1] ?? 0, m);
  p.paint(seam, r[D2] ?? 0);
}

/** Sleeved arm along `pts` (shoulder → wrist) with its shadow down the right side. */
export function arm(p: Pix, pts: readonly number[], h: Hand): void {
  const m = p.thick(pts, 6.4);
  part(p, m, h.sleeve, shifted(m, p.w, Math.max(1, Math.round(4.2 * p.k)), 0).map((v, i) => (v ? 0 : m[i] ?? 0)));
  p.paint(p.thick(pts.map((v, i) => (i % 2 === 0 ? v - 2.4 : v)), 1.2), h.sleeve[L1] ?? 0, m);
}

/** Front-on fist (curled fingers facing the viewer) centred on (x, y). */
export function fist(p: Pix, x: number, y: number, h: Hand): void {
  const m = p.shape(path().move(x - 7, y - 2).quad(x - 7, y - 6, x - 3, y - 6).line(x + 3, y - 6).quad(x + 7, y - 6, x + 7, y - 2)
    .line(x + 7, y + 2.5).quad(x + 7, y + 6.5, x + 3, y + 6.5).line(x - 3, y + 6.5).quad(x - 7, y + 6.5, x - 7, y + 2.5).close());
  part(p, m, h.skin, p.oval(x + 8.6, y, 5, 9));
  if (p.k >= 0.55) for (let i = 0; i < 3; i++) p.line(x - 6, y - 2.2 + i * 3.1, x + 2.4, y - 2.2 + i * 3.1, h.skin[D2] ?? 0, m);
  p.paint(p.oval(x - 3.6, y - 4.2, 2, 1), h.skin[L1] ?? 0, m);
}

function finger(p: Pix, pts: readonly number[], r: number, h: Hand): Mask {
  const m = p.thick(pts, r);
  part(p, m, h.skin, p.blank());
  return m;
}

/** Fist with the index finger pointing from (x, y) by (dx, dy) and the thumb across the curled fingers. */
export function pointHand(p: Pix, x: number, y: number, dx: number, dy: number, h: Hand): void {
  fist(p, x, y, h);
  finger(p, [x - 2, y - 3, x - 2 + dx, y - 3 + dy], 2.5, h);
  p.paint(p.oval(x - 2 + dx * 0.95, y - 3 + dy * 0.95, 1.2, 1), h.skin[L2] ?? 0);
  finger(p, [x + 3, y - 1.4, x - 3, y + 0.6], 2, h);
}

function thumbsUp(p: Pix, x: number, y: number, h: Hand): void {
  arm(p, [x + 11, y + 40, x + 3, y + 5], h);
  fist(p, x, y, h);
  finger(p, [x - 3.4, y - 5, x - 3.9, y - 15], 2.7, h);
  p.paint(p.oval(x - 4.4, y - 14.6, 1.2, 1), h.skin[L2] ?? 0);
}

function salute(p: Pix, h: Hand): void {
  arm(p, [-68, 104, -50, 74, -26, 48], h);
  const m = finger(p, [-26, 47.6, -9, 38.6], 3.6, h);
  if (p.k >= 0.6) {
    p.line(-19, 42.4, -10, 37.6, h.skin[D1] ?? 0, m);
    p.line(-18.2, 45, -9.4, 40.4, h.skin[D1] ?? 0, m);
  }
}

const SPREAD: readonly (readonly [number, number])[] = [[-2.15, 9], [-1.78, 11], [-1.42, 11.5], [-1.06, 10], [2.9, 7.5]]; // [angle, length]

function facepalm(p: Pix, h: Hand): void {
  arm(p, [48, 130, 33, 92, 18, 67], h);
  finger(p, [17, 65, 7, 55], 5.6, h);
  for (const [a, len] of SPREAD) {
    finger(p, [1 + Math.cos(a) * 6, 48 + Math.sin(a) * 6, 1 + Math.cos(a) * (6 + len), 48 + Math.sin(a) * (6 + len)], 2.3, h);
  }
  const palm = p.oval(1.5, 50, 10, 8.6, -0.35);
  part(p, palm, h.skin, p.oval(13, 52, 5.5, 11, -0.35));
  p.paint(p.oval(-3, 46, 3, 1.6, -0.35), h.skin[L1] ?? 0, palm);
}

/** The generic version of each gesture, in the space the figure sets up for it. */
export function gesture(p: Pix, g: Gesture, h: Hand): void {
  switch (g) {
    case 'none': return;
    case 'thumbsUp': return thumbsUp(p, 27, 99, h);
    case 'point':
      arm(p, [34, 138, 26, 103], h);
      return pointHand(p, 22, 98, -11, -7, h);
    case 'salute': return salute(p, h);
    case 'facepalm': return facepalm(p, h);
    default: throw new Error(`unhandled: ${g satisfies never}`);
  }
}
