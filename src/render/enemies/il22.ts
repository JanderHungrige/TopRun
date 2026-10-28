import { circle, ellipse } from '../shapes';
import { drawCanopy, drawFrame, fillPath, frames, lazy, lines, makeCanopy, shape, strokePath, sym, tube, type AirPal } from './kit';
import type { AirArt } from './layer';
import { beacon, drawFin, navLights } from './parts';
import { prop } from './rotors';

/**
 * Il-22 "Jammer" (doc 44): electronic-warfare turboprop — airliner fuselage, straight tapered wing with four
 * nacelles, a dark dielectric spine full of blade antennas and side-looking antenna fairings; the live art sends
 * out faint jamming rings.
 */

const JAMMER_PAL: AirPal = {
  mono: false, live: true,
  base: '#c4cace', camo: ['#aeb6bc'],
  dark: '#181b1e', metal: '#6a6e72', radome: '#4c5359',
  outline: 'rgba(16,19,22,0.8)', panel: 'rgba(24,30,36,0.3)', hinge: 'rgba(18,24,30,0.55)', store: '#d8dad6',
};

const FUSE = [0, 30, 1, 29.6, 1.9, 28.6, 2.5, 27, 2.8, 24.5, 2.9, 20, 2.9, -12, 2.6, -20, 2, -25, 1.2, -28.4, 0, -30];
const WING = [2.8, 6, 29.8, 2.2, 30.3, 1.5, 30.3, -0.9, 29.8, -1.6, 2.8, -4.6];
const NACELLE = (x: number, front: number): number[] =>
  [x - 1.2, front, x + 1.2, front, x + 1.45, front - 4, x + 1.3, -4, x + 0.8, -8.5, x - 0.8, -8.5, x - 1.3, -4, x - 1.45, front - 4];
const STAB = [2.4, -21.6, 11.2, -25.2, 11.4, -25.6, 11.4, -27.6, 2, -27];
const SIDE = [2.9, 16, 3.5, 15.4, 3.5, 8, 2.9, 7.4];
/** Engine x and nacelle front y (props sit just ahead of it). */
const ENGINES = [8.6, 10.2, 17.2, 9];

const frame = lazy(() => ({
  body: shape([sym(FUSE)], [WING, NACELLE(8.6, 10.2), NACELLE(17.2, 9), STAB, SIDE]),
  camo: [shape([[-2.9, 26, 2.9, 26, 2.9, 23, -2.9, 23], [3, 5, 29.6, 1.6, 29.6, 0.4, 3, 3.6], [-3, 5, -29.6, 1.6, -29.6, 0.4, -3, 3.6]])],
  tubes: [
    { path: shape([sym(FUSE)]), x0: -2.9, x1: 2.9 },
    ...ENGINES.flatMap((x, i) => (i % 2 ? [] : [
      { path: shape([NACELLE(x, ENGINES[i + 1] ?? 9)]), x0: x - 1.45, x1: x + 1.45 },
      { path: shape([NACELLE(x, ENGINES[i + 1] ?? 9).map((v, j) => (j % 2 ? v : -v))]), x0: -x - 1.45, x1: -x + 1.45 },
    ])),
  ],
  light: shape([], [[2.9, 5.4, 29.7, 1.9, 29.8, 1.2, 2.9, 4.6], [2.5, -22.2, 11.1, -25.5, 11.2, -26, 2.5, -22.9]]),
  shade: shape([], [[2.9, -4.4, 29.8, -1.4, 29.8, -1.9, 2.9, -5.2]]),
  panels: lines([...frames(FUSE, [26, 21, 16, 11, 6, 1, -4, -9, -14, -19, -24])], [
    [2.9, 1, 29.6, -0.2], [12.8, 4.5, 12.8, -3.2], [22.4, 3.2, 22.4, -2.3], [2.6, -23.4, 11.2, -26.4],
  ]),
  hinges: lines([], [[2.9, -3.2, 18, -1.8], [18.4, -1.6, 30, -0.6], [2.2, -26, 11.2, -27.2]]),
  spine: shape([sym([0, 22, 0.9, 21.6, 1.1, 20, 1.1, -14, 0.8, -16, 0, -16.4])]),
  fin: { body: shape([sym([0, -16, 0.4, -17.4, 0.55, -24, 0.55, -30.4, 0, -30.8])]), lit: shape([[0, -16, -0.4, -17.4, -0.55, -24, -0.55, -30.4, 0, -30.8]]),
    shade: shape([[0, -16, 0.4, -17.4, 0.55, -24, 0.55, -30.4, 0, -30.8]]), hinge: lines([[-0.55, -27, 0.55, -27]]) },
  nose: shape([sym([0, 30, 1, 29.6, 1.9, 28.6, 2.2, 27.8, 0, 27.8])]),
  spinner: shape([sym([0, 2.6, 0.4, 2.2, 0.8, 1.3, 0.95, 0.3, 0.95, 0, 0, 0])]),
  cockpit: makeCanopy([0, 27.6, 1, 27.4, 1.8, 26.9, 2.3, 26, 2.4, 25.2, 1.4, 24.8, 0, 24.7],
    [[-2.2, 26.2, 2.2, 26.2], [0, 27.6, 0, 24.7]], [-2, 26.1, -1.4, 26.9, -1.2, 26.6, -1.7, 25.2], [-0.8, 25.6, 0.8, 25.6]),
}));

