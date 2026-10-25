import { PAL } from '../pixel/palette';
import { path } from '../pixel/path';
import { bayer, checker, type Pix } from '../pixel/raster';
import { box, col, disc, fillPath, hline, lightPath, relight, seg, shade, vline } from './paint';
import { DOOR, JET, LAMPS, LAMP_Y, PILLARS, ROOF_Y, VP, WALL_BASE } from './layout';

// Hangar base (doc 30): the building — roof truss, corrugated back wall with girts and a steel dado, I-beam
// pillars, hanging lamps, the polished concrete floor with joints, markings and stains, and finally the light:
// lamp cones, pools on the floor and the low dusk sun shaft coming in through the open door.

const N = PAL.navy;
const S = PAL.steel;
const W = PAL.wall;

function roof(p: Pix): void {
  box(p, 0, 0, 1280, ROOF_Y + 4, col(PAL.night, 1));
  for (const y of [22, 46, 68]) hline(p, 0, 1280, y, col(N, 1));
  box(p, 0, 8, 1280, 5, col(S, 1));
  hline(p, 0, 1280, 8, col(S, 3));
  for (let x = 0; x < 1280; x += 64) {
    seg(p, x, 13, x + 32, ROOF_Y - 8, col(S, 2), 2);
    seg(p, x + 32, ROOF_Y - 8, x + 64, 13, col(S, 2), 2);
    vline(p, x + 32, 13, ROOF_Y - 8, col(S, 1));
  }
  box(p, 0, ROOF_Y - 8, 1280, 9, col(S, 2));
  hline(p, 0, 1280, ROOF_Y - 8, col(S, 4));
  hline(p, 0, 1280, ROOF_Y, col(S, 0));
  for (let x = 16; x < 1280; x += 32) box(p, x, ROOF_Y - 5, 2, 2, col(S, 4));
}

function wall(p: Pix): void {
  const top = p.row(ROOF_Y + 1);
  const bottom = p.row(440);
  const ribs = [col(N, 3), col(N, 2), col(N, 2), col(N, 1)];
  for (let r = top; r < bottom; r++) {
    for (let c = 0; c < p.w; c++) p.data[r * p.w + c] = ribs[c % 4] ?? 0;
  }
  for (const y of [ROOF_Y + 1, 296]) {
    box(p, 0, y, 1280, 7, col(S, 2));
    hline(p, 0, 1280, y, col(S, 4));
    hline(p, 0, 1280, y + 7, col(N, 0));
  }
  box(p, 0, 440, 1280, WALL_BASE - 440, col(S, 2));
  hline(p, 0, 1280, 440, col(S, 4));
  for (let x = 40; x < 1280; x += 80) {
    vline(p, x, 442, WALL_BASE - 8, col(S, 1));
    for (const y of [448, 484]) box(p, x + 5, y, 2, 2, col(S, 4));
  }
  box(p, 0, WALL_BASE - 8, 1280, 8, col(S, 1));
  hline(p, 0, 1280, WALL_BASE - 8, col(S, 3));
}

function pillar(p: Pix, x: number): void {
  box(p, x, ROOF_Y - 8, 14, WALL_BASE - ROOF_Y + 8, col(S, 3));
  vline(p, x, ROOF_Y - 8, WALL_BASE, col(S, 4));
  box(p, x + 5, ROOF_Y, 4, WALL_BASE - ROOF_Y, col(S, 2));
  vline(p, x + 13, ROOF_Y - 8, WALL_BASE, col(S, 1));
  for (let y = ROOF_Y + 14; y < WALL_BASE - 10; y += 26) {
    box(p, x + 1, y, 2, 2, col(S, 5));
    box(p, x + 11, y, 2, 2, col(S, 5));
  }
  box(p, x - 4, WALL_BASE - 6, 22, 6, col(S, 2));
  hline(p, x - 4, x + 18, WALL_BASE - 6, col(S, 4));
}

