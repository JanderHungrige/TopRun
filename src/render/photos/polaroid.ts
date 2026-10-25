import { POLAROID, type Box } from '../../game/photos';
import { brackets } from '../locker/rack';
import { pixelRect } from '../pixel/frame';
import { measure, text } from '../text';

// Picture wall (doc 32): a polaroid pinned to the cork — drop shadow, white frame, the photo (or the grey-teal of
// a photo still developing, fading in), a coloured push pin and the typewriter caption: mission number and name,
// the stars and the date. The selected one lifts a little and gets gold corner brackets.

const PAPER = '#f3efe4';
const PAPER_SHADE = '#d9d2c0';
const INK = '#2b2a33';
const STAR_ON = '#c8901a';
const STAR_OFF = '#b9b2a2';
export const UNDEVELOPED = '#3c4a48';
const PINS = ['#d8402e', '#f2c12e', '#3f78d8', '#49b06a', '#e27a30'] as const;

export interface PolaroidView {
  art: CanvasImageSource | null;
  /** 0 … 1: how far the photo has developed. */
  develop: number;
  caption: string;
  stars: number;
  date: string | null;
  number: number;
  selected: boolean;
  t: number;
  /** Logical px per art pixel of the room. */
  G: number;
}

/** Earned stars in gold, the rest hollow (of three). */
export function drawStars(ctx: CanvasRenderingContext2D, n: number, x: number, y: number, size: number, on = STAR_ON, off = STAR_OFF): void {
  const k = Math.max(0, Math.min(3, Math.round(n)));
  const lit = '★'.repeat(k);
  text(ctx, lit, x, y, { size, color: on });
  text(ctx, '☆'.repeat(3 - k), x + (k > 0 ? measure(ctx, lit, size) : 0), y, { size, color: off });
}

/** A push pin centred at (x, y). */
export function pin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, G: number): void {
  pixelRect(ctx, x - G, y + 2 * G, 3 * G, G, 'rgba(0,0,0,0.35)');
  pixelRect(ctx, x - 2 * G, y - G, 4 * G, 3 * G, color);
  pixelRect(ctx, x - G, y - 2 * G, 2 * G, 5 * G, color);
  pixelRect(ctx, x - G, y - G, G, G, '#ffffff');
}

/** The photo with its developing fade, at (x, y) and w × h logical px. */
export function drawPhoto(ctx: CanvasRenderingContext2D, art: CanvasImageSource | null, develop: number, x: number, y: number, w: number, h: number): void {
  pixelRect(ctx, x, y, w, h, UNDEVELOPED);
  if (!art || develop <= 0) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = Math.min(1, develop);
  ctx.drawImage(art, x, y, w, h);
  ctx.restore();
}

export function drawPolaroid(ctx: CanvasRenderingContext2D, box: Box, v: PolaroidView): void {
  const lift = v.selected ? 2 : 0;
  const x = box.x;
  const y = box.y - lift;
  pixelRect(ctx, x + 3 + lift, y + 4 + lift * 2, box.w, box.h, 'rgba(10,6,2,0.4)');
  pixelRect(ctx, x, y, box.w, box.h, PAPER);
  pixelRect(ctx, x, y + box.h - 2, box.w, 2, PAPER_SHADE);
  const b = POLAROID.border;
  drawPhoto(ctx, v.art, v.develop, x + b, y + b, POLAROID.photoW, POLAROID.photoH);
  const cy = y + b + POLAROID.photoH;
  text(ctx, v.caption, x + b + 1, cy + 15, { size: 13, weight: 700, type: true, color: INK, maxWidth: POLAROID.photoW - 2 });
  drawStars(ctx, v.stars, x + b + 1, cy + 30, 12);
  if (v.date) text(ctx, v.date, x + box.w - b - 1, cy + 29, { size: 11, weight: 700, type: true, align: 'right', color: INK });
  pin(ctx, x + box.w / 2, y + 2, PINS[v.number % PINS.length] ?? '#d8402e', v.G);
  if (v.selected) brackets(ctx, { x, y, w: box.w, h: box.h }, v.G, v.t);
}

/** The note pinned to an empty board. */
export function drawEmptyNote(ctx: CanvasRenderingContext2D, title: string, hint: readonly string[], G: number): void {
  const w = 460;
  const h = 70 + hint.length * 26;
  const x = 640 - w / 2;
  const y = 330 - h / 2;
  pixelRect(ctx, x + 4, y + 5, w, h, 'rgba(10,6,2,0.4)');
  pixelRect(ctx, x, y, w, h, '#f6eecb');
  for (let ly = y + 40; ly < y + h - 8; ly += 26) pixelRect(ctx, x + 16, ly + 8, w - 32, 1, '#c9d4e6');
  text(ctx, title, 640, y + 34, { size: 22, display: true, align: 'center', color: INK });
  hint.forEach((l, i) => text(ctx, l, x + 22, y + 66 + i * 26, { size: 17, type: true, color: INK }));
  pin(ctx, 640, y + 4, PINS[0], G);
}
