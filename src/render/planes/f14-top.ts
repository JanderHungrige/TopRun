import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { addPoly, bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import type { Shade } from './paint-pass';
import { paintPass, panelLines } from './paint-pass';
import { glare, missileTop, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';

/** F-14 seen from above, nose up (-y). Variable-sweep wings pivot at (±13, -1); sweep 0 = 20°, 1 = 68°. */

const FUSE: Pts = [0, -35, 0.9, -33.5, 1.8, -31.2, 2.5, -28.5, 2.9, -26, 3.2, -23, 3.6, -20, 4.0, -17.5, 4.3, -12, 4.6, -6,
  5.6, -3, 6.8, -1, 6.8, 24, 5.6, 26.4, 4.6, 28.6, 3.4, 30.4, 1.8, 31.3, 0, 31.5];
const NOSE: Pts = [0, -35, 0.9, -33.5, 1.8, -31.2, 2.5, -28.5, 2.9, -26, 3.2, -23, 3.6, -20, 4.0, -17.5, 4.3, -12, 0, -12];
const INTAKE: Pts = [4.2, -14.2, 11.0, -11.8, 11.6, -11.0, 12.1, -7.5, 13.2, -4.2, 13.2, -2, 6.5, -2, 4.2, -4];
const NACELLE: Pts = [6.6, -6, 12.6, -6, 13.2, -4.2, 13.5, 2, 13.5, 22, 13.0, 26.9, 6.9, 26.9, 6.6, 20];
const GLOVE: Pts = [4.0, -17.5, 8.0, -11.6, 12.0, -5.6, 14.3, -2.6, 14.9, 0, 14.5, 2.0, 13.2, 3.4, 6.0, 0.5];
const STAB: Pts = [12.0, 16.0, 24.0, 26.2, 24.4, 29.4, 12.0, 30.6];
const FIN: Pts = [9.8, 10.5, 12.2, 18.0, 12.6, 28.0, 10.6, 28.6];
const CANOPY: Pts = [0, -24.5, 1.3, -23.6, 2.2, -21.6, 2.6, -19, 2.7, -16, 2.6, -13, 2.2, -11, 1.4, -9.8, 0, -9.5];
/** Wing in its own frame: pivot at the origin, span along +x, unswept. */
const WING: Pts = [-1, -2.5, 27, -0.8, 27.3, 1.2, 26.5, 3.2, 0, 10];
const FLAP: Pts = [2.35, 6.71, 18.35, 2.6, 19, 5.13, 3, 9.23];
const PIVOT_X = 13;
const PIVOT_Y = -1;

const sweepAngle = (sweep: number): number => ((20 + Math.max(0, Math.min(1, sweep)) * 48) * Math.PI) / 180;

function bodySurface(): Surface {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(INTAKE, NACELLE, GLOVE));
  return {
    key: 'f14-top', clip, box: bounds(sym(FUSE), GLOVE, mirror(GLOVE)), cell: 8,
    twoTone: polys(sym([0, -10, 3.6, -9, 5.5, -2, 9, 0, 13.3, 2, 13.3, 24, 7, 26.8, 4, 29.5, 0, 30])),
    radome: polys(sym([0, -35, 0.9, -33.5, 1.8, -31.2, 2.5, -28.5, 2.9, -26, 0, -25.6])),
    band: { x: -3.6, y: -25.2, w: 7.2, h: 2.2 },
    nose: { x: -5, y: -36, w: 10, h: 18, dir: 'x', out: 1 },
    stripes: [[0, -27, 4, -12, 14.5, -1], [0, -27, -4, -12, -14.5, -1]],
    trim: [[-2.9, -26.3, 0, -25.9, 2.9, -26.3], [4.6, -16.6, 13.9, -2.6], [-4.6, -16.6, -13.9, -2.6], [10, -5, 10, 9]],
  };
}

const geo = lazy(() => {
  const body = bodySurface();
  const stab: Surface = {
    key: 'f14-stab', clip: pairs(STAB), box: bounds(STAB, mirror(STAB)), cell: 8,
    tails: [
      { x: 12, y: 16, w: 12.6, h: 15, dir: 'y', out: 1, ox: 12.6, oy: 30.4 },
      { x: -24.6, y: 16, w: 12.6, h: 15, dir: 'y', out: -1, ox: -12.6, oy: 30.4 },
    ],
  };
  const wing: Surface = {
    key: 'f14-wing', clip: polys(WING), box: bounds(WING), cell: 8,
    tips: [{ x: 20, y: -2, w: 8, h: 6.5, dir: 'y', out: 1 }],
    stripes: [[1, 1.5, 14, 1.4, 27.5, 0.6]], trim: [[0, -1.7, 26.8, -0.2]],
  };
  const nacelleShades = [-1, 1].flatMap((s) => [
    { path: polys([s * 10 - 2.6, -5, s * 10 - 0.8, -5, s * 10 - 0.8, 26, s * 10 - 2.6, 26]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([s * 10 + 1.4, -5, s * 10 + 3.5, -5, s * 10 + 3.5, 26, s * 10 + 1.4, 26]), color: 'rgba(0,0,0,0.12)' },
  ]);
  const bodyShades: Shade[] = [
    { path: polys(contourStrip(NOSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys(contourStrip(NOSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: pairs([4.6, -12.6, 11, -10.6, 11.2, -5, 5, -4.6]), color: 'rgba(0,0,0,0.05)' },
    ...nacelleShades,
  ];
  const panels = lines([[-2.9, -26, 0, -25.6, 2.9, -26], [-2.6, 21.4, 2.6, 21.4], ...[[5, -9.8, 10.9, -8.0], [5.2, -7.2, 11, -5.8],
    [4.4, -12, 6.4, -2.6], [6.8, 6, 13.4, 6], [6.8, 16, 13.5, 16], [3.2, 0, 3.2, 20], [2.9, -24, 3.9, -13]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[2.6, 21.4, 4.0, 27.4], [13.8, 17.6, 13.8, 30.2], [4.4, -14.0, 11.2, -11.5]], true);
  const wingPanels = lines([[8, -1.4, 7, 7.9], [16, -0.9, 15.6, 5.9], [22, -0.5, 22, 4.4]]);
  const wingHinges = lines([[3, -1.0, 25, 0.4], [2.35, 6.71, 18.35, 2.6], [11, 7.18, 10.6, 4.66], [3.2, 5.0, 15, 2.1]]);
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p }));
  const silhouette = new Path2D();
  silhouette.addPath(body.clip);
  silhouette.addPath(stab.clip);
  silhouette.addPath(pairs([7.2, 26, 12.8, 26, 12.6, 31.3, 7.4, 31.3], [13.7, -11.6, 15.1, -11.6, 15.1, -2, 13.7, -2]));
  const gloveLE = lines([[4.2, -17.0, 8, -11.6, 11.6, -6.4]], true);
  return {
    body, stab, wing, gloveLE, mouths: pairs([4.3, -14.2, 11.1, -11.8, 11.1, -11.1, 4.3, -13.4]), bodyShades, panels, hinges, wingPanels, wingHinges, fins, silhouette,
    wingShades: [{ path: polys(FLAP), color: 'rgba(0,0,0,0.08)' }] as Shade[],
    le: lines([[-0.6, -2.1, 26.8, -0.5]]), canopy: polys(sym(CANOPY)),
  };
});

/** Wing outline at a sweep, in airframe coordinates (side 1 = right). */
function wingPts(sweep: number, side: 1 | -1): number[] {
  const a = sweepAngle(sweep);
  const c = Math.cos(a);
  const s = Math.sin(a);
  const out: number[] = [];
  for (let i = 0; i < WING.length; i += 2) {
    const x = WING[i] ?? 0;
    const y = WING[i + 1] ?? 0;
    out.push(side * (PIVOT_X + x * c - y * s), PIVOT_Y + x * s + y * c);
  }
  return out;
}

export function f14Silhouette(sweep: number): Path2D {
  const p = new Path2D();
  p.addPath(geo().silhouette);
  addPoly(p, wingPts(sweep, 1));
  addPoly(p, wingPts(sweep, -1));
  return p;
}

function drawWing(ctx: CanvasRenderingContext2D, l: Look, side: 1 | -1, o: TopOpts): void {
  const g = geo();
  const low = Math.sign(o.bank) === side ? Math.abs(o.bank) : 0;
  const cue: Shade = { path: g.wing.clip, color: `rgba(0,0,0,${(low * 0.2).toFixed(3)})` };
  ctx.save();
  ctx.translate(side * PIVOT_X, PIVOT_Y);
  ctx.scale(side, 1);
  ctx.rotate(sweepAngle(o.sweep));
  paintPass(ctx, l, g.wing, { shades: low > 0.02 ? [...g.wingShades, cue] : g.wingShades });
  panelLines(ctx, l, g.wingPanels, g.wingHinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.2 * l.gloss).toFixed(2)})`, 0.45);
  ctx.restore();
}

function canopy(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.fillStyle = '#80bedc';
  ctx.fill(path);
  ctx.fillStyle = 'rgba(20,50,80,0.42)';
  ctx.beginPath();
  ctx.ellipse(0.7, -16.5, 1.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f35';
  ctx.fillRect(-1.4, -20.9, 2.8, 0.8); // coaming
  ctx.fillRect(-1, -17.9, 2, 1.6); // pilot seat
  ctx.fillRect(-1, -12.6, 2, 1.6); // RIO seat
  stroke(ctx, path, 'rgba(35,40,46,0.8)', 0.4);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-2.3, -21.3);
  ctx.quadraticCurveTo(0, -22.1, 2.3, -21.3);
  ctx.moveTo(-2.2, -10.7);
  ctx.quadraticCurveTo(0, -11.3, 2.2, -10.7);
  ctx.stroke();
  glare(ctx, -1.0, -18, 0.6, 4, -0.08, 0.55);
  glare(ctx, 1.2, -13.5, 0.35, 1.2, 0, 0.35);
}

export function drawF14Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 2.5 + o.throttle * 0.5;
  flame(ctx, -10, 31.1, r1 * 1.9, o.throttle, o.t);
  flame(ctx, 10, 31.1, r1 * 1.9, o.throttle, o.t + 0.3);
  for (const s of [1, -1]) missileTop(ctx, s * 14.4, -11.6, 9.5, 0.7);
  paintPass(ctx, l, g.stab, { shades: [], bank: o.bank });
  drawWing(ctx, l, 1, o);
  drawWing(ctx, l, -1, o);
  paintPass(ctx, l, g.body, { shades: g.bodyShades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  ctx.fillStyle = 'rgba(20,22,26,0.75)';
  ctx.fill(g.mouths);
  stroke(ctx, g.gloveLE, 'rgba(0,0,0,0.25)', 0.7);
  stroke(ctx, g.gloveLE, `rgba(255,255,255,${(0.3 * l.gloss).toFixed(2)})`, 0.35);
  finArtTop(ctx, l, g.fins);
  for (const f of g.fins) stroke(ctx, f.path, l.ink, 0.35);
  canopy(ctx, g.canopy);
  for (const s of [1, -1]) nozzleTop(ctx, s * 10, 26.9, 31.3, 3.0, r1);
  ctx.fillStyle = '#2a2d33';
  ctx.beginPath();
  ctx.ellipse(0, 31.6, 0.7, 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
