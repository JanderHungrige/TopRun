import type { Look } from '../livery-art';
import type { Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, realProfile, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * F-16 side view from real dimensions (doc 04): 15.06 m long, 4.88 m to the fin tip, main gear 9.2 m behind the nose;
 * long low bubble canopy, the chin intake under the cockpit, ventral fins and the chute housing at the fin base.
 * Nose right, origin = main-gear deck contact, 7.5 units per metre.
 */

const K = 7.5;
const XM = 9.2;
const P = realProfile(K, XM);
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 1.88, 0.3, 2.0, 0.7, 2.12, 1.2, 2.23, 1.9, 2.34, 2.5, 2.42, 2.85, 2.48, 6.2, 2.86, 7.5, 2.92, 9.0, 2.95,
  10.5, 2.92, 12.0, 2.86, 13.2, 2.76, 14.2, 2.68]);
const BOTTOM = P([0, 1.88, 0.3, 1.76, 0.7, 1.64, 1.2, 1.55, 1.9, 1.47, 2.6, 1.42, 3.6, 1.38, 4.85, 1.34, 4.55, 0.88, 5.5, 0.86,
  7.0, 0.88, 8.5, 0.92, 9.6, 0.98, 10.6, 1.08, 11.6, 1.22, 12.6, 1.38, 13.6, 1.48, 14.2, 1.52]);
