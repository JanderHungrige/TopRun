import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, nozzleSide } from './parts';
import { canopySide, farFin, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * F-35 side view, nose right, origin = main-gear deck contact. Chined nose, deep blended fuselage with the caret
 * intake under the canopy, canted twin fins (the far one peeks out), one nozzle with exit at x = -56.5.
 */

const TOP: Pts = [54, -15, 52.4, -17, 50, -18.8, 46.4, -20.6, 42, -22.0, 37, -22.8, 17, -24.2, 8, -25.4, -4, -25.8, -16, -25.6,
  -28, -24.8, -40, -23.4, -48, -21.8, -52, -20.4];
const BOTTOM: Pts = [54, -15, 52.4, -13.4, 50, -12.2, 45, -10.8, 40, -10.0, 32, -9.2, 24, -8.8, 14, -8.4, 2, -8.2, -10, -8.6,
  -22, -9.6, -34, -11.4, -44, -13.6, -50, -15.6, -52, -17];
const CANOPY: Pts = [37, -22.8, 35, -26.6, 31.6, -28.8, 27, -29.6, 22.4, -29.0, 19, -27.0, 17, -24.2];
const FIN: Pts = [-20, -25.2, -32.4, -41.6, -40.4, -41.8, -44.4, -23.0];
const STAB: Pts = [-36, -17.6, -52, -17.4, -58, -16.8, -52, -16.0, -36, -16.4];
const WING: Pts = [14, -15.6, 0, -16.4, -12, -16.8, -24, -16.4, -24, -15.2, -10, -15.0, 8, -14.6, 14, -14.6];
const MOUTH: Pts = [31, -19.6, 32.2, -14.6, 29.2, -12.0, 26.4, -12.2, 27.6, -19.2];
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.6 : v - 1.2));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f35-side', clip: polys(body, FIN), box: bounds(body, FIN), cell: 10,
    under: polys([58, -15.2, 30, -14.0, 0, -13.6, -30, -14.6, -58, -16.6, -58, 2, 58, 2]),
    twoTone: polys([17, -24.2, -44, -22.6, -44, -20.4, -20, -22.0, 0, -22.8, 17, -22.4]),
    radome: polys([54, -15, 52.4, -17, 50, -18.8, 46.4, -20.6, 45.6, -20.9, 45.6, -10.7, 50, -12.2, 52.4, -13.4]),
    band: { x: 41.6, y: -23, w: 2.4, h: 14 },
    nose: { x: 34, y: -24, w: 24, h: 16, dir: 'y', out: 1 },
    stripes: [[52, -15.6, 4, -11, -34, -34]],
    trim: [[50, -15.2, 0, -16.2, -46, -18.2], [45.6, -20.9, 45.6, -10.7]],
  };
  const fin: Fin = { path: polys(FIN), q: FIN };
  const farF: Fin = { path: polys(far(FIN)), q: far(FIN) };
  const shades = [
    { path: polys(band(TOP, -1, 2.0)), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys(band(BOTTOM, -3.4, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys([46, -15.4, 0, -16.6, -48, -18.4, -48, -16.6, 0, -14.6, 46, -13.4]), color: 'rgba(0,0,0,0.06)' },
    { path: polys([-21.6, -26.2, -32.4, -41.6, -34.4, -41.6, -24, -26]), color: 'rgba(255,255,255,0.1)', gloss: true },
  ];
  const saw = (x: number, y0: number, y1: number): number[] => [x, y0, x - 1.2, (y0 + y1) / 2, x, y1];
  const panels = lines([[45.6, -20.9, 45.6, -10.7], saw(16, -24.2, -8.6), saw(0, -25.6, -8.2), saw(-16, -25.4, -9.2),
    [-30, -24.6, -30, -10.8], [40, -16.4, 0, -17.6, -44, -18.8], [24, -9.0, 4, -8.4]]);
  const hinges = lines([[-36.6, -38.6, -42.8, -24.6], [-52, -16.8, -57.4, -16.8]]);
  return {
    surface, fin, farF, shades, panels, hinges, canopy: polys(CANOPY), mouth: polys(MOUTH), wing: polys(WING),
    wingEdge: lines([[14, -15.6, 0, -16.4, -12, -16.8, -24, -16.4]]), stab: polys(STAB),
    stabEdge: lines([[-36, -17.6, -52, -17.4, -58, -16.8]]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  ctx.fillRect(17, -24.6, 20, 1.8); // sill
  ctx.beginPath();
  ctx.moveTo(21.2, -23.8);
  ctx.lineTo(22.0, -28.6);
  ctx.lineTo(24.4, -28.8);
  ctx.lineTo(25.0, -23.8);
  ctx.fill(); // seat headrest
  helmet(ctx, 27.4, -26.8, 1.9, '#3b4148', '#1a1d21');
}

export function drawF35Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 2.9 + o.throttle * 0.5;
  gearLeg(ctx, 43, -10.4, 2.2, o.gear, { door: l.under, doorSide: 1, wheels: [1.4], far: true });
  farFin(ctx, l, g.farF, 14);
  flameSide(ctx, -56.5, -18.7, r1 * 1.9, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 14);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.2)', 0.3);
  gearLeg(ctx, -6, -8.4, 3.0, o.gear, { door: l.under, doorSide: -1, rake: 1.2 });
  tailHook(ctx, -40, -13.2, 6.5, o.hook);
  canopySide(ctx, g.canopy, { glass: '#a58848', tint: 'rgba(160,120,50,0.35)', frame: 'rgba(30,30,30,0.75)' }, () => interior(ctx),
    28, -28.6, 6.4);
  nozzleSide(ctx, -52, -56.5, -18.7, 3.4, r1);
}
