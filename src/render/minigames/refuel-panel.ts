import { clamp } from '../../core/math';
import { REFUEL_RULES as R, type PodLight } from '../../game/minigames/refuel';
import { mt } from '../../i18n/minigame-text';
import { REFUEL_TEXT } from '../../i18n/minigames/refuel';
import { COLORS, text } from '../text';
import { HUD_GREEN } from './refuel-hud';
import { PROBE_TIP } from './refuel-view';

// Air Refuelling (doc 15): the plugged hold box around the probe with the hose-depth bar, the status panel
// on the glareshield, event popups and the end banner.

const LAMPS: readonly [Exclude<PodLight, 'off'>, string, string][] = [
  ['red', '#ff3b30', '#3a1210'], ['amber', '#ffb020', '#3a2b0e'], ['green', '#3dff6e', '#0f3319'],
];
const PUSH_SCALE = 56;
const PUSH_TOP = 4;

function dangerColor(d: number): string {
  if (d >= 0.9) return COLORS.red;
  return d >= 0.7 ? COLORS.amber : HUD_GREEN;
}

/** Corner brackets of the hold box, the target diamond (where the hose wants to be) and the hose bar. */
export function drawHoldBox(ctx: CanvasRenderingContext2D, hold: { x: number; y: number }, push: number, alpha: number): void {
  if (alpha <= 0) return;
  const s = PROBE_TIP.s;
  const hw = R.boxX * s;
  const hh = R.boxY * s;
  const d = Math.max(Math.abs(hold.x) / R.boxX, Math.abs(hold.y) / R.boxY);
  const { x: cx, y: cy } = PROBE_TIP;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = dangerColor(d);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    ctx.moveTo(cx + sx * hw, cy + sy * (hh - 24));
    ctx.lineTo(cx + sx * hw, cy + sy * hh);
    ctx.lineTo(cx + sx * (hw - 30), cy + sy * hh);
  }
  ctx.stroke();
  const mx = cx + clamp(-hold.x, -R.boxX * 1.15, R.boxX * 1.15) * s;
  const my = cy + clamp(hold.y, -R.boxY * 1.15, R.boxY * 1.15) * s;
  ctx.fillStyle = dangerColor(d);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mx, my - 10);
  ctx.lineTo(mx + 10, my);
  ctx.lineTo(mx, my + 10);
  ctx.lineTo(mx - 10, my);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  text(ctx, mt(REFUEL_TEXT, 'hold'), cx - hw, cy - hh - 8, { size: 10, color: dangerColor(d), letterSpacing: 1.5, shadow: true });
  drawPushBar(ctx, cx + hw + 26, cy + hh, push);
  ctx.restore();
}

function drawPushBar(ctx: CanvasRenderingContext2D, x: number, bottom: number, push: number): void {
  const y = (m: number): number => bottom - clamp(m, 0, PUSH_TOP) * PUSH_SCALE;
  ctx.fillStyle = 'rgba(4,10,16,0.55)';
  ctx.fillRect(x - 3, y(PUSH_TOP) - 3, 16, PUSH_TOP * PUSH_SCALE + 6);
  const band = (a: number, b: number, color: string): void => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y(b), 10, y(a) - y(b));
  };
  band(0, R.flowMin, 'rgba(144,164,184,0.45)');
  band(R.flowMin, R.flowMax, 'rgba(91,227,125,0.85)');
  band(R.flowMax, R.slackMax, 'rgba(255,157,46,0.85)');
  band(R.slackMax, PUSH_TOP, 'rgba(255,79,79,0.85)');
  const py = y(push);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 12, py);
  ctx.lineTo(x + 24, py - 7);
  ctx.lineTo(x + 24, py + 7);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  text(ctx, mt(REFUEL_TEXT, 'hose'), x + 5, y(PUSH_TOP) - 10, { size: 10, align: 'center', color: COLORS.ink, letterSpacing: 1.2, shadow: true });
  text(ctx, mt(REFUEL_TEXT, 'flowBand'), x + 30, y((R.flowMin + R.flowMax) / 2) + 4, { size: 9, color: HUD_GREEN, letterSpacing: 1, shadow: true });
  text(ctx, mt(REFUEL_TEXT, 'slackBand'), x + 30, y((R.slackMax + PUSH_TOP) / 2) + 4, { size: 9, color: COLORS.red, letterSpacing: 1, shadow: true });
}

/** Annunciator on the glareshield: the pod lights repeated and the status line. */
export function drawStatusPanel(ctx: CanvasRenderingContext2D, label: string, color: string, light: PodLight, t: number): void {
  const x = 450;
  const y = 670;
  ctx.fillStyle = '#05080b';
  ctx.strokeStyle = 'rgba(120,140,160,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, 380, 38, 6);
  ctx.fill();
  ctx.stroke();
  const flash = Math.sin(t * 12) > -0.2;
  LAMPS.forEach(([kind, on, off], i) => {
    const lit = light === kind && (kind !== 'red' || flash);
    ctx.beginPath();
    ctx.arc(x + 22 + i * 20, y + 19, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = lit ? on : off;
    ctx.shadowColor = lit ? on : 'transparent';
    ctx.shadowBlur = lit ? 12 : 0;
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  text(ctx, label, x + 228, y + 26, { size: 17, display: true, align: 'center', color, maxWidth: 290, letterSpacing: 0.5 });
}

export interface PopupView {
  main: string;
  sub: string;
  good: boolean;
}

/** Rising, fading popup for a contact / failure / disconnect. */
export function drawPopup(ctx: CanvasRenderingContext2D, p: PopupView, age: number): void {
  const a = clamp(1 - (age - 1.3) / 0.4, 0, 1);
  if (a <= 0) return;
  const pop = 1 + Math.max(0, 0.3 - age) * 1.5;
  const y = 236 - age * 12;
  ctx.save();
  ctx.globalAlpha = a;
  text(ctx, p.main, 640, y, { size: Math.round(42 * pop), display: true, italic: true, align: 'center', color: p.good ? HUD_GREEN : COLORS.red, stroke: 'rgba(0,0,0,0.75)', strokeWidth: 7 });
  if (p.sub) text(ctx, p.sub, 640, y + 30, { size: 17, display: true, align: 'center', color: COLORS.ink, stroke: 'rgba(0,0,0,0.65)', strokeWidth: 4 });
  ctx.restore();
}

/** Small "+1,000 LBS" over the fuel gauge. */
export function drawMilestone(ctx: CanvasRenderingContext2D, label: string, age: number): void {
  const a = clamp(1 - (age - 0.8) / 0.4, 0, 1);
  if (a <= 0) return;
  text(ctx, label, 1190, 140 - age * 16, { size: 16, display: true, align: 'center', color: COLORS.gold, stroke: 'rgba(0,0,0,0.7)', strokeWidth: 4, alpha: a });
}

export function drawEndBanner(ctx: CanvasRenderingContext2D, main: string, sub: string, age: number): void {
  const a = clamp(age / 0.25, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(2,6,10,0.45)';
  ctx.fillRect(0, 250, 1280, 120);
  text(ctx, main, 640, 314, { size: 56, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: 'rgba(0,0,0,0.75)', strokeWidth: 8 });
  text(ctx, sub, 640, 350, { size: 20, display: true, align: 'center', color: COLORS.ink, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 4 });
  ctx.restore();
}
