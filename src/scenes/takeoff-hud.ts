import type { TakeoffRating } from '../data/types';
import { DECK_LENGTH, GOOD_PX, GREEN_HI, GREEN_HOLD, GREEN_LO, PERFECT_PX, type TakeoffState } from '../game/takeoff-logic';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { COLORS, text } from '../render/text';
import { drawPanel } from '../ui/widgets';

export const SKIP_BTN = { x: 1030, y: 650, w: 230, h: 46 };

const RATING_TEXT: Readonly<Record<TakeoffRating, { label: UiKey; color: string; bonus: UiKey }>> = {
  perfect: { label: 'takeoff.perfect', color: COLORS.gold, bonus: 'takeoff.bonus15' },
  good: { label: 'takeoff.good', color: COLORS.green, bonus: 'takeoff.bonus5' },
  early: { label: 'takeoff.early', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  late: { label: 'takeoff.late', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  skipped: { label: 'takeoff.skipped', color: COLORS.dim, bonus: 'takeoff.noBonus' },
};

export function drawThrottle(ctx: CanvasRenderingContext2D, s: TakeoffState, time: number): void {
  const x = 1150;
  const top = 170;
  const h = 330;
  drawPanel(ctx, { x: x - 46, y: top - 50, w: 120, h: h + 100 });
  text(ctx, t('takeoff.throttle'), x + 14, top - 22, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  const yOf = (v: number): number => top + h * (1 - v);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, top, 28, h);
  ctx.fillStyle = 'rgba(91,227,125,0.55)';
  ctx.fillRect(x, yOf(GREEN_HI), 28, yOf(GREEN_LO) - yOf(GREEN_HI));
  ctx.fillStyle = `rgba(255,79,79,${s.overspeed ? 0.5 + Math.sin(time * 20) * 0.3 : 0.45})`;
  ctx.fillRect(x, top, 28, yOf(GREEN_HI) - top);
  const ny = yOf(s.throttle);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + 4, ny, 20, top + h - ny);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x - 12, ny - 7);
  ctx.lineTo(x + 2, ny);
  ctx.lineTo(x - 12, ny + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x, ny - 1.5, 28, 3);
  text(ctx, `${Math.round(s.throttle * 100)}%`, x + 14, top + h + 26, { size: 18, display: true, align: 'center' });
  const hold = Math.min(1, s.greenTime / GREEN_HOLD);
  if (hold > 0) {
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x + 14, top + h + 54, 13, -Math.PI / 2, -Math.PI / 2 + hold * Math.PI * 2);
    ctx.stroke();
  }
}

export function drawTimingBar(ctx: CanvasRenderingContext2D, s: TakeoffState): void {
  const x = 340;
  const y = 120;
  const w = 600;
  const px = (d: number): number => x + (d / DECK_LENGTH) * w;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(x - 6, y - 6, w + 12, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = 'rgba(91,227,125,0.7)';
  ctx.fillRect(px(DECK_LENGTH - GOOD_PX), y, px(DECK_LENGTH) - px(DECK_LENGTH - GOOD_PX), 18);
  ctx.fillStyle = 'rgba(255,200,61,0.95)';
  ctx.fillRect(px(DECK_LENGTH - PERFECT_PX), y, px(DECK_LENGTH) - px(DECK_LENGTH - PERFECT_PX), 18);
  const mx = px(Math.min(DECK_LENGTH, s.deckPos));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx - 2, y - 6, 4, 30);
  text(ctx, t('takeoff.deckEdge'), px(DECK_LENGTH), y + 40, { size: 11, align: 'right', color: COLORS.dim, letterSpacing: 1 });
}

export function drawPrompt(ctx: CanvasRenderingContext2D, s: TakeoffState, touch: boolean, time: number): void {
  const key = t(touch ? 'takeoff.keyTap' : 'takeoff.keySpace');
  const blink = Math.sin(time * 12) > 0;
  switch (s.phase) {
    case 'spool':
      text(ctx, t(touch ? 'takeoff.holdTouch' : 'takeoff.holdKeys'), 640, 96, { size: 26, display: true, align: 'center', shadow: true });
      text(ctx, t(s.overspeed ? 'takeoff.overspeed' : 'takeoff.green'), 640, 126, {
        size: 17, align: 'center', color: s.overspeed ? COLORS.red : COLORS.ink, shadow: true,
      });
      return;
    case 'catapult':
      text(ctx, t('takeoff.rotate', { key }), 640, 96, { size: 26, display: true, align: 'center', color: COLORS.gold, shadow: true });
      drawTimingBar(ctx, s);
      return;
    case 'edge':
      if (blink) text(ctx, t('takeoff.pullUp', { key }), 640, 110, { size: 44, display: true, align: 'center', color: COLORS.red, stroke: '#000', strokeWidth: 6 });
      return;
    case 'climb':
    case 'done': {
      const r = RATING_TEXT[s.rating ?? 'good'];
      text(ctx, t(r.label), 640, 110, { size: 44, display: true, italic: true, align: 'center', color: r.color, stroke: '#000', strokeWidth: 6 });
      text(ctx, t(r.bonus), 640, 142, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
      return;
    }
    case 'ditched':
      text(ctx, t('takeoff.ditched'), 640, 110, { size: 52, display: true, align: 'center', color: COLORS.red, stroke: '#000', strokeWidth: 6 });
      text(ctx, t('takeoff.retry', { key }), 640, 146, { size: 18, align: 'center', shadow: true });
      return;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
