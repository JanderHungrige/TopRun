import type { AreaRect } from '../../data/base-areas';
import { BOARD_H, BOARD_W, type Cells } from '../../game/chalkboard';
import { hexOf, PAL } from '../pixel/palette';
import { makeCanvas } from '../pixel/post';
import { drawTileRows } from './board';
import { drawChalkMini } from './chalk';
import { ROW_GAP, TILE_GAP, TILE_H, TILE_W } from './layout';
import { col } from './paint';

// The docks' boards (doc 73): world 1's coded split-flap board and chalkboard, laid over the picture's own scoreboard
// and chalkboard so they cover them exactly. The flip board keeps its tiles square: the tile size follows the board's
// height, the number of columns its width. The chalkboard gets the hangar's wooden frame and ledge, the live slate
// centred inside at its own aspect. Owner: "It might not be perfect, but try to fit those elements perfectly over the
// parts in the image."

const MARGIN = 5;
const S = PAL.steel;
const hx = (ramp: Parameters<typeof col>[0], i: number): string => hexOf(col(ramp, i));

let boardCanvas: HTMLCanvasElement | null = null;

/** The flip board filling `r` (logical px): a steel frame with its bevel, the dark bezel, the tiles centred. */
export function drawDockFlipBoard(ctx: CanvasRenderingContext2D, r: AreaRect, rows: readonly string[], t: number): void {
  const unitH = rows.length * TILE_H + (rows.length - 1) * ROW_GAP + 2 * MARGIN;
  const s = r.h / unitH;
  const W = Math.round(r.w / s);
  const H = unitH;
  const cols = Math.max(1, Math.floor((W - 2 * MARGIN + TILE_GAP) / (TILE_W + TILE_GAP)));
  boardCanvas = makeCanvas(W, H, boardCanvas);
  const g = boardCanvas.getContext('2d');
  if (!g) return;
  g.fillStyle = hx(S, 0);
  g.fillRect(0, 0, W, H);
  g.fillStyle = hx(S, 2);
  g.fillRect(1, 1, W - 2, H - 2);
  g.fillStyle = hx(S, 4);
  g.fillRect(1, 1, W - 2, 1);
  g.fillRect(1, 1, 1, H - 2);
  g.fillStyle = hx(PAL.night, 0);
  g.fillRect(3, 3, W - 6, H - 6);
  const tilesW = cols * (TILE_W + TILE_GAP) - TILE_GAP;
  const x0 = Math.floor((W - tilesW) / 2);
  g.fillStyle = hx(PAL.gold, 2);
  g.fillRect(x0, MARGIN + TILE_H + 1, tilesW, 1);
  drawTileRows(g, x0, MARGIN, rows, cols, t);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(boardCanvas, r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** The chalkboard filling `r` (logical px): the wooden frame, the slate's dark ground, the live board centred in it at
 *  its own 3 : 1, the ledge below with two chalk stubs and a sponge. */
export function drawDockChalkboard(ctx: CanvasRenderingContext2D, r: AreaRect, cells: Cells | null, version: number): void {
  const L = PAL.leather;
  const f = Math.max(4, Math.round(r.h * 0.06));
  ctx.fillStyle = hx(PAL.ink, 0);
  ctx.fillRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
  ctx.fillStyle = hx(L, 2);
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = hx(L, 4);
  ctx.fillRect(r.x, r.y, r.w, 2);
  ctx.fillStyle = hx(L, 1);
  ctx.fillRect(r.x + r.w - 2, r.y, 2, r.h);
  const inner = { x: r.x + f, y: r.y + f, w: r.w - 2 * f, h: r.h - 2 * f - 3 };
  ctx.fillStyle = hx(PAL.sage, 1);
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  const scale = Math.min(inner.w / BOARD_W, inner.h / BOARD_H);
  drawChalkMini(ctx, cells, version, inner.x + (inner.w - BOARD_W * scale) / 2, inner.y + (inner.h - BOARD_H * scale) / 2, scale);
  const ledge = r.y + r.h - 3;
  ctx.fillStyle = hx(L, 3);
  ctx.fillRect(r.x - 4, ledge, r.w + 8, 5);
  ctx.fillStyle = hx(L, 4);
  ctx.fillRect(r.x - 4, ledge, r.w + 8, 1);
  const mid = r.x + r.w / 2;
  ctx.fillStyle = hx(PAL.white, 3);
  ctx.fillRect(mid - r.w * 0.2, ledge - 2, 10, 2);
  ctx.fillStyle = hx(PAL.yellow, 4);
  ctx.fillRect(mid - r.w * 0.2 + 14, ledge - 2, 7, 2);
  ctx.fillStyle = hx(PAL.yellow, 3);
  ctx.fillRect(mid + r.w * 0.15, ledge - 4, 16, 4);
}
