import type { Path } from './pixel/path';
import type { Mask, Pattern, Pix } from './pixel/raster';

// Home base rooms (docs 31, 32): painting helpers for the rooms' full-screen pixel layers. Pix.paint walks the
// whole buffer for every shape; on a 640 × 360 room layer with hundreds of parts that is most of the build time,
// so these paint only inside each part's bounding box (same pixel-centre rule as Pix.shape).

interface Span { c0: number; c1: number; r0: number; r1: number }

function span(p: Pix, x0: number, y0: number, x1: number, y1: number, pad = 0): Span {
  return {
    c0: Math.max(0, Math.floor(p.X(x0)) - pad), c1: Math.min(p.w - 1, Math.ceil(p.X(x1)) + pad),
    r0: Math.max(0, Math.floor(p.Y(y0)) - pad), r1: Math.min(p.h - 1, Math.ceil(p.Y(y1)) + pad),
  };
}

function paintSpan(p: Pix, m: Mask | null, v: number, s: Span, clip?: Mask, pattern?: Pattern): void {
  for (let r = s.r0; r <= s.r1; r++) {
    for (let c = s.c0; c <= s.c1; c++) {
      const i = r * p.w + c;
      if ((m && !m[i]) || (clip && !clip[i]) || (pattern && !pattern(c, r))) continue;
      p.data[i] = v;
    }
  }
}

/** The pixels a frame-unit rectangle covers (pixel centres inside), clamped to the buffer. */
function rectSpan(p: Pix, x: number, y: number, w: number, h: number): Span {
  return {
    c0: Math.max(0, Math.ceil(p.X(x) - 0.5)), c1: Math.min(p.w - 1, Math.ceil(p.X(x + w) - 0.5) - 1),
    r0: Math.max(0, Math.ceil(p.Y(y) - 0.5)), r1: Math.min(p.h - 1, Math.ceil(p.Y(y + h) - 0.5) - 1),
  };
}

/** An axis-aligned rectangle in frame units, painted directly. */
export function rect(p: Pix, x: number, y: number, w: number, h: number, v: number, clip?: Mask, pattern?: Pattern): void {
  paintSpan(p, null, v, rectSpan(p, x, y, w, h), clip, pattern);
}

/** The outermost pixel ring of a frame-unit rectangle (what Pix.border gives for a rect), on chosen sides. */
export function rectEdge(p: Pix, x: number, y: number, w: number, h: number, v: number, sides = 'udlr'): void {
  const s = rectSpan(p, x, y, w, h);
  const has = (side: string, inside: boolean): boolean => sides.includes(side) && inside;
  if (has('u', Math.ceil(p.Y(y) - 0.5) >= 0)) paintSpan(p, null, v, { ...s, r1: s.r0 });
  if (has('d', Math.ceil(p.Y(y + h) - 0.5) - 1 < p.h)) paintSpan(p, null, v, { ...s, r0: s.r1 });
  if (has('l', Math.ceil(p.X(x) - 0.5) >= 0)) paintSpan(p, null, v, { ...s, c1: s.c0 });
  if (has('r', Math.ceil(p.X(x + w) - 0.5) - 1 < p.w)) paintSpan(p, null, v, { ...s, c0: s.c1 });
}

/** Fills a path (nonzero, pixel centres) and returns its mask. */
export function fill(p: Pix, path: Path, v: number, clip?: Mask, pattern?: Pattern): Mask {
  const m = p.shape(path);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const poly of path.polys) {
    for (let i = 0; i + 1 < poly.length; i += 2) {
      x0 = Math.min(x0, poly[i] ?? 0);
      x1 = Math.max(x1, poly[i] ?? 0);
      y0 = Math.min(y0, poly[i + 1] ?? 0);
      y1 = Math.max(y1, poly[i + 1] ?? 0);
    }
  }
  if (x0 <= x1) paintSpan(p, m, v, span(p, x0, y0, x1, y1, 1), clip, pattern);
  return m;
}

/** A filled ellipse (Pix.oval) painted inside its box. */
export function oval(p: Pix, cx: number, cy: number, rx: number, ry: number, v: number, clip?: Mask, pattern?: Pattern): Mask {
  const m = p.oval(cx, cy, rx, ry);
  const r = Math.max(rx, ry);
  paintSpan(p, m, v, span(p, cx - r, cy - r, cx + r, cy + r, 2), clip, pattern);
  return m;
}

/** A round-capped thick polyline (Pix.thick) painted inside its box. */
export function thick(p: Pix, pts: readonly number[], radius: number, v: number, clip?: Mask): void {
  const m = p.thick(pts, radius);
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  paintSpan(p, m, v, span(p, Math.min(...xs) - radius, Math.min(...ys) - radius, Math.max(...xs) + radius, Math.max(...ys) + radius, 2), clip);
}

/** Paints an existing mask, but only inside the frame-unit box (x0, y0) – (x1, y1). */
export function paintIn(p: Pix, m: Mask, v: number, box: readonly [number, number, number, number], clip?: Mask, pattern?: Pattern): void {
  paintSpan(p, m, v, span(p, box[0], box[1], box[2], box[3], 1), clip, pattern);
}
