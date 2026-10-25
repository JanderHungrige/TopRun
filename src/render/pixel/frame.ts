import type { Rect } from './blit';

// Pixel pipeline (doc 20): crisp UI chrome for the retro text boxes — bevelled pixel frames, name plates,
// block cursors and the "more" arrow. Every edge is snapped to whole device pixels and the border "pixel" is a
// whole number of device pixels, so the frame looks like pixel art at any window size.

export interface FrameStyle {
  outline: string;
  light: string;
  shadow: string;
  inner: string;
  fill: string;
}

/** Dark RPG text box: navy fill, steel-blue bevel (light top-left, dark bottom-right). */
export const RPG_BOX: FrameStyle = { outline: '#06080f', light: '#dfe7f5', shadow: '#5d6c8e', inner: '#06080f', fill: '#141b33' };
/** Gold name plate on the box's top edge. */
export const NAME_PLATE: FrameStyle = { outline: '#06080f', light: '#fff0b0', shadow: '#a87818', inner: '#3a2608', fill: '#24180a' };
/** Portrait frame (same bevel as the box, the portrait fills the hole). */
export const PORTRAIT_FRAME: FrameStyle = RPG_BOX;
/** Green radio-feed chrome. */
export const RADIO_BOX: FrameStyle = { outline: '#020a07', light: '#7fe8b4', shadow: '#1f6e4e', inner: '#020a07', fill: 'rgba(4,22,15,0.9)' };

interface Grid { x: (v: number) => number; y: (v: number) => number; u: number }

/** Device-pixel snapping for the current transform; `u` logical units rounded to whole device pixels. */
function grid(ctx: CanvasRenderingContext2D, u: number): Grid {
  const m = ctx.getTransform();
  const sx = m.a || 1;
  const sy = m.d || 1;
  return {
    x: (v) => (Math.round(sx * v + m.e) - m.e) / sx,
    y: (v) => (Math.round(sy * v + m.f) - m.f) / sy,
    u: Math.max(1, Math.round(u * sx)) / sx,
  };
}

/** Snapped rectangle fill. */
export function pixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  const g = grid(ctx, 1);
  const x0 = g.x(x);
  const y0 = g.y(y);
  ctx.fillStyle = color;
  ctx.fillRect(x0, y0, g.x(x + w) - x0, g.y(y + h) - y0);
}

/**
 * A bevelled pixel frame filling `b`: notched outline, light/dark bevel, inner line, fill. `u` is one border
 * pixel in logical units. `hollow` leaves the inside untouched (a frame around a portrait, drawn outside it).
 */
export function pixelFrame(ctx: CanvasRenderingContext2D, b: Rect, st: FrameStyle, u = 2, hollow = false): void {
  const g = grid(ctx, u);
  const p = g.u;
  const x = g.x(b.x);
  const y = g.y(b.y);
  const w = g.x(b.x + b.w) - x;
  const h = g.y(b.y + b.h) - y;
  ctx.save();
  if (hollow) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.rect(x + 3 * p, y + 3 * p, w - 6 * p, h - 6 * p);
    ctx.clip('evenodd');
  }
  ctx.fillStyle = st.outline;
  ctx.fillRect(x + p, y, w - 2 * p, h);
  ctx.fillRect(x, y + p, w, h - 2 * p);
  ctx.fillStyle = st.shadow;
  ctx.fillRect(x + p, y + p, w - 2 * p, h - 2 * p);
  ctx.fillStyle = st.light;
  ctx.fillRect(x + p, y + p, w - 3 * p, p);
  ctx.fillRect(x + p, y + p, p, h - 3 * p);
  ctx.fillStyle = st.inner;
  ctx.fillRect(x + 2 * p, y + 2 * p, w - 4 * p, h - 4 * p);
  if (!hollow) {
    ctx.fillStyle = st.fill;
    ctx.fillRect(x + 3 * p, y + 3 * p, w - 6 * p, h - 6 * p);
  }
  ctx.restore();
}

/** A frame drawn around (outside) a box, `u` border pixels thick on each side (3 layers). */
export function frameAround(ctx: CanvasRenderingContext2D, b: Rect, st: FrameStyle, u = 2): void {
  const d = 3 * u;
  pixelFrame(ctx, { x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d }, st, u, true);
}

/** The "more to come" arrow: a small pixel triangle pointing down, bobbing by one pixel. */
export function moreArrow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, t: number, u = 2): void {
  const g = grid(ctx, u);
  const p = g.u;
  const bob = Math.floor(t * 3) % 2 === 0 ? 0 : p;
  ctx.fillStyle = color;
  const x0 = g.x(x) - 2 * p;
  for (let i = 0; i < 3; i++) ctx.fillRect(x0 + i * p, g.y(y) + bob + i * p, (5 - 2 * i) * p, p);
}
