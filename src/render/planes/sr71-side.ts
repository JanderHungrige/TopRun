import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, glare, nozzleSide } from './parts';
import { farFin } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/** SR-71 side view, nose right, origin = main-gear deck contact. Nacelle in front of the fuselage; nozzle exit x = -66. */

const TOP: Pts = [80, -18.4, 76, -19.3, 71, -20.3, 65, -21.4, 59, -22.3, 54, -22.8, 40, -23.4, 29, -23.4, 10, -23.4, -10, -23.2,
  -30, -22.8, -46, -22.2, -58, -21.4, -64, -20.6];
const BOTTOM: Pts = [80, -18.4, 76, -17.6, 70, -16.8, 62, -16.0, 54, -15.6, 40, -15.0, 20, -14.8, 0, -14.8, -20, -15.0, -40, -15.6,
  -56, -16.6, -64, -17.6];
const NACELLE: Pts = [12.8, -22.2, 13.6, -23.2, 15, -23.6, -48, -23.6, -56, -23.0, -60, -22.8, -60, -12.2, -56, -12.0, -48, -11.4,
  15, -11.4, 13.6, -11.8, 12.8, -12.8];
const FIN: Pts = [-34, -23.6, -50, -41.5, -58, -41.5, -60.5, -23.6];
const SPIKE: Pts = [13.6, -22.0, 19, -19.6, 26, -17.6, 19, -15.4, 13.6, -13.0];
const HATCH: Pts = [54, -22.8, 52.4, -24.6, 49.5, -25.9, 45.5, -26.3, 42, -25.6, 40, -23.6, 40, -23.2];
const RSO: Pts = [36, -23.4, 34.5, -24.7, 30.5, -24.9, 29, -23.4];
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.2 : v - 0.8));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'sr71-side', clip: polys(body, NACELLE, FIN, HATCH, RSO), box: bounds(body, NACELLE, FIN), cell: 10,
    under: polys([84, -18.2, 14, -18.0, 14, -17.4, -66, -17.4, -66, 2, 84, 2]),
    band: { x: 66, y: -26, w: 2.6, h: 14 },
    nose: { x: 50, y: -27, w: 32, h: 14, dir: 'y', out: 1 },
    stripes: [[74, -19.6, 0, -13, -46, -38]],
    trim: [[76, -18.2, 14, -18.0], [12, -21.6, -58, -21.6], [67.3, -21, 67.3, -16.6]],
  };
  const fin: Fin = { path: polys(FIN), q: FIN };
  const farFin: Fin = { path: polys(far(FIN)), q: far(FIN) };
  const shades = [
    { path: polys(band(TOP, -1, 1.6)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BOTTOM, -2.4, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys([14.5, -23.2, -60, -23.2, -60, -19.6, 14.5, -19.6]), color: 'rgba(255,255,255,0.09)', gloss: true },
    { path: polys([14.5, -22.6, -60, -22.2, -60, -21, 14.5, -21]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([14.5, -16, -60, -16, -60, -11, 14.5, -11]), color: 'rgba(0,0,0,0.16)' },
    { path: polys([14.5, -13.4, -60, -13.4, -60, -11, 14.5, -11]), color: 'rgba(0,0,0,0.16)' },
    { path: polys([-34, -23.6, -50, -41.5, -52, -41.5, -36.6, -23.6]), color: 'rgba(255,255,255,0.1)', gloss: true },
  ];
  const panels = lines([[0, -23.6, 0, -11.4], [-16, -23.6, -16, -11.4], [-32, -23.6, -32, -11.4], [-46, -23.6, -46, -11.4],
    [54, -22.8, 54, -15.6], [40, -23.4, 40, -15.0], [29, -23.4, 29, -14.9], [12, -17.5, -60, -17.5]]);
  const hinges = lines([[-36, -25.0, -60.2, -25.0], [10.6, -23.4, 10.6, -11.6]]);
  return {
    surface, shades, panels, hinges, spike: polys(SPIKE), chine: lines([[78, -18.3, 14, -18.1]]),
    fin, farFin,
    hatch: polys(HATCH), rso: polys(RSO),
    panes: polys([53.4, -23.0, 52, -24.8, 49.6, -25.4, 49.8, -23.1], [49, -23.3, 49, -25.5, 44.6, -25.9, 44, -23.4],
      [34, -23.6, 33.4, -24.4, 31.6, -24.5, 31.6, -23.6]),
  };
});

function cockpit(ctx: CanvasRenderingContext2D, g: ReturnType<typeof geo>, l: Look): void {
  stroke(ctx, g.hatch, l.ink, 0.35);
  stroke(ctx, g.rso, l.ink, 0.35);
  ctx.fillStyle = '#2e4a63';
  ctx.fill(g.panes);
  ctx.save();
  ctx.clip(g.panes);
  ctx.beginPath();
  ctx.arc(46.6, -23.6, 1.9, 0, Math.PI * 2); // pressure-suit helmet
  ctx.fillStyle = '#d9d4c4';
  ctx.fill();
  ctx.fillStyle = 'rgba(205,160,60,0.9)';
  ctx.fillRect(47.2, -24.6, 1.4, 1.6);
  ctx.restore();
  stroke(ctx, g.panes, 'rgba(10,12,16,0.85)', 0.35);
  glare(ctx, 49, -25, 3.4, 0.4, -0.08, 0.45);
}

function inlet(ctx: CanvasRenderingContext2D, spike: Path2D): void {
  ctx.beginPath();
  ctx.ellipse(13.6, -17.5, 1.3, 6.0, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#121418';
  ctx.fill();
  ctx.fillStyle = '#59606a';
  ctx.fill(spike);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(14, -20.6, 6, 1.6);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(14, -15.6, 6, 2);
}

export function drawSR71Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 5.5 + o.throttle * 0.5;
  gearLeg(ctx, 50, -15.4, 2.2, o.gear, { door: l.under, doorSide: 1, wheels: [1], far: true });
  gearLeg(ctx, -9.6, -11.6, 2.6, o.gear, { door: l.under, doorSide: -1, wheels: [-5.4, 5.4] });
  flameSide(ctx, -66, -17.5, r1 * 1.9, o.throttle, o.t);
  farFin(ctx, l, g.farFin, 18);
  paintPass(ctx, l, g.surface, { shades: g.shades });
  finArtSide(ctx, l, g.fin, 18);
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.chine, `rgba(255,255,255,${(0.22 * l.gloss).toFixed(2)})`, 0.4);
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(80, -18.4); // pitot boom
  ctx.lineTo(86.5, -18.4);
  ctx.stroke();
  inlet(ctx, g.spike);
  cockpit(ctx, g, l);
  nozzleSide(ctx, -60, -66, -17.5, 5.7, r1);
}
