import { PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Mask, Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { part } from '../portraits/hands';
import { blush, D1, D2, face, L1, L2, piece, quadPts, shaded, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, freckles, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { SKIES } from './skies';

/**
 * Pilot 2 in pixel art (doc 08 / 29): long, sun-bleached blond hair parted near the centre, close round the face
 * and wavy past the shoulders; a longer face with a slightly pointed chin; a dense band of freckles; smiling,
 * slightly narrowed blue-grey eyes and a wide closed-lip smile. Navy suit with a guitar patch. Blue-sky day.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairBlond;
const FACE: Face = { w: 18.4, jaw: 12, top: 26, chin: 75.4 };
const EYES: Eyes = { x: 7.8, y: 52.8, rx: 4.1, ry: 3.1, iris: PAL.irisGrey };
const BROWS: Brows = { x0: 3.2, x1: 12.2, y: 46.4, th: 1.4, color: HAIR[2] ?? 0 };
const MOUTH: Mouth = { y: 67.2, w: 6.4, lower: PAL.rose[3] ?? 0 };
const PART = -2.6;

/** Left lock: from the parting down past the shoulder, in front of the suit, wavy at the ends. */
function leftLock(p: Pix, h: Ramp): Mask {
  return piece(p, path().move(PART, 15.4).cubic(-13.4, 14.4, -22.6, 22, -23.2, 40).cubic(-24, 58, -23.2, 80, -27.4, 103)
    .lines([-24.6, 99.8, -23.2, 105.6, -20.6, 99.4, -18.4, 103.6, -17, 97.4]).cubic(-16.4, 82, -17.6, 62, -16.4, 48)
    .cubic(-15.4, 35, -9.6, 27, PART, 25).close(), h, [-27, 72, 5, 34], [-14, 22, 3, 3]);
}

/** Right lock: resting on the shoulder, so the name tape stays visible. */
function rightLock(p: Pix, h: Ramp): Mask {
  return piece(p, path().move(PART, 15.4).cubic(9.6, 14.4, 21.6, 22, 22.6, 40).cubic(23.4, 58, 24.2, 74, 29, 91)
    .lines([25.6, 89.4, 24.2, 94.6, 21.4, 88.8, 19.2, 92.2, 18, 86.6]).cubic(17, 74, 17.8, 60, 16.6, 48)
    .cubic(15.6, 35, 9.4, 27, PART, 25).close(), h, [28, 66, 6, 30], [6, 18, 4, 2]);
}

function longFront(p: Pix, h: Ramp): void {
  const l = leftLock(p, h);
  const rl = rightLock(p, h);
  p.line(PART, 16.2, PART, 24.4, h[D1] ?? 0);
  if (p.k < 0.6) return;
  for (const m of [l, rl]) p.paint(p.oval(PART, 17.4, 11, 2.2), h[L2] ?? 0, m); // sun-bleached crown
  p.paint(p.thick(quadPts([-6, 18, -19, 22, -20.4, 46]).concat([-21.4, 96]), 0), h[L1] ?? 0, l);
  p.paint(p.thick(quadPts([3, 18, 17, 22, 19.6, 46]).concat([22.4, 84]), 0), h[L1] ?? 0, rl);
  p.line(-18.6, 52, -19.4, 98, h[D1] ?? 0, l);
  p.line(19, 54, 21, 86, h[D1] ?? 0, rl);
  p.line(-22, 80, -24.4, 100, h[D2] ?? 0, l); // darker under-layers near the ends
  p.line(23, 72, 26.2, 88, h[D2] ?? 0, rl);
}

/** Long straight hair of pilot 2 in any colour (also the builder's "long"). */
export const LONG: HairArt = {
  behind: (p, h) => {
    shaded(p, path().move(-25.5, 108).cubic(-28.5, 80, -28.5, 28, -14, 14.5).cubic(-5, 7, 9, 7, 17, 14.5)
      .cubic(28.5, 28, 28.5, 80, 25.5, 108).close(), h, [30, 60, 8, 40]);
  },
  front: longFront,
};

function head(p: Pix, r: Rig): void {
  const fm = face(p, SKIN, FACE, r);
  blush(p, 11.4, 61.2, 3.8, 2.2, PAL.rose[3] ?? 0, fm, 0.5);
  freckles(p, fm, [SKIN[D1] ?? 0, PAL.skinTan[3] ?? 0], 0.3, 57.8);
  eyes(p, r, EYES, SKIN);
  brows(p, r, BROWS);
  nose(p, SKIN, 55.2, 61.2, 2.6);
  mouth(p, r, MOUTH, SKIN);
  LONG.front(p, HAIR, SKIN);
}

function guitarPatch(p: Pix): void {
  roundPatch(p, -8.6, 99.6, 4.4, PAL.gold[3] ?? 0, PAL.navy[2] ?? 0);
  if (p.k < 0.6) return;
  p.line(-7.4, 98.4, -5.6, 96.6, PAL.leather[4] ?? 0);
  p.paint(p.oval(-9.2, 100.8, 1.6, 1.4), PAL.red[4] ?? 0);
}

function body(p: Pix): void {
  LONG.behind?.(p, HAIR);
  flightSuit(p, { ramp: PAL.navy, tee: PAL.teeth[3] ?? 0 }, SKIN);
  guitarPatch(p);
}

/** A white flight helmet with a sky-blue stripe, held at the side in a gloved hand. */
export function helmet(p: Pix): void {
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
  sky: SKIES.day,
  moods: moods(1.1, { squint: 0.12, hood: -0.05 }),
  body,
  head,
  front: helmet,
};
