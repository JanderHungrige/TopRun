import { circle } from '../shapes';
import { exhaust } from './fx';
import { drawCanopy, drawFrame, fillPath, lazy, lines, makeCanopy, shape, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin, missile, navLights, nozzle, soot } from './parts';

/**
 * Su-27 "Flanker": long nose, curved LERX blending into a flat centre body, widely spaced nacelles,
 * tail "stinger", twin fins on outboard booms, wingtip missile rails; three-tone blue/grey splinter.
 */

const FLANKER_PAL: AirPal = {
  mono: false, live: true,
  base: '#adc0cb', camo: ['#7f9aae', '#5e778c'],
  dark: '#15191d', metal: '#5c5e62', radome: '#d6dcdc',
  outline: 'rgba(12,16,22,0.8)', panel: 'rgba(16,26,38,0.34)', hinge: 'rgba(12,20,30,0.6)', store: '#e4e5df',
};

const BODY = [0, 30, 0.55, 29.6, 1.05, 28.7, 1.5, 27.2, 1.9, 25.2, 2.2, 23, 2.4, 20.5, 2.5, 18, 2.9, 15, 3.6, 12, 4.6, 9, 5.9, 6,
  7.4, 3.2, 8.6, 1.2, 9.2, 0.4, 9.5, -1.5, 9.2, -14, 8.4, -15.2, 4.4, -16, 3, -17, 2, -19, 1.6, -22, 1.5, -27, 1.1, -28.5, 0, -28.9];
const SPINE = [0, 30, 1.05, 28.7, 1.9, 25.2, 2.4, 20.5, 2.5, 18, 2.4, 8, 2.2, -4, 2, -16, 1.6, -22, 1.5, -27, 1.1, -28.5, 0, -28.9];
const WING = [8.8, 1, 18.4, -7.6, 18.6, -8.1, 18.6, -11.7, 8.6, -13.8];
const NACELLE = [4, 4, 8.6, 2, 9, -14, 8, -21.6, 4.1, -21.6, 3.8, -14];
const STAB = [8.4, -16, 14.2, -21.6, 14.4, -22.1, 14.4, -23.6, 8.2, -24.6];
const BOOM = [8.4, -13, 9.3, -13, 9.2, -25.6, 8.6, -26.2, 8.2, -25];
const RAIL = [18.5, -5.2, 19.3, -5.6, 19.3, -12.2, 18.5, -12.2];
const FIN = [8.4, -8.5, 8.9, -9.5, 9, -25.8, 8.6, -26.4, 8.3, -25];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(BODY)], [WING, NACELLE, STAB, BOOM, RAIL]),
  camo: [
    shape([[-9, 2, -14, -2, -19, -8, -19, -12, -15, -12.5, -12, -6, -8, -3], [9, -4, 13, -2, 18, -6.5, 19, -11.5, 15, -11, 12, -8.5],
      [-2.5, 22, 0.5, 24, 2.5, 19, 1.5, 14, -1, 15, -2.5, 18], [-4, 4, 2, 8, 6, 4, 8, 0, 4, -4, -2, -2], [9, -17, 14, -21, 14.5, -24, 10, -24.5],
      [-8.5, -12, -4, -14, -3.5, -21.5, -8.2, -21.6], [-1.6, -18, 1.6, -21, 1.6, -25, -1.6, -24]]),
    shape([[-13, -3, -10, -1.5, -6, -6, -9, -13.5, -12, -13], [12, -1, 14.5, -3.5, 16, -6, 13.5, -9, 10.5, -6.5],
      [1, 13, 3.5, 12, 5, 8, 3, 6, 0, 9], [-6, -6, -2, -6, 1, -12, -3, -15, -7, -13], [3.5, -14, 8.6, -12, 8.4, -17, 4.2, -19],
      [-14.2, -21.6, -10, -18.5, -9, -24.6, -13, -23.8], [-6.5, 8, -4.5, 10, -3, 6, -5, 4.5]]),
  ],
  tubes: [
    { path: shape([sym(SPINE)]), x0: -2.5, x1: 2.5 },
    { path: shape([NACELLE]), x0: 3.8, x1: 9 },
    { path: shape([mirror(NACELLE)]), x0: -9, x1: -3.8 },
  ],
  light: shape([], [[8.9, 0.4, 18.3, -8, 18.35, -8.7, 9, -0.4], [8.6, -16.5, 14.1, -21.8, 14.15, -22.5, 8.6, -17.3],
    [2.6, 17, 3.6, 12, 4.6, 9, 5.9, 6, 7.4, 3.2, 8.6, 1.2, 8.3, 1, 7.1, 2.8, 5.6, 5.6, 4.3, 8.6, 3.3, 11.6, 2.4, 16]]),
  shade: shape([[9.2, 0.4, 10.4, -0.6, 10.4, -13.5, 9.2, -14], [9.2, -16.5, 10.2, -17.5, 10.2, -24.4, 9.2, -24.5]]),
  panels: lines([
    [-2.1, 24, 2.1, 24], [-2.5, 18, 2.5, 18], [-1.5, 11.8, 1.5, 11.8, 1.6, 6.4, -1.6, 6.4, -1.5, 11.8], [-1.5, -24, 1.5, -24],
    [-2.3, 1, 2.3, 1], [-2.1, -9, 2.1, -9],
  ], [
    [2.5, 18, 3, 4.2], [1.3, 12.8, 1.9, 4, 2, -10, 1.6, -17], [4, -2, 4, -21.6], [8.6, -2, 8.6, -14], [4, -17.5, 8.4, -17.5],
    [4.1, -20, 8.1, -20], [9.2, 0, 18.3, -8.2], [10, -4.5, 17.6, -9.6], [8.5, -17.8, 14.2, -22.6], [5.2, 2.6, 7.8, 1.6],
  ]),
  hinges: lines([], [[8.8, -11.56, 18.4, -9.5], [13.6, -10.5, 13.6, -12.8], [8.5, -21, 9.1, -21]]),
  fin: { body: shape([], [FIN]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([], [[8.4, -21.5, 9, -21.5]]) },
  radome: shape([sym([0, 30, 0.55, 29.6, 1.05, 28.7, 1.5, 27.2, 1.9, 25.2, 2.1, 24, 0, 24])]),
  canopy: makeCanopy(
    [0, 22.6, 0.8, 22.2, 1.35, 21.2, 1.7, 19.6, 1.8, 17.6, 1.65, 15.4, 1.25, 13.8, 0.6, 13, 0, 12.8],
    [[-1.5, 20.9, 1.5, 20.9], [-0.6, 22.5, -0.85, 20.9], [0.6, 22.5, 0.85, 20.9]],
    [-1.35, 20.4, -0.85, 21, -0.8, 17.2, -1.05, 14.6, -1.5, 16.8],
    [0, 17.2],
  ),
}));

