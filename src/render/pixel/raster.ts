import type { Path } from './path';

// Pixel pipeline (doc 20): an indexed pixel buffer at art resolution. Shapes are given in frame units and
// mapped by art = o + frame · k; a pixel belongs to a shape when its centre does (no anti-aliasing), so every
// edge is a clean pixel step. Value 0 is transparent; everything else is a palette index (palette.ts).

export type Mask = Uint8Array;
export type Pattern = (c: number, r: number) => boolean;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** 4×4 ordered dither: true on about `level` (0 … 1) of the pixels. */
export const bayer = (level: number): Pattern => (c, r) => (BAYER[(r & 3) * 4 + (c & 3)] ?? 0) < level * 16;
export const checker: Pattern = (c, r) => ((c + r) & 1) === 0;

function segDist2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  const ex = ax + dx * t - px;
  const ey = ay + dy * t - py;
  return ex * ex + ey * ey;
}

interface Edge { x0: number; y0: number; x1: number; y1: number }

export class Pix {
  /** Palette index per pixel (the master palette has more than 256 entries). */
  readonly data: Uint16Array;

  /** Head tilt (doc 29): shapes, ovals, strokes and lines turn by `rot` radians about the frame point
   *  (pivotX, pivotY). 0 = upright, exactly the plain mapping. */
  rot = 0;
  pivotX = 0;
  pivotY = 0;

  constructor(readonly w: number, readonly h: number, public k = 1, public ox = 0, public oy = 0) {
    this.data = new Uint16Array(w * h);
  }

  X(x: number): number { return this.ox + x * this.k; }
  Y(y: number): number { return this.oy + y * this.k; }
  /** Art position of a frame point under the tilt. */
  at(x: number, y: number): [number, number] {
    if (this.rot === 0) return [this.X(x), this.Y(y)];
    const c = Math.cos(this.rot);
    const s = Math.sin(this.rot);
    const dx = x - this.pivotX;
    const dy = y - this.pivotY;
    return [this.X(this.pivotX + dx * c - dy * s), this.Y(this.pivotY + dx * s + dy * c)];
  }
  /** Frame point under an art position (the inverse of `at`, tilt included): for per-pixel lighting. */
  frame(ax: number, ay: number): [number, number] {
    const x = (ax - this.ox) / this.k;
    const y = (ay - this.oy) / this.k;
    if (this.rot === 0) return [x, y];
    const c = Math.cos(this.rot);
    const s = Math.sin(this.rot);
    const dx = x - this.pivotX;
    const dy = y - this.pivotY;
    return [this.pivotX + dx * c + dy * s, this.pivotY - dx * s + dy * c];
  }
  /** Pixel containing a frame point under the tilt. */
  cell(x: number, y: number): [number, number] {
    const [ax, ay] = this.at(x, y);
    return [Math.floor(ax), Math.floor(ay)];
  }
  /** Whole art pixels a hand-placed feature anchored at (x, y) moves under the tilt ([0, 0] when upright). */
  nudge(x: number, y: number): [number, number] {
    if (this.rot === 0) return [0, 0];
    const [ax, ay] = this.at(x, y);
    return [Math.round(ax - this.X(x)), Math.round(ay - this.Y(y))];
  }
  /** Pixel column / row containing a frame point. */
  col(x: number): number { return Math.floor(this.X(x)); }
  row(y: number): number { return Math.floor(this.Y(y)); }
  /** The column mirrored across frame x = 0 (keep 2·ox integral for exact symmetry). */
  mirror(c: number): number { return Math.round(2 * this.ox) - 1 - c; }

