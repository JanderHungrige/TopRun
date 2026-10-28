import type { Medal } from '../game/minigames/core';
import { drawMedal } from '../render/minigames/medal';
import { COLORS, text } from '../render/text';
import type { Rect } from '../ui/widgets';
import type { MinigameModule } from './minigames/contract';

// BASE hub cards (doc 11): four rows of five compact cards — icon left, name and status right, medal in the corner.

export type CardState = 'soon' | 'locked' | 'open';

export interface CardView {
  name: string;
  mod: MinigameModule | undefined;
  state: CardState;
  status: string;
  medal: Medal | null;
}

const CW = 228;
const CH = 102;
const GAP = 14;
const ROW_STEP = CH + 12;
const X0 = (1280 - (5 * CW + 4 * GAP)) / 2;
const Y0 = 104;
/** Icon scale on a compact card (icons are drawn within ±40 px). */
const ICON = 0.85;

export const cardRect = (i: number): Rect => ({ x: X0 + (i % 5) * (CW + GAP), y: Y0 + Math.floor(i / 5) * ROW_STEP, w: CW, h: CH });

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
  const cx = r.x + 52;
  const cy = r.y + r.h / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(ICON, ICON);
  if (!open) ctx.globalAlpha = 0.35;
  if (v.mod) v.mod.drawIcon(ctx, open ? t : 0);
  else genericIcon(ctx);
  ctx.restore();
  if (v.state === 'locked') padlock(ctx, cx, cy + 6);
  const tx = r.x + 100;
  const tw = r.w - 108;
  text(ctx, v.name, tx, r.y + 42, { size: 15, display: true, color: open ? COLORS.ink : COLORS.dim, maxWidth: tw });
  const statusColor = v.state === 'soon' ? COLORS.faint : open ? COLORS.cyan : COLORS.dim;
  text(ctx, v.status, tx, r.y + 68, { size: 12, color: statusColor, maxWidth: v.medal ? tw - 24 : tw });
  if (v.medal) drawMedal(ctx, v.medal, r.x + r.w - 18, r.y + r.h - 18, 9);
}
