import { ellipse } from '../shapes';
import { drawCanopy, drawFrame, fillPath, frames, lazy, lines, makeCanopy, shape, strokePath, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { beacon, drawFin, navLights } from './parts';
import { prop } from './rotors';

/**
 * Tu-95 "Bear": slender fuselage with nose refuelling probe, 35° swept wing with fences, four nacelles
 * with contra-rotating props (inner ones extend into gear pods), tail gun turret; natural-metal greys.
 */

const BEAR_PAL: AirPal = {
  mono: false, live: true,
  base: '#b2b9be', camo: ['#a1a9af', '#c3c9cc'],
  dark: '#1a1d20', metal: '#666a6e', radome: '#50565b',
  outline: 'rgba(16,19,22,0.8)', panel: 'rgba(24,30,36,0.32)', hinge: 'rgba(18,24,30,0.55)', store: '#d8dad6',
};

const FUSE = [0, 41, 0.9, 40.7, 1.7, 40, 2.4, 38.8, 2.9, 37.2, 3.2, 35, 3.35, 32, 3.4, 25, 3.4, -10, 3.3, -20, 3, -28, 2.5, -34,
  1.9, -38, 1.3, -40.4, 0.6, -41.5, 0, -41.7];
const WING = [3.2, 9.5, 44.2, -19.2, 44.7, -19.9, 44.8, -23, 44.3, -24.2, 3.2, -9];
const INNER = [11, 10.4, 13.8, 10.4, 14.1, 6, 14.1, -10, 13.7, -17, 13, -21, 11.8, -21, 11.1, -17, 10.7, -10, 10.7, 6];
const OUTER = [22.5, 1.7, 25.1, 1.7, 25.3, -2, 25.2, -11, 24.6, -15.5, 23, -15.5, 22.4, -11, 22.3, -2];
const STAB = [2.6, -27, 13.6, -35.2, 13.9, -35.6, 13.9, -38, 2.2, -35];
/** Engine x and nacelle front y (props sit just ahead of it). */
const ENGINES = [12.4, 10.4, 23.8, 1.7];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [WING, INNER, OUTER, STAB]),
  camo: [
    shape([[5, 6, 10, 3, 10, -9.5, 5, -10], [-14.5, 0, -20, -4, -20, -13.5, -14.5, -12], [27, -11, 34, -15.8, 34, -19.8, 27, -17.5],
      [-36, -14.8, -42, -19, -42, -22.8, -36, -21.5], [-3.4, 20, 3.4, 20, 3.4, 12, -3.4, 12], [-3.4, -14, 3.4, -14, 3.3, -22, -3.3, -22],
      [-6, -30, -11, -33.5, -11, -37.3, -6, -36.2]]),
    shape([[-5, 6.5, -10, 3, -10, -9.5, -5, -10], [16, -0.2, 21, -3.7, 21, -14.8, 16, -13], [-27, -10.5, -32, -14, -32, -19.4, -27, -17.6],
      [38, -15.5, 43, -19, 43, -23.5, 38, -21.6], [-3.4, 30, 3.4, 30, 3.4, 24, -3.4, 24], [-3.4, -2, 3.4, -2, 3.4, -8, -3.4, -8],
      [5, -29, 9, -32, 9, -36.7, 5, -35.6]]),
  ],
  tubes: [
    { path: shape([sym(FUSE)]), x0: -3.4, x1: 3.4 },
    { path: shape([INNER]), x0: 10.7, x1: 14.1 }, { path: shape([mirror(INNER)]), x0: -14.1, x1: -10.7 },
    { path: shape([OUTER]), x0: 22.3, x1: 25.3 }, { path: shape([mirror(OUTER)]), x0: -25.3, x1: -22.3 },
  ],
  light: shape([], [[3.3, 8.8, 44.1, -19.7, 44.15, -20.4, 3.4, 7.9], [2.7, -27.6, 13.5, -35.6, 13.55, -36.2, 2.7, -28.4]]),
  shade: shape([[3.4, 9, 5.6, 6, 5.6, -9.6, 3.4, -9.1], [3, -27.3, 4.2, -28.4, 4.2, -35.6, 2.6, -35.2]], [
    [14.1, -2, 15.6, -4, 16.5, -12.8, 14.1, -11], [25.2, -8, 26.6, -10, 27.2, -17.5, 25, -14],
  ]),
  panels: lines([...frames(FUSE, [33, 28, 23, 18, 13, 8, 3, -2, -7, -12, -17, -22, -26, -31, -36]), [0, 20, 0, 18.4], [0, -5, 0, -6.6]], [
    [3.4, 3.8, 44, -20.6], [3.4, -2.6, 44, -22.3], [8.8, 6, 8.8, -10.9], [18, -0.9, 18, -14.4], [36, -14, 36, -21.4],
    [2.4, 30, 2.4, -25], [11, -12.4, 13.8, -12.4], [22.4, -9, 25.2, -9], [5, -30.2, 11, -34.9],
  ]),
  hinges: lines([], [[3.4, -6.67, 30, -16.5], [30.4, -17.3, 44, -22.3], [30.2, -16.6, 30.2, -19], [2.4, -33.4, 13.8, -36.8]]),
  fences: lines([], [[8, 6, 8, -9], [18.5, -1.3, 18.5, -12], [31, -10, 31, -17]]),
  fin: { body: shape([sym([0, -22, 0.45, -23.5, 0.6, -30, 0.6, -39.6, 0, -40])]), lit: shape([[0, -22, -0.45, -23.5, -0.6, -30, -0.6, -39.6, 0, -40]]),
    shade: shape([[0, -22, 0.45, -23.5, 0.6, -30, 0.6, -39.6, 0, -40]]), hinge: lines([[-0.6, -35, 0.6, -35]]) },
  nose: shape([sym([0, 41, 0.9, 40.7, 1.7, 40, 2.1, 39.4, 0, 39.4])]),
  spinner: shape([sym([0, 3.3, 0.45, 2.8, 0.9, 1.7, 1.15, 0.4, 1.15, 0, 0, 0])]),
  cockpit: makeCanopy([0, 38.9, 1.2, 38.7, 2.1, 38.1, 2.55, 37, 2.65, 35.9, 1.6, 35.4, 0, 35.3],
    [[-2.4, 37.4, 2.4, 37.4], [-2.6, 36.2, 2.6, 36.2], [0, 38.9, 0, 35.3], [-1.3, 38.6, -1.4, 35.4], [1.3, 38.6, 1.4, 35.4]],
    [-2.2, 37.2, -1.6, 38.1, -1.4, 37.8, -1.9, 36], [-0.9, 36.6, 0.9, 36.6]),
  turret: makeCanopy([0, -39.4, 1, -39.8, 1.25, -40.6, 1, -41.5, 0, -41.8], [[-1.2, -40.6, 1.2, -40.6]], [-0.9, -40, -0.5, -39.7, -0.6, -40.8], []),
}));

