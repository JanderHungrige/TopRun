import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { band, bounds, lazy, lines, polys, reversed, stroke } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { flameSide, gearLeg, glare, nozzleSide } from './parts';
import { farFin } from './side-kit';
import type { Fin, SideOpts, Surface } from './surface';
import { finArtSide } from './tail-art';

/**
 * SR-71 side view, nose right, origin = main-gear deck contact. Long chined forebody, slender nacelle in front
 * of the fuselage with its inlet at mid-length; nozzle exit x = -66.
 */

const TOP: Pts = [80, -18.4, 75, -19.2, 69, -20.1, 62, -21.0, 56, -21.6, 54, -21.8, 40, -22.4, 29, -22.6, 10, -22.6, -10, -22.4,
  -30, -22.0, -46, -21.6, -58, -21.0, -64, -20.4];
const BOTTOM: Pts = [80, -18.4, 75, -17.6, 68, -16.9, 60, -16.3, 52, -15.9, 40, -15.5, 20, -15.3, 0, -15.3, -20, -15.4, -40, -15.9,
  -56, -16.7, -64, -17.6];
const NACELLE: Pts = [7.0, -21.4, 7.8, -22.2, 9.5, -22.6, -48, -22.6, -56, -22.0, -60, -21.8, -60, -13.2, -56, -13.0, -48, -12.4,
  9.5, -12.4, 7.8, -12.8, 7.0, -13.6];
const FIN: Pts = [-30, -22.6, -46, -40, -54, -40, -58.5, -22.6];
const SPIKE: Pts = [7.6, -21.0, 11.6, -19.4, 17.0, -17.6, 11.6, -15.6, 7.6, -14.0];
const HATCH: Pts = [54, -21.8, 52.4, -23.6, 49.5, -24.9, 45.5, -25.3, 42, -24.6, 40, -22.6, 40, -22.2];
const RSO: Pts = [36, -22.4, 34.5, -23.7, 30.5, -23.9, 29, -22.4];
const far = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v + 2.2 : v - 0.8));

const geo = lazy(() => {
  const body = [...TOP, ...reversed(BOTTOM)];
  const surface: Surface = {
    key: 'sr71-side', clip: polys(body, NACELLE, FIN, HATCH, RSO), box: bounds(body, NACELLE, FIN), cell: 10,
    under: polys([84, -18.2, 8, -18.0, 8, -17.4, -66, -17.4, -66, 2, 84, 2]),
    band: { x: 66, y: -25, w: 2.6, h: 13 },
    nose: { x: 50, y: -26, w: 32, h: 13, dir: 'y', out: 1 },
    stripes: [[74, -19.6, 0, -13, -46, -37]],
    trim: [[76, -18.2, 8, -18.0], [6, -21.0, -58, -21.0], [67.3, -20.6, 67.3, -16.8]],
  };
  const fin: Fin = { path: polys(FIN), q: FIN };
  const farFin: Fin = { path: polys(far(FIN)), q: far(FIN) };
  const shades = [
    { path: polys(band(TOP, -1, 1.6)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: polys(band(BOTTOM, -2.4, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys([9.5, -22.2, -60, -22.2, -60, -19.0, 9.5, -19.0]), color: 'rgba(255,255,255,0.09)', gloss: true },
    { path: polys([9.5, -21.6, -60, -21.2, -60, -20.2, 9.5, -20.2]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([9.5, -16.2, -60, -16.2, -60, -12.2, 9.5, -12.2]), color: 'rgba(0,0,0,0.16)' },
    { path: polys([9.5, -14, -60, -14, -60, -12.2, 9.5, -12.2]), color: 'rgba(0,0,0,0.16)' },
    { path: polys([-30, -22.6, -46, -40, -48, -40, -32.6, -22.6]), color: 'rgba(255,255,255,0.1)', gloss: true },
  ];
  const panels = lines([[-6, -22.6, -6, -12.4], [-22, -22.6, -22, -12.4], [-38, -22.6, -38, -12.4], [-50, -22.6, -50, -12.4],
    [54, -21.8, 54, -15.9], [40, -22.4, 40, -15.5], [29, -22.6, 29, -15.4], [7, -17.5, -60, -17.5]]);
  const hinges = lines([[-32, -24.0, -58.6, -24.0], [5.8, -22.4, 5.8, -12.6]]);
  return {
    surface, shades, panels, hinges, spike: polys(SPIKE), chine: lines([[78, -18.3, 8, -18.1]]),
    fin, farFin,
    hatch: polys(HATCH), rso: polys(RSO),
    panes: polys([53.4, -22.0, 52, -23.8, 49.6, -24.4, 49.8, -22.1], [49, -22.3, 49, -24.5, 44.6, -24.9, 44, -22.4],
      [34, -22.6, 33.4, -23.4, 31.6, -23.5, 31.6, -22.6]),
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
  ctx.arc(46.6, -22.6, 1.9, 0, Math.PI * 2); // pressure-suit helmet
  ctx.fillStyle = '#d9d4c4';
  ctx.fill();
  ctx.fillStyle = 'rgba(205,160,60,0.9)';
  ctx.fillRect(47.2, -23.6, 1.4, 1.6);
  ctx.restore();
  stroke(ctx, g.panes, 'rgba(10,12,16,0.85)', 0.35);
  glare(ctx, 49, -24, 3.4, 0.4, -0.08, 0.45);
}

function inlet(ctx: CanvasRenderingContext2D, spike: Path2D): void {
  ctx.beginPath();
  ctx.ellipse(7.6, -17.5, 1.1, 5.0, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#121418';
  ctx.fill();
  ctx.fillStyle = '#59606a';
  ctx.fill(spike);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(8, -20.0, 5.5, 1.4);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(8, -16, 5.5, 1.8);
}

export function drawSR71Side(ctx: CanvasRenderingContext2D, l: Look, o: SideOpts): void {
  const g = geo();
  const r1 = 4.7 + o.throttle * 0.5;
  gearLeg(ctx, 50, -15.9, 2.2, o.gear, { door: l.under, doorSide: 1, wheels: [1], far: true });
  gearLeg(ctx, -9.6, -12.4, 2.6, o.gear, { door: l.under, doorSide: -1, wheels: [-5.4, 5.4] });
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
  nozzleSide(ctx, -60, -66, -17.5, 4.6, r1);
}
