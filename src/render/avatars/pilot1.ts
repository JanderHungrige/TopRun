import { PAL, type Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { D1 } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { clumps, hairPiece, sheen } from './hair-kit';
import { drawFace, KID_HEAD, type FaceArt } from './head';
import { flightSuit, moods, roundPatch, type AvatarArt, type HairArt } from './kit';
import { glaze } from './light';
import { SKIES } from './skies';

/**
 * Pilot 1, the youngest flyer (doc 08 / 29): a full, shaggy golden bob parted on the left with a heavy fringe swept
 * over the right brow and the right eye's outer corner, the ends flicking out below the jaw; wide-set dark eyes with
 * a hint of shadow under them, faint blond brows, a small serious mouth with full lips, a slightly narrow chin.
 * Orange suit, a lucky fang on a cord and a thin gold chain. Dawn patrol.
 */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairGold;

const FACE: FaceArt = {
  head: { ...KID_HEAD, cheek: 15.4, jaw: 12, chin: 5.3 },
  skin: SKIN,
  eye: { x: 7.7, y: 43.4, w: 6.8, h: 2.8, iris: PAL.irisDark, lid: PAL.hairBrown[1] ?? 0 },
  brow: { x0: 3.2, x1: 11.6, y: 38.4, th: 1.1, color: HAIR[2] ?? 0, attitude: 0.2 },
  nose: { y0: 43, tip: 51.4, w: 1.9 },
  mouth: { y: 58, w: 4.1, line: SKIN[1] ?? 0, upper: PAL.rose[2] ?? 0, lower: PAL.rose[3] ?? 0 },
  warmth: { tint: PAL.skinRuddy[4] ?? 0, level: 0.6 },
};

/** Lock from the parting down the left side over the ear, ending in wavy tips that flick out below the jaw. */
const leftLock = (): Path => path().move(-5, 12.8).cubic(-15.5, 13.6, -21.8, 24, -21.6, 40).cubic(-21.6, 50, -22.6, 57, -25, 63)
  .lines([-22, 61.6, -20.6, 65.4, -18.6, 60.6, -16.8, 63]).cubic(-15.6, 55, -15.8, 46, -14.2, 38)
  .cubic(-13, 31, -10.6, 25.6, -7.2, 22.4).close();

/** Crown sweeping right into the heavy fringe (tips over the right brow and eye corner), then the right lock. */
const fringe = (): Path => path().move(-5, 12.8).cubic(5, 9.6, 17.5, 12.8, 21.4, 23.5).cubic(23.6, 31, 23.2, 44, 23.4, 52)
  .cubic(23.6, 57, 25, 60.4, 27, 63.4).lines([24, 62.6, 22.6, 66, 20.4, 61.4, 18.4, 64]).cubic(17, 57, 17.2, 51, 15.8, 46)
  .lines([14.2, 44.6, 13, 40.2, 10.6, 41.8, 8.6, 37.4, 6, 38.8, 3.8, 34.6, 1.2, 35.2])
  .cubic(-1.6, 31.4, -4.6, 26.4, -6, 21.6).cubic(-6.6, 18.4, -6.2, 15, -5, 12.8).close();

function bobFront(p: Pix, h: Ramp): void {
  const left = hairPiece(p, leftLock(), h);
  const front = hairPiece(p, fringe(), h);
  sheen(p, front, h, [-4, 15.4, 6, 12.6, 15, 17.4]);
  sheen(p, left, h, [-9, 17, -16, 21, -18.4, 31], 1);
  clumps(p, front, h, [[-2, 18, 7, 22, 10, 37], [3, 15, 13, 19, 17.6, 33], [12, 19, 19.6, 30, 20, 52], [-3, 24, 2, 28, 3.6, 34]],
    [[-3, 15.6, 9, 15.4, 16, 25], [18.4, 30, 20.6, 46, 21, 58]]);
  clumps(p, left, h, [[-11, 19, -17, 28, -18.2, 50], [-17.6, 50, -18.6, 58, -21.4, 61.6]], [[-8, 18, -14.6, 26, -15.6, 42]]);
}

/** The shaggy bob of pilot 1 in any colour (also the builder's "bob"). */
export const BOB: HairArt = {
  back: (p, h) => {
    hairPiece(p, path().move(-20.5, 64).cubic(-25.5, 50, -25, 22, -12, 14).cubic(-4, 10.4, 10, 10.6, 17, 14.6)
      .cubic(26, 21, 26, 50, 21.4, 64).close(), h);
  },
  front: bobFront,
};

function head(p: Pix, r: Rig): void {
  BOB.back?.(p, HAIR, SKIN);
  const fm = drawFace(p, r, FACE);
  if (p.k >= 0.7) for (const sd of [-1, 1]) glaze(p, p.oval(sd * 7.4, 46.4, 3, 0.8), SKIN[D1] ?? 0, 0.3, fm); // a hint of tired eyes
  BOB.front(p, HAIR, SKIN);
}

/** A lucky fang on a dark cord, swinging between two frames, and a thin gold chain close round the neck. */
export function pendant(p: Pix, phase: number): void {
  const sway = phase === 1 ? 0.8 : -0.4;
  p.paint(p.thick([-8.2, 75.2, -4.4, 80.6, 0, 82.4, 4.4, 80.6, 8.2, 75.2], 0.4), PAL.gold[3] ?? 0);
  p.paint(p.thick([-8.6, 75.4, -3.4, 85.6, sway, 90.6, 3.4, 85.6, 8.6, 75.4], 0.4), PAL.leather[1] ?? 0);
  const fang = p.shape(path().move(sway - 1.5, 90.8).quad(sway - 1.8, 95.8, sway + 0.8, 100).quad(sway + 1.8, 95, sway + 1.5, 90.8).close());
  p.paint(fang, PAL.teeth[3] ?? 0);
  p.paint(p.border(fang, 'r'), PAL.teeth[1] ?? 0);
  p.paint(p.oval(sway, 90.6, 1.8, 0.9), PAL.leather[2] ?? 0);
}

function body(p: Pix, r: Rig): void {
  flightSuit(p, { ramp: PAL.orange, tee: PAL.white[3] ?? 0 }, SKIN);
  roundPatch(p, -26, 99.5, 4.8, PAL.yellow[3] ?? 0, PAL.navy[3] ?? 0);
  p.fill(path().lines([-25.2, 96.2, -27.6, 100, -25.8, 100, -26.8, 103, -24, 98.8, -25.8, 98.8]).close(), PAL.yellow[4] ?? 0);
  pendant(p, r.phase);
}

export const PILOT1: AvatarArt = {
  sky: SKIES.dawn,
  moods: moods(-0.4, { hood: -0.06 }),
  body,
  head,
  face: FACE,
};