function nose(ctx: CanvasRenderingContext2D, a: AirPal, radome: Path2D): void {
  fillPath(ctx, radome, a.radome);
  if (a.mono) return;
  fillPath(ctx, radome, tube(ctx, -2.1, 2.1));
  ctx.fillStyle = '#55585a';
  ctx.fillRect(-0.13, 29.8, 0.26, 2.4); // pitot
  circle(ctx, -0.6, 23.3, 0.5, '#1c2a31'); // IRST ball, starboard of the windscreen
  circle(ctx, -0.74, 23.45, 0.17, 'rgba(255,255,255,0.7)');
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  for (const s of [-1, 1]) {
    missile(ctx, a, s * 11.6, 3.6, 10.6, 0.55);
    missile(ctx, a, s * 15.2, -1.4, 7.6, 0.46);
  }
  drawFrame(ctx, a, f);
  for (const s of [-1, 1]) {
    soot(ctx, a, s * 6.05, -21.5, 2, 4.5);
    nozzle(ctx, a, s * 6.05, -21.5, 1.85, 2.5);
    missile(ctx, a, s * 19.75, -3, 7.6, 0.46);
  }
  nose(ctx, a, f.radome);
  drawFin(ctx, a, f.fin);
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 18.2, -9.4);
}

export const FLANKER: AirArt = {
  pal: FLANKER_PAL, box: [21.8, 33], body,
  under: (ctx, a, t) => {
    if (a.live) for (const s of [-1, 1]) exhaust(ctx, s * 6.05, -24, 3.6, 0.4, t + s * 0.2);
  },
};
