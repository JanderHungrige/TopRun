import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import type { Shade } from './paint-pass';
import { paintPass, panelLines } from './paint-pass';
import { glare, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';

/**
 * F-35 seen from above, nose up (-y). Real proportions (15.7 m long, 10.7 m span, length ≈ 1.47 × span): chined
 * nose, wide blended fuselage with the caret intakes, diamond wing and tailplanes, canted twin fins, one nozzle.
 * Weapons ride in the internal bays, so nothing hangs under the wings.
 */

const FUSE: Pts = [0, -33, 1.0, -31.4, 1.8, -29.4, 2.5, -27, 3.0, -24.4, 3.4, -21.6, 3.8, -18.6, 4.4, -15.6, 5.4, -13.2, 5.8, -11,
  5.9, -6, 5.9, 4, 5.8, 14, 5.4, 20, 4.4, 25, 3.2, 28.6, 2.6, 29.6, 0, 29.8];
const INTAKE: Pts = [4.4, -15.4, 6.0, -14.2, 6.6, -11.6, 6.6, -7.6, 5.8, -7.6];
const WING: Pts = [5.8, -4.6, 22.4, 9.4, 22.6, 12.2, 5.8, 16.4];
const STAB: Pts = [5.0, 17.4, 14.4, 25.2, 14.8, 28.2, 4.2, 29.6];
const FIN: Pts = [3.8, 10.4, 4.8, 10.0, 6.6, 22.4, 6.8, 26.8, 5.8, 27.0, 4.0, 15];
const CANOPY: Pts = [0, -25.4, 1.1, -24.4, 1.8, -22.2, 2.1, -19.2, 2.1, -16, 1.8, -13.6, 1.0, -12.2, 0, -11.8];
const FLAPERON: Pts = [6, 13.4, 17.6, 11.6, 18, 13.4, 6, 16.2];

function surface(clip: Path2D): Surface {
  return {
    key: 'f35-top', clip, box: bounds(sym(FUSE), WING, mirror(WING), STAB, mirror(STAB)), cell: 8,
    twoTone: polys(sym([0, -22, 3.4, -21.6, 5.6, -11, 5.8, 14, 4.4, 25, 0, 26])),
    radome: polys(sym([0, -33, 1.0, -31.4, 1.8, -29.4, 2.5, -27, 0, -26.6])),
    band: { x: -3.2, y: -24.4, w: 6.4, h: 2.4 },
    nose: { x: -4.4, y: -34, w: 8.8, h: 18, dir: 'x', out: 1 },
    tips: [{ x: 16, y: 6, w: 7, h: 7, dir: 'y', out: 1 }, { x: -23, y: 6, w: 7, h: 7, dir: 'y', out: -1 }],
    tails: [
      { x: 4.2, y: 17.4, w: 10.6, h: 12.2, dir: 'y', out: 1, ox: 4.4, oy: 29.4 },
      { x: -14.8, y: 17.4, w: 10.6, h: 12.2, dir: 'y', out: -1, ox: -4.4, oy: 29.4 },
    ],
    stripes: [[0, -24, 3.2, -8, 22.4, 10.8], [0, -24, -3.2, -8, -22.4, 10.8]],
    trim: [[-2.6, -26.4, 0, -26.0, 2.6, -26.4], ...[[6.2, -4, 22.2, 9.6], [5.6, 17.8, 14.2, 25.0]].flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(INTAKE, WING, STAB));
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p }));
  const shades: Shade[] = [
    { path: polys(contourStrip(FUSE, 0.55, 1, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(contourStrip(FUSE, 0.1, 0.5, -1)), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: pairs([5.8, 6, 22.5, 11, 22.6, 12.2, 5.8, 16.4]), color: 'rgba(0,0,0,0.06)' },
    { path: pairs(FLAPERON), color: 'rgba(0,0,0,0.06)' },
    { path: pairs([4.4, -15.4, 6.0, -14.2, 6.6, -11.6, 5.2, -12.6]), color: 'rgba(0,0,0,0.18)' },
  ];
  // Sawtooth panel edges (doors and access panels) are what makes the jet read as stealthy.
  const saw = (x0: number, y0: number, x1: number, y1: number): number[] => [x0, y0, (x0 + x1) / 2 + 0.6, (y0 + y1) / 2 - 0.8, x1, y1];
  const panels = lines([[-2.4, -26.2, 0, -25.8, 2.4, -26.2], ...[[3.0, -20, 4.8, -9], saw(1.6, -4, 4.4, -4), saw(1.4, 6, 4.8, 6),
    [2.2, -10, 2.2, 22], saw(1.6, 14, 5.0, 14), [9, -1.4, 9, 13.4], [14, 2.8, 14, 12.2]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[6, 13.4, 17.6, 11.6], [5.4, 26.4, 14.6, 26.6]], true);
  const silhouette = new Path2D();
  silhouette.addPath(clip);
  silhouette.addPath(pairs(FIN));
  silhouette.addPath(polys([-2.6, 29, 2.6, 29, 2.4, 33.4, -2.4, 33.4]));
  return {
    surface: surface(clip), fins, shades, panels, hinges, silhouette, canopy: polys(sym(CANOPY)),
    le: lines([[6.0, -4.4, 22.2, 9.4], [5.2, 17.6, 14.2, 25.0]], true),
    mouths: pairs([4.6, -15.2, 5.8, -14.4, 5.0, -13.4, 4.4, -14]),
  };
});

export const f35Silhouette = (): Path2D => geo().silhouette;

function canopy(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.fillStyle = '#9c7f45';
  ctx.fill(path);
  ctx.fillStyle = 'rgba(60,40,10,0.45)';
  ctx.beginPath();
  ctx.ellipse(0.5, -17.6, 1.3, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,32,36,0.75)';
  ctx.fillRect(-0.8, -16.4, 1.6, 1.4); // seat
  ctx.fillRect(-1.6, -21.2, 3.2, 0.7); // coaming
  stroke(ctx, path, 'rgba(30,32,36,0.8)', 0.35);
  glare(ctx, -0.8, -18.8, 0.5, 3.6, -0.1, 0.45);
}

export function drawF35Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 2.3 + o.throttle * 0.4;
  flame(ctx, 0, 33.2, r1 * 1.9, o.throttle, o.t);
  paintPass(ctx, l, g.surface, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.16 * l.gloss).toFixed(2)})`, 0.4);
  ctx.fillStyle = 'rgba(20,22,26,0.8)';
  ctx.fill(g.mouths);
  finArtTop(ctx, l, g.fins);
  for (const f of g.fins) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill(f.path);
    stroke(ctx, f.path, l.ink, 0.35);
  }
  canopy(ctx, g.canopy);
  nozzleTop(ctx, 0, 29.4, 33.4, 2.7, r1);
}
