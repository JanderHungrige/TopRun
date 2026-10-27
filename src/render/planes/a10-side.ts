import type { Look } from '../livery-art';
import type { Pts, Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { gearLeg, helmet, missileSide, nozzleSide } from './parts';
import { canopySide, farFin, realProfile, sliver } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * A-10 side view from real dimensions (doc 04): 16.26 m long, 4.47 m to the fin tips, main gear in the wing pods 8 m
 * behind the nose; blunt nose with the GAU-8 under it, high bubble canopy, low straight wing, the engine pods high
 * on the rear fuselage, twin fins reaching above and below the tailplane. 6.9 units per metre.
 */

const K = 6.9;
const XM = 8.0;
const P = realProfile(K, XM);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 1.5, 0.15, 1.75, 0.5, 1.95, 1.0, 2.1, 1.6, 2.2, 2.0, 2.3, 4.6, 2.62, 5.5, 2.65, 7.0, 2.62, 9.0, 2.55,
  11.0, 2.42, 12.8, 2.3, 14.0, 2.22, 15.5, 2.15]);
const BOTTOM = P([0, 1.5, 0.15, 1.28, 0.5, 1.12, 1.0, 1.02, 2.0, 0.95, 4.0, 0.92, 6.0, 0.95, 8.0, 1.0, 10.0, 1.12, 12.0, 1.35,
  13.5, 1.6, 15.5, 1.95]);
const CANOPY = P([2.0, 2.3, 2.4, 2.75, 2.9, 3.15, 3.5, 3.3, 4.0, 3.2, 4.4, 2.95, 4.6, 2.62]);
const NACELLE = P([9.25, 2.55, 9.35, 3.45, 9.8, 3.62, 12.0, 3.6, 12.6, 3.45, 12.9, 3.15, 12.9, 2.75, 12.6, 2.45, 12.0, 2.3, 9.8, 2.28]);
const PYLON = P([10.2, 2.32, 11.6, 2.32, 11.8, 2.5, 10.0, 2.55]);
const FIN = P([14.75, 2.4, 14.8, 3.6, 15.05, 4.2, 15.5, 4.47, 16.0, 4.35, 16.26, 3.9, 16.26, 1.85, 16.1, 1.6, 15.6, 1.55, 15.1, 1.75,
  14.85, 2.05]);
const FIN_Q = P([14.85, 2.4, 15.3, 4.4, 16.1, 4.4, 16.26, 2.4]);
const STAB = P([13.4, 2.45, 15.5, 2.47, 16.4, 2.42, 15.5, 2.33, 13.5, 2.35]);
const WING = P([5.4, 1.42, 7.0, 1.47, 8.8, 1.42, 8.8, 1.3, 7.0, 1.3, 5.6, 1.32]);
const POD = P([5.6, 1.3, 8.6, 1.3, 8.9, 1.15, 8.6, 0.95, 5.9, 0.95, 5.5, 1.12]);
const INTAKE = P([9.25, 2.55, 9.35, 3.45, 9.55, 3.45, 9.45, 2.5]);
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 1.6 : v - 0.6));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'a10-side', clip: polys(body, NACELLE, PYLON, FIN), box: bounds(body, NACELLE, FIN), cell: 10,
    under: polys(P([-1, 1.55, 6, 1.6, 17, 1.95, 17, -0.3, -1, -0.3])),
    twoTone: polys(P([4.6, 2.62, 12.8, 2.3, 15.5, 2.15, 15.5, 1.95, 9.0, 2.2, 4.6, 2.35])),
    radome: polys(P([0, 1.5, 0.15, 1.75, 0.5, 1.95, 0.6, 1.98, 0.6, 1.1, 0.5, 1.12, 0.15, 1.28])),
    band: zone(1.2, 1.5, 1.0, 2.3),
    nose: { ...zone(0, 3.0, 0.9, 2.5), dir: 'y', out: 1 },
    stripes: [P([0.4, 1.6, 7.0, 1.7, 15.3, 4.2])],
    trim: [P([0.8, 1.7, 8.0, 1.75, 15.0, 2.0]), P([0.6, 1.98, 0.6, 1.1])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN_Q };
  const farF: Fin = { path: polys(far(FIN)), q: far(FIN_Q) };
  const shades = [
    { path: polys(band(TOP, -0.8, 1.6)), color: 'rgba(255,255,255,0.15)', gloss: true },
    { path: polys(band(BOTTOM, -2.2, 0.8)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(P([9.8, 3.62, 12.0, 3.6, 12.6, 3.45, 12.0, 3.35, 9.8, 3.38])), color: 'rgba(255,255,255,0.16)', gloss: true },
    { path: polys(P([9.8, 2.5, 12.0, 2.52, 12.6, 2.45, 12.0, 2.3, 9.8, 2.28])), color: 'rgba(0,0,0,0.16)' },
    { path: polys(P([14.85, 2.6, 15.05, 4.2, 15.3, 4.4, 15.1, 2.6])), color: 'rgba(255,255,255,0.12)', gloss: true },
  ];
  const panels = lines([P([0.6, 1.98, 0.6, 1.1]), P([2.0, 2.3, 2.0, 0.95]), P([4.6, 2.62, 4.6, 0.93]), P([7.0, 2.62, 7.0, 0.97]),
    P([10.0, 2.5, 10.0, 1.12]), P([12.5, 2.32, 12.5, 1.4]), P([1.0, 1.65, 8.0, 1.7, 14.5, 1.95]), P([10.5, 3.6, 10.5, 2.3])]);
  const hinges = lines([P([15.7, 4.4, 15.75, 1.6]), P([15.5, 2.4, 16.35, 2.4])]);
  return {
    surface, fin, farF, shades, panels, hinges, canopy: polys(CANOPY), wing: polys(WING),
    wingEdge: lines([P([5.4, 1.42, 7.0, 1.47, 8.8, 1.42])]), stab: polys(STAB), stabEdge: lines([P([13.4, 2.45, 15.5, 2.47, 16.4, 2.42])]),
    pod: polys(POD), intake: polys(INTAKE),
  };
});

