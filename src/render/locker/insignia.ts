import type { RankId } from '../../data/ranks';
import { SpriteCache } from '../pixel/blit';
import { pixelRect } from '../pixel/frame';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { makeCanvas, outline, toCanvas } from '../pixel/post';
import { dominantColors, snapToPalette } from '../pixel/quantize';
import { Pix } from '../pixel/raster';
import { drawRankBoard } from '../ranks';
import { text } from '../text';
import { CENTRE_X, POCKETS } from './jacket';

// Locker (doc 31): what sits on the jacket besides the medals — the rank shoulder boards (the ladder's
// drawRankBoard art captured once, turned a quarter so the stripes sit at the shoulder end and the star at the
// collar, foreshortened and stepped down the shoulder slope), the gold wings badge and the callsign name plate.

const BOARD_SRC = 48;
const BOARD_LEN = 100;
const BOARD_DEPTH = 18;
const BOARD_DROP = 14;
/** Collar end of each board (logical): the boards run outward from here along the shoulders. */
const BOARD_TOP = 162;
const BOARD_COLLAR = 34;

const boards = new SpriteCache(8);

function boardSource(rank: RankId): ImageData | null {
  const c = makeCanvas(BOARD_SRC, BOARD_SRC);
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.clearRect(0, 0, BOARD_SRC, BOARD_SRC);
  drawRankBoard(g, rank, 0, 0, BOARD_SRC / 24);
  const img = g.getImageData(0, 0, BOARD_SRC, BOARD_SRC);
  snapToPalette(img.data, dominantColors(img.data, 8, 400));
  return img;
}

/** The board as seen on the viewer's-right shoulder (`mirror` for the left): L × (depth + drop) art px. */
function boardSprite(rank: RankId, G: number, mirror: boolean): HTMLCanvasElement | null {
  return boards.get(`${rank}|${G.toFixed(4)}|${mirror ? 1 : 0}`, () => {
    const src = boardSource(rank);
    const L = Math.round(BOARD_LEN / G);
    const D = Math.max(4, Math.round(BOARD_DEPTH / G));
    const drop = Math.round(BOARD_DROP / G);
    const out = makeCanvas(L, D + drop);
    const g = out.getContext('2d');
    if (!g || !src) return null;
    const img = g.createImageData(L, D + drop);
    for (let u = 0; u < L; u++) {
      const along = u / Math.max(1, L - 1);
      const by = Math.min(BOARD_SRC - 1, Math.floor(along * BOARD_SRC));
      const row0 = Math.round(drop * along * along);
      const col = mirror ? L - 1 - u : u;
      for (let r = 0; r < D; r++) {
        const bx = Math.min(BOARD_SRC - 1, Math.floor(((r + 0.5) / D) * BOARD_SRC));
        const s = (by * BOARD_SRC + bx) * 4;
        const d = ((row0 + r) * L + col) * 4;
        for (let k = 0; k < 4; k++) img.data[d + k] = src.data[s + k] ?? 0;
      }
    }
    g.putImageData(img, 0, 0);
    return out;
  });
}

const snap = (ctx: CanvasRenderingContext2D, x: number, y: number): [number, number] => {
  const m = ctx.getTransform();
  return [m.a ? (Math.round(m.a * x + m.e) - m.e) / m.a : x, m.d ? (Math.round(m.d * y + m.f) - m.f) / m.d : y];
};

/** Both shoulder boards for the pilot's rank. */
export function drawBoards(ctx: CanvasRenderingContext2D, rank: RankId, G: number, dx: number): void {
  for (const mirror of [false, true]) {
    const art = boardSprite(rank, G, mirror);
    if (!art) continue;
    const w = art.width * G;
    const x = mirror ? CENTRE_X - BOARD_COLLAR - w : CENTRE_X + BOARD_COLLAR;
    const [sx, sy] = snap(ctx, x + dx, BOARD_TOP);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, sx, sy, w, art.height * G);
    ctx.restore();
  }
}

const wingsCache = new SpriteCache(4);
export const WINGS_W = 72;

function wingsArt(G: number): HTMLCanvasElement | null {
  return wingsCache.get(G.toFixed(4), () => {
    const k = 1 / G;
    const Wd = 2 * Math.ceil((WINGS_W / 2) * k) + 2;
    const p = new Pix(Wd, Math.ceil(18 * k) + 3, k, Wd / 2, 1);
    const Gd = PAL.gold;
    const wing = path().pair([5, 3, 16, 1, 28, 0.5, 36, 2.5, 30, 6, 33, 7.5, 25, 10.5, 27, 12, 15, 14.5, 6, 13]);
    p.paint(p.shape(wing), Gd[3] ?? 0);
    p.paint(p.shape(path().pair([6, 3, 16, 1.4, 28, 1, 34, 2.6, 16, 4])), Gd[5] ?? 0);
    for (const [y0, x1] of [[6, 29], [9.5, 25], [12.5, 18]] as const) {
      p.paint(p.shape(path().pair([8, y0, x1, y0 - 0.6, x1, y0 + 0.8, 8, y0 + 1.2])), Gd[2] ?? 0);
    }
    const shield = p.shape(path().lines([-5.5, 1, 5.5, 1, 5.5, 9, 0, 16, -5.5, 9]).close());
    p.paint(shield, Gd[4] ?? 0);
    p.paint(p.shape(path().lines([0, 1, 5.5, 1, 5.5, 9, 0, 16]).close()), Gd[3] ?? 0, shield);
    p.paint(p.shape(path().rect(-0.8, 3, 1.6, 9)), Gd[2] ?? 0, shield);
    outline(p);
    return toCanvas(p);
  });
}

/** The wings badge: (x, y) = centre of its top edge. */
export function drawWings(ctx: CanvasRenderingContext2D, x: number, y: number, G: number): void {
  const art = wingsArt(G);
  if (!art) return;
  const [sx, sy] = snap(ctx, x - (art.width / 2) * G, y - G);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, sx, sy, art.width * G, art.height * G);
  ctx.restore();
}

/** The name plate above the viewer's-left breast pocket. */
export function drawNamePlate(ctx: CanvasRenderingContext2D, callsign: string, G: number, dx: number): void {
  const w = 96;
  const h = 16;
  const x = POCKETS.left.x + POCKETS.left.w / 2 - w / 2 + dx;
  const y = POCKETS.y - h - 6;
  pixelRect(ctx, x - G, y - G, w + 2 * G, h + 2 * G, '#3a2406');
  pixelRect(ctx, x, y, w, h, '#14181c');
  pixelRect(ctx, x, y, w, G, '#454d55');
  text(ctx, callsign, x + w / 2, y + h / 2 + 1, { size: 11, weight: 800, align: 'center', baseline: 'middle', color: '#f0efea', maxWidth: w - 8, letterSpacing: 1 });
}
