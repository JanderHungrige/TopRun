import { exhaust } from './fx';
import { blobs, drawCanopy, drawFrame, fillPath, lazy, lines, makeCanopy, shape, strokePath, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin, missile, navLights, nozzle, soot } from './parts';

/** MiG-21 "Fishbed": nose intake with shock cone, 57° delta wing with fences, three-tone desert camouflage. */

const FISHBED_PAL: AirPal = {
  mono: false, live: true,
  base: '#b9a374', camo: ['#87693f', '#6b734a'],
  dark: '#1b1d1a', metal: '#6c645b', radome: '#525a4b',
  outline: 'rgba(18,15,10,0.8)', panel: 'rgba(30,22,12,0.38)', hinge: 'rgba(22,16,10,0.6)', store: '#dedcd2',
};

const FUSE = [0, 18.9, 1.45, 18.7, 1.75, 17.2, 2.05, 15, 2.3, 12, 2.45, 8, 2.55, 3, 2.6, -4, 2.6, -12, 2.5, -16, 2.35, -18.9, 0, -18.9];
const WING = [2.3, 3.4, 11.3, -10.9, 11.45, -11.2, 11.45, -13, 2.4, -14.4];
const STAB = [2.2, -14.6, 6.6, -19.2, 6.75, -19.5, 6.75, -20.5, 2.3, -19.9];
const FIN_R = [0, -6.5, 0.35, -7.5, 0.5, -10, 0.55, -17, 0.62, -19.5, 0.62, -21.6, 0, -21.8];
const FIN_L = FIN_R.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [WING, STAB]),
  camo: [
    blobs([6.8, -6, 4.2, 2.2, -0.95, 1, -0.4, 9, 2, 4.6, 0.2, 2, -7.8, -9.4, 3.8, 2, 0.9, 3, 1, -14.8, 3.2, 1.8, 0.4, 4, -4.6, -19, 2.4, 1.2, -0.6, 5, 3.8, 1.6, 2, 1.5, 0.5, 6]),
    blobs([-4.2, -3.2, 3.4, 1.8, 0.95, 7, 1.4, -1.2, 1.7, 4, -0.1, 8, 9.2, -11.4, 2.2, 1.4, 0, 9, -1.6, -11.2, 1.6, 3.2, 0.25, 10, -1, 15, 1.4, 2.6, 0.1, 11, 5.4, -18, 1.6, 1.1, -0.7, 12]),
  ],
  tubes: [{ path: shape([sym(FUSE)]), x0: -2.6, x1: 2.6 }],
  light: shape([], [[2.4, 2.6, 11.2, -10.95, 11.3, -11.7, 2.5, 1.4], [2.3, -15.2, 6.55, -19.3, 6.6, -19.8, 2.3, -16]]),
  shade: shape([[2.5, 2.2, 3.7, 0.4, 3.9, -14.3, 2.5, -14.4], [2.3, -15, 3.2, -15.8, 3.2, -19.9, 2.3, -19.9]]),
  panels: lines([
    [-2, 15.6, 2, 15.6], [-2.28, 12.6, 2.28, 12.6], [-2.55, 3, 2.55, 3], [-2.6, -1.6, 2.6, -1.6], [-2.6, -6.5, 2.6, -6.5],
    [-2.6, -11, 2.6, -11], [-2.45, -14.6, 2.45, -14.6], [-2.4, -17.4, 2.4, -17.4],
    [-1.2, -2.4, -0.4, -2.4, -0.4, -4.8, -1.2, -4.8, -1.2, -2.4], [0.5, -7.6, 1.5, -7.6, 1.5, -9.8, 0.5, -9.8, 0.5, -7.6],
    [-1.4, 14.4, -0.6, 14.4, -0.6, 13.4, -1.4, 13.4, -1.4, 14.4],
  ], [
    [1.55, 15.6, 1.75, 3], [1.9, 3, 1.95, -14.6], [0.85, 3.6, 0.95, -4, 0.6, -10.5],
    [3.3, -4, 5.4, -6.4, 5.4, -10.2, 3.3, -10.2], [2.6, -6.2, 10.8, -12.1], [2.4, -16.6, 6.5, -20.1],
  ]),
  hinges: lines([], [[2.5, -12.78, 7.3, -12.04], [7.4, -12.33, 11.45, -11.7], [7.35, -12.1, 7.35, -13.65]]),
  fences: lines([], [[6.1, -2.4, 6.1, -12.2], [8.6, -6.4, 8.6, -12.4]]),
  fin: { body: shape([sym(FIN_R)]), lit: shape([FIN_L]), shade: shape([FIN_R]), hinge: lines([[-0.6, -17.6, 0.6, -17.6]]) },
  cone: shape([sym([0, 21.2, 0.35, 20.9, 0.75, 20.1, 1.05, 19.2, 1.1, 18.5, 0, 18.3])]),
  canopy: makeCanopy(
    [0, 10.6, 0.75, 10.3, 1.15, 9.4, 1.32, 7.8, 1.3, 6, 1.1, 4.6, 0.6, 3.8, 0, 3.6],
    [[-1.12, 9.3, 1.12, 9.3], [0, 10.55, 0, 9.3], [-1.18, 4.9, 1.18, 4.9]],
    [-0.95, 8.9, -0.6, 9.3, -0.55, 7.2, -0.8, 5.3, -1.1, 6.6],
    [0, 7.2],
  ),
}));

function intake(ctx: CanvasRenderingContext2D, a: AirPal, f: ReturnType<typeof frame>): void {
  if (!a.mono) {
    ctx.fillStyle = a.dark;
    ctx.fillRect(-1.45, 18.5, 2.9, 0.45);
    ctx.fillStyle = '#4a4740';
    ctx.fillRect(-1.05, 18.2, 0.28, 5.2); // pitot boom, offset to starboard
    ctx.fillRect(-1.45, 22.2, 1.08, 0.22);
  }
  fillPath(ctx, f.cone, a.radome);
  if (!a.mono) fillPath(ctx, f.cone, tube(ctx, -1.1, 1.1));
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  for (const s of [-1, 1]) missile(ctx, a, s * 6.6, 1.4, 8, 0.45);
  drawFrame(ctx, a, f);
  soot(ctx, a, 0, -18.85, 2.3, 4.5);
  nozzle(ctx, a, 0, -18.85, 2.25, 1.9);
  intake(ctx, a, f);
  drawFin(ctx, a, f.fin);
  if (a.mono) return;
  strokePath(ctx, f.fences, 'rgba(10,8,6,0.5)', 0.32);
  ctx.translate(-0.28, 0);
  strokePath(ctx, f.fences, 'rgba(255,250,235,0.3)', 0.22);
  ctx.translate(0.28, 0);
  drawCanopy(ctx, a, f.canopy);
  navLights(ctx, a, 11.35, -12.1);
}

export const FISHBED: AirArt = {
  pal: FISHBED_PAL, box: [12.5, 24.5], body,
  under: (ctx, a, t) => {
    if (a.live) exhaust(ctx, 0, -20.6, 3.6, 0.3, t);
  },
};
