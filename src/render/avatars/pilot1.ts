import { PAL } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import type { Pix } from '../pixel/raster';
import { brows, eyes, mouth, nose, type Brows, type Eyes, type Mouth } from '../portraits/features';
import { blush, D1, face, L1, piece, shaded, strand, type Face } from '../portraits/parts';
import type { Rig } from '../portraits/types';
import { flightSuit, moods, roundPatch, type AvatarArt } from './kit';

/** Pilot 1, the youngest flyer, in pixel art: shaggy golden bob with a side-swept fringe, big dark eyes, a lucky fang on a cord. Dawn patrol. */

const SKIN = PAL.skinPale;
const HAIR = PAL.hairGold;
const FACE: Face = { w: 18.4, jaw: 12.8, top: 26, chin: 73.5 };
const EYES: Eyes = { x: 7.6, y: 52, rx: 4.2, ry: 3.4, iris: PAL.irisBrown };
const BROWS: Brows = { x0: 3, x1: 12, y: 45.6, th: 1.9, color: HAIR[1] ?? 0, bias: -0.6 };
const MOUTH: Mouth = { y: 65.6, w: 5 };

/** Lock from the parting down the left side, ending in shaggy tips below the jaw. */
const leftLock = (): Path => path().move(-6.4, 16.5).cubic(-17, 17.5, -23.4, 31, -23, 50).line(-23.8, 71.5)
  .lines([-20.6, 67.6, -18.6, 72.4, -16.2, 66.2]).cubic(-16.8, 56, -17, 44, -14.2, 36).cubic(-12.6, 31, -10.4, 27, -8.2, 25.4).close();

/** Crown sweeping right into the fringe: tips dip over the right brow, then the lock falls past the jaw. */
const fringe = (): Path => path().move(-6.4, 16.5).cubic(4, 12.5, 17, 16, 21.2, 27.5).cubic(23.6, 36, 23, 50, 23.2, 60)
  .lines([23.9, 71.5, 20.8, 67.6, 18.8, 72.4, 16.4, 66.2]).cubic(16.8, 58, 17.2, 53, 15.6, 48.6)
  .lines([13.6, 51.6, 11.2, 46.4, 7.6, 49.4, 5.2, 43.6]).cubic(0, 38, -5.4, 33, -7.6, 27).cubic(-8.2, 23, -7.8, 19, -6.4, 16.5).close();

function head(p: Pix, r: Rig): void {
  shaded(p, path().move(-21.5, 70).cubic(-28, 52, -27.5, 21, -12, 12.5).cubic(-3, 7.5, 11, 7.5, 19.5, 13.5)
    .cubic(28.5, 21, 28, 52, 21.5, 70).close(), HAIR, [27, 46, 9, 30]);
  const fm = face(p, SKIN, FACE, r);
  blush(p, 11.4, 60.6, 3.6, 2.2, PAL.rose[3] ?? 0, fm, 0.5);
  eyes(p, r, EYES, SKIN);
  nose(p, SKIN, 55, 60, 2.2);
  mouth(p, r, MOUTH, SKIN);
  const left = piece(p, leftLock(), HAIR, [-26, 60, 5, 16], [-18, 30, 2, 6]);
  const front = piece(p, fringe(), HAIR, [26, 52, 6, 20], [2, 20, 6, 3]);
  if (p.k >= 0.6) {
    strand(p, [-4, 19, 8, 18, 15, 30], HAIR[L1] ?? 0, front);
    strand(p, [-2, 25, 6, 30, 9.6, 44], HAIR[L1] ?? 0, front);
    strand(p, [-12, 22, -19, 30, -19.6, 52], HAIR[L1] ?? 0, left);
    strand(p, [3, 29, 11, 33, 13.4, 47], HAIR[D1] ?? 0, front);
    strand(p, [19, 36, 20.4, 52, 20.4, 66], HAIR[D1] ?? 0, front);
  }
  brows(p, r, BROWS); // drawn over the fringe, cartoon style, so the mood always reads
}

/** A lucky fang on a dark cord, swinging between two frames. */
function pendant(p: Pix, phase: number): void {
  const sway = phase === 1 ? 0.8 : -0.4;
  p.paint(p.thick([-6, 80.6, -2.6, 88, sway, 92.4, 2.6, 88, 6, 80.6], 0.4), PAL.leather[1] ?? 0);
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
  sky: {
    grad: [PAL.dawn[1] ?? 0, PAL.dawn[2] ?? 0, PAL.dawn[3] ?? 0, PAL.dawn[4] ?? 0, PAL.dawn[5] ?? 0],
    ramp: PAL.dawn, sea: PAL.seaDawn, sun: PAL.dawn[6] ?? 0, cloud: PAL.dawn[4] ?? 0,
    sunX: -30, sunY: 74, sunR: 7, island: 1,
  },
  moods: moods(-0.25),
  body,
  head,
};
