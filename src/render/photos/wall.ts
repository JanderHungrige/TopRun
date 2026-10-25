import { createRng } from '../../core/rng';
import { BOARD } from '../../game/photos';
import { SpriteCache } from '../pixel/blit';
import { pixelRect } from '../pixel/frame';
import { vgrad } from '../pixel/fx';
import { hexOf, PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { toCanvas } from '../pixel/post';
import { bayer, checker, Pix } from '../pixel/raster';
import type { Grid } from '../rooms-chrome';
import { fill, rect, rectEdge } from '../rooms-pixel';

// Picture wall (doc 32): the hangar wall with the big corkboard as one cached pixel-art layer — corrugated steel,
// a strip light over the board, the wooden frame and the dithered cork grain — plus its living parts: a slow
// light shaft from a hangar window drifting over the board and dust in it.

const v = (ramp: readonly number[], i: number): number => ramp[i] ?? 0;
const FRAME = 10;

function wall(p: Pix): void {
  const N = PAL.navy;
  vgrad(p, [v(N, 3), v(N, 2), v(N, 2), v(N, 1)], 0, 720, undefined, 6);
  for (let x = 8; x < 1280; x += 32) {
    rect(p, x, 0, 2, 720, v(N, 1));
    rect(p, x + 2, 0, 4, 720, v(N, 3), undefined, checker);
  }
  rect(p, 0, 0, 1280, 8, v(PAL.steel, 2));
  rect(p, 0, 8, 1280, 2, v(PAL.steel, 1));
  rect(p, 0, 690, 1280, 30, v(PAL.wall, 1));
  rect(p, 0, 690, 1280, 2, v(PAL.wall, 3));
}

function board(p: Pix): void {
  const L = PAL.leather;
  rect(p, BOARD.x - FRAME, BOARD.y - FRAME, BOARD.w + 2 * FRAME, BOARD.h + 2 * FRAME, v(L, 3));
  rect(p, BOARD.x - FRAME, BOARD.y - FRAME, BOARD.w + 2 * FRAME, 3, v(L, 5));
  rect(p, BOARD.x - FRAME, BOARD.y - FRAME, 3, BOARD.h + 2 * FRAME, v(L, 4));
  rect(p, BOARD.x - FRAME, BOARD.y + BOARD.h + FRAME - 3, BOARD.w + 2 * FRAME, 3, v(L, 1));
  rect(p, BOARD.x + BOARD.w + FRAME - 3, BOARD.y - FRAME, 3, BOARD.h + 2 * FRAME, v(L, 2));
  const J = PAL.jersey;
  const cork = fill(p, path().rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h), v(J, 4));
  const rng = createRng(77);
  for (let i = 0; i < 2600; i++) {
    const c = Math.floor(rng.next() * p.w);
    const r = Math.floor(rng.next() * p.h);
    if (cork[r * p.w + c]) p.data[r * p.w + c] = v(J, i % 3 === 0 ? 5 : 3);
  }
  rect(p, BOARD.x, BOARD.y, BOARD.w, 6, v(J, 2), cork, bayer(0.5));
  rect(p, BOARD.x, BOARD.y, 6, BOARD.h, v(J, 3), cork, checker);
  rectEdge(p, BOARD.x - FRAME, BOARD.y - FRAME, BOARD.w + 2 * FRAME, BOARD.h + 2 * FRAME, v(L, 0));
  rectEdge(p, BOARD.x, BOARD.y, BOARD.w, BOARD.h, v(J, 1));
}

function lamp(p: Pix): void {
  const S = PAL.steel;
  rect(p, 380, 26, 520, 16, v(S, 2));
  rect(p, 384, 38, 512, 6, v(PAL.white, 4));
  rect(p, 380, 26, 520, 3, v(S, 4));
  for (const x of [420, 860]) rect(p, x, 10, 4, 16, v(S, 1));
}

const cache = new SpriteCache(4);

/** The static wall for a grid (cached). */
export function wallBackdrop(g: Grid): HTMLCanvasElement | null {
  return cache.get(`${g.W}x${g.H}|${g.G.toFixed(4)}`, () => {
    const p = new Pix(g.W, g.H, 1 / g.G, 0, 0);
    wall(p);
    board(p);
    lamp(p);
    return toCanvas(p);
  });
}

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** The slow light shaft from a hangar window and the dust in it. */
export function drawWallAmbient(ctx: CanvasRenderingContext2D, t: number, G: number): void {
  const x = 140 + Math.sin(t * 0.07) * 120;
  ctx.save();
  ctx.fillStyle = 'rgba(255,226,170,0.06)';
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x + 180, 0);
  ctx.lineTo(x + 520, 720);
  ctx.lineTo(x + 250, 720);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const lit = hexOf(PAL.lamp[5] ?? 0);
  for (let i = 0; i < 16; i++) {
    const y = (hash(i) * 720 + t * (5 + hash(i + 3) * 7)) % 720;
    const px = x + 90 + (y / 720) * 300 + (hash(i + 8) - 0.5) * 150 + Math.sin(t * 0.5 + i) * 10;
    if (Math.sin(t * 1.1 + i * 2.3) < -0.3) continue;
    pixelRect(ctx, Math.round(px / G) * G, Math.round(y / G) * G, G, G, lit);
  }
}
