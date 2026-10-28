import { exhaust } from './fx';
import { drawCanopy, drawFrame, fillPath, frames, lazy, lines, makeCanopy, shape, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { beacon, drawFin, missile, navLights, nozzle, soot } from './parts';

/**
 * Tu-22M "Backfire" (doc 44, mini-boss): long-nosed swing-wing bomber — big box intakes, a fixed wing glove, outer
 * wings at mid sweep, two engines side by side in the tail under a tall fin, Kh-22 missiles under the gloves.
 */

const BACKFIRE_PAL: AirPal = {
  mono: false, live: true,
  base: '#c3c8c5', camo: ['#a6aeac', '#d5d9d6'],
  dark: '#15181a', metal: '#5e6264', radome: '#596056',
  outline: 'rgba(14,17,19,0.8)', panel: 'rgba(22,28,32,0.32)', hinge: 'rgba(16,22,26,0.55)', store: '#e0e1da',
};

const FUSE = [0, 42, 0.9, 41.4, 1.8, 39.8, 2.5, 37.4, 3, 34, 3.2, 30, 3.3, 24.4, 6.4, 23, 6.8, 21, 6.8, -26, 6, -31, 4.6, -34.4,
  4.2, -38, 0, -38];
const GLOVE = [6.8, 15, 12.8, 4.6, 12.8, -2.8, 6.8, -5];
const WING = [12.6, 4.4, 33.4, -13.6, 33.8, -14.2, 33.8, -19.8, 12.6, -5.4];
const STAB = [5.8, -26.4, 17.2, -33.2, 17.4, -33.8, 17.4, -36.4, 5.2, -35.6];
const INTAKE = [3.3, 24.4, 6.4, 23, 6.6, 22, 3.4, 23];
const FIN = [0, -10, 0.6, -12.4, 0.85, -24, 0.85, -42, 0, -42.6];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [GLOVE, WING, STAB]),
  camo: [
    shape([[-6.8, 18, 6.8, 18, 6.8, 10, -6.8, 10], [14, 0, 24, -6.6, 24, -10.2, 14, -4], [-14, 0, -24, -6.6, -24, -10.2, -14, -4],
      [-6.8, -12, 6.8, -12, 6.8, -20, -6.8, -20], [7, -28, 12, -31, 12, -35, 7, -35]]),
    shape([[-3, 34, 3, 34, 3.2, 28, -3.2, 28], [26, -11, 33, -16.2, 33.4, -18.4, 26, -14.2], [-26, -11, -33, -16.2, -33.4, -18.4, -26, -14.2]]),
  ],
  tubes: [
    { path: shape([sym(FUSE)]), x0: -6.8, x1: 6.8 },
    { path: shape([sym([0, 42, 1.8, 39.8, 3, 34, 3.3, 24, 0, 24])]), x0: -3.3, x1: 3.3 },
  ],
  light: shape([], [[12.7, 3.8, 33.3, -14, 33.4, -14.8, 12.8, 2.8], [6.9, 14.4, 12.6, 4.4, 12.6, 3.6, 6.9, 13.2],
    [5.9, -26.9, 17.1, -33.5, 17.2, -34.1, 5.9, -27.7]]),
  shade: shape([[6.8, -4.6, 8.4, -5.6, 8.4, -26, 6.8, -26]], [[12.8, -4.8, 14.2, -6, 14.2, -10, 12.8, -8]]),
  panels: lines([...frames(FUSE, [36, 30, 24, 16, 8, 0, -8, -16, -24, -30])], [
    [3.3, 23, 3.6, -30], [6.8, 8, 12.6, 0.2], [12.8, -0.4, 33.4, -16.8], [20, -3.4, 20, -10.8], [5.6, -29, 17.2, -34.6],
  ]),
  hinges: lines([], [[12.8, -5, 33.6, -19.4], [21.4, -12.4, 21.4, -9.4], [5.2, -34.8, 17.4, -36]]),
  fin: { body: shape([sym(FIN)]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([[-0.85, -36, 0.85, -36]]) },
  intake: shape([], [INTAKE]),
  radome: shape([sym([0, 42, 0.9, 41.4, 1.8, 39.8, 2.4, 37.6, 0, 37.6])]),
  canopy: makeCanopy(
    [0, 35.6, 1.3, 35.2, 2.2, 34.2, 2.6, 32.6, 2.6, 30.4, 2.2, 29, 1.2, 28.4, 0, 28.3],
    [[-2.5, 33.4, 2.5, 33.4], [-2.6, 31, 2.6, 31], [0, 35.6, 0, 28.3]],
    [-2.2, 33, -1.5, 34.6, -1.3, 32.6, -1.9, 30],
    [-0.9, 32.2, 0.9, 32.2, -0.9, 29.8, 0.9, 29.8],
  ),
}));

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  for (const s of [-1, 1]) missile(ctx, a, s * 9.6, 9, 14, 0.95);
  drawFrame(ctx, a, f);
  fillPath(ctx, f.intake, a.dark);
  for (const s of [-1, 1]) {
    soot(ctx, a, s * 2.9, -38, 2.6, 5);
    nozzle(ctx, a, s * 2.9, -38, 2.5, 2.4);
  }
  fillPath(ctx, f.radome, a.radome);
  if (!a.mono) fillPath(ctx, f.radome, tube(ctx, -2.4, 2.4));
  drawFin(ctx, a, f.fin);
  if (a.mono) return;
  ctx.fillStyle = '#33383b';
  ctx.fillRect(-0.3, -44.6, 0.6, 2.6); // tail cannon
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 33.6, -17);
}

export const BACKFIRE: AirArt = {
  pal: BACKFIRE_PAL, box: [35, 45.4], body,
  under: (ctx, a, t) => {
    if (a.live) for (const s of [-1, 1]) exhaust(ctx, s * 2.9, -40.6, 4.4, 0.5, t + s * 0.19);
  },
  over: (ctx, a, t) => beacon(ctx, a, 0, 6, t),
};
