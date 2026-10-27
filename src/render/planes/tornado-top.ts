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
 * Tornado seen from above, nose up (-y). Real proportions (16.7 m long, 13.9 m / 8.6 m span, length ≈ 1.5 × span at
 * mid sweep): long radome, tandem canopy, wedge intakes, a short fixed glove, swing wings pivoting at (±8, -1)
 * (sweep 0 = 25°, 1 = 67°), big swept tailerons, one tall fin and two nozzles side by side.
 */

const FUSE: Pts = [0, -35, 0.7, -33.6, 1.3, -31.6, 1.8, -29.2, 2.2, -26.6, 2.5, -23.6, 2.7, -20, 2.9, -16, 3.1, -12, 4.4, -6,
  4.6, 0, 4.6, 20, 4.4, 25, 4.2, 29, 0, 29.4];
const NOSE: Pts = [0, -35, 0.7, -33.6, 1.3, -31.6, 1.8, -29.2, 2.2, -26.6, 2.5, -23.6, 2.7, -20, 2.9, -16, 3.0, -13, 0, -13];
const INTAKE: Pts = [3.0, -12.8, 6.2, -11.6, 6.4, -4, 4.4, -4];
const GLOVE: Pts = [3.0, -17, 4.2, -14, 6.0, -9.4, 7.8, -4.6, 9.6, -1.6, 9.8, 0.4, 9.0, 2.6, 7.2, 5.2, 4.6, 8.2];
const STAB: Pts = [4.4, 17, 14.8, 27.4, 15.4, 28.8, 15.4, 31.6, 4.4, 31.0];
const FIN: Pts = [0, 6, 0.6, 10, 0.9, 16, 0.9, 26, 0.6, 31.8, 0, 32.6];
const CANOPY: Pts = [0, -24.8, 1.0, -24, 1.7, -22, 2.0, -19, 2.1, -15, 2.0, -11, 1.6, -8.6, 0.9, -7.6, 0, -7.4];
/** Outer wing panel in its own frame: pivot at the origin, span along +x, unswept. */
const WING: Pts = [-1.6, 1.8, 0.4, -1.8, 20.4, -0.8, 21, 0.2, 20.8, 2.0, 20.2, 2.6, 0, 7.6, -1.6, 6];
const FLAP: Pts = [1.5, 5.0, 19, 2.0, 19, 3.6, 1.5, 7.2];
const PIVOT_X = 8.0;
const PIVOT_Y = -1.0;
const NOZZLE_X = 2.4;

const sweepAngle = (sweep: number): number => ((25 + Math.max(0, Math.min(1, sweep)) * 42) * Math.PI) / 180;

