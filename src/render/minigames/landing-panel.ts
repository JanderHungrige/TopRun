import { clamp, TAU } from '../../core/math';
import type { PassResult } from '../../game/minigames/landing';
import type { Grade } from '../../game/minigames/landing-grade';
import { mt } from '../../i18n/minigame-text';
import { GRADE_KEY, LANDING_TEXT, type LandingKey } from '../../i18n/minigames/landing';
import { RADIO_BOX, pixelFrame } from '../pixel/frame';
import { COLORS, measure, text } from '../text';
import { typedLines } from '../typed-text';

// Carrier Landing panels (doc 18): Paddles' radio strip, the LSO board (greenie board) with one cell per pass,
// the grade card after each pass, event popups, the pass banner, the end banner and the fade between passes.

const tx = (k: LandingKey, p?: Record<string, string | number>): string => mt(LANDING_TEXT, k, p);
const SHADE = 'rgba(0,0,0,0.75)';

export const GRADE_COLOR: Readonly<Record<Grade, string>> = {
  ok: '#3ecf5a', fair: '#ffd23d', noGrade: '#c8843f', bolter: '#4b8dff', waveoff: '#ff4f4f',
};

export interface RadioView {
  label: string;
  full: string;
  shown: string;
  age: number;
  life: number;
  urgent: boolean;
  t: number;
}

const STRIP = { x: 16, y: 62, w: 600, h: 66 };

