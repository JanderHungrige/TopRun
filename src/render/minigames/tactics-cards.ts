import type { MoveId } from '../../game/minigames/tactics-moves';
import { COLORS, measure, text, wrap } from '../text';
import { arrow, INK, jetGlyph, stroke, write } from './tactics-marker';
import { manoeuvrePath } from './tactics-paths';

// Dogfight Tactics (doc 19): the four manoeuvre cards on the table — index cards with the name in marker,
// a pictogram of the path, energy / altitude badges and the hint.

export interface CardRect { x: number; y: number; w: number; h: number }
export const CARD_RECTS: readonly CardRect[] = [0, 1, 2, 3].map((i) => ({ x: 28 + i * 228, y: 504, w: 214, h: 204 }));
const TILT = [-0.018, 0.012, -0.008, 0.016];

export interface CardView {
  move: MoveId;
  title: string;
  hint: string;
  energy: number;
  alt: number;
}
export type CardState = 'idle' | 'selected' | 'played' | 'dim';

function pictogram(ctx: CanvasRenderingContext2D, move: MoveId, x: number, y: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, 112, 84);
  ctx.clip();
  ctx.translate(x + 46, y + 46);
  ctx.scale(0.5, 0.5);
  const self = { x: -10, y: 50, h: 0 };
  const other = { x: 60, y: -40, h: 0.6 };
  jetGlyph(ctx, other.x, other.y, other.h, INK.red, 1.3);
  jetGlyph(ctx, self.x, self.y, self.h, INK.blue, 1.3);
  arrow(ctx, manoeuvrePath(move, self, other), INK.blue, 1, 7, 3);
  ctx.restore();
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 7);
  ctx.lineTo(x - 4, y + 1);
  ctx.lineTo(x, y + 1);
  ctx.lineTo(x - 2, y + 7);
  ctx.lineTo(x + 4, y - 1);
  ctx.lineTo(x, y - 1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function badges(ctx: CanvasRenderingContext2D, c: CardView, x: number, y: number): void {
  const color = c.energy > 0 ? INK.green : c.energy < 0 ? INK.red : '#6b7380';
  ctx.beginPath();
  ctx.roundRect(x, y, 70, 28, 8);
  ctx.fillStyle = c.energy > 0 ? 'rgba(31,138,82,0.12)' : c.energy < 0 ? 'rgba(207,50,41,0.1)' : 'rgba(0,0,0,0.06)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.stroke();
  bolt(ctx, x + 16, y + 14, color);
  write(ctx, c.energy > 0 ? `+${c.energy}` : String(c.energy), x + 48, y + 21, { size: 19, align: 'center', color });
  if (c.alt === 0) return;
  const ax = x + 35;
  const s = c.alt > 0 ? -1 : 1;
  arrow(ctx, [{ x: ax, y: y + 56 - s * 12 }, { x: ax, y: y + 56 + s * 12 }], INK.black, 1, 3, 8);
  stroke(ctx, [{ x: ax - 18, y: y + 70 }, { x: ax + 18, y: y + 70 }], INK.black, 2, 4);
}

function cardBody(ctx: CanvasRenderingContext2D, r: CardRect, st: CardState): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(r.x + 5, r.y + 7, r.w, r.h);
  ctx.fillStyle = '#fbf9f2';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = 'rgba(207,50,41,0.55)';
  ctx.fillRect(r.x, r.y + 34, r.w, 1.5);
  ctx.fillStyle = 'rgba(90,140,200,0.22)';
  for (let ly = r.y + 56; ly < r.y + r.h - 6; ly += 20) ctx.fillRect(r.x + 6, ly, r.w - 12, 1);
  if (st === 'selected' || st === 'played') {
    ctx.lineWidth = 4;
    ctx.strokeStyle = st === 'played' ? COLORS.gold : COLORS.cyan;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
  }
}

/** One card at its slot; `lift` 0 … 1 raises it (selection), `alpha` fades it. */
export function drawCard(ctx: CanvasRenderingContext2D, c: CardView, slot: number, st: CardState, lift: number, alpha: number): void {
  const base = CARD_RECTS[slot];
  if (!base || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha * (st === 'dim' ? 0.5 : 1);
  ctx.translate(base.x + base.w / 2, base.y + base.h / 2 - lift * 16);
  ctx.rotate(TILT[slot] ?? 0);
  const r = { x: -base.w / 2, y: -base.h / 2, w: base.w, h: base.h };
  cardBody(ctx, r, st);
  write(ctx, c.title, r.x + 12, r.y + 26, { size: 21, maxWidth: r.w - 24 });
  pictogram(ctx, c.move, r.x + 10, r.y + 42);
  badges(ctx, c, r.x + 128, r.y + 50);
  const lines = wrap(ctx, c.hint, r.w - 22, 13);
  lines.slice(0, 5).forEach((ln, i) => text(ctx, ln, r.x + 11, r.y + 136 + i * 16, { size: 13, color: '#2d3440', weight: 600 }));
  ctx.restore();
}

/** A pill over the card row: what to press (choose / continue). `pulse` blinks it. */
export function drawPrompt(ctx: CanvasRenderingContext2D, label: string, y: number, t: number, pulse: boolean): void {
  if (pulse && Math.sin(t * 5) < -0.35) return;
  const w = Math.max(220, measure(ctx, label, 15) + 50);
  const x = 478 - w / 2;
  ctx.fillStyle = 'rgba(8,14,22,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y - 19, w, 32, 16);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,200,61,0.7)';
  ctx.stroke();
  text(ctx, label, 478, y + 2, { size: 15, align: 'center', color: COLORS.gold, weight: 700, letterSpacing: 1 });
}

/** Index of the card under a point, or −1. */
export function cardAt(p: { x: number; y: number }): number {
  return CARD_RECTS.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y - 16 && p.y <= r.y + r.h);
}
