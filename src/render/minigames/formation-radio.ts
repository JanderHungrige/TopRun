import { clamp } from '../../core/math';
import { drawPortrait, type Mood } from '../portraits';
import { frameAround, pixelFrame, RADIO_BOX } from '../pixel/frame';
import { measure, text } from '../text';
import { typedLines } from '../typed-text';

// Formation Flying (doc 14): Duke's radio strip — his live pixel portrait as a radio feed and the typed line
// in the typewriter font with a block cursor (doc 20).

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
  frameAround(ctx, PORTRAIT, RADIO_BOX, 1);
  drawPortrait(ctx, 'wingman', PORTRAIT, { t: v.t, mouth: v.mouth, mood: v.mood, gesture: 'none', radio: true });
  pixelFrame(ctx, BUBBLE, RADIO_BOX, 1);
  text(ctx, v.label, BUBBLE.x + 14, BUBBLE.y + 19, { size: 12, type: true, weight: 700, color: '#7dffc8' });
  let size = 19;
  while (size > 12 && measure(ctx, v.full, size, false, true) > BUBBLE.w - 28) size--;
  typedLines(ctx, [v.full], v.shown.length, BUBBLE.x + 14, BUBBLE.y + 50, {
    size, color: '#c9ffe6', lineHeight: size, cursor: Math.floor(v.t * 3.4) % 2 === 0 ? '#7dffc8' : null,
  });
  ctx.restore();
}
