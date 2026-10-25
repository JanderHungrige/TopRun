import { blobs, drawCanopy, drawFrame, frames, lazy, lines, makeCanopy, shape, strokePath, sym, type AirPal } from './kit';
import type { AirArt } from './layer';
import { drawFin } from './parts';
import { prop } from './rotors';

/** Loitering attack drone: cropped-delta wing with tip fins, seeker nose, rear engine with a pusher prop. */

const DRONE_PAL: AirPal = {
  mono: false, live: true,
  base: '#6f746c', camo: ['#5d6259', '#878d84'],
  dark: '#181a18', metal: '#4b4e4b', radome: '#9a9f97',
  outline: 'rgba(12,14,12,0.8)', panel: 'rgba(14,16,14,0.42)', hinge: 'rgba(10,12,10,0.6)', store: '#c9ccc4',
};

const FUSE = [0, 12.2, 0.6, 11.9, 1.1, 11.1, 1.45, 9.8, 1.6, 8, 1.6, -3, 1.9, -4.2, 1.95, -7.2, 1.7, -8.4, 0.9, -8.9, 0, -9];
const WING = [1.4, 7, 12.2, -4, 12.6, -4.6, 12.6, -6.4, 1.6, -7.4];
const FIN = [12.3, -1.5, 12.9, -2.2, 13, -7.6, 12.4, -7.4];
const mirror = (p: readonly number[]): number[] => p.map((v, i) => (i % 2 ? v : -v));

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [WING]),
  camo: [blobs([6.5, -2.5, 3.2, 1.6, -0.8, 1, -7.5, -4.6, 3, 1.5, 0.75, 2, 0.3, 4.5, 1.2, 3, 0, 3]), shape([[-2, 9, 2, 9, 2, 13, -2, 13]])],
  tubes: [{ path: shape([sym(FUSE)]), x0: -1.95, x1: 1.95 }],
  light: shape([], [[1.5, 6.4, 12.1, -4.3, 12.15, -4.9, 1.6, 5.6]]),
  shade: shape([[1.6, 7, 2.7, 5.6, 2.7, -7.3, 1.6, -7.4]]),
  panels: lines([...frames(FUSE, [9, 3, -3]), [-0.5, 1.6, 0.5, 1.6, 0.5, 0.6, -0.5, 0.6, -0.5, 1.6]], [
    [1.8, 5.2, 11.4, -4.6], [1.8, -1.4, 12.4, -5.1], [5.4, 2.2, 5.4, -6.8], [9, -1.6, 9, -6.4],
  ]),
  hinges: lines([], [[3, -6, 12.4, -5.15], [7.3, -5.6, 7.3, -7]]),
  grille: lines(frames(FUSE, [-4.6, -5.4, -6.2, -7], 0.4)),
  fin: { body: shape([], [FIN]), lit: shape([mirror(FIN)]), shade: shape([FIN]), hinge: lines([]) },
  seeker: makeCanopy([0, 12.2, 0.6, 11.9, 1, 11.2, 0.7, 10.7, 0, 10.6], [], [-0.55, 11.6, -0.3, 11.9, -0.2, 11.2, -0.5, 11], []),
}));

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  drawFrame(ctx, a, f);
  drawFin(ctx, a, f.fin);
  if (!a.mono) {
    strokePath(ctx, f.grille, 'rgba(8,10,8,0.6)', 0.3);
    ctx.fillStyle = '#d8dbd2';
    ctx.fillRect(-0.45, 0.65, 0.9, 0.9); // satnav antenna patch
    drawCanopy(ctx, a, f.seeker);
  }
  ctx.fillStyle = a.metal;
  ctx.fillRect(-0.7, -9.8, 1.4, 1);
}

export const DRONE: AirArt = {
  pal: DRONE_PAL, box: [14, 13.5], body,
  over: (ctx, a, t) => prop(ctx, a, 0, -9.9, 4.9, t, 1, 2),
};
