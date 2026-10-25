import { clamp, TAU } from '../../core/math';
import { circle } from '../shapes';
import { COLORS, text } from '../text';

// Missile Evasion (doc 16): HUD in screen space — hull and wave, round clock, G meter, the BREAK and
// FLARE buttons (also the touch targets), pop-ups, banners and the high-G vision tunnel.

export interface Rect { x: number; y: number; w: number; h: number }
export const BREAK_BTN: Rect = Object.freeze({ x: 1018, y: 596, w: 104, h: 104 });
export const FLARE_BTN: Rect = Object.freeze({ x: 1144, y: 572, w: 116, h: 116 });
const G_MAX = 9;

export function drawHull(ctx: CanvasRenderingContext2D, hull: number, max: number, label: string, wave: string, flash: number): void {
  text(ctx, label, 22, 80, { size: 11, display: true, color: COLORS.ink, letterSpacing: 2, stroke: 'rgba(0,0,0,0.55)', strokeWidth: 3 });
  for (let i = 0; i < max; i++) {
    const ok = i < hull;
    const x = 30 + i * 30;
    ctx.fillStyle = ok ? (flash > 0 && i === hull - 1 ? '#ffffff' : COLORS.green) : 'rgba(255,79,79,0.35)';
    ctx.beginPath();
    ctx.moveTo(x, 90);
    ctx.lineTo(x + 11, 94);
    ctx.lineTo(x + 11, 104);
    ctx.lineTo(x, 112);
    ctx.lineTo(x - 11, 104);
    ctx.lineTo(x - 11, 94);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, wave, 24, 140, { size: 18, display: true, italic: true, color: COLORS.gold, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 4 });
}

export function drawClock(ctx: CanvasRenderingContext2D, left: number, total: number, label: string): void {
  const f = clamp(left / total, 0, 1);
  const hot = left <= 10;
  ctx.fillStyle = 'rgba(4,8,14,0.55)';
  ctx.fillRect(490, 66, 300, 8);
  ctx.fillStyle = hot ? COLORS.red : COLORS.cyan;
  ctx.fillRect(490, 66, 300 * f, 8);
  text(ctx, label, 640, 98, { size: 20, display: true, align: 'center', color: hot ? COLORS.red : COLORS.ink, stroke: 'rgba(0,0,0,0.55)', strokeWidth: 4 });
}

/** G meter: a dial from 1 to 9 G, green / amber / red bands. */
export function drawGMeter(ctx: CanvasRenderingContext2D, g: number, label: string): void {
  const cx = 96;
  const cy = 646;
  const r = 50;
  const a0 = Math.PI * 0.75;
  const span = Math.PI * 1.5;
  const at = (v: number) => a0 + span * clamp((v - 1) / (G_MAX - 1), 0, 1);
  circle(ctx, cx, cy, r + 10, 'rgba(4,8,14,0.6)');
  const bands: Array<[number, number, string]> = [[1, 5, COLORS.green], [5, 7, COLORS.amber], [7, G_MAX, COLORS.red]];
  ctx.lineWidth = 6;
  for (const [lo, hi, c] of bands) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, r, at(lo), at(hi));
    ctx.stroke();
  }
  const n = at(g);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(n) * (r - 4), cy + Math.sin(n) * (r - 4));
  ctx.stroke();
  circle(ctx, cx, cy, 4, '#ffffff');
  text(ctx, label, cx, cy + 32, { size: 15, display: true, align: 'center', color: g >= 7 ? COLORS.red : COLORS.ink });
}

function button(ctx: CanvasRenderingContext2D, r: Rect, ready: boolean, hot: boolean): { cx: number; cy: number; rad: number } {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rad = r.w / 2;
  circle(ctx, cx, cy, rad, hot ? 'rgba(80,40,10,0.85)' : 'rgba(4,8,14,0.7)');
  ctx.strokeStyle = ready ? (hot ? COLORS.gold : 'rgba(150,200,240,0.7)') : 'rgba(120,140,160,0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, rad - 2, 0, TAU);
  ctx.stroke();
  return { cx, cy, rad };
}

