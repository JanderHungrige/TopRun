import { TAU } from '../../core/math';
import { drawPlaneTop } from '../draw-planes';
import { fillPoly, flame } from '../shapes';

// Missile Evasion (doc 16): hub / offer card icon within ±40 px — a jet breaking hard and popping
// flares, a missile curving after it on a smoke trail.

/** The missile's path, k = 0 … 1 (bottom left towards the jet's tail). */
const path = (k: number): [number, number] => [-36 + k * 34, 36 - k * 30 - Math.sin(k * Math.PI) * 8];

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,240,${a.toFixed(3)})`);
  g.addColorStop(0.35, `rgba(255,214,120,${(a * 0.85).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function missile(ctx: CanvasRenderingContext2D, k: number, t: number): void {
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = k - (i / 14) * 0.7;
    if (a <= 0) break;
    const [x0, y0] = path(a);
    const [x1, y1] = path(Math.max(0, a - 0.05));
    ctx.strokeStyle = `rgba(240,240,235,${(0.75 - i * 0.05).toFixed(3)})`;
    ctx.lineWidth = 1.6 + i * 0.35;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  const [mx, my] = path(k);
  const [nx, ny] = path(k + 0.02);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(Math.atan2(nx - mx, -(ny - my)));
  flame(ctx, 0, 5, 3, 0.7, t * 3);
  fillPoly(ctx, [-1.5, 5, -1.5, -3.5, 0, -6.5, 1.5, -3.5, 1.5, 5], '#f1f0ea');
  ctx.fillStyle = '#c8312a';
  ctx.fillRect(-1.5, -2, 3, 1.3);
  ctx.restore();
}

export function drawEvasionIcon(ctx: CanvasRenderingContext2D, t: number): void {
  missile(ctx, 0.35 + 0.55 * ((t * 0.35) % 1), t);
  for (let i = 0; i < 3; i++) {
    const f = (t * 0.9 + i / 3) % 1;
    glow(ctx, 6 - f * 20 + i * 4, 4 + f * 16 - i * 2, 4 + (1 - f) * 4, 1 - f * 0.8);
  }
  ctx.save();
  ctx.translate(14, -10);
  ctx.rotate(0.62 + Math.sin(t * 2) * 0.1);
  drawPlaneTop(ctx, 'f16', 0, 0, 0.62, { bank: 0.8, throttle: 1, t });
  ctx.restore();
}
