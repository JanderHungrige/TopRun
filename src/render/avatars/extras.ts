import type { Accessory, Glasses } from '../../game/avatar-look';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, minus, union, type Pix } from '../pixel/raster';
import { L1, quadPts } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { FOUR, litPiece } from './light';
import { pendant } from './pilot1';
import { helmet } from './pilot2';
import { scarf } from './pilot3';

/** Glasses and neck accessories of the avatar builder (doc 29), fitted to the realistic head and neck. */

const GOLD_RIM = PAL.gold[3] ?? 0;
const FRAME_INK = PAL.ink[2] ?? 0;

/** Aviators: teardrop lenses in thin gold rims, a double bridge, a light tint darker at the top so the eyes, the
 *  blink and the mood still read. */
function aviators(p: Pix, ex: number, ey: number): void {
  for (const sd of [-1, 1]) {
    const lens = p.shape(path().move(sd * (ex - 4.2), ey - 2.6).line(sd * (ex + 4.2), ey - 2.8)
      .cubic(sd * (ex + 5), ey + 0.6, sd * (ex + 3.2), ey + 3.8, sd * (ex + 0.4), ey + 3.8)
      .cubic(sd * (ex - 3), ey + 3.8, sd * (ex - 4.8), ey + 0.4, sd * (ex - 4.2), ey - 2.6).close());
    p.paint(lens, PAL.glass[4] ?? 0, undefined, bayer(0.16));
    p.paint(minus(lens, p.shape(path().rect(sd * ex - 6, ey - 1.2, 12, 6))), PAL.glass[3] ?? 0, undefined, bayer(0.35));
    p.paint(p.border(lens), GOLD_RIM);
    p.line(sd * (ex + 4.4), ey - 2.4, sd * 15.4, ey - 1.2, GOLD_RIM);
  }
  p.line(-ex + 4.2, ey - 2.6, ex - 4.2, ey - 2.6, GOLD_RIM);
  if (p.k >= 0.8) p.line(-ex + 4, ey - 1, ex - 4, ey - 1, GOLD_RIM);
}

/** Clear, rounded rectangular frames with a glint on the lit lens. */
function clearFrames(p: Pix, ex: number, ey: number): void {
  for (const sd of [-1, 1]) {
    const lens = p.shape(path().move(sd * (ex - 3.6), ey - 2.6).line(sd * (ex + 3.6), ey - 2.6).quad(sd * (ex + 4.6), ey - 2.6, sd * (ex + 4.4), ey)
      .quad(sd * (ex + 4.2), ey + 2.8, sd * (ex + 1.6), ey + 2.8).line(sd * (ex - 1.6), ey + 2.8).quad(sd * (ex - 4.2), ey + 2.8, sd * (ex - 4.4), ey)
      .quad(sd * (ex - 4.6), ey - 2.6, sd * (ex - 3.6), ey - 2.6).close());
    p.paint(p.border(lens), FRAME_INK);
    if (p.k >= 0.7 && sd < 0) p.paint(p.oval(sd * ex - 2.4, ey - 1.4, 0.6, 0.5), PAL.white[4] ?? 0, lens);
    p.line(sd * (ex + 4.4), ey - 1.4, sd * 15.4, ey - 0.8, FRAME_INK);
  }
  p.line(-ex + 4.4, ey - 1.2, ex - 4.4, ey - 1.2, FRAME_INK);
}

/** Glasses over the eyes at (±ex, ey), in head space. */
export function glasses(p: Pix, g: Glasses, ex: number, ey: number): void {
  switch (g) {
    case 'none': return;
    case 'aviators': return aviators(p, ex, ey);
    case 'clear': return clearFrames(p, ex, ey);
    default: throw new Error(`unhandled: ${g satisfies never}`);
  }
}

