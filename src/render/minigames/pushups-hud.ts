import { clamp, easeOutCubic } from '../../core/math';
import type { LastRep, RepRating } from '../../game/minigames/pushups';
import { fillPoly } from '../shapes';
import { COLORS, text } from '../text';

// Push-up Challenge HUD (doc 12): tempo meter, stamina bar, DOWN / UP key hints, pop-ups, banner.

export const METER_SPAN = 1.5;
export const RATING_COLOR: Readonly<Record<RepRating, string>> = { clean: COLORS.green, fast: COLORS.red, slow: COLORS.amber };

export interface MeterView {
  x: number;
  y: number;
  w: number;
  label: string;
  zone: { min: number; max: number };
  /** Seconds since the last rep, null before the first. */
  clock: number | null;
  last: LastRep | null;
  time: number;
  t: number;
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, w + 6, h + 6, 6);
  ctx.fillStyle = 'rgba(4,8,14,0.78)';
  ctx.fill();
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawTempoMeter(ctx: CanvasRenderingContext2D, m: MeterView): void {
  const h = 22;
  const px = (s: number): number => m.x + (clamp(s, 0, METER_SPAN) / METER_SPAN) * m.w;
  text(ctx, m.label, m.x, m.y - 15, { size: 12, color: COLORS.dim, letterSpacing: 2 });
  bar(ctx, m.x, m.y, m.w, h);
  ctx.fillStyle = '#7a2420';
  ctx.fillRect(m.x, m.y, px(m.zone.min) - m.x, h);
  ctx.fillStyle = '#2f9a4e';
  ctx.fillRect(px(m.zone.min), m.y, px(m.zone.max) - px(m.zone.min), h);
  ctx.fillStyle = '#8a5a1e';
  ctx.fillRect(px(m.zone.max), m.y, m.x + m.w - px(m.zone.max), h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(m.x, m.y, m.w, 3);
  const age = m.last ? m.time - m.last.at : Infinity;
  if (m.last && m.last.interval !== null && age < 0.8) {
    const gx = px(m.last.interval);
    ctx.globalAlpha = 1 - age / 0.8;
    ctx.fillStyle = RATING_COLOR[m.last.rating];
    ctx.fillRect(gx - 3, m.y - 6, 6, h + 12);
    ctx.globalAlpha = 1;
  }
  const nx = m.clock === null ? m.x + 2 + Math.abs(Math.sin(m.t * 4)) * 6 : px(m.clock);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(nx - 1.5, m.y - 4, 3, h + 8);
  fillPoly(ctx, [nx - 7, m.y - 12, nx + 7, m.y - 12, nx, m.y - 3], '#ffffff');
}

export interface StaminaView {
  x: number;
  y: number;
  w: number;
  label: string;
  hint: string;
  burnoutLabel: string;
  /** 0 … 1. */
  value: number;
  /** 0 … 1 through the burnout, null when not burnt out. */
  burnout: number | null;
  t: number;
}

export function drawStaminaBar(ctx: CanvasRenderingContext2D, s: StaminaView): void {
  const h = 14;
  text(ctx, s.label, s.x, s.y - 8, { size: 12, color: COLORS.dim, letterSpacing: 2 });
  bar(ctx, s.x, s.y, s.w, h);
  if (s.burnout !== null) {
    ctx.fillStyle = 'rgba(255,79,79,0.35)';
    ctx.fillRect(s.x, s.y, s.w * 0.25 * s.burnout, h);
    if (Math.sin(s.t * 14) > -0.3) text(ctx, s.burnoutLabel, s.x + s.w, s.y - 8, { size: 13, display: true, align: 'right', color: COLORS.red });
    return;
  }
  const low = s.value < 0.25;
  const color = s.value > 0.5 ? COLORS.green : low ? COLORS.red : COLORS.amber;
  ctx.globalAlpha = low ? 0.65 + 0.35 * Math.sin(s.t * 12) : 1;
  ctx.fillStyle = color;
  ctx.fillRect(s.x, s.y, s.w * clamp(s.value, 0, 1), h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(s.x, s.y, s.w * clamp(s.value, 0, 1), 3);
  if (s.value < 0.2 && Math.sin(s.t * 6) > -0.2) text(ctx, s.hint, s.x + s.w, s.y - 8, { size: 12, display: true, align: 'right', color: COLORS.amber });
}

export interface KeysView {
  x: number;
  y: number;
  down: string;
  up: string;
  /** Which stroke comes next: true = DOWN (LEFT); null = none (burnout, time up). */
  nextDown: boolean | null;
  flashLeft: number;
  flashRight: number;
  t: number;
}

function keycap(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, dir: -1 | 1, next: boolean, flash: number, t: number): void {
  const w = 180;
  const h = 52;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fillStyle = flash > 0 ? `rgba(255,200,61,${0.25 + flash * 0.5})` : 'rgba(4,8,14,0.72)';
  ctx.fill();
  ctx.lineWidth = next ? 2.5 : 1;
  ctx.strokeStyle = next ? `rgba(255,200,61,${0.6 + 0.4 * Math.sin(t * 8)})` : COLORS.panelEdge;
  ctx.stroke();
  const ax = dir < 0 ? x + 30 : x + w - 30;
  fillPoly(ctx, [ax + dir * 12, y + h / 2, ax - dir * 8, y + h / 2 - 12, ax - dir * 8, y + h / 2 + 12], next ? COLORS.gold : COLORS.dim);
  text(ctx, label, x + w / 2 - dir * 10, y + h / 2 + 7, { size: 20, display: true, align: 'center', color: next ? COLORS.ink : COLORS.dim, maxWidth: w - 70 });
}

export function drawKeyHints(ctx: CanvasRenderingContext2D, k: KeysView): void {
  keycap(ctx, k.x, k.y, k.down, -1, k.nextDown === true, k.flashLeft, k.t);
  keycap(ctx, k.x + 200, k.y, k.up, 1, k.nextDown === false, k.flashRight, k.t);
}

export interface Popup {
  text: string;
  color: string;
  x: number;
  y: number;
  age: number;
  size: number;
}
export const POPUP_LIFE = 0.9;

export function drawPopups(ctx: CanvasRenderingContext2D, list: readonly Popup[]): void {
  for (const p of list) {
    const k = p.age / POPUP_LIFE;
    text(ctx, p.text, p.x, p.y - easeOutCubic(Math.min(1, k * 1.4)) * 46, {
      size: p.size, display: true, italic: true, align: 'center', color: p.color, alpha: 1 - k * k, stroke: '#05070a', strokeWidth: 5,
    });
  }
}

export function drawBurnoutLabel(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, t: number): void {
  const shake = Math.sin(t * 40) * 2;
  text(ctx, label, x + shake, y, { size: 40, display: true, italic: true, align: 'center', color: COLORS.red, stroke: '#05070a', strokeWidth: 7 });
}

/** End-of-round banner; `age` seconds since it appeared. */
export function drawBanner(ctx: CanvasRenderingContext2D, title: string, sub: string, color: string, age: number): void {
  const k = easeOutCubic(Math.min(1, age * 3));
  ctx.save();
  ctx.globalAlpha = k;
  ctx.fillStyle = 'rgba(4,8,14,0.82)';
  ctx.fillRect(0, 286, 1280, 126);
  ctx.fillStyle = color;
  ctx.fillRect(0, 286, 1280, 4);
  ctx.fillRect(0, 408, 1280, 4);
  ctx.translate(640, 350);
  ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
  text(ctx, title, 0, 6, { size: 64, display: true, italic: true, align: 'center', color, stroke: '#05070a', strokeWidth: 8 });
  text(ctx, sub, 0, 46, { size: 26, display: true, align: 'center', color: COLORS.ink });
  ctx.restore();
}
