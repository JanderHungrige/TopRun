import { lerp } from '../core/math';
import type { TakeoffRating } from '../data/types';
import { LAUNCH, type LaunchState } from '../game/rocket-launch';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button } from '../ui/widgets';
import { ACTION_BTN, actionKey } from './takeoff-hud';

// The rocket launch's sky and HUD (doc 59): the sky darkening with altitude, the prompt, the two fuel bars, the
// altitude and the SEPARATE button.

const RATING: Readonly<Record<TakeoffRating, { label: UiKey; color: string; bonus: UiKey }>> = {
  perfect: { label: 'rocket.perfect', color: COLORS.gold, bonus: 'takeoff.bonus15' },
  good: { label: 'rocket.good', color: COLORS.green, bonus: 'takeoff.bonus5' },
  early: { label: 'rocket.early', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  late: { label: 'rocket.late', color: COLORS.amber, bonus: 'takeoff.noBonus' },
  skipped: { label: 'takeoff.skipped', color: COLORS.dim, bonus: 'takeoff.noBonus' },
};

const big = { display: true, align: 'center' as const, stroke: '#000', strokeWidth: 6 };

const mix = (a: readonly number[], b: readonly number[], k: number): string =>
  `rgb(${a.map((v, i) => Math.round(lerp(v, b[i] ?? v, k))).join(',')})`;

/** Blue at the pad, black above ~50 km, stars coming out on the way. */
export function drawLaunchSky(ctx: CanvasRenderingContext2D, alt: number): void {
  const k = Math.min(1, alt / 50);
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, mix([74, 134, 192], [2, 3, 10], k));
  g.addColorStop(1, mix([169, 200, 224], [11, 16, 48], k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, 720);
  const stars = Math.max(0, Math.min(1, (alt - 12) / 30));
  if (stars <= 0) return;
  const rnd = (n: number): number => {
    const v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  };
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(stars * (i % 7 === 0 ? 0.9 : 0.45)).toFixed(2)})`;
    ctx.fillRect(rnd(i) * 1280, rnd(i + 500) * 720, 1.5, 1.5);
  }
}

export function drawLaunchPrompt(ctx: CanvasRenderingContext2D, s: LaunchState, device: string, time: number): void {
  const key = device === 'touch' ? t('rocket.btnSep') : actionKey(device, 'ready');
  switch (s.phase) {
    case 'countdown': {
      const n = Math.ceil(LAUNCH.countdown - s.t);
      text(ctx, n > 0 ? String(n) : t('rocket.ignition'), 640, 200, { ...big, size: 72, color: COLORS.gold });
      return;
    }
    case 'burn':
      text(ctx, t('rocket.burn', { n: s.stage }), 640, 96, { size: 24, display: true, align: 'center', shadow: true });
      return;
    case 'spent':
      if (Math.sin(time * 16) > -0.3) text(ctx, t('rocket.separate', { key }), 640, 124, { ...big, size: 40, color: COLORS.gold });
      return;
    case 'orbit':
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

/** Fuel left in each stage: the burning one drains, a spent one flashes red, a dropped one is gone. */
function stageFuel(s: LaunchState, stage: 1 | 2): number | null {
  if (s.phase === 'orbit' || s.phase === 'done' || stage < s.stage) return null;
  return stage > s.stage || s.phase === 'countdown' ? 1 : s.fuel;
}

export function drawFuel(ctx: CanvasRenderingContext2D, s: LaunchState, time: number): void {
  const top = 230;
  const h = 220;
  drawPanel(ctx, { x: 1060, y: top - 60, w: 196, h: h + 130 });
  text(ctx, t('rocket.fuel'), 1158, top - 32, { size: 12, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  for (const stage of [1, 2] as const) {
    const x = 1092 + (stage - 1) * 70;
    const fuel = stageFuel(s, stage);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, top, 30, h);
    if (fuel !== null) {
      const empty = fuel <= 0 && Math.sin(time * 16) > 0;
      ctx.fillStyle = empty ? COLORS.red : stage === s.stage && s.phase === 'burn' ? COLORS.gold : 'rgba(91,227,125,0.7)';
      ctx.fillRect(x, top + h - Math.max(fuel, empty ? 0.04 : 0) * h, 30, Math.max(fuel, empty ? 0.04 : 0) * h);
    }
    text(ctx, t('rocket.stage', { n: stage }), x + 15, top + h + 22, { size: 12, align: 'center', color: COLORS.dim });
  }
  text(ctx, `${Math.round(s.alt)} km`, 1158, top + h + 56, { size: 20, display: true, align: 'center' });
}

export function drawSeparateButton(ctx: CanvasRenderingContext2D, s: LaunchState, time: number): void {
  if (s.phase !== 'burn' && s.phase !== 'spent') return;
  const b: Button = { id: 'action', label: t('rocket.btnSep'), ...ACTION_BTN, primary: true, enabled: true, hint: 'E' };
  drawButton(ctx, b, s.phase === 'spent', time);
}
