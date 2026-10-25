import type { Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { union, type Mask, type Pix } from '../pixel/raster';
import { D1, D2, L1, L2 } from '../portraits/parts';
import { cap, capPiece } from './hair';
import { clumps, hairPiece, sheen } from './hair-kit';
import type { HairArt } from './kit';
import { FOUR, litPiece } from './light';

/** Fuller hair styles of the avatar builder (doc 29): top bun, curls, two braids — fitted to the realistic head. */

const PARTED: readonly number[] = [15.2, 40, 14.2, 31, 10.4, 28, 5.2, 26.6, 0.8, 27.4, -0.8, 27.4, -5.2, 26.6, -10.4, 28, -14.2, 31, -15.2, 40];

/** Pulled up into a round bun on the crown. */
export const BUN: HairArt = {
  back: (p, h) => {
    const bun = hairPiece(p, p.oval(0, 12.2, 6.4, 5.4), h, { cx: -2, cy: 10.4, rx: 7.4, ry: 6.6 });
    clumps(p, bun, h, [[-4.6, 11.4, -1.4, 7.6, 3.8, 8.4], [-3.4, 14.6, 1, 11.6, 5.2, 13.2]], [[-3.8, 13, 0, 9.6, 4.2, 10.4]]);
  },
  front: (p, h) => {
    const m = capPiece(p, cap(13.6, 43, PARTED), h, false);
    p.line(0, 14.2, 0, 27.2, h[D2] ?? 0, m);
    clumps(p, m, h, [[2, 16, 10, 18, 14, 28]], [[-2, 16, -9, 18, -13, 28]]);
    p.paint(p.thick([-5, 15.6, 0, 14.6, 5, 15.6], 0.8), h[D2] ?? 0); // the band round the bun
  },
};

/** Union of small discs (frame units) — the bumpy outline of curls. */
function curls(p: Pix, spots: readonly number[], r: number): Mask {
  let m = p.blank();
  for (let i = 0; i + 1 < spots.length; i += 2) m = union(m, p.oval(spots[i] ?? 0, spots[i + 1] ?? 0, r, r));
  return m;
}

function ring(cx: number, cy: number, rx: number, ry: number, n: number, a0: number, a1: number): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return out;
}

const jitter = (n: number): number => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s) - 0.5;
};

/** One curl mark in pixels: a dark three-pixel crescent and a light dot above it ([dc, dr, light?]). */
const CURL: readonly (readonly [number, number, boolean])[] = [[-1, 0, false], [0, 1, false], [1, 0, false], [0, -1, true]];

/** Little curl marks scattered over a mask on a jittered grid, set pixel by pixel (cheap). */
function curlMarks(p: Pix, m: Mask, h: Ramp): void {
  if (p.k < 0.6) return;
  let n = 0;
  for (let y = 8; y < 58; y += 4.6) {
    for (let x = -24 + (y % 2) * 2.6; x < 25; x += 5.2) {
      n++;
      const [c, r] = p.cell(x + jitter(n) * 2.8, y + jitter(n + 50) * 2.2);
      const flip = jitter(n + 99) > 0 ? 1 : -1;
      for (const [dc, dr, light] of CURL) {
        const cc = c + dc;
        const rr = r + dr * flip;
        if (p.inside(cc, rr) && m[rr * p.w + cc] && (!light || jitter(n + 7) > -0.1)) p.set(cc, rr, (light ? h[L1] : h[D2]) ?? 0);
      }
    }
  }
}

/** A round mass of curls framing the face; a curly fringe over the forehead. */
export const CURLY: HairArt = {
  back: (p, h) => {
    const m = union(p.oval(0, 36, 22.4, 22.6), curls(p, ring(0, 36, 23, 23.4, 15, Math.PI * 0.66, Math.PI * 2.34), 4.4));
    hairPiece(p, m, h, { cx: -4, cy: 32, rx: 27, ry: 29, flat: 1.1 });
    curlMarks(p, m, h);
  },
  front: (p, h) => {
    const top = p.shape(cap(10.8, 46, [15.2, 34, 0, 30.6, -15.2, 34], 18.8));
    const fringe = curls(p, [-14, 31.6, -9.8, 30.2, -5.4, 31.2, -1, 30, 3.4, 31.2, 7.8, 30.2, 12, 31.2, 15, 30.4,
      -17.2, 37, 17.2, 36.6, -17.8, 42, 17.8, 42.4], 3);
    const m = hairPiece(p, union(top, fringe), h);
    curlMarks(p, m, h);
    sheen(p, m, h, [-14, 20, -6, 13, 4, 13], 1);
  },
};

/** One plait from (x, y0) down to y1: stacked, alternating lobes, a tie and a small tuft. */
function braid(p: Pix, x: number, y0: number, y1: number, dx: number, h: Ramp): void {
  const n = Math.max(3, Math.round((y1 - y0) / 4));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = x + dx * t + (i % 2 === 0 ? -0.6 : 0.6);
    const cy = y0 + (y1 - y0) * t;
    const lobe = p.oval(cx, cy, 2.8 - t * 0.5, 2.4, i % 2 === 0 ? 0.5 : -0.5);
    litPiece(p, lobe, h, { cx: cx - 1.6, cy: cy - 1, rx: 3.4, ry: 3 }, { tones: FOUR });
    if (p.k >= 0.7) p.paint(p.oval(cx - 0.9, cy - 0.8, 0.7, 0.4), h[L2] ?? 0, lobe);
  }
  const ex = x + dx;
  p.paint(p.oval(ex, y1 + 2.8, 1.7, 1), h[D2] ?? 0);
  hairPiece(p, path().move(ex - 1.7, y1 + 3.4).line(ex + 1.7, y1 + 3.4).line(ex + 2.4, y1 + 8).line(ex, y1 + 6.8).line(ex - 2.4, y1 + 8.2).close(), h,
    { cx: ex - 1, cy: y1 + 4, rx: 3, ry: 5 });
}

/** Centre parting, hair close to the head, two braids over the shoulders. */
export const BRAIDS: HairArt = {
  front: (p, h) => {
    const m = capPiece(p, cap(13.2, 50, PARTED, 17.8), h, false);
    p.line(0, 13.8, 0, 27.2, h[D2] ?? 0, m);
    clumps(p, m, h, [[2, 16, 12, 20, 16, 40]], [[-2, 16, -12, 20, -16, 40]]);
    braid(p, -17, 52, 92, -2.4, h);
    braid(p, 17, 52, 88, 2.8, h);
    if (p.k >= 0.6) for (const sd of [-1, 1]) p.paint(p.thick([sd * 15.6, 44, sd * 16.6, 50], 0.6), h[D1] ?? 0);
  },
};
