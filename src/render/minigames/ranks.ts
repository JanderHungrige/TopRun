import type { Chart } from '../../data/rank-quiz';
import { NAME_PLATE, pixelFrame, pixelRect, RPG_BOX, type FrameStyle } from '../pixel/frame';
import { COLORS, measure, text, wrap } from '../text';
import { drawInsignia } from './rank-insignia';

// Rank Quiz (doc 41): the ready room, the four chart cards, the study grid with the READY button, the quiz screen
// (the insignia big in a frame, four name cards, the timer bar, the verdict) and the rec-room icon. Strings come in
// translated; layouts are exported so the scene can hit-test them.

export interface Box { x: number; y: number; w: number; h: number }
export type CardState = 'idle' | 'selected' | 'right' | 'wrong' | 'dim';

const RIGHT: FrameStyle = { outline: '#04140a', light: '#9df5b4', shadow: '#1f7a3c', inner: '#04140a', fill: '#0f3d1f' };
const WRONG: FrameStyle = { outline: '#1a0404', light: '#ff9c9c', shadow: '#8a1e1e', inner: '#1a0404', fill: '#3d0f0f' };
const DIM: FrameStyle = { outline: '#06080f', light: '#5d6c8e', shadow: '#2a3350', inner: '#06080f', fill: '#0e1426' };
const STYLE: Readonly<Record<CardState, FrameStyle>> = { idle: RPG_BOX, selected: NAME_PLATE, right: RIGHT, wrong: WRONG, dim: DIM };

/** Insignia sit on a paper plate, like a printed rank chart, so dark cloth shows against the dark boxes. */
function paper(ctx: CanvasRenderingContext2D, b: Box): void {
  pixelRect(ctx, b.x, b.y, b.w, b.h, '#8f8466');
  pixelRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h - 4, '#d9cfb4');
}

export const PICK_CARDS: readonly Box[] = [0, 1, 2, 3].map((i) => ({ x: 64 + i * 294, y: 168, w: 270, h: 340 }));
export const READY: Box = { x: 1020, y: 640, w: 220, h: 56 };
const FRAME: Box = { x: 120, y: 120, w: 380, h: 440 };
const BAR: Box = { x: 120, y: 584, w: 1040, h: 12 };
export const ANSWERS: readonly Box[] = [0, 1, 2, 3].map((i) => ({ x: 560, y: 184 + i * 98, w: 600, h: 84 }));

/** Dark panelled wall, a slat pattern and the table edge at the bottom. */
export function drawRoom(ctx: CanvasRenderingContext2D): void {
  pixelRect(ctx, 0, 0, 1280, 720, '#1b1410');
  for (let x = 0; x < 1280; x += 64) pixelRect(ctx, x, 56, 4, 600, '#140f0b');
  pixelRect(ctx, 0, 640, 1280, 80, '#3a2618');
  pixelRect(ctx, 0, 640, 1280, 6, '#5a3c24');
}

const lift = (st: CardState, t: number): number => (st === 'selected' ? Math.round(2 + Math.sin(t * 6)) : 0);

export function drawHeader(ctx: CanvasRenderingContext2D, title: string, hint: string): void {
  text(ctx, title, 640, 104, { size: 30, display: true, align: 'center', color: COLORS.gold, shadow: true });
  text(ctx, hint, 640, 136, { size: 16, type: true, align: 'center', color: COLORS.dim });
}

export interface PickView { title: string; subtitle: string; chart: Chart; sample: number; state: CardState }

export function drawPickCard(ctx: CanvasRenderingContext2D, b: Box, v: PickView, t: number): void {
  const y = b.y - lift(v.state, t);
  pixelFrame(ctx, { ...b, y }, STYLE[v.state], 3);
  paper(ctx, { x: b.x + b.w / 2 - 80, y: y + 18, w: 160, h: 224 });
  drawInsignia(ctx, v.chart, v.sample, b.x + b.w / 2, y + 130, 4);
  const ink = v.state === 'selected' ? COLORS.gold : COLORS.ink;
  text(ctx, v.title, b.x + b.w / 2, y + 262, { size: 26, display: true, align: 'center', color: ink });
  text(ctx, v.subtitle, b.x + b.w / 2, y + 292, { size: 15, type: true, align: 'center', color: COLORS.dim });
}

/** The study grid: three rows, as many columns as the chart needs, centred. */
export function studyTiles(n: number): Box[] {
  const cols = Math.ceil(n / 3);
  const gap = 8;
  const w = Math.min(150, (1200 - (cols - 1) * gap) / cols);
  const x0 = 640 - (cols * w + (cols - 1) * gap) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + (i % cols) * (w + gap), y: 160 + Math.floor(i / cols) * 160, w, h: 152 }));
}

/** A name in at most two lines, smaller (then squeezed) when a word is too long for the tile. */
function nameLines(ctx: CanvasRenderingContext2D, name: string, maxW: number): { lines: string[]; size: number } {
  let size = 13;
  let lines = wrap(ctx, name, maxW, size);
  while (size > 10 && (lines.length > 2 || lines.some((l) => measure(ctx, l, size) > maxW))) {
    size--;
    lines = wrap(ctx, name, maxW, size);
  }
  return { lines: lines.slice(0, 2), size };
}

