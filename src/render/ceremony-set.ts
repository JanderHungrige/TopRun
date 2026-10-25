import { deviceScale, SpriteCache } from './pixel/blit';
import { glow, rect, vgrad } from './pixel/fx';
import { PAL } from './pixel/palette';
import { path } from './pixel/path';
import { toCanvas } from './pixel/post';
import { bayer, checker, Pix, union } from './pixel/raster';

// Medal ceremony (doc 25): the carrier's flight deck at golden hour as one cached pixel-art layer — dusk sky
// with a low sun and lit cloud streaks, the sea, a distant escort, the island with lit bridge windows, a parked
// jet and the deck with its sheen, lines and tie-down rows. Frame units are logical pixels (1280 × 720); the art
// pixel is about 3 logical px (whole device pixels).

export const HORIZON = 300;
export const DECK_EDGE = 384;
export const SUN = { x: 330, y: 262, r: 27 } as const;

/** The scene's art grid: D device px and G logical px per art pixel. */
export interface Grid { D: number; G: number; W: number; H: number }

export function artGrid(ctx: CanvasRenderingContext2D): Grid {
  const s = deviceScale(ctx);
  const D = Math.max(2, Math.round(3 * s));
  const G = D / s;
  return { D, G, W: Math.ceil(1280 / G), H: Math.ceil(720 / G) };
}

const v = (ramp: readonly number[], i: number): number => ramp[i] ?? 0;
const D = PAL.dusk;

function sky(p: Pix): void {
  vgrad(p, [v(D, 1), v(D, 2), v(D, 3), v(D, 4), v(D, 5), v(D, 6)], 40, HORIZON, undefined, 5);
  glow(p, SUN.x, SUN.y, SUN.r * 1.35, D, 3, 0.9);
  p.paint(p.oval(SUN.x, SUN.y, SUN.r, SUN.r), v(D, 7));
  p.paint(p.oval(SUN.x - 5, SUN.y - 5, SUN.r * 0.62, SUN.r * 0.62), v(PAL.lamp, 5));
  const streaks: readonly (readonly [number, number, number, number])[] = [
    [120, 150, 150, 7], [520, 118, 210, 8], [930, 170, 190, 6], [700, 222, 260, 5], [230, 205, 120, 4], [1120, 120, 120, 5],
  ];
  for (const [x, y, w, h] of streaks) {
    p.paint(p.oval(x, y, w, h), v(D, 3));
    p.paint(p.oval(x + w * 0.08, y + h * 0.35, w * 0.86, h * 0.55), v(D, 5));
    p.paint(p.oval(x + w * 0.1, y + h * 0.6, w * 0.6, h * 0.3), v(D, 6), undefined, checker);
  }
}

function sea(p: Pix): void {
  const band = p.shape(path().rect(0, HORIZON, 1280, DECK_EDGE - HORIZON));
  const S = PAL.seaDusk;
  vgrad(p, [v(S, 5), v(S, 4), v(S, 3), v(S, 2)], HORIZON, DECK_EDGE, band, 4);
  rect(p, 0, HORIZON, 1280, 1.5, v(D, 6));
  for (let i = 0; i < 14; i++) {
    const y = HORIZON + 4 + i * i * 0.42;
    const w = 14 + i * 7;
    rect(p, SUN.x - w / 2 + ((i * 37) % 11) - 5, y, w, 1.5, v(D, i < 5 ? 7 : 6), undefined, i % 2 ? checker : undefined);
  }
  const ship = path().lines([840, 297, 905, 297, 900, 302, 846, 302]).close()
    .move(858, 297).lines([858, 291, 872, 291, 872, 288, 880, 288, 880, 297]).close();
  p.fill(ship, v(D, 2));
}

function island(p: Pix): void {
  const W = PAL.wall;
  rect(p, 1040, 214, 240, DECK_EDGE - 214, v(W, 2));
  rect(p, 1040, 214, 26, DECK_EDGE - 214, v(W, 4));
  rect(p, 1040, 214, 4, DECK_EDGE - 214, v(PAL.lamp, 2));
  rect(p, 1070, 150, 210, 64, v(W, 3));
  rect(p, 1070, 150, 4, 64, v(PAL.lamp, 2));
  rect(p, 1060, 206, 220, 8, v(W, 1));
  for (let x = 1084; x < 1270; x += 18) rect(p, x, 168, 12, 10, v(PAL.lamp, x % 36 < 18 ? 3 : 4));
  rect(p, 1070, 160, 210, 3, v(W, 1));
  for (let x = 1090; x < 1270; x += 46) rect(p, x, 236, 10, 14, v(W, 1));
  rect(p, 1100, 300, 30, 84, v(W, 1));
  rect(p, 1100, 300, 30, 3, v(PAL.lamp, 3));
  p.line(1160, 150, 1160, 66, v(W, 3));
  p.line(1161, 150, 1161, 66, v(W, 2));
  p.line(1124, 92, 1196, 92, v(W, 3));
  p.paint(p.oval(1214, 128, 14, 6, -0.3), v(W, 3));
  p.paint(p.oval(1214, 127, 10, 3, -0.3), v(W, 5));
  p.line(1206, 140, 1218, 128, v(W, 2));
  p.line(1124, 92, 1062, 150, v(W, 1));
}

