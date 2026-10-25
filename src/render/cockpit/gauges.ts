import type { Dial, Rect } from './layout';
import { legend, rr, roundBezel, screenText, subPlate } from './metal';

/** Hull dial, cannon level lamps + power bar, artificial horizon. *Static parts go into the plate cache. */

const TAU = Math.PI * 2;
const HULL_FACE = 0.86;
const A0 = Math.PI * 0.75; // dial zero (bottom-left), sweeping 270° clockwise
const SWEEP = Math.PI * 1.5;
const BANDS: readonly (readonly [number, number, string])[] = [[0, 0.3, '#e0412f'], [0.3, 0.6, '#f0a028'], [0.6, 1, '#3fcf68']];

export function hullStatic(ctx: CanvasRenderingContext2D, d: Dial, label: string, seed: number): void {
  const R = d.r * HULL_FACE;
  roundBezel(ctx, d.cx, d.cy, d.r, R, seed);
  ctx.fillStyle = '#0e1012';
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 4;
  for (const [a, b, c] of BANDS) {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(d.cx, d.cy, R - 6, A0 + a * SWEEP, A0 + b * SWEEP);
    ctx.stroke();
  }
  ctx.strokeStyle = '#d8dee3';
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = A0 + (i / 10) * SWEEP;
    const l = i % 5 === 0 ? 9 : 5;
    ctx.moveTo(d.cx + Math.cos(a) * (R - 2), d.cy + Math.sin(a) * (R - 2));
    ctx.lineTo(d.cx + Math.cos(a) * (R - 2 - l), d.cy + Math.sin(a) * (R - 2 - l));
  }
  ctx.lineWidth = 1.2;
  ctx.stroke();
  legend(ctx, label, d.cx, d.cy - R * 0.42, { size: 9, align: 'center', maxW: R * 1.1 });
  rr(ctx, d.cx - 21, d.cy + R * 0.42, 42, 13, 2); // LCD window
  ctx.fillStyle = '#071209';
  ctx.fill();
  ctx.strokeStyle = '#3a4046';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function hullLive(ctx: CanvasRenderingContext2D, d: Dial, hull: { ratio: number; value: number; max: number }): void {
  const R = d.r * HULL_FACE;
  const r = Math.max(0, Math.min(1, hull.ratio));
  screenText(ctx, `${Math.round(hull.value)}/${Math.round(hull.max)}`, d.cx, d.cy + R * 0.42 + 6.8, {
    size: 9.5, align: 'center', maxW: 38, color: r > 0.6 ? '#62f08a' : r > 0.3 ? '#ffb23c' : '#ff5a48',
  });
  const a = A0 + r * SWEEP;
  ctx.save();
  ctx.translate(d.cx, d.cy);
  ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(-6, 2.6);
  ctx.lineTo(R - 8, 2.2);
  ctx.lineTo(-6, 4.6);
  ctx.fill();
  ctx.fillStyle = '#f4f1e6';
  ctx.beginPath();
  ctx.moveTo(-7, -2.2);
  ctx.lineTo(R - 9, 0);
  ctx.lineTo(-7, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#3a4046';
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, 4.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8d969e';
  ctx.beginPath();
  ctx.arc(d.cx - 1, d.cy - 1, 2, 0, TAU);
  ctx.fill();
}

const lampX = (r: Rect, i: number): number => r.x + r.w / 2 + (i - 2) * 26;
const LAMP_Y = 30; // lamp row below the cannon panel's top edge

export function cannonStatic(ctx: CanvasRenderingContext2D, r: Rect, labels: { cannon: string; power: string }, seed: number): void {
  subPlate(ctx, r, seed);
  legend(ctx, labels.cannon, r.x + r.w / 2, r.y + 14, { size: 10, align: 'center', maxW: r.w - 30 });
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#0a0b0c';
    ctx.beginPath();
    ctx.arc(lampX(r, i), r.y + LAMP_Y + 16, 10.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a2420';
    ctx.beginPath();
    ctx.arc(lampX(r, i), r.y + LAMP_Y + 16, 8, 0, TAU);
    ctx.fill();
  }
  legend(ctx, labels.power, r.x + 10, r.y + r.h - 22, { size: 9, maxW: 46 });
  rr(ctx, r.x + 60, r.y + r.h - 26, r.w - 72, 8, 2);
  ctx.fillStyle = '#0a0b0c';
  ctx.fill();
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, rgb: string, core: string, a: number): void {
  ctx.fillStyle = `rgba(${rgb},${(0.22 * a).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, TAU);
  ctx.fill();
  ctx.fillStyle = core;
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x - 2.5, y - 2.5, 2.4, 0, TAU);
  ctx.fill();
}

export function cannonLive(ctx: CanvasRenderingContext2D, r: Rect, c: { level: number; powered: boolean; powerRatio: number }, t: number): void {
  const level = Math.max(0, Math.min(5, Math.round(c.level)));
  const pulse = 0.85 + Math.sin(t * 7) * 0.15;
  for (let i = 0; i < 5; i++) {
    const y = r.y + LAMP_Y + 16;
    if (i < level) {
      if (c.powered && level === 5) lamp(ctx, lampX(r, i), y, '255,200,61', '#ffd84a', pulse);
      else lamp(ctx, lampX(r, i), y, '98,240,138', '#62f08a', 1);
    } else if (i === level && c.powered) lamp(ctx, lampX(r, i), y, '255,200,61', '#ffd84a', pulse);
  }
  const w = (r.w - 72) * Math.max(0, Math.min(1, c.powerRatio));
  if (!c.powered || w <= 0) return;
  rr(ctx, r.x + 60, r.y + r.h - 26, w, 8, 2);
  ctx.fillStyle = '#ffc83d';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(r.x + 61, r.y + r.h - 25, Math.max(0, w - 2), 2);
}

export function attitudeStatic(ctx: CanvasRenderingContext2D, d: Dial, seed: number): void {
  roundBezel(ctx, d.cx, d.cy, d.r, d.r * 0.87, seed);
}

/** Attitude indicator: the sky/ground card rolls against bank and rises as the nose pitches down. */
export function attitudeLive(ctx: CanvasRenderingContext2D, d: Dial, bank: number, forward: number, t: number): void {
  const R = d.r * 0.87;
  const p = -Math.max(0, Math.min(1, forward)) * R * 0.32 + Math.sin(t * 1.3) * 0.6;
  ctx.save();
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R, 0, TAU);
  ctx.clip();
  ctx.translate(d.cx, d.cy);
  ctx.rotate(-Math.max(-1, Math.min(1, bank)) * 0.55);
  ctx.fillStyle = '#3f78ad';
  ctx.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 1.6 + p);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(-R * 1.6, p, R * 3.2, R * 1.6);
  ctx.strokeStyle = '#f2f4f6';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-R * 1.6, p);
  ctx.lineTo(R * 1.6, p);
  for (const k of [-2, -1, 1, 2]) {
    const hw = k % 2 === 0 ? 14 : 8;
    ctx.moveTo(-hw, p + k * R * 0.2);
    ctx.lineTo(hw, p + k * R * 0.2);
  }
  ctx.moveTo(0, -R + 3);
  ctx.lineTo(-4, -R + 10);
  ctx.lineTo(4, -R + 10);
  ctx.lineTo(0, -R + 3);
  ctx.stroke();
  ctx.restore();
  attitudeOverlay(ctx, d, R);
}

/** Fixed parts over the card: bank scale and the orange aircraft symbol. */
function attitudeOverlay(ctx: CanvasRenderingContext2D, d: Dial, R: number): void {
  ctx.strokeStyle = '#f2f4f6';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (const deg of [-60, -45, -30, -20, -10, 10, 20, 30, 45, 60]) {
    const a = -Math.PI / 2 + (deg * Math.PI) / 180;
    const l = Math.abs(deg) % 30 === 0 ? 8 : 4.5;
    ctx.moveTo(d.cx + Math.cos(a) * R, d.cy + Math.sin(a) * R);
    ctx.lineTo(d.cx + Math.cos(a) * (R - l), d.cy + Math.sin(a) * (R - l));
  }
  ctx.stroke();
  ctx.strokeStyle = '#ff9d2e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(d.cx - 26, d.cy);
  ctx.lineTo(d.cx - 9, d.cy);
  ctx.lineTo(d.cx - 4, d.cy + 6);
  ctx.moveTo(d.cx + 26, d.cy);
  ctx.lineTo(d.cx + 9, d.cy);
  ctx.lineTo(d.cx + 4, d.cy + 6);
  ctx.stroke();
  ctx.fillStyle = '#ff9d2e';
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, 2.6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(d.cx, d.cy, R * 0.8, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
}
