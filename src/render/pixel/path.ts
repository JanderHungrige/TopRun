// Pixel pipeline (doc 20): a tiny path builder. Curves are flattened to polygons in frame units; the raster
// samples them at pixel centres, so every shape lands on the pixel grid with hard edges (no anti-aliasing).

const CURVE_STEPS = 10;

export class Path {
  /** Closed polygons as flat [x0, y0, x1, y1, …] lists in frame units. */
  readonly polys: number[][] = [];
  private cur: number[] | null = null;
  private x = 0;
  private y = 0;

  move(x: number, y: number): this {
    this.cur = [x, y];
    this.polys.push(this.cur);
    this.x = x;
    this.y = y;
    return this;
  }

  line(x: number, y: number): this {
    if (!this.cur) return this.move(x, y);
    this.cur.push(x, y);
    this.x = x;
    this.y = y;
    return this;
  }

  /** Continues through flat x,y pairs. */
  lines(pts: readonly number[]): this {
    for (let i = 0; i + 1 < pts.length; i += 2) this.line(pts[i] ?? 0, pts[i + 1] ?? 0);
    return this;
  }

  quad(cx: number, cy: number, x: number, y: number): this {
    const x0 = this.x;
    const y0 = this.y;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS;
      const u = 1 - t;
      this.line(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y);
    }
    return this;
  }

  cubic(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this {
    const x0 = this.x;
    const y0 = this.y;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      this.line(a * x0 + b * c1x + c * c2x + d * x, a * y0 + b * c1y + c * c2y + d * y);
    }
    return this;
  }

  /** Ends the current polygon (polygons are always filled as closed). */
  close(): this {
    this.cur = null;
    return this;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, rot = 0): this {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const ex = Math.cos(a) * rx;
      const ey = Math.sin(a) * ry;
      if (i === 0) this.move(cx + ex * c - ey * s, cy + ex * s + ey * c);
      else this.line(cx + ex * c - ey * s, cy + ex * s + ey * c);
    }
    return this.close();
  }

  rect(x: number, y: number, w: number, h: number): this {
    return this.move(x, y).line(x + w, y).line(x + w, y + h).line(x, y + h).close();
  }

  /** Adds the polygon and its mirror image across x = 0. */
  pair(pts: readonly number[]): this {
    this.move(pts[0] ?? 0, pts[1] ?? 0).lines(pts.slice(2)).close();
    const m = pts.map((v, i) => (i % 2 === 0 ? -v : v));
    return this.move(m[0] ?? 0, m[1] ?? 0).lines(m.slice(2)).close();
  }
}

/** Shorthand: `path().move(…)…`. */
export const path = (): Path => new Path();
