import { circle } from '../shapes';
import { blobs, drawCanopy, drawFrame, fillPath, frames, lazy, lines, makeCanopy, shape, strokePath, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { beacon, drawFin, pod } from './parts';
import { mainRotor, tailRotor } from './rotors';

/**
 * Mi-24 "Hind": stepped tandem "double bubble" cockpits, twin engines with domed intake filters,
 * stub wings with rocket pods and wingtip missile tubes, tail rotor on the port side; sand/olive/brown.
 */

const HIND_PAL: AirPal = {
  mono: false, live: true,
  base: '#b49e69', camo: ['#646b3f', '#7a6243'],
  dark: '#1b1c17', metal: '#5b564d', radome: '#8e8c7c',
  outline: 'rgba(20,18,12,0.8)', panel: 'rgba(30,26,14,0.4)', hinge: 'rgba(22,18,10,0.6)', store: '#9b9e94',
};

const FUSE = [0, 21, 0.7, 20.8, 1.2, 20.2, 1.5, 19.2, 1.65, 17.5, 1.75, 15.5, 2, 14, 2.2, 12, 2.35, 9, 2.4, 4, 2.4, -2, 2.2, -6,
  1.6, -9, 1.05, -11, 0.85, -16, 0.7, -22, 0.6, -26.2, 0.5, -27, 0, -27.2];
const ENGINE = [0.8, 6.5, 2.4, 7.4, 3.2, 6.4, 3.3, 1, 3, -3.5, 2.5, -5.2, 0.9, -5];
const WING = [2.2, 1.2, 9.6, 0.4, 9.8, -3, 2.3, -4];
const ENDPLATE = [9.4, 1.6, 10.2, 1.6, 10.2, -3.6, 9.4, -3.6];
const STAB = [0.7, -19.2, 4.2, -19.8, 4.3, -21.3, 0.7, -21.3];
const DUCT = [2.4, -3, 3.8, -4.4, 3.7, -6.6, 2.1, -5.8];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [ENGINE, WING, ENDPLATE, STAB, DUCT]),
  camo: [
    blobs([-1.4, 12, 1.6, 4, 0.1, 1, 1.6, -1, 1.5, 4.2, -0.2, 2, -6.5, -1.6, 2.6, 1.4, 0.1, 3, 0.4, -14, 0.8, 2.6, 0, 4, 2.8, -20.4, 1.4, 0.8, 0, 5, 7.6, -1.2, 1.6, 1.3, 0.3, 6]),
    blobs([1.2, 15.5, 1, 2.2, 0, 7, -1.3, 3.5, 1.2, 3, 0.2, 8, 4.6, -1.8, 1.8, 1.2, 0, 9, -0.3, -22, 0.7, 2.2, 0, 10, -2.6, -20.5, 1.3, 0.8, 0, 11]),
  ],
  tubes: [
    { path: shape([sym(FUSE)]), x0: -2.4, x1: 2.4 },
    { path: shape([ENGINE]), x0: 0.8, x1: 3.3 },
    { path: shape([mirror(ENGINE)]), x0: -3.3, x1: -0.8 },
  ],
  light: shape([], [[2.3, 1, 9.6, 0.25, 9.6, -0.4, 2.3, 0.3]]),
  shade: shape([[2.3, 1.2, 3.8, 1.1, 3.8, -3.9, 2.3, -4], [0.7, -19.2, 1.5, -19.3, 1.5, -21.3, 0.7, -21.3]]),
  panels: lines([...frames(FUSE, [14.2, 7.6, -6.2, -12.5, -17, -22.5]), [0, 7.6, 0, 5.2], [0, -12.5, 0, -15]], [
    [1.6, 7.5, 1.7, -5], [1.1, 5.5, 2.9, 5.5], [1.1, 2, 3.2, 2], [1.1, -2, 3, -2], [4.6, 0.9, 4.6, -3.7], [7.2, 0.6, 7.2, -3.3],
  ]),
  hinges: lines([], [[0.7, -20.6, 4.25, -20.8]]),
  fin: { body: shape([sym([0, -22.4, 0.38, -23.4, 0.45, -28.4, 0.3, -29.2, 0, -29.3])]), lit: shape([[0, -22.4, -0.38, -23.4, -0.45, -28.4, -0.3, -29.2, 0, -29.3]]),
    shade: shape([[0, -22.4, 0.38, -23.4, 0.45, -28.4, 0.3, -29.2, 0, -29.3]]), hinge: lines([]) },
  duct: shape([], [[2.75, -3.9, 3.55, -4.7, 3.5, -6.1, 2.55, -5.6]]),
  fan: lines([[-1, -3.6, 1, -3.6], [0, -2.5, 0, -4.7], [-0.7, -2.9, 0.7, -4.3], [-0.7, -4.3, 0.7, -2.9]]),
  gunner: makeCanopy([0, 19.6, 0.9, 19.2, 1.35, 18.2, 1.45, 16.8, 1.3, 15.4, 0.8, 14.8, 0, 14.7],
    [[-1.4, 17.2, 1.4, 17.2], [0, 19.6, 0, 14.7]], [-1.15, 17.9, -0.75, 18.9, -0.55, 18.6, -0.9, 16], [0, 16.6]),
  pilot: makeCanopy([0, 13.6, 1.1, 13.3, 1.75, 12.2, 1.9, 10.5, 1.75, 8.8, 1.2, 8.1, 0, 7.9],
    [[-1.85, 11, 1.85, 11], [0, 13.6, 0, 11], [-1.6, 9, 1.6, 9]], [-1.5, 12, -0.95, 13, -0.75, 12.6, -1.35, 10.2], [0, 10.4]),
}));

