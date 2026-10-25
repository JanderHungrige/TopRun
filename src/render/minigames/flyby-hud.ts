import { clamp, TAU } from '../../core/math';
import { SCORE_RANGE, SPILL_CLEARANCE, type PassResult } from '../../game/minigames/flyby';
import { feet } from '../../game/minigames/flyby-jet';
import { mt } from '../../i18n/minigame-text';
import { FLYBY_TEXT } from '../../i18n/minigames/flyby';
import { drawPlaneSide } from '../draw-planes-side';
import { COLORS, text } from '../text';

// Tower Flyby HUD (doc 13): altitude ladder with the FEET OVER THE TOWER readout, pass popups, banner, gauges.

const LADDER_TOP = 175;

export function zoneColor(clear: number): string {
  if (clear <= 0) return COLORS.red;
  if (clear < SPILL_CLEARANCE) return COLORS.gold;
  if (clear < SCORE_RANGE) return COLORS.green;
  return COLORS.dim;
}

function ladderBar(ctx: CanvasRenderingContext2D, x: number, roofY: number): void {
  ctx.fillStyle = 'rgba(4,10,16,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - 7, roofY - LADDER_TOP - 6, 14, LADDER_TOP + 12, 5);
  ctx.fill();
  const g = ctx.createLinearGradient(0, roofY - SCORE_RANGE, 0, roofY - SPILL_CLEARANCE);
  g.addColorStop(0, 'rgba(91,227,125,0.15)');
  g.addColorStop(1, 'rgba(91,227,125,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 4, roofY - SCORE_RANGE, 8, SCORE_RANGE - SPILL_CLEARANCE);
  ctx.fillStyle = 'rgba(255,200,61,0.95)';
  ctx.fillRect(x - 4, roofY - SPILL_CLEARANCE, 8, SPILL_CLEARANCE);
  ctx.fillStyle = 'rgba(144,164,184,0.35)';
  ctx.fillRect(x - 4, roofY - LADDER_TOP, 8, LADDER_TOP - SCORE_RANGE);
  ctx.strokeStyle = 'rgba(233,239,245,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let px = 0; px <= SCORE_RANGE; px += 25) {
    ctx.moveTo(x + 4, roofY - px);
    ctx.lineTo(x + (px % 50 === 0 ? 11 : 8), roofY - px);
  }
  ctx.stroke();
  for (let px = 50; px <= SCORE_RANGE; px += 50) text(ctx, String(feet(px)), x + 14, roofY - px + 4, { size: 11, color: COLORS.ink, shadow: true });
  text(ctx, mt(FLYBY_TEXT, 'spillZone'), x + 14, roofY - 8, { size: 9, color: COLORS.gold, shadow: true, letterSpacing: 1 });
}

function marker(ctx: CanvasRenderingContext2D, x: number, roofY: number, clear: number): void {
  const y = clamp(roofY - clear, roofY - LADDER_TOP - 14, roofY + 40);
  ctx.fillStyle = zoneColor(clear);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x - 20, y - 7);
  ctx.lineTo(x - 20, y + 7);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.fillRect(x - 6, y - 1, 12, 2);
}

/** Ladder at screen x with zero at the roof, the jet's marker and the live readout above it. */
export function drawLadder(ctx: CanvasRenderingContext2D, x: number, roofY: number, clear: number, ft: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ladderBar(ctx, x, roofY);
  marker(ctx, x, roofY, clear);
  const right = Math.min(1262, x + 48);
  const top = roofY - LADDER_TOP - 22;
  text(ctx, mt(FLYBY_TEXT, 'feetOver'), right, top - 40, { size: 11, align: 'right', color: COLORS.ink, shadow: true, letterSpacing: 1.5 });
  text(ctx, mt(FLYBY_TEXT, 'ft', { ft }), right, top - 4, { size: 34, display: true, align: 'right', color: zoneColor(clear), stroke: 'rgba(0,0,0,0.65)', strokeWidth: 5 });
  text(ctx, mt(FLYBY_TEXT, 'tower'), x, roofY + 18, { size: 10, align: 'center', color: COLORS.ink, shadow: true, letterSpacing: 1.5 });
  ctx.restore();
}

/** Dashed line at roof height from the jet towards the tower while it is still ahead. */
export function drawRoofGuide(ctx: CanvasRenderingContext2D, from: number, to: number, roofY: number, alpha: number): void {
  if (alpha <= 0 || to <= from) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255,200,61,0.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(from, roofY);
  ctx.lineTo(to, roofY);
  ctx.stroke();
  ctx.restore();
}

