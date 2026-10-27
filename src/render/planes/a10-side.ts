import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, farFin, sliver } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * A-10 side view, nose right, origin = main-gear deck contact. Blunt nose with the GAU-8 barrels under it, bubble
 * canopy, low straight wing with the gear pods, engine pod on a pylon high over the rear fuselage, twin fins reaching
 * above and below the tailplane. Engine exhaust at x = -31.
 */

const TOP: Pts = [54, -13.5, 53.4, -15.6, 52, -17.4, 50, -18.8, 47, -20.0, 43, -20.8, 38, -21.2, 26, -21.6, 18, -22.0, 4, -22.2,
  -10, -21.8, -24, -21.0, -36, -20.0, -44, -19.4, -50, -18.9, -53, -18.4];
const BOTTOM: Pts = [54, -13.5, 53.4, -11.6, 52, -10.0, 49, -8.6, 44, -7.8, 36, -7.4, 20, -7.2, 4, -7.4, -10, -8.4, -22, -10.8,
  -34, -13.8, -44, -15.8, -50, -16.9, -53, -17.4];
const CANOPY: Pts = [38, -21.2, 36.6, -25.0, 33.6, -27.4, 29.6, -28.2, 26.2, -27.6, 23.8, -25.6, 22.6, -21.8];
const NACELLE: Pts = [-6, -29, -6.6, -32.2, -8.4, -33.6, -26, -33.4, -29.6, -32.0, -30.6, -29.0, -29.6, -26.4, -26, -25.0, -8.4, -24.6,
  -6.6, -25.8];
const PYLON: Pts = [-12, -24.8, -23, -24.8, -24.6, -21.2, -11, -21.8];
const FIN: Pts = [-41.5, -19, -43, -34, -45.6, -40.8, -49.4, -42.0, -52.6, -40.2, -54, -32, -54, -14, -52.8, -11.4, -49.6, -10.8,
  -46.4, -12.4, -44.2, -15.6];
const FIN_Q: Pts = [-42.4, -21, -45.6, -40.6, -52.6, -40.2, -54, -21];
const STAB: Pts = [-34, -19.6, -50, -19.4, -55.4, -18.6, -50, -17.8, -34, -18.4];
const WING: Pts = [16, -10.4, 4, -11.2, -8, -11.2, -9, -10.2, 4, -9.8, 16, -9.6];
const POD: Pts = [17.6, -9.4, 18.6, -7.6, 17.4, -5.8, 6, -5.8, 5.4, -8.2, 7, -9.6];
const shift = (p: Pts, dx: number, dy: number): Pts => p.map((v, i) => (i % 2 === 0 ? v + dx : v + dy));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'a10-side', clip: polys(body, NACELLE, PYLON, FIN), box: bounds(body, NACELLE, FIN), cell: 10,
    under: polys([58, -13.8, 30, -13.6, 0, -13.8, -30, -15.6, -58, -17.6, -58, 2, 58, 2]),
    twoTone: polys([22, -22.0, -44, -19.6, -44, -17.2, -20, -18.2, 0, -19.0, 22, -19.4]),
    radome: polys([54, -13.5, 53.4, -15.6, 52, -17.4, 50, -18.8, 49.4, -19.1, 49.4, -8.4, 52, -10.0, 53.4, -11.6]),
    band: { x: 45.4, y: -22, w: 2.4, h: 16 },
    nose: { x: 34, y: -24, w: 22, h: 18, dir: 'y', out: 1 },
    stripes: [[51, -15.4, 6, -12, -40, -30]],
    trim: [[48, -16, 0, -16.4, -44, -17.6], [49.4, -19.1, 49.4, -8.4]],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const far: Fin = { path: polys(shift(FIN, 2.4, -1)), q: shift(FIN_Q, 2.4, -1) };
  const shades = [
    { path: polys(band(TOP, -1, 2.2)), color: 'rgba(255,255,255,0.15)', gloss: true },
    { path: polys(band(BOTTOM, -3.2, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys([-8.4, -33.4, -26, -33.2, -28, -32.4, -26, -31.4, -8.4, -31.4]), color: 'rgba(255,255,255,0.16)', gloss: true },
    { path: polys([-8.4, -27.4, -26, -27.4, -29.6, -26.4, -26, -25.0, -8.4, -24.6]), color: 'rgba(0,0,0,0.16)' },
    { path: polys([-43, -34, -45.6, -40.8, -47, -41.4, -44.6, -34]), color: 'rgba(255,255,255,0.12)', gloss: true },
  ];
  const panels = lines([[49.4, -19.1, 49.4, -8.4], [38, -21.2, 38, -7.4], [18, -22.0, 18, -7.2], [0, -22.2, 0, -7.2],
    [-16, -21.8, -16, -8.0], [-32, -20.6, -32, -10.2], [44, -14, 4, -14.4, -40, -15.6], [-12, -29.0, -26, -29.0],
    [-11.4, -33.5, -11.4, -24.7], [-22, -33.4, -22, -24.9]]);
  const hinges = lines([[-46.6, -40.6, -46.4, -12.0], [-50, -18.6, -55, -18.6]]);
  return {
    surface, fin, far, shades, panels, hinges, canopy: polys(CANOPY), wing: polys(WING),
    wingEdge: lines([[16, -10.4, 4, -11.2, -8, -11.2]]), stab: polys(STAB), stabEdge: lines([[-34, -19.6, -50, -19.4, -55.4, -18.6]]),
    pod: polys(POD), intake: polys([-6, -29, -6.6, -32.2, -7.6, -33.0, -7.6, -25.0, -6.6, -25.8]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  ctx.fillRect(22, -22.6, 16, 1.6); // sill
  ctx.beginPath();
  ctx.moveTo(25.2, -21.6);
  ctx.lineTo(25.8, -26.6);
  ctx.lineTo(28.0, -26.8);
  ctx.lineTo(28.6, -21.6);
  ctx.fill(); // seat headrest
  helmet(ctx, 31, -25.2, 1.9, '#4a515b', '#1d2126');
  ctx.fillRect(35, -24.8, 0.8, 2.4); // HUD
}

/** GAU-8: seven barrels sticking out under the nose, the drum behind them hidden in the fuselage. */
function gau8(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2c3036';
  ctx.fillRect(52, -12.4, 6.6, 2.4);
  ctx.fillStyle = '#7a828b';
  ctx.fillRect(52, -12.0, 6.4, 0.5);
  ctx.fillRect(52, -11.0, 6.4, 0.4);
  ctx.fillStyle = '#16181c';
  ctx.fillRect(58.2, -12.4, 0.5, 2.4);
}

export function drawA10Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  gearLeg(ctx, 44, -7.8, 2.4, o.gear, { door: l.under, doorSide: 1 });
  farFin(ctx, l, g.far, 14);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 14);
  panelLines(ctx, l, g.panels, g.hinges);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.intake);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  ctx.fillStyle = l.under;
  ctx.fill(g.pod);
  stroke(ctx, g.pod, l.ink, 0.45);
  for (const x of [10, 2]) missileSide(ctx, x, -6.6, 10, 0.9);
  gau8(ctx);
  gearLeg(ctx, 6, -5.8, 3.2, o.gear, { door: l.under, doorSide: -1 });
  nozzleSide(ctx, -29.6, -31.4, -29, 3.0, 2.7);
  canopySide(ctx, g.canopy, { glass: '#86b2cc', tint: 'rgba(70,120,160,0.3)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx),
    30, -27.2, 5.4);
}
