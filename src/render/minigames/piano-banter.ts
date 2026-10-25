import { clamp } from '../../core/math';
import { frameAround, NAME_PLATE, pixelFrame, PORTRAIT_FRAME, RPG_BOX } from '../pixel/frame';
import { drawPortrait, type CharacterId, type Mood } from '../portraits';
import { measure, setFont, text, wrap } from '../text';
import { typedLines } from '../typed-text';

// Piano Bar (doc 23): the banter line in the retro RPG text box (doc 20) — the speaker's framed pixel portrait,
// a gold name plate, the line typed out in the typewriter font with a blinking block cursor.

export interface BanterView {
  speaker: CharacterId;
  name: string;
  full: string;
  /** Characters typed so far. */
  shown: number;
  age: number;
  life: number;
  mouth: number;
  mood: Mood;
  t: number;
}

const PORTRAIT = { x: 22, y: 70, w: 84, h: 100 };
const BOX = { x: 122, y: 84, w: 630, h: 82 };
const PAD = 18;

function plate(ctx: CanvasRenderingContext2D, name: string): void {
  ctx.save();
  setFont(ctx, 13, false, 700, false, true);
  const w = ctx.measureText(name).width;
  ctx.restore();
  const p = { x: BOX.x + 12, y: BOX.y - 12, w: w + 32, h: 24 };
  pixelFrame(ctx, p, NAME_PLATE, 2);
  text(ctx, name, p.x + 16, p.y + 16.5, { size: 13, type: true, weight: 700, color: '#ffd76a' });
}

export function drawBanter(ctx: CanvasRenderingContext2D, v: BanterView): void {
  const a = clamp(Math.min(v.age / 0.15, (v.life - v.age) / 0.35), 0, 1);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  frameAround(ctx, PORTRAIT, PORTRAIT_FRAME, 2);
  drawPortrait(ctx, v.speaker, PORTRAIT, { t: v.t, mouth: v.mouth, mood: v.mood, gesture: 'none' });
  pixelFrame(ctx, BOX, RPG_BOX, 2);
  plate(ctx, v.name);
  let size = 18;
  let lines = wrap(ctx, v.full, BOX.w - PAD * 2, size, true);
  while (size > 12 && (lines.length > 2 || lines.some((l) => measure(ctx, l, size, false, true) > BOX.w - PAD * 2))) {
    size -= 1;
    lines = wrap(ctx, v.full, BOX.w - PAD * 2, size, true);
  }
  const lh = Math.round(size * 1.3);
  const top = BOX.y + BOX.h / 2 - ((lines.length - 1) * lh) / 2 + size * 0.36;
  typedLines(ctx, lines, v.shown, BOX.x + PAD, top, {
    size, color: '#f3ead2', lineHeight: lh, cursor: Math.floor(v.t * 3.4) % 2 === 0 ? '#ffd76a' : null,
  });
  ctx.restore();
}