type Geo = ReturnType<typeof frame>;

function stores(ctx: CanvasRenderingContext2D, a: AirPal): void {
  ctx.fillStyle = a.dark;
  ctx.fillRect(-0.3, 20.2, 0.6, 2.6); // chin gun barrels
  for (const s of [-1, 1]) {
    pod(ctx, a, s * 4.9, 3.8, 6.4, 0.8);
    pod(ctx, a, s * 7.4, 3.6, 6.2, 0.78);
  }
}

function engines(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo): void {
  for (const s of [-1, 1]) {
    pod(ctx, a, s * 10.6, 2.9, 6, 0.42, '#5e6648'); // wingtip missile tubes
    circle(ctx, s * 1.85, 6.6, 1.2, a.radome); // dust-filter domes
    circle(ctx, s * 1.85, 6.6, 0.75, 'rgba(0,0,0,0.22)');
    circle(ctx, s * 1.85 - 0.35, 6.95, 0.35, 'rgba(255,255,255,0.35)');
  }
  fillPath(ctx, f.duct, a.dark);
  fillPath(ctx, f.duct, tube(ctx, -3.6, 3.6));
  circle(ctx, 0, -3.6, 1.15, '#2a2b24'); // oil-cooler fan
  strokePath(ctx, f.fan, 'rgba(140,140,120,0.5)', 0.18);
  ctx.fillStyle = a.dark;
  ctx.fillRect(-1.75, -6.6, 0.7, 0.9); // APU exhaust
  for (const s of [-1, 1]) ctx.fillRect(s * 2.05 - 0.3, 18, 0.6, 1.8); // nose sensor fairings
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  stores(ctx, a);
  drawFrame(ctx, a, f);
  drawFin(ctx, a, f.fin);
  if (a.mono) return;
  engines(ctx, a, f);
  drawCanopy(ctx, a, f.gunner);
  drawCanopy(ctx, a, f.pilot);
}

function rotors(ctx: CanvasRenderingContext2D, a: AirPal, t: number): void {
  beacon(ctx, a, 0, -10.5, t);
  tailRotor(ctx, a, 1.15, -27.6, 5, t * 47);
  ctx.translate(0, 0.5);
  mainRotor(ctx, a, 23, t * 26, 5);
  ctx.translate(0, -0.5);
}

export const HIND: AirArt = { pal: HIND_PAL, box: [11.6, 30], body, over: rotors };
