import type { Medal } from '../game/minigames/core';
import { drawMedal } from '../render/minigames/medal';
import { COLORS, text } from '../render/text';
import type { Rect } from '../ui/widgets';
import type { MinigameModule } from './minigames/contract';

// BASE hub cards (doc 11).

export type CardState = 'soon' | 'locked' | 'open';

export interface CardView {
  name: string;
  mod: MinigameModule | undefined;
  state: CardState;
  status: string;
  medal: Medal | null;
}

const CW = 220;
const CH = 200;
const GAP = 18;
const X0 = (1280 - (5 * CW + 4 * GAP)) / 2;
const ROW_Y = [112, 330];

export const cardRect = (i: number): Rect => ({ x: X0 + (i % 5) * (CW + GAP), y: ROW_Y[Math.floor(i / 5)] ?? 112, w: CW, h: CH });

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = COLORS.dim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 8, 9, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = COLORS.dim;
  ctx.fillRect(x - 13, y - 8, 26, 20);
}

function genericIcon(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawCard(ctx: CanvasRenderingContext2D, r: Rect, v: CardView, focused: boolean, t: number): void {
  const open = v.state === 'open';
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = focused ? 'rgba(40,70,105,0.95)' : 'rgba(12,22,34,0.9)';
  ctx.fill();
  ctx.lineWidth = focused ? 3 : 1.5;
  ctx.strokeStyle = focused ? COLORS.gold : COLORS.panelEdge;
  ctx.stroke();
  ctx.save();
  ctx.translate(r.x + r.w / 2, r.y + 72);
  if (!open) ctx.globalAlpha = 0.35;
  if (v.mod) v.mod.drawIcon(ctx, open ? t : 0);
  else genericIcon(ctx);
  ctx.restore();
  if (v.state === 'locked') padlock(ctx, r.x + r.w / 2, r.y + 80);
  text(ctx, v.name, r.x + r.w / 2, r.y + 146, { size: 16, display: true, align: 'center', color: open ? COLORS.ink : COLORS.dim, maxWidth: r.w - 20 });
  if (v.medal) drawMedal(ctx, v.medal, r.x + 24, r.y + 174, 10);
  text(ctx, v.status, r.x + r.w / 2 + (v.medal ? 10 : 0), r.y + 179, { size: 13, align: 'center', color: v.state === 'soon' ? COLORS.faint : open ? COLORS.cyan : COLORS.dim, maxWidth: r.w - 60 });
}
