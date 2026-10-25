import { vgrad } from '../pixel/fx';
import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, checker, type Pix } from '../pixel/raster';
import { box, col, disc, fillPath, hline, pbox, vline } from './paint';
import { BEACON, DOOR, DOOR_FRAME, HORIZON, WALL_BASE } from './layout';

// Hangar base (doc 30): EXIT — the big sliding hangar doors, open onto an airfield at dusk: violet-to-amber sky,
// the low sun on the horizon, distant hills, a control tower, the runway with its edge lights; one door leaf slid
// aside with a hazard stripe, the top rail with rollers, the red beacon and a green running-figure exit sign.

const D = PAL.dusk;
const S = PAL.steel;

function sky(p: Pix): void {
  const clip = p.shape(path().rect(DOOR.x, DOOR.y, DOOR.w, HORIZON - DOOR.y));
  vgrad(p, [col(D, 0), col(D, 1), col(D, 2), col(D, 3), col(D, 4), col(D, 5), col(D, 6)], DOOR.y + 10, HORIZON, clip, 4);
  disc(p, 1196, HORIZON, 26, 26, (v) => (v === 0 ? 0 : col(D, 6)), bayer(0.5));
  disc(p, 1196, HORIZON, 17, 17, col(D, 7));
  disc(p, 1194, HORIZON - 3, 9, 9, col(PAL.lamp, 5));
  for (const [x, y, w] of [[1118, 214, 54], [1170, 250, 60], [1126, 300, 40], [1184, 352, 50]] as const) {
    hline(p, x, x + w, y, col(D, 3));
    hline(p, x + 6, x + w - 8, y + 3, col(D, 4), checker);
  }
}

function ground(p: Pix): void {
  box(p, DOOR.x, HORIZON, DOOR.w, WALL_BASE - HORIZON, col(PAL.night, 2));
  fillPath(p, path().lines([DOOR.x, HORIZON + 1, 1130, HORIZON - 7, 1152, HORIZON - 3, 1176, HORIZON - 10, 1206, HORIZON - 4,
    DOOR.x + DOOR.w, HORIZON - 8, DOOR.x + DOOR.w, HORIZON + 1]).close(), col(D, 1));
  box(p, 1128, HORIZON - 30, 8, 30, col(PAL.night, 1));
  box(p, 1124, HORIZON - 36, 16, 7, col(PAL.night, 1));
  box(p, 1126, HORIZON - 34, 12, 2, col(PAL.lamp, 3));
  box(p, DOOR.x, HORIZON + 14, DOOR.w, 14, col(PAL.wall, 2));
  hline(p, DOOR.x, DOOR.x + DOOR.w, HORIZON + 14, col(PAL.wall, 3));
  for (let x = DOOR.x + 6; x < DOOR.x + DOOR.w; x += 14) box(p, x, HORIZON + 20, 6, 2, col(PAL.white, 2));
  for (let x = DOOR.x + 2; x < DOOR.x + DOOR.w; x += 12) {
    box(p, x, HORIZON + 12, 2, 2, col(PAL.blue, 4));
    box(p, x + 5, HORIZON + 30, 3, 3, col(PAL.blue, 4));
  }
  box(p, DOOR.x, HORIZON + 40, DOOR.w, WALL_BASE - HORIZON - 40, col(PAL.wall, 2));
  box(p, DOOR.x, HORIZON + 40, DOOR.w, 6, col(PAL.wall, 3), bayer(0.5));
}

function leaf(p: Pix): void {
  const x0 = DOOR.x + DOOR.w;
  const top = DOOR_FRAME.y + 14;
  for (let c = p.col(x0); c < p.w; c++) {
    for (let r = p.row(top); r < p.row(WALL_BASE); r++) p.data[r * p.w + c] = [col(S, 3), col(S, 2), col(S, 2), col(S, 1)][c % 4] ?? 0;
  }
  for (let y = top + 40; y < WALL_BASE - 20; y += 100) {
    box(p, x0 + 6, y, 1280 - x0 - 6, 5, col(S, 2));
    hline(p, x0 + 6, 1280, y, col(S, 4));
  }
  box(p, x0, top, 8, WALL_BASE - top, col(PAL.yellow, 3));
  for (let y = top; y < WALL_BASE; y += 16) fillPath(p, path().lines([x0, y, x0 + 8, y + 6, x0 + 8, y + 12, x0, y + 6]).close(), col(PAL.ink, 1));
  vline(p, x0 + 8, top, WALL_BASE, col(S, 0));
}

function frame(p: Pix): void {
  box(p, DOOR_FRAME.x, DOOR_FRAME.y, 1280 - DOOR_FRAME.x, 16, col(S, 1));
  hline(p, DOOR_FRAME.x, 1280, DOOR_FRAME.y, col(S, 3));
  for (let x = DOOR.x + 14; x < 1280; x += 34) {
    disc(p, x, DOOR_FRAME.y + 15, 5, 5, col(S, 3));
    box(p, x - 1, DOOR_FRAME.y + 14, 3, 3, col(S, 0));
  }
  box(p, DOOR_FRAME.x, DOOR_FRAME.y + 16, DOOR.x - DOOR_FRAME.x, WALL_BASE - DOOR_FRAME.y - 16, col(S, 2));
  vline(p, DOOR_FRAME.x, DOOR_FRAME.y, WALL_BASE, col(S, 4));
  vline(p, DOOR.x - 1, DOOR.y, WALL_BASE, col(S, 0));
  box(p, DOOR.x, DOOR_FRAME.y + 16, DOOR.w, DOOR.y - DOOR_FRAME.y - 16, col(S, 1));
  for (let y = DOOR_FRAME.y + 30; y < WALL_BASE - 10; y += 20) box(p, DOOR_FRAME.x + 2, y, 14, 10, col(PAL.yellow, 2), (c, r) => ((c + r) & 3) < 2);
  box(p, BEACON.x - 5, BEACON.y - 2, 10, 6, col(S, 1));
  disc(p, BEACON.x, BEACON.y - 3, 4, 4, col(PAL.red, 1));
}

/** Green exit sign with a running figure and an arrow towards the door (no words). */
function exitSign(p: Pix): void {
  const x0 = p.col(1040);
  const y0 = p.row(150);
  const G = col(PAL.green, 2);
  const L = col(PAL.green, 5);
  pbox(p, x0 - 1, y0 - 1, 15, 9, col(S, 0));
  pbox(p, x0, y0, 13, 7, G);
  const fig = ['..x....', '.xxx...', 'x.x.x..', '..xx...', '.x..x..', 'x....x.'];
  fig.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'x') p.set(x0 + 1 + c, y0 + r, L); }));
  for (const [c, r] of [[8, 3], [9, 3], [10, 3], [11, 3], [10, 2], [10, 4], [9, 1], [9, 5]] as const) p.set(x0 + c, y0 + r, L);
}

export function paintDoors(p: Pix): void {
  sky(p);
  ground(p);
  leaf(p);
  frame(p);
  exitSign(p);
}
