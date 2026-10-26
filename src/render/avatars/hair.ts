import type { Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import { bayer, type Mask, type Pix } from '../pixel/raster';
import { D1, D2, L1 } from '../portraits/parts';
import { clumps, hairPiece, sheen } from './hair-kit';
import type { HairArt } from './kit';

/**
 * Short hair styles of the avatar builder (doc 29): crop, buzz, side part, ponytail — each a cap over the realistic
 * head (skull top ≈ 17.5, temples ±14.4, ears from y ≈ 43) with its own hairline, lit as one volume.
 */

/** A cap over the skull: the outer line from the left temple over the crown (`top`) to the right temple, down to
 *  `low`; back along the hairline (points right → left). */
export function cap(top: number, low: number, hairline: readonly number[], side = 17.4): Path {
  return path().move(-side, low).cubic(-side - 2.2, 26, -14, top + 1, 0, top).cubic(14, top + 1, side + 2.2, 26, side, low)
    .line(15, low).lines(hairline).line(-15, low).close();
}

/** A lit cap with a sheen on the crown and a few partings between clumps. */
export function capPiece(p: Pix, shape: Path, h: Ramp, strands = true): Mask {
  const m = hairPiece(p, shape, h);
  sheen(p, m, h, [-10, 19, -2, 14, 7, 15.4], 1.2);
  if (strands) clumps(p, m, h, [[3, 15, 10, 19, 13, 28], [-4, 16, -10, 20, -13, 29]], [[-2, 15.6, -8, 18, -11, 25]]);
  return m;
}

const CROP_LINE: readonly number[] = [
  15.2, 38, 14.6, 31, 11.4, 31.4, 9, 33, 6, 30.8, 3, 32.6, 0, 30.4, -3, 32.2, -6.2, 30, -9.2, 31.8, -12.4, 30.4, -14.6, 32.4, -15.2, 38,
];

/** Short crop with a soft, textured fringe falling onto the forehead; the ears show. */
export const CROP: HairArt = {
  front: (p, h) => {
    const m = capPiece(p, cap(12, 43, CROP_LINE, 18.2), h, false);
    clumps(p, m, h, [[-3, 14, 0, 22, -1, 30], [4, 14, 8, 22, 7.6, 31], [-9, 16, -10, 24, -11.6, 30], [11, 18, 14, 24, 14, 30]],
      [[-6, 15, -6.6, 22, -7, 29], [1, 14, 3, 22, 3.4, 30]]);
  },
};

/** Buzz cut: a close cap, speckled like stubble, with a soft hairline the skin shows through. */
export const BUZZ: HairArt = {
  front: (p, h, s) => {
    const m = hairPiece(p, cap(15.6, 41.5, [15, 36, 13.6, 29.8, 7, 27.6, 0, 27.2, -7, 27.6, -13.6, 29.8, -15, 36], 16.2), h);
    p.paint(m, h[L1] ?? 0, undefined, bayer(0.1));
    p.paint(m, h[D1] ?? 0, undefined, (c, r) => bayer(0.12)(c + 2, r + 1));
    p.paint(p.border(m, 'd'), s[D1] ?? 0, undefined, bayer(0.5));
  },
};

const SIDE_LINE: readonly number[] = [
  15.2, 38, 14.6, 32.4, 12, 32, 9, 29.4, 5.4, 28.6, 1.6, 27, -2.4, 26, -6.2, 25.6, -10.4, 26.8, -13.6, 29.4, -15.2, 38,
];

/** Neat side parting on the left with the top swept over to the right. */
export const SIDE_PART: HairArt = {
  front: (p, h) => {
    const m = capPiece(p, cap(12, 43, SIDE_LINE), h, false);
    const swoop = hairPiece(p, path().move(-6.8, 10.6).cubic(4, 6.6, 17.4, 9.6, 19.6, 19.6).cubic(20.2, 24.6, 18.4, 28.4, 15.6, 31.2)
      .cubic(11, 30.8, 4, 30, -1.2, 29.2).cubic(-5, 26.4, -7.2, 19, -6.8, 10.6).close(), h);
    p.line(-6.8, 11.2, -7.6, 23, h[D2] ?? 0, m);
    sheen(p, swoop, h, [-4, 12, 5, 9.4, 14, 15], 1.1);
    clumps(p, swoop, h, [[-3, 18, 6, 18, 15, 26], [-1, 23, 8, 23, 15.6, 30]], [[-5, 14, 6, 12.6, 15, 20]]);
  },
};

const SLEEK_LINE: readonly number[] = [
  15.2, 38, 14.2, 31, 10.4, 28.2, 5.2, 26.8, 0.8, 27.6, -0.8, 27.6, -5.2, 26.8, -10.4, 28.2, -14.2, 31, -15.2, 38,
];

/** Hair pulled back smooth from a centre parting into a ponytail swinging out on the right. */
export const PONYTAIL: HairArt = {
  back: (p, h) => {
    const tail = hairPiece(p, path().move(11, 16).cubic(23, 12.4, 28, 25, 25.4, 41).cubic(23.6, 52, 25.4, 61, 22.6, 70)
      .lines([20.4, 66.6, 19.4, 71, 18.2, 62.8]).cubic(19.8, 52, 20, 40, 16.4, 29).close(), h);
    clumps(p, tail, h, [[21, 28, 24, 46, 21, 66]], [[19, 30, 22, 44, 20, 58]]);
  },
  front: (p, h) => {
    const m = capPiece(p, cap(13.2, 43, SLEEK_LINE), h, false);
    p.line(0, 13.8, 0, 27.4, h[D2] ?? 0, m);
    clumps(p, m, h, [[2, 16, 10, 18, 14, 28]], [[-2, 16, -9, 18, -13, 28]]);
    p.paint(p.oval(17.8, 21.8, 2.2, 1.8, 0.6), h[D2] ?? 0); // the hair tie
  },
};
