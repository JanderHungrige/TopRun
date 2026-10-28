import { BOARD_H, BOARD_W, type Cells } from '../../game/chalkboard';
import { Slate } from '../chalkboard/slate';
import { PAL } from '../pixel/palette';
import type { Pix } from '../pixel/raster';
import { col, pbox } from './paint';

// Hangar base (doc 40): the shared chalkboard under the ladder. Its wooden frame, the ledge with chalk stubs and a
// sponge are static art; the slate itself is the live board drawn at one logical px per cell over the composed art
// (the jet never reaches this high), darker for the hangar's dusk.

/** Top-left of the slate in logical px; it is BOARD_W × BOARD_H. */
export const MINI = { x: 700, y: 324 } as const;
const FRAME = 7;

const slate = new Slate(0.78);
const BARE = new Uint8Array(BOARD_W * BOARD_H);

/** The frame, the slate's dark ground (until the board is drawn over it) and the ledge with its props. */
export function paintChalkFrame(p: Pix, G: number): void {
  const c0 = Math.floor((MINI.x - FRAME) / G);
  const r0 = Math.floor((MINI.y - FRAME) / G);
  const c1 = Math.ceil((MINI.x + BOARD_W + FRAME) / G);
  const r1 = Math.ceil((MINI.y + BOARD_H + FRAME) / G);
  const L = PAL.leather;
  pbox(p, c0 - 1, r0 - 1, c1 - c0 + 2, r1 - r0 + 3, col(PAL.ink, 0));
  pbox(p, c0, r0, c1 - c0, r1 - r0, col(L, 2));
  pbox(p, c0, r0, c1 - c0, 1, col(L, 4));
  pbox(p, c0, r0, 1, r1 - r0, col(L, 3));
  pbox(p, c1 - 1, r0, 1, r1 - r0, col(L, 1));
  pbox(p, c0 + 2, r0 + 2, c1 - c0 - 4, r1 - r0 - 4, col(PAL.sage, 1));
  // the ledge, one art px proud of the frame, with two chalk stubs and a sponge
  pbox(p, c0 - 2, r1, c1 - c0 + 4, 2, col(L, 3));
  pbox(p, c0 - 2, r1, c1 - c0 + 4, 1, col(L, 4));
  pbox(p, c0 - 2, r1 + 2, c1 - c0 + 4, 1, col(PAL.ink, 1));
  const mid = Math.round((c0 + c1) / 2);
  pbox(p, mid - 26, r1 - 1, 4, 1, col(PAL.white, 3));
  pbox(p, mid - 20, r1 - 1, 3, 1, col(PAL.yellow, 4));
  pbox(p, mid + 18, r1 - 2, 7, 2, col(PAL.yellow, 3));
  pbox(p, mid + 18, r1 - 2, 7, 1, col(PAL.yellow, 4));
}

/** The live board over the frame; `cells` null (not fetched yet) shows the bare slate. */
export function drawChalkMini(ctx: CanvasRenderingContext2D, cells: Cells | null, version: number): void {
  if (cells) slate.paint(cells, version);
  else slate.paint(BARE, -2);
  slate.draw(ctx, MINI.x, MINI.y, 1);
}
