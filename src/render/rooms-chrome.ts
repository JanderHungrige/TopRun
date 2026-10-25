import { t } from '../i18n/i18n';
import { deviceScale } from './pixel/blit';
import { NAME_PLATE, pixelFrame, RPG_BOX, type FrameStyle } from './pixel/frame';
import { text } from './text';

// Home base rooms (docs 31, 32): the shared chrome of the locker and the picture wall — the rooms' 2-logical-px
// art grid, the room title, a counter, the input hint line and a retro pixel button (BACK, page arrows) that
// mouse and touch can use.

export interface Rect { x: number; y: number; w: number; h: number }

/** A room's art grid: D device px and G logical px per art pixel (≈ 2 logical px), W × H art px for 1280 × 720. */
export interface Grid { D: number; G: number; W: number; H: number }

export function roomGrid(ctx: CanvasRenderingContext2D): Grid {
  const s = deviceScale(ctx);
  const D = Math.max(1, Math.round(2 * s));
  const G = D / s;
  return { D, G, W: Math.ceil(1280 / G), H: Math.ceil(720 / G) };
}

/** Draws a full-screen art canvas at the grid, snapped to device pixels. */
export function blitLayer(ctx: CanvasRenderingContext2D, art: CanvasImageSource, g: Grid): void {
  const m = ctx.getTransform();
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, m.a ? -m.e / m.a + Math.round(m.e) / m.a : 0, m.d ? -m.f / m.d + Math.round(m.f) / m.d : 0, g.W * g.G, g.H * g.G);
  ctx.restore();
}

export const BACK_BTN: Rect = { x: 1112, y: 672, w: 136, h: 40 };
export const GOLD = '#ffd76a';
export const LILAC = '#c9b8e8';
export const CREAM = '#f3ead2';

const HOVER: FrameStyle = { ...NAME_PLATE, fill: '#3a2608' };

/** The room's title (display font, gold) and a counter on the right. */
export function roomHeader(ctx: CanvasRenderingContext2D, title: string, x: number, right: string, rightX: number): void {
  text(ctx, title, x, 52, { size: 32, display: true, italic: true, color: '#ffc83d', stroke: '#0a0710', strokeWidth: 6 });
  text(ctx, right, rightX, 48, { size: 15, weight: 800, align: 'right', color: LILAC, letterSpacing: 2, stroke: '#0a0710', strokeWidth: 4 });
}

/** A pixel button; `hot` = focused or hovered. */
export function pixelButton(ctx: CanvasRenderingContext2D, r: Rect, label: string, hot: boolean, hint?: string): void {
  pixelFrame(ctx, r, hot ? HOVER : RPG_BOX, 2);
  text(ctx, label, r.x + r.w / 2 - (hint ? 10 : 0), r.y + r.h / 2 + 1, {
    size: 15, display: true, align: 'center', baseline: 'middle', color: hot ? GOLD : '#e9eff5', maxWidth: r.w - (hint ? 44 : 16),
  });
  if (hint) text(ctx, hint, r.x + r.w - 12, r.y + r.h / 2 + 1, { size: 9, weight: 800, align: 'right', baseline: 'middle', color: '#8f86a8' });
}

/** The BACK button bottom right. */
export function backButton(ctx: CanvasRenderingContext2D, hot: boolean): void {
  pixelButton(ctx, BACK_BTN, t('rooms.back'), hot, 'ESC');
}

/** One line of input hints at the bottom left of the right column. */
export function hintLine(ctx: CanvasRenderingContext2D, s: string, x: number, maxWidth: number): void {
  text(ctx, s, x, 697, { size: 12, weight: 700, color: '#9aa3c8', letterSpacing: 1, maxWidth, stroke: '#0a0710', strokeWidth: 3 });
}

export const inRect = (p: { x: number; y: number }, r: Rect): boolean => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
