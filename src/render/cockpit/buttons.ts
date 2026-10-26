import type { Rect } from './layout';
import { FONT_TYPE } from '../text';
import { bevel, halo, legend, rr, screenText, screw } from './metal';

/** Physical backlit push-buttons: a sunken housing in the plate cache, a live cap that lights by state. */

export type CapState = 'ready' | 'cooldown' | 'empty' | 'none' | 'active';
/** Lit colour as "r,g,b" plus the legend ink used on the lit face. */
export interface CapColor { rgb: string; ink: string }

export const AMBER: CapColor = { rgb: '255,170,48', ink: '#2a1600' };
export const RED: CapColor = { rgb: '255,92,64', ink: '#2a0800' };
export const GREEN: CapColor = { rgb: '98,232,130', ink: '#06210f' };
export const CYAN: CapColor = { rgb: '80,214,255', ink: '#03202c' };
export const WHITE: CapColor = { rgb: '226,232,238', ink: '#14181c' };

const INSET = 8;
const cap = (r: Rect): Rect => ({ x: r.x + INSET, y: r.y + INSET, w: r.w - INSET * 2, h: r.h - INSET * 2 - 8 });

export function buttonHousing(ctx: CanvasRenderingContext2D, r: Rect, keyHint: string, seed: number): void {
  bevel(ctx, r, 9, '#171a1d', true);
  screw(ctx, r.x + 6, r.y + r.h - 6, seed, 2.4);
  if (keyHint) legend(ctx, keyHint, r.x + r.w - 7, r.y + r.h - 7.5, { size: 8, align: 'right', maxW: r.w - 22, color: '#9aa4ad' });
  const c = cap(r);
  bevel(ctx, { x: c.x - 2, y: c.y - 2, w: c.w + 4, h: c.h + 4 }, 8, '#0b0d0f', true);
}

export interface Lit { face: string; ink: string; dim: boolean }

