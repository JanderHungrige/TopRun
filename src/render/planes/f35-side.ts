import type { Look } from '../livery-art';
import type { Pts, Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, nozzleSide } from './parts';
import { canopySide, farFin, realProfile, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * F-35 side view from real dimensions (doc 04): 15.67 m long, 4.38 m to the fin tips, main gear 9.6 m behind the nose;
 * chined nose, long one-piece canopy, the caret intake behind it, a deep blended fuselage, canted twin fins and one
 * nozzle. Nose right, origin = main-gear deck contact, 7.2 units per metre.
 */

const K = 7.2;
const XM = 9.6;
const P = realProfile(K, XM);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 1.75, 0.5, 1.95, 1.2, 2.15, 2.0, 2.32, 2.8, 2.45, 6.2, 2.75, 7.5, 2.9, 9.0, 2.95, 10.5, 2.92, 12.0, 2.82,
  13.5, 2.65, 14.5, 2.5, 15.0, 2.42]);
const BOTTOM = P([0, 1.75, 0.5, 1.58, 1.2, 1.42, 2.0, 1.3, 3.0, 1.2, 4.2, 1.12, 6.0, 1.05, 8.0, 1.02, 10.0, 1.06, 12.0, 1.18,
  13.5, 1.35, 15.0, 1.55]);
const CANOPY = P([2.8, 2.45, 3.2, 2.75, 3.8, 2.98, 4.5, 3.05, 5.2, 3.0, 5.8, 2.85, 6.2, 2.75]);
const FIN = P([11.9, 2.85, 13.6, 4.38, 14.6, 4.38, 15.2, 2.6]);
const STAB = P([12.8, 2.2, 14.5, 2.25, 15.9, 2.18, 15.9, 2.1, 14.5, 2.05, 12.9, 2.08]);
const WING = P([6.5, 2.05, 9.5, 2.1, 12.4, 2.06, 12.4, 1.96, 9.5, 1.94, 6.7, 1.98]);
const MOUTH = P([5.9, 2.42, 6.35, 2.4, 6.4, 1.6, 5.75, 1.62]);
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.4 : v - 0.9));
const NOZZLE = { x0: (XM - 15.0) * K, x1: (XM - 15.67) * K, y: -1.98 * K, r: 0.56 * K };

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f35-side', clip: polys(body, FIN), box: bounds(body, FIN), cell: 10,
    under: polys(P([-1, 1.8, 6, 1.9, 16.5, 1.9, 16.5, -0.3, -1, -0.3])),
    twoTone: polys(P([6.2, 2.75, 9.0, 2.95, 14.5, 2.5, 14.5, 2.3, 9.0, 2.72, 6.2, 2.55])),
    radome: polys(P([0, 1.75, 0.5, 1.95, 1.2, 2.15, 1.7, 2.26, 1.7, 1.34, 1.2, 1.42, 0.5, 1.58])),
    band: zone(2.1, 2.45, 1.2, 2.5),
    nose: { ...zone(0, 3.4, 1.1, 2.6), dir: 'y', out: 1 },
    stripes: [P([0.6, 1.8, 7.5, 1.6, 13.5, 4.0])],
    trim: [P([0.8, 1.8, 7.0, 1.95, 14.0, 2.2]), P([1.7, 2.26, 1.7, 1.34])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN };
  const farF: Fin = { path: polys(far(FIN)), q: far(FIN) };
  const shades = [
    { path: polys(band(TOP, -0.8, 1.6)), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys(band(BOTTOM, -2.4, 0.8)), color: 'rgba(0,0,0,0.14)' },
    { path: polys(P([3.0, 1.75, 9.0, 1.65, 15.0, 1.85, 15.0, 1.6, 9.0, 1.4, 3.0, 1.5])), color: 'rgba(0,0,0,0.06)' },
    { path: polys(P([12.0, 2.95, 13.6, 4.38, 13.85, 4.38, 12.3, 2.95])), color: 'rgba(255,255,255,0.1)', gloss: true },
  ];
  const saw = (x: number, h0: number, h1: number): number[] => P([x, h0, x - 0.18, (h0 + h1) / 2, x, h1]);
  const panels = lines([P([1.7, 2.26, 1.7, 1.34]), saw(6.4, 2.75, 1.1), saw(8.6, 2.94, 1.03), saw(10.8, 2.9, 1.08),
    P([12.6, 2.76, 12.6, 1.25]), P([2.6, 1.85, 9.0, 1.72, 14.6, 1.92]), P([6.6, 1.1, 9.8, 1.06])]);
  const hinges = lines([P([13.9, 3.6, 14.95, 2.8]), P([14.5, 2.15, 15.8, 2.15])]);
  return {
    surface, fin, farF, shades, panels, hinges, canopy: polys(CANOPY), mouth: polys(MOUTH), wing: polys(WING),
    wingEdge: lines([P([6.5, 2.05, 9.5, 2.1, 12.4, 2.06])]), stab: polys(STAB), stabEdge: lines([P([12.8, 2.2, 14.5, 2.25, 15.9, 2.18])]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  const [sx, sy] = at(6.0, 2.56);
  ctx.fillRect(sx, sy, 3.0 * K, 0.16 * K); // sill
  const seat = P([5.3, 2.56, 5.2, 3.0, 4.95, 3.02, 4.85, 2.56]);
  ctx.beginPath();
  ctx.moveTo(seat[0] ?? 0, seat[1] ?? 0);
  for (let i = 2; i < seat.length; i += 2) ctx.lineTo(seat[i] ?? 0, seat[i + 1] ?? 0);
  ctx.fill(); // seat headrest
  const [hx, hy] = at(4.55, 2.82);
  helmet(ctx, hx, hy, 0.2 * K, '#3b4148', '#1a1d21');
}

export function drawF35Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = NOZZLE.r * (0.9 + o.throttle * 0.08);
  const [nx, nb] = at(4.2, 1.12);
  gearLeg(ctx, nx, nb, 0.28 * K, o.gear, { door: l.under, doorSide: 1, wheels: [1.4], far: true });
  farFin(ctx, l, g.farF, 12);
  flameSide(ctx, NOZZLE.x1, NOZZLE.y, r1 * 1.8, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 12);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.2)', 0.3);
  gearLeg(ctx, 0, -1.04 * K, 0.4 * K, o.gear, { door: l.under, doorSide: -1, rake: 1.2 });
  const [hx, hy] = at(13.2, 1.3);
  tailHook(ctx, hx, hy, 6.5, o.hook);
  const [gx, gy] = at(4.5, 2.98);
  canopySide(ctx, g.canopy, { glass: '#a58848', tint: 'rgba(160,120,50,0.35)', frame: 'rgba(30,30,30,0.75)' }, () => interior(ctx), gx, gy, 6.4);
  nozzleSide(ctx, NOZZLE.x0, NOZZLE.x1, NOZZLE.y, NOZZLE.r, r1);
}
