import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/** F-16 side view, nose right, origin = main-gear deck contact. Nozzle exit at x = -54.5. */

const TOP: Pts = [52, -18.6, 50, -19.9, 47.5, -21.0, 44.5, -22.0, 41, -22.8, 37, -23.4, 33, -23.8, 9, -24.6, 2, -25.2, -8, -25.6,
  -20, -25.4, -30, -25.0, -40, -24.4, -46, -23.6, -49.6, -22.6];
const BOTTOM: Pts = [52, -18.6, 50, -17.4, 47, -16.4, 43, -15.6, 38, -15.0, 33, -14.6, 28, -14.4, 24.2, -14.3, 25.6, -8.6, 23, -8.2,
  16, -8.0, 6, -8.2, -4, -8.6, -14, -9.4, -24, -10.6, -34, -12.4, -42, -14.0, -47, -15.2, -49.6, -15.8];
const BELLY: Pts = BOTTOM.slice(16);
const FIN: Pts = [-14, -25.5, -22, -27.4, -38.6, -42.6, -45.6, -42.6, -47.6, -24.0];
const CHUTE: Pts = [-45, -24.2, -51, -24.2, -51.2, -26.6, -45.5, -27.6];
const VENTRAL: Pts = [-30, -11.6, -36, -12.8, -37.8, -7.4, -33, -8.0];
const STAB: Pts = [-37, -17.6, -50, -17.2, -56.5, -16.4, -56, -15.4, -50, -15.8, -38, -16.4];
const WING: Pts = [16, -16.2, 4, -17.0, -10, -17.6, -24, -17.4, -24.5, -16.2, -10, -15.6, 4, -15.6];
const CANOPY: Pts = [33.5, -23.8, 31, -26.6, 27.5, -28.8, 23, -29.9, 18, -30.0, 13.5, -29.0, 10, -27.2, 8, -24.8, 8, -24.4];

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f16-side', clip: polys(body, FIN, CHUTE, VENTRAL, STAB), box: bounds(body, FIN, STAB), cell: 10,
    under: polys([56, -17.6, 30, -17.2, 0, -16.8, -30, -16.6, -58, -16.4, -58, 2, 56, 2]),
    twoTone: polys([12, -25.2, -46, -24.4, -46, -21.8, -20, -21.6, 0, -22.2, 10, -23.4]),
    radome: polys([53, -18.6, 50, -19.9, 47.5, -21.0, 44.5, -22.0, 41, -22.8, 39.5, -23.1, 39.5, -15.2, 43, -15.6, 47, -16.4, 50, -17.4]),
    band: { x: 36.6, y: -30, w: 2.4, h: 20 },
    nose: { x: 30, y: -30, w: 24, h: 20, dir: 'y', out: 1 },
    stripes: [[49, -19.4, 4, -14, -38, -36]],
    trim: [[46, -19.4, 0, -19.3, -46, -19.6], [38.9, -23.1, 38.9, -15.1]],
  };
  const fin: Fin = { path: polys(FIN), q: [-21, -25.4, -38.6, -42.6, -45.6, -42.6, -47.6, -24.2] };
  const shades = [
    { path: polys(band(TOP, -1, 2.4)), color: 'rgba(255,255,255,0.15)', gloss: true },
    { path: polys(band(BELLY, -3.6, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(band(BELLY, -1.4, 1)), color: 'rgba(0,0,0,0.1)' },
    { path: polys([-22, -27.4, -38.6, -42.6, -40.6, -42.6, -24.8, -27.4]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([-38.6, -42.6, -45.6, -42.6, -45.4, -41.2, -39.6, -41.2]), color: 'rgba(0,0,0,0.35)' },
  ];
  const panels = lines([[39.5, -23.1, 39.5, -15.2], [30, -23.9, 30, -14.5], [10, -24.6, 10, -17.2], [-4, -25.4, -4, -17.4],
    [-20, -25.3, -20, -17.4], [-34, -24.8, -34, -13], [30, -20.8, 10, -21.2, -40, -21.6], [22, -11.6, -6, -12.2], [-24, -16.2, -24, -10.6]]);
  const hinges = lines([[-42, -25, -42.8, -37.6, -45.2, -37.6], [-45.6, -22.6, -49.4, -22.6], [-45.6, -16.2, -49.4, -16.2]]);
  return {
    surface, fin, shades, panels, hinges, wing: polys(WING), wingEdge: lines([[16, -16.2, 4, -17.0, -10, -17.6, -24, -17.4]]),
    stab: polys(STAB), stabEdge: lines([[-37, -17.6, -50, -17.2, -56.5, -16.4]]), canopy: polys(CANOPY),
    mouth: polys([24.2, -14.3, 25.6, -8.6, 24.4, -8.6, 23.2, -13.8]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  ctx.fillRect(8, -25.6, 26, 2.2); // sill / instrument coaming
  ctx.beginPath();
  ctx.moveTo(12.5, -24);
  ctx.lineTo(13.2, -29.2);
  ctx.lineTo(15.6, -29.4);
  ctx.lineTo(16.4, -24);
  ctx.fill(); // seat headrest
  helmet(ctx, 18.8, -27.5, 1.9, '#4a515b', '#1d2126');
  ctx.fillRect(28.4, -27.2, 0.8, 2.6); // HUD
}

export function drawF16Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 2.8 + o.throttle * 0.5;
  gearLeg(ctx, 18, -8.0, 2.4, o.gear, { door: l.under, doorSide: 1 });
  gearLeg(ctx, -5, -8.6, 3.2, o.gear, { door: l.under, doorSide: -1, rake: 1.5 });
  flameSide(ctx, -54.5, -19.1, r1 * 1.9, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 17);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.25)', 0.3);
  ctx.fillStyle = 'rgba(25,30,36,0.6)';
  ctx.fillRect(1.5, -25.6, 2.6, 0.7); // refuelling receptacle
  ctx.fillRect(-10.4, -9.4, 0.6, 1.8); // belly antenna
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(52, -18.6); // pitot
  ctx.lineTo(56.5, -18.6);
  ctx.stroke();
  tailHook(ctx, -38, -13.2, 7, o.hook);
  canopySide(ctx, g.canopy, { glass: '#d3a548', tint: 'rgba(214,164,70,0.35)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx), 22, -28.8, 6);
  nozzleSide(ctx, -49.4, -54.5, -19.1, 3.3, r1);
  missileSide(ctx, 8, -17.6, 20, 0.95);
}
