import type { Ramp } from '../pixel/palette';
import { path, type Path } from '../pixel/path';
import { bayer, type Mask, type Pix } from '../pixel/raster';
import { D1, D2, L1, L2, piece, shaded, strand } from '../portraits/parts';
import type { HairArt } from './kit';

/**
 * Short hair styles of the avatar builder (doc 29): crop, buzz, side part, ponytail — each a cap over the skull with
 * its own hairline, in any hair ramp. Same 100×120 frame and light (from the upper left) as the presets.
 */

/** A cap over the skull: the outer line from the left temple over the crown (top y) to the right temple, down to
 *  `low`; back along the hairline (points right → left). */
export function cap(top: number, low: number, hairline: readonly number[], side = 20.2): Path {
  return path().move(-side, low).cubic(-side - 2.4, 30, -16, top + 1, 0, top).cubic(16, top + 1, side + 2.4, 30, side, low)
    .line(18.2, low).lines(hairline).line(-18.2, low).close();
}

/** Paints a cap in the hair ramp with a shadow down the right, a crown highlight and a few strands. */
export function capPiece(p: Pix, shape: Path, h: Ramp, strands = true): Mask {
  const m = piece(p, shape, h, [21, 34, 7, 22], [-7, 16, 6, 2.6]);
  if (strands && p.k >= 0.6) {
    strand(p, [-10, 16, -15, 22, -16.6, 34], h[L1] ?? 0, m);
    strand(p, [4, 14, 12, 18, 15.6, 30], h[D1] ?? 0, m);
    strand(p, [-2, 13, 2, 22, 1, 32], h[D1] ?? 0, m);
  }
  return m;
}

const CROP_LINE: readonly number[] = [
  17.8, 42, 16.4, 37.6, 12, 36.4, 9.6, 38.6, 6.4, 35.6, 3, 37.8, -0.6, 35.2, -4, 37.4, -7.6, 35.4, -11, 37, -14.6, 35.8, -16.6, 38.4, -17.8, 42,
];

/** Short crop with a soft, notched fringe; the ears show. */
export const CROP: HairArt = {
  front: (p, h) => { capPiece(p, cap(11.4, 46, CROP_LINE), h); },
};

/** Buzz cut: a close cap over a small skull, speckled like stubble, with a soft hairline the skin shows through. */
export const BUZZ: HairArt = {
  front: (p, h, s) => {
    const m = p.shape(cap(14.4, 45, [17.6, 40, 15.4, 35, 8, 32.6, 0, 32, -8, 32.6, -15.4, 35, -17.6, 40], 19.4));
    shaded(p, m, h, [21, 34, 7, 18]);
    p.paint(m, h[L1] ?? 0, undefined, bayer(0.12));
    p.paint(p.oval(-6, 19.6, 7, 3), h[L1] ?? 0, m, bayer(0.4));
    p.paint(p.border(m, 'd'), s[D1] ?? 0, undefined, bayer(0.5));
  },
};

const SIDE_LINE: readonly number[] = [
  17.8, 42, 16.8, 38, 13.6, 39.4, 10.4, 36.2, 6.6, 35.2, 2.6, 33.8, -1.4, 32.6, -5.4, 31.6, -9.4, 31.4, -13.4, 32.6, -16.4, 36, -17.8, 42,
];

/** Neat side parting on the left with the top swept over to the right. */
export const SIDE_PART: HairArt = {
  front: (p, h) => {
    const m = capPiece(p, cap(10, 46, SIDE_LINE), h, false);
    const swoop = piece(p, path().move(-8.4, 11).cubic(4, 6.4, 18.4, 10, 21.6, 21.4).cubic(22.2, 27, 20, 31, 17, 34.6)
      .cubic(12, 34, 4, 33, -1.6, 32.4).cubic(-6, 29.6, -8.6, 21, -8.4, 11).close(), h, [20, 30, 6, 10], [2, 13, 7, 2]);
    p.line(-8.4, 11.6, -9.2, 25, h[D2] ?? 0, m);
    if (p.k >= 0.6) {
      strand(p, [-6, 14, 6, 12, 16, 22], h[L2] ?? 0, swoop);
      strand(p, [-4, 20, 6, 22, 14, 31], h[D1] ?? 0, swoop);
    }
  },
};

const SLEEK_LINE: readonly number[] = [17.8, 42, 16.6, 37, 12, 33.6, 6, 32, 1, 33, -1, 33, -6, 32, -12, 33.6, -16.6, 37, -17.8, 42];

/** Hair pulled back smooth from a centre parting into a ponytail swinging out on the right. */
export const PONYTAIL: HairArt = {
  back: (p, h) => {
    const tail = piece(p, path().move(12, 18).cubic(26, 14, 31.4, 28, 28.4, 46).cubic(26.4, 58, 28.6, 68, 25.4, 79)
      .lines([22.8, 74.6, 21.6, 80, 20.2, 70.6]).cubic(22, 58, 22.2, 44, 18, 32).close(), h, [30, 60, 4, 30], [24, 34, 1.4, 6]);
    if (p.k >= 0.6) strand(p, [24, 30, 26.6, 50, 23.6, 72], h[D1] ?? 0, tail);
  },
  front: (p, h) => {
    const m = capPiece(p, cap(11, 45, SLEEK_LINE), h, false);
    p.line(0, 11.6, 0, 32.6, h[D2] ?? 0, m);
    if (p.k >= 0.6) {
      strand(p, [-2, 14, -12, 18, -16.4, 34], h[L1] ?? 0, m);
      strand(p, [2, 14, 12, 18, 16.4, 34], h[D1] ?? 0, m);
    }
    p.paint(p.oval(21.4, 24.4, 2.4, 2, 0.6), h[D2] ?? 0); // the hair tie
  },
};