function drawHeadset(ctx: CanvasRenderingContext2D, x: number, y: number, talking: boolean): void {
  ctx.save();
  ctx.fillStyle = '#10161d';
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffd27a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y + 3, 13, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(x - 15, y - 1, 6, 11);
  ctx.fillRect(x + 9, y - 1, 6, 11);
  ctx.beginPath();
  ctx.moveTo(x - 12, y + 10);
  ctx.quadraticCurveTo(x - 10, y + 17, x - 2, y + 16);
  ctx.stroke();
  if (talking) {
    ctx.fillStyle = '#ff5a44';
    ctx.beginPath();
    ctx.arc(x + 17, y - 17, 3.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawRadio(ctx: CanvasRenderingContext2D, v: RadioView): void {
  const a = clamp(Math.min(v.age / 0.12, (v.life - v.age) / 0.3), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  pixelFrame(ctx, STRIP, RADIO_BOX, 1);
  drawHeadset(ctx, STRIP.x + 34, STRIP.y + 33, v.shown.length < v.full.length && Math.sin(v.t * 20) > 0);
  text(ctx, v.label, STRIP.x + 70, STRIP.y + 22, { size: 11, type: true, weight: 700, color: '#7dffc8', letterSpacing: 1.2 });
  let size = 19;
  while (size > 12 && measure(ctx, v.full, size, false, true) > STRIP.w - 96) size--;
  const typing = v.shown.length < v.full.length;
  typedLines(ctx, [v.full], v.shown.length, STRIP.x + 70, STRIP.y + 50, {
    size, color: v.urgent ? '#ff8a7a' : '#c9ffe6', lineHeight: size + 4, cursor: typing || Math.floor(v.t * 2.5) % 2 === 0 ? '#7dffc8' : null,
  });
  ctx.restore();
}

const BOARD = { x: 1022, y: 62, w: 242, h: 86 };

function boardMark(r: PassResult): string {
  switch (r.outcome.kind) {
    case 'trap': return String(r.outcome.wire);
    case 'bolter': return tx('boardBolter');
    case 'waveoff': return tx('boardWaveoff');
    default: throw new Error(`unhandled: ${r.outcome satisfies never}`);
  }
}

/** The LSO board: one cell per pass in its grade colour, the wire (or B / WO) and the points. */
export function drawBoard(ctx: CanvasRenderingContext2D, results: readonly PassResult[], current: number, t: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h, 8);
  ctx.fillStyle = 'rgba(6,10,16,0.8)';
  ctx.fill();
  text(ctx, tx('board'), BOARD.x + 14, BOARD.y + 20, { size: 11, display: true, color: COLORS.dim, letterSpacing: 1.2 });
  for (let i = 0; i < 3; i++) {
    const x = BOARD.x + 14 + i * 74;
    const y = BOARD.y + 32;
    const r = results[i];
    ctx.beginPath();
    ctx.roundRect(x, y, 66, 42, 5);
    ctx.fillStyle = r ? GRADE_COLOR[r.grade] : 'rgba(255,255,255,0.05)';
    ctx.fill();
    if (!r && i === current) {
      ctx.strokeStyle = `rgba(255,210,122,${(0.45 + 0.35 * Math.sin(t * 5)).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (!r) continue;
    text(ctx, boardMark(r), x + 33, y + 30, { size: 22, display: true, align: 'center', color: '#0a0d12' });
    text(ctx, `+${r.points}`, x + 61, y + 13, { size: 10, weight: 800, align: 'right', color: 'rgba(10,13,18,0.75)' });
  }
  ctx.restore();
}

/** The grade card after a pass: grade, points, Paddles' comment and the continue hint. */
export function drawGradeCard(ctx: CanvasRenderingContext2D, r: PassResult, comment: string, age: number, last: boolean, canSkip: boolean): void {
  const a = clamp(age / 0.2, 0, 1);
  const pop = 1 + Math.max(0, 0.25 - age) * 0.8;
  const color = GRADE_COLOR[r.grade];
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(640, 290);
  ctx.scale(pop, pop);
  ctx.beginPath();
  ctx.roundRect(-270, -96, 540, 192, 12);
  ctx.fillStyle = 'rgba(5,9,14,0.9)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
  text(ctx, tx('passShort', { n: r.pass + 1 }), -246, -64, { size: 13, display: true, color: COLORS.dim, letterSpacing: 1.5 });
  text(ctx, tx(r.points === 1 ? 'pt' : 'pts', { n: r.points }), 246, -64, { size: 16, display: true, align: 'right', color });
  text(ctx, tx(GRADE_KEY[r.grade]), 0, -2, { size: 58, display: true, italic: true, align: 'center', color, stroke: SHADE, strokeWidth: 6 });
  text(ctx, tx('comment', { text: comment }), 0, 40, { size: 18, weight: 700, align: 'center', color: COLORS.ink, maxWidth: 500 });
  if (canSkip) text(ctx, tx(last ? 'nextLast' : 'next'), 0, 76, { size: 12, display: true, align: 'center', color: COLORS.dim, letterSpacing: 1, alpha: 0.6 + 0.4 * Math.sin(age * 5) });
  ctx.restore();
}

/** Big centred popup ("3-WIRE!", "BOLTER!", "WAVE OFF!"). */
export function drawPopup(ctx: CanvasRenderingContext2D, label: string, color: string, age: number): void {
  const a = clamp(1 - (age - 1.4) / 0.4, 0, 1);
  if (a <= 0) return;
  const pop = 1 + Math.max(0, 0.3 - age) * 1.6;
  text(ctx, label, 640, 236 - age * 10, { size: Math.round(50 * pop), display: true, italic: true, align: 'center', color, stroke: SHADE, strokeWidth: 8, alpha: a });
}

export function drawPassBanner(ctx: CanvasRenderingContext2D, label: string, age: number): void {
  const a = clamp(Math.min((age - 0.3) / 0.3, (2.6 - age) / 0.5), 0, 1);
  if (a <= 0) return;
  text(ctx, label, 640, 210, { size: 30, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: SHADE, strokeWidth: 6, alpha: a, letterSpacing: 2 });
}

export function drawEndBanner(ctx: CanvasRenderingContext2D, main: string, sub: string, age: number): void {
  const a = clamp(age / 0.25, 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(2,6,10,0.55)';
  ctx.fillRect(0, 250, 1280, 120);
  text(ctx, main, 640, 314, { size: 52, display: true, italic: true, align: 'center', color: COLORS.gold, stroke: SHADE, strokeWidth: 8 });
  text(ctx, sub, 640, 350, { size: 20, display: true, align: 'center', color: COLORS.ink, stroke: 'rgba(0,0,0,0.6)', strokeWidth: 4 });
  ctx.restore();
}

/** Black fade at the start of a pass. */
export function drawFade(ctx: CanvasRenderingContext2D, alpha: number): void {
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${clamp(alpha, 0, 1).toFixed(3)})`;
  ctx.fillRect(0, 0, 1280, 720);
}
