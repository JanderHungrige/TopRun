import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, type Pix } from '../pixel/raster';
import { box, col, disc, fillPath, hline, seg, shade, vline } from './paint';
import { CART, MUG } from './layout';

// Hangar base (doc 30): the props standing in front of the jet (their own static layer, drawn after it) — the
// red rolling tool cart with drawers, a wrench and the coffee mug on top, and a pair of safety cones.

const R = PAL.red;
const S = PAL.steel;

function cart(p: Pix): void {
  const { x, y, w, base } = CART;
  box(p, x, y, w, base - y - 8, col(R, 3));
  box(p, x, y, w, 4, col(R, 4));
  vline(p, x, y, base - 8, col(R, 4));
  box(p, x + w - 4, y + 4, 4, base - y - 12, col(R, 1));
  for (let d = 0; d < 3; d++) {
    const dy = y + 12 + d * 16;
    hline(p, x + 2, x + w - 4, dy, col(R, 1));
    box(p, x + w / 2 - 10, dy + 6, 20, 2, col(S, 4));
  }
  box(p, x - 4, y - 4, w + 8, 4, col(S, 3));
  hline(p, x - 4, x + w + 4, y - 4, col(S, 5));
  seg(p, x - 4, y - 4, x - 14, y - 30, col(S, 3), 2);
  hline(p, x - 18, x - 10, y - 30, col(S, 4));
  for (const wx of [x + 8, x + w - 8]) {
    disc(p, wx, base - 4, 5, 5, col(PAL.ink, 1));
    disc(p, wx, base - 4, 2, 2, col(S, 3));
  }
  seg(p, x + 6, y - 8, x + 34, y - 6, col(S, 4), 2);
  disc(p, x + 6, y - 8, 3, 3, col(S, 4));
}

function mug(p: Pix): void {
  const W = PAL.white;
  box(p, MUG.x, MUG.y, 10, 11, col(W, 3));
  vline(p, MUG.x + 8, MUG.y, MUG.y + 11, col(W, 2));
  hline(p, MUG.x, MUG.x + 10, MUG.y, col(PAL.jersey, 1));
  box(p, MUG.x + 10, MUG.y + 3, 3, 5, col(W, 2));
  box(p, MUG.x + 2, MUG.y + 5, 5, 3, col(PAL.blue, 3));
}

function cone(p: Pix, x: number, base: number): void {
  const O = PAL.orange;
  box(p, x - 14, base - 4, 28, 4, col(O, 1));
  fillPath(p, path().lines([x - 4, base - 34, x + 4, base - 34, x + 11, base - 4, x - 11, base - 4]).close(), col(O, 3));
  fillPath(p, path().lines([x + 1, base - 34, x + 4, base - 34, x + 11, base - 4, x + 5, base - 4]).close(), col(O, 2));
  hline(p, x - 7, x + 7, base - 20, col(PAL.white, 3));
  hline(p, x - 8, x + 8, base - 18, col(PAL.white, 3));
}

const CONES: readonly (readonly [number, number])[] = [[1062, 614], [1240, 622]];

/** Everything in front of the jet, on a transparent layer. */
export function paintProps(p: Pix): void {
  cart(p);
  mug(p);
  for (const [x, base] of CONES) cone(p, x, base);
}

/** The props' floor shadows (painted into the back layer, under the jet). */
export function paintPropShadows(p: Pix): void {
  const down = (v: number): number => shade(v, -2);
  disc(p, CART.x + CART.w / 2, CART.base, CART.w * 0.7, 6, down, bayer(0.5));
  for (const [x, base] of CONES) disc(p, x, base, 18, 4, down, bayer(0.5));
}