function bodySurface(): Surface {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(INTAKE, GLOVE));
  return {
    key: 'tornado-top', clip, box: bounds(sym(FUSE), GLOVE, mirror(GLOVE)), cell: 8,
    twoTone: polys(sym([0, -8, 4.4, -6, 4.6, 26, 0, 27])),
    radome: polys(sym([0, -35, 0.7, -33.6, 1.3, -31.6, 1.8, -29.2, 2.2, -26.6, 0, -26.2])),
    band: { x: -2.6, y: -26.2, w: 5.2, h: 2.4 },
    nose: { x: -3.2, y: -36, w: 6.4, h: 16, dir: 'x', out: 1 },
    stripes: [[0, -25, 2.4, -12, 9.6, -0.8], [0, -25, -2.4, -12, -9.6, -0.8]],
    trim: [[-2.2, -26.8, 0, -26.4, 2.2, -26.8], ...[[3.4, -15, 9.2, -1.6]].flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const body = bodySurface();
  const stab: Surface = {
    key: 'tornado-stab', clip: pairs(STAB), box: bounds(STAB, mirror(STAB)), cell: 8,
    tails: [
      { x: 4.4, y: 17, w: 11, h: 14.6, dir: 'y', out: 1, ox: 4.6, oy: 31 },
      { x: -15.4, y: 17, w: 11, h: 14.6, dir: 'y', out: -1, ox: -4.6, oy: 31 },
    ],
  };
  const wing: Surface = {
    key: 'tornado-wing', clip: polys(WING), box: bounds(WING), cell: 8,
    tips: [{ x: 14.5, y: -1.6, w: 7, h: 6.4, dir: 'y', out: 1 }],
    stripes: [[1, 1.6, 10, 1.4, 21, 0.8]], trim: [[0.6, -1.4, 20.2, -0.5]],
  };
  const bodyShades: Shade[] = [
    { path: polys(contourStrip(NOSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.14)' },
    { path: polys(contourStrip(NOSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.13)', gloss: true },
    { path: pairs([3.1, -12.4, 6.0, -11.4, 6.2, -5, 4.4, -5]), color: 'rgba(0,0,0,0.08)' },
    { path: polys([2.4, -4, 4.6, -2, 4.6, 26, 2.4, 26]), color: 'rgba(0,0,0,0.1)' },
    { path: polys([-4.6, -2, -2.6, -4, -2.6, 26, -4.6, 26]), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: pairs([9.0, 2.6, 7.2, 5.2, 4.6, 8.2, 4.6, 4.4]), color: 'rgba(0,0,0,0.07)' },
  ];
  const panels = lines([[-2.2, -26.4, 0, -26.0, 2.2, -26.4], ...[[3.2, -10, 6.2, -9.4], [1.4, -6, 1.4, 24], [2.6, 2, 4.6, 2],
    [2.6, 12, 4.6, 12], [2.6, 20, 4.4, 20], [4.0, -13.6, 9.2, -1.4]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[-2.0, 26.4, 2.0, 26.4], ...[[4.4, 22, 4.2, 29], [3.0, -12.8, 6.2, -11.6]].flatMap((l) => [l, mirror(l)])]);
  const wingPanels = lines([[6, -1.4, 5.6, 6.6], [12, -1.1, 11.8, 4.4]]);
  const wingHinges = lines([[1.5, 5.0, 19, 2.0], [2, -0.9, 19.6, -0.4]]);
  const fin: Fin = { path: polys(sym(FIN)), q: [0.85, 10, -0.85, 10, -0.7, 31, 0.7, 31] };
  const silhouette = new Path2D();
  silhouette.addPath(body.clip);
  silhouette.addPath(stab.clip);
  silhouette.addPath(polys([-4.2, 28, 4.2, 28, 4.0, 32.6, -4.0, 32.6]));
  return {
    body, stab, wing, bodyShades, panels, hinges, wingPanels, wingHinges, fin, silhouette,
    gloveLE: lines([[3.2, -16, 6.0, -9.4, 9.4, -1.8]], true),
    mouths: pairs([3.1, -12.6, 6.0, -11.5, 6.0, -10.8, 3.1, -11.9]),
    wingShades: [{ path: polys(FLAP), color: 'rgba(0,0,0,0.08)' }] as Shade[],
    le: lines([[0.6, -1.6, 20.2, -0.6]]), canopy: polys(sym(CANOPY)),
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

export function tornadoSilhouette(sweep: number): Path2D {
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
  missileTop(ctx, 9, -1.4, 7.5, 0.6);
  paintPass(ctx, l, g.wing, { shades: low > 0.02 ? [...g.wingShades, cue] : g.wingShades });
  panelLines(ctx, l, g.wingPanels, g.wingHinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.2 * l.gloss).toFixed(2)})`, 0.45);
  ctx.restore();
}

function canopy(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.fillStyle = '#86b6cf';
  ctx.fill(path);
  ctx.fillStyle = 'rgba(20,50,80,0.42)';
  ctx.beginPath();
  ctx.ellipse(0.5, -15.6, 1.3, 6.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f35';
  ctx.fillRect(-1.4, -21.0, 2.8, 0.7); // pilot coaming
  ctx.fillRect(-0.8, -17.0, 1.6, 1.2); // pilot seat
  ctx.fillRect(-1.2, -14.6, 2.4, 0.6); // navigator panel
  ctx.fillRect(-0.8, -11.4, 1.6, 1.2); // navigator seat
  stroke(ctx, path, 'rgba(35,40,46,0.8)', 0.4);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-1.8, -13.4);
  ctx.quadraticCurveTo(0, -14.0, 1.8, -13.4);
  ctx.stroke();
  glare(ctx, -0.9, -16.8, 0.5, 4.4, -0.06, 0.55);
}

export function drawTornadoTop(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 1.9 + o.throttle * 0.4;
  flame(ctx, -NOZZLE_X, 32.4, r1 * 1.8, o.throttle, o.t);
  flame(ctx, NOZZLE_X, 32.4, r1 * 1.8, o.throttle, o.t + 0.3);
  paintPass(ctx, l, g.stab, { shades: [], bank: o.bank });
  drawWing(ctx, l, 1, o);
  drawWing(ctx, l, -1, o);
  paintPass(ctx, l, g.body, { shades: g.bodyShades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  ctx.fillStyle = 'rgba(20,22,26,0.75)';
  ctx.fill(g.mouths);
  stroke(ctx, g.gloveLE, `rgba(255,255,255,${(0.26 * l.gloss).toFixed(2)})`, 0.35);
  finArtTop(ctx, l, [g.fin]);
  stroke(ctx, g.fin.path, l.ink, 0.35);
  canopy(ctx, g.canopy);
  for (const s of [1, -1]) nozzleTop(ctx, s * NOZZLE_X, 29.0, 32.6, 2.1, r1);
}
