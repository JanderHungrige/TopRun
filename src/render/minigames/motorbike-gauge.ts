import { clamp, TAU } from '../../core/math';
import { SHIFT } from '../../game/minigames/motorbike-bike';
import { COLORS, text } from '../text';

// Motorbike vs. Jet (doc 22): the tachometer, bottom left — early (amber), green (perfect shift) and red bands,
// the needle, the gear digit, km/h and the shift light.

export interface TachView {
  rpm: number;
  gear: number;
  kmh: number;
  /** Top gear: no shift light. */
  top: boolean;
  limiter: boolean;
  gearLabel: string;
  kmhLabel: string;
  shiftLabel: string;
  /** 0 … 1 flash after a shift (green = perfect). */
  flash: number;
  flashGood: boolean;
  t: number;
}

const CX = 104;
const CY = 632;
const R = 78;
/** The needle sweeps from A0 (rpm 0) clockwise through SWEEP. */
const A0 = Math.PI * 0.8;
const SWEEP = Math.PI * 1.35;
const angleOf = (rpm: number): number => A0 + SWEEP * clamp(rpm, 0, 1.04);

function band(ctx: CanvasRenderingContext2D, from: number, to: number, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(CX, CY, R - 12, angleOf(from), angleOf(to));
  ctx.stroke();
}

function dial(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(6,8,14,0.88)';
  ctx.beginPath();
  ctx.arc(CX, CY, R + 6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5d6c8e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(CX, CY, R + 4, 0, TAU);
  ctx.stroke();
  band(ctx, SHIFT.ignore, SHIFT.green, 'rgba(255,157,46,0.55)', 9);
  band(ctx, SHIFT.green, SHIFT.late, '#3fe07a', 11);
  band(ctx, SHIFT.late, 1.04, '#ff4f4f', 9);
  ctx.strokeStyle = '#c9d4e4';
  for (let i = 0; i <= 14; i++) {
    const a = angleOf(i / 14);
    const long = i % 2 === 0;
    ctx.lineWidth = long ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(CX + Math.cos(a) * (R - 2), CY + Math.sin(a) * (R - 2));
    ctx.lineTo(CX + Math.cos(a) * (R - (long ? 18 : 10)), CY + Math.sin(a) * (R - (long ? 18 : 10)));
    ctx.stroke();
    if (long) {
      text(ctx, String(i), CX + Math.cos(a) * (R - 28), CY + Math.sin(a) * (R - 28) + 4, { size: 11, align: 'center', color: '#8fa0b8', weight: 700 });
    }
  }
}

function needle(ctx: CanvasRenderingContext2D, v: TachView): void {
  const jitter = v.limiter ? Math.sin(v.t * 90) * 0.03 : 0;
  const a = angleOf(v.rpm) + jitter;
  ctx.strokeStyle = '#ff8a3a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = '#ff8a3a';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(CX - Math.cos(a) * 10, CY - Math.sin(a) * 10);
  ctx.lineTo(CX + Math.cos(a) * (R - 8), CY + Math.sin(a) * (R - 8));
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2a2f3c';
  ctx.beginPath();
  ctx.arc(CX, CY, 7, 0, TAU);
  ctx.fill();
}

/** Shift lamp in the dial face: green in the perfect band (with SHIFT!), blinking red on the limiter. */
function shiftLight(ctx: CanvasRenderingContext2D, v: TachView): void {
  const green = !v.top && v.rpm >= SHIFT.green && v.rpm <= SHIFT.late;
  const red = !v.top && (v.limiter || v.rpm > SHIFT.late);
  const blink = Math.floor(v.t * 10) % 2 === 0;
  const color = green ? '#5bff8f' : red && blink ? '#ff4f4f' : '#2a303c';
  ctx.fillStyle = color;
  if (green || red) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  ctx.beginPath();
  ctx.arc(CX, CY - 30, 7, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (green) text(ctx, v.shiftLabel, CX, CY - 8, { size: 15, display: true, italic: true, align: 'center', color: '#5bff8f', maxWidth: 96 });
}

export function drawTach(ctx: CanvasRenderingContext2D, v: TachView): void {
  ctx.save();
  dial(ctx);
  if (v.flash > 0) {
    ctx.strokeStyle = v.flashGood ? `rgba(91,255,143,${v.flash.toFixed(3)})` : `rgba(255,157,46,${v.flash.toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CX, CY, R + 10, 0, TAU);
    ctx.stroke();
  }
  needle(ctx, v);
  text(ctx, String(v.gear), CX, CY + 42, { size: 36, display: true, align: 'center', color: COLORS.ink });
  text(ctx, v.gearLabel, CX, CY + 56, { size: 10, align: 'center', color: COLORS.dim, letterSpacing: 2 });
  text(ctx, String(Math.round(v.kmh)), CX + 22, CY - R - 16, { size: 30, display: true, align: 'right', color: COLORS.ink, stroke: '#06080e', strokeWidth: 5 });
  text(ctx, v.kmhLabel, CX + 28, CY - R - 16, { size: 13, align: 'left', color: COLORS.dim, stroke: '#06080e', strokeWidth: 3, weight: 800 });
  shiftLight(ctx, v);
  ctx.restore();
}
