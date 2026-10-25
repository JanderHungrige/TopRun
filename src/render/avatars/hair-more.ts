import type { Ramp } from '../pixel/palette';
import { path } from '../pixel/path';
import { union, type Mask, type Pix } from '../pixel/raster';
import { part } from '../portraits/hands';
import { D1, D2, L1, L2, piece, shaded, strand } from '../portraits/parts';
import { cap, capPiece } from './hair';
import type { HairArt } from './kit';

/** Fuller hair styles of the avatar builder (doc 29): top bun, curls, two braids — in any hair ramp. */

const PARTED: readonly number[] = [17.8, 44, 16.6, 37, 12, 33.4, 6, 32, 1, 33, -1, 33, -6, 32, -12, 33.4, -16.6, 37, -17.8, 44];

/** Pulled up into a round bun on the crown. */
export const BUN: HairArt = {
  back: (p, h) => {
    const bun = shaded(p, p.oval(0, 8.6, 8, 7.2), h, [6, 12, 5, 5], [-3, 5, 2.6, 1.6]);
    if (p.k >= 0.6) {
      strand(p, [-5.6, 8, -2, 3, 4, 4], h[D1] ?? 0, bun);
      strand(p, [-4, 12, 1, 8, 6, 10], h[L1] ?? 0, bun);
    }
  },
  front: (p, h) => {
    const m = capPiece(p, cap(12, 45, PARTED), h, false);
    p.line(0, 12.6, 0, 32.6, h[D2] ?? 0, m);
    if (p.k >= 0.6) {
      strand(p, [-2, 15, -12, 19, -16.4, 34], h[L1] ?? 0, m);
      strand(p, [2, 15, 12, 19, 16.4, 34], h[D1] ?? 0, m);
    }
    p.paint(p.thick([-5.4, 14.2, 0, 13.2, 5.4, 14.2], 0.9), h[D2] ?? 0); // the band round the bun
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
  for (let y = 7; y < 66; y += 5.6) {
    for (let x = -27 + (y % 2) * 3; x < 28; x += 6.4) {
      n++;
      const [c, r] = p.cell(x + jitter(n) * 3.4, y + jitter(n + 50) * 2.6);
      const flip = jitter(n + 99) > 0 ? 1 : -1;
      for (const [dc, dr, light] of CURL) {
        const cc = c + dc;
        const rr = r + dr * flip;
        if (p.inside(cc, rr) && m[rr * p.w + cc] && (!light || jitter(n + 7) > -0.1)) p.set(cc, rr, (light ? h[L1] : h[D1]) ?? 0);
      }
    }
  }
}

/** A round mass of curls framing the face; a curly fringe over the forehead. */
export const CURLY: HairArt = {
  back: (p, h) => {
    const m = union(p.oval(0, 38, 24.4, 26.6), curls(p, ring(0, 38, 25, 27.4, 16, Math.PI * 0.64, Math.PI * 2.36), 4.8));
    shaded(p, m, h, [30, 46, 10, 34], [-14, 16, 6, 4]);
    curlMarks(p, m, h);
  },
  front: (p, h) => {
    const top = p.shape(cap(10, 52, [18.2, 40, 0, 36, -18.2, 40], 21.4));
    const fringe = curls(p, [-16.6, 38, -12, 36.4, -7.2, 37.6, -2.4, 36.2, 2.4, 37.6, 7.2, 36.4, 12, 37.6, 16.6, 36.6,
      -19.6, 43.4, 19.6, 43, -20.2, 49, 20.2, 49.4], 3.4);
    const m = piece(p, union(top, fringe), h, [22, 40, 7, 16], [-8, 18, 6, 3], D1); // a soft seam into the back curls
    curlMarks(p, m, h);
  },
};

/** One plait from (x, y0) down to y1: stacked, alternating lobes, a tie and a small tuft. */
function braid(p: Pix, x: number, y0: number, y1: number, dx: number, h: Ramp): void {
  const n = Math.max(3, Math.round((y1 - y0) / 4.2));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const cx = x + dx * t + (i % 2 === 0 ? -0.7 : 0.7);
    const cy = y0 + (y1 - y0) * t;
    const lobe = p.oval(cx, cy, 3 - t * 0.6, 2.6, i % 2 === 0 ? 0.5 : -0.5);
    part(p, lobe, h, p.oval(cx + 2.2, cy + 1.2, 2.4, 2.2));
    if (p.k >= 0.7) p.paint(p.oval(cx - 1, cy - 0.8, 0.8, 0.5), h[L2] ?? 0, lobe);
  }
  const ex = x + dx;
  p.paint(p.oval(ex, y1 + 3, 1.8, 1.1), h[D2] ?? 0);
  piece(p, path().move(ex - 1.8, y1 + 3.6).line(ex + 1.8, y1 + 3.6).line(ex + 2.6, y1 + 8.4).line(ex, y1 + 7.2).line(ex - 2.6, y1 + 8.6).close(), h, [ex + 2, y1 + 8, 1.4, 3]);
}

/** Centre parting, hair close to the head, two braids over the shoulders. */
export const BRAIDS: HairArt = {
  front: (p, h) => {
    const m = capPiece(p, cap(11.6, 54, PARTED, 20.8), h, false);
    p.line(0, 12.2, 0, 32.6, h[D2] ?? 0, m);
    if (p.k >= 0.6) {
      strand(p, [-2, 14, -14, 20, -18, 44], h[L1] ?? 0, m);
      strand(p, [2, 14, 14, 20, 18, 44], h[D1] ?? 0, m);
    }
    braid(p, -19.6, 56, 94, -3, h);
    braid(p, 19.6, 56, 90, 3.4, h);
  },
};