const BELLY = P([5.5, 0.86, 7.0, 0.88, 8.5, 0.92, 9.6, 0.98, 10.6, 1.08, 11.6, 1.22, 12.6, 1.38, 13.6, 1.48, 14.2, 1.52]);
const FIN = P([10.2, 2.9, 11.0, 3.18, 13.0, 4.88, 13.95, 4.88, 14.3, 2.76]);
const FIN_Q = P([11.0, 3.0, 13.0, 4.88, 13.95, 4.88, 14.3, 2.76]);
const CHUTE = P([14.0, 2.72, 14.95, 2.74, 15.0, 2.92, 14.05, 3.06]);
const VENTRAL = P([11.7, 1.22, 12.9, 1.42, 12.7, 0.95, 12.05, 0.84]);
const STAB = P([12.3, 2.06, 13.8, 2.1, 15.25, 2.06, 15.25, 1.98, 13.8, 1.94, 12.4, 1.96]);
const WING = P([6.4, 2.05, 9.0, 2.08, 11.6, 2.06, 11.6, 1.96, 9.0, 1.94, 6.6, 1.98]);
const CANOPY = P([2.85, 2.48, 3.2, 2.85, 3.7, 3.12, 4.3, 3.25, 5.0, 3.24, 5.6, 3.12, 6.2, 2.86]);
const RADOME = P([0, 1.88, 0.3, 2.0, 0.7, 2.12, 1.2, 2.23, 1.9, 2.34, 1.9, 1.47, 1.2, 1.55, 0.7, 1.64, 0.3, 1.76]);
const MOUTH = P([4.85, 1.34, 4.55, 0.88, 4.78, 0.88, 5.02, 1.3]);
const NOZZLE = { x0: (XM - 14.2) * K, x1: (XM - 15.05) * K, y: -2.1 * K, r: 0.58 * K };

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f16-side', clip: polys(body, FIN, CHUTE, VENTRAL, STAB), box: bounds(body, FIN, STAB), cell: 10,
    under: polys(P([-1, 1.9, 6, 1.95, 15.5, 1.95, 15.5, -0.3, -1, -0.3])),
    twoTone: polys(P([6.3, 2.9, 14.2, 2.72, 14.2, 2.45, 9.0, 2.6, 6.3, 2.62])),
    radome: polys(RADOME),
    band: zone(2.2, 2.52, 1.3, 2.6),
    nose: { ...zone(0, 3.4, 1.3, 2.7), dir: 'y', out: 1 },
    stripes: [P([0.6, 2.0, 8.0, 1.75, 12.8, 4.5])],
    trim: [P([1.0, 2.02, 7.0, 2.2, 13.5, 2.45]), P([1.9, 2.34, 1.9, 1.47])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const shades = [
    { path: polys(band(TOP, -0.8, 1.8)), color: 'rgba(255,255,255,0.15)', gloss: true },
    { path: polys(band(BELLY, -2.6, 0.8)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(P([4.6, 1.36, 9.6, 1.4, 9.6, 0.98, 4.6, 0.9])), color: 'rgba(0,0,0,0.08)' },
    { path: polys(P([10.25, 2.92, 13.0, 4.88, 13.2, 4.88, 10.6, 2.95])), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys(P([13.0, 4.88, 13.95, 4.88, 13.95, 4.7, 13.0, 4.7])), color: 'rgba(0,0,0,0.35)' },
  ];
  const panels = lines([P([1.9, 2.34, 1.9, 1.47]), P([3.0, 2.48, 3.0, 1.4]), P([6.3, 2.86, 6.3, 2.0]), P([8.3, 2.93, 8.3, 2.1]),
    P([10.3, 2.92, 10.3, 2.08]), P([12.3, 2.84, 12.3, 1.36]), P([2.0, 2.0, 7.0, 2.22, 14.0, 2.3]), P([5.4, 1.3, 9.6, 1.3]),
    P([11.6, 2.0, 11.6, 1.24])]);
  const hinges = lines([P([12.6, 3.25, 13.6, 4.6, 13.95, 4.6]), P([14.05, 2.95, 14.9, 2.9]), P([13.8, 1.98, 15.2, 1.98])]);
  return {
    surface, fin, shades, panels, hinges, wing: polys(WING), wingEdge: lines([P([6.4, 2.05, 9.0, 2.08, 11.6, 2.06])]),
    stab: polys(STAB), stabEdge: lines([P([12.3, 2.06, 13.8, 2.1, 15.25, 2.06])]), canopy: polys(CANOPY), mouth: polys(MOUTH),
    lerx: lines([P([3.8, 2.08, 6.4, 2.05])]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  const [sx, sy] = P([6.0, 2.62]);
  ctx.fillRect(sx ?? 0, sy ?? 0, 3.05 * K, 0.16 * K); // sill / instrument coaming
  const seat = P([5.55, 2.55, 5.45, 3.08, 5.2, 3.1, 5.05, 2.55]);
  ctx.beginPath();
  ctx.moveTo(seat[0] ?? 0, seat[1] ?? 0);
  for (let i = 2; i < seat.length; i += 2) ctx.lineTo(seat[i] ?? 0, seat[i + 1] ?? 0);
  ctx.fill(); // seat headrest
  const [hx, hy] = P([4.75, 2.92]);
  helmet(ctx, hx ?? 0, hy ?? 0, 0.2 * K, '#4a515b', '#1d2126');
  const [ux, uy] = P([3.55, 2.9]);
  ctx.fillRect(ux ?? 0, uy ?? 0, 0.1 * K, 0.3 * K); // HUD
}

export function drawF16Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = NOZZLE.r * (0.88 + o.throttle * 0.08);
  gearLeg(ctx, (XM - 5.1) * K, -0.86 * K, 0.28 * K, o.gear, { door: l.under, doorSide: 1 });
  flameSide(ctx, NOZZLE.x1, NOZZLE.y, r1 * 1.8, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 15);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  stroke(ctx, g.lerx, `rgba(255,255,255,${(0.2 * l.gloss).toFixed(2)})`, 0.35);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.25)', 0.3);
  ctx.fillStyle = 'rgba(25,30,36,0.6)';
  const [rx, ry] = P([7.6, 2.93]);
  ctx.fillRect(rx ?? 0, ry ?? 0, 0.32 * K, 0.08 * K); // refuelling receptacle
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(XM * K, -1.88 * K); // pitot
  ctx.lineTo((XM + 0.85) * K, -1.88 * K);
  ctx.stroke();
  gearLeg(ctx, 0, -0.98 * K, 0.34 * K, o.gear, { door: l.under, doorSide: -1, rake: 1.2 });
  tailHook(ctx, (XM - 13.0) * K, -1.45 * K, 6, o.hook);
  canopySide(ctx, g.canopy, { glass: '#d3a548', tint: 'rgba(214,164,70,0.35)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx),
    (XM - 4.4) * K, -3.12 * K, 7);
  nozzleSide(ctx, NOZZLE.x0, NOZZLE.x1, NOZZLE.y, NOZZLE.r, r1);
  missileSide(ctx, (XM - 7.0) * K, -2.02 * K, 3.0 * K, 0.85);
}
