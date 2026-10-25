import type { Result } from '../../game/minigames/piano';
import type { Beat, ChartNote } from '../../game/minigames/piano-chart';
import { roundRect } from '../shapes';
import { text } from '../text';

// Piano Bar (doc 23): the note highway — a black-lacquer board with four lanes, beat lines (bar lines
// brighter), notes falling onto a row of ivory keys, chords joined by a bar, glissandi as wide gold notes with
// a sparkle trail; keys depress when pressed, glow on a hit, flash red on a wrong key.

export const HWY = { x: 800, lane: 110, top: 96, hit: 604 } as const;
export const LANE_COLORS = ['#ff5d5d', '#ffc83d', '#5be37d', '#5fd4ff'] as const;
/** Scroll speed, px per second of song time. */
export const SPEED = 380;
const BOARD = { x: 792, y: 60, w: 456, h: 656 };
const AHEAD = (HWY.hit - HWY.top + 24) / SPEED;
const BEHIND = (BOARD.y + BOARD.h - HWY.hit) / SPEED;

export const laneX = (lane: number): number => HWY.x + lane * HWY.lane + HWY.lane / 2;
const yOf = (t: number, now: number): number => HWY.hit - (t - now) * SPEED;

export interface HighwayView {
  time: number;
  notes: readonly ChartNote[];
  results: readonly (Result | null)[];
  first: number;
  beats: readonly Beat[];
  /** Per lane 0 … 1: key held down / hit glow / wrong-key flash. */
  press: readonly number[];
  glow: readonly number[];
  wrong: readonly number[];
  labels: readonly string[];
  sub: readonly string[];
  t: number;
}

function board(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createLinearGradient(0, BOARD.y, 0, BOARD.y + BOARD.h);
  g.addColorStop(0, 'rgba(10,8,12,0.92)');
  g.addColorStop(1, 'rgba(22,16,24,0.97)');
  ctx.fillStyle = g;
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#b8903a';
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const x = HWY.x + i * HWY.lane;
    const lg = ctx.createLinearGradient(0, HWY.top, 0, HWY.hit);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(1, `${LANE_COLORS[i] ?? '#fff'}1f`);
    ctx.fillStyle = lg;
    ctx.fillRect(x + 2, HWY.top, HWY.lane - 4, HWY.hit - HWY.top);
    if (i > 0) {
      ctx.fillStyle = 'rgba(216,176,74,0.22)';
      ctx.fillRect(x - 0.5, HWY.top, 1, BOARD.y + BOARD.h - 12 - HWY.top);
    }
  }
}

function beatLines(ctx: CanvasRenderingContext2D, v: HighwayView): void {
  for (const b of v.beats) {
    if (b.t < v.time - 0.05 || b.t > v.time + AHEAD) continue;
    const y = yOf(b.t, v.time);
    if (y < HWY.top) continue;
    ctx.fillStyle = b.bar ? 'rgba(255,220,160,0.28)' : 'rgba(255,220,160,0.1)';
    ctx.fillRect(HWY.x, y - (b.bar ? 1 : 0.5), HWY.lane * 4, b.bar ? 2 : 1);
  }
}

