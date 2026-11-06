import { COLORS, measure, text } from './text';

// The admin pilot's plate (doc 47): dark letters on a gold plate, beside the callsign or on the portrait.

/** A plate whose left edge is x and whose text sits on baseline y; returns its width. */
export function drawAdminBadge(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, size = 11): number {
  const w = Math.round(measure(ctx, label, size, true) + size);
  const top = Math.round(y - size * 0.75 - 4);
  const h = Math.round(size * 0.75 + 8);
  ctx.fillStyle = '#1a1206';
  ctx.fillRect(Math.round(x) - 1, top - 1, w + 2, h + 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(Math.round(x), top, w, h);
  text(ctx, label, x + w / 2, y, { size, display: true, align: 'center', color: '#1a1206' });
  return w;
}
