import type { Medal } from '../../game/minigames/core';
import { t } from '../../i18n/i18n';
import type { UiKey } from '../../i18n/ui-en';
import { drawMedal } from '../../render/minigames/medal';
import { COLORS, text } from '../../render/text';
import { drawPanel } from '../../ui/widgets';
import type { MinigameModule } from './contract';

// Drawing for the minigame shell (doc 10): rules card, top bar, countdown, pause and result cards.

export const CARD = { x: 290, y: 110, w: 700, h: 470 };
const MEDAL_KEY: Readonly<Record<Medal, UiKey>> = { gold: 'mg.gold', silver: 'mg.silver', bronze: 'mg.bronze' };

export function drawBackdrop(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#14263c');
  g.addColorStop(1, '#05090f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
}

export function drawRulesCard(ctx: CanvasRenderingContext2D, mod: MinigameModule, name: string, best: string | null, time: number): void {
  drawPanel(ctx, CARD);
  ctx.save();
  ctx.translate(CARD.x + 110, CARD.y + 120);
  ctx.scale(1.4, 1.4);
  mod.drawIcon(ctx, time);
  ctx.restore();
  text(ctx, name.toUpperCase(), CARD.x + 220, CARD.y + 70, { size: 30, display: true, italic: true, color: COLORS.gold, maxWidth: CARD.w - 250 });
  text(ctx, best ? t('mg.best', { score: best }) : t('mg.noBest'), CARD.x + 220, CARD.y + 104, { size: 15, color: COLORS.dim });
  const r = mod.rules();
  r.lines.forEach((ln, i) => text(ctx, ln, CARD.x + 220, CARD.y + 150 + i * 28, { size: 17, color: COLORS.ink, maxWidth: CARD.w - 250 }));
  const cy = CARD.y + 170 + r.lines.length * 28;
  text(ctx, t('mg.controls'), CARD.x + 40, cy, { size: 12, color: COLORS.dim, letterSpacing: 2 });
  r.controls.forEach((c, i) => text(ctx, c, CARD.x + 40, cy + 28 + i * 25, { size: 15, color: COLORS.cyan, maxWidth: CARD.w - 80 }));
}

export function drawTopBar(ctx: CanvasRenderingContext2D, name: string, score: string): void {
  ctx.fillStyle = 'rgba(4,8,14,0.72)';
  ctx.fillRect(0, 0, 1280, 52);
  text(ctx, name.toUpperCase(), 24, 34, { size: 20, display: true, italic: true, color: COLORS.gold });
  text(ctx, score, 1256, 34, { size: 22, display: true, align: 'right', color: COLORS.ink });
  text(ctx, t('mg.pauseHint'), 640, 33, { size: 12, align: 'center', color: COLORS.faint });
}

export function drawCountdown(ctx: CanvasRenderingContext2D, left: number): void {
  const n = Math.ceil(left);
  const pulse = 1 + (n - left) * 0.4;
  const label = n > 0 ? String(n) : t('mg.go');
  text(ctx, label, 640, 400, { size: Math.round(120 * pulse), display: true, align: 'center', color: '#ffffff', stroke: '#000', strokeWidth: 8 });
}

export function drawDim(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(2,5,10,0.62)';
  ctx.fillRect(0, 0, 1280, 720);
}

export interface ResultView {
  name: string;
  score: string;
  best: string;
  medal: Medal | null;
  newBest: boolean;
}

export function drawResultCard(ctx: CanvasRenderingContext2D, r: ResultView, time: number): void {
  drawPanel(ctx, CARD);
  text(ctx, r.name.toUpperCase(), 640, CARD.y + 60, { size: 26, display: true, italic: true, align: 'center', color: COLORS.gold });
  text(ctx, r.score, 640, CARD.y + 150, { size: 54, display: true, align: 'center', color: COLORS.ink });
  const grow = Math.min(1, time * 3);
  drawMedal(ctx, r.medal, 640, CARD.y + 250, 44 * grow);
  text(ctx, r.medal ? t(MEDAL_KEY[r.medal]) : t('mg.noMedal'), 640, CARD.y + 326, { size: 18, display: true, align: 'center', color: r.medal ? COLORS.gold : COLORS.dim });
  if (r.newBest && Math.sin(time * 6) > -0.4) text(ctx, t('mg.newBest'), 640, CARD.y + 362, { size: 18, display: true, align: 'center', color: COLORS.cyan });
  text(ctx, t('mg.best', { score: r.best }), 640, CARD.y + 392, { size: 15, align: 'center', color: COLORS.dim });
}
