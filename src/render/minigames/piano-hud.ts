import { clamp, easeOutCubic } from '../../core/math';
import { roundRect } from '../shapes';
import { COLORS, text } from '../text';

// Piano Bar (doc 23): HUD over the highway — section plate and song progress, combo and the multiplier ring,
// the groove meter with the band-layer marks, PERFECT / GOOD / MISS pops, hit sparks, toasts, end banner.

export interface Pop { text: string; color: string; x: number; y: number; age: number; size: number }
export interface Spark { x: number; y: number; vx: number; vy: number; age: number; color: string }
export const POP_LIFE = 0.6;
export const SPARK_LIFE = 0.45;

const MULT_COLOR = ['#e9eff5', '#5fd4ff', '#5be37d', '#ffc83d'] as const;
const CX = 1020;

export function drawSection(ctx: CanvasRenderingContext2D, name: string, song: string, progress: number): void {
  text(ctx, name, 808, 84, { size: 17, display: true, italic: true, color: COLORS.gold });
  text(ctx, song, 1236, 83, { size: 13, type: true, weight: 700, align: 'right', color: 'rgba(233,239,245,0.6)' });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(800, 90, 440, 3);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(800, 90, 440 * clamp(progress, 0, 1), 3);
}

export function drawCombo(ctx: CanvasRenderingContext2D, combo: number, mult: number, label: string, bump: number): void {
  if (combo >= 4) {
    const size = 64 + 10 * bump;
    text(ctx, String(combo), CX, 310, { size, display: true, align: 'center', color: 'rgba(255,255,255,0.22)' });
    text(ctx, label, CX, 336, { size: 14, display: true, align: 'center', color: 'rgba(255,255,255,0.3)', letterSpacing: 4 });
  }
  const color = MULT_COLOR[clamp(mult, 1, 4) - 1] ?? '#fff';
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.arc(CX, 396, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 4;
  ctx.stroke();
  const f = mult >= 4 ? 1 : (combo % 10) / 10;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(CX, 396, 25, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  text(ctx, `×${mult}`, CX, 405, { size: 24, display: true, align: 'center', color });
}

export interface GrooveView { groove: number; level: number; label: string; marks: readonly { at: number; label: string }[]; t: number }

export function drawGroove(ctx: CanvasRenderingContext2D, v: GrooveView): void {
  const x = 770;
  const top = 128;
  const h = 450;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  roundRect(ctx, x - 3, top - 3, 18, h + 6, 6);
  ctx.fill();
  const fill = h * clamp(v.groove, 0, 1);
  const g = ctx.createLinearGradient(0, top + h, 0, top);
  g.addColorStop(0, '#ff4f4f');
  g.addColorStop(0.3, '#ff9d2e');
  g.addColorStop(0.6, '#ffc83d');
  g.addColorStop(1, '#5be37d');
  ctx.fillStyle = g;
  ctx.fillRect(x, top + h - fill, 12, fill);
  v.marks.forEach((m, i) => {
    const y = top + h - h * m.at;
    const on = v.level > i;
    ctx.fillStyle = on ? '#fff6d0' : 'rgba(255,255,255,0.35)';
    ctx.fillRect(x - 4, y - 1, 20, 2);
    text(ctx, m.label, x - 8, y + 4, { size: 10, weight: 800, align: 'right', color: on ? '#fff6d0' : 'rgba(233,239,245,0.4)' });
  });
  ctx.save();
  ctx.translate(x + 6, top - 12);
  text(ctx, v.label, 0, 0, { size: 11, weight: 800, align: 'center', color: COLORS.gold });
  ctx.restore();
}

export function drawPops(ctx: CanvasRenderingContext2D, pops: readonly Pop[]): void {
  for (const p of pops) {
    const k = p.age / POP_LIFE;
    const a = clamp(1.4 - k * 1.4, 0, 1);
    const s = p.size * (0.8 + 0.3 * easeOutCubic(Math.min(1, k * 4)));
    text(ctx, p.text, p.x, p.y - 26 * k, { size: s, display: true, italic: true, align: 'center', color: p.color, alpha: a, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 4 });
  }
}

export function drawSparks(ctx: CanvasRenderingContext2D, sparks: readonly Spark[]): void {
  for (const s of sparks) {
    const a = clamp(1 - s.age / SPARK_LIFE, 0, 1);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = a;
    ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
}

export function drawToast(ctx: CanvasRenderingContext2D, msg: string, age: number, good: boolean): void {
  const a = clamp(Math.min(age / 0.15, (1.8 - age) / 0.4), 0, 1);
  if (a <= 0) return;
  text(ctx, msg, CX, 140, { size: 20, display: true, italic: true, align: 'center', color: good ? COLORS.green : COLORS.red, alpha: a, stroke: 'rgba(0,0,0,0.75)', strokeWidth: 5 });
}

export function drawEndBanner(ctx: CanvasRenderingContext2D, title: string, stats: string, color: string, age: number): void {
  const a = clamp(age / 0.3, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(5,4,10,0.72)';
  ctx.fillRect(0, 280, 1280, 120);
  ctx.fillStyle = color;
  ctx.fillRect(0, 280, 1280, 3);
  ctx.fillRect(0, 397, 1280, 3);
  const s = 0.7 + 0.3 * easeOutCubic(a);
  text(ctx, title, 640, 350, { size: 58 * s, display: true, italic: true, align: 'center', color, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 6 });
  text(ctx, stats, 640, 385, { size: 16, weight: 700, align: 'center', color: COLORS.ink });
  ctx.restore();
}
