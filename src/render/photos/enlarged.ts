import { pixelFrame, pixelRect, RPG_BOX } from '../pixel/frame';
import { CREAM, LILAC } from '../rooms-chrome';
import { setFont, text } from '../text';
import { PHOTO_H, PHOTO_W } from './art';
import { drawPhoto, drawStars, pin } from './polaroid';

// Picture wall (doc 32): the enlarged photo — the wall dims, the polaroid shows at 3× (the same art, three logical
// px per art pixel) with its caption, and beside it a card with the mission, theater, stars, date, jet and paint job.

const SCALE = 3;
const BORDER = 24;
export const BIG = { x: 40, y: 92, w: PHOTO_W * SCALE + 2 * BORDER, h: PHOTO_H * SCALE + BORDER + 84 } as const;
const CARD = { x: 712, y: 92, w: 520, h: BIG.h } as const;

export interface EnlargedView {
  art: CanvasImageSource | null;
  develop: number;
  caption: string;
  stars: number;
  date: string;
  /** "MISSION 7" */
  missionLabel: string;
  missionName: string;
  rows: readonly (readonly [string, string])[];
  starsLabel: string;
  G: number;
}

function nameSize(ctx: CanvasRenderingContext2D, s: string, max: number): number {
  ctx.save();
  let size = 34;
  for (; size > 18; size -= 2) {
    setFont(ctx, size, true);
    if (ctx.measureText(s).width <= max) break;
  }
  ctx.restore();
  return size;
}

function polaroid(ctx: CanvasRenderingContext2D, v: EnlargedView): void {
  pixelRect(ctx, BIG.x + 6, BIG.y + 8, BIG.w, BIG.h, 'rgba(0,0,0,0.5)');
  pixelRect(ctx, BIG.x, BIG.y, BIG.w, BIG.h, '#f3efe4');
  pixelRect(ctx, BIG.x, BIG.y + BIG.h - 3, BIG.w, 3, '#d9d2c0');
  drawPhoto(ctx, v.art, v.develop, BIG.x + BORDER, BIG.y + BORDER, PHOTO_W * SCALE, PHOTO_H * SCALE);
  const cy = BIG.y + BORDER + PHOTO_H * SCALE;
  text(ctx, v.caption, BIG.x + BORDER + 2, cy + 36, { size: 26, weight: 700, type: true, color: '#2b2a33', maxWidth: PHOTO_W * SCALE - 4 });
  drawStars(ctx, v.stars, BIG.x + BORDER + 2, cy + 68, 22);
  text(ctx, v.date, BIG.x + BIG.w - BORDER - 2, cy + 66, { size: 20, weight: 700, type: true, align: 'right', color: '#2b2a33' });
  pin(ctx, BIG.x + BIG.w / 2, BIG.y + 4, '#d8402e', v.G * 2);
}

function card(ctx: CanvasRenderingContext2D, v: EnlargedView): void {
  pixelFrame(ctx, CARD, RPG_BOX, 2);
  const x = CARD.x + 28;
  const w = CARD.w - 56;
  text(ctx, v.missionLabel, x, CARD.y + 48, { size: 14, weight: 800, color: LILAC, letterSpacing: 3 });
  const name = v.missionName.toUpperCase();
  text(ctx, name, x, CARD.y + 90, { size: nameSize(ctx, name, w), display: true, color: '#ffc83d', stroke: '#1a0e04', strokeWidth: 5 });
  pixelRect(ctx, x, CARD.y + 110, w, 2, '#3a4466');
  let y = CARD.y + 148;
  text(ctx, v.starsLabel, x, y, { size: 12, weight: 800, color: LILAC, letterSpacing: 2 });
  drawStars(ctx, v.stars, x, y + 30, 26, '#ffd76a', '#5d6c8e');
  y += 66;
  for (const [label, value] of v.rows) {
    text(ctx, label, x, y, { size: 12, weight: 800, color: LILAC, letterSpacing: 2 });
    text(ctx, value, x, y + 26, { size: 20, weight: 700, type: true, color: CREAM, maxWidth: w });
    y += 62;
  }
}

/** The dimmed wall with the enlarged photo and its card. */
export function drawEnlarged(ctx: CanvasRenderingContext2D, v: EnlargedView): void {
  ctx.fillStyle = 'rgba(6,8,16,0.84)';
  ctx.fillRect(0, 0, 1280, 720);
  polaroid(ctx, v);
  card(ctx, v);
}
