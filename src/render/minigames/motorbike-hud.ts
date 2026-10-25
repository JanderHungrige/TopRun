import { clamp, easeOutCubic } from '../../core/math';
import { pixelFrame, RPG_BOX } from '../pixel/frame';
import { fillPoly } from '../shapes';
import { COLORS, measure, text } from '../text';

// Motorbike vs. Jet (doc 22): race strip (start → lift-off flag, bike and jet markers, the gap), the obstacle
// prompt with its key cap, popups over the bike and the end banner.

export interface StripView {
  /** 0 … 1 along the strip (1 = lift-off marker). */
  bike: number;
  jet: number;
  gap: string;
  gapLabel: string;
  ahead: boolean;
  youLabel: string;
  jetLabel: string;
}

const STRIP = { x: 724, y: 64, w: 540, h: 58 };

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, label: string, up: boolean): void {
  fillPoly(ctx, up ? [x, y, x - 6, y + 9, x + 6, y + 9] : [x, y, x - 6, y - 9, x + 6, y - 9], color);
  text(ctx, label, x, up ? y + 21 : y - 12, { size: 10, align: 'center', color, weight: 800 });
}

function flag(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#c9d4e4';
  ctx.fillRect(x - 1, y - 12, 2, 24);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
    ctx.fillStyle = (i + k) % 2 ? '#16141a' : '#f4f0e8';
    ctx.fillRect(x + 1 + i * 3, y - 12 + k * 3, 3, 3);
  }
}

export function drawRaceStrip(ctx: CanvasRenderingContext2D, v: StripView): void {
  pixelFrame(ctx, STRIP, RPG_BOX, 2);
  const x0 = STRIP.x + 22;
  const x1 = STRIP.x + 340;
  const y = STRIP.y + 30;
  ctx.fillStyle = '#3a4560';
  ctx.fillRect(x0, y - 2, x1 - x0 + 16, 4);
  ctx.fillStyle = '#c9d4e4';
  ctx.fillRect(x0 - 1, y - 6, 2, 12);
  flag(ctx, x1, y);
  const at = (f: number): number => x0 + (x1 - x0) * clamp(f, 0, 1.05);
  marker(ctx, at(v.jet), y - 4, '#9fd8ff', v.jetLabel, false);
  marker(ctx, at(v.bike), y + 4, '#ffb35c', v.youLabel, true);
  const color = v.ahead ? COLORS.green : COLORS.red;
  text(ctx, v.gap, STRIP.x + STRIP.w - 14, STRIP.y + 33, { size: 26, display: true, align: 'right', color });
  text(ctx, v.gapLabel, STRIP.x + STRIP.w - 14, STRIP.y + 49, { size: 10, align: 'right', color, weight: 800, letterSpacing: 2 });
}

export interface PromptView {
  what: string;
  action: string;
  /** Key cap glyph, or null for none. */
  key: string | null;
  /** 0 … 1: how close (1 = there). */
  near: number;
  /** The rider is doing the right thing. */
  ok: boolean;
  /** Red: brake now. */
  danger: boolean;
  t: number;
}

function keyCap(ctx: CanvasRenderingContext2D, x: number, y: number, glyph: string, lit: boolean): void {
  ctx.fillStyle = lit ? '#fff3c4' : '#d9dee8';
  ctx.fillRect(x, y, 36, 34);
  ctx.fillStyle = lit ? '#c99a2e' : '#7d879a';
  ctx.fillRect(x, y + 30, 36, 4);
  text(ctx, glyph, x + 18, y + 25, { size: 22, display: true, align: 'center', color: '#141820' });
}

export function drawPrompt(ctx: CanvasRenderingContext2D, v: PromptView): void {
  const w = Math.max(260, measure(ctx, v.action, 26, true) + 140);
  const box = { x: 640 - w / 2, y: 152, w, h: 64 };
  const pulse = v.danger ? 0.5 + 0.5 * Math.sin(v.t * 18) : 0;
  ctx.save();
  ctx.globalAlpha = clamp(v.near * 3, 0, 1);
  pixelFrame(ctx, box, RPG_BOX, 2);
  const color = v.ok ? COLORS.green : v.danger ? `rgb(255,${Math.round(79 + 120 * pulse)},79)` : COLORS.gold;
  text(ctx, v.what, box.x + 16, box.y + 22, { size: 12, color: COLORS.dim, weight: 800, letterSpacing: 2 });
  text(ctx, v.action, box.x + 16, box.y + 50, { size: 26, display: true, italic: true, color });
  if (v.key) keyCap(ctx, box.x + w - 52, box.y + 14, v.key, v.ok);
  ctx.fillStyle = color;
  ctx.fillRect(box.x + 6, box.y + box.h - 7, (w - 12) * clamp(v.near, 0, 1), 3);
  ctx.restore();
}

export interface Popup {
  text: string;
  color: string;
  x: number;
  y: number;
  age: number;
  size: number;
}

export const POPUP_LIFE = 1.1;

export function drawPopups(ctx: CanvasRenderingContext2D, popups: readonly Popup[]): void {
  for (const p of popups) {
    const f = p.age / POPUP_LIFE;
    const a = f < 0.75 ? 1 : 1 - (f - 0.75) / 0.25;
    text(ctx, p.text, p.x, p.y - easeOutCubic(Math.min(1, f * 1.6)) * 34, {
      size: p.size, display: true, italic: true, align: 'center', color: p.color, stroke: '#0a0610', strokeWidth: 5, alpha: a,
    });
  }
}

export function drawBanner(ctx: CanvasRenderingContext2D, title: string, sub: string, color: string, age: number): void {
  const k = easeOutCubic(clamp(age / 0.35, 0, 1));
  ctx.save();
  ctx.fillStyle = `rgba(8,6,16,${(0.62 * k).toFixed(3)})`;
  ctx.fillRect(0, 272, 1280, 118);
  ctx.translate(640, 334);
  ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
  text(ctx, title, 0, 0, { size: 50, display: true, italic: true, align: 'center', color, stroke: '#0a0610', strokeWidth: 7, alpha: k });
  text(ctx, sub, 0, 38, { size: 20, align: 'center', color: COLORS.ink, weight: 700, alpha: k, type: true });
  ctx.restore();
}
