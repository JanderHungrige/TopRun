import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, checker, type Pix } from '../pixel/raster';
import { box, col, disc, fillPath, hline, relight, seg, vline } from './paint';
import { ARCADE, CORK, FAN, LOCKERS, NEON, REC, WALL_BASE } from './layout';

// Hangar base (doc 30): the areas' furniture in the static layer — the rec-room doorway (warm light, arcade
// cabinet, dartboard, couch) under its neon sign board, the row of lockers (the third one ajar with the dress
// whites inside) with a bench and a flight helmet, the framed corkboard with nine placeholder pictures, the
// wall exhaust fan's housing and a fire extinguisher.

const J = PAL.jersey;
const S = PAL.steel;

function recRoom(p: Pix): void {
  box(p, REC.x - 6, REC.y - 6, REC.w + 12, REC.h + 6, col(S, 3));
  hline(p, REC.x - 6, REC.x + REC.w + 6, REC.y - 6, col(S, 5));
  box(p, REC.x, REC.y, REC.w, REC.h, col(J, 3));
  for (let x = REC.x + 12; x < REC.x + REC.w; x += 18) vline(p, x, REC.y, WALL_BASE - 30, col(J, 2));
  box(p, REC.x, WALL_BASE - 30, REC.w, 30, col(PAL.red, 1));
  box(p, REC.x, WALL_BASE - 30, REC.w, 30, col(PAL.ink, 2), checker);
  hline(p, REC.x, REC.x + REC.w, WALL_BASE - 30, col(J, 1));
  disc(p, 150, 360, 16, 16, col(PAL.ink, 1));
  disc(p, 150, 360, 14, 14, col(PAL.red, 3));
  disc(p, 150, 360, 10, 10, col(PAL.glove, 4));
  disc(p, 150, 360, 6, 6, col(PAL.green, 2));
  disc(p, 150, 360, 2, 2, col(PAL.red, 4));
  arcade(p);
  couch(p);
  relight(p, REC.x, REC.y, REC.w, REC.h, 1, bayer(0.5));
  vline(p, REC.x, REC.y, WALL_BASE, col(PAL.ink, 1));
  box(p, NEON.x, NEON.y, NEON.w, NEON.h, col(PAL.night, 0));
  box(p, NEON.x + 2, NEON.y + 2, NEON.w - 4, NEON.h - 4, col(PAL.night, 1));
  for (const x of [NEON.x + 14, NEON.x + NEON.w - 14]) vline(p, x, NEON.y - 30, NEON.y, col(S, 1));
}

function arcade(p: Pix): void {
  const V = PAL.violet;
  const { x, y, w } = ARCADE;
  box(p, x, y, w, WALL_BASE - y, col(V, 2));
  box(p, x + w - 6, y, 6, WALL_BASE - y, col(V, 1));
  box(p, x + 2, y + 2, w - 10, 10, col(V, 4));
  box(p, x + 4, y + 16, w - 14, 28, col(PAL.glass, 1));
  fillPath(p, path().lines([x - 2, y + 50, x + w + 2, y + 50, x + w, y + 60, x, y + 60]).close(), col(V, 3));
  disc(p, x + 10, y + 52, 3, 3, col(PAL.red, 3));
  for (const bx of [x + 20, x + 27]) box(p, bx, y + 53, 4, 3, col(PAL.yellow, 3));
  box(p, x + 8, y + 72, 16, 4, col(PAL.ink, 1));
}

function couch(p: Pix): void {
  const R = PAL.red;
  box(p, 116, 438, 76, 34, col(R, 2));
  box(p, 116, 438, 76, 3, col(R, 3));
  box(p, 120, 452, 68, 14, col(R, 3));
  hline(p, 120, 188, 452, col(R, 4));
  vline(p, 154, 452, 466, col(R, 1));
  box(p, 112, 446, 8, 26, col(R, 1));
  box(p, 188, 446, 8, 26, col(R, 1));
}

