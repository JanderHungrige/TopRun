import type { MechId } from '../data/types';
import { cellAt, PAINT_COLORS, PAINT_SIZE, type Paint } from '../game/mech-paint';
import { t } from '../i18n/i18n';
import type { UiKey } from '../i18n/ui-en';
import { drawPlaneSide } from '../render/draw-planes-side';
import { drawPlaneTop } from '../render/draw-planes';
import { COLORS, text } from '../render/text';
import { drawButton, drawPanel, type Button, type Rect } from '../ui/widgets';

// The PAINT SHOP's layout and drawing (doc 87): the tile big on the left with its cursor, the palette and the tools
// under it, and on the right the mech wearing the paint — walking from the side and from above.

export const CELL = 26;
export const GRID: Rect = { x: 60, y: 120, w: PAINT_SIZE * CELL, h: PAINT_SIZE * CELL };
export const PREVIEW: Rect = { x: 540, y: 96, w: 700, h: 470 };

export type Tool = 'brush1' | 'brush2' | 'brush3' | 'fill' | 'blobs' | 'stripes' | 'solid' | 'undo' | 'done';
export const TOOLS: readonly Tool[] = ['brush1', 'brush2', 'brush3', 'fill', 'blobs', 'stripes', 'solid', 'undo', 'done'];

const TOOL_KEY: Readonly<Record<Tool, UiKey>> = {
  brush1: 'paint.brush1', brush2: 'paint.brush2', brush3: 'paint.brush3', fill: 'paint.fill', blobs: 'paint.blobs',
  stripes: 'paint.stripes', solid: 'paint.solid', undo: 'paint.undo', done: 'paint.done',
};

/** A palette swatch's rectangle. */
export const swatchRect = (i: number): Rect => ({ x: GRID.x + i * 52, y: GRID.y + GRID.h + 18, w: 46, h: 40 });

/** A tool button: two rows under the preview. */
export function toolButton(tool: Tool, i: number, active: boolean): Button {
  const row = i < 5 ? 0 : 1;
  const col = row ? i - 5 : i;
  return {
    id: tool, label: t(TOOL_KEY[tool]), x: PREVIEW.x + col * 140, y: PREVIEW.y + PREVIEW.h + 14 + row * 52, w: 132, h: 44,
    primary: active || tool === 'done',
  };
}

/** The tile cell under a point, or null. */
export function cellUnder(p: { x: number; y: number }): { x: number; y: number } | null {
  const x = Math.floor((p.x - GRID.x) / CELL);
  const y = Math.floor((p.y - GRID.y) / CELL);
  return x >= 0 && y >= 0 && x < PAINT_SIZE && y < PAINT_SIZE ? { x, y } : null;
}

export function drawGrid(ctx: CanvasRenderingContext2D, paint: Paint, cursor: { x: number; y: number }, time: number): void {
  ctx.fillStyle = '#0c120a';
  ctx.fillRect(GRID.x - 6, GRID.y - 6, GRID.w + 12, GRID.h + 12);
  for (let y = 0; y < PAINT_SIZE; y++) {
    for (let x = 0; x < PAINT_SIZE; x++) {
      ctx.fillStyle = PAINT_COLORS[cellAt(paint, x, y)] ?? '#4e6b2e';
      ctx.fillRect(GRID.x + x * CELL, GRID.y + y * CELL, CELL - 1, CELL - 1);
    }
  }
  ctx.strokeStyle = `rgba(255,215,106,${(0.6 + Math.sin(time * 6) * 0.3).toFixed(2)})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(GRID.x + cursor.x * CELL - 1, GRID.y + cursor.y * CELL - 1, CELL + 1, CELL + 1);
}

export function drawPalette(ctx: CanvasRenderingContext2D, color: number): void {
  PAINT_COLORS.forEach((c, i) => {
    const r = swatchRect(i);
    ctx.fillStyle = i === color ? COLORS.gold : '#0c120a';
    ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
    ctx.fillStyle = c;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });
}

/** The mech wearing the paint: walking from the side, and from above. */
export function drawPreview(ctx: CanvasRenderingContext2D, id: MechId, paint: Paint, name: string, time: number): void {
  drawPanel(ctx, PREVIEW, { fill: 'rgba(8,14,10,0.82)' });
  text(ctx, name.toUpperCase(), PREVIEW.x + 24, PREVIEW.y + 42, { size: 26, display: true, italic: true });
  ctx.fillStyle = 'rgba(120,80,40,0.35)';
  ctx.fillRect(PREVIEW.x + 40, PREVIEW.y + 390, 360, 8);
  drawPlaneSide(ctx, id, PREVIEW.x + 220, PREVIEW.y + 392, 3.4, { t: time, paint, stride: time * 0.8 });
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(PREVIEW.x + 460, PREVIEW.y + 110, 200, 280);
  drawPlaneTop(ctx, id, PREVIEW.x + 560, PREVIEW.y + 260, 3, { t: time, stride: time * 1.2, paint });
}

export function drawTools(ctx: CanvasRenderingContext2D, tool: Tool, time: number): void {
  TOOLS.forEach((tl, i) => drawButton(ctx, toolButton(tl, i, tl === tool), false, time));
}
