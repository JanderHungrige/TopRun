import { PAL, type Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { blush, D1, face, L1, L2, piece, shaded, strand, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { SKIES } from './skies';

/**
 * Pilot 1, the youngest flyer, in pixel art (doc 08 / 29): a full, shaggy golden bob parted on the left with a heavy
 * fringe swept over the right brow and wavy ends flicking out at the jaw; big, wide-set, near-black eyes with
 * a faint shadow under them; faint blond brows; a small serious mouth with pink lips; a lucky fang on a cord
 * and a thin gold chain. Dawn patrol.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairGold;
const FACE: Face = { w: 18.2, jaw: 12, top: 26, chin: 73.4 };
const EYES: Eyes = { x: 8, y: 52.6, rx: 4.6, ry: 4, iris: PAL.irisDark, irisW: 0.52 };
const BROWS: Brows = { x0: 3.6, x1: 12.6, y: 44, th: 1.1, color: HAIR[2] ?? 0, bias: -0.9 };
const MOUTH: Mouth = { y: 66.4, w: 4, full: PAL.rose[3] ?? 0 };

/** Lock from the parting down the left side, ending in wavy tips that flick out below the jaw. */
const leftLock = (): Path => path().move(-7.2, 15.4).cubic(-18, 16, -25, 30, -24.6, 50).cubic(-24.4, 60, -25.6, 67, -28.6, 73.6)
  .lines([-25.2, 72.2, -23.8, 76, -21.2, 70.8, -19, 74.2]).cubic(-17.4, 64, -17.6, 50, -15.2, 40)
  .cubic(-13.4, 33, -11.2, 28, -8.6, 25.4).close();

/** Crown sweeping right into the heavy fringe: tips over the right brow and the eye's outer corner, then the
 *  lock falls past the jaw and flicks out. */
const fringe = (): Path => path().move(-7.2, 15.4).cubic(4, 11, 18.5, 14.5, 22.8, 27).cubic(25.4, 36, 25, 50, 25.2, 60)
  .cubic(25.4, 66, 27.4, 70, 29.4, 73.2).lines([25.8, 72.4, 24.2, 76, 21.6, 70.4, 19.4, 73.4]).cubic(17.8, 64, 18.2, 57, 16.6, 51)
  .lines([14.8, 54.4, 13.4, 47.6, 10.6, 48.4, 8.4, 44.6, 5.6, 46.6, 3.2, 42.2])
  .cubic(-0.8, 37.6, -5.4, 32, -7.8, 26.6).cubic(-8.4, 22.6, -8.2, 18.6, -7.2, 15.4).close();

function bobFront(p: Pix, h: Ramp): void {
  const left = piece(p, leftLock(), h, [-26, 60, 5, 16], [-18, 30, 2, 6]);
  const front = piece(p, fringe(), h, [26, 54, 6, 22], [2, 20, 6, 3]);
  if (p.k < 0.6) return;
  p.paint(p.oval(-1, 17.6, 6, 1.6, -0.12), h[L2] ?? 0, front); // the sun-bleached crown
  strand(p, [-4, 19, 8, 18, 15, 30], h[L1] ?? 0, front);
  strand(p, [-2, 25, 6, 30, 9.6, 43], h[L1] ?? 0, front);
  strand(p, [-12, 22, -19, 30, -19.6, 52], h[L1] ?? 0, left);
  strand(p, [3, 29, 11, 33, 13, 46], h[D1] ?? 0, front);
  strand(p, [19, 36, 20.6, 52, 20.2, 66], h[D1] ?? 0, front);
  strand(p, [21.6, 58, 23.6, 66, 26.4, 71], h[L1] ?? 0, front); // a wave at the flick
  strand(p, [-21.6, 58, -23, 66, -25.6, 71.6], h[D1] ?? 0, left);
}

/** The shaggy bob of pilot 1 in any colour (also the builder's "bob"). */
export const BOB: HairArt = {
  back: (p, h) => {
    shaded(p, path().move(-22.6, 74).cubic(-30, 56, -29.5, 20, -12.5, 11.2).cubic(-3.5, 6, 12, 6.2, 20.5, 12)
      .cubic(30, 19.5, 30.5, 56, 23.4, 74).close(), h, [27, 48, 9, 30]);
  },
  front: bobFront,
};

/** Big, slightly tired-looking eyes: a soft shadow line under each (drawn before the eyes). */
function underEyes(p: Pix, clip: Uint8Array): void {
  if (p.k < 0.7) return;
  for (const sd of [-1, 1]) p.paint(p.thick([sd * (EYES.x - 2.6), 57.2, sd * (EYES.x + 2.4), 57], 0), PAL.skinLight[3] ?? 0, clip);
}

function head(p: Pix, r: Rig): void {
  BOB.back?.(p, HAIR, SKIN);
  const fm = face(p, SKIN, FACE, r);
  underEyes(p, fm);
  blush(p, 11.6, 61, 3.4, 2, PAL.rose[3] ?? 0, fm, 0.4);
  eyes(p, r, EYES, SKIN);
  nose(p, SKIN, 55.6, 60.4, 2);
  mouth(p, r, MOUTH, SKIN);
  BOB.front(p, HAIR, SKIN);
  brows(p, r, BROWS); // drawn over the fringe, cartoon style, so the mood always reads
}

/** A lucky fang on a dark cord, swinging between two frames, and a thin gold chain close round the neck. */
export function pendant(p: Pix, phase: number): void {
  const sway = phase === 1 ? 0.8 : -0.4;
  p.paint(p.thick([-6.4, 80.2, -3.6, 84.6, 0, 86.2, 3.6, 84.6, 6.4, 80.2], 0.4), PAL.gold[3] ?? 0);
  p.paint(p.thick([-6.6, 80.6, -2.8, 88, sway, 92.4, 2.8, 88, 6.6, 80.6], 0.4), PAL.leather[1] ?? 0);
  const fang = p.shape(path().move(sway - 1.6, 92.6).quad(sway - 1.9, 98, sway + 0.9, 102.4).quad(sway + 1.9, 97, sway + 1.6, 92.6).close());
  p.paint(fang, PAL.teeth[3] ?? 0);
  p.paint(p.border(fang, 'r'), PAL.teeth[2] ?? 0);
  p.paint(p.oval(sway, 92.4, 1.9, 1), PAL.leather[2] ?? 0);
}

function body(p: Pix, r: Rig): void {
  flightSuit(p, { ramp: PAL.orange, tee: PAL.white[3] ?? 0 }, SKIN);
  roundPatch(p, -26, 99.5, 4.8, PAL.yellow[3] ?? 0, PAL.navy[3] ?? 0);
  p.fill(path().lines([-25.2, 96.2, -27.6, 100, -25.8, 100, -26.8, 103, -24, 98.8, -25.8, 98.8]).close(), PAL.yellow[4] ?? 0);
  pendant(p, r.phase);
}

export const PILOT1: AvatarArt = {
  sky: SKIES.dawn,
  moods: moods(-0.3, { hood: -0.08 }),
  body,
  head,
};
