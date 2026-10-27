import type { Look } from '../livery-art';
import type { Pts, Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, farFin, realProfile, sliver, tailHook } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * F-14 side view from real dimensions (doc 04): 19.1 m long, 4.88 m to the fin tips, main gear 12.2 m behind the
 * nose; long radome, tandem canopy, the big angled intakes and flat nacelles, twin fins, the glove pylon with its
 * Phoenix. Nose right, origin = main-gear deck contact, 6.7 units per metre.
 */

const K = 6.7;
const XM = 12.2;
const P = realProfile(K, XM);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 2.05, 0.4, 2.2, 1.0, 2.36, 1.8, 2.5, 2.8, 2.6, 3.6, 2.68, 7.9, 2.95, 9.5, 3.0, 11.0, 2.98, 12.5, 2.92,
  14.0, 2.82, 15.5, 2.68, 17.0, 2.52, 18.3, 2.42]);
const BOTTOM = P([0, 2.05, 0.4, 1.9, 1.0, 1.76, 1.8, 1.64, 2.8, 1.56, 4.2, 1.5, 5.2, 1.46, 6.5, 1.36, 9.0, 1.3, 12.0, 1.3,
  14.0, 1.36, 15.5, 1.44, 17.0, 1.52, 18.3, 1.56]);
const BELLY = P([6.5, 1.36, 9.0, 1.3, 12.0, 1.3, 14.0, 1.36, 15.5, 1.44, 17.0, 1.52, 18.3, 1.56]);
const FIN = P([13.4, 2.86, 14.5, 3.3, 16.9, 4.88, 17.85, 4.88, 18.25, 2.48]);
const FIN_Q = P([14.3, 2.9, 16.9, 4.88, 17.85, 4.88, 18.25, 2.5]);
const VENTRAL = P([15.5, 1.45, 16.9, 1.52, 16.75, 1.0, 16.05, 0.92]);
const STAB = P([15.0, 2.22, 17.3, 2.27, 19.6, 2.2, 19.6, 2.1, 17.3, 2.06, 15.1, 2.1]);
const WING = P([7.0, 2.62, 10.5, 2.68, 14.2, 2.62, 14.2, 2.52, 10.5, 2.54, 7.2, 2.54]);
const CANOPY = P([3.6, 2.68, 4.0, 2.98, 4.6, 3.18, 5.4, 3.26, 6.4, 3.25, 7.2, 3.16, 7.9, 2.95]);
const RADOME = P([0, 2.05, 0.4, 2.2, 1.0, 2.36, 1.8, 2.5, 2.8, 2.6, 2.8, 1.56, 1.8, 1.64, 1.0, 1.76, 0.4, 1.9]);
const MOUTH = P([5.0, 2.62, 5.55, 2.62, 6.05, 1.42, 5.45, 1.42]);
const PYLON = P([7.3, 2.5, 9.2, 2.5, 9.0, 2.24, 7.6, 2.24]);
/** The far fin peeks out slightly ahead and above the near one. */
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.4 : v - 0.7));
const NOZZLE = { x0: (XM - 18.3) * K, x1: (XM - 19.1) * K, y: -1.98 * K, r: 0.52 * K };

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'f14-side', clip: polys(body, FIN, VENTRAL, STAB), box: bounds(body, FIN, STAB), cell: 10,
    under: polys(P([-1, 2.0, 8, 2.05, 20, 2.05, 20, -0.3, -1, -0.3])),
    twoTone: polys(P([3.6, 2.68, 9.5, 3.0, 17.5, 2.48, 17.5, 2.3, 9.5, 2.75, 3.6, 2.45])),
    radome: polys(RADOME),
    band: zone(3.0, 3.36, 1.4, 2.7),
    nose: { ...zone(0, 4.2, 1.4, 2.9), dir: 'y', out: 1 },
    stripes: [P([0.6, 2.1, 9.5, 1.6, 16.6, 4.4])],
    trim: [P([0.8, 2.1, 9.0, 2.06, 18.0, 2.06]), P([2.8, 2.6, 2.8, 1.56])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const farF: Fin = { path: polys(far(FIN)), q: far(FIN_Q) };
  const shades = [
    { path: polys(band(TOP, -0.8, 1.8)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BELLY, -2.6, 0.8)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(P([5.5, 2.62, 18.3, 2.5, 18.3, 2.2, 5.6, 2.3])), color: 'rgba(255,255,255,0.08)', gloss: true },
    { path: polys(P([14.5, 2.95, 16.9, 4.88, 17.1, 4.88, 14.8, 2.95])), color: 'rgba(255,255,255,0.11)', gloss: true },
  ];
  const panels = lines([P([2.8, 2.6, 2.8, 1.56]), P([4.2, 2.66, 4.2, 1.5]), P([8.0, 2.95, 8.0, 1.33]), P([10.0, 2.99, 10.0, 1.3]),
    P([12.0, 2.95, 12.0, 1.3]), P([14.0, 2.82, 14.0, 1.36]), P([16.0, 2.62, 16.0, 1.47]), P([5.0, 2.62, 18.3, 2.5]),
    P([2.8, 2.05, 18.0, 2.0])]);
  const hinges = lines([P([15.6, 3.6, 16.9, 4.6, 17.85, 4.6]), P([17.3, 2.15, 19.5, 2.15])]);
  return {
    surface, fin, farF, shades, panels, hinges, wing: polys(WING), wingEdge: lines([P([7.0, 2.62, 10.5, 2.68, 14.2, 2.62])]),
    stab: polys(STAB), stabEdge: lines([P([15.0, 2.22, 17.3, 2.27, 19.6, 2.2])]), canopy: polys(CANOPY), mouth: polys(MOUTH),
    pylon: polys(PYLON), bow: lines([P([5.92, 2.7, 5.92, 3.26])]), windscreen: lines([P([3.85, 2.7, 4.3, 3.1])]),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  const [sx, sy] = at(7.8, 2.72);
  ctx.fillRect(sx, sy, 4.0 * K, 0.18 * K);
  for (const x of [5.15, 6.75]) {
    const seat = P([x + 0.4, 2.7, x + 0.3, 3.14, x + 0.05, 3.16, x - 0.05, 2.7]);
    ctx.fillStyle = '#2a2e34';
    ctx.beginPath();
    ctx.moveTo(seat[0] ?? 0, seat[1] ?? 0);
    for (let i = 2; i < seat.length; i += 2) ctx.lineTo(seat[i] ?? 0, seat[i + 1] ?? 0);
    ctx.fill();
    const [hx, hy] = at(x - 0.3, 3.0);
    helmet(ctx, hx, hy, 0.2 * K, '#4a515b', '#1d2126');
  }
}

export function drawF14Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = NOZZLE.r * (0.9 + o.throttle * 0.08);
  const [nx, nb] = at(5.4, 1.46);
  gearLeg(ctx, nx, nb, 0.28 * K, o.gear, { door: l.under, doorSide: 1, wheels: [1.2], far: true });
  if (o.gear > 0.9) {
    ctx.strokeStyle = '#3b4047';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(nx + 0.3, nb + 5); // catapult launch bar
    ctx.lineTo(nx + 5, -0.8);
    ctx.stroke();
  }
  gearLeg(ctx, 0, -1.3 * K, 0.47 * K, o.gear, { door: l.under, doorSide: -1, rake: 3 });
  flameSide(ctx, NOZZLE.x1, NOZZLE.y, r1 * 1.8, o.throttle, o.t);
  farFin(ctx, l, g.farF, 16);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 16);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.mouth);
  stroke(ctx, g.mouth, 'rgba(255,255,255,0.25)', 0.3);
  const [hx, hy] = at(16.4, 1.5);
  tailHook(ctx, hx, hy, 8, o.hook);
  const [gx, gy] = at(5.6, 3.15);
  canopySide(ctx, g.canopy, { glass: '#86c4e2', tint: 'rgba(120,180,215,0.35)', frame: 'rgba(35,40,46,0.8)' }, () => interior(ctx), gx, gy, 8);
  stroke(ctx, g.bow, 'rgba(35,40,46,0.85)', 0.6);
  stroke(ctx, g.windscreen, 'rgba(35,40,46,0.85)', 0.6);
  nozzleSide(ctx, NOZZLE.x0, NOZZLE.x1, NOZZLE.y, NOZZLE.r, r1);
  ctx.fillStyle = l.under;
  ctx.fill(g.pylon);
  stroke(ctx, g.pylon, l.ink, 0.3);
  const [mx, my] = at(7.0, 2.12);
  missileSide(ctx, mx, my, 3.96 * K, 1.2);
}
