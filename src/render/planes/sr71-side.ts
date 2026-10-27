import type { Look } from '../livery-art';
import type { Pts, Rect } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, glare, nozzleSide } from './parts';
import { farFin, realProfile, sliver } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * SR-71 side view from real dimensions (doc 04): 32.6 m long, 5.64 m to the fin tips, main gear 21 m behind the nose;
 * the long chined forebody, two-seat cockpit, the nacelle in front of the fuselage with its inlet spike, canted fins
 * on the nacelle's rear and the ejector nozzle. Nose right, origin = main-gear deck contact, 4.5 units per metre.
 */

const K = 4.5;
const XM = 21.0;
const P = realProfile(K, XM);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];
const zone = (x0: number, x1: number, h0: number, h1: number): Rect => ({ x: (XM - x1) * K, y: -h1 * K, w: (x1 - x0) * K, h: (h1 - h0) * K });

const TOP = P([0, 2.05, 2, 2.25, 4, 2.45, 6, 2.62, 7.0, 2.7, 8.0, 3.06, 9.0, 3.04, 9.8, 2.85, 10.3, 2.85, 10.9, 2.98, 11.6, 2.85,
  13, 2.78, 20, 2.75, 26, 2.7, 30.5, 2.55, 31.6, 2.42]);
const BOTTOM = P([0, 2.05, 2, 1.9, 4, 1.78, 7, 1.66, 10, 1.58, 14, 1.52, 20, 1.5, 26, 1.55, 30, 1.68, 31.6, 1.78]);
const NACELLE = P([14.2, 2.9, 15.5, 3.05, 18, 3.15, 27, 3.15, 29.5, 3.02, 31.0, 2.95, 31.0, 1.35, 29.5, 1.3, 27, 1.15, 18, 1.15,
  15.5, 1.25, 14.2, 1.4]);
const SPIKE = P([12.2, 2.15, 14.4, 2.82, 14.4, 1.48]);
const FIN = P([25.8, 3.15, 28.8, 5.64, 30.3, 5.64, 31.0, 3.0]);
const WING = P([14, 1.8, 22, 1.82, 31, 1.78, 31, 1.7, 22, 1.7, 14, 1.72]);
const HATCH = P([7.0, 2.7, 7.5, 2.92, 8.0, 3.06, 9.0, 3.04, 9.8, 2.85]);
const RSO = P([10.3, 2.85, 10.9, 2.98, 11.6, 2.85]);
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 1.8 : v - 0.6));
const NOZZLE = { x0: (XM - 31.0) * K, x1: (XM - 32.6) * K, y: -2.15 * K, r: 0.8 * K };

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'sr71-side', clip: polys(body, NACELLE, FIN), box: bounds(body, NACELLE, FIN), cell: 10,
    under: polys(P([-1, 1.95, 14, 1.95, 14, 1.75, 33, 1.75, 33, -0.3, -1, -0.3])),
    band: zone(4.6, 5.2, 1.6, 2.6),
    nose: { ...zone(0, 7.5, 1.5, 3.1), dir: 'y', out: 1 },
    stripes: [P([1.0, 2.0, 18, 1.7, 28.5, 5.0])],
    trim: [P([0.5, 1.95, 14, 1.95]), P([14.4, 2.85, 31.0, 2.85])],
  };
  const fin: Fin = { path: polys(FIN), q: FIN };
  const farF: Fin = { path: polys(far(FIN)), q: far(FIN) };
  const shades = [
    { path: polys(band(TOP, -0.6, 1.2)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BOTTOM, -1.8, 0.8)), color: 'rgba(0,0,0,0.14)' },
    { path: polys(P([15.5, 3.02, 31.0, 2.92, 31.0, 2.55, 15.5, 2.6])), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: polys(P([15.5, 1.65, 31.0, 1.7, 31.0, 1.35, 15.5, 1.27])), color: 'rgba(0,0,0,0.18)' },
    { path: polys(P([25.9, 3.2, 28.8, 5.64, 29.1, 5.64, 26.3, 3.2])), color: 'rgba(255,255,255,0.1)', gloss: true },
  ];
  const panels = lines([P([18, 3.15, 18, 1.15]), P([22, 3.15, 22, 1.15]), P([26, 3.15, 26, 1.15]), P([29.5, 3.02, 29.5, 1.3]),
    P([4, 2.45, 4, 1.78]), P([7, 2.7, 7, 1.66]), P([12, 2.8, 12, 1.55]), P([14.4, 2.2, 31.0, 2.2])]);
  const hinges = lines([P([27.6, 4.0, 30.0, 4.0]), P([14.3, 2.9, 14.3, 1.4])]);
  return {
    surface, fin, farF, shades, panels, hinges, spike: polys(SPIKE), chine: lines([P([0.4, 1.96, 14, 1.96])]),
    hatch: lines([HATCH]), rso: lines([RSO]), wing: polys(WING), wingEdge: lines([P([14, 1.8, 22, 1.82, 31, 1.78])]),
    panes: polys(P([7.2, 2.72, 7.6, 2.92, 8.1, 3.0, 8.1, 2.74]), P([8.25, 2.74, 8.25, 3.0, 8.9, 2.98, 8.95, 2.74]),
      P([10.5, 2.86, 10.9, 2.95, 11.3, 2.86])),
  };
});

