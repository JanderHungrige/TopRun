import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, checker, minus, type Pix } from '../pixel/raster';
import { fill, oval, paintIn, rect, thick } from '../rooms-pixel';

// Locker (doc 31): the props of the locker room backdrop — the white peaked cap and the flight helmet on the
// shelf, the hanger hook on the rod, the open door seen at an angle (vents, mirror, a jet sticker) and the bench.
// Generic kit only: no badges, no insignia.

const v = (ramp: readonly number[], i: number): number => ramp[i] ?? 0;
const SHELF = 98;

/** White peaked cap, black visor, gold chin strap; no badge. */
export function cap(p: Pix): void {
  const W = PAL.white;
  const band = fill(p, path().lines([236, 76, 344, 76, 340, 94, 240, 94]).close(), v(PAL.ink, 1));
  rect(p, 236, 84, 108, 3, v(PAL.gold, 3), band);
  rect(p, 236, 84, 108, 1, v(PAL.gold, 5), band);
  const crown = fill(p, path().ellipse(290, 74, 70, 14), v(W, 3));
  fill(p, path().ellipse(282, 70, 52, 8), v(W, 4), crown);
  fill(p, path().ellipse(274, 68, 26, 4), v(W, 5), crown);
  rect(p, 200, 80, 200, 10, v(W, 2), crown);
  fill(p, path().ellipse(292, 89, 72, 4), v(W, 2), crown, checker);
  fill(p, path().lines([246, 90, 334, 90, 346, SHELF - 1, 236, SHELF - 1]).close(), v(PAL.glass, 1));
  fill(p, path().lines([256, 91, 300, 91, 296, 93, 252, 93]).close(), v(PAL.glass, 5));
  for (const x of [240, 340]) oval(p, x, 85, 2.5, 2.5, v(PAL.gold, 4));
}

/** Flight helmet: white shell with a yellow stripe, smoked visor cover. */
export function helmet(p: Pix): void {
  const H = PAL.helmet;
  const shell = fill(p, path().move(566, SHELF).quad(566, 46, 622, 44).quad(680, 46, 680, SHELF).close(), v(H, 4));
  fill(p, path().ellipse(604, 62, 26, 12), v(H, 5), shell);
  rect(p, 660, 40, 30, 60, v(H, 3), shell);
  rect(p, 616, 40, 8, 60, v(PAL.yellow, 3), shell);
  const visor = fill(p, path().move(572, 76).quad(622, 66, 676, 76).line(674, 90).quad(622, 82, 574, 90).close(), v(PAL.glass, 2), shell);
  fill(p, path().lines([586, 76, 608, 72, 606, 76, 588, 80]).close(), v(PAL.glass, 5), visor);
  rect(p, 566, 92, 114, 6, v(H, 2), shell);
}

/** The hanger hook curling over the rod and dropping into the collar. */
export function hook(p: Pix): void {
  const S = PAL.steel;
  thick(p, [443, 136, 441, 128, 446, 121, 454, 121, 459, 128, 457, 134], 1.6, v(S, 5));
  thick(p, [450, 136, 450, 152], 1.6, v(S, 4));
  thick(p, [450, 140, 450, 152], 0.6, v(S, 2));
}

/** A point on the open door: u across (0 hinge … 1 free edge), w down (0 top … 1 bottom). */
function dp(u: number, w: number): [number, number] {
  const hx = 170;
  const hy = 20 + w * 646;
  const fx = 58;
  const fy = 2 + w * 694;
  return [hx + (fx - hx) * u, hy + (fy - hy) * u];
}

function quad(u0: number, w0: number, u1: number, w1: number): number[] {
  return [...dp(u0, w0), ...dp(u1, w0), ...dp(u1, w1), ...dp(u0, w1)];
}

function mirror(p: Pix): void {
  fill(p, path().lines(quad(0.22, 0.2, 0.78, 0.36)).close(), v(PAL.steel, 4));
  const glass = fill(p, path().lines(quad(0.28, 0.215, 0.72, 0.345)).close(), v(PAL.lens, 1));
  fill(p, path().lines([...dp(0.3, 0.22), ...dp(0.5, 0.22), ...dp(0.34, 0.34), ...dp(0.3, 0.34)]).close(), v(PAL.lens, 2), glass);
  fill(p, path().lines([...dp(0.56, 0.22), ...dp(0.62, 0.22), ...dp(0.42, 0.34), ...dp(0.38, 0.34)]).close(), v(PAL.lens, 3), glass, checker);
}

function sticker(p: Pix): void {
  const [cx, cy] = dp(0.5, 0.52);
  oval(p, cx, cy, 22, 30, v(PAL.yellow, 3));
  oval(p, cx, cy, 18, 26, v(PAL.navy, 2));
  const jet = path().lines([cx - 3, cy - 16, cx + 3, cy - 16, cx + 3, cy - 2, cx + 13, cy + 6, cx + 13, cy + 9, cx + 3, cy + 6,
    cx + 3, cy + 13, cx + 7, cy + 17, cx - 7, cy + 17, cx - 3, cy + 13, cx - 3, cy + 6, cx - 13, cy + 9, cx - 13, cy + 6, cx - 3, cy - 2]).close();
  fill(p, jet, v(PAL.white, 3));
}

/** The open door swung out to the left, its inside face towards us. */
export function door(p: Pix): void {
  const S = PAL.sage;
  const box = [50, 0, 176, 700] as const;
  const face = fill(p, path().lines(quad(0, 0, 1, 1)).close(), v(S, 2));
  fill(p, path().lines(quad(0.06, 0.02, 0.94, 0.98)).close(), v(S, 3), face);
  paintIn(p, minus(face, p.shape(path().lines(quad(0, 0, 0.55, 1)).close())), v(S, 2), box, face, bayer(0.5));
  for (const w0 of [0.06, 0.8]) {
    for (let i = 0; i < 5; i++) fill(p, path().lines(quad(0.2, w0 + i * 0.018, 0.8, w0 + i * 0.018 + 0.007)).close(), v(S, 0), face);
  }
  mirror(p);
  sticker(p);
  fill(p, path().lines(quad(0.04, 0.47, 0.12, 0.6)).close(), v(PAL.steel, 4));
  fill(p, path().lines([...dp(1, 0), 52, 4, 52, 696, ...dp(1, 1)]).close(), v(S, 1));
  for (const w of [0.12, 0.5, 0.88]) rect(p, 166, 20 + w * 646 - 14, 8, 28, v(PAL.steel, 3));
  paintIn(p, p.border(face), v(S, 0), box);
}

/** The locker-room bench in front: a wooden seat on steel legs. */
export function bench(p: Pix): void {
  const L = PAL.leather;
  for (const x of [40, 400, 740]) {
    rect(p, x, 690, 10, 30, v(PAL.steel, 2));
    rect(p, x, 690, 3, 30, v(PAL.steel, 4));
  }
  rect(p, -10, 704, 820, 16, v(PAL.ink, 1), undefined, checker);
  rect(p, -10, 674, 820, 9, v(L, 4));
  for (let x = 20; x < 800; x += 140) rect(p, x, 677, 70, 1.5, v(L, 3));
  rect(p, -10, 674, 820, 2, v(L, 5));
  rect(p, -10, 683, 820, 9, v(L, 3));
  rect(p, -10, 690, 820, 2, v(L, 1));
  rect(p, -10, 674, 820, 1, v(L, 0));
}
