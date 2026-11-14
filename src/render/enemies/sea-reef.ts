import { shade } from '../detail/color';
import { shell } from '../detail/organic';
import { edges, path, type Pts } from '../detail/parts';
import type { SeaPal } from './sea-pal';

// The seabed under the sea's fixed machines (doc 120): faceted rock lit from the upper left, branching coral, sponges,
// anemones, and kelp streaming in the current (live, swaying).

type Ctx = CanvasRenderingContext2D;

/** A rock: facets from an inner point to each edge, shaded by how they face the light, cracks, speckles, outline. */
export function rockFacets(ctx: Ctx, pts: Pts, cx: number, cy: number, colour: string, ink: string): void {
  const n = pts.length / 2;
  ctx.fillStyle = colour;
  ctx.fill(path(pts));
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2] ?? 0, y0 = pts[i * 2 + 1] ?? 0;
    const x1 = pts[((i + 1) % n) * 2] ?? 0, y1 = pts[((i + 1) % n) * 2 + 1] ?? 0;
    const mx = (x0 + x1) / 2 - cx, my = (y0 + y1) / 2 - cy;
    const facing = -(mx + my) / (Math.hypot(mx, my) * Math.SQRT2 || 1);
    ctx.fillStyle = shade(colour, facing * 0.32 + (i % 2 ? 0.04 : -0.04));
    ctx.fill(path([cx, cy, x0, y0, x1, y1]));
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 0.3;
    ctx.stroke(path([cx, cy, x0 * 0.92 + cx * 0.08, y0 * 0.92 + cy * 0.08], false));
  }
  const span = Math.max(...pts.map(Math.abs));
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let k = 0; k < 14; k++) { // pits and sediment
    const a = k * 2.4, r = span * (0.25 + ((k * 37) % 50) / 100);
    ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, span * 0.03, span * 0.03);
  }
  edges(ctx, pts, Math.max(0.4, span * 0.03));
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(0.5, span * 0.035);
  ctx.stroke(path(pts));
}

/** A branching coral fan from (x, y) along angle a, size s: forking twigs thinning out, polyps at the tips. */
export function coral(ctx: Ctx, x: number, y: number, a: number, s: number, colour: string, ink: string): void {
  const twig = (x0: number, y0: number, ang: number, len: number, depth: number): void => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const w = s * 0.035 * (depth + 1.5);
    ctx.strokeStyle = ink;
    ctx.lineWidth = w + 0.6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = shade(colour, (3 - depth) * 0.1);
    ctx.lineWidth = w;
    ctx.stroke();
    if (depth > 0) for (const d of [-0.42, 0.38]) twig(x1, y1, ang + d + depth * 0.05, len * 0.72, depth - 1);
    else {
      ctx.fillStyle = shade(colour, 0.6);
      ctx.beginPath();
      ctx.arc(x1, y1, w * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  twig(x, y, a, s * 0.36, 3);
}

/** Pebbles scattered over a seabed: small lit stones. */
export function pebbles(ctx: Ctx, x: number, y: number, r: number, n: number, colour: string, ink: string): void {
  for (let k = 0; k < n; k++) {
    const a = k * 2.4, d = r * (0.2 + ((k * 31) % 80) / 100);
    const s = 1.2 + ((k * 17) % 5) * 0.5;
    shell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, s, s * 0.75, { base: colour, dark: shade(colour, -0.5), light: shade(colour, 0.5), ink }, 0);
  }
}

/** A sponge or anemone cluster: round polyps in a ring with dark mouths. */
export function polyps(ctx: Ctx, x: number, y: number, r: number, colour: string, ink: string, n = 5): void {
  for (let k = 0; k < n; k++) {
    const a = k * ((Math.PI * 2) / n) + 0.4;
    const px = x + Math.cos(a) * r * 0.9, py = y + Math.sin(a) * r * 0.8;
    shell(ctx, px, py, r * 0.75, r * 0.75, { base: colour, dark: shade(colour, -0.5), light: shade(colour, 0.6), ink }, 0);
    ctx.fillStyle = 'rgba(30,10,20,0.6)';
    ctx.beginPath();
    ctx.arc(px + r * 0.08, py + r * 0.08, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A frond of kelp from (x, y) streaming along angle a in the current, swaying with t; one colour in silhouettes. */
export function kelp(ctx: Ctx, p: SeaPal, x: number, y: number, a: number, len: number, t: number): void {
  const ux = Math.cos(a), uy = Math.sin(a);
  const pts: number[] = [];
  for (let k = 0; k <= 6; k++) {
    const d = (k / 6) * len, sw = Math.sin(t * 1.6 + k * 0.8) * k * 0.35;
    pts.push(x + ux * d - uy * sw, y + uy * d + ux * sw);
  }
  const stem = path(pts, false);
  ctx.lineCap = 'round';
  ctx.strokeStyle = p.mono ? p.hull : p.ink;
  ctx.lineWidth = 2;
  ctx.stroke(stem);
  ctx.strokeStyle = p.mono ? p.hull : '#5e7a2a';
  ctx.lineWidth = 1.3;
  ctx.stroke(stem);
  for (let k = 1; k < 6; k++) { // leaf blades, left and right in turn
    const bx = pts[k * 2] ?? 0, by = pts[k * 2 + 1] ?? 0, s = k % 2 ? 1 : -1;
    ctx.fillStyle = p.mono ? p.hull : k % 2 ? '#7c9a3a' : '#5a7628';
    ctx.beginPath();
    ctx.ellipse(bx - uy * s * 1.4, by + ux * s * 1.4, 1.9, 0.8, a + s * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (p.mono) return;
  ctx.strokeStyle = 'rgba(220,240,160,0.35)';
  ctx.lineWidth = 0.35;
  ctx.stroke(stem);
}
