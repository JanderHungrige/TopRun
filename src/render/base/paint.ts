import { PAL, PALETTE_SIZE, type Ramp } from '../pixel/palette';
import type { Path } from '../pixel/path';
import type { Mask, Pattern, Pix } from '../pixel/raster';

// Hangar base (doc 30): fast paint helpers for the big static layers. `Pix.paint` walks the whole buffer per
// shape; these only touch the pixels in a shape's bounding box, so a full hangar layer stays cheap to build.
// Frame units are logical px (art = frame · k); a pixel belongs to a shape when its centre does.

/** Palette index `i` of a ramp. */
export const col = (ramp: Ramp, i: number): number => ramp[i] ?? 0;

/** Deterministic 0 … 1 noise for animation timing. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const LIGHTER = new Uint16Array(PALETTE_SIZE);
const DARKER = new Uint16Array(PALETTE_SIZE);
for (const ramp of Object.values(PAL)) {
  ramp.forEach((idx, i) => {
    LIGHTER[idx] = ramp[Math.min(ramp.length - 1, i + 1)] ?? idx;
    DARKER[idx] = ramp[Math.max(1, i - 1)] ?? idx;
  });
}

/** A palette index moved `steps` along its own ramp (lighter > 0, darker < 0); 0 stays transparent. */
export function shade(v: number, steps: number): number {
  let out = v;
  for (let s = 0; s < Math.abs(steps); s++) out = (steps > 0 ? LIGHTER[out] : DARKER[out]) ?? out;
  return out;
}

/** Art-pixel range [a, b) of the frame interval [v, v + len): at least one pixel when len > 0. */
function range(o: number, k: number, v: number, len: number, max: number): [number, number] {
  const a = Math.ceil(o + v * k - 0.5);
  let b = Math.ceil(o + (v + len) * k - 0.5);
  if (len > 0 && b <= a) b = a + 1;
  return [Math.max(0, a), Math.min(max, b)];
}

/** Rectangle fill in frame units. */
export function box(p: Pix, x: number, y: number, w: number, h: number, v: number, pat?: Pattern): void {
  const [c0, c1] = range(p.ox, p.k, x, w, p.w);
  const [r0, r1] = range(p.oy, p.k, y, h, p.h);
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) if (!pat || pat(c, r)) p.data[r * p.w + c] = v;
  }
}

/** Rectangle fill in art pixels. */
export function pbox(p: Pix, c0: number, r0: number, w: number, h: number, v: number, pat?: Pattern): void {
  for (let r = Math.max(0, r0); r < Math.min(p.h, r0 + h); r++) {
    for (let c = Math.max(0, c0); c < Math.min(p.w, c0 + w); c++) if (!pat || pat(c, r)) p.data[r * p.w + c] = v;
  }
}

/** One art pixel tall / wide lines in frame units. */
export const hline = (p: Pix, x0: number, x1: number, y: number, v: number, pat?: Pattern): void => box(p, x0, y, x1 - x0, 1e-6, v, pat);
export const vline = (p: Pix, x: number, y0: number, y1: number, v: number, pat?: Pattern): void => box(p, x, y0, 1e-6, y1 - y0, v, pat);

/** Relights a frame rect along each pixel's own ramp. */
export function relight(p: Pix, x: number, y: number, w: number, h: number, steps: number, pat?: Pattern): void {
  const [c0, c1] = range(p.ox, p.k, x, w, p.w);
  const [r0, r1] = range(p.oy, p.k, y, h, p.h);
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) {
      const i = r * p.w + c;
      if (!pat || pat(c, r)) p.data[i] = shade(p.data[i] ?? 0, steps);
    }
  }
}

/** Bounding art-pixel box of a path. */
function bounds(p: Pix, pa: Path): [number, number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const poly of pa.polys) {
    for (let i = 0; i + 1 < poly.length; i += 2) {
      x0 = Math.min(x0, p.X(poly[i] ?? 0));
      x1 = Math.max(x1, p.X(poly[i] ?? 0));
      y0 = Math.min(y0, p.Y(poly[i + 1] ?? 0));
      y1 = Math.max(y1, p.Y(poly[i + 1] ?? 0));
    }
  }
  return [Math.max(0, Math.floor(x0)), Math.min(p.w, Math.ceil(x1) + 1), Math.max(0, Math.floor(y0)), Math.min(p.h, Math.ceil(y1) + 1)];
}

function eachIn(p: Pix, m: Mask, pa: Path, fn: (i: number, c: number, r: number) => void): void {
  const [c0, c1, r0, r1] = bounds(p, pa);
  for (let r = r0; r < r1; r++) {
    for (let c = c0; c < c1; c++) if (m[r * p.w + c]) fn(r * p.w + c, c, r);
  }
}

/** Fills a path (nonzero, pixel centres). */
export function fillPath(p: Pix, pa: Path, v: number, pat?: Pattern): Mask {
  const m = p.shape(pa);
  eachIn(p, m, pa, (i, c, r) => {
    if (!pat || pat(c, r)) p.data[i] = v;
  });
  return m;
}

/** Relights the pixels inside a path. */
export function lightPath(p: Pix, pa: Path, steps: number, pat?: Pattern): void {
  const m = p.shape(pa);
  eachIn(p, m, pa, (i, c, r) => {
    if (!pat || pat(c, r)) p.data[i] = shade(p.data[i] ?? 0, steps);
  });
}

/** Filled ellipse in frame units (direct, no buffer-sized mask). */
export function disc(p: Pix, cx: number, cy: number, rx: number, ry: number, v: number | ((old: number) => number), pat?: Pattern): void {
  const x = p.X(cx);
  const y = p.Y(cy);
  const ax = Math.max(0.5, rx * p.k);
  const ay = Math.max(0.5, ry * p.k);
  for (let r = Math.max(0, Math.floor(y - ay)); r <= Math.min(p.h - 1, Math.ceil(y + ay)); r++) {
    for (let c = Math.max(0, Math.floor(x - ax)); c <= Math.min(p.w - 1, Math.ceil(x + ax)); c++) {
      const u = (c + 0.5 - x) / ax;
      const w = (r + 0.5 - y) / ay;
      if (u * u + w * w > 1 || (pat && !pat(c, r))) continue;
      const i = r * p.w + c;
      p.data[i] = typeof v === 'number' ? v : v(p.data[i] ?? 0);
    }
  }
}

/** A Bresenham line between frame points, `thick` art pixels wide (extra rows below). */
export function seg(p: Pix, x0: number, y0: number, x1: number, y1: number, v: number, thick = 1): void {
  let c = p.col(x0);
  let r = p.row(y0);
  const c1 = p.col(x1);
  const r1 = p.row(y1);
  const dc = Math.abs(c1 - c);
  const dr = -Math.abs(r1 - r);
  const sc = c < c1 ? 1 : -1;
  const sr = r < r1 ? 1 : -1;
  let err = dc + dr;
  for (;;) {
    for (let t = 0; t < thick; t++) p.set(c, r + t, v);
    if (c === c1 && r === r1) return;
    const e2 = 2 * err;
    if (e2 >= dr) { err += dr; c += sc; }
    if (e2 <= dc) { err += dc; r += sr; }
  }
}
