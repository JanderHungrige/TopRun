import { PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { part } from '../portraits/hands';
import { D1, D2, L1, L2 } from '../portraits/parts';
import { FOUR, litFill, litPiece } from './light';

/**
 * Neck and flight suit of the pilot avatars (doc 29): a neck that fits the realistic head, shoulders out to ±50
 * (≈ 2.4× the head), the suit lit from the upper left with seams and folds, an open collar over a T-shirt, the zip,
 * the harness with buckles and a blank name tape (the game prints the callsign elsewhere).
 */

export interface Suit { ramp: Ramp; tee: number }

const STRAP = PAL.olive[1] ?? 0;

/** The neck, mostly in the head's shade, with the tendon on the shadow side. */
export function neck(p: Pix, skin: Ramp, hw = 8): void {
  const m = p.shape(path().move(-hw, 52).line(hw, 52).cubic(hw, 63, hw + 0.4, 70, hw + 2, 77)
    .line(-hw - 2, 77).cubic(-hw - 0.4, 70, -hw, 63, -hw, 52).close());
  litFill(p, m, skin, { cx: -5, cy: 68, rx: hw * 2.2, ry: 22 }, { tones: FOUR, lo: -0.4, hi: 1.05 });
  if (p.k >= 0.7) p.paint(p.thick([hw * 0.45, 63, hw * 0.15, 74], 0), skin[D1] ?? 0, m);
}

function harness(p: Pix): void {
  for (const sd of [-1, 1]) p.paint(p.thick([sd * 19.6, 78.6, sd * 15.4, 102, sd * 13.4, 126], 1.9), STRAP);
  p.paint(p.thick([-15.2, 107.6, 15.2, 107.6], 1.5), STRAP);
  if (p.k >= 0.7) for (const sd of [-1, 1]) p.paint(p.thick([sd * 20.2, 79, sd * 16, 102, sd * 14, 126], 0), PAL.olive[2] ?? 0);
  for (const sd of [-1, 1]) part(p, p.shape(path().rect(sd * 14.8 - 2.7, 105.3, 5.4, 4.8)), PAL.steel, p.oval(sd * 14.8 + 2.7, 110, 2.6, 2));
}

function collar(p: Pix, r: Ramp, skin: Ramp, tee: number): void {
  p.fill(path().move(-8, 75).line(8, 75).line(0, 88).close(), tee);
  p.fill(path().move(-8, 75).line(8, 75).line(0, 81.6).close(), skin[D1] ?? 0);
  const flaps = p.shape(path().pair([7.8, 74.2, 16.4, 77.4, 12, 89.6, 1.6, 90.2]));
  litPiece(p, flaps, r, { cx: -10, cy: 80, rx: 26, ry: 14 }, { tones: [D1, D1, L1, L2], lo: -0.4, hi: 0.95 });
  p.line(0, 91, 0, 126, r[D2] ?? 0);
  if (p.k >= 0.8) for (let y = 92; y < 126; y += 2.4) p.line(-0.9, y, -0.9, y + 0.6, r[L1] ?? 0);
}

/** Folds and seams: sleeve seams, a crease from each armpit, a soft fold under the chest strap. */
function folds(p: Pix, r: Ramp, m: Uint8Array): void {
  if (p.k < 0.6) return;
  for (const sd of [-1, 1]) {
    p.paint(p.thick([sd * 36.5, 89, sd * 40.4, 106, sd * 42.4, 127], 0), (sd < 0 ? r[D1] : r[D2]) ?? 0, m);
    p.paint(p.thick([sd * 33, 99, sd * 30, 110, sd * 31, 122], 0), r[D1] ?? 0, m);
  }
  p.paint(p.thick([-30, 92, -24, 89.6, -19.6, 90.4], 0), r[L1] ?? 0, m);
}

/** Neck, flight suit with open collar, zip, harness and a blank name tape. */
export function flightSuit(p: Pix, s: Suit, skin: Ramp): void {
  neck(p, skin);
  const r = s.ramp;
  const torso = p.shape(path().move(-9.2, 74.4).cubic(-19.6, 76.4, -34.5, 78, -43, 86.6).cubic(-47.4, 91, -49.4, 97, -50.6, 104)
    .line(-57, 128).line(57, 128).line(50.6, 104).cubic(49.4, 97, 47.4, 91, 43, 86.6).cubic(34.5, 78, 19.6, 76.4, 9.2, 74.4).close());
  litPiece(p, torso, r, { cx: -16, cy: 106, rx: 72, ry: 42, flat: 1.4 }, { tones: FOUR, lo: -0.3, hi: 0.98 });
  folds(p, r, torso);
  collar(p, r, skin, s.tee);
  harness(p);
  part(p, p.shape(path().rect(19.6, 94.6, 11.6, 4.8)), PAL.leather, p.blank());
}