  inside(c: number, r: number): boolean { return c >= 0 && r >= 0 && c < this.w && r < this.h; }
  get(c: number, r: number): number { return this.inside(c, r) ? this.data[r * this.w + c] ?? 0 : 0; }
  set(c: number, r: number, v: number): void {
    if (this.inside(c, r)) this.data[r * this.w + c] = v;
  }
  /** Sets a pixel and its mirror image. */
  set2(c: number, r: number, v: number): void {
    this.set(c, r, v);
    this.set(this.mirror(c), r, v);
  }
  hspan(c0: number, c1: number, r: number, v: number): void {
    for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) this.set(c, r, v);
  }

  blank(): Mask { return new Uint8Array(this.w * this.h); }

  /** Nonzero-winding fill of a path, sampled at pixel centres. */
  shape(p: Path): Mask {
    const edges: Edge[] = [];
    let top = Infinity;
    let bottom = -Infinity;
    for (const poly of p.polys) {
      const n = poly.length >> 1;
      if (n < 3) continue;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const [x0, y0] = this.at(poly[2 * i] ?? 0, poly[2 * i + 1] ?? 0);
        const [x1, y1] = this.at(poly[2 * j] ?? 0, poly[2 * j + 1] ?? 0);
        const e = { x0, y0, x1, y1 };
        if (e.y0 === e.y1) continue;
        edges.push(e);
        top = Math.min(top, e.y0, e.y1);
        bottom = Math.max(bottom, e.y0, e.y1);
      }
    }
    const m = this.blank();
    const r1 = Math.min(this.h - 1, Math.ceil(bottom));
    for (let r = Math.max(0, Math.floor(top)); r <= r1; r++) this.scan(m, edges, r);
    return m;
  }

  private scan(m: Mask, edges: readonly Edge[], r: number): void {
    const yc = r + 0.5;
    const hits: { x: number; d: number }[] = [];
    for (const e of edges) {
      if ((e.y0 <= yc && yc < e.y1) || (e.y1 <= yc && yc < e.y0)) {
        hits.push({ x: e.x0 + ((yc - e.y0) * (e.x1 - e.x0)) / (e.y1 - e.y0), d: e.y1 > e.y0 ? 1 : -1 });
      }
    }
    hits.sort((a, b) => a.x - b.x);
    let wind = 0;
    for (let i = 0; i + 1 < hits.length; i++) {
      wind += hits[i]?.d ?? 0;
      if (wind === 0) continue;
      const c0 = Math.max(0, Math.ceil((hits[i]?.x ?? 0) - 0.5));
      const c1 = Math.min(this.w - 1, Math.ceil((hits[i + 1]?.x ?? 0) - 0.5) - 1);
      if (c1 >= c0) m.fill(1, r * this.w + c0, r * this.w + c1 + 1);
    }
  }

  /** Filled ellipse (radii in frame units, optional rotation); never smaller than one pixel. */
  oval(cx: number, cy: number, rx: number, ry: number, rot = 0): Mask {
    const m = this.blank();
    const [x, y] = this.at(cx, cy);
    const ax = Math.max(0.5, rx * this.k);
    const ay = Math.max(0.5, ry * this.k);
    const reach = Math.max(ax, ay) + 1;
    const c = Math.cos(rot + this.rot);
    const s = Math.sin(rot + this.rot);
    for (let r = Math.max(0, Math.floor(y - reach)); r <= Math.min(this.h - 1, Math.ceil(y + reach)); r++) {
      for (let col = Math.max(0, Math.floor(x - reach)); col <= Math.min(this.w - 1, Math.ceil(x + reach)); col++) {
        const dx = col + 0.5 - x;
        const dy = r + 0.5 - y;
        const u = (dx * c + dy * s) / ax;
        const v = (-dx * s + dy * c) / ay;
        if (u * u + v * v <= 1) m[r * this.w + col] = 1;
      }
    }
    if (!m.includes(1)) this.mark(m, Math.floor(x), Math.floor(y));
    return m;
  }

  /** Round-capped thick polyline (radius in frame units); thinner than a pixel → a 1-px pixel line. */
  thick(pts: readonly number[], radius: number): Mask {
    const m = this.blank();
    const rp = radius * this.k;
    if (rp < 0.6) {
      for (let i = 0; i + 3 < pts.length; i += 2) this.lineMask(m, pts[i] ?? 0, pts[i + 1] ?? 0, pts[i + 2] ?? 0, pts[i + 3] ?? 0);
      return m;
    }
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const [ax, ay] = this.at(pts[i] ?? 0, pts[i + 1] ?? 0);
      xs.push(ax);
      ys.push(ay);
    }
    const r2 = rp * rp;
    const c0 = Math.max(0, Math.floor(Math.min(...xs) - rp));
    const c1 = Math.min(this.w - 1, Math.ceil(Math.max(...xs) + rp));
    for (let r = Math.max(0, Math.floor(Math.min(...ys) - rp)); r <= Math.min(this.h - 1, Math.ceil(Math.max(...ys) + rp)); r++) {
      for (let c = c0; c <= c1; c++) {
        for (let i = 0; i + 1 < xs.length; i++) {
          if (segDist2(c + 0.5, r + 0.5, xs[i] ?? 0, ys[i] ?? 0, xs[i + 1] ?? 0, ys[i + 1] ?? 0) <= r2) {
            m[r * this.w + c] = 1;
            break;
          }
        }
      }
    }
    return m;
  }

  private mark(m: Mask, c: number, r: number): void {
    if (this.inside(c, r)) m[r * this.w + c] = 1;
  }

  /** Bresenham line between two frame points into a mask. */
  lineMask(m: Mask, x0: number, y0: number, x1: number, y1: number): Mask {
    let [c, r] = this.cell(x0, y0);
    const [c1, r1] = this.cell(x1, y1);
    const dc = Math.abs(c1 - c);
    const dr = -Math.abs(r1 - r);
    const sc = c < c1 ? 1 : -1;
    const sr = r < r1 ? 1 : -1;
    let err = dc + dr;
    for (;;) {
      this.mark(m, c, r);
      if (c === c1 && r === r1) return m;
      const e2 = 2 * err;
      if (e2 >= dr) { err += dr; c += sc; }
      if (e2 <= dc) { err += dc; r += sr; }
    }
  }

  /** Paints a mask, optionally limited to a clip mask and an on/off pattern. */
  paint(m: Mask, v: number, clip?: Mask, pattern?: Pattern): this {
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || (clip && !clip[i])) continue;
      if (pattern && !pattern(i % this.w, Math.floor(i / this.w))) continue;
      this.data[i] = v;
    }
    return this;
  }

  fill(p: Path, v: number, clip?: Mask): Mask {
    const m = this.shape(p);
    this.paint(m, v, clip);
    return m;
  }

  line(x0: number, y0: number, x1: number, y1: number, v: number, clip?: Mask): void {
    this.paint(this.lineMask(this.blank(), x0, y0, x1, y1), v, clip);
  }

  /** Pixels of `m` whose neighbour in any of the directions (u, d, l, r) lies outside `m`. */
  border(m: Mask, dirs = 'udlr'): Mask {
    const out = this.blank();
    const w = this.w;
    const off: Readonly<Record<string, [number, number]>> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
    for (let i = 0; i < m.length; i++) {
      if (!m[i]) continue;
      const c = i % w;
      const r = (i - c) / w;
      for (const ch of dirs) {
        const [dc, dr] = off[ch] ?? [0, 0];
        if (this.inside(c + dc, r + dr) && !m[i + dr * w + dc]) {
          out[i] = 1;
          break;
        }
      }
    }
    return out;
  }

  /** Border pixels of `m` that touch something already painted outside it: where a part overlaps earlier
   *  parts (the silhouette against transparency is outlined later by post.ts). */
  seam(m: Mask, dirs = 'udlr'): Mask {
    const b = this.border(m, dirs);
    const w = this.w;
    const near = (i: number, d: number): boolean => i + d >= 0 && i + d < m.length && !m[i + d] && (this.data[i + d] ?? 0) !== 0;
    for (let i = 0; i < b.length; i++) {
      if (b[i] && !(near(i, -w) || near(i, w) || near(i, -1) || near(i, 1))) b[i] = 0;
    }
    return b;
  }
}

export function and(a: Mask, b: Mask): Mask {
  return a.map((v, i) => (v && b[i] ? 1 : 0));
}
export function minus(a: Mask, b: Mask): Mask {
  return a.map((v, i) => (v && !b[i] ? 1 : 0));
}
export function union(a: Mask, b: Mask): Mask {
  return a.map((v, i) => (v || b[i] ? 1 : 0));
}
/** The mask moved by (dc, dr) pixels. */
export function shifted(m: Mask, w: number, dc: number, dr: number): Mask {
  const out = new Uint8Array(m.length);
  const h = m.length / w;
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    const c = (i % w) + dc;
    const r = Math.floor(i / w) + dr;
    if (c >= 0 && c < w && r >= 0 && r < h) out[r * w + c] = 1;
  }
  return out;
}
