import type { Look, TailArt } from '../livery-art';
import type { Pts } from './geom';
import type { Fin } from './surface';

/** Tail art on the fins: big and detailed in the side view, a colour cue on the slim top-view fins. */

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Point at (u along the chord from LE to TE, v up the span from root to tip) on the fin quad. */
function finPt(q: Pts, u: number, v: number): [number, number] {
  const lx = lerp(q[0] ?? 0, q[2] ?? 0, v);
  const ly = lerp(q[1] ?? 0, q[3] ?? 0, v);
  const tx = lerp(q[6] ?? 0, q[4] ?? 0, v);
  const ty = lerp(q[7] ?? 0, q[5] ?? 0, v);
  return [lerp(lx, tx, u), lerp(ly, ty, u)];
}

function quadPath(ctx: CanvasRenderingContext2D, q: Pts, pts: readonly (readonly [number, number])[]): void {
  ctx.beginPath();
  pts.forEach(([u, v], i) => {
    const [x, y] = finPt(q, u, v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

/** Generic skull & crossbones (original vector shape), centred at (x, y), height ~2.2·r. */
export function skull(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, bone: string, hole: string): void {
  ctx.strokeStyle = bone;
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.34;
  ctx.beginPath();
  ctx.moveTo(x - r * 1.35, y - r * 0.45);
  ctx.lineTo(x + r * 1.35, y + r * 1.45);
  ctx.moveTo(x + r * 1.35, y - r * 0.45);
  ctx.lineTo(x - r * 1.35, y + r * 1.45);
  ctx.stroke();
  ctx.fillStyle = bone;
  for (const [bx, by] of [[-1.35, -0.45], [1.35, -0.45], [-1.35, 1.45], [1.35, 1.45]] as const) {
    ctx.beginPath();
    ctx.arc(x + bx * r - 0.16 * r, y + by * r, r * 0.24, 0, Math.PI * 2);
    ctx.arc(x + bx * r + 0.16 * r, y + by * r, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - r * 0.15, r, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(x + r * 0.55, y + r * 0.95);
  ctx.lineTo(x - r * 0.55, y + r * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hole;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y - r * 0.05, r * 0.27, r * 0.32, 0, 0, Math.PI * 2);
  ctx.ellipse(x + r * 0.4, y - r * 0.05, r * 0.27, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.3);
  ctx.lineTo(x - r * 0.12, y + r * 0.52);
  ctx.lineTo(x + r * 0.12, y + r * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = r * 0.07;
  ctx.strokeStyle = hole;
  ctx.beginPath();
  for (const k of [-0.25, 0, 0.25]) {
    ctx.moveTo(x + k * r, y + r * 0.72);
    ctx.lineTo(x + k * r, y + r * 0.95);
  }
  ctx.stroke();
}

function chevrons(ctx: CanvasRenderingContext2D, q: Pts, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  for (const v of [0.18, 0.44, 0.7]) {
    const pts = [finPt(q, 0.1, v), finPt(q, 0.5, v + 0.17), finPt(q, 0.9, v)];
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  }
  ctx.stroke();
  ctx.lineJoin = 'round';
}

/** Sunburst: wedges fanning out from the fin's root trailing edge, alternating ray colours over the base. */
function rays(ctx: CanvasRenderingContext2D, q: Pts, a: string, b: string): void {
  const [ox, oy] = finPt(q, 1, 0);
  const [ax, ay] = finPt(q, -0.3, 0);
  const [bx, by] = finPt(q, 1.1, 1.3);
  const a0 = Math.atan2(ay - oy, ax - ox);
  let d = Math.atan2(by - oy, bx - ox) - a0;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const r = Math.hypot(ax - ox, ay - oy) * 2;
  const n = 13;
  for (let i = 0; i < n; i += 2) {
    ctx.fillStyle = i % 4 === 0 ? a : b;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, r, a0 + (d * i) / n, a0 + (d * (i + 1)) / n, d < 0);
    ctx.closePath();
    ctx.fill();
  }
}

function tigerFin(ctx: CanvasRenderingContext2D, q: Pts, color: string): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const v = 0.12 + i * 0.19;
    const fromLE = i % 2 === 0;
    const u0 = fromLE ? -0.1 : 1.1;
    const tip = fromLE ? 0.62 + (i % 3) * 0.08 : 0.4 - (i % 3) * 0.08;
    quadPath(ctx, q, [[u0, v - 0.06], [lerp(u0, tip, 0.5), v - 0.02], [tip, v + 0.05], [lerp(u0, tip, 0.5), v + 0.07], [u0, v + 0.07]]);
    ctx.fill();
  }
}

function finMarks(ctx: CanvasRenderingContext2D, art: TailArt, f: Fin, size: number): void {
  const q = f.q;
  switch (art.kind) {
    case 'none':
    case 'solid': return;
    case 'band':
      ctx.fillStyle = art.mark;
      quadPath(ctx, q, [[-0.2, 0.72], [1.2, 0.72], [1.2, 1.2], [-0.2, 1.2]]);
      ctx.fill();
      return;
    case 'chevrons': chevrons(ctx, q, art.mark, size * 0.07); return;
    case 'skull': {
      const [x, y] = finPt(q, 0.5, 0.48);
      skull(ctx, x, y, size * 0.13, art.mark, art.color);
      return;
    }
    case 'rays': rays(ctx, q, art.mark, art.mark2); return;
    case 'tiger': tigerFin(ctx, q, art.mark); return;
    case 'gold':
      ctx.fillStyle = art.mark;
      quadPath(ctx, q, [[-0.2, 0.86], [1.2, 0.86], [1.2, 0.9], [-0.2, 0.9]]);
      ctx.fill();
      quadPath(ctx, q, [[0.06, -0.2], [0.1, -0.2], [0.1, 1.2], [0.06, 1.2]]);
      ctx.fill();
      return;
    case 'sweep':
      ctx.fillStyle = art.mark;
      quadPath(ctx, q, [[-0.3, 0.1], [0.2, -0.2], [1.3, 0.62], [1.3, 0.92]]);
      ctx.fill();
      ctx.fillStyle = art.mark2;
      quadPath(ctx, q, [[-0.3, 0.42], [-0.3, 0.6], [1.3, 1.3], [1.3, 1.06]]);
      ctx.fill();
      return;
    default: throw new Error(`unhandled: ${art.kind satisfies never}`);
  }
}

/** Side-view tail art, clipped to the fin. `size` ≈ fin height in local units. */
export function finArtSide(ctx: CanvasRenderingContext2D, l: Look, f: Fin, size: number): void {
  if (l.tail.kind === 'none') return;
  ctx.save();
  ctx.clip(f.path);
  ctx.fillStyle = l.tail.color;
  ctx.fill(f.path);
  finMarks(ctx, l.tail, f, size);
  ctx.restore();
}

/** Top-view fins: the tail colour, plus bands across the fin as a cue of the art (stripes / chevrons / rays). */
export function finArtTop(ctx: CanvasRenderingContext2D, l: Look, fins: readonly Fin[]): void {
  const art = l.tail;
  if (art.kind === 'none') {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (const f of fins) ctx.fill(f.path);
    return;
  }
  for (const f of fins) {
    ctx.fillStyle = art.color;
    ctx.fill(f.path);
    if (art.kind === 'solid' || art.kind === 'skull' || art.kind === 'gold') continue;
    ctx.save();
    ctx.clip(f.path);
    if (art.kind === 'band') {
      ctx.fillStyle = art.mark;
      quadPath(ctx, f.q, [[-0.1, 0.5], [1.1, 0.5], [1.1, 1.2], [-0.1, 1.2]]);
      ctx.fill();
    } else {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 1 && art.mark2 ? art.mark2 : art.mark;
        const u = 0.1 + i * 0.22;
        quadPath(ctx, f.q, [[u, -0.2], [u + 0.1, -0.2], [u + 0.06, 1.2], [u - 0.04, 1.2]]);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}
