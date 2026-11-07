import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, type Pix } from '../pixel/raster';
import { box, col, disc, fillPath, hline, seg, shade, vline } from './paint';
import { CART, MUG, TV, TV_CART, TV_SCREEN, VCR } from './layout';

// Hangar base (docs 30, 63): the props standing in front of the jet (their own static layer, drawn after it) — the
// red rolling tool cart with drawers, a wrench and the coffee mug on top, a pair of safety cones, and in front of the
// rec room the TV cart: an old CRT on a video recorder, tapes on the lower shelf.

const R = PAL.red;
const S = PAL.steel;
const J = PAL.jersey;

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

/** The rolling steel AV cart: two shelves, legs, castors; VHS tapes on the lower shelf. */
function tvCart(p: Pix): void {
  const { x, y, w, base } = TV_CART;
  box(p, x - 2, y, w + 4, 4, col(S, 3));
  hline(p, x - 2, x + w + 2, y, col(S, 5));
  box(p, x - 2, y + 34, w + 4, 4, col(S, 3));
  hline(p, x - 2, x + w + 2, y + 34, col(S, 5));
  for (const lx of [x, x + w - 4]) box(p, lx, y, 4, base - y - 6, col(S, 2));
  for (const [i, c] of [[0, PAL.ink], [1, PAL.navy], [2, PAL.ink]] as const) {
    const ty = y + 28 - i * 7;
    box(p, x + 10 + i * 3, ty, 50, 6, col(c, 1));
    box(p, x + 24 + i * 3, ty + 1, 22, 4, col(PAL.white, 3));
  }
  for (const wx of [x + 4, x + w - 4]) {
    disc(p, wx, base - 4, 5, 5, col(PAL.ink, 1));
    disc(p, wx, base - 4, 2, 2, col(S, 3));
  }
}

/** The video recorder: a black box with the tape slot, buttons and the clock's window (lit in ambient). */
function vcr(p: Pix): void {
  const { x, y, w, h } = VCR;
  box(p, x, y, w, h, col(PAL.ink, 1));
  hline(p, x, x + w, y, col(S, 2));
  box(p, x + 6, y + 4, 26, 3, col(PAL.ink, 0));
  box(p, x + 44, y + 4, 18, 6, col(PAL.ink, 0));
  for (let i = 0; i < 4; i++) box(p, x + 8 + i * 6, y + 9, 4, 2, col(S, 3));
}

/** The CRT: a wood-grain cabinet, the bulging screen, two dials and a speaker grille, rabbit-ear antennas. */
function tv(p: Pix): void {
  const { x, y, w, h } = TV;
  const sc = TV_SCREEN;
  seg(p, x + 22, y, x + 8, y - 26, col(S, 4), 1);
  seg(p, x + 26, y, x + 40, y - 24, col(S, 4), 1);
  disc(p, x + 8, y - 26, 2, 2, col(S, 5));
  disc(p, x + 40, y - 24, 2, 2, col(S, 5));
  box(p, x + 18, y - 3, 12, 4, col(PAL.ink, 2));
  box(p, x, y, w, h, col(J, 3));
  for (let gy = y + 6; gy < y + h - 4; gy += 7) hline(p, x + 2, x + w - 2, gy, col(J, 2));
  hline(p, x, x + w, y, col(J, 5));
  vline(p, x + w - 1, y, y + h, col(J, 1));
  box(p, sc.x - 2, sc.y - 2, sc.w + 4, sc.h + 4, col(PAL.ink, 1));
  box(p, sc.x, sc.y, sc.w, sc.h, col(PAL.glass, 2));
  box(p, x + sc.w + 9, y + 4, 12, h - 8, col(J, 1));
  for (const dy of [12, 26]) {
    disc(p, x + sc.w + 15, y + dy, 4, 4, col(S, 2));
    disc(p, x + sc.w + 15, y + dy, 2, 2, col(S, 4));
  }
  for (let gy = y + 38; gy < y + h - 6; gy += 4) hline(p, x + sc.w + 11, x + sc.w + 19, gy, col(PAL.ink, 1));
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

/** The TV on its cart with the video recorder (doc 63) — also the docks' TV (doc 73), moved there. */
export function paintTvSet(p: Pix): void {
  tvCart(p);
  vcr(p);
  tv(p);
}

/** Everything in front of the jet, on a transparent layer. */
export function paintProps(p: Pix): void {
  cart(p);
  mug(p);
  paintTvSet(p);
  for (const [x, base] of CONES) cone(p, x, base);
}

/** The props' floor shadows (painted into the back layer, under the jet). */
export function paintPropShadows(p: Pix): void {
  const down = (v: number): number => shade(v, -2);
  disc(p, CART.x + CART.w / 2, CART.base, CART.w * 0.7, 6, down, bayer(0.5));
  disc(p, TV_CART.x + TV_CART.w / 2, TV_CART.base, TV_CART.w * 0.7, 5, down, bayer(0.5));
  for (const [x, base] of CONES) disc(p, x, base, 18, 4, down, bayer(0.5));
}
