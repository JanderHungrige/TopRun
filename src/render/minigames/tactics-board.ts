import type { Vec } from '../../core/math';
import type { Alt, MoveId, Range } from '../../game/minigames/tactics-moves';
import { BOARD } from './tactics-room';
import { arrow, INK, jetGlyph, partial, ring, stroke, write, writtenWidth } from './tactics-marker';
import { altitudeMark, manoeuvrePath, SKETCH, type Pose } from './tactics-paths';

// Dogfight Tactics (doc 19): what the instructor has on the whiteboard — header, advantage meter, the plan-view
// sketch (jets, speed arrows, range, the drawn manoeuvres) and the notes column; stamps and the summary.

const METER = { x0: 84, x1: 870, y: 138 } as const;
const MID = (METER.x0 + METER.x1) / 2;
const NOTES_X = 664;

export interface MeterLabels { lose: string; def: string; neutral: string; off: string; win: string }

export function drawHeader(ctx: CanvasRenderingContext2D, left: string, right: string): void {
  write(ctx, left, BOARD.x + 26, BOARD.y + 36, { size: 22, maxWidth: 600 });
  write(ctx, right, BOARD.x + BOARD.w - 24, BOARD.y + 36, { size: 20, color: INK.red, align: 'right' });
}

const meterX = (v: number): number => MID + (Math.max(-10, Math.min(10, v)) / 10) * (METER.x1 - MID);

/** The advantage meter; `value` −10 … +10 (eased by the caller), `delta` the change written next to the magnet. */
export function drawMeter(ctx: CanvasRenderingContext2D, value: number, labels: MeterLabels, delta: { text: string; color: string; alpha: number } | null): void {
  const { x0, x1, y } = METER;
  stroke(ctx, [{ x: x0, y }, { x: x1, y }], INK.black, 4, 11);
  for (const v of [-4, 4]) stroke(ctx, [{ x: meterX(v), y: y - 10 }, { x: meterX(v), y: y + 10 }], INK.black, 3, v + 20);
  stroke(ctx, [{ x: MID, y: y - 6 }, { x: MID, y: y + 6 }], INK.black, 2, 5);
  stroke(ctx, [{ x: x0 - 8, y: y - 8 }, { x: x0 + 8, y: y + 8 }], INK.red, 4, 2);
  stroke(ctx, [{ x: x0 - 8, y: y + 8 }, { x: x0 + 8, y: y - 8 }], INK.red, 4, 3);
  ring(ctx, x1, y, 11, 11, INK.blue, 3, 9);
  stroke(ctx, [{ x: x1 - 16, y }, { x: x1 + 16, y }], INK.blue, 2, 4);
  stroke(ctx, [{ x: x1, y: y - 16 }, { x: x1, y: y + 16 }], INK.blue, 2, 6);
  const ly = y + 32;
  write(ctx, labels.lose, x0 - 10, ly, { size: 16, color: INK.red });
  write(ctx, labels.def, meterX(-4) - 10, ly, { size: 16, align: 'right', color: INK.black, alpha: 0.75 });
  write(ctx, labels.neutral, MID, ly, { size: 16, align: 'center', color: INK.black, alpha: 0.75 });
  write(ctx, labels.off, meterX(4) + 10, ly, { size: 16, color: INK.black, alpha: 0.75 });
  write(ctx, labels.win, x1 + 10, ly, { size: 16, color: INK.blue, align: 'right' });
  const mx = meterX(value);
  const zone = value >= 4 ? '#2f6fd6' : value <= -4 ? '#d4423a' : '#5b6470';
  ctx.beginPath();
  ctx.arc(mx + 2, y + 3, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = zone;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx - 4, y - 5, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  if (!delta || delta.alpha <= 0) return;
  const left = mx > MID + 200;
  const dx = left ? mx - 22 - writtenWidth(ctx, delta.text, 22) : mx + 22;
  ctx.fillStyle = 'rgba(251,252,250,0.9)';
  ctx.fillRect(dx - 4, y - 14, writtenWidth(ctx, delta.text, 22) + 8, 24);
  write(ctx, delta.text, dx, y + 8, { size: 22, color: delta.color, alpha: delta.alpha });
}

export interface SketchJet { pose: Pose; energy: number }
export interface SketchPaths { mine: MoveId; his: MoveId; you: Pose; him: Pose; pMine: number; pHis: number }
export interface SketchView {
  you: SketchJet;
  him: SketchJet;
  alt: Alt;
  range: Range;
  rangeLabel: string;
  labels: { you: string; bandit: string; high: string; low: string };
  paths: SketchPaths | null;
}

function speedArrow(ctx: CanvasRenderingContext2D, j: SketchJet, color: string, seed: number): void {
  const f = { x: Math.sin(j.pose.h), y: -Math.cos(j.pose.h) };
  const a = { x: j.pose.x + f.x * 26, y: j.pose.y + f.y * 26 };
  const len = 10 + j.energy * 9;
  const b = { x: a.x + f.x * len, y: a.y + f.y * len };
  arrow(ctx, [a, b], color, 1, 2.4, seed, [7, 6]);
  write(ctx, String(j.energy), b.x + f.x * 12, b.y + f.y * 12 + 6, { size: 16, align: 'center', color });
}

function rangeLine(ctx: CanvasRenderingContext2D, a: Pose, b: Pose, label: string): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  const up = dx >= 0 ? 1 : -1;
  const n = { x: (up * dy / d) * 34, y: (-up * dx / d) * 34 };
  const p = { x: a.x + n.x, y: a.y + n.y };
  const q = { x: b.x + n.x, y: b.y + n.y };
  stroke(ctx, [p, q], INK.black, 1.6, 17, [4, 5]);
  for (const e of [p, q]) stroke(ctx, [{ x: e.x - n.x * 0.25, y: e.y - n.y * 0.25 }, { x: e.x + n.x * 0.25, y: e.y + n.y * 0.25 }], INK.black, 1.6, 3);
  write(ctx, label, (p.x + q.x) / 2 + n.x * 0.6, (p.y + q.y) / 2 + n.y * 0.6 + 6, { size: 15, align: 'center', alpha: 0.8 });
}