type Geo = ReturnType<typeof frame>;

function details(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo): void {
  strokePath(ctx, f.fences, 'rgba(10,12,14,0.5)', 0.35);
  ctx.translate(-0.3, 0);
  strokePath(ctx, f.fences, 'rgba(255,255,255,0.35)', 0.25);
  ctx.translate(0.3, 0);
  fillPath(ctx, f.nose, a.radome);
  ctx.fillStyle = '#3d4246';
  ctx.fillRect(-0.22, 34, 0.44, 11.4); // refuelling probe
  ctx.fillRect(-0.4, 45, 0.8, 0.5);
  ctx.fillRect(-0.55, -44.6, 0.3, 3.4); // tail cannons
  ctx.fillRect(0.25, -44.6, 0.3, 3.4);
  for (const s of [-1, 1]) ellipse(ctx, s * 3.05, -32, 0.55, 1.2, '#2a4655'); // gunner sighting blisters
  ellipse(ctx, 0, 30.5, 0.6, 0.6, '#2a4655'); // astrodome
  drawCanopy(ctx, a, f.cockpit);
  drawCanopy(ctx, a, f.turret);
}

function engines(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo, t: number): void {
  for (let i = 0; i < ENGINES.length; i += 2) {
    const x = ENGINES[i] ?? 0;
    const y = ENGINES[i + 1] ?? 0;
    for (const s of [-1, 1]) {
      prop(ctx, a, s * x, y + 1.5, 5.6, t + i * 0.13 + s * 0.07, 2, 4);
      ctx.translate(s * x, y);
      fillPath(ctx, f.spinner, a.metal);
      if (!a.mono) fillPath(ctx, f.spinner, tube(ctx, -1.15, 1.15));
      ctx.translate(-s * x, -y);
    }
  }
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  drawFrame(ctx, a, f);
  drawFin(ctx, a, f.fin);
  if (a.mono) return;
  details(ctx, a, f);
  navLights(ctx, a, 44.5, -21.8);
}

export const BEAR: AirArt = {
  pal: BEAR_PAL, box: [45.6, 46], body,
  over: (ctx, a, t) => {
    beacon(ctx, a, 0, 14, t);
    engines(ctx, a, frame(), t);
  },
};
