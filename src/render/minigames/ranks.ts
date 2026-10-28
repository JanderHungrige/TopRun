import { NAME_PLATE, pixelFrame, pixelRect, RPG_BOX, type FrameStyle } from '../pixel/frame';
import { COLORS, text, wrap } from '../text';

// Rank Quiz (doc 41): the ready room, the question board, the timer bar, the answer cards, the verdict and the fact
// line, and the rec-room icon. Strings come in translated.

export interface Box { x: number; y: number; w: number; h: number }
export type AnswerState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim';

const BOARD: Box = { x: 140, y: 84, w: 1000, h: 216 };
const BAR: Box = { x: 140, y: 312, w: 1000, h: 12 };
const RIGHT: FrameStyle = { outline: '#04140a', light: '#9df5b4', shadow: '#1f7a3c', inner: '#04140a', fill: '#0f3d1f' };
const WRONG: FrameStyle = { outline: '#1a0404', light: '#ff9c9c', shadow: '#8a1e1e', inner: '#1a0404', fill: '#3d0f0f' };
const DIM: FrameStyle = { outline: '#06080f', light: '#5d6c8e', shadow: '#2a3350', inner: '#06080f', fill: '#0e1426' };

/** The answer cards: a 2 × 2 grid, or two wide ones for a two-way question. */
export function answerBoxes(n: number): Box[] {
  if (n === 2) return [{ x: 140, y: 380, w: 490, h: 120 }, { x: 650, y: 380, w: 490, h: 120 }];
  return [0, 1, 2, 3].map((i) => ({ x: i % 2 === 0 ? 140 : 650, y: i < 2 ? 344 : 456, w: 490, h: 100 }));
}

/** Dark panelled wall, a slat pattern and the table edge at the bottom. */
export function drawRoom(ctx: CanvasRenderingContext2D): void {
  pixelRect(ctx, 0, 0, 1280, 720, '#1b1410');
  for (let x = 0; x < 1280; x += 64) pixelRect(ctx, x, 56, 4, 600, '#140f0b');
  pixelRect(ctx, 0, 640, 1280, 80, '#3a2618');
  pixelRect(ctx, 0, 640, 1280, 6, '#5a3c24');
}

export interface BoardView { counter: string; force: string; question: string }

export function drawBoard(ctx: CanvasRenderingContext2D, v: BoardView): void {
  pixelFrame(ctx, BOARD, RPG_BOX, 3);
  text(ctx, v.counter, BOARD.x + 28, BOARD.y + 40, { size: 16, display: true, color: COLORS.gold });
  const tagW = Math.max(120, v.force.length * 11 + 30);
  pixelFrame(ctx, { x: BOARD.x + BOARD.w - tagW - 20, y: BOARD.y + 16, w: tagW, h: 34 }, NAME_PLATE, 2);
  text(ctx, v.force.toUpperCase(), BOARD.x + BOARD.w - 20 - tagW / 2, BOARD.y + 39, { size: 15, display: true, align: 'center', color: COLORS.gold });
  const lines = wrap(ctx, v.question, BOARD.w - 80, 28).slice(0, 3);
  const top = BOARD.y + 120 - (lines.length - 1) * 18;
  lines.forEach((l, i) => text(ctx, l, BOARD.x + BOARD.w / 2, top + i * 38, { size: 28, display: true, align: 'center', color: COLORS.ink }));
}

/** Time left 0 … 1: cyan, amber below 40 %, red below 20 %. */
export function drawTimer(ctx: CanvasRenderingContext2D, left: number): void {
  const f = Math.max(0, Math.min(1, left));
  pixelRect(ctx, BAR.x, BAR.y, BAR.w, BAR.h, '#0a0f1c');
  const color = f < 0.2 ? COLORS.red : f < 0.4 ? COLORS.amber : COLORS.cyan;
  pixelRect(ctx, BAR.x, BAR.y, Math.round(BAR.w * f), BAR.h, color);
}

const STYLE: Readonly<Record<AnswerState, FrameStyle>> = { idle: RPG_BOX, selected: NAME_PLATE, right: RIGHT, wrong: WRONG, dim: DIM };

export function drawAnswer(ctx: CanvasRenderingContext2D, b: Box, n: number, label: string, st: AnswerState, t: number): void {
  const lift = st === 'selected' ? Math.round(2 + Math.sin(t * 6)) : 0;
  pixelFrame(ctx, { ...b, y: b.y - lift }, STYLE[st], 3);
  const badge = { x: b.x + 16, y: b.y - lift + b.h / 2 - 20, w: 40, h: 40 };
  pixelFrame(ctx, badge, st === 'dim' ? DIM : NAME_PLATE, 2);
  text(ctx, String(n), badge.x + 20, badge.y + 28, { size: 20, display: true, align: 'center', color: COLORS.gold });
  const ink = st === 'dim' ? COLORS.faint : st === 'selected' ? COLORS.gold : COLORS.ink;
  text(ctx, label, b.x + 76, b.y - lift + b.h / 2 + 9, { size: 24, display: true, color: ink, maxWidth: b.w - 96 });
}

/** The verdict ("RIGHT!" / "WRONG" / "TIME!") and the fact behind the answer. */
export function drawFact(ctx: CanvasRenderingContext2D, verdict: string, right: boolean, fact: string, prompt: string, t: number): void {
  text(ctx, verdict, 640, 590, { size: 30, display: true, align: 'center', color: right ? COLORS.green : COLORS.red, shadow: true });
  text(ctx, fact, 640, 626, { size: 19, type: true, align: 'center', color: COLORS.ink, maxWidth: 1100 });
  if (Math.sin(t * 5) > -0.3) text(ctx, prompt, 1240, 700, { size: 13, align: 'right', color: COLORS.dim });
}

/** Rec-room icon: a quiz card with a big question mark and three rank stripes, within ±40 px. */
export function drawRanksIcon(ctx: CanvasRenderingContext2D, t: number): void {
  const bob = Math.round(Math.sin(t * 2) * 2);
  pixelRect(ctx, -30, -34 + bob, 60, 68, '#f3ead2');
  pixelRect(ctx, -30, -34 + bob, 60, 6, '#c9b98f');
  text(ctx, '?', 0, 14 + bob, { size: 44, display: true, align: 'center', color: '#2b2a33' });
  for (let i = 0; i < 3; i++) pixelRect(ctx, 14, 16 + bob - i * 7, 12, 4, '#c8901a');
}
