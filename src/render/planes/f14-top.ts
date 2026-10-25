import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { addPoly, bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import type { Shade } from './paint-pass';
import { paintPass, panelLines } from './paint-pass';
import { glare, missileTop, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';

/**
 * F-14 seen from above, nose up (-y). Proportions of the real aircraft (19.1 m long, 19.5 m / 11.6 m span):
 * long radome, tandem canopy, big fixed glove from beside the cockpit to the wing pivot, widely spaced
 * nacelles with two close nozzles and the flat "beaver tail" between them, large swept stabilators.
 * Wings pivot at (±10.6, -1.4); sweep 0 = 20°, 1 = 68°.
 */

const FUSE: Pts = [0, -35, 0.7, -33.8, 1.3, -32.0, 1.85, -29.8, 2.25, -27.4, 2.6, -24.8, 2.85, -22, 3.0, -19, 3.1, -15.5,
  3.2, -11, 3.3, -6, 3.4, 0, 3.4, 20, 3.2, 24, 2.7, 28, 2.4, 31.2, 1.6, 32.4, 0, 32.7];
const NOSE: Pts = [0, -35, 0.7, -33.8, 1.3, -32.0, 1.85, -29.8, 2.25, -27.4, 2.6, -24.8, 2.85, -22, 3.0, -19, 3.1, -15.5, 3.15, -12, 0, -12];
const INTAKE: Pts = [3.0, -16.2, 7.4, -15.4, 7.8, -14.6, 7.9, -8, 7.9, -4, 3.2, -4];
const NACELLE: Pts = [3.2, -8, 7.9, -8, 8.0, 2, 7.9, 14, 7.5, 23, 7.0, 27.3, 2.3, 27.3, 2.2, 24, 2.8, 14];
const GLOVE: Pts = [3.0, -20.6, 3.9, -18.0, 5.3, -15.2, 7.0, -11.8, 9.0, -8.4, 11.0, -5.4, 12.6, -3.1, 13.5, -1.6, 13.8, 0, 13.4, 1.8,
  12.3, 4.0, 10.8, 6.6, 9.3, 9.2, 8.2, 11.6, 7.6, 12.6, 6.0, 6, 3.2, -6, 3.0, -15];
const STAB: Pts = [6.6, 12.4, 16.3, 23.4, 17.1, 24.8, 17.1, 28.6, 6.6, 27.4];
const FIN: Pts = [5.4, 8.6, 7.4, 16.6, 7.7, 26.4, 6.0, 27.2];
const CANOPY: Pts = [0, -21.4, 1.0, -20.5, 1.8, -18.5, 2.3, -15.4, 2.45, -11.8, 2.35, -8.4, 1.9, -6.1, 1.1, -5.0, 0, -4.7];
/** Outer wing panel in its own frame: pivot at the origin, span along +x, unswept (root corner chamfered). */
const WING: Pts = [-2, 2.2, 0.4, -1.9, 26.0, -0.4, 26.5, 0.8, 26.4, 2.8, 25.8, 3.9, 0, 9.4, -2, 7];
const FLAP: Pts = [2, 6.47, 17, 3.28, 17, 5.78, 2, 8.97];
const PIVOT_X = 10.6;
const PIVOT_Y = -1.4;
const NOZZLE_X = 4.65;

const sweepAngle = (sweep: number): number => ((20 + Math.max(0, Math.min(1, sweep)) * 48) * Math.PI) / 180;

function bodySurface(): Surface {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(INTAKE, NACELLE, GLOVE));
  return {
    key: 'f14-top', clip, box: bounds(sym(FUSE), GLOVE, mirror(GLOVE)), cell: 8,
    twoTone: polys(sym([0, -6, 3.4, -6, 7.9, -3, 8.0, 25, 4.6, 28, 2.4, 31, 0, 31.5])),
    radome: polys(sym([0, -35, 0.7, -33.8, 1.3, -32.0, 1.85, -29.8, 2.25, -27.4, 0, -27.0])),
    band: { x: -3.2, y: -26.4, w: 6.4, h: 2.6 },
    nose: { x: -4, y: -36, w: 8, h: 15, dir: 'x', out: 1 },
    stripes: [[0, -26, 2.5, -14, 13.4, -1.2], [0, -26, -2.5, -14, -13.4, -1.2]],
    trim: [[-2.4, -27.8, 0, -27.4, 2.4, -27.8], ...[[3.5, -20, 9.1, -8.5, 13.1, -2.4], [5.6, -6, 5.0, 8]].flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const body = bodySurface();
  const stab: Surface = {
    key: 'f14-stab', clip: pairs(STAB), box: bounds(STAB, mirror(STAB)), cell: 8,
    tails: [
      { x: 6.6, y: 12.4, w: 10.6, h: 16.4, dir: 'y', out: 1, ox: 7.0, oy: 27.2 },
      { x: -17.2, y: 12.4, w: 10.6, h: 16.4, dir: 'y', out: -1, ox: -7.0, oy: 27.2 },
    ],
  };
  const wing: Surface = {
    key: 'f14-wing', clip: polys(WING), box: bounds(WING), cell: 8,
    tips: [{ x: 19.5, y: -2, w: 7.5, h: 7, dir: 'y', out: 1 }],
    stripes: [[1, 1.8, 13, 1.6, 26.6, 0.8]], trim: [[0.6, -1.5, 25.8, -0.1]],
  };
  const bodyShades: Shade[] = [
    { path: polys(contourStrip(NOSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys(contourStrip(NOSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.14)', gloss: true },
    { path: pairs([3.3, -15.4, 7.5, -14.8, 7.7, -8, 3.3, -8]), color: 'rgba(0,0,0,0.05)' },
    { path: polys([3.6, -6, 5.0, -6, 4.3, 26, 2.9, 26], [-8.0, -6, -6.6, -6, -6.3, 26, -7.5, 26]), color: 'rgba(255,255,255,0.12)', gloss: true },
    { path: polys([6.6, -6, 8.0, -6, 7.5, 26, 6.3, 26], [-5.0, -6, -3.6, -6, -2.9, 26, -4.3, 26]), color: 'rgba(0,0,0,0.12)' },
    { path: pairs([12.3, 4.0, 10.8, 6.6, 9.3, 9.2, 8.2, 11.6, 7.6, 12.6, 7.4, 10, 9.6, 6.4, 11.6, 3.2]), color: 'rgba(0,0,0,0.07)' },
  ];
  const panels = lines([[-2.3, -27.5, 0, -27.1, 2.3, -27.5], ...[[3.4, -12.6, 7.7, -12.0], [3.4, -10.2, 7.8, -9.8], [5.6, -4, 5.0, 8],
    [3.3, 4, 7.9, 4], [3.0, 14, 7.8, 14], [1.6, -4, 1.6, 22], [4.6, -13, 12.6, -0.6], [2.6, -22, 3.0, -16]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[-1.9, 22.6, 1.9, 22.6], ...[[1.9, 22.6, 2.1, 29.8], [7.6, 14, 7.6, 27.2], [3.0, -16.0, 7.6, -15.2]]
    .flatMap((l) => [l, mirror(l)])]);
  const wingPanels = lines([[7, -1.6, 6.8, 8.0], [14.5, -1.3, 14.3, 6.3], [21, -0.9, 21, 4.9]]);
  const wingHinges = lines([[2.5, -1.2, 25, 0.1], [2, 6.47, 17, 3.28], [9.5, 7.4, 9.3, 4.9], [2.6, 4.6, 15, 2.1]]);
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p }));
  const silhouette = new Path2D();
  silhouette.addPath(body.clip);
  silhouette.addPath(stab.clip);
  silhouette.addPath(pairs([2.4, 26, 6.9, 26, 6.6, 30.9, 2.7, 30.9], [9.8, -12.2, 11.0, -12.2, 11.0, -4, 9.8, -4]));
  return {
    body, stab, wing, bodyShades, panels, hinges, wingPanels, wingHinges, fins, silhouette,
    gloveLE: lines([[3.3, -19.6, 5.4, -14.9, 9.0, -8.2, 12.5, -3.0]], true),
    mouths: pairs([3.1, -16.3, 7.5, -15.5, 7.5, -14.9, 3.1, -15.6]),
    wingShades: [{ path: polys(FLAP), color: 'rgba(0,0,0,0.08)' }] as Shade[],
    le: lines([[0.6, -1.6, 25.8, -0.2]]), canopy: polys(sym(CANOPY)),
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
  ctx.ellipse(0.6, -12.8, 1.4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f35';
  ctx.fillRect(-1.5, -18.0, 3, 0.8); // pilot coaming
  ctx.fillRect(-0.9, -13.4, 1.8, 1.3); // pilot seat
  ctx.fillRect(-1.3, -11.2, 2.6, 0.6); // RIO panel
  ctx.fillRect(-0.9, -7.6, 1.8, 1.3); // RIO seat
  stroke(ctx, path, 'rgba(35,40,46,0.8)', 0.4);
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(-1.85, -18.4);
  ctx.quadraticCurveTo(0, -19.2, 1.85, -18.4);
  ctx.moveTo(-1.95, -5.8);
  ctx.quadraticCurveTo(0, -6.4, 1.95, -5.8);
  ctx.stroke();
  glare(ctx, -0.95, -14.3, 0.55, 4.6, -0.06, 0.55);
  glare(ctx, 1.1, -8.8, 0.3, 1.4, 0, 0.35);
}

export function drawF14Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 2.0 + o.throttle * 0.45;
  flame(ctx, -NOZZLE_X, 30.7, r1 * 1.9, o.throttle, o.t);
  flame(ctx, NOZZLE_X, 30.7, r1 * 1.9, o.throttle, o.t + 0.3);
  for (const s of [1, -1]) missileTop(ctx, s * 10.4, -12.2, 8.5, 0.62);
  paintPass(ctx, l, g.stab, { shades: [], bank: o.bank });
  drawWing(ctx, l, 1, o);
  drawWing(ctx, l, -1, o);
  paintPass(ctx, l, g.body, { shades: g.bodyShades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  ctx.fillStyle = 'rgba(20,22,26,0.75)';
  ctx.fill(g.mouths);
  stroke(ctx, g.gloveLE, `rgba(255,255,255,${(0.28 * l.gloss).toFixed(2)})`, 0.35);
  finArtTop(ctx, l, g.fins);
  for (const f of g.fins) stroke(ctx, f.path, l.ink, 0.35);
  canopy(ctx, g.canopy);
  for (const s of [1, -1]) nozzleTop(ctx, s * NOZZLE_X, 27.3, 30.9, 2.35, r1);
  ctx.fillStyle = '#2a2d33';
  ctx.beginPath();
  ctx.ellipse(0, 32.9, 0.6, 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
}