function cap(ctx: CanvasRenderingContext2D, n: ChartNote, y: number, missed: boolean, t: number): void {
  const w = n.gliss ? HWY.lane - 10 : HWY.lane - 22;
  const h = n.gliss ? 26 : 22;
  const x = laneX(n.lane) - w / 2;
  const fade = Math.min(1, (y - HWY.top + 6) / 40) * (missed ? 0.45 : 1);
  if (fade <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  if (n.gliss && !missed) {
    const tail = ctx.createLinearGradient(0, y - 70, 0, y);
    tail.addColorStop(0, 'rgba(255,214,110,0)');
    tail.addColorStop(1, 'rgba(255,214,110,0.55)');
    ctx.fillStyle = tail;
    ctx.fillRect(x + 10, y - 70, w - 20, 70);
    for (let k = 0; k < 4; k++) {
      const sy = y - 12 - ((t * 90 + k * 17) % 60);
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(x + 14 + ((k * 29) % (w - 28)), sy, 2, 2);
    }
  }
  const color = missed ? '#5a5560' : n.gliss ? '#ffd76a' : (LANE_COLORS[n.lane] ?? '#fff');
  roundRect(ctx, x, y - h / 2, w, h, 7);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(x + 6, y - h / 2 + 3, w - 12, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 6, y + h / 2 - 6, w - 12, 3);
  ctx.restore();
}

function chordBar(ctx: CanvasRenderingContext2D, a: ChartNote, b: ChartNote, y: number): void {
  ctx.fillStyle = 'rgba(255,240,210,0.5)';
  ctx.fillRect(laneX(a.lane), y - 2, laneX(b.lane) - laneX(a.lane), 4);
}

function notes(ctx: CanvasRenderingContext2D, v: HighwayView): void {
  const from = Math.max(0, v.first - 24);
  const open = (i: number): boolean => v.results[i] === null || v.results[i] === 'miss';
  for (let i = from; i < v.notes.length; i++) {
    const n = v.notes[i];
    const m = v.notes[i + 1];
    if (!n || n.t > v.time + AHEAD) break;
    if (n.t < v.time - BEHIND || !open(i) || !m || m.t !== n.t || !open(i + 1)) continue;
    chordBar(ctx, n, m, yOf(n.t, v.time));
  }
  for (let i = from; i < v.notes.length; i++) {
    const n = v.notes[i];
    if (!n || n.t > v.time + AHEAD) break;
    if (n.t < v.time - BEHIND || !open(i)) continue;
    cap(ctx, n, yOf(n.t, v.time), v.results[i] === 'miss', v.t);
  }
}

function keysRow(ctx: CanvasRenderingContext2D, v: HighwayView): void {
  const glowLine = ctx.createLinearGradient(0, HWY.hit - 3, 0, HWY.hit + 3);
  glowLine.addColorStop(0, 'rgba(255,214,110,0)');
  glowLine.addColorStop(0.5, 'rgba(255,214,110,0.8)');
  glowLine.addColorStop(1, 'rgba(255,214,110,0)');
  ctx.fillStyle = glowLine;
  ctx.fillRect(HWY.x, HWY.hit - 3, HWY.lane * 4, 6);
  for (let i = 0; i < 4; i++) {
    const x = HWY.x + i * HWY.lane + 8;
    const w = HWY.lane - 16;
    const down = (v.press[i] ?? 0) * 4;
    const y = HWY.hit - 17 + down;
    ctx.fillStyle = '#05040a';
    roundRect(ctx, x - 2, HWY.hit - 19, w + 4, 42, 7);
    ctx.fill();
    const ivory = ctx.createLinearGradient(0, y, 0, y + 34);
    ivory.addColorStop(0, '#fffaf0');
    ivory.addColorStop(1, '#d9ccb0');
    ctx.fillStyle = ivory;
    roundRect(ctx, x, y, w, 34, 6);
    ctx.fill();
    const lit = Math.max(v.glow[i] ?? 0, (v.press[i] ?? 0) * 0.35);
    if (lit > 0.02) {
      ctx.globalAlpha = lit * 0.75;
      ctx.fillStyle = LANE_COLORS[i] ?? '#fff';
      roundRect(ctx, x, y, w, 34, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const bad = v.wrong[i] ?? 0;
    if (bad > 0.02) {
      ctx.globalAlpha = bad * 0.8;
      ctx.fillStyle = '#ff2a2a';
      roundRect(ctx, x, y, w, 34, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = LANE_COLORS[i] ?? '#fff';
    ctx.fillRect(x + 10, y + 27, w - 20, 3);
    const cx = x + w / 2;
    text(ctx, v.labels[i] ?? '', cx, HWY.hit + 52, { size: 24, weight: 800, align: 'center', color: LANE_COLORS[i] ?? '#fff' });
    text(ctx, v.sub[i] ?? '', cx, HWY.hit + 74, { size: 13, weight: 700, align: 'center', color: 'rgba(233,239,245,0.55)' });
  }
}

export function drawHighway(ctx: CanvasRenderingContext2D, v: HighwayView): void {
  board(ctx);
  beatLines(ctx, v);
  keysRow(ctx, v);
  ctx.save();
  ctx.beginPath();
  ctx.rect(BOARD.x, HWY.top, BOARD.w, BOARD.y + BOARD.h - HWY.top - 4);
  ctx.clip();
  notes(ctx, v);
  ctx.restore();
}