function tag(ctx: CanvasRenderingContext2D, pose: Pose, text: string, color: string, dy: number): void {
  write(ctx, text, pose.x, pose.y + dy, { size: 15, align: 'center', color });
}

function drawPath(ctx: CanvasRenderingContext2D, move: MoveId, self: Pose, other: Pose, p: number, color: string, seed: number): void {
  if (p <= 0) return;
  const pts = manoeuvrePath(move, self, other);
  arrow(ctx, pts, color, p, 4, seed);
  const mark = altitudeMark(move);
  const apex: Vec | undefined = partial(pts, Math.min(p, 0.55)).pop();
  if (!mark || !apex || p < 0.55) return;
  const s = mark === 'up' ? -1 : 1;
  arrow(ctx, [{ x: apex.x + 16, y: apex.y - s * 12 }, { x: apex.x + 16, y: apex.y + s * 12 }], color, 1, 2.6, seed + 4);
}

/** The plan-view sketch of the engagement, clipped to the sketch area. */
export function drawSketch(ctx: CanvasRenderingContext2D, v: SketchView): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(SKETCH.x, SKETCH.y, SKETCH.w, SKETCH.h);
  ctx.clip();
  const you = v.paths ? v.paths.you : v.you.pose;
  const him = v.paths ? v.paths.him : v.him.pose;
  rangeLine(ctx, you, him, v.rangeLabel);
  if (!v.paths) {
    speedArrow(ctx, { ...v.you, pose: you }, INK.blue, 21);
    speedArrow(ctx, { ...v.him, pose: him }, INK.red, 22);
  }
  jetGlyph(ctx, him.x, him.y, him.h, INK.red, 1.5);
  jetGlyph(ctx, you.x, you.y, you.h, INK.blue, 1.5);
  tag(ctx, you, v.labels.you, INK.blue, 46);
  tag(ctx, him, v.labels.bandit, INK.red, 46);
  if (v.alt !== 0) {
    const top = v.alt > 0 ? you : him;
    const color = v.alt > 0 ? INK.blue : INK.red;
    tag(ctx, top, v.labels.high, color, -34);
    arrow(ctx, [{ x: top.x - 40, y: top.y - 30 }, { x: top.x - 40, y: top.y - 56 }], color, 1, 2.6, 33);
  }
  if (v.paths) {
    drawPath(ctx, v.paths.his, him, you, v.paths.pHis, INK.red, 41);
    drawPath(ctx, v.paths.mine, you, him, v.paths.pMine, INK.blue, 40);
  }
  ctx.restore();
}

