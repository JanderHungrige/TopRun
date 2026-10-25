import type { TakeoffRating } from '../data/types';
import { GREEN_HI, GREEN_LO, type TakeoffState } from '../game/takeoff-logic';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button } from '../ui/widgets';

export const SKIP_BTN = { x: 1030, y: 650, w: 230, h: 46 };
/** LOCK / LAUNCH — the E action for mouse and touch players (doc 04). */
export const ACTION_BTN = { x: 1030, y: 556, w: 230, h: 80 };

const RATING_TEXT: Readonly<Record<TakeoffRating, { label: UiKey; color: string; bonus: UiKey }>> = {
  perfect: { label: 'takeoff.perfect', color: COLORS.gold, bonus: 'takeoff.bonus15' },
  good: { label: 'takeoff.good', color: COLORS.green, bonus: 'takeoff.bonus5' },
  early: { label: 'takeoff.early', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  late: { label: 'takeoff.late', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  skipped: { label: 'takeoff.skipped', color: COLORS.dim, bonus: 'takeoff.noBonus' },
};

const big = { display: true, align: 'center' as const, stroke: '#000', strokeWidth: 6 };

function padlock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 6, 6, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x - 9, y - 6, 18, 14);
}

export function drawThrottle(ctx: CanvasRenderingContext2D, s: TakeoffState, time: number): void {
  const x = 1150;
  const top = 150;
  const h = 300;
  drawPanel(ctx, { x: x - 46, y: top - 50, w: 120, h: h + 92 });
  text(ctx, t('takeoff.throttle'), x + 14, top - 22, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  const yOf = (v: number): number => top + h * (1 - v);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, top, 28, h);
  ctx.fillStyle = 'rgba(91,227,125,0.6)';
  ctx.fillRect(x, yOf(GREEN_HI), 28, yOf(GREEN_LO) - yOf(GREEN_HI));
  ctx.fillStyle = `rgba(255,79,79,${s.overspeed ? 0.5 + Math.sin(time * 20) * 0.3 : 0.45})`;
  ctx.fillRect(x, top, 28, yOf(GREEN_HI) - top);
  const ny = yOf(s.throttle);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(x + 4, ny, 20, top + h - ny);
  ctx.fillStyle = s.phase === 'spool' ? '#ffffff' : COLORS.gold;
  ctx.beginPath();
  ctx.moveTo(x - 12, ny - 7);
  ctx.lineTo(x + 2, ny);
  ctx.lineTo(x - 12, ny + 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x, ny - 1.5, 28, 3);
  text(ctx, `${Math.round(s.throttle * 100)}%`, x + 14, top + h + 28, { size: 18, display: true, align: 'center' });
  if (s.phase !== 'spool') padlock(ctx, x - 26, ny + 2);
}

/** The key/button name the player should press for E on this device. */
export function actionKey(device: string, phase: TakeoffState['phase']): string {
  if (device === 'gamepad') return 'Y';
  if (device === 'joystick') return t('takeoff.joySpecial');
  if (device === 'touch') return t(phase === 'ready' ? 'takeoff.btnLaunch' : 'takeoff.btnLock');
  return 'E';
}

const HOLD_TEXT: Readonly<Record<string, UiKey>> = { touch: 'takeoff.holdTouch', joystick: 'takeoff.holdJoy' };

function spoolPrompt(ctx: CanvasRenderingContext2D, s: TakeoffState, device: string, key: string): void {
  text(ctx, t(HOLD_TEXT[device] ?? 'takeoff.holdKeys'), 640, 96, { size: 26, display: true, align: 'center', shadow: true });
  const hint = s.overspeed ? t('takeoff.overspeed') : s.rejected === 'low' ? t('takeoff.notYet') : t('takeoff.green', { key });
  const warn = s.overspeed || s.rejected === 'low';
  text(ctx, hint, 640, 128, { size: 18, align: 'center', color: warn ? COLORS.red : COLORS.ink, shadow: true });
}

export function drawPrompt(ctx: CanvasRenderingContext2D, s: TakeoffState, device: string, time: number): void {
  const key = actionKey(device, s.phase);
  switch (s.phase) {
    case 'spool':
      spoolPrompt(ctx, s, device, key);
      return;
    case 'locked': {
      const n = Math.max(1, Math.ceil(s.countdown));
      const pulse = 1 + (Math.ceil(s.countdown) - s.countdown) * 0.35;
      text(ctx, t('takeoff.locked'), 640, 92, { size: 24, display: true, align: 'center', color: COLORS.gold, shadow: true });
      text(ctx, String(n), 640, 250, { ...big, size: Math.round(120 * pulse), color: '#ffffff', strokeWidth: 8 });
      text(ctx, t('takeoff.standBy'), 640, 300, { size: 18, align: 'center', shadow: true });
      return;
    }
    case 'ready':
      if (Math.sin(time * 14) > -0.3) text(ctx, t('takeoff.go', { key }), 640, 200, { ...big, size: 64, color: COLORS.gold });
      return;
    case 'catapult':
    case 'climb':
    case 'done': {
      const r = RATING_TEXT[s.rating ?? 'good'];
      text(ctx, t(r.label), 640, 110, { ...big, size: 44, italic: true, color: r.color });
      text(ctx, t(r.bonus), 640, 142, { size: 18, align: 'center', color: COLORS.ink, shadow: true });
      return;
    }
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}

export function drawActionButton(ctx: CanvasRenderingContext2D, s: TakeoffState, time: number): void {
  if (s.phase !== 'spool' && s.phase !== 'locked' && s.phase !== 'ready') return;
  const label = s.phase === 'ready' ? t('takeoff.btnLaunch') : t('takeoff.btnLock');
  const b: Button = { id: 'action', label, ...ACTION_BTN, primary: true, enabled: s.phase !== 'locked', hint: 'E' };
  drawButton(ctx, b, s.phase === 'ready' || (s.phase === 'spool' && !s.overspeed && s.throttle >= GREEN_LO), time);
}