export function drawBurnerGauge(ctx: CanvasRenderingContext2D, level: number, lit: boolean, mult: string): void {
  ctx.fillStyle = 'rgba(4,8,14,0.6)';
  ctx.beginPath();
  ctx.roundRect(20, 662, 250, 42, 8);
  ctx.fill();
  text(ctx, mt(FLYBY_TEXT, 'burner'), 32, 680, { size: 11, color: lit ? COLORS.amber : COLORS.dim, letterSpacing: 1.5 });
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(32, 688, 160, 8);
  const g = ctx.createLinearGradient(32, 0, 192, 0);
  g.addColorStop(0, '#ff9d2e');
  g.addColorStop(1, '#fff1b0');
  ctx.fillStyle = g;
  ctx.fillRect(32, 688, 160 * level, 8);
  text(ctx, mt(FLYBY_TEXT, 'mult', { mult }), 258, 697, { size: 20, display: true, align: 'right', color: level > 0.05 ? COLORS.gold : COLORS.ink });
}

/** Three pass slots under the top bar: points of finished passes, the current one outlined. */
export function drawPassSlots(ctx: CanvasRenderingContext2D, results: readonly PassResult[], current: number, fmt: (n: number) => string): void {
  for (let i = 0; i < 3; i++) {
    const x = 24 + i * 92;
    const r = results[i];
    ctx.fillStyle = 'rgba(4,8,14,0.55)';
    ctx.beginPath();
    ctx.roundRect(x, 64, 84, 28, 6);
    ctx.fill();
    if (i === current && !r) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const label = r ? fmt(r.points) : '—';
    const color = !r ? COLORS.faint : r.points > 0 ? (r.spill ? COLORS.gold : COLORS.ink) : COLORS.red;
    text(ctx, label, x + 42, 84, { size: 15, display: true, align: 'center', color });
  }
}

export interface PopupView {
  main: string;
  detail: string;
  bonus: string;
  good: boolean;
}

/** Rising, fading per-pass score popup. */
export function drawPopup(ctx: CanvasRenderingContext2D, x: number, y: number, p: PopupView, age: number): void {
  const a = clamp(1 - (age - 1.1) / 0.4, 0, 1);
  if (a <= 0) return;
  const pop = 1 + Math.max(0, 0.35 - age) * 1.4;
  const yy = y - age * 18;
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, p.main, x, yy, { size: Math.round(40 * pop), display: true, italic: true, align: 'center', color: p.good ? '#ffffff' : COLORS.red, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 6 });
  if (p.detail) text(ctx, p.detail, x, yy + 26, { size: 16, display: true, align: 'center', color: COLORS.ink, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 4 });
  if (p.bonus && Math.sin(age * 14) > -0.5) text(ctx, p.bonus, x, yy + 50, { size: 17, display: true, align: 'center', color: COLORS.gold, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 4 });
  ctx.restore();
}

export function drawBanner(ctx: CanvasRenderingContext2D, label: string, age: number): void {
  const a = clamp(Math.min(age / 0.15, (1.4 - age) / 0.3), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, label, 640, 230, { size: 46, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 7 });
  ctx.restore();
}

/** Hub card icon: the tower with a jet streaking over its roof and coffee flying. */
export function drawFlybyIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#dcd6c9';
  ctx.fillRect(-22, 6, 14, 32);
  ctx.fillStyle = '#b9b2a4';
  ctx.fillRect(-36, 4, 42, 3);
  ctx.fillStyle = 'rgba(160,215,235,0.9)';
  ctx.beginPath();
  ctx.moveTo(-30, 4);
  ctx.lineTo(-34, -9);
  ctx.lineTo(2, -9);
  ctx.lineTo(-2, 4);
  ctx.fill();
  ctx.fillStyle = '#e6e1d6';
  ctx.fillRect(-35, -14, 38, 5);
  ctx.fillStyle = '#c23b2f';
  ctx.fillRect(-35, -14, 38, 1.2);
  ctx.fillStyle = '#6b3c1c';
  for (let i = 0; i < 4; i++) {
    const k = (t * 1.6 + i * 0.25) % 1;
    ctx.beginPath();
    ctx.arc(-6 + k * 22, -4 + (k - 0.4) * (k - 0.4) * 30, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    ctx.moveTo(-40 + i * 4, -34 + i * 6);
    ctx.lineTo(-24 + i * 4, -34 + i * 6);
  }
  ctx.stroke();
  drawPlaneSide(ctx, 'f16', 6 + Math.sin(t * 2) * 2, -18, 0.5, { gear: 0, throttle: 1, t });
}