type Geo = ReturnType<typeof frame>;

function details(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo): void {
  fillPath(ctx, f.nose, a.radome);
  fillPath(ctx, f.spine, '#2c3238');
  fillPath(ctx, f.spine, tube(ctx, -1.1, 1.1));
  ctx.fillStyle = '#1b1f23';
  for (const y of [18, 12, 6, 0, -6, -11]) ctx.fillRect(-0.18, y, 0.36, 2.2); // blade antennas
  for (const s of [-1, 1]) ellipse(ctx, s * 3.2, 11.7, 0.35, 3.6, '#3a4248'); // side-looking antenna fairings
  drawCanopy(ctx, a, f.cockpit);
}

function engines(ctx: CanvasRenderingContext2D, a: AirPal, f: Geo, t: number): void {
  for (let i = 0; i < ENGINES.length; i += 2) {
    const x = ENGINES[i] ?? 0;
    const y = ENGINES[i + 1] ?? 0;
    for (const s of [-1, 1]) {
      prop(ctx, a, s * x, y + 1.2, 4.4, t + i * 0.11 + s * 0.05, 1, 4);
      ctx.translate(s * x, y);
      fillPath(ctx, f.spinner, a.metal);
      if (!a.mono) fillPath(ctx, f.spinner, tube(ctx, -0.95, 0.95));
      ctx.translate(-s * x, -y);
    }
  }
}

/** Faint expanding rings: the jamming that blinds the radar and confuses missiles. */
function jamming(ctx: CanvasRenderingContext2D, t: number): void {
  const a0 = ctx.globalAlpha;
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1;
    ctx.globalAlpha = a0 * 0.35 * (1 - k);
    ctx.beginPath();
    ctx.arc(0, 4, 8 + k * 34, 0, Math.PI * 2);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = '#9ff0ff';
    ctx.stroke();
  }
  ctx.globalAlpha = a0;
  circle(ctx, 0, 4, 0.9, (t * 2) % 1 < 0.5 ? '#9ff0ff' : '#2a6f80');
}

function body(ctx: CanvasRenderingContext2D, a: AirPal): void {
  const f = frame();
  drawFrame(ctx, a, f);
  drawFin(ctx, a, f.fin);
  if (a.mono) return;
  details(ctx, a, f);
  strokePath(ctx, f.spine, 'rgba(0,0,0,0.4)', 0.2);
  navLights(ctx, a, 30, -0.4);
}

export const JAMMER: AirArt = {
  pal: JAMMER_PAL, box: [31.4, 31.6], body,
  over: (ctx, a, t) => {
    beacon(ctx, a, 0, -8, t);
    engines(ctx, a, frame(), t);
    if (a.live && !a.mono) jamming(ctx, t);
  },
};
