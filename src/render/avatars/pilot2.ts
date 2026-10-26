import { PAL, type Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import type { Mask, Pix } from '../pixel/raster';
import { D1, L2, quadPts } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { clumps, hairPiece, sheen } from './hair-kit';
import { drawFace, KID_HEAD, type FaceArt } from './head';
import { flightSuit, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { FOUR, litPiece } from './light';
import { SKIES } from './skies';

/**
 * Pilot 2 (doc 08 / 29): long, sun-bleached blond hair parted just left of centre, close round the face and wavy
 * past the shoulders; a longer face with a slightly pointed chin; subtle freckles over nose and cheeks; blue-grey
 * eyes narrowed by a confident half-smile. Navy suit with a guitar patch, a helmet in hand. Blue-sky day.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairBlond;
const PART = -1.6;

const FACE: FaceArt = {
  head: { ...KID_HEAD, cheek: 15, jaw: 11.6, jawY: 57.6, chin: 4.8, chinY: 67 },
  skin: SKIN,
  eye: { x: 7.4, y: 43.6, w: 6.6, h: 2.7, iris: PAL.irisGrey, lid: PAL.hairChestnut[1] ?? 0 },
  brow: { x0: 3, x1: 11.4, y: 38.6, th: 1.1, color: HAIR[2] ?? 0, attitude: 0.3 },
  nose: { y0: 43, tip: 52.2, w: 2.2 },
  mouth: { y: 59, w: 5, line: SKIN[1] ?? 0, upper: SKIN[2] ?? 0, lower: PAL.rose[3] ?? 0, smirk: 0.9 },
  warmth: { tint: PAL.skinRuddy[4] ?? 0, level: 0.7 },
  freckles: { tones: [SKIN[D1] ?? 0, PAL.skinTan[3] ?? 0], density: 0.2 },
};

/** Left lock: from the parting down past the shoulder, in front of the suit, wavy at the ends. */
function leftLock(p: Pix, h: Ramp): Mask {
  return hairPiece(p, path().move(PART, 12.4).cubic(-12, 12, -20, 19, -20.4, 34).cubic(-21, 52, -20.6, 76, -24, 100)
    .lines([-21.4, 97, -20.2, 102.4, -17.8, 96.6, -15.8, 100.4, -14.4, 94.6]).cubic(-14, 80, -15.6, 60, -14.4, 44)
    .cubic(-13.8, 32, -8.6, 23.6, PART, 21.6).close(), h);
}

/** Right lock: resting on the shoulder, so the name tape stays visible. */
function rightLock(p: Pix, h: Ramp): Mask {
  return hairPiece(p, path().move(PART, 12.4).cubic(9, 12, 19, 19, 19.8, 34).cubic(20.4, 50, 21, 70, 25.4, 86)
    .lines([22.4, 84.4, 21, 89.4, 18.6, 84, 16.6, 87, 15.4, 82]).cubic(14.8, 70, 15.6, 58, 14.2, 44)
    .cubic(13.6, 32, 8.4, 23.6, PART, 21.6).close(), h);
}

function longFront(p: Pix, h: Ramp): void {
  const l = leftLock(p, h);
  const rl = rightLock(p, h);
  p.line(PART, 13.2, PART, 21.4, h[D1] ?? 0);
  sheen(p, l, h, [PART - 1, 15, -11, 15.4, -17, 24]);
  sheen(p, rl, h, [PART + 1, 14.6, 9, 14.4, 15, 21], 1);
  clumps(p, l, h, [[-8, 17, -16.6, 26, -17.6, 48], [-17.6, 50, -18.4, 76, -21.4, 96], [-15.2, 60, -16, 80, -16.6, 96]],
    [[-6, 16, -14, 22, -16, 40], [-19.4, 44, -19.6, 70, -22, 92]]);
  clumps(p, rl, h, [[4, 16, 15, 24, 16.8, 46], [17, 48, 18, 66, 21.6, 82]], [[3, 15.4, 12, 18, 14.6, 30]]);
}

/** Long straight hair of pilot 2 in any colour (also the builder's "long"). */
export const LONG: HairArt = {
  behind: (p, h) => {
    hairPiece(p, path().move(-22.5, 106).cubic(-25.6, 80, -25.6, 24, -13, 13.6).cubic(-5, 9.6, 8, 9.6, 15, 13.6)
      .cubic(25.6, 24, 25.6, 80, 22.5, 106).close(), h, { cx: -4, cy: 50, rx: 30, ry: 60, flat: 1.1 });
  },
  front: longFront,
};

function head(p: Pix, r: Rig): void {
  drawFace(p, r, FACE);
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

/** A white flight helmet with a sky-blue stripe and a dark visor, held at the side in a gloved hand. */
export function helmet(p: Pix): void {
  const c = Math.cos(-0.2);
  const s = Math.sin(-0.2);
  const at = (u: number, v: number): [number, number] => [-38 + u * c - v * s, 110 + u * s + v * c];
  const shell = litPiece(p, p.oval(-38, 110, 12, 12), PAL.white, { cx: -41, cy: 106, rx: 13, ry: 13 }, { tones: FOUR, lo: -0.4 });
  p.paint(p.thick(quadPts([...at(-10.4, -1), ...at(0, -14.6), ...at(10.4, -1)]), 1.3), PAL.blue[4] ?? 0, shell);
  const visor = litPiece(p, p.oval(...at(5.6, 3.2), 6.2, 5.2, 0), PAL.glass, { cx: -34, cy: 110, rx: 7, ry: 6 }, { tones: [1, 2, 3, 5] });
  p.paint(p.oval(...at(3.4, 1), 1.6, 0.8, -0.4), PAL.glass[6] ?? 0, visor);
  for (let i = 0; i < 3; i++) {
    const f = p.shape(path().rect(-31.6 + i * 2.7, 117.4 + i * 0.6, 2.6, 6));
    litPiece(p, f, PAL.glove, { cx: -31 + i * 2.7, cy: 118, rx: 2.4, ry: 5 }, { tones: FOUR });
  }
  p.paint(p.oval(...at(-6, -6), 2, 1.1, -0.6), PAL.white[L2] ?? 0, shell);
}

export const PILOT2: AvatarArt = {
  sky: SKIES.day,
  moods: moods(0.9, { squint: 0.12, hood: -0.04 }),
  body,
  head,
  front: helmet,
  face: FACE,
};
