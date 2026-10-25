import type { Accessory, Glasses } from '../../game/avatar-look';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, minus, union, type Pix } from '../pixel/raster';
import { part } from '../portraits/hands';
import { L1, piece, quadPts } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { pendant } from './pilot1';
import { helmet } from './pilot2';
import { scarf } from './pilot3';

/** Glasses and neck accessories of the avatar builder (doc 29), in the 100×120 avatar frame. */

const GOLD_RIM = PAL.gold[3] ?? 0;
const FRAME_INK = PAL.ink[2] ?? 0;

/** Aviators: teardrop gold rims, a double bridge and a light dithered tint, so the eyes and blinks still read. */
function aviators(p: Pix, ex: number, ey: number): void {
  for (const sd of [-1, 1]) {
    const lens = p.shape(path().move(sd * (ex - 4.6), ey - 3.2).line(sd * (ex + 4.4), ey - 3.4)
      .cubic(sd * (ex + 5.4), ey + 1, sd * (ex + 3.4), ey + 4.6, sd * ex, ey + 4.4).cubic(sd * (ex - 3.6), ey + 4.2, sd * (ex - 5.2), ey, sd * (ex - 4.6), ey - 3.2).close());
    p.paint(lens, PAL.lens[3] ?? 0, undefined, bayer(0.22));
    p.paint(p.border(lens), GOLD_RIM);
    p.line(sd * (ex + 4.6), ey - 2.6, sd * 18, ey - 1.6, GOLD_RIM);
  }
  p.line(-ex + 4.6, ey - 3, ex - 4.6, ey - 3, GOLD_RIM);
  if (p.k >= 0.8) p.line(-ex + 4.4, ey - 1.4, ex - 4.4, ey - 1.4, GOLD_RIM);
}

/** Clear, rounded rectangular frames with a glint. */
function clearFrames(p: Pix, ex: number, ey: number): void {
  for (const sd of [-1, 1]) {
    const lens = p.shape(path().move(sd * (ex - 4.4), ey - 3).line(sd * (ex + 4.4), ey - 3).quad(sd * (ex + 5.4), ey - 3, sd * (ex + 5.2), ey)
      .quad(sd * (ex + 5), ey + 3.8, sd * (ex + 2), ey + 3.8).line(sd * (ex - 2), ey + 3.8).quad(sd * (ex - 5), ey + 3.8, sd * (ex - 5.2), ey)
      .quad(sd * (ex - 5.4), ey - 3, sd * (ex - 4.4), ey - 3).close());
    p.paint(p.border(lens), FRAME_INK);
    if (p.k >= 0.7) p.paint(p.oval(sd * ex + 2.6, ey - 1.6, 0.7, 0.5), PAL.white[4] ?? 0, lens);
    p.line(sd * (ex + 5.2), ey - 1.6, sd * 18, ey - 1.2, FRAME_INK);
  }
  p.line(-ex + 5, ey - 1.6, ex - 5, ey - 1.6, FRAME_INK);
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
  const band = piece(p, path().move(-12.4, 77.6).quad(0, 85, 12.4, 77.6).line(13.2, 82.4).quad(0, 91, -13.2, 82.4).close(), RED, [15, 84, 5, 8]);
  const tip = phase === 1 ? 0.6 : 0;
  const flap = p.shape(path().move(-9, 84.6).line(9, 84.6).line(tip, 98.6).close());
  part(p, flap, RED, p.shape(path().move(3, 84.6).line(9, 84.6).line(tip, 98.6).close()));
  const dots = minus(flap, p.border(flap));
  if (p.k >= 0.6) for (const [x, y] of [[-4.6, 87.4], [0, 89], [4.4, 87.6], [-1.6, 93], [2.2, 94.4], [-6, 82.6], [6, 82.4], [0, 82.2]] as const) {
    p.paint(p.oval(x, y, 0.6, 0.6), PAL.white[3] ?? 0, union(dots, band));
  }
  part(p, p.oval(0, 85.4, 2.6, 2), RED, p.oval(2, 86.4, 2, 2));
}

/** A ball chain with two blank tags resting on the chest. */
function dogtags(p: Pix, phase: number): void {
  const sway = phase === 1 ? 0.6 : 0;
  const chain = quadPts([-7, 80.4, -2, 96, sway, 96.4], 6).concat(quadPts([sway, 96.4, 2, 96, 7, 80.4], 6).slice(2));
  if (p.k >= 0.7) for (let i = 0; i + 1 < chain.length; i += 2) p.paint(p.oval(chain[i] ?? 0, chain[i + 1] ?? 0, 0.5, 0.5), PAL.steel[5] ?? 0);
  else p.paint(p.thick(chain, 0), PAL.steel[5] ?? 0);
  for (const [dx, a] of [[-1.2, -0.12], [1.6, 0.16]] as const) {
    const x = sway + dx;
    const tag = p.shape(path().ellipse(x, 101, 2.2, 3.4, a));
    part(p, tag, PAL.steel, p.oval(x + 1.6, 102, 1.2, 3.4, a));
    if (p.k >= 0.8) p.line(x - 1, 100, x + 0.8, 100, PAL.steel[L1] ?? 0, tag);
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
