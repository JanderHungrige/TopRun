import { FLAG_H, FLAG_W, flagCell } from '../data/flags';
import type { Rect } from '../ui/widgets';
import { text } from './text';
import SHEET_URL from '../assets/flags/flags.png?url';

// Ladder flags (doc 28): one cell of the pixel-flag sheet, nearest-neighbour, with a faint frame; a small badge
// with the code for a country the sheet lacks. The sheet loads on first use.

let sheet: HTMLImageElement | null = null;

function loadedSheet(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!sheet) {
    sheet = new Image();
    sheet.decoding = 'async';
    sheet.src = SHEET_URL;
  }
  return sheet.complete && sheet.naturalWidth > 0 ? sheet : null;
}

/** A country's flag at FLAG_W × FLAG_H with its top-left at (x, y); nothing when the country is unknown. */
export function drawFlag(ctx: CanvasRenderingContext2D, code: string | null, x: number, y: number): void {
  if (code === null) return;
  const b: Rect = { x: Math.round(x), y: Math.round(y), w: FLAG_W, h: FLAG_H };
  const cell = flagCell(code);
  const img = cell ? loadedSheet() : null;
  if (cell && !img) return; // still loading
  if (cell && img) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, cell.x, cell.y, FLAG_W, FLAG_H, b.x, b.y, b.w, b.h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#1b2638';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    text(ctx, code, b.x + b.w / 2, b.y + b.h / 2 + 0.5, { size: 10, align: 'center', baseline: 'middle', color: '#c9d4e6' });
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x - 0.5, b.y - 0.5, b.w + 1, b.h + 1);
}
