import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * Tornado side view, nose right, origin = main-gear deck contact. Long nose, tandem canopy, shoulder wing, wedge
 * intake, one tall fin with the thrust-reverser buckets at its base, tailerons, twin nozzles (exit x = -57).
 */

const TOP: Pts = [58, -16, 55, -17.8, 51, -19.4, 46, -20.8, 40, -21.8, 35, -22.4, 10, -24.4, 0, -25.0, -14, -25.0, -28, -24.4,
  -40, -23.4, -50, -22.0, -54, -20.8];
const BOTTOM: Pts = [58, -16, 55, -14.6, 51, -13.4, 46, -12.4, 40, -11.6, 30, -10.6, 20, -10.0, 6, -9.6, -8, -9.8, -22, -10.6,
  -36, -12.0, -46, -14.2, -52, -16.4, -54, -18];
const CANOPY: Pts = [35, -22.4, 33.4, -25.4, 30.4, -27.4, 26.4, -28.2, 20, -28.0, 15, -27.0, 11.6, -25.6, 10, -24.4];
const FIN: Pts = [-18, -25, -32, -44, -40.4, -45, -46.6, -44.6, -49.2, -23];
const STAB: Pts = [-34, -17.6, -50, -17.2, -58, -16.2, -50, -15.6, -34, -16.2];
const WING: Pts = [18, -21.2, 2, -22.2, -14, -22.4, -14, -21.0, 2, -20.6, 18, -20.2];
const MOUTH: Pts = [26, -20.6, 27.4, -12.8, 23.8, -12.0, 22.6, -19.8];
const REVERSER: Pts = [-44, -24.6, -50.4, -24.4, -51.4, -21.6, -44, -22.0];

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'tornado-side', clip: polys(body, FIN, REVERSER), box: bounds(body, FIN), cell: 10,
    under: polys([62, -16.2, 30, -15.6, 0, -15.2, -30, -15.8, -60, -17.0, -60, 2, 62, 2]),
    twoTone: polys([10, -24.4, -46, -22.6, -46, -20.4, -20, -21.6, 0, -22.4, 10, -22.6]),
    radome: polys([58, -16, 55, -17.8, 51, -19.4, 46, -20.8, 44, -21.2, 44, -12.1, 46, -12.4, 51, -13.4, 55, -14.6]),
    band: { x: 40.4, y: -24, w: 2.4, h: 14 },
    nose: { x: 32, y: -25, w: 28, h: 16, dir: 'y', out: 1 },
    stripes: [[54, -16.6, 6, -12, -36, -38]],
    trim: [[52, -16.2, 0, -16.8, -48, -18.8], [44, -21.2, 44, -12.1]],
  };
  const fin: Fin = { path: polys(FIN), q: [-20, -25, -33, -44, -46, -44.6, -49, -23] };
  const shades = [
    { path: polys(band(TOP, -1, 2.2)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BOTTOM, -3.2, 1)), color: 'rgba(0,0,0,0.13)' },
    { path: polys([-20, -25, -32, -44, -34, -44.2, -22.6, -25]), color: 'rgba(255,255,255,0.11)', gloss: true },
    { path: polys([-40.4, -45, -46.6, -44.6, -46.8, -43, -40.6, -43.4]), color: 'rgba(0,0,0,0.3)' },
    { path: polys(REVERSER), color: 'rgba(0,0,0,0.16)' },
  ];
  const panels = lines([[44, -21.2, 44, -12.1], [35, -22.4, 35, -11.2], [10, -24.4, 10, -9.8], [-6, -25.0, -6, -9.7],
    [-22, -24.8, -22, -10.6], [-36, -23.8, -36, -12.0], [40, -17.6, 0, -18.4, -46, -19.6], [20, -13.2, -10, -13.6]]);
  const hinges = lines([[-42.6, -26, -44.8, -43], [-50, -16.4, -57.4, -16.4]]);
  return {
    surface, fin, shades, panels, hinges, canopy: polys(CANOPY), mouth: polys(MOUTH), wing: polys(WING),
    wingEdge: lines([[18, -21.2, 2, -22.2, -14, -22.4]]), stab: polys(STAB), stabEdge: lines([[-34, -17.6, -50, -17.2, -58, -16.2]]),
    frame: lines([[22.6, -28.1, 22.6, -22.8]]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  ctx.fillRect(10, -24.8, 25, 1.8); // sill
  for (const [x, hx] of [[25.6, 29.0], [14.4, 17.8]] as const) {
    ctx.beginPath();
    ctx.moveTo(x, -23.6);
    ctx.lineTo(x + 0.6, -28.0);
    ctx.lineTo(x + 2.8, -28.2);
    ctx.lineTo(x + 3.4, -23.6);
    ctx.fill(); // seat headrests: pilot and navigator
    helmet(ctx, hx + 1.2, -26.4, 1.8, '#5a5f52', '#1d2126');
    ctx.fillStyle = '#2a2e34';
  }
}

export function drawTornadoSide(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 2.6 + o.throttle * 0.5;
  gearLeg(ctx, 40, -11.6, 2.2, o.gear, { door: l.under, doorSide: 1, wheels: [1.4], far: true });
  flameSide(ctx, -57, -18.4, r1 * 1.9, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 17);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.22)', 0.3);
  missileSide(ctx, 16, -8.2, 13, 1.0);
  gearLeg(ctx, -4, -9.8, 3.0, o.gear, { door: l.under, doorSide: -1, rake: 1.4 });
  tailHook(ctx, -38, -12.4, 6.5, o.hook);
  canopySide(ctx, g.canopy, { glass: '#8cbad2', tint: 'rgba(70,120,160,0.3)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx),
    24, -27.4, 7);
  stroke(ctx, g.frame, 'rgba(40,40,40,0.75)', 0.45);
  nozzleSide(ctx, -53, -57, -18.4, 3.2, r1);
}