/** A triangular neckerchief knotted at the throat: red with white polka dots. */
function bandana(p: Pix, phase: number): void {
  const RED = PAL.red;
  const band = litPiece(p, p.shape(path().move(-12.4, 74.8).quad(0, 82, 12.4, 74.8).line(13.2, 79.6).quad(0, 88, -13.2, 79.6).close()),
    RED, { cx: -6, cy: 76, rx: 22, ry: 12 }, { tones: FOUR, lo: -0.4 });
  const tip = phase === 1 ? 0.6 : 0;
  const flap = litPiece(p, p.shape(path().move(-9, 81.6).line(9, 81.6).line(tip, 95.6).close()), RED, { cx: -3, cy: 84, rx: 12, ry: 14 }, { tones: FOUR, lo: -0.4 });
  const dots = minus(flap, p.border(flap));
  if (p.k >= 0.6) for (const [x, y] of [[-4.6, 84.4], [0, 86], [4.4, 84.6], [-1.6, 90], [2.2, 91.4], [-6, 79.6], [6, 79.4], [0, 79.2]] as const) {
    p.paint(p.oval(x, y, 0.6, 0.6), PAL.white[3] ?? 0, union(dots, band));
  }
  litPiece(p, p.oval(0, 82.4, 2.6, 2), RED, { cx: -1, cy: 81.6, rx: 3, ry: 2.6 }, { tones: FOUR });
}

/** A ball chain with two blank tags resting on the chest. */
function dogtags(p: Pix, phase: number): void {
  const sway = phase === 1 ? 0.6 : 0;
  const chain = quadPts([-7.8, 75.4, -2, 94, sway, 94.4], 6).concat(quadPts([sway, 94.4, 2, 94, 7.8, 75.4], 6).slice(2));
  if (p.k >= 0.7) for (let i = 0; i + 1 < chain.length; i += 2) p.paint(p.oval(chain[i] ?? 0, chain[i + 1] ?? 0, 0.5, 0.5), PAL.steel[5] ?? 0);
  else p.paint(p.thick(chain, 0), PAL.steel[5] ?? 0);
  for (const [dx, a] of [[-1.2, -0.12], [1.6, 0.16]] as const) {
    const x = sway + dx;
    const tag = litPiece(p, p.shape(path().ellipse(x, 99, 2.2, 3.4, a)), PAL.steel, { cx: x - 1.4, cy: 97.6, rx: 3, ry: 4.4 }, { tones: [2, 3, 4, 5] });
    if (p.k >= 0.8) p.line(x - 1, 98, x + 0.8, 98, PAL.steel[L1] ?? 0, tag);
  }
}

/** The neck accessory, in body space (the helmet is a front layer: `accessoryFront`). */
export function accessory(p: Pix, a: Accessory, r: Rig): void {
  switch (a) {
    case 'none': case 'helmet': return;
    case 'scarf': return scarf(p, r.phase);
    case 'pendant': return pendant(p, r.phase);
    case 'bandana': return bandana(p, r.phase);
    case 'dogtags': return dogtags(p, r.phase);
    default: throw new Error(`unhandled: ${a satisfies never}`);
  }
}

/** The flight helmet held at the side (in front of everything). */
export const accessoryFront = (a: Accessory): ((p: Pix) => void) | undefined => (a === 'helmet' ? helmet : undefined);

/** A plain squadron patch: a gold ring round a navy disc with a white star. */
export function starPatch(p: Pix): void {
  p.paint(p.oval(-26, 99.5, 4.8, 4.8), PAL.gold[3] ?? 0);
  p.paint(p.oval(-26, 99.5, 3.5, 3.5), PAL.navy[2] ?? 0);
  const star: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? 2.8 : 1.2;
    star.push(-26 + Math.cos(a) * rr, 99.6 + Math.sin(a) * rr);
  }
  p.fill(path().lines(star).close(), PAL.white[3] ?? 0);
  if (p.k < 0.6) p.paint(p.oval(-26, 99.6, 1.2, 1.2), PAL.white[3] ?? 0);
}
