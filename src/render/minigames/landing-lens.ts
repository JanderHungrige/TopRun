import { clamp, TAU } from '../../core/math';
import { DECK } from '../../game/minigames/landing-deck';
import { LANDING_RULES as R } from '../../game/minigames/landing';
import { mt } from '../../i18n/minigame-text';
import { LANDING_TEXT } from '../../i18n/minigames/landing';
import { COLORS, text } from '../text';
import type { Frame } from './landing-carrier';
import { drawLamp } from './landing-lights';
import { project, v3, type Cam } from './landing-view';

// Carrier Landing lens (doc 18): the optical landing aid on the left of the deck — green datum arms, the amber
// ball (red when low), red wave-off lights — in the 3D view, and magnified in the BALL repeater beside the HUD
// together with a LINE-UP bar (where the jet is against the centreline).

export const BALL_AMBER = '#ffb020';
export const BALL_RED = '#ff3a2a';
const DATUM = '#46ff78';
const HUD_GREEN = '#7dffa0';

export interface LensView {
  ball: number;
  waveoff: boolean;
  t: number;
}

const ballColor = (ball: number): string => (ball < R.redBall ? BALL_RED : BALL_AMBER);
const flash = (t: number): boolean => Math.sin(t * TAU * 3.5) > 0;

/** The lens on the deck, drawn at least 1.2 px per metre so it stays a recognisable cluster from far out. */
export function drawLensWorld(ctx: CanvasRenderingContext2D, cam: Cam, f: Frame, v: LensView): void {
  const c = project(cam, f(v3(DECK.lensX, 1.4, DECK.target)));
  if (!c) return;
  const s = Math.max(c.s, 1.2);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(-cam.roll);
  ctx.fillStyle = '#05070a';
  ctx.fillRect(-0.6 * s, -1.3 * s, 1.2 * s, 2.6 * s);
  ctx.globalCompositeOperation = 'lighter';
  const lamp = (x: number, y: number, color: string, r: number, a = 1): void =>
    drawLamp(ctx, { x: x * s, y: y * s, s, d: c.d }, color, r, a);
  for (let k = 0; k < 5; k++) for (const side of [-1, 1]) lamp(side * (2.2 + k), 0, DATUM, 0.3);
  const b = clamp(v.ball, -R.ballShown, R.ballShown);
  lamp(0, -b * 0.35, ballColor(v.ball), 0.5);
  if (v.waveoff && flash(v.t)) for (const side of [-1, 1]) for (let k = 0; k < 3; k++) lamp(side * 0.9, -0.5 - k * 0.35, BALL_RED, 0.2);
  ctx.restore();
}

const BOX = { x: 150, y: 214, w: 180, h: 270 };
const LENS = { x: 240, y: 342, half: 78, cell: 22 };

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, on: boolean): void {
  ctx.save();
  if (on) {
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 2.4;
  }
  ctx.fillStyle = on ? color : 'rgba(70,40,30,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawLensFace(ctx: CanvasRenderingContext2D, v: LensView): void {
  ctx.fillStyle = '#05080b';
  ctx.fillRect(LENS.x - 13, LENS.y - LENS.half, 26, LENS.half * 2);
  ctx.strokeStyle = 'rgba(120,140,160,0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = -3; k <= 3; k++) {
    ctx.moveTo(LENS.x - 13, LENS.y + k * LENS.cell + LENS.cell / 2);
    ctx.lineTo(LENS.x + 13, LENS.y + k * LENS.cell + LENS.cell / 2);
  }
  ctx.stroke();
  for (let k = 0; k < 5; k++) for (const side of [-1, 1]) glowDot(ctx, LENS.x + side * (27 + k * 11), LENS.y, 3.6, DATUM, true);
  const lit = v.waveoff && flash(v.t);
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) glowDot(ctx, LENS.x + side * 19, LENS.y - 58 + k * 11, 3.2, BALL_RED, lit);
  const b = clamp(v.ball, -R.ballShown, R.ballShown);
  glowDot(ctx, LENS.x, LENS.y - b * LENS.cell, 8.5, ballColor(v.ball), true);
}

/** Jet position against the centreline: x / tolerance, + = right of it. */
function drawLineup(ctx: CanvasRenderingContext2D, lineup: number): void {
  const y = BOX.y + BOX.h - 26;
  text(ctx, mt(LANDING_TEXT, 'lineup'), LENS.x, y - 14, { size: 10, align: 'center', color: COLORS.dim, letterSpacing: 1.5 });
  ctx.strokeStyle = 'rgba(125,255,160,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LENS.x - 66, y);
  ctx.lineTo(LENS.x + 66, y);
  for (const k of [-2, -1, 1, 2]) {
    ctx.moveTo(LENS.x + k * 22, y - 3);
    ctx.lineTo(LENS.x + k * 22, y + 3);
  }
  ctx.stroke();
  ctx.strokeStyle = HUD_GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LENS.x, y - 8);
  ctx.lineTo(LENS.x, y + 8);
  ctx.stroke();
  const a = Math.abs(lineup);
  const color = a < 0.8 ? HUD_GREEN : a < 2 ? COLORS.amber : COLORS.red;
  const x = LENS.x + clamp(lineup, -3, 3) * 22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 7);
  ctx.lineTo(x + 7, y + 5);
  ctx.lineTo(x - 7, y + 5);
  ctx.closePath();
  ctx.fill();
}

/** The magnified BALL repeater with the LINE-UP bar (dimmed with `alpha` when not on approach). */
export function drawBallRepeater(ctx: CanvasRenderingContext2D, v: LensView, lineup: number, alpha = 1): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(3,8,12,0.72)';
  ctx.strokeStyle = 'rgba(125,255,160,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(BOX.x, BOX.y, BOX.w, BOX.h, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, mt(LANDING_TEXT, 'ball'), LENS.x, BOX.y + 20, { size: 11, align: 'center', color: HUD_GREEN, letterSpacing: 2 });
  drawLensFace(ctx, v);
  drawLineup(ctx, lineup);
  ctx.restore();
}