function floor(p: Pix): void {
  const rows: readonly [number, number][] = [[WALL_BASE, 3], [548, 2], [640, 1]];
  for (const [i, [y, shadeI]] of rows.entries()) {
    const y1 = rows[i + 1]?.[0] ?? 720;
    box(p, 0, y, 1280, y1 - y, col(W, shadeI));
    box(p, 0, y1 - 8, 1280, 8, col(W, Math.max(1, shadeI - 1)), bayer(0.5));
  }
  for (let x = -480; x <= 1760; x += 160) {
    const xf = VP.x + ((x - VP.x) * (720 - VP.y)) / (WALL_BASE - VP.y);
    seg(p, x, WALL_BASE, xf, 720, col(W, 1));
  }
  for (const y of [532, 584, 664]) hline(p, 0, 1280, y, col(W, 1));
  hline(p, 0, 1280, WALL_BASE, col(W, 0));
  markings(p);
}

function markings(p: Pix): void {
  const Y = PAL.yellow;
  fillPath(p, path().lines([1166, WALL_BASE, 1178, WALL_BASE, 1132, 720, 1112, 720]).close(), col(Y, 2));
  fillPath(p, path().lines([1166, 580, 1150, 592, 560, 592, 560, 586, 1150, 586]).close(), col(Y, 2));
  box(p, 1016, 576, 6, 22, col(Y, 2));
  for (const [x, y, rx] of [[760, 560, 46], [620, 612, 30], [930, 690, 40]] as const) {
    disc(p, x, y, rx, rx * 0.22, col(W, 0), bayer(0.5));
    disc(p, x + 4, y, rx * 0.5, rx * 0.12, col(W, 0));
  }
  for (let x = 120; x < 1280; x += 240) {
    for (const y of [556, 624, 700]) box(p, x + (y % 3) * 20, y, 4, 2, col(W, 0));
  }
  const down = (v: number): number => shade(v, -1);
  disc(p, JET.cx, JET.ground + 2, JET.w * 0.5, 10, down, bayer(0.5));
  disc(p, JET.cx, JET.ground + 1, JET.w * 0.38, 6, down);
}

function lamp(p: Pix, x: number): void {
  vline(p, x, ROOF_Y, LAMP_Y - 12, col(S, 1));
  fillPath(p, path().lines([x - 6, LAMP_Y - 12, x + 6, LAMP_Y - 12, x + 15, LAMP_Y - 2, x - 15, LAMP_Y - 2]).close(), col(S, 3));
  hline(p, x - 6, x + 6, LAMP_Y - 12, col(S, 5));
  hline(p, x - 15, x + 15, LAMP_Y - 2, col(PAL.lamp, 3));
}

/** The light: lamp cones and floor pools, the door's sun shaft. Run last, so it falls on everything. */
function light(p: Pix): void {
  const up = (v: number): number => shade(v, 1);
  for (const x of LAMPS) {
    lightPath(p, path().lines([x - 13, LAMP_Y, x + 13, LAMP_Y, x + 118, WALL_BASE, x - 118, WALL_BASE]).close(), 1, bayer(0.25));
    disc(p, x, 548, 150, 30, up, bayer(0.5));
    disc(p, x, 546, 96, 17, up);
  }
  const shaft = path().lines([DOOR.x, WALL_BASE, DOOR.x + DOOR.w, WALL_BASE, 1150, 720, 820, 720]).close();
  lightPath(p, shaft, 1, bayer(0.5));
  lightPath(p, path().lines([DOOR.x + 20, WALL_BASE, DOOR.x + DOOR.w - 30, WALL_BASE, 1080, 720, 930, 720]).close(), 1, checker);
  relight(p, DOOR.x - 6, DOOR.y, 6, DOOR.h, 1);
}

/** The building, before the rooms and props are painted into it. */
export function paintShell(p: Pix): void {
  roof(p);
  wall(p);
  floor(p);
}

/** Pillars and lamps go over the rooms; the light goes over everything. */
export function paintShellFront(p: Pix): void {
  for (const x of PILLARS) pillar(p, x);
  for (const x of LAMPS) lamp(p, x);
  light(p);
}
