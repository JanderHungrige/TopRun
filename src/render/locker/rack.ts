import type { Box, UniformLayout } from '../../game/uniform-layout';
import { drawMedal, drawRibbonBar } from '../medals';
import { pixelRect } from '../pixel/frame';
import { drawWings } from './insignia';

// Locker (doc 31): the rack on the jacket — ribbon bars and hanging medals at the layout's slots on the scene's
// art grid, the selected one drawn last (on top) with a shine sweep, and blinking gold corner brackets around it.

const GOLD = '#ffd76a';
const SHINE_PERIOD = 2.6;

/** Blinking pixel corner brackets around a box. */
export function brackets(ctx: CanvasRenderingContext2D, b: Box, G: number, t: number, color = GOLD): void {
  if (Math.floor(t * 2.4) % 3 === 2) return;
  const pad = 2 * G;
  const x0 = b.x - pad;
  const y0 = b.y - pad;
  const x1 = b.x + b.w + pad;
  const y1 = b.y + b.h + pad;
  const arm = 3 * G;
  for (const [x, y, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
    pixelRect(ctx, sx > 0 ? x : x - arm, sy > 0 ? y : y - G, arm, G, color);
    pixelRect(ctx, sx > 0 ? x : x - G, sy > 0 ? y : y - arm, G, arm, color);
  }
}

function drawSlot(ctx: CanvasRenderingContext2D, l: UniformLayout, i: number, G: number, shine?: number): void {
  const s = l.slots[i];
  if (!s) return;
  if (s.kind === 'ribbon') drawRibbonBar(ctx, s.id, s.x, s.y, s.box.w, s.box.h, { px: G });
  else drawMedal(ctx, s.id, s.x, s.y, s.size, { px: G, ...(shine === undefined ? {} : { shine }) });
}

/** Wings, ribbons and medals, back to front (the last slot first: upper rows and senior medals end up in front);
 *  `selected` on top with a shine (−1 = none). */
export function drawRack(ctx: CanvasRenderingContext2D, l: UniformLayout, selected: number, G: number, t: number): void {
  drawWings(ctx, l.wings.x, l.wings.y, G);
  for (let i = l.slots.length - 1; i >= 0; i--) if (i !== selected) drawSlot(ctx, l, i, G);
  const sel = l.slots[selected];
  if (!sel) return;
  const u = (t % SHINE_PERIOD) / 1.1;
  drawSlot(ctx, l, selected, G, sel.kind === 'medal' && u <= 1 ? u : undefined);
  brackets(ctx, sel.box, G, t);
}
