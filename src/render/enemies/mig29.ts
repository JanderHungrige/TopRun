import { circle } from '../shapes';
import { exhaust } from './fx';
import { blobs, drawCanopy, drawFrame, fillPath, lazy, lines, makeCanopy, shape, strokePath, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin, missile, navLights, nozzle, soot } from './parts';

/** MiG-29 "Fulcrum": long curved LERX with louvred auxiliary intakes, widely spaced nacelles, canted twin fins, two-tone grey. */

const FULCRUM_PAL: AirPal = {
  mono: false, live: true,
  base: '#a3abae', camo: ['#6e7b7a', '#88939a'],
  dark: '#16191b', metal: '#5f6062', radome: '#d3d5cc',
  outline: 'rgba(14,17,19,0.8)', panel: 'rgba(20,26,30,0.36)', hinge: 'rgba(14,18,22,0.6)', store: '#e2e3dc',
};

const BODY = [0, 23.5, 0.5, 23.2, 0.95, 22.4, 1.3, 21, 1.6, 19, 1.85, 16.5, 2, 14, 2.15, 12.5, 2.6, 10, 3.4, 7.5, 4.5, 5, 5.8, 3,
  7.2, 1.4, 7.8, 0.6, 8, -2, 7.6, -11, 3.2, -11, 2.6, -14, 2.4, -19, 1.6, -21, 0, -21.3];
const SPINE = [0, 23.5, 0.95, 22.4, 1.6, 19, 2, 14, 2.2, 8, 2.3, 0, 2.4, -19, 1.6, -21, 0, -21.3];
const WING = [7.4, 1, 15.2, -6, 15.5, -6.6, 15.5, -8.8, 15.2, -9.3, 7.4, -11.3];
const NACELLE = [3.3, 4, 7.3, 2, 7.4, -12, 6.9, -19.4, 3.4, -19.4, 3, -12];
const STAB = [6.9, -12.8, 10.8, -17.4, 10.95, -17.8, 10.95, -19.2, 6.9, -20];
const FIN = [5.75, -3.5, 6.25, -5.5, 7.05, -14.8, 7.1, -21.3, 6.45, -21.3, 5.75, -18.5];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(BODY)], [WING, NACELLE, STAB]),
  camo: [
    blobs([-11.5, -6.5, 4.6, 2.2, 0.7, 1, 10.5, -7.5, 4.2, 2, -0.55, 2, -2.2, 4.5, 1.8, 5.5, 0.45, 3, 4.8, -4.5, 2, 5, 0.2, 4,
      -5.2, -14, 2, 4, -0.25, 5, 9.2, -17.8, 2.4, 1.3, -0.75, 6, 1, 14.6, 1.1, 2.4, 0.15, 7, -9.6, -18.6, 1.8, 1.2, 0.7, 8, 1.6, -16.5, 1.2, 3, 0, 9]),
    blobs([-4.8, 3.6, 2.8, 1.8, -0.5, 10, 13.6, -5.4, 2, 1.2, 0.8, 11]),
  ],
  tubes: [
    { path: shape([sym(SPINE)]), x0: -2.4, x1: 2.4 },
    { path: shape([NACELLE]), x0: 3, x1: 7.4 },
    { path: shape([mirror(NACELLE)]), x0: -7.4, x1: -3 },
  ],
  light: shape([], [[7.5, 0.5, 15.1, -6.2, 15.15, -6.9, 7.6, -0.3], [7, -13.2, 10.75, -17.5, 10.8, -18.1, 7, -14]]),
  shade: shape([[7.4, 1, 8.7, -0.2, 8.7, -11, 7.4, -11.3], [7.1, -13, 8.1, -14, 8.1, -19.9, 7.1, -20]]),
  panels: lines([
    [-1.72, 17.8, 1.72, 17.8], [-2.05, 13.4, 2.05, 13.4], [-2.3, -1, 2.3, -1], [-2.5, -15, 2.5, -15],
  ], [
    [1, 8.8, 1.5, 2, 1.6, -8, 1.2, -14], [3.3, 4, 3.2, -11, 3.4, -19.4], [3, -13, 7.35, -13], [3.2, -16.5, 7.1, -16.5],
    [7.8, 0.1, 15, -6.5], [8.2, -2.5, 14.2, -7.4], [9.5, -3.4, 9.5, -9.6], [0.4, -15, 1.9, -15, 1.9, -19.5, 0.4, -19.5],
    [4.2, 0.5, 6.4, 0.5, 6.4, -4.5, 4.2, -4.5, 4.2, 0.5], [2.15, 12.5, 2.3, 5],
  ]),
  hinges: lines([], [[7.6, -9.45, 11.6, -8.43], [11.8, -8.77, 15.1, -7.93], [11.7, -8.5, 11.7, -10.2], [6.9, -14.2, 10.9, -18.6]]),
  louvres: lines([], [[3, 8, 3.7, 8], [3, 7.3, 4, 7.3], [3.1, 6.6, 4.3, 6.6], [3.2, 5.9, 4.6, 5.9], [3.3, 5.2, 4.9, 5.2]]),
  fin: { body: shape([], [FIN]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([], [[6.3, -17.4, 7.1, -17.4]]) },
  radome: shape([sym([0, 23.5, 0.5, 23.2, 0.95, 22.4, 1.3, 21, 1.6, 19, 1.72, 17.8, 0, 17.8])]),
  canopy: makeCanopy(
    [0, 17.2, 0.7, 16.9, 1.2, 16, 1.5, 14.4, 1.55, 12.6, 1.4, 10.8, 1, 9.4, 0.4, 8.8, 0, 8.7],
    [[-1.3, 15.8, 1.3, 15.8], [-0.5, 17, -0.75, 15.8], [0.5, 17, 0.75, 15.8]],
    [-1.15, 15.3, -0.75, 15.7, -0.7, 12.6, -0.95, 10.6, -1.3, 12.6],
    [0, 13],
  ),
}));

