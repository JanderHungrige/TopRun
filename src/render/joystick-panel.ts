import type { PadFrame } from '../game/joystick';
import { COLORS, text } from './text';

// JOYSTICK setup screen pieces (doc 01): the step checklist and the live controller monitor.

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChecklistRow {
  label: string;
  value: string;
  state: 'done' | 'current' | 'todo';
}

const ROW_H = 46;
const MAX_AXES = 8;
const MAX_BUTTONS = 24;

function marker(ctx: CanvasRenderingContext2D, state: ChecklistRow['state'], x: number, y: number): void {
  ctx.lineWidth = 3;
  if (state === 'done') {
    ctx.strokeStyle = COLORS.green;
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x - 2, y + 6);
    ctx.lineTo(x + 8, y - 7);
    ctx.stroke();
  } else if (state === 'current') {
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 8);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x - 6, y + 8);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = COLORS.faint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawChecklist(ctx: CanvasRenderingContext2D, box: Box, rows: readonly ChecklistRow[], time: number): void {
  rows.forEach((r, i) => {
    const y = box.y + i * ROW_H;
    if (r.state === 'current') {
      ctx.fillStyle = `rgba(255,200,61,${0.12 + Math.sin(time * 5) * 0.05})`;
      ctx.beginPath();
      ctx.roundRect(box.x, y, box.w, ROW_H - 6, 8);
      ctx.fill();
    }
    const mid = y + (ROW_H - 6) / 2;
    marker(ctx, r.state, box.x + 20, mid);
    const color = r.state === 'current' ? COLORS.gold : r.state === 'done' ? COLORS.ink : COLORS.dim;
    text(ctx, r.label, box.x + 42, mid + 6, { size: 16, color, maxWidth: box.w * 0.5 });
    text(ctx, r.value, box.x + box.w - 12, mid + 5, { size: 13, align: 'right', color: COLORS.cyan, maxWidth: box.w * 0.42 });
  });
}

function axisBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, v: number): void {
  const c = x + w / 2;
  const clamped = Math.max(-1, Math.min(1, v));
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(x, y, w, 10);
  ctx.fillStyle = Math.abs(clamped) > 0.6 ? COLORS.gold : COLORS.cyan;
  ctx.fillRect(Math.min(c, c + (clamped * w) / 2), y, Math.abs(clamped * w) / 2, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(c - 1, y - 2, 2, 14);
}

function lamp(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, on: boolean): void {
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fillStyle = on ? COLORS.gold : 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = on ? '#fff3c4' : 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, String(n), x, y + 4, { size: 10, align: 'center', color: on ? '#1a1206' : COLORS.dim });
}

function drawPad(ctx: CanvasRenderingContext2D, f: PadFrame, x: number, y: number, w: number): void {
  text(ctx, f.id, x, y + 14, { size: 13, color: COLORS.ink, maxWidth: w });
  const axes = f.axes.slice(0, MAX_AXES);
  const cell = w / MAX_AXES;
  axes.forEach((v, i) => {
    const cx = x + i * cell;
    text(ctx, String(i + 1), cx, y + 41, { size: 11, color: COLORS.dim });
    axisBar(ctx, cx + 14, y + 32, cell - 24, v);
  });
  const step = Math.min(28, w / MAX_BUTTONS);
  f.buttons.slice(0, MAX_BUTTONS).forEach((on, i) => lamp(ctx, x + 11 + i * step, y + 72, i + 1, on));
}

/** Every connected controller with live axis bars and button lamps (up to two shown). */
export function drawPadMonitor(ctx: CanvasRenderingContext2D, box: Box, frames: readonly PadFrame[]): void {
  frames.slice(0, 2).forEach((f, i) => drawPad(ctx, f, box.x, box.y + i * (box.h / 2), box.w));
}