export interface NoteLine { text: string; color: string; circled?: boolean }

/** The notes column right of the sketch. */
export function drawNotes(ctx: CanvasRenderingContext2D, lines: readonly NoteLine[], extra: NoteLine | null): void {
  stroke(ctx, [{ x: NOTES_X - 16, y: SKETCH.y + 8 }, { x: NOTES_X - 16, y: SKETCH.y + SKETCH.h - 10 }], INK.black, 2, 13);
  lines.forEach((l, i) => {
    const y = SKETCH.y + 34 + i * 38;
    const size = i === 0 ? 21 : 18;
    write(ctx, l.text, NOTES_X, y, { size, color: l.color, maxWidth: 246 });
    if (!l.circled) return;
    const w = Math.min(246, writtenWidth(ctx, l.text, size));
    ring(ctx, NOTES_X + w / 2, y - 7, w / 2 + 14, 19, l.color, 2.4, 5 + i);
  });
  if (extra) write(ctx, extra.text, NOTES_X, SKETCH.y + SKETCH.h - 18, { size: 19, color: extra.color, maxWidth: 246 });
}

/** A big circled stamp across the sketch (kill / shot down / separated / overshoot). */
export function drawStamp(ctx: CanvasRenderingContext2D, title: string, sub: string, color: string, age: number, y = SKETCH.cy): void {
  if (age <= 0) return;
  const k = age < 0.22 ? 1.5 - (age / 0.22) * 0.5 : 1;
  ctx.save();
  ctx.translate(SKETCH.cx, y);
  ctx.rotate(-0.08);
  ctx.scale(k, k);
  ctx.globalAlpha = Math.min(1, age * 6);
  ctx.fillStyle = 'rgba(251,252,250,0.86)';
  ctx.beginPath();
  ctx.ellipse(0, -6, 250, sub ? 62 : 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ring(ctx, 0, -6, 250, sub ? 62 : 44, color, 4, 12);
  write(ctx, title, 0, sub ? 0 : 6, { size: 40, align: 'center', color, maxWidth: 460 });
  if (sub) write(ctx, sub, 0, 38, { size: 22, align: 'center', color: INK.black, maxWidth: 440 });
  ctx.restore();
}

/** Everything on the board for one frame (kept as a snapshot while the eraser wipes it). */
export interface BoardSnap {
  header: readonly [string, string];
  meter: number;
  labels: MeterLabels;
  delta: { text: string; color: string; alpha: number } | null;
  sketch: SketchView;
  notes: readonly NoteLine[];
  extra: NoteLine | null;
  stamp: { title: string; sub: string; color: string; age: number } | null;
}

export function drawBoard(ctx: CanvasRenderingContext2D, b: BoardSnap, alpha = 1): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawHeader(ctx, b.header[0], b.header[1]);
  drawMeter(ctx, b.meter, b.labels, b.delta);
  drawSketch(ctx, b.sketch);
  drawNotes(ctx, b.notes, b.extra);
  if (b.stamp) drawStamp(ctx, b.stamp.title, b.stamp.sub, b.stamp.color, b.stamp.age);
  ctx.restore();
}

export interface SummaryRow { label: string; points: string; color: string }

/** End of the round: the eight results and the total. */
export function drawSummary(ctx: CanvasRenderingContext2D, title: string, rows: readonly SummaryRow[], total: string, age: number): void {
  write(ctx, title, BOARD.x + BOARD.w / 2, BOARD.y + 62, { size: 38, align: 'center', color: INK.black });
  rows.forEach((r, i) => {
    if (age < 0.2 + i * 0.18) return;
    const col = i < 4 ? 0 : 1;
    const x = BOARD.x + 90 + col * 420;
    const y = BOARD.y + 130 + (i % 4) * 54;
    write(ctx, `${i + 1}.  ${r.label}`, x, y, { size: 24, color: r.color, maxWidth: 270 });
    write(ctx, r.points, x + 340, y, { size: 24, align: 'right', color: r.color });
  });
  if (age < 0.4 + rows.length * 0.18) return;
  write(ctx, total, BOARD.x + BOARD.w / 2, BOARD.y + 372, { size: 34, align: 'center', color: INK.blue });
  ring(ctx, BOARD.x + BOARD.w / 2, BOARD.y + 360, 150, 32, INK.blue, 3, 21);
}