type Geo = ReturnType<typeof frame>;

function nose(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo): void {
  fillPath(ctx, f.radome, a.radome);
  if (a.mono) return;
  fillPath(ctx, f.radome, tube(ctx, -1.7, 1.7));
  ctx.fillStyle = '#55585a';
  ctx.fillRect(-0.13, 23.3, 0.26, 2.9); // pitot
  circle(ctx, -0.6, 17.5, 0.45, '#1c2a31'); // IRST ball, starboard of the windscreen
  circle(ctx, -0.72, 17.62, 0.15, 'rgba(255,255,255,0.7)');
  strokePath(ctx, f.louvres, 'rgba(8,10,12,0.6)', 0.3);
  ctx.translate(0, -0.22);
  strokePath(ctx, f.louvres, 'rgba(255,255,255,0.28)', 0.18);
  ctx.translate(0, 0.22);
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  for (const s of [-1, 1]) {
    missile(ctx, a, s * 9.2, 3.6, 10.6, 0.55);
    missile(ctx, a, s * 13.2, -1.6, 7.6, 0.45);
  }
  drawFrame(ctx, a, f);
  for (const s of [-1, 1]) {
    soot(ctx, a, s * 5.1, -19.3, 1.9, 4);
    nozzle(ctx, a, s * 5.1, -19.3, 1.7, 2.3);
  }
  nose(ctx, a, f);
  drawFin(ctx, a, f.fin);
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 15.35, -7.8);
}

export const FULCRUM: AirArt = {
  pal: FULCRUM_PAL, box: [16.5, 27], body,
  under: (ctx, a, t) => {
    if (a.live) for (const s of [-1, 1]) exhaust(ctx, s * 5.1, -21.6, 3.3, 0.45, t + s * 0.15);
  },
};