function locker(p: Pix, i: number): void {
  const G = PAL.sage;
  const x = LOCKERS.x + i * LOCKERS.w;
  const { y, base } = LOCKERS;
  box(p, x, y, LOCKERS.w, base - y, col(G, 0));
  box(p, x + 2, y + 2, LOCKERS.w - 4, base - y - 4, col(G, 3));
  vline(p, x + 2, y + 2, base - 2, col(G, 4));
  hline(p, x + 2, x + LOCKERS.w - 2, y + 2, col(G, 4));
  vline(p, x + LOCKERS.w - 4, y + 2, base - 2, col(G, 1));
  for (let v = 0; v < 4; v++) {
    hline(p, x + 10, x + 34, y + 14 + v * 6, col(G, 1));
    hline(p, x + 10, x + 34, y + 17 + v * 6, col(G, 4));
  }
  box(p, x + 12, y + 48, 20, 8, col(PAL.white, 2));
  box(p, x + 34, y + 82, 4, 22, col(S, 4));
  for (let v = 0; v < 2; v++) hline(p, x + 10, x + 34, base - 22 + v * 6, col(G, 1));
}

/** The open locker: dark inside, a white cap on the shelf, the dress whites on a hanger, the door swung out. */
function ajar(p: Pix): void {
  const x = LOCKERS.x + LOCKERS.ajar * LOCKERS.w;
  const { y, base } = LOCKERS;
  const Wt = PAL.white;
  box(p, x + 2, y + 2, LOCKERS.w - 4, base - y - 4, col(PAL.night, 1));
  hline(p, x + 2, x + LOCKERS.w - 2, y + 28, col(S, 3));
  disc(p, x + 22, y + 22, 13, 5, col(Wt, 3));
  box(p, x + 10, y + 22, 24, 4, col(PAL.ink, 1));
  disc(p, x + 22, y + 20, 3, 2, col(PAL.gold, 4));
  hline(p, x + 6, x + 38, y + 36, col(S, 4));
  const jacket = path().lines([x + 15, y + 40, x + 22, y + 46, x + 29, y + 40, x + 38, y + 46, x + 38, y + 118, x + 6, y + 118, x + 6, y + 46]).close();
  fillPath(p, jacket, col(Wt, 3));
  fillPath(p, path().lines([x + 29, y + 40, x + 38, y + 46, x + 38, y + 118, x + 32, y + 118]).close(), col(Wt, 2));
  for (let b = 0; b < 5; b++) box(p, x + 21, y + 54 + b * 12, 2, 2, col(PAL.gold, 4));
  box(p, x + 6, y + 44, 8, 3, col(PAL.navy, 2));
  box(p, x + 30, y + 44, 8, 3, col(PAL.navy, 2));
  [PAL.red, PAL.blue, PAL.yellow, PAL.green].forEach((r, k) => box(p, x + 9 + (k % 2) * 4, y + 56 + Math.floor(k / 2) * 3, 4, 2, col(r, 3)));
  box(p, x + 8, y + 118, 12, 40, col(Wt, 2));
  box(p, x + 24, y + 118, 12, 40, col(Wt, 2));
  const door = path().lines([x + LOCKERS.w, y - 4, x + LOCKERS.w + 16, y + 6, x + LOCKERS.w + 16, base - 4, x + LOCKERS.w, base + 4]).close();
  fillPath(p, door, col(PAL.sage, 2));
  for (let v = 0; v < 4; v++) seg(p, x + LOCKERS.w + 4, y + 14 + v * 6, x + LOCKERS.w + 13, y + 18 + v * 6, col(PAL.sage, 1));
  vline(p, x + LOCKERS.w + 16, y + 6, base - 4, col(PAL.sage, 0));
}

