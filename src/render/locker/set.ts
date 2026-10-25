import { SpriteCache } from '../pixel/blit';
import { glow, vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { toCanvas } from '../pixel/post';
import { bayer, checker, minus, Pix } from '../pixel/raster';
import type { Grid } from '../rooms-chrome';
import { fill, paintIn, rect, rectEdge, thick } from '../rooms-pixel';
import { bench, cap, door, helmet, hook } from './props';

// Locker (doc 31): the locker room as one cached pixel-art layer — the hangar wall, a row of olive steel lockers,
// the open one in the middle with its door swung out, the inside with a shelf (cap, helmet), the tube light and
// its light cone, the hanger rod and hook, and a bench in front. Frame units are logical px (1280 × 720); one art
// pixel is about 2 logical px (whole device pixels).

/** The open cabinet: outer frame and the inside (logical). */
export const CABINET = { x: 170, y: 20, w: 560, h: 646 } as const;
export const INSIDE = { x: 184, y: 34, w: 532, h: 614 } as const;
export const SHELF_Y = 98;
export const ROD_Y = 128;
export const TUBE = { x: 300, y: 108, w: 300, h: 6 } as const;
export const FLOOR_Y = 666;

export const v = (ramp: readonly number[], i: number): number => ramp[i] ?? 0;

function wall(p: Pix): void {
  const N = PAL.navy;
  vgrad(p, [v(N, 3), v(N, 2), v(N, 2), v(N, 1)], 0, FLOOR_Y, undefined, 6);
  for (let x = 12; x < 1280; x += 48) {
    rect(p, x, 0, 2, FLOOR_Y, v(N, 1));
    rect(p, x + 2, 0, 2, FLOOR_Y, v(N, 3), undefined, checker);
  }
  const floor = p.shape(path().rect(0, FLOOR_Y, 1280, 720 - FLOOR_Y));
  vgrad(p, [v(PAL.wall, 3), v(PAL.wall, 2), v(PAL.wall, 1)], FLOOR_Y, 720, floor, 4);
  rect(p, 0, FLOOR_Y, 1280, 2, v(PAL.wall, 4));
  for (let x = -40; x < 1300; x += 120) thick(p, [x, FLOOR_Y + 2, x - 70, 720], 0.6, v(PAL.wall, 1), floor);
}

/** A closed locker: olive door, vents, handle, number plate. */
function closedLocker(p: Pix, x: number, w: number): void {
  const S = PAL.sage;
  const h = FLOOR_Y - CABINET.y;
  rect(p, x, CABINET.y, w, h, v(S, 2));
  rect(p, x + 8, CABINET.y + 10, w - 16, h - 30, v(S, 3));
  rect(p, x + 8, CABINET.y + 10, 4, h - 30, v(S, 4));
  rect(p, x + w - 12, CABINET.y + 10, 4, h - 30, v(S, 2));
  for (const y0 of [CABINET.y + 34, FLOOR_Y - 120]) {
    for (let i = 0; i < 5; i++) rect(p, x + 30, y0 + i * 12, w - 60, 4, v(S, 1));
  }
  rect(p, x + w - 40, CABINET.y + 300, 10, 46, v(PAL.steel, 4));
  rect(p, x + w - 40, CABINET.y + 300, 10, 4, v(PAL.steel, 6));
  rect(p, x + w / 2 - 20, CABINET.y + 18, 40, 12, v(PAL.white, 2));
  rectEdge(p, x, CABINET.y, w, h, v(S, 0));
}

function interior(p: Pix): void {
  const S = PAL.sage;
  rect(p, CABINET.x, CABINET.y, CABINET.w, FLOOR_Y - CABINET.y, v(S, 3));
  rect(p, CABINET.x, CABINET.y, CABINET.w, 4, v(S, 4));
  const inside = p.shape(path().rect(INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h));
  vgrad(p, [v(S, 1), v(S, 2), v(S, 1), v(PAL.ink, 1)], INSIDE.y, INSIDE.y + INSIDE.h, inside, 8);
  const cone = fill(p, path().lines([TUBE.x + 10, TUBE.y + TUBE.h, TUBE.x + TUBE.w - 10, TUBE.y + TUBE.h, 700, 600, 200, 600]).close(), v(S, 2), inside, bayer(0.5));
  const core = p.shape(path().lines([TUBE.x + 40, 120, TUBE.x + TUBE.w - 40, 120, 640, 520, 260, 520]).close());
  paintIn(p, minus(cone, core), v(S, 1), [200, TUBE.y, 700, 600], inside, bayer(0.25));
  rect(p, INSIDE.x, INSIDE.y, 14, INSIDE.h, v(S, 1), undefined, checker);
  rect(p, INSIDE.x + INSIDE.w - 14, INSIDE.y, 14, INSIDE.h, v(PAL.ink, 1), undefined, checker);
  rect(p, INSIDE.x, INSIDE.y + INSIDE.h - 18, INSIDE.w, 18, v(S, 0));
  rectEdge(p, CABINET.x, CABINET.y, CABINET.w, FLOOR_Y - CABINET.y, v(S, 0));
  rectEdge(p, INSIDE.x, INSIDE.y, INSIDE.w, INSIDE.h, v(S, 0), 'u');
}

function shelfAndRod(p: Pix): void {
  const S = PAL.sage;
  rect(p, INSIDE.x, SHELF_Y, INSIDE.w, 8, v(S, 4));
  rect(p, INSIDE.x, SHELF_Y + 8, INSIDE.w, 4, v(S, 2));
  rect(p, INSIDE.x, SHELF_Y + 12, INSIDE.w, 2, v(S, 0));
  rect(p, TUBE.x - 6, TUBE.y - 2, TUBE.w + 12, 4, v(PAL.steel, 2));
  rect(p, TUBE.x, TUBE.y, TUBE.w, TUBE.h, v(PAL.white, 4));
  rect(p, TUBE.x, TUBE.y + TUBE.h - 2, TUBE.w, 2, v(PAL.white, 3));
  const St = PAL.steel;
  rect(p, INSIDE.x + 8, ROD_Y, INSIDE.w - 16, 6, v(St, 4));
  rect(p, INSIDE.x + 8, ROD_Y, INSIDE.w - 16, 2, v(St, 6));
  rect(p, INSIDE.x + 8, ROD_Y + 5, INSIDE.w - 16, 1.5, v(St, 2));
  for (const x of [INSIDE.x + 4, INSIDE.x + INSIDE.w - 16]) rect(p, x, ROD_Y - 6, 12, 18, v(St, 3));
}

const cache = new SpriteCache(4);

/** The static locker room for a grid (cached). */
export function lockerBackdrop(g: Grid): HTMLCanvasElement | null {
  return cache.get(`${g.W}x${g.H}|${g.G.toFixed(4)}`, () => {
    const p = new Pix(g.W, g.H, 1 / g.G, 0, 0);
    wall(p);
    closedLocker(p, -40, 210);
    closedLocker(p, CABINET.x + CABINET.w, 220);
    closedLocker(p, CABINET.x + CABINET.w + 220, 220);
    interior(p);
    shelfAndRod(p);
    glow(p, TUBE.x + TUBE.w / 2, TUBE.y + 3, 18, PAL.sage, 2, 1.4);
    cap(p);
    helmet(p);
    hook(p);
    door(p);
    bench(p);
    return toCanvas(p);
  });
}