/** Draws the cap for a state and returns the legend colours to use on it. */
export function capFace(ctx: CanvasRenderingContext2D, r: Rect, state: CapState, col: CapColor, t: number, progress = 1): Lit {
  const c = cap(r);
  if (state === 'ready' || state === 'active') {
    const a = state === 'active' ? 0.75 + Math.sin(t * 9) * 0.25 : 1;
    halo(ctx, c, 8, col.rgb, a);
    rr(ctx, c.x, c.y, c.w, c.h, 7);
    ctx.fillStyle = `rgba(${col.rgb},${(0.72 + a * 0.28).toFixed(3)})`;
    ctx.fill();
    rr(ctx, c.x + 3, c.y + 3, c.w - 6, c.h * 0.38, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();
    return { face: `rgb(${col.rgb})`, ink: col.ink, dim: false };
  }
  rr(ctx, c.x, c.y, c.w, c.h, 7);
  ctx.fillStyle = '#1d2226';
  ctx.fill();
  if (state === 'cooldown') {
    rr(ctx, c.x, c.y, c.w, c.h, 7);
    ctx.fillStyle = `rgba(${col.rgb},0.22)`;
    ctx.fill();
    const h = c.h * Math.max(0, Math.min(1, progress));
    ctx.save();
    rr(ctx, c.x, c.y, c.w, c.h, 7);
    ctx.clip();
    ctx.fillStyle = `rgba(${col.rgb},0.38)`;
    ctx.fillRect(c.x, c.y + c.h - h, c.w, h);
    ctx.restore();
  }
  rr(ctx, c.x + 3, c.y + 3, c.w - 6, c.h * 0.38, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fill();
  return { face: '#1d2226', ink: state === 'cooldown' ? `rgba(${col.rgb},0.9)` : state === 'empty' ? '#7d868e' : '#4c5359', dim: true };
}

/** Standard push-button: legend in the middle, a small status line (EMPTY / N/A) under it when dark. */
export function pushButton(
  ctx: CanvasRenderingContext2D, r: Rect, state: CapState, col: CapColor, label: string, status: string, t: number, progress = 1,
): void {
  const lit = capFace(ctx, r, state, col, t, progress);
  const c = cap(r);
  const cy = c.y + c.h / 2 - (status ? 6 : 0);
  screenText(ctx, label, c.x + c.w / 2, cy, { size: 15, align: 'center', maxW: c.w - 14, color: lit.ink, weight: 900, mono: false, spacing: 1 });
  if (status) {
    const red = state === 'empty';
    screenText(ctx, status, c.x + c.w / 2, cy + 17, { size: 10, align: 'center', maxW: c.w - 14, color: red ? '#ff5a48' : '#6a737a', weight: 800, mono: false, spacing: 1 });
  }
}

/** Flare button: legend on top, big remaining count in the middle. */
export function flareButton(ctx: CanvasRenderingContext2D, r: Rect, state: CapState, label: string, count: number, status: string, t: number): void {
  const lit = capFace(ctx, r, state, AMBER, t);
  const c = cap(r);
  screenText(ctx, label, c.x + c.w / 2, c.y + 20, { size: 14, align: 'center', maxW: c.w - 14, color: lit.ink, weight: 900, mono: false, spacing: 1 });
  const big = state === 'none' ? '—' : String(count);
  screenText(ctx, big, c.x + c.w / 2, c.y + c.h / 2 + 10, { size: 40, align: 'center', maxW: c.w - 16, color: lit.ink, weight: 900, mono: false });
  if (status) screenText(ctx, status, c.x + c.w / 2, c.y + c.h - 13, { size: 10, align: 'center', maxW: c.w - 14, color: state === 'empty' ? '#ff5a48' : '#6a737a', weight: 800, mono: false, spacing: 1 });
}

/** Special button: recharge ring around a centre disc, the special's name under it; pulses while active. */
export function specialButton(
  ctx: CanvasRenderingContext2D, r: Rect, state: 'ready' | 'cooldown' | 'active', progress: number, name: string, header: string, t: number,
): void {
  const lit = capFace(ctx, r, state, CYAN, t, progress);
  const c = cap(r);
  const cx = c.x + c.w / 2;
  const cy = c.y + 46;
  screenText(ctx, header, cx, c.y + 13, { size: 10, align: 'center', maxW: c.w - 12, color: lit.ink, weight: 800, mono: false, spacing: 1 });
  ctx.lineWidth = 5;
  ctx.strokeStyle = lit.dim ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = lit.dim ? '#50d6ff' : lit.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress)));
  ctx.stroke();
  ctx.fillStyle = lit.dim ? 'rgba(80,214,255,0.18)' : 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, 15 + (state === 'active' ? Math.sin(t * 9) * 2.5 : 0), 0, Math.PI * 2);
  ctx.fill();
  if (state === 'active') { // expanding ping while the special runs
    const k = (t * 1.8) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(0.9 * (1 - k)).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 26 + k * 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  screenText(ctx, name, cx, c.y + c.h - 16, { size: 12, align: 'center', maxW: c.w - 12, color: lit.ink, weight: 900, mono: false, spacing: 0.5 });
}

/** Pause button: two bars and the legend. */
export function pauseButton(ctx: CanvasRenderingContext2D, r: Rect, label: string, t: number): void {
  const lit = capFace(ctx, r, 'ready', WHITE, t);
  const c = cap(r);
  ctx.fillStyle = lit.ink;
  ctx.fillRect(c.x + 14, c.y + c.h / 2 - 9, 5, 18);
  ctx.fillRect(c.x + 23, c.y + c.h / 2 - 9, 5, 18);
  screenText(ctx, label, c.x + 36 + (c.w - 44) / 2, c.y + c.h / 2, { size: 13, align: 'center', maxW: c.w - 46, color: lit.ink, weight: 900, mono: false, spacing: 1 });
}

/** A readable key cap in the button's top-right corner (owner: show which key fires it). Live, not cached. */
export function keyCap(ctx: CanvasRenderingContext2D, r: Rect, key: string): void {
  if (!key) return;
  ctx.save();
  ctx.font = `700 13px ${FONT_TYPE}`;
  const w = Math.max(24, ctx.measureText(key).width + 12);
  const x = r.x + r.w - w - 3;
  const y = r.y + 3;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 2, w, 20, 4);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + 20);
  g.addColorStop(0, '#f4f6f8');
  g.addColorStop(1, '#c3c9cf');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 20, 4);
  ctx.fill();
  ctx.strokeStyle = '#6f7880';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#15191d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(key, x + w / 2, y + 10.5);
  ctx.restore();
}