function bench(p: Pix): void {
  box(p, 262, 478, 164, 6, col(J, 4));
  box(p, 262, 484, 164, 5, col(J, 2));
  for (const x of [272, 412]) box(p, x, 489, 5, 22, col(S, 1));
  disc(p, 300, 468, 13, 11, col(PAL.white, 3));
  disc(p, 296, 464, 6, 4, col(PAL.white, 4));
  fillPath(p, path().lines([304, 462, 314, 466, 313, 474, 302, 472]).close(), col(PAL.glass, 3));
  box(p, 288, 476, 24, 3, col(PAL.ink, 1));
  disc(p, 424, 508, 18, 8, col(PAL.olive, 3));
  hline(p, 408, 440, 504, col(PAL.olive, 4));
}

function corkboard(p: Pix): void {
  const { x, y, w, h } = CORK;
  box(p, x, y, w, h, col(J, 2));
  box(p, x + 2, y + 2, w - 4, h - 4, col(J, 4));
  box(p, x + 6, y + 6, w - 12, h - 12, col(PAL.glove, 2));
  box(p, x + 6, y + 6, w - 12, h - 12, col(PAL.glove, 3), bayer(0.4));
  const skies = [PAL.dusk, PAL.sky, PAL.dawn, PAL.night, PAL.dusk, PAL.sea, PAL.sky, PAL.dawn, PAL.dusk];
  for (let i = 0; i < 9; i++) picture(p, x + 14 + (i % 3) * 48, y + 14 + Math.floor(i / 3) * 44 + ((i * 7) % 5) - 2, skies[i] ?? PAL.sky, i);
  box(p, x + w - 30, y + h - 26, 18, 14, col(PAL.white, 3));
  for (let l = 0; l < 3; l++) hline(p, x + w - 28, x + w - 14, y + h - 22 + l * 3, col(PAL.white, 1));
}

/** A placeholder photo: white border, a sky gradient, a horizon, sometimes a jet or a sun. */
function picture(p: Pix, x: number, y: number, sky: readonly number[], i: number): void {
  box(p, x, y, 38, 30, col(PAL.white, 3));
  box(p, x + 3, y + 3, 32, 12, col(sky, 3));
  box(p, x + 3, y + 9, 32, 8, col(sky, 5), bayer(0.5));
  box(p, x + 3, y + 17, 32, 9, col(i % 2 ? PAL.sea : PAL.olive, 2));
  if (i % 3 === 0) disc(p, x + 26, y + 15, 3, 3, col(PAL.lamp, 4));
  if (i % 3 === 1) fillPath(p, path().lines([x + 10, y + 10, x + 22, y + 8, x + 18, y + 11]).close(), col(PAL.navy, 1));
  if (i % 3 === 2) box(p, x + 8, y + 20, 14, 3, col(PAL.steel, 2));
  disc(p, x + 19, y + 1, 2, 2, col([PAL.red, PAL.yellow, PAL.blue][i % 3] ?? PAL.red, 3));
}

function fan(p: Pix): void {
  disc(p, FAN.x, FAN.y, FAN.r + 5, FAN.r + 5, col(S, 2));
  disc(p, FAN.x - 2, FAN.y - 2, FAN.r + 3, FAN.r + 3, col(S, 3), (c, r) => r < p.row(FAN.y) - (c & 1));
  disc(p, FAN.x, FAN.y, FAN.r, FAN.r, col(PAL.night, 0));
  for (const d of [-20, -10, 0, 10, 20]) hline(p, FAN.x - FAN.r + 4, FAN.x + FAN.r - 4, FAN.y + d, col(S, 1));
}

function extinguisher(p: Pix): void {
  box(p, 456, 448, 12, 34, col(PAL.red, 3));
  vline(p, 457, 450, 480, col(PAL.red, 4));
  box(p, 458, 442, 8, 6, col(PAL.ink, 1));
  seg(p, 466, 444, 472, 470, col(PAL.ink, 1));
}

export function paintRooms(p: Pix): void {
  recRoom(p);
  for (let i = 0; i < LOCKERS.n; i++) locker(p, i);
  ajar(p);
  bench(p);
  corkboard(p);
  fan(p);
  extinguisher(p);
}
