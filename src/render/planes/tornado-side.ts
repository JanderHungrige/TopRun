import type { Look } from '../livery-art';
import type { Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, realProfile, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * Tornado side view from real dimensions (doc 04): 16.72 m long, 5.95 m to the tip of its tall fin, main gear 10.8 m
 * behind the nose; long radome, tandem canopy, the wedge intake under it, shoulder wing, thrust-reverser buckets at
 * the fin base, tailerons and twin nozzles. Nose right, origin = main-gear deck contact, 6.9 units per metre.
 */

const K = 6.9;
const XM = 10.8;
const P = realProfile(K, XM);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 1.95, 0.6, 2.15, 1.4, 2.35, 2.4, 2.5, 3.4, 2.6, 7.4, 2.9, 9.0, 3.02, 11.0, 3.05, 13.0, 2.98, 14.5, 2.85, 15.6, 2.7]);
const BOTTOM = P([0, 1.95, 0.6, 1.78, 1.4, 1.62, 2.4, 1.5, 3.4, 1.42, 5.0, 1.3, 7.0, 1.18, 9.0, 1.1, 11.0, 1.1, 13.0, 1.25,
  14.5, 1.45, 15.6, 1.6]);
const CANOPY = P([3.4, 2.6, 3.8, 2.92, 4.4, 3.15, 5.2, 3.25, 6.2, 3.22, 7.0, 3.1, 7.4, 2.9]);
const FIN = P([10.2, 3.02, 11.2, 3.4, 14.6, 5.95, 15.75, 5.95, 16.4, 2.72]);
const FIN_Q = P([11.2, 3.1, 14.6, 5.95, 15.75, 5.95, 16.4, 2.75]);
const REVERSER = P([15.4, 2.7, 16.5, 2.7, 16.6, 2.95, 15.5, 3.0]);
const STAB = P([13.8, 2.0, 15.5, 2.04, 16.9, 1.98, 16.9, 1.9, 15.5, 1.86, 13.9, 1.88]);
const WING = P([7.6, 2.58, 10.0, 2.62, 12.2, 2.56, 12.2, 2.46, 10.0, 2.48, 7.8, 2.5]);
const MOUTH = P([6.4, 2.45, 7.0, 2.45, 7.3, 1.3, 6.7, 1.28]);
const NOZZLE = { x0: (XM - 15.6) * K, x1: (XM - 16.72) * K, y: -2.12 * K, r: 0.52 * K };

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'tornado-side', clip: polys(body, FIN, REVERSER), box: bounds(body, FIN), cell: 10,
    under: polys(P([-1, 1.95, 8, 2.0, 17.5, 2.0, 17.5, -0.3, -1, -0.3])),
    twoTone: polys(P([7.4, 2.9, 11.0, 3.05, 15.5, 2.72, 15.5, 2.5, 11.0, 2.8, 7.4, 2.68])),
    radome: polys(P([0, 1.95, 0.6, 2.15, 1.4, 2.35, 2.4, 2.5, 2.4, 1.5, 1.4, 1.62, 0.6, 1.78])),
    band: zone(2.7, 3.05, 1.3, 2.7),
    nose: { ...zone(0, 4.2, 1.3, 3.0), dir: 'y', out: 1 },
    stripes: [P([0.6, 1.95, 8.5, 1.6, 14.2, 5.4])],
    trim: [P([0.8, 1.95, 9.0, 1.95, 15.4, 2.15]), P([2.4, 2.5, 2.4, 1.5])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const shades = [
    { path: polys(band(TOP, -0.8, 1.6)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BOTTOM, -2.2, 0.8)), color: 'rgba(0,0,0,0.13)' },
    { path: polys(P([11.25, 3.5, 14.6, 5.95, 14.85, 5.95, 11.6, 3.5])), color: 'rgba(255,255,255,0.11)', gloss: true },
    { path: polys(P([14.6, 5.95, 15.75, 5.95, 15.78, 5.75, 14.75, 5.75])), color: 'rgba(0,0,0,0.3)' },
    { path: polys(REVERSER), color: 'rgba(0,0,0,0.16)' },
  ];
  const panels = lines([P([2.4, 2.5, 2.4, 1.5]), P([3.4, 2.6, 3.4, 1.42]), P([7.6, 2.92, 7.6, 1.17]), P([9.6, 3.04, 9.6, 1.1]),
    P([12.0, 3.0, 12.0, 1.15]), P([14.0, 2.9, 14.0, 1.38]), P([2.8, 2.05, 9.0, 1.95, 15.4, 2.1]), P([5.0, 1.45, 11.0, 1.35])]);
  const hinges = lines([P([15.0, 3.2, 15.65, 5.7]), P([15.5, 1.95, 16.85, 1.95])]);
  return {
    surface, fin, shades, panels, hinges, canopy: polys(CANOPY), mouth: polys(MOUTH), wing: polys(WING),
    wingEdge: lines([P([7.6, 2.58, 10.0, 2.62, 12.2, 2.56])]), stab: polys(STAB), stabEdge: lines([P([13.8, 2.0, 15.5, 2.04, 16.9, 1.98])]),
    frame: lines([P([5.6, 2.62, 5.6, 3.24])]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  const [sx, sy] = at(7.3, 2.65);
  ctx.fillRect(sx, sy, 3.7 * K, 0.16 * K); // sill
  for (const x of [4.9, 6.5]) {
    const seat = P([x + 0.35, 2.65, x + 0.25, 3.12, x, 3.14, x - 0.1, 2.65]);
    ctx.fillStyle = '#2a2e34';
    ctx.beginPath();
    ctx.moveTo(seat[0] ?? 0, seat[1] ?? 0);
    for (let i = 2; i < seat.length; i += 2) ctx.lineTo(seat[i] ?? 0, seat[i + 1] ?? 0);
    ctx.fill(); // pilot and navigator
    const [hx, hy] = at(x - 0.35, 2.98);
    helmet(ctx, hx, hy, 0.2 * K, '#5a5f52', '#1d2126');
  }
}

export function drawTornadoSide(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = NOZZLE.r * (0.9 + o.throttle * 0.08);
  const [nx, nb] = at(4.6, 1.32);
  gearLeg(ctx, nx, nb, 0.28 * K, o.gear, { door: l.under, doorSide: 1, wheels: [1.4], far: true });
  flameSide(ctx, NOZZLE.x1, NOZZLE.y, r1 * 1.8, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 15);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.22)', 0.3);
  const [mx, my] = at(8.0, 0.92);
  missileSide(ctx, mx, my, 2.6 * K, 1.0);
  gearLeg(ctx, 0, -1.1 * K, 0.42 * K, o.gear, { door: l.under, doorSide: -1, rake: 1.4 });
  const [hx, hy] = at(13.6, 1.35);
  tailHook(ctx, hx, hy, 6.5, o.hook);
  const [gx, gy] = at(5.4, 3.18);
  canopySide(ctx, g.canopy, { glass: '#8cbad2', tint: 'rgba(70,120,160,0.3)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx), gx, gy, 7);
  stroke(ctx, g.frame, 'rgba(40,40,40,0.75)', 0.45);
  nozzleSide(ctx, NOZZLE.x0, NOZZLE.x1, NOZZLE.y, NOZZLE.r, r1);
}
