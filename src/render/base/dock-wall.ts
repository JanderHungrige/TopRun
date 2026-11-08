import type { AreaRect } from '../../data/base-areas';

// Boards on a wall seen at an angle (doc 95): a board is drawn flat into a scratch canvas, then laid onto the picture's
// wall column by column, each column a little shorter towards the far edge — at eye level a wall keeps its vertical
// edges, so this is the wall's perspective without any 3-D.

let flat: HTMLCanvasElement | null = null;

function scratchFor(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  flat ??= document.createElement('canvas');
  if (flat.width < w) flat.width = w;
  if (flat.height < h) flat.height = h;
  return flat.getContext('2d');
}

/** Draws `paint` into rect r on a wall whose right edge is `slant` × r.h shorter at the top and the bottom (0: flat). */
export function onWall(ctx: CanvasRenderingContext2D, r: AreaRect, slant: number, paint: (g: CanvasRenderingContext2D, at: AreaRect) => void): void {
  const k = Math.max(1, Math.abs(ctx.getTransform().a));
  const g = slant === 0 ? null : scratchFor(Math.ceil(r.w * k), Math.ceil(r.h * k));
  if (!g || !flat) {
    paint(ctx, r);
    return;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, flat.width, flat.height);
  g.setTransform(k, 0, 0, k, 0, 0);
  paint(g, { x: 0, y: 0, w: r.w, h: r.h });
  for (let i = 0; i < r.w; i++) {
    const inset = slant * r.h * ((i + 0.5) / r.w);
    ctx.drawImage(flat, i * k, 0, k, r.h * k, r.x + i, r.y + inset, 1, r.h - 2 * inset);
  }
}
