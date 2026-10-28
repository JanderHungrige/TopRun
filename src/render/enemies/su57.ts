import { exhaust } from './fx';
import { drawCanopy, drawFrame, fillPath, lazy, lines, makeCanopy, shape, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin, navLights, nozzle, soot } from './parts';

/**
 * Su-57 "Felon" (doc 44): stealth fighter — chined nose flowing into wide leading-edge root extensions, a flat
 * blended body with the engines set apart, small canted fins, everything carried inside; dark grey splinter.
 */

const FELON_PAL: AirPal = {
  mono: false, live: true,
  base: '#6f7b87', camo: ['#4e5865', '#8c97a2'],
  dark: '#111417', metal: '#4d5156', radome: '#5e6873',
  outline: 'rgba(8,10,14,0.85)', panel: 'rgba(10,14,20,0.36)', hinge: 'rgba(8,12,18,0.6)', store: '#cfd2d0',
};

const BODY = [0, 28.4, 0.7, 27.6, 1.4, 26, 2.1, 23.6, 2.8, 20.4, 3.6, 16.8, 4.8, 13.2, 6.6, 9.6, 8.6, 6.6, 9.4, 5, 9.6, 2, 9.6, -14,
  9, -17, 6.6, -19.2, 5.4, -21.8, 5.2, -24, 1.6, -24, 1.4, -20.4, 0, -21.6];
const WING = [9.4, 4.4, 19, -8, 19.3, -8.8, 19.3, -11.6, 9.6, -13.6];
const STAB = [8.6, -16, 14, -21.4, 14.3, -21.8, 14.3, -24.2, 8.2, -23.6];
const FIN = [6.6, -10.4, 7.4, -11.4, 8.1, -21, 7.4, -21.9, 6.8, -20];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(BODY)], [WING, STAB]),
  camo: [
    shape([[2, 21, 4, 16, 6.5, 10, 3, 9, 0.5, 14], [-5, 6, -9.5, 3, -9.5, -6, -4, -3], [10, -1, 16, -6.6, 17, -10.4, 11, -10],
      [-12, -3, -18, -8.4, -18.6, -11.2, -12.5, -10], [3, -8, 8, -10, 8.6, -16, 4, -18], [-9, -17.6, -13.5, -21.6, -13.8, -23.8, -8.6, -23]]),
    shape([[-1.5, 19, -3.8, 15.5, -5.6, 11, -2.4, 10.6], [5, 5, 9, 3, 9.4, -4, 4.4, -2], [-10, 2.6, -14, -2, -15.4, -5.6, -10.4, -6],
      [12.5, -9.6, 18.8, -9.4, 19, -11.2, 12, -11.4], [-6, -10, -2, -12, -2.2, -17, -6, -18.6], [9.4, -17.4, 13, -21, 9, -22.6]]),
  ],
  tubes: [
    { path: shape([sym([0, 28.4, 1.4, 26, 2.8, 20.4, 3.2, 12, 3, 0, 2.4, -14, 1.5, -20.4, 0, -21.6])]), x0: -3.2, x1: 3.2 },
    { path: shape([[3.6, 0, 6.8, 0, 6.8, -19, 5.4, -21.8, 5.2, -24, 1.6, -24, 1.8, -14]]), x0: 1.6, x1: 6.8 },
    { path: shape([mirror([3.6, 0, 6.8, 0, 6.8, -19, 5.4, -21.8, 5.2, -24, 1.6, -24, 1.8, -14])]), x0: -6.8, x1: -1.6 },
  ],
  light: shape([], [[9.6, 3.8, 18.9, -8.4, 19, -9, 9.7, 2.8], [8.6, -16.6, 13.9, -21.7, 14, -22.3, 8.6, -17.4],
    [2.8, 20.4, 3.6, 16.8, 4.8, 13.2, 6.6, 9.6, 8.6, 6.6, 8.3, 6.2, 6.3, 9.2, 4.5, 12.8, 3.3, 16.4, 2.5, 20]]),
  shade: shape([[9.6, 2, 10.8, 1, 10.8, -13.2, 9.6, -13.8], [9, -17, 10, -18, 10, -23.8, 8.6, -23.6]]),
  panels: lines([
    [-2.6, 21.6, 2.6, 21.6], [-3.2, 10.5, 3.2, 10.5], [-1.4, -5.6, 1.4, -5.6, 1.4, -12.6, -1.4, -12.6, -1.4, -5.6],
  ], [
    [3.6, 8, 3.6, -10], [6.8, 4, 6.8, -18.4], [9.6, 1, 18.6, -8.6], [12.6, -2.6, 12.6, -12.4], [8.6, -17, 13.8, -22],
    [4.4, -1.6, 6, -1.6, 6, -12, 4.4, -12, 4.4, -1.6],
  ]),
  hinges: lines([], [[9.6, -12, 19.3, -10.6], [8.4, -22.2, 14.3, -23.4], [4.2, 13.6, 7.6, 7.8]]),
  fin: { body: shape([], [FIN]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([], [[7, -18, 8, -18]]) },
  nose: shape([sym([0, 28.4, 0.7, 27.6, 1.4, 26, 2, 24, 0, 24])]),
  canopy: makeCanopy(
    [0, 22.4, 0.8, 22, 1.3, 21, 1.55, 19.2, 1.55, 17.2, 1.3, 15.6, 0.8, 14.6, 0, 14.3],
    [[-1.5, 20.6, 1.5, 20.6], [0, 22.3, 0, 20.6]],
    [-1.25, 20.1, -0.8, 20.8, -0.75, 18, -1, 15.8, -1.4, 17.6],
    [0, 18.2],
  ),
}));

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  drawFrame(ctx, a, f);
  for (const s of [-1, 1]) {
    soot(ctx, a, s * 3.4, -24, 1.9, 4);
    nozzle(ctx, a, s * 3.4, -24, 1.85, 2.2);
  }
  fillPath(ctx, f.nose, a.radome);
  if (!a.mono) fillPath(ctx, f.nose, tube(ctx, -2, 2));
  drawFin(ctx, a, f.fin);
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 19.1, -10.2);
}

export const FELON: AirArt = {
  pal: FELON_PAL, box: [20.6, 30], body,
  under: (ctx, a, t) => {
    if (a.live) for (const s of [-1, 1]) exhaust(ctx, s * 3.4, -26.6, 3.4, 0.4, t + s * 0.23);
  },
};
