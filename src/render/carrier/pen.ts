import { TAU } from '../../core/math';

/**
 * Path builder with an offset / scale / horizontal-flip transform, so art can be authored in local units and
 * baked into a Path2D once (or traced straight onto a context — both implement CanvasPath).
 */
export class Pen {
  constructor(
    readonly p: CanvasPath,
    private readonly ox = 0,
    private readonly oy = 0,
    private readonly s = 1,
    private readonly fx: 1 | -1 = 1,
  ) {}

  X(x: number): number {
    return this.ox + x * this.s * this.fx;
  }

  Y(y: number): number {
    return this.oy + y * this.s;
  }

  /** A nested pen whose origin is (x, y) in this pen's units. */
  at(x: number, y: number, s = 1, flip = false): Pen {
    const fx: 1 | -1 = (flip ? -this.fx : this.fx) === 1 ? 1 : -1;
    return new Pen(this.p, this.X(x), this.Y(y), this.s * s, fx);
  }

  /** Polyline from flat [x0, y0, x1, y1, …]; closed unless `open`. */
  poly(pts: readonly number[], open = false): void {
    for (let i = 0; i < pts.length; i += 2) {
      const x = this.X(pts[i] ?? 0);
      const y = this.Y(pts[i + 1] ?? 0);
      if (i === 0) this.p.moveTo(x, y);
      else this.p.lineTo(x, y);
    }
    if (!open) this.p.closePath();
  }

  line(x0: number, y0: number, x1: number, y1: number): void {
    this.p.moveTo(this.X(x0), this.Y(y0));
    this.p.lineTo(this.X(x1), this.Y(y1));
  }

  rect(x: number, y: number, w: number, h: number): void {
    this.poly([x, y, x + w, y, x + w, y + h, x, y + h]);
  }

  circle(x: number, y: number, r: number): void {
    this.ellipse(x, y, r, r);
  }

  ellipse(x: number, y: number, rx: number, ry: number, from = 0, to = TAU): void {
    const cx = this.X(x);
    const cy = this.Y(y);
    const flip = this.fx === -1;
    const a0 = flip ? Math.PI - from : from;
    const a1 = flip ? Math.PI - to : to;
    this.p.moveTo(cx + Math.cos(a0) * rx * this.s, cy + Math.sin(a0) * ry * this.s);
    this.p.ellipse(cx, cy, rx * this.s, ry * this.s, 0, a0, a1, flip);
    if (to - from < TAU) this.p.closePath();
  }

  /** Quadratic curve as an open stroke. */
  curve(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): void {
    this.p.moveTo(this.X(x0), this.Y(y0));
    this.p.quadraticCurveTo(this.X(cx), this.Y(cy), this.X(x1), this.Y(y1));
  }
}

export type Paint = string | ((ctx: CanvasRenderingContext2D) => CanvasGradient);

export interface Layer {
  fill?: Paint;
  stroke?: Paint;
  width?: number;
  build: (pen: Pen) => void;
}

const gradients = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasGradient>>();

/** A gradient created once per context and key (gradients live in user space, so they survive camera moves). */
export function cachedGradient(ctx: CanvasRenderingContext2D, key: string, make: () => CanvasGradient): CanvasGradient {
  let m = gradients.get(ctx);
  if (!m) {
    m = new Map();
    gradients.set(ctx, m);
  }
  let g = m.get(key);
  if (!g) {
    g = make();
    m.set(key, g);
  }
  return g;
}

const resolve = (ctx: CanvasRenderingContext2D, p: Paint): string | CanvasGradient => (typeof p === 'string' ? p : p(ctx));

/** Fills / strokes `path`, or the context's current path when none is given. */
function paint(ctx: CanvasRenderingContext2D, l: Layer, path?: Path2D): void {
  if (l.fill) {
    ctx.fillStyle = resolve(ctx, l.fill);
    if (path) ctx.fill(path);
    else ctx.fill();
  }
  if (l.stroke) {
    ctx.strokeStyle = resolve(ctx, l.stroke);
    ctx.lineWidth = l.width ?? 1;
    if (path) ctx.stroke(path);
    else ctx.stroke();
  }
}

/** Static art: layers are baked into Path2D objects the first time they are drawn, then replayed each frame. */
export class StaticArt {
  private baked: { path: Path2D; layer: Layer }[] | null = null;

  constructor(private readonly layers: () => readonly Layer[], private readonly ox = 0, private readonly oy = 0) {}

  draw(ctx: CanvasRenderingContext2D): void {
    this.baked ??= this.layers().map((layer) => {
      const path = new Path2D();
      layer.build(new Pen(path, this.ox, this.oy));
      return { path, layer };
    });
    for (const b of this.baked) paint(ctx, b.layer, b.path);
  }
}

/** Traces and paints one layer straight onto the context (for animated parts). */
export function drawLive(ctx: CanvasRenderingContext2D, l: Layer, ox = 0, oy = 0): void {
  ctx.beginPath();
  l.build(new Pen(ctx, ox, oy));
  paint(ctx, l);
}
