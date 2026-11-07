import type { TakeoffRating } from '../data/types';
import { LIFTOFF, type LiftoffState } from '../game/liftoff';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button } from '../ui/widgets';
import { ACTION_BTN, actionKey } from './takeoff-hud';

// The deck liftoff's HUD (doc 53): the prompt, the pitch gauge with its green band, the height bar, the GO button.

const RATING: Readonly<Record<TakeoffRating, { label: UiKey; color: string; bonus: UiKey }>> = {
  perfect: { label: 'liftoff.perfect', color: COLORS.gold, bonus: 'takeoff.bonus15' },
  good: { label: 'liftoff.good', color: COLORS.green, bonus: 'takeoff.bonus5' },
  early: { label: 'liftoff.early', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  late: { label: 'liftoff.late', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  skipped: { label: 'takeoff.skipped', color: COLORS.dim, bonus: 'takeoff.noBonus' },
};

const big = { display: true, align: 'center' as const, stroke: '#000', strokeWidth: 6 };

export function drawLiftoffPrompt(ctx: CanvasRenderingContext2D, s: LiftoffState, device: string, time: number): void {
  switch (s.phase) {
    case 'spool':
      text(ctx, t('liftoff.spool'), 640, 96, { size: 26, display: true, align: 'center', shadow: true });
      return;
    case 'lift':
      text(ctx, t(device === 'touch' ? 'liftoff.liftTouch' : 'liftoff.liftKeys'), 640, 96, { size: 24, display: true, align: 'center', shadow: true });
      if (s.alt > 0) text(ctx, t('liftoff.gust'), 640, 128, { size: 18, align: 'center', color: Math.abs(s.pitch) > LIFTOFF.goodPitch ? COLORS.red : COLORS.ink, shadow: true });
      return;
    case 'hover':
      if (Math.sin(time * 14) > -0.3) text(ctx, t('liftoff.hover', { key: actionKey(device, 'ready') }), 640, 200, { ...big, size: 40, color: COLORS.gold });
      return;
    case 'away':
    case 'done': {
      const r = RATING[s.rating ?? 'good'];
      text(ctx, t(r.label), 640, 110, { ...big, size: 44, italic: true, color: r.color });
      text(ctx, t(r.bonus), 640, 142, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
      return;
    }
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}

/** The pitch needle against the green (perfect) and amber (good) bands. */
export function drawPitchGauge(ctx: CanvasRenderingContext2D, s: LiftoffState): void {
  const x = 1060;
  const y = 170;
  const w = 180;
  drawPanel(ctx, { x: x - 20, y: y - 46, w: w + 40, h: 96 });
  text(ctx, t('liftoff.pitch'), x + w / 2, y - 20, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  const xOf = (a: number): number => x + w / 2 + (a / 0.7) * (w / 2);
  ctx.fillStyle = 'rgba(255,79,79,0.4)';
  ctx.fillRect(x, y, w, 18);
  ctx.fillStyle = 'rgba(255,190,90,0.6)';
  ctx.fillRect(xOf(-LIFTOFF.goodPitch), y, xOf(LIFTOFF.goodPitch) - xOf(-LIFTOFF.goodPitch), 18);
  ctx.fillStyle = 'rgba(91,227,125,0.75)';
  ctx.fillRect(xOf(-LIFTOFF.perfectPitch), y, xOf(LIFTOFF.perfectPitch) - xOf(-LIFTOFF.perfectPitch), 18);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(xOf(s.pitch) - 2, y - 6, 4, 30);
}

/** Height off the deck, with the hover mark. */
export function drawHeight(ctx: CanvasRenderingContext2D, s: LiftoffState): void {
  const x = 1150;
  const top = 270;
  const h = 220;
  drawPanel(ctx, { x: x - 46, y: top - 50, w: 120, h: h + 92 });
  text(ctx, t('liftoff.height'), x + 14, top - 22, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, top, 28, h);
  const filled = Math.min(1, s.alt / LIFTOFF.hover) * h;
  ctx.fillStyle = s.phase === 'hover' ? COLORS.gold : 'rgba(91,227,125,0.7)';
  ctx.fillRect(x, top + h - filled, 28, filled);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x - 8, top - 2, 44, 3);
  text(ctx, `${Math.round(s.alt)} m`, x + 14, top + h + 28, { size: 18, display: true, align: 'center' });
}

export function drawGoButton(ctx: CanvasRenderingContext2D, s: LiftoffState, time: number): void {
  if (s.phase !== 'lift' && s.phase !== 'hover') return;
  const b: Button = { id: 'action', label: t('liftoff.btnGo'), ...ACTION_BTN, primary: true, enabled: s.alt > 0, hint: 'E' };
  drawButton(ctx, b, s.phase === 'hover', time);
}
