import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { part } from '../portraits/hands';
import { blush, D1, face, L1, L2, piece, quadPts, shaded, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, moods, roundPatch, type AvatarArt } from './kit';

/** Pilot 2 in pixel art: long straight blond hair, freckles, blue-grey eyes, an easy smile, navy suit with a guitar patch. Blue-sky day. */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairBlond;
const FACE: Face = { w: 18, jaw: 12.4, top: 26, chin: 74.5 };
const EYES: Eyes = { x: 7.6, y: 52, rx: 4, ry: 3, iris: PAL.irisGrey };
const BROWS: Brows = { x0: 3, x1: 12, y: 45.6, th: 1.7, color: HAIR[1] ?? 0 };
const MOUTH: Mouth = { y: 66, w: 5.8 };
const FRECKLES: readonly number[] = [-12.6, 58, -10, 59.6, -8.2, 57.4, -11, 61.4, 8.6, 57.6, 10.6, 60, 12.6, 58.2, 9.4, 61.6];

/** Left lock: from the parting down past the shoulder, in front of the suit. */
function leftLock(p: Pix): Uint8Array {
  return piece(p, path().move(-2, 15.6).cubic(-13, 14.5, -22.4, 22, -23, 40).cubic(-24, 60, -23, 82, -26.6, 104)
    .lines([-23, 100.4, -20.8, 105.4, -18.8, 98.8, -16.8, 101.6]).cubic(-16.4, 84, -17.8, 62, -16.6, 47)
    .cubic(-15.4, 34, -9, 27, -2, 25).close(), HAIR, [-27, 70, 5, 34], [-14, 22, 3, 3]);
}

/** Right lock: resting on the shoulder, so the name tape stays visible. */
function rightLock(p: Pix): Uint8Array {
  return piece(p, path().move(-2, 15.6).cubic(10, 14.5, 21.5, 22, 22.4, 40).cubic(23.2, 58, 24, 76, 28.6, 92)
    .lines([25, 89.6, 22.6, 93.6, 20.6, 87.6, 18.4, 90.4]).cubic(17, 76, 17.6, 60, 16.4, 47)
    .cubic(15.4, 35, 9, 27, -2, 25).close(), HAIR, [28, 64, 6, 30], [6, 18, 4, 2]);
}

function head(p: Pix, r: Rig): void {
  const fm = face(p, SKIN, FACE, r);
  blush(p, 11.4, 61, 3.4, 2, PAL.rose[3] ?? 0, fm, 0.4);
  if (p.k >= 0.6) for (let i = 0; i < FRECKLES.length; i += 2) p.set(p.col(FRECKLES[i] ?? 0), p.row(FRECKLES[i + 1] ?? 0), SKIN[D1] ?? 0);
  eyes(p, r, EYES, SKIN);
  brows(p, r, BROWS);
  nose(p, SKIN, 55, 60.4, 2.3);
  mouth(p, r, MOUTH, SKIN);
  const l = leftLock(p);
  const rl = rightLock(p);
  if (p.k >= 0.6) {
    p.paint(p.thick(quadPts([-6, 18, -19, 22, -20.4, 46]).concat([-21.4, 96]), 0), HAIR[L1] ?? 0, l);
    p.paint(p.thick(quadPts([4, 18, 17, 22, 19.6, 46]).concat([22.4, 84]), 0), HAIR[L1] ?? 0, rl);
    p.line(-18.6, 52, -19.4, 98, HAIR[D1] ?? 0, l);
    p.line(19, 54, 21, 86, HAIR[D1] ?? 0, rl);
  }
  p.line(-2, 16.4, -2, 24.4, HAIR[D1] ?? 0);
}

function guitarPatch(p: Pix): void {
  roundPatch(p, -8.6, 99.6, 4.4, PAL.gold[3] ?? 0, PAL.navy[2] ?? 0);
  if (p.k < 0.6) return;
  p.line(-7.4, 98.4, -5.6, 96.6, PAL.leather[4] ?? 0);
  p.paint(p.oval(-9.2, 100.8, 1.6, 1.4), PAL.red[4] ?? 0);
}

function body(p: Pix): void {
  shaded(p, path().move(-25.5, 108).cubic(-28.5, 80, -28, 28, -14, 14.5).cubic(-5, 7, 9, 7, 17, 14.5)
    .cubic(28, 28, 28.5, 80, 25.5, 108).close(), HAIR, [30, 60, 8, 40]);
  flightSuit(p, { ramp: PAL.navy, tee: PAL.teeth[3] ?? 0 }, SKIN);
  guitarPatch(p);
}

/** A white flight helmet with a sky-blue stripe, held at the side in a gloved hand. */
function helmet(p: Pix): void {
  const c = Math.cos(-0.2);
  const s = Math.sin(-0.2);
  const at = (u: number, v: number): [number, number] => [-36 + u * c - v * s, 109 + u * s + v * c];
  const shell = p.oval(-36, 109, 12, 12);
  part(p, shell, PAL.white, p.oval(...at(9, 7), 8, 13, -0.2));
  p.paint(p.thick(quadPts([...at(-10.4, -1), ...at(0, -14.6), ...at(10.4, -1)]), 1.3), PAL.blue[4] ?? 0, shell);
  const visor = p.oval(...at(5.6, 3.2), 6.2, 5.2, 0);
  p.paint(visor, PAL.glass[2] ?? 0, shell);
  p.paint(p.oval(...at(3.6, 1.2), 2, 1.1, -0.4), PAL.glass[6] ?? 0, visor);
  for (let i = 0; i < 3; i++) {
    const f = p.shape(path().rect(-29.6 + i * 2.7, 116.4 + i * 0.6, 2.6, 6));
    part(p, f, PAL.glove, p.blank());
  }
  p.paint(p.oval(...at(-6, -6), 2, 1.2, -0.6), PAL.white[L2] ?? 0, shell);
}

export const PILOT2: AvatarArt = {
  sky: {
    grad: [PAL.sky[2] ?? 0, PAL.sky[3] ?? 0, PAL.sky[4] ?? 0, PAL.sky[5] ?? 0, PAL.sky[6] ?? 0],
    ramp: PAL.sky, sea: PAL.sea, sun: PAL.sky[7] ?? 0, cloud: PAL.white[3] ?? 0,
    sunX: 34, sunY: 14, sunR: 5, island: -1,
  },
  moods: moods(0.9),
  body,
  head,
  front: helmet,
};