/** A parked jet near the far deck edge, nose to the left, between the admiral and the right-hand crew. */
const JET = { x: 738, y: 390, s: 0.66 } as const;
const jx = (x: number): number => JET.x + (370 - x) * JET.s;
const jy = (y: number): number => JET.y + (y - 392) * JET.s;
const jpts = (pts: readonly number[]): number[] => pts.map((q, i) => (i % 2 === 0 ? jx(q) : jy(q)));

function jet(p: Pix): void {
  const S = PAL.steel;
  const body = path().move(jx(370), jy(392)).quad(jx(352), jy(378), jx(300), jy(376)).lines(jpts([150, 378, 70, 382, 62, 396, 160, 402, 300, 402]))
    .quad(jx(350), jy(402), jx(370), jy(392)).close();
  const fin = p.shape(path().lines(jpts([96, 380, 120, 318, 142, 318, 150, 380])).close());
  const wing = p.shape(path().lines(jpts([170, 390, 250, 390, 214, 410, 160, 408])).close());
  const m = p.shape(body);
  const edge = p.border(union(union(m, fin), wing));
  p.paint(fin, v(S, 3));
  p.paint(p.shape(path().lines(jpts([142, 318, 150, 380, 140, 380, 136, 318])).close()), v(PAL.lamp, 2), fin);
  p.paint(m, v(S, 3));
  p.paint(p.shape(path().lines(jpts([60, 378, 380, 378, 380, 386, 60, 386])).close()), v(S, 4), m);
  p.paint(p.shape(path().lines(jpts([60, 375, 380, 375, 380, 379, 60, 379])).close()), v(PAL.lamp, 3), m);
  p.paint(p.shape(path().lines(jpts([60, 396, 380, 396, 380, 404, 60, 404])).close()), v(S, 2), m);
  p.paint(p.border(m, 'd'), v(S, 0));
  p.paint(wing, v(S, 2));
  p.fill(path().move(jx(318), jy(378)).quad(jx(300), jy(362), jx(270), jy(370)).line(jx(262), jy(378)).close(), v(PAL.glass, 3));
  p.fill(path().move(jx(316), jy(377)).quad(jx(304), jy(366), jx(290), jy(368)).line(jx(300), jy(372)).close(), v(PAL.glass, 6));
  p.paint(edge, v(S, 0));
  for (const x of [120, 236, 340]) {
    p.line(jx(x), jy(402), jx(x), jy(413), v(S, 1));
    p.paint(p.oval(jx(x), jy(416), 4, 4), v(PAL.ink, 1));
  }
}

function deck(p: Pix): void {
  const W = PAL.wall;
  const m = p.shape(path().rect(0, DECK_EDGE, 1280, 720 - DECK_EDGE));
  vgrad(p, [v(W, 4), v(W, 3), v(W, 2), v(W, 1)], DECK_EDGE, 720, m, 6);
  const sheen = p.shape(path().lines([SUN.x - 22, DECK_EDGE, SUN.x + 22, DECK_EDGE, SUN.x + 150, 720, SUN.x - 110, 720]).close());
  p.paint(sheen, v(PAL.wall, 4), m, bayer(0.3));
  p.paint(p.shape(path().lines([SUN.x - 10, DECK_EDGE, SUN.x + 10, DECK_EDGE, SUN.x + 46, 560, SUN.x - 34, 560]).close()), v(PAL.jersey, 4), m, bayer(0.18));
  rect(p, 0, DECK_EDGE, 1280, 2, v(PAL.lamp, 2));
  for (let x = 6; x < 1280; x += 44) rect(p, x, DECK_EDGE - 10, 2, 10, v(W, 1));
  rect(p, 0, DECK_EDGE - 9, 1280, 1.5, v(W, 1));
  p.paint(p.thick([-40, 706, 1300, 452], 2.6), v(PAL.yellow, 2), m);
  for (let i = 0; i < 16; i++) p.paint(p.thick([i * 86, 476 - i * 5.2, i * 86 + 40, 476 - i * 5.2 - 2.4], 1.4), v(W, 5), m);
  for (const y of [404, 428, 458, 496, 544, 604, 676]) {
    const gap = 30 + (y - DECK_EDGE) * 0.28;
    for (let x = ((y * 7) % 23) - 10; x < 1280; x += gap) p.paint(p.oval(x, y, 1.6, 1), v(W, 1), m);
  }
}

const cache = new SpriteCache(4);

/** The static backdrop for a grid (cached). */
export function backdrop(g: Grid): HTMLCanvasElement | null {
  return cache.get(`${g.W}x${g.H}|${g.G.toFixed(4)}`, () => {
    const p = new Pix(g.W, g.H, 1 / g.G, 0, 0);
    sky(p);
    sea(p);
    island(p);
    deck(p);
    jet(p);
    return toCanvas(p);
  });
}
