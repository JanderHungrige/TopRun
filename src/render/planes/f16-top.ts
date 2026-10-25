import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { glare, missileTop, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';


/**
 * F-16 seen from above, nose up (-y). Real proportions (15.1 m long, 10.0 m span over the tip missiles,
 * length ≈ 1.5 × span): ~66 px long, ~45 px wide at scale 1.
 */

const FUSE: Pts = [0, -34.5, 0.8, -33.0, 1.5, -31.0, 2.05, -28.8, 2.45, -26.4, 2.7, -24, 2.85, -21, 2.95, -18, 3.1, -14, 3.3, -9,
  3.5, -3, 3.7, 4, 3.8, 10, 3.8, 16, 3.6, 21, 3.3, 24.5, 2.9, 26.8, 2.4, 27.6, 0, 27.8];
const WING: Pts = [2.9, -17, 3.6, -14, 4.5, -11, 5.6, -8.4, 6.8, -6.2, 7.6, -5.0, 19.4, 4.9, 19.4, 9.3, 3.7, 11.0, 3.0, 0];
const RAIL: Pts = [19.0, 0.5, 20.2, 0.5, 20.2, 10.2, 19.0, 10.2];
const STAB: Pts = [3.0, 15.2, 12.2, 22.4, 12.4, 27.0, 3.0, 27.8];
const FIN: Pts = [0, 7, 0.45, 9.5, 0.85, 13.5, 0.95, 18, 0.8, 23, 0.5, 26.6, 0, 27.4];
const CANOPY: Pts = [0, -22.6, 0.95, -21.2, 1.6, -18.8, 2.0, -16.0, 2.1, -13.4, 1.95, -11.0, 1.55, -9.3, 0.85, -8.3, 0, -7.9];
const FLAPERON: Pts = [4.5, 8.51, 13.5, 7.54, 13.5, 9.94, 4.5, 10.91];
const MISSILE_X = 20.6;

function surface(clip: Path2D): Surface {
  return {
    key: 'f16-top', clip, box: bounds(sym(FUSE), WING, mirror(WING), STAB, mirror(STAB)), cell: 8,
    twoTone: polys(sym([0, -12, 2.8, -13.5, 5.0, -8, 8.4, -1.6, 11.0, 2.6, 10.8, 7.0, 8.0, 11.0, 4.2, 12.8, 3.6, 20, 2.2, 26, 0, 26])),
    radome: polys(sym([0, -34.5, 0.8, -33.0, 1.5, -31.0, 2.05, -28.8, 2.45, -26.4, 0, -26.0])),
    band: { x: -3, y: -29, w: 6, h: 2.6 },
    nose: { x: -3.6, y: -35.5, w: 7.2, h: 18, dir: 'x', out: 1 },
    tips: [{ x: 15, y: -5, w: 7.6, h: 16, dir: 'y', out: 1 }, { x: -22.6, y: -5, w: 7.6, h: 16, dir: 'y', out: -1 }],
    tails: [
      { x: 3.9, y: 15, w: 8.6, h: 13, dir: 'y', out: 1, ox: 3.9, oy: 27.6 },
      { x: -12.5, y: 15, w: 8.6, h: 13, dir: 'y', out: -1, ox: -3.9, oy: 27.6 },
    ],
    stripes: [[0, -26, 2.6, -9, 19.8, 7.8], [0, -26, -2.6, -9, -19.8, 7.8]],
    trim: [[-2.4, -26.7, 0, -26.3, 2.4, -26.7], ...[[8.0, -4.1, 19.0, 5.1], [1.6, -8.2, 1.8, 0, 1.5, 7.4]].flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(WING, STAB, RAIL));
  const fin: Fin = { path: polys(sym(FIN)), q: [0.85, 10.5, -0.85, 10.5, -0.6, 26.6, 0.6, 26.6] };
  const shades = [
    { path: polys(contourStrip(FUSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(contourStrip(FUSE, 0.8, 1, 1)), color: 'rgba(0,0,0,0.1)' },
    { path: polys(contourStrip(FUSE, 0.84, 1, -1)), color: 'rgba(0,0,0,0.07)' },
    { path: polys(contourStrip(FUSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.13)', gloss: true },
    { path: polys([3.7, -6, 6.0, -3, 5.8, 10.8, 3.8, 11.0]), color: 'rgba(0,0,0,0.09)' },
    { path: pairs(FLAPERON, STAB), color: 'rgba(0,0,0,0.06)' },
  ];
  const panels = lines([[-2.4, -26.4, 0, -26.0, 2.4, -26.4], ...[[2.3, -22, 2.6, -16], [1.6, -8.2, 1.8, 0, 1.5, 7.6],
    [2.9, -16.5, 3.4, -6, 3.7, 4, 3.8, 10.8], [1.8, -2, 3.5, -2], [1.7, 4, 3.7, 4], [1.3, 12.2, 3.8, 12.2], [1.0, 19, 3.7, 19],
    [7.6, -5.0, 4.6, -2.2], [11.5, -1.7, 11.5, 10.1], [16, 2.0, 16, 9.6], [2.1, 22.4, 3.5, 22.4, 3.3, 26.6]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[7.7, -3.1, 18.1, 5.6], [4.5, 8.51, 13.5, 7.54, 13.5, 9.94], [4.0, 16.2, 4.0, 27.6]], true);
  const le = lines([[7.9, -4.6, 19.2, 4.9], [3.6, 16.0, 11.9, 22.5]], true);
  const silhouette = new Path2D();
  silhouette.addPath(clip);
  silhouette.addPath(pairs([MISSILE_X - 0.9, -3.6, MISSILE_X + 0.9, -3.6, MISSILE_X + 0.9, 9.4, MISSILE_X - 0.9, 9.4],
    [-2.6, 27, 2.6, 27, 2.2, 31.5, -2.2, 31.5]));
  return { surface: surface(clip), fin, shades, panels, hinges, le, silhouette, canopy: polys(sym(CANOPY)) };
});

export const f16Silhouette = (): Path2D => geo().silhouette;

function canopy(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.fillStyle = '#c99a3c';
  ctx.fill(path);
  ctx.fillStyle = 'rgba(80,52,12,0.42)';
  ctx.beginPath();
  ctx.ellipse(0.55, -14.5, 1.25, 5.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b2f35';
  ctx.fillStyle = 'rgba(30,32,36,0.7)';
  ctx.fillRect(-0.7, -12.6, 1.4, 1.2);
  stroke(ctx, path, 'rgba(40,40,40,0.75)', 0.4);
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(-1.85, -10.7);
  ctx.quadraticCurveTo(0, -11.3, 1.85, -10.7);
  ctx.moveTo(-1.1, -21.4);
  ctx.lineTo(1.1, -21.4);
  ctx.stroke();
  glare(ctx, -0.8, -17.4, 0.55, 3.4, -0.1, 0.6);
  glare(ctx, 0.9, -11.9, 0.3, 0.6, 0, 0.4);
}

/** Pylon noses peeking ahead of the leading edge and the pitot (drawn under the airframe). */
function under(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#7d868f';
  for (const s of [1, -1]) {
    ctx.fillRect(s * 10.5 - 0.45, -3.6, 0.9, 2);
    ctx.fillRect(s * 14.8 - 0.45, 0, 0.9, 2);
  }
  ctx.strokeStyle = 'rgba(25,30,36,0.8)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -33.5);
  ctx.lineTo(0, -37.4);
  ctx.stroke();
}

/** Refuelling receptacle and blade antenna on the spine. */
function spine(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(25,30,36,0.5)';
  ctx.fillRect(-0.7, -5.4, 1.4, 2.4);
  ctx.strokeStyle = 'rgba(25,30,36,0.7)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -0.8);
  ctx.lineTo(0, 0.8);
  ctx.stroke();
}

export function drawF16Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 2.15 + o.throttle * 0.45;
  flame(ctx, 0, 31.3, r1 * 1.9, o.throttle, o.t);
  under(ctx);
  paintPass(ctx, l, g.surface, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.2 * l.gloss).toFixed(2)})`, 0.45);
  spine(ctx);
  finArtTop(ctx, l, [g.fin]);
  stroke(ctx, g.fin.path, l.ink, 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-0.5, 10.5, 0.42, 15.5);
  canopy(ctx, g.canopy);
  nozzleTop(ctx, 0, 27.4, 31.5, 2.6, r1);
  for (const s of [1, -1]) missileTop(ctx, s * MISSILE_X, -3.6, 13, 0.62);
}
