import type { Pal } from '../draw-ground-units';
import { circle, ellipse, fillPoly, flame } from '../shapes';

/** Effects shared by the enemy units, their wrecks and the bosses (re-exported by draw-enemies.ts). */

/** Deterministic 0..1 hash. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Three looping smoke puffs rising from (x, y) and drifting toward -y. */
export function smoke(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, seed: number): void {
  const a0 = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const k = (((t * 0.5 + hash(seed) + i / 3) % 1) + 1) % 1;
    ctx.globalAlpha = a0 * (1 - k) * 0.55;
    const px = x + Math.sin(seed * 3 + k * 4) * size * 0.4 + k * size * 0.8;
    circle(ctx, px, y - k * size * 3.4, size * (0.45 + k * 1.1), k < 0.35 ? '#262422' : '#57534d');
  }
  ctx.globalAlpha = a0;
}

export function fire(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, t: number, seed: number): void {
  const f = 0.8 + 0.14 * Math.sin(t * 23 + seed * 7) + 0.08 * Math.sin(t * 41 + seed);
  ellipse(ctx, x, y - size * 0.25, size * f, size * 1.3 * f, 'rgba(255,84,24,0.6)');
  ellipse(ctx, x, y, size * 0.62 * f, size * 0.8 * f, 'rgba(255,184,56,0.9)');
  circle(ctx, x, y + size * 0.1, size * 0.28 * f, '#fff2c0');
}

/** Irregular burn mark. */
export function scorch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number, fill = 'rgba(22,18,14,0.62)'): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const d = r * (0.6 + 0.4 * hash(seed * 13 + i));
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); // first lineTo on an empty path acts as moveTo
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Afterburner pointing backwards (-y) from (x, y), scaled by k. */
export function exhaust(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, power: number, t: number, k = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, -k);
  flame(ctx, 0, 0, w, power, t);
  ctx.restore();
}

/** Hostile insignia at (±x, y): black disc with a red chevron pointing at the nose (bosses only). */
export function roundel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, p: Pal): void {
  for (const sx of [x, -x]) {
    circle(ctx, sx, y, r, '#151515');
    fillPoly(ctx, [sx - r * 0.72, y - r * 0.5, sx, y + r * 0.15, sx + r * 0.72, y - r * 0.5, sx + r * 0.72, y + r * 0.12, sx, y + r * 0.8, sx - r * 0.72, y + r * 0.12], p.red);
  }
}
