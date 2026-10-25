import { BASE_AREAS } from '../../data/base-areas';
import { SpriteCache } from '../pixel/blit';
import { hexOf, PAL } from '../pixel/palette';
import { makeCanvas } from '../pixel/post';
import type { Pix } from '../pixel/raster';
import { FLIP_CHARS, glyph } from './glyphs';
import { BOARD_COLS, BOARD_ROWS, ROOF_Y, ROW_GAP, TILE_GAP, TILE_H, TILE_W } from './layout';
import { col, hash, pbox } from './paint';

// Hangar base (doc 30): LADDER — a big split-flap scoreboard on the back wall. The frame is static art; the
// tiles are drawn every frame in art pixels: row 1 the board name, row 2 the pilot's callsign, row 3 the local
// rating. On entry the rows flip into place one after another, and every few seconds a row flips again: its
// lettered tiles cycle through random letters (the flap half shown every other frame) and settle left to right.

/** Where the tile area sits on the art grid. */
export interface BoardBox { x0: number; y0: number; w: number; h: number }

export function boardBox(G: number): BoardBox {
  const hot = BASE_AREAS.ladder.hot;
  const w = BOARD_COLS * (TILE_W + TILE_GAP) - TILE_GAP;
  const h = BOARD_ROWS * TILE_H + (BOARD_ROWS - 1) * ROW_GAP;
  return { x0: Math.round((hot.x + hot.w / 2) / G - w / 2), y0: Math.round(140 / G), w, h };
}

/** Mount rods, the steel frame with its bevel, the dark bezel, a gold rule under the title and two spotlights. */
export function paintBoardFrame(p: Pix, G: number): void {
  const b = boardBox(G);
  const S = PAL.steel;
  const m = 4;
  const roof = Math.round(ROOF_Y / G);
  for (const dx of [14, b.w - 15]) pbox(p, b.x0 + dx, roof, 1, b.y0 - m - roof, col(S, 1));
  pbox(p, b.x0 - m - 1, b.y0 - m - 1, b.w + 2 * m + 2, b.h + 2 * m + 2, col(S, 0));
  pbox(p, b.x0 - m, b.y0 - m, b.w + 2 * m, b.h + 2 * m, col(S, 2));
  pbox(p, b.x0 - m, b.y0 - m, b.w + 2 * m, 1, col(S, 4));
  pbox(p, b.x0 - m, b.y0 - m, 1, b.h + 2 * m, col(S, 4));
  pbox(p, b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4, col(PAL.night, 0));
  pbox(p, b.x0, b.y0 + TILE_H + 1, b.w, 1, col(PAL.gold, 2));
  for (const dx of [22, b.w - 23]) {
    pbox(p, b.x0 + dx - 2, b.y0 - m - 4, 5, 3, col(S, 3));
    pbox(p, b.x0 + dx - 1, b.y0 - m - 1, 3, 1, col(PAL.lamp, 4));
  }
}

const tiles = new SpriteCache(200);

/** One tile: dark flap with a lighter upper half, edge notches at the split, the glyph; `flap` = mid-flip. */
function tile(ch: string, ink: number, flap: boolean): HTMLCanvasElement | null {
  return tiles.get(`${ch}|${ink}|${flap ? 1 : 0}`, () => {
    const c = makeCanvas(TILE_W, TILE_H);
    const g = c.getContext('2d');
    if (!g) return null;
    const G = PAL.glass;
    g.fillStyle = hexOf(col(G, 2));
    g.fillRect(0, 0, TILE_W, TILE_H);
    g.fillStyle = hexOf(col(G, 3));
    g.fillRect(0, 0, TILE_W, 5);
    g.fillStyle = hexOf(ink);
    glyph(ch).forEach((row, y) => {
      for (let x = 0; x < 5; x++) if (row & (16 >> x)) g.fillRect(1 + x, 2 + y, 1, 1);
    });
    g.fillStyle = hexOf(col(G, 0));
    g.fillRect(0, 5, 1, 1);
    g.fillRect(TILE_W - 1, 5, 1, 1);
    if (flap) {
      g.fillStyle = hexOf(col(G, 1));
      g.fillRect(0, 0, TILE_W, 5);
      g.fillStyle = hexOf(col(G, 4));
      g.fillRect(0, 4, TILE_W, 1);
    }
    return c;
  });
}

const PERIOD = 7.5;

/** Seconds since row r last started flipping (negative before its entry flip). */
function sinceFlip(r: number, t: number): number {
  const first = 3 + r * 2.5;
  if (t < first) return t - (0.3 + r * 0.35);
  return (t - first) % PERIOD;
}

/** Centres a row's text on the 14 tiles. */
function centred(s: string): string {
  const cut = s.toUpperCase().slice(0, BOARD_COLS);
  const left = Math.floor((BOARD_COLS - cut.length) / 2);
  return (' '.repeat(left) + cut).padEnd(BOARD_COLS, ' ');
}

/** Draws the three rows of tiles onto the art-resolution compose canvas. */
export function drawBoardTiles(g: CanvasRenderingContext2D, G: number, rows: readonly string[], t: number): void {
  const b = boardBox(G);
  for (let r = 0; r < BOARD_ROWS; r++) {
    const target = centred(rows[r] ?? '');
    const since = sinceFlip(r, t);
    const ink = r === 0 ? col(PAL.gold, 4) : col(PAL.white, 3);
    for (let i = 0; i < BOARD_COLS; i++) {
      const want = target[i] ?? ' ';
      const settle = 0.25 + i * 0.04 + hash(r * 31 + i) * 0.3;
      let ch = want;
      let flap = false;
      if (since < 0) ch = ' ';
      else if (want !== ' ' && since < settle) {
        ch = FLIP_CHARS[Math.floor(hash(r * 97 + i * 13 + Math.floor(t * 18)) * FLIP_CHARS.length)] ?? want;
        flap = Math.floor(t * 36 + i) % 2 === 0;
      }
      const art = tile(ch, ink, flap);
      if (art) g.drawImage(art, b.x0 + i * (TILE_W + TILE_GAP), b.y0 + r * (TILE_H + ROW_GAP));
    }
  }
}
