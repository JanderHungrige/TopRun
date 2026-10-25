/**
 * Geometry helpers for the player jets. Outlines are flat [x0, y0, x1, y1, ...] point lists turned into
 * cached Path2D objects. Every polygon is normalised to the same winding, so several pieces added to one
 * path fill (and clip) as their union with the default nonzero rule — mirrored halves included.
 */

export type Pts = readonly number[];

export interface Rect { x: number; y: number; w: number; h: number }

/** Signed area (shoelace). Positive = clockwise on screen (y down). */
function area(p: Pts): number {
  let a = 0;
  for (let i = 0; i < p.length; i += 2) {
    const j = (i + 2) % p.length;
    a += (p[i] ?? 0) * (p[j + 1] ?? 0) - (p[j] ?? 0) * (p[i + 1] ?? 0);
  }
  return a / 2;
}

export function reversed(p: Pts): number[] {
  const out: number[] = [];
  for (let i = p.length - 2; i >= 0; i -= 2) out.push(p[i] ?? 0, p[i + 1] ?? 0);
  return out;
}

/** The polygon with clockwise winding. */
export function clockwise(p: Pts): Pts {
  return area(p) < 0 ? reversed(p) : p;
}

/** Mirror image across x = 0. */
export function mirror(p: Pts): number[] {
  return p.map((v, i) => (i % 2 === 0 ? -v : v));
}

/** Full outline from its right half: top centre down the right side, then the mirrored left side back up. */
export function sym(right: Pts): number[] {
  return [...right, ...mirror(reversed(right))];
}

/** Adds a closed polygon (clockwise-normalised) to a path. */
export function addPoly(path: Path2D | CanvasRenderingContext2D, pts: Pts): void {
  const p = clockwise(pts);
  for (let i = 0; i < p.length; i += 2) {
    if (i === 0) path.moveTo(p[0] ?? 0, p[1] ?? 0);
    else path.lineTo(p[i] ?? 0, p[i + 1] ?? 0);
  }
  path.closePath();
}

/** One path holding the union of the polygons. */
export function polys(...list: Pts[]): Path2D {
  const path = new Path2D();
  for (const p of list) addPoly(path, p);
  return path;
}

/** Each polygon plus its mirror image. */
export function pairs(...list: Pts[]): Path2D {
  const path = new Path2D();
  for (const p of list) {
    addPoly(path, p);
    addPoly(path, mirror(p));
  }
  return path;
}

/** Open polylines (panel lines, hinge lines). With `mirrored`, each line is added on both sides. */
export function lines(list: readonly Pts[], mirrored = false): Path2D {
  const path = new Path2D();
  for (const l of list) {
    for (const p of mirrored ? [l, mirror(l)] : [l]) {
      for (let i = 0; i < p.length; i += 2) {
        if (i === 0) path.moveTo(p[0] ?? 0, p[1] ?? 0);
        else path.lineTo(p[i] ?? 0, p[i + 1] ?? 0);
      }
    }
  }
  return path;
}

/** Points along a quadratic curve from (x0, y0) via (cx, cy) to (x1, y1), excluding the start point. */
export function curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n = 5): number[] {
  const out: number[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return out;
}

/** Ellipse as a polygon (for outlines that must join a union path). */
export function oval(cx: number, cy: number, rx: number, ry: number, n = 16): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return out;
}

export function bounds(...list: Pts[]): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of list) {
    for (let i = 0; i < p.length; i += 2) {
      x0 = Math.min(x0, p[i] ?? 0);
      x1 = Math.max(x1, p[i] ?? 0);
      y0 = Math.min(y0, p[i + 1] ?? 0);
      y1 = Math.max(y1, p[i + 1] ?? 0);
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * Shading strip that follows a symmetric outline: the band between `k0` and `k1` times the half-width of
 * the right-half outline `right` (top to bottom). side 1 = right half, -1 = left half.
 */
export function contourStrip(right: Pts, k0: number, k1: number, side: 1 | -1): number[] {
  const out: number[] = [];
  for (let i = 0; i < right.length; i += 2) out.push((right[i] ?? 0) * k1 * side, right[i + 1] ?? 0);
  for (let i = right.length - 2; i >= 0; i -= 2) out.push((right[i] ?? 0) * k0 * side, right[i + 1] ?? 0);
  return out;
}

/** Band along an open contour (side view): the contour shifted by dy0, back along it shifted by dy1. */
export function band(contour: Pts, dy0: number, dy1: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < contour.length; i += 2) out.push(contour[i] ?? 0, (contour[i + 1] ?? 0) + dy0);
  for (let i = contour.length - 2; i >= 0; i -= 2) out.push(contour[i] ?? 0, (contour[i + 1] ?? 0) + dy1);
  return out;
}

/** Builds a value on first use (Path2D needs a browser; never build at import time). */
export function lazy<T>(make: () => T): () => T {
  let v: T | undefined;
  return () => {
    if (v === undefined) v = make();
    return v;
  };
}

export function fill(ctx: CanvasRenderingContext2D, path: Path2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fill(path);
}

export function stroke(ctx: CanvasRenderingContext2D, path: Path2D, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke(path);
}
