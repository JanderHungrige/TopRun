import type { Rect } from './layout';
import { FONT_BODY } from '../text';

/** Gunmetal primitives for the cockpit consoles: plates, bevels, screws, scratches, engraved legends. */

export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace';
export const PHOSPHOR = '#62f08a';
export const PHOSPHOR_DIM = 'rgba(98,240,138,0.45)';
export const LEGEND = '#d8dee3';
const TAU = Math.PI * 2;

/** Deterministic 0..1 for static decoration. */
export function rnd(n: number): number {
  const s = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return s - Math.floor(s);
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** The whole console: gunmetal gradient, brushed streaks, scratches and a seam towards the playfield. */
export function backplate(ctx: CanvasRenderingContext2D, x: number, seed: number, seamX: number): void {
  const g = ctx.createLinearGradient(x, 0, x + 320, 720);
  g.addColorStop(0, '#3b4148');
  g.addColorStop(0.55, '#2a2f35');
  g.addColorStop(1, '#1b1e22');
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, 320, 720);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.012 + rnd(seed + i * 3) * 0.03).toFixed(3)})`;
    ctx.fillRect(x, rnd(seed + i) * 720, 320, 0.5);
  }
  ctx.beginPath();
  for (let i = 0; i < 34; i++) {
    const sx = x + rnd(seed * 7 + i) * 320;
    const sy = rnd(seed * 11 + i) * 720;
    const a = rnd(seed * 13 + i) * Math.PI;
    const l = 5 + rnd(seed * 17 + i) * 24;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
  }
  ctx.strokeStyle = 'rgba(225,232,240,0.09)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = '#0a0c0e';
  ctx.fillRect(seamX - 2, 0, 4, 720);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(seamX + (seamX > x + 160 ? -3 : 2), 0, 1, 720);
}

/** Raised (or sunken) rounded panel with a one-unit bevel: light top-left, dark bottom-right. */
export function bevel(ctx: CanvasRenderingContext2D, r: Rect, radius: number, fill: string, sunken = false): void {
  const [a, b] = sunken ? ['#0b0d0f', '#5d656d'] : ['#5f6871', '#0d0f12'];
  if (!sunken) {
    rr(ctx, r.x + 1.5, r.y + 2.5, r.w, r.h, radius);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();
  }
  rr(ctx, r.x - 1, r.y - 1, r.w, r.h, radius);
  ctx.fillStyle = a;
  ctx.fill();
  rr(ctx, r.x + 1, r.y + 1, r.w, r.h, radius);
  ctx.fillStyle = b;
  ctx.fill();
  rr(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Raised sub-plate with a screw in each corner. */
export function subPlate(ctx: CanvasRenderingContext2D, r: Rect, seed: number): void {
  bevel(ctx, r, 5, '#30363c');
  const i = 7;
  screw(ctx, r.x + i, r.y + i, seed);
  screw(ctx, r.x + r.w - i, r.y + i, seed + 1);
  screw(ctx, r.x + i, r.y + r.h - i, seed + 2);
  screw(ctx, r.x + r.w - i, r.y + r.h - i, seed + 3);
}

export function screw(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, r = 3.2): void {
  ctx.fillStyle = '#0c0e10';
  ctx.beginPath();
  ctx.arc(x + 0.4, y + 0.6, r + 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#7b848c';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9ea7ae';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, TAU);
  ctx.fill();
  const a = rnd(seed) * Math.PI;
  ctx.strokeStyle = '#24282c';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(a) * r * 0.8, y - Math.sin(a) * r * 0.8);
  ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
  ctx.stroke();
}

/** Deep round instrument bezel from radius r down to the face radius `inner`, with four screws on the plate. */
export function roundBezel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, inner: number, seed: number): void {
  const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  g.addColorStop(0, '#6c757e');
  g.addColorStop(0.5, '#262a2f');
  g.addColorStop(1, '#0b0c0e');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#101215';
  ctx.beginPath();
  ctx.arc(cx, cy, (r + inner) / 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, inner + 1, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    screw(ctx, cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7), seed + k, 2.8);
  }
}

export interface LegendOpts { size?: number; align?: CanvasTextAlign; maxW?: number; color?: string; spacing?: number; mono?: boolean; weight?: number }

/** Sets a font that fits `s` into maxW: shrinks down to 70 % first, the rest is squeezed by fillText's maxWidth. */
export function fitFont(ctx: CanvasRenderingContext2D, s: string, o: LegendOpts): void {
  const size = o.size ?? 11;
  const font = (px: number): string => `${o.weight ?? 700} ${px.toFixed(1)}px ${o.mono ? MONO : FONT_BODY}`;
  ctx.font = font(size);
  ctx.letterSpacing = `${o.spacing ?? 0}px`;
  const w = ctx.measureText(s).width;
  if (o.maxW !== undefined && w > o.maxW) ctx.font = font(Math.max(size * 0.7, (size * o.maxW) / w));
}

/** Painted legend with a dark drop so it reads as cut into the metal. */
export function legend(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: LegendOpts = {}): void {
  ctx.save();
  fitFont(ctx, s, { spacing: 1.2, ...o });
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillText(s, x + 0.6, y + 0.9, o.maxW);
  ctx.fillStyle = o.color ?? LEGEND;
  ctx.fillText(s, x, y, o.maxW);
  ctx.restore();
}

/** Screen text (no drop shadow) — MFD and lamp legends. */
export function screenText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: LegendOpts = {}): void {
  ctx.save();
  fitFont(ctx, s, { mono: true, ...o });
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color ?? PHOSPHOR;
  ctx.fillText(s, x, y, o.maxW);
  ctx.restore();
}

/** Soft halo without gradients: three expanding translucent rounded rects. `rgb` is "r,g,b". */
export function halo(ctx: CanvasRenderingContext2D, r: Rect, radius: number, rgb: string, a: number): void {
  for (let i = 3; i >= 1; i--) {
    rr(ctx, r.x - i * 3, r.y - i * 3, r.w + i * 6, r.h + i * 6, radius + i * 3);
    ctx.fillStyle = `rgba(${rgb},${((a * 0.22) / i).toFixed(3)})`;
    ctx.fill();
  }
}