function cockpit(ctx: CanvasRenderingContext2D, g: ReturnType<typeof geo>, l: Look): void {
  stroke(ctx, g.hatch, l.ink, 0.35);
  stroke(ctx, g.rso, l.ink, 0.35);
  ctx.fillStyle = '#2e4a63';
  ctx.fill(g.panes);
  ctx.save();
  ctx.clip(g.panes);
  const [hx, hy] = at(8.2, 2.88);
  ctx.beginPath();
  ctx.arc(hx, hy, 0.24 * K, 0, Math.PI * 2); // pressure-suit helmet
  ctx.fillStyle = '#d9d4c4';
  ctx.fill();
  ctx.fillStyle = 'rgba(205,160,60,0.9)';
  ctx.fillRect(hx + 0.6, hy - 0.8, 1.2, 1.4);
  ctx.restore();
  stroke(ctx, g.panes, 'rgba(10,12,16,0.85)', 0.35);
  const [gx, gy] = at(8.0, 3.0);
  glare(ctx, gx, gy, 3.0, 0.35, -0.08, 0.45);
}

function inlet(ctx: CanvasRenderingContext2D, spike: Path2D): void {
  const [ix, iy] = at(14.3, 2.15);
  ctx.beginPath();
  ctx.ellipse(ix, iy, 0.24 * K, 0.7 * K, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#121418';
  ctx.fill();
  ctx.fillStyle = '#59606a';
  ctx.fill(spike);
  const [sx, sy] = at(14.3, 2.45);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(sx, sy, 1.6 * K, 0.18 * K);
}

export function drawSR71Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = NOZZLE.r * (0.92 + o.throttle * 0.06);
  const [nx, nb] = at(9.8, 1.58);
  gearLeg(ctx, nx, nb, 0.32 * K, o.gear, { door: l.under, doorSide: 1, wheels: [1], far: true });
  gearLeg(ctx, 0, -1.5 * K, 0.42 * K, o.gear, { door: l.under, doorSide: -1, wheels: [-0.9 * K, 0.9 * K] });
  flameSide(ctx, NOZZLE.x1, NOZZLE.y, r1 * 1.8, o.throttle, o.t);
  farFin(ctx, l, g.farF, 14);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 14);
  panelLines(ctx, l, g.panels, g.hinges);
  sliver(ctx, g.wing, g.wingEdge, l.gloss);
  stroke(ctx, g.chine, `rgba(255,255,255,${(0.22 * l.gloss).toFixed(2)})`, 0.4);
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(XM * K, -2.05 * K); // pitot boom
  ctx.lineTo((XM + 1.1) * K, -2.05 * K);
  ctx.stroke();
  inlet(ctx, g.spike);
  cockpit(ctx, g, l);
  nozzleSide(ctx, NOZZLE.x0, NOZZLE.x1, NOZZLE.y, NOZZLE.r, r1);
}