export function drawStudyTile(ctx: CanvasRenderingContext2D, b: Box, chart: Chart, index: number, name: string): void {
  pixelFrame(ctx, b, RPG_BOX, 2);
  paper(ctx, { x: b.x + 6, y: b.y + 6, w: b.w - 12, h: 110 });
  drawInsignia(ctx, chart, index, b.x + b.w / 2, b.y + 61, 2);
  const { lines, size } = nameLines(ctx, name, b.w - 12);
  lines.forEach((l, i) => text(ctx, l, b.x + b.w / 2, b.y + 131 + i * (size + 3), { size, align: 'center', color: COLORS.ink, maxWidth: b.w - 10 }));
}

export function drawButton(ctx: CanvasRenderingContext2D, b: Box, label: string, t: number): void {
  const y = b.y - Math.round(2 + Math.sin(t * 5));
  pixelFrame(ctx, { ...b, y }, NAME_PLATE, 3);
  text(ctx, label, b.x + b.w / 2, y + b.h / 2 + 9, { size: 24, display: true, align: 'center', color: COLORS.gold });
}

export interface QuizView { counter: string; chart: string; prompt: string }

/** The insignia big in its frame, the question counter and the chart tag. */
export function drawQuizBoard(ctx: CanvasRenderingContext2D, v: QuizView, chart: Chart, index: number): void {
  text(ctx, v.counter, FRAME.x, 100, { size: 18, display: true, color: COLORS.gold });
  const tagW = Math.max(140, measure(ctx, v.chart, 16, true) + 40);
  pixelFrame(ctx, { x: 1160 - tagW, y: 74, w: tagW, h: 36 }, NAME_PLATE, 2);
  text(ctx, v.chart, 1160 - tagW / 2, 98, { size: 16, display: true, align: 'center', color: COLORS.gold });
  pixelFrame(ctx, FRAME, RPG_BOX, 3);
  paper(ctx, { x: FRAME.x + 12, y: FRAME.y + 12, w: FRAME.w - 24, h: FRAME.h - 24 });
  drawInsignia(ctx, chart, index, FRAME.x + FRAME.w / 2, FRAME.y + FRAME.h / 2, 6);
  text(ctx, v.prompt, ANSWERS[0] ? ANSWERS[0].x + 300 : 860, 160, { size: 26, display: true, align: 'center', color: COLORS.ink });
}

/** Time left 0 … 1: cyan, amber below 40 %, red below 20 %. */
export function drawTimer(ctx: CanvasRenderingContext2D, left: number): void {
  const f = Math.max(0, Math.min(1, left));
  pixelRect(ctx, BAR.x, BAR.y, BAR.w, BAR.h, '#0a0f1c');
  const color = f < 0.2 ? COLORS.red : f < 0.4 ? COLORS.amber : COLORS.cyan;
  pixelRect(ctx, BAR.x, BAR.y, Math.round(BAR.w * f), BAR.h, color);
}

export function drawAnswer(ctx: CanvasRenderingContext2D, b: Box, n: number, label: string, st: CardState, t: number): void {
  const y = b.y - lift(st, t);
  pixelFrame(ctx, { ...b, y }, STYLE[st], 3);
  const badge = { x: b.x + 16, y: y + b.h / 2 - 20, w: 40, h: 40 };
  pixelFrame(ctx, badge, st === 'dim' ? DIM : NAME_PLATE, 2);
  text(ctx, String(n), badge.x + 20, badge.y + 28, { size: 20, display: true, align: 'center', color: COLORS.gold });
  const ink = st === 'dim' ? COLORS.faint : st === 'selected' ? COLORS.gold : COLORS.ink;
  text(ctx, label, b.x + 76, y + b.h / 2 + 9, { size: 24, display: true, color: ink, maxWidth: b.w - 96 });
}

/** The verdict ("RIGHT!" / "WRONG" / "TIME!") and the rank's name. */
export function drawVerdict(ctx: CanvasRenderingContext2D, verdict: string, right: boolean, name: string, prompt: string, t: number): void {
  text(ctx, verdict, 640, 632, { size: 28, display: true, align: 'center', color: right ? COLORS.green : COLORS.red, shadow: true });
  text(ctx, name, 640, 668, { size: 20, type: true, align: 'center', color: COLORS.ink, maxWidth: 1000 });
  if (Math.sin(t * 5) > -0.3) text(ctx, prompt, 1240, 704, { size: 13, align: 'right', color: COLORS.dim });
}

/** Rec-room icon: a sergeant major's chevrons, bobbing, within ±40 px. */
export function drawRanksIcon(ctx: CanvasRenderingContext2D, t: number): void {
  drawInsignia(ctx, 'usa', 9, 0, Math.round(Math.sin(t * 2) * 2), 1.4);
}