function interior(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2a2e34';
  const [sx, sy] = at(4.5, 2.4);
  ctx.fillRect(sx, sy, 2.4 * K, 0.16 * K); // sill
  const seat = P([4.25, 2.4, 4.15, 3.02, 3.9, 3.04, 3.8, 2.4]);
  ctx.beginPath();
  ctx.moveTo(seat[0] ?? 0, seat[1] ?? 0);
  for (let i = 2; i < seat.length; i += 2) ctx.lineTo(seat[i] ?? 0, seat[i + 1] ?? 0);
  ctx.fill(); // seat headrest
  const [hx, hy] = at(3.45, 2.85);
  helmet(ctx, hx, hy, 0.2 * K, '#4a515b', '#1d2126');
  const [ux, uy] = at(2.5, 2.7);
  ctx.fillRect(ux, uy, 0.1 * K, 0.3 * K); // HUD
}

/** GAU-8: seven barrels sticking out under the nose, the drum behind them hidden in the fuselage. */
function gau8(ctx: CanvasRenderingContext2D): void {
  const [x0, y0] = at(0.35, 1.22);
  const w = 0.9 * K;
  ctx.fillStyle = '#2c3036';
  ctx.fillRect(x0 - w, y0, w + 0.35 * K, 0.18 * K);
  ctx.fillStyle = '#7a828b';
  ctx.fillRect(x0 - w, y0 + 0.2, w + 0.35 * K, 0.35);
  ctx.fillStyle = '#16181c';
  ctx.fillRect(x0 + 0.35 * K - 0.4, y0, 0.4, 0.18 * K);
}

export function drawA10Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const [nx, nb] = at(2.6, 0.95);
  gearLeg(ctx, nx, nb, 0.3 * K, o.gear, { door: l.under, doorSide: 1 });
  farFin(ctx, l, g.farF, 12);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 12);
  panelLines(ctx, l, g.panels, g.hinges);
  ctx.fillStyle = '#16181c';
  ctx.fill(g.intake);
  sliver(ctx, g.stab, g.stabEdge, l.gloss);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  ctx.fillStyle = l.under;
  ctx.fill(g.pod);
  stroke(ctx, g.pod, l.ink, 0.45);
  for (const x of [5.6, 6.6]) {
    const [mx, my] = at(x, 0.82);
    missileSide(ctx, mx, my, 2.5 * K, 0.9);
  }
  gau8(ctx);
  gearLeg(ctx, 0, -0.95 * K, 0.42 * K, o.gear, { door: l.under, doorSide: -1 });
  const [ex, ey] = at(12.9, 2.95);
  nozzleSide(ctx, ex, ex - 0.25 * K, ey, 0.42 * K, 0.4 * K);
  const [gx, gy] = at(3.4, 3.2);
  canopySide(ctx, g.canopy, { glass: '#86b2cc', tint: 'rgba(70,120,160,0.3)', frame: 'rgba(40,40,40,0.75)' }, () => interior(ctx), gx, gy, 5.4);
}
