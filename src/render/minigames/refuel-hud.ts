import { clamp, TAU } from '../../core/math';
import type { Medal } from '../../game/minigames/core';
import { KNOTS_PER_MS, REFUEL_MEDALS, REFUEL_RULES as R } from '../../game/minigames/refuel';
import { mt } from '../../i18n/minigame-text';
import { REFUEL_TEXT, refuelNum } from '../../i18n/minigames/refuel';
import { COLORS, text } from '../text';
import { drawMedal } from './medal';
import { PROBE_TIP, type Pt } from './refuel-view';

// Air Refuelling HUD (doc 15): probe aim reticle, closure-rate tape, fuel gauge, plugged hold box with the
// hose-depth bar, the glareshield status panel and the event popups.

export const HUD_GREEN = '#7dffa0';
const OUTLINE = 'rgba(0,0,0,0.6)';
const TAPE = { x: 52, top: 196, bottom: 446, min: -3, max: 6 };
const FUEL_FULL = 8000;

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = 'rgba(4,10,16,0.78)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

/** Where the probe will meet the basket's plane, with a dashed line from the probe tip. */
export function drawAim(ctx: CanvasRenderingContext2D, aim: Pt, good: boolean, alpha: number): void {
  if (alpha <= 0) return;
  const color = good ? HUD_GREEN : COLORS.amber;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  ctx.moveTo(PROBE_TIP.x, PROBE_TIP.y);
  ctx.lineTo(aim.x, aim.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(aim.x, aim.y, 9, 0, TAU);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    ctx.moveTo(aim.x + dx * 13, aim.y + dy * 13);
    ctx.lineTo(aim.x + dx * 20, aim.y + dy * 20);
  }
  ctx.stroke();
  ctx.restore();
}

const tapeY = (kt: number): number => TAPE.bottom - ((clamp(kt, TAPE.min, TAPE.max) - TAPE.min) / (TAPE.max - TAPE.min)) * (TAPE.bottom - TAPE.top);

function closureColor(ms: number): string {
  if (ms > R.safeMax) return COLORS.red;
  return ms >= R.safeMin ? HUD_GREEN : COLORS.dim;
}

/** Closure-rate tape in knots with the safe window, a power bar beside it and the range readout. */
export function drawClosureTape(ctx: CanvasRenderingContext2D, closure: number, throttle: number, range: number | null): void {
  panel(ctx, 26, 150, 128, 360);
  text(ctx, mt(REFUEL_TEXT, 'closure'), 90, 176, { size: 11, align: 'center', color: COLORS.ink, letterSpacing: 1.5, maxWidth: 118 });
  const lo = tapeY(R.safeMin * KNOTS_PER_MS);
  const hi = tapeY(R.safeMax * KNOTS_PER_MS);
  ctx.fillStyle = 'rgba(144,164,184,0.35)';
  ctx.fillRect(TAPE.x, lo, 14, TAPE.bottom - lo);
  ctx.fillStyle = 'rgba(91,227,125,0.8)';
  ctx.fillRect(TAPE.x, hi, 14, lo - hi);
  ctx.fillStyle = 'rgba(255,79,79,0.75)';
  ctx.fillRect(TAPE.x, TAPE.top, 14, hi - TAPE.top);
  ctx.strokeStyle = 'rgba(233,239,245,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let kt = TAPE.min; kt <= TAPE.max; kt++) {
    ctx.moveTo(TAPE.x + 14, tapeY(kt));
    ctx.lineTo(TAPE.x + (kt % 2 === 0 ? 22 : 18), tapeY(kt));
  }
  ctx.stroke();
  for (let kt = -2; kt <= TAPE.max; kt += 2) text(ctx, String(kt), TAPE.x + 26, tapeY(kt) + 4, { size: 11, color: COLORS.ink });
  text(ctx, mt(REFUEL_TEXT, 'fast'), TAPE.x + 7, TAPE.top - 6, { size: 9, align: 'center', color: COLORS.red, letterSpacing: 1 });
  const kt = closure * KNOTS_PER_MS;
  const y = tapeY(kt);
  ctx.fillStyle = closureColor(closure);
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(TAPE.x - 2, y);
  ctx.lineTo(TAPE.x - 16, y - 8);
  ctx.lineTo(TAPE.x - 16, y + 8);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.fillRect(TAPE.x - 2, y - 1.5, 18, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(124, TAPE.top, 10, TAPE.bottom - TAPE.top);
  ctx.fillStyle = COLORS.amber;
  const ph = (TAPE.bottom - TAPE.top) * clamp(throttle, 0, 1);
  ctx.fillRect(124, TAPE.bottom - ph, 10, ph);
  text(ctx, mt(REFUEL_TEXT, 'power'), 129, TAPE.bottom + 14, { size: 8, align: 'center', color: COLORS.dim, letterSpacing: 0.5 });
  text(ctx, mt(REFUEL_TEXT, 'kt', { kt: refuelNum(kt, 1) }), 90, 484, { size: 20, display: true, align: 'center', color: closureColor(closure), stroke: OUTLINE, strokeWidth: 4 });
  if (range !== null) text(ctx, mt(REFUEL_TEXT, 'range', { m: refuelNum(range, 1) }), 90, 502, { size: 11, align: 'center', color: COLORS.dim });
}

const fuelY = (lbs: number): number => TAPE.bottom - (clamp(lbs, 0, FUEL_FULL) / FUEL_FULL) * (TAPE.bottom - TAPE.top);

/** Fuel received: the tank bar with medal marks and the readout; bubbles rise while fuel flows. */
export function drawFuelGauge(ctx: CanvasRenderingContext2D, fuel: number, valve: number, t: number): void {
  const x = 1158;
  panel(ctx, 1126, 150, 128, 360);
  text(ctx, mt(REFUEL_TEXT, 'fuel'), 1190, 176, { size: 11, align: 'center', color: COLORS.ink, letterSpacing: 1.2, maxWidth: 118 });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x, TAPE.top, 26, TAPE.bottom - TAPE.top);
  const top = fuelY(fuel);
  const g = ctx.createLinearGradient(0, TAPE.bottom, 0, TAPE.top);
  g.addColorStop(0, '#ff9d2e');
  g.addColorStop(1, '#ffe08a');
  ctx.fillStyle = g;
  ctx.fillRect(x, top, 26, TAPE.bottom - top);
  if (valve > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(0.55 * valve).toFixed(3)})`;
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.9 + i / 6) % 1;
      const by = TAPE.bottom - k * (TAPE.bottom - top);
      ctx.beginPath();
      ctx.arc(x + 6 + ((i * 7) % 15), by, 1.8, 0, TAU);
      ctx.fill();
    }
  }
  for (const m of ['bronze', 'silver', 'gold'] as const satisfies readonly Medal[]) {
    const y = fuelY(REFUEL_MEDALS[m]);
    ctx.fillStyle = 'rgba(233,239,245,0.85)';
    ctx.fillRect(x - 4, y - 1, 34, 2);
    ctx.save();
    ctx.globalAlpha = fuel >= REFUEL_MEDALS[m] ? 1 : 0.4;
    drawMedal(ctx, m, x + 44, y, 7);
    ctx.restore();
  }
  text(ctx, refuelNum(Math.round(fuel)), 1190, 484, { size: 20, display: true, align: 'center', color: valve > 0 ? COLORS.gold : COLORS.ink, stroke: OUTLINE, strokeWidth: 4 });
  text(ctx, mt(REFUEL_TEXT, 'lbsUnit'), 1190, 502, { size: 11, align: 'center', color: COLORS.dim, letterSpacing: 1 });
}
