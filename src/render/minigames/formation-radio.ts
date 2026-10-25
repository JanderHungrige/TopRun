import { clamp } from '../../core/math';
import { drawPortrait, type Mood } from '../portraits';
import { measure, text } from '../text';

// Formation Flying (doc 14): Duke's radio strip — his live portrait as a radio feed and the typed line.

export interface RadioView {
  label: string;
  full: string;
  /** The part typed so far. */
  shown: string;
  /** Seconds since the line started and its total time on screen. */
  age: number;
  life: number;
  mouth: number;
  mood: Mood;
  t: number;
}

const BOX = { x: 16, y: 62, w: 600, h: 80 };
const PORTRAIT = { x: BOX.x, y: BOX.y, w: 66, h: 80 };
const BUBBLE = { x: BOX.x + 74, y: BOX.y + 6, w: BOX.w - 74, h: 68 };

export function drawRadio(ctx: CanvasRenderingContext2D, v: RadioView): void {
  const a = clamp(Math.min(v.age / 0.12, (v.life - v.age) / 0.3), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  drawPortrait(ctx, 'wingman', PORTRAIT, { t: v.t, mouth: v.mouth, mood: v.mood, gesture: 'none', radio: true });
  ctx.beginPath();
  ctx.roundRect(BUBBLE.x, BUBBLE.y, BUBBLE.w, BUBBLE.h, 6);
  ctx.fillStyle = 'rgba(6,22,18,0.88)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(120,255,200,0.6)';
  ctx.stroke();
  text(ctx, v.label, BUBBLE.x + 14, BUBBLE.y + 20, { size: 12, display: true, color: '#7dffc8', letterSpacing: 1 });
  let size = 19;
  while (size > 12 && measure(ctx, v.full, size) > BUBBLE.w - 28) size--;
  text(ctx, v.shown, BUBBLE.x + 14, BUBBLE.y + 50, { size, weight: 700, color: '#c9ffe6', maxWidth: BUBBLE.w - 28 });
  ctx.restore();
}
