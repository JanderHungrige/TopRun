import type { AreaRect } from '../../data/base-areas';
import type { WallTilt } from '../../data/base-docks';

// Boards on a wall seen at an angle (doc 95): a board is drawn flat into a scratch canvas, then laid onto the picture's
// wall column by column, each column a little shorter towards the far edge — a wall keeps its vertical edges, so this is
// the wall's perspective without any 3-D. Shrunk evenly about the middle (doc 95), or towards the wall's vanishing point
// when the eye is not level with the board (doc 92 B1: both edges of the helicopter base's scoreboard fall to the right).

let flat: HTMLCanvasElement | null = null;

function scratchFor(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  flat ??= document.createElement('canvas');
  if (flat.width < w) flat.width = w;
  if (flat.height < h) flat.height = h;
  return flat.getContext('2d');
}

/** Top and height of column i (0 … r.w − 1) of a board in rect r, its left edge at full size. */
export function wallColumn(r: AreaRect, tilt: WallTilt | undefined, i: number): { y: number; h: number } {
  if (!tilt) return { y: r.y, h: r.h };
  if ('slant' in tilt) {
    const inset = tilt.slant * r.h * ((i + 0.5) / r.w);
    return { y: r.y + inset, h: r.h - 2 * inset };
  }
  const { x: vx, y: vy } = tilt.vanish;
  const k = (vx - (r.x + i + 0.5)) / (vx - r.x);
  return { y: vy + (r.y - vy) * k, h: r.h * k };
}

/** Draws `paint` into rect r on a wall seen at an angle (flat without a tilt). */
export function onWall(ctx: CanvasRenderingContext2D, r: AreaRect, tilt: WallTilt | undefined, paint: (g: CanvasRenderingContext2D, at: AreaRect) => void): void {
  const k = Math.max(1, Math.abs(ctx.getTransform().a));
  const g = tilt ? scratchFor(Math.ceil(r.w * k), Math.ceil(r.h * k)) : null;
  if (!tilt || !g || !flat) {
    paint(ctx, r);
    return;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, flat.width, flat.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  paint(g, { x: 0, y: 0, w: r.w, h: r.h });
  layColumns(ctx, flat, k, r, tilt);
}

/** One device pixel wide columns on whole device pixels: a column of a logical pixel on a canvas scaled below 1 would
 *  only half-cover its pixels and let the picture show through. */
function layColumns(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, k: number, r: AreaRect, tilt: WallTilt): void {
  const t = ctx.getTransform();
  const x0 = Math.round(t.a * r.x + t.e);
  const x1 = Math.round(t.a * (r.x + r.w) + t.e);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  for (let dx = x0; dx < x1; dx++) {
    const u = (dx + 0.5 - t.e) / t.a - r.x; // the logical column under this device column's centre
    const c = wallColumn(r, tilt, u - 0.5);
    const top = Math.round(t.d * c.y + t.f);
    const bottom = Math.round(t.d * (c.y + c.h) + t.f);
    const sx = Math.min(src.width - 1, Math.max(0, Math.floor(u * k)));
    if (bottom > top) ctx.drawImage(src, sx, 0, 1, r.h * k, dx, top, 1, bottom - top);
  }
  ctx.restore();
}
