import type { ShellInk } from '../detail/organic';
import { path, type Pts } from '../detail/parts';

// Soft bodies of the sea's creatures (doc 120), drawn live because they swim: a ribbon that tapers along a spine and is
// rounded by the light from the upper left (eel bodies, squid arms, tentacles), suckers along an arm, a fin membrane
// with its rays. In a one-colour palette they draw a plain silhouette.

type Ctx = CanvasRenderingContext2D;

/** A smooth curve through points (quadratic segments between their midpoints). */
export function smooth(pts: Pts): Path2D {
  const p = new Path2D();
  const n = pts.length / 2;
  p.moveTo(pts[0] ?? 0, pts[1] ?? 0);
  for (let i = 1; i < n - 1; i++) {
    const x = pts[i * 2] ?? 0, y = pts[i * 2 + 1] ?? 0;
    p.quadraticCurveTo(x, y, (x + (pts[i * 2 + 2] ?? 0)) / 2, (y + (pts[i * 2 + 3] ?? 0)) / 2);
  }
  p.lineTo(pts[n * 2 - 2] ?? 0, pts[n * 2 - 1] ?? 0);
  return p;
}

/** The outline of a band `w0` → `w1` wide along a spine (flat x, y points), shifted by (dx, dy), scaled by k. */
export function ribbon(pts: Pts, w0: number, w1: number, dx = 0, dy = 0, k = 1): Path2D {
  const n = pts.length / 2;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    let tx = (pts[b * 2] ?? 0) - (pts[a * 2] ?? 0), ty = (pts[b * 2 + 1] ?? 0) - (pts[a * 2 + 1] ?? 0);
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    const w = ((w0 + ((w1 - w0) * i) / Math.max(1, n - 1)) * k) / 2;
    const x = (pts[i * 2] ?? 0) + dx, y = (pts[i * 2 + 1] ?? 0) + dy;
    left.push(x - ty * w, y + tx * w);
    right.unshift(x + ty * w, y - tx * w);
  }
  for (let i = 0; i < right.length; i += 2) left.push(right[i] ?? 0, right[i + 1] ?? 0);
  return loop(left);
}

/** A smooth closed outline through points (quadratic segments between their midpoints). */
function loop(pts: Pts): Path2D {
  const p = new Path2D();
  const n = pts.length / 2;
  const at = (i: number, k: number): number => pts[((i + n) % n) * 2 + k] ?? 0;
  p.moveTo((at(0, 0) + at(1, 0)) / 2, (at(0, 1) + at(1, 1)) / 2);
  for (let i = 1; i <= n; i++) p.quadraticCurveTo(at(i, 0), at(i, 1), (at(i, 0) + at(i + 1, 0)) / 2, (at(i, 1) + at(i + 1, 1)) / 2);
  p.closePath();
  return p;
}

/** A swimming body or arm along a spine: outline, its shade, the lit side toward the upper left, a gleam. */
export function flesh(ctx: Ctx, pts: Pts, w0: number, w1: number, c: ShellInk, mono: boolean): void {
  ctx.lineJoin = 'round';
  const body = ribbon(pts, w0, w1);
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = mono ? 0.6 : 1;
  ctx.stroke(body);
  ctx.fillStyle = mono ? c.base : c.dark;
  ctx.fill(body);
  if (mono) return;
  const lift = Math.max(0.2, w0 * 0.1);
  ctx.fillStyle = c.base;
  ctx.fill(ribbon(pts, w0, w1, -lift, -lift * 0.5, 0.74));
  ctx.fillStyle = c.light;
  ctx.globalAlpha *= 0.55;
  ctx.fill(ribbon(pts, w0, w1, -lift * 2.2, -lift, 0.22));
  ctx.globalAlpha /= 0.55;
}

/** Suckers along one side (s = ±1) of an arm's spine, shrinking to the tip. */
export function suckers(ctx: Ctx, pts: Pts, s: number, r0: number, r1: number, rim: string, cup: string): void {
  const n = pts.length / 2;
  for (let i = 1; i < n; i++) {
    const x0 = pts[(i - 1) * 2] ?? 0, y0 = pts[(i - 1) * 2 + 1] ?? 0, x1 = pts[i * 2] ?? 0, y1 = pts[i * 2 + 1] ?? 0;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const r = r0 + ((r1 - r0) * i) / n;
    for (const f of [0.25, 0.75]) {
      const x = x0 + (x1 - x0) * f - ((y1 - y0) / l) * s * r * 1.2, y = y0 + (y1 - y0) * f + ((x1 - x0) / l) * s * r * 1.2;
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cup;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A fin membrane: the outline translucent, its rays from the root, a darker edge; plain in one colour. */
export function finRays(ctx: Ctx, outline: Pts, rootX: number, rootY: number, skin: string, ray: string, edge: string, mono: boolean): void {
  const p = path(outline);
  ctx.fillStyle = skin;
  ctx.fill(p);
  if (mono) return;
  ctx.strokeStyle = ray;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (let i = 2; i < outline.length - 2; i += 2) {
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(outline[i] ?? 0, outline[i + 1] ?? 0);
  }
  ctx.stroke();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 0.45;
  ctx.stroke(p);
}
