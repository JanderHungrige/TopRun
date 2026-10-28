import { exhaust } from './fx';
import { drawCanopy, drawFrame, fillPath, lazy, lines, makeCanopy, shape, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin, missile, navLights, nozzle, soot } from './parts';

/**
 * MiG-25 "Foxbat" (doc 44): slim nose ahead of two huge box intakes, a wide flat body, shoulder wings with a
 * straight 40° leading edge, twin fins, two big nozzles and four long R-40 missiles; plain air-superiority grey.
 */

const FOXBAT_PAL: AirPal = {
  mono: false, live: true,
  base: '#b8bdbf', camo: ['#9fa6aa'],
  dark: '#141618', metal: '#5f6062', radome: '#c9cdc9',
  outline: 'rgba(14,16,18,0.8)', panel: 'rgba(20,26,32,0.32)', hinge: 'rgba(14,20,26,0.6)', store: '#e6e6df',
};

const BODY = [0, 28, 0.6, 27.4, 1.2, 26, 1.6, 23.6, 1.9, 20, 2.05, 15.5, 2.1, 13, 6.3, 12.4, 6.7, 11.2, 6.7, 4, 6.6, -6, 6.3, -17,
  5.8, -22, 5.6, -24.2, 0, -24.2];
const WING = [6.5, 3.2, 18, -9.6, 18.2, -10, 18.2, -13.6, 6.4, -12];
const STAB = [6, -15.4, 11.8, -22.2, 12, -22.6, 12, -24.8, 5.8, -24.4];
const FIN = [4.6, -10.6, 5.3, -11.6, 5.5, -26, 5.1, -26.6, 4.7, -25.4];
const INTAKE = [2.1, 12.6, 6.3, 12.2, 6.6, 11.2, 2.2, 11.6];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(BODY)], [WING, STAB]),
  camo: [shape([[2.4, 10, 6.4, 9.6, 6.4, 3, 2.4, 3], [-2.4, -4, -6.4, -4, -6.2, -15, -2.4, -15]])],
  tubes: [
    { path: shape([sym([0, 28, 1.2, 26, 1.9, 20, 2.1, 13, 2.1, 0, 0, 0])]), x0: -2.1, x1: 2.1 },
    { path: shape([sym([0, 12, 6.6, 11.6, 6.6, -6, 6.2, -18, 5.6, -24, 0, -24])]), x0: -6.7, x1: 6.7 },
  ],
  light: shape([], [[6.6, 2.6, 17.8, -9.8, 17.9, -10.6, 6.6, 1.8], [5.9, -16, 11.6, -22.4, 11.7, -23, 5.9, -16.8]]),
  shade: shape([[6.7, 1.6, 7.6, 0.8, 7.6, -11.7, 6.6, -12], [6, -17, 7, -18, 7, -24.4, 5.9, -24.4]]),
  panels: lines([
    [-1.9, 20, 1.9, 20], [-6.6, 6, 6.6, 6], [-6.6, -2, 6.6, -2], [-6.5, -10, 6.5, -10], [-6.2, -18, 6.2, -18],
  ], [
    [2.2, 11.6, 2.4, -20], [6.6, 4, 17.4, -9.4], [9.6, -0.2, 9.6, -11.6], [6.2, -16.2, 11.4, -22.3], [4.4, 11, 4.4, -4],
  ]),
  hinges: lines([], [[6.4, -11.8, 18.2, -13.3], [12.6, -12.6, 12.6, -10.6], [5.9, -23.4, 12, -24.3]]),
  fin: { body: shape([], [FIN]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([], [[4.8, -22.5, 5.4, -22.5]]) },
  intake: shape([], [INTAKE]),
  radome: shape([sym([0, 28, 0.6, 27.4, 1.2, 26, 1.6, 23.6, 1.75, 22, 0, 22])]),
  canopy: makeCanopy(
    [0, 20.4, 0.7, 20, 1.15, 19, 1.35, 17.4, 1.3, 15.6, 1, 14.4, 0.5, 13.9, 0, 13.8],
    [[-1.25, 18.8, 1.25, 18.8], [0, 20.3, 0, 18.8]],
    [-1.05, 18.4, -0.65, 18.9, -0.6, 16.6, -0.85, 14.8, -1.15, 16.2],
    [0, 16.6],
  ),
}));

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  for (const s of [-1, 1]) {
    missile(ctx, a, s * 10.4, 0.6, 11.4, 0.7);
    missile(ctx, a, s * 14.6, -4.2, 10.6, 0.65);
  }
  drawFrame(ctx, a, f);
  fillPath(ctx, f.intake, a.dark);
  if (!a.mono) fillPath(ctx, f.intake, tube(ctx, -6.6, 6.6));
  for (const s of [-1, 1]) {
    soot(ctx, a, s * 3.1, -24.1, 2.7, 4.8);
    nozzle(ctx, a, s * 3.1, -24.1, 2.65, 2.6);
  }
  fillPath(ctx, f.radome, a.radome);
  if (!a.mono) fillPath(ctx, f.radome, tube(ctx, -1.75, 1.75));
  drawFin(ctx, a, f.fin);
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 18, -11.8);
}

export const FOXBAT: AirArt = {
  pal: FOXBAT_PAL, box: [19.6, 29.8], body,
  under: (ctx, a, t) => {
    if (a.live) for (const s of [-1, 1]) exhaust(ctx, s * 3.1, -27, 4.6, 0.55, t + s * 0.17);
  },
};
