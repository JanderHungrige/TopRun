import { drawFrontFigure, type PersonLook } from '../people';
import { frameAround, NAME_PLATE, PORTRAIT_FRAME, pixelFrame, pixelRect, RPG_BOX } from '../pixel/frame';
import { drawPortrait, type Mood } from '../portraits';
import { setFont, text, wrap } from '../text';
import { typedLines } from '../typed-text';

// Beach Volleyball (doc 21): banter in the retro RPG text box (doc 20) — Duke on the left with his pixel
// portrait, the rivals on the right with a pixel bust of their figure; name plate, typewriter text, cursor.

export type Speaker = 'duke' | 'breaker' | 'riptide';

export interface BoxView {
  speaker: Speaker;
  name: string;
  full: string;
  /** Characters typed so far. */
  shown: number;
  mouth: number;
  mood: Mood;
  look: PersonLook | null;
  alpha: number;
  t: number;
}

const LEFT = { x: 16, y: 64, w: 362, h: 82 } as const;
const RIGHT = { x: 902, y: 64, w: 362, h: 82 } as const;
const PW = 58;
const PH = 66;

function rivalBust(ctx: CanvasRenderingContext2D, look: PersonLook, r: { x: number; y: number; w: number; h: number }, mood: Mood, t: number, turn: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  pixelRect(ctx, r.x, r.y, r.w, r.h, '#f39a5c');
  pixelRect(ctx, r.x, r.y, r.w, r.h * 0.45, '#b23f63');
  pixelRect(ctx, r.x, r.y + r.h * 0.45, r.w, 4, '#d65561');
  const k = 0.82;
  ctx.translate(r.x + r.w / 2 + 4, r.y + r.h + 268 * k);
  ctx.scale(k, k);
  const blink = t % 3.6 < 0.13 ? 1 : 0;
  drawFrontFigure(ctx, look, { turn, raise: [0, 0], hands: 'open' }, { expression: mood === 'happy' ? 'grin' : 'calm', strain: 0, blink, t });
  ctx.restore();
}

export function drawBanterBox(ctx: CanvasRenderingContext2D, v: BoxView): void {
  if (v.alpha <= 0 || !v.full) return;
  const left = v.speaker === 'duke';
  const b = left ? LEFT : RIGHT;
  ctx.save();
  ctx.globalAlpha = v.alpha;
  pixelFrame(ctx, b, RPG_BOX, 2);
  const pr = { x: left ? b.x + 10 : b.x + b.w - 10 - PW, y: b.y + 8, w: PW, h: PH };
  if (left || !v.look) drawPortrait(ctx, 'wingman', pr, { t: v.t, mouth: v.mouth, mood: v.mood, gesture: 'none' });
  else rivalBust(ctx, v.look, pr, v.mood, v.t, v.speaker === 'breaker' ? -0.25 : -0.15);
  frameAround(ctx, pr, PORTRAIT_FRAME, 1);
  setFont(ctx, 11, false, 700, false, true);
  const plateW = ctx.measureText(v.name).width + 24;
  const plate = { x: left ? b.x + PW + 22 : b.x + b.w - PW - 22 - plateW, y: b.y - 11, w: plateW, h: 22 };
  pixelFrame(ctx, plate, NAME_PLATE, 2);
  text(ctx, v.name, plate.x + 12, plate.y + 15, { size: 11, type: true, weight: 700, color: '#ffd76a' });
  const tx = left ? b.x + PW + 26 : b.x + 16;
  const lines = wrap(ctx, v.full, b.w - PW - 46, 14, true).slice(0, 3);
  const typing = v.shown < v.full.length;
  typedLines(ctx, lines, v.shown, tx, b.y + 30, {
    size: 14, color: '#f3ead2', lineHeight: 18, cursor: typing || Math.floor(v.t * 2.5) % 2 === 0 ? '#ffd76a' : null,
  });
  ctx.restore();
}
