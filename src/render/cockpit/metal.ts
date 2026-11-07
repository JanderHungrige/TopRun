import type { Rect } from './layout';
import { FONT_BODY, FONT_TYPE } from '../text';
import { SK } from './skin';

/** Primitives for the cockpit consoles: plates, bevels, fasteners, engraved legends — in the current skin (doc 61). */

/** Screens and stencils type too (doc 20: typewriter everywhere). */
export const MONO = FONT_TYPE;
const TAU = Math.PI * 2;

/** Deterministic 0..1 for static decoration. */
export function rnd(n: number): number {
  const s = Math.sin(n * 91.7 + 13.3) * 43758.5453;
  return s - Math.floor(s);
}

/** A panel outline: rounded, or with its corners cut at an angle on the spacecraft (doc 61). */
export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (SK.corner === 'round' || r < 2) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const c = Math.min(r * 1.3, w / 3, h / 3);
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

/** Raised (or sunken) rounded panel with a one-unit bevel: light top-left, dark bottom-right. */
export function bevel(ctx: CanvasRenderingContext2D, r: Rect, radius: number, fill: string, sunken = false): void {
  const [a, b] = sunken ? [SK.sunkLo, SK.sunkHi] : [SK.bevelHi, SK.bevelLo];
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
  if (SK.edgeGlow) {
    ctx.strokeStyle = `rgba(${SK.edgeGlow},${sunken ? 0.28 : 0.6})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Raised sub-plate with a fastener in each corner. */
export function subPlate(ctx: CanvasRenderingContext2D, r: Rect, seed: number): void {
  bevel(ctx, r, 5, SK.plate);
  const i = 7;
  screw(ctx, r.x + i, r.y + i, seed);
  screw(ctx, r.x + r.w - i, r.y + i, seed + 1);
  screw(ctx, r.x + i, r.y + r.h - i, seed + 2);
  screw(ctx, r.x + r.w - i, r.y + r.h - i, seed + 3);
}

/** A fastener in the skin's style: a slotted screw, a domed rivet, or (glass) a small status light. */
export function screw(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number, r = 3.2): void {
  const [shadow, head, hi] = SK.metal;
  if (SK.fastener === 'none') {
    ctx.fillStyle = `rgba(${SK.edgeGlow ?? '255,255,255'},0.55)`;
    ctx.fillRect(x - 1, y - 1, 2, 2);
    return;
  }
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(x + 0.4, y + 0.6, r + 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.6, 0, TAU);
  ctx.fill();
  if (SK.fastener === 'rivet') return;
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
  g.addColorStop(0, SK.bezel[0]);
  g.addColorStop(0.5, SK.bezel[1]);
  g.addColorStop(1, SK.bezel[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
  if (SK.edgeGlow) {
    ctx.strokeStyle = `rgba(${SK.edgeGlow},0.6)`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.fillStyle = SK.bezelRing;
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
  ctx.fillStyle = o.color ?? SK.legend;
  ctx.fillText(s, x, y, o.maxW);
  ctx.restore();
}

/** Screen text (no drop shadow) — MFD and lamp legends. */
export function screenText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: LegendOpts = {}): void {
  ctx.save();
  fitFont(ctx, s, { mono: true, ...o });
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color ?? SK.ink;
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