export interface BreakView { ready: boolean; active: boolean; cooldown: number; label: string; key: string; status: string }

export function drawBreakButton(ctx: CanvasRenderingContext2D, v: BreakView, t: number): void {
  const { cx, cy, rad } = button(ctx, BREAK_BTN, v.ready, v.active);
  if (!v.ready) {
    ctx.strokeStyle = COLORS.amber;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad - 7, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - v.cooldown));
    ctx.stroke();
  }
  const glow = v.ready && !v.active ? 0.75 + 0.25 * Math.sin(t * 5) : 1;
  text(ctx, v.label, cx, cy + 2, { size: 17, display: true, align: 'center', color: v.ready ? COLORS.ink : COLORS.faint, alpha: glow });
  text(ctx, v.status, cx, cy + 22, { size: 11, align: 'center', color: v.ready ? COLORS.green : COLORS.dim });
  if (v.key) text(ctx, v.key, cx, cy - 20, { size: 12, display: true, align: 'center', color: COLORS.cyan });
}

export interface FlareView { charges: number; max: number; recharge: number; hot: boolean; label: string; key: string }

export function drawFlareButton(ctx: CanvasRenderingContext2D, v: FlareView, t: number): void {
  const ready = v.charges > 0;
  const hot = v.hot && ready && Math.sin(t * 12) > -0.3;
  const { cx, cy } = button(ctx, FLARE_BTN, ready, hot);
  for (let i = 0; i < v.max; i++) {
    const x = cx + (i - (v.max - 1) / 2) * 18;
    const full = i < v.charges;
    const charging = i === v.charges;
    circle(ctx, x, cy + 20, 6, full ? '#ffd27a' : 'rgba(255,210,122,0.18)');
    if (charging) {
      ctx.fillStyle = 'rgba(255,210,122,0.75)';
      ctx.beginPath();
      ctx.moveTo(x, cy + 20);
      ctx.arc(x, cy + 20, 6, -Math.PI / 2, -Math.PI / 2 + TAU * v.recharge);
      ctx.closePath();
      ctx.fill();
    }
  }
  text(ctx, v.label, cx, cy + 4, { size: 18, display: true, align: 'center', color: ready ? COLORS.ink : COLORS.faint });
  if (v.key) text(ctx, v.key, cx, cy - 22, { size: 12, display: true, align: 'center', color: COLORS.cyan });
}

export interface Popup { text: string; color: string; x: number; y: number; age: number; size: number }
export const POPUP_LIFE = 1.3;

/** Pop-ups in world coordinates (call inside the camera transform). */
export function drawPopups(ctx: CanvasRenderingContext2D, popups: readonly Popup[]): void {
  for (const p of popups) {
    const f = p.age / POPUP_LIFE;
    text(ctx, p.text, p.x, p.y - f * 46, {
      size: p.size, display: true, align: 'center', color: p.color, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 4, alpha: clamp((1 - f) * 2, 0, 1),
    });
  }
}

/** A big centred banner that fades in, holds and fades out over `life` seconds. */
export function drawBanner(ctx: CanvasRenderingContext2D, title: string, sub: string, color: string, age: number, life: number, y = 300): void {
  const a = clamp(Math.min(age * 5, (life - age) * 3), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, title, 640, y, { size: 52, display: true, italic: true, align: 'center', color, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 8 });
  if (sub) text(ctx, sub, 640, y + 44, { size: 22, display: true, align: 'center', color: COLORS.ink, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 5 });
  ctx.restore();
}

/** High-G vision tunnel: the edges grey out above 6 G. */
export function drawTunnel(ctx: CanvasRenderingContext2D, g: number, x: number, y: number): void {
  const k = clamp((g - 6) / 3, 0, 1);
  if (k <= 0) return;
  const grad = ctx.createRadialGradient(x, y, 260 - 120 * k, x, y, 760 - 220 * k);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(6,4,4,${(0.88 * k).toFixed(3)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 56, 1280, 664);
}
