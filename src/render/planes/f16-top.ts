import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import { paintPass, panelLines } from './paint-pass';
import { glare, missileTop, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';


/** F-16 seen from above, nose up (-y). ~50 px span with tip missiles, ~62 px long at scale 1. */

const FUSE: Pts = [0, -33, 0.9, -31.6, 1.7, -29.6, 2.3, -27.6, 2.7, -25.6, 3.0, -23, 3.2, -20, 3.4, -16.5, 3.7, -11, 4.0, -5,
  4.3, 2, 4.5, 9, 4.6, 15, 4.6, 20, 4.3, 24, 3.6, 26.4, 2.9, 27.2, 0, 27.4];
const WING: Pts = [3.3, -16.5, 4.3, -13, 5.5, -9.2, 6.9, -5.8, 8.4, -2.6, 22.6, 9.4, 22.6, 13.4, 4.4, 14.8, 3.6, 0];
const RAIL: Pts = [22.2, 3.5, 23.6, 3.5, 23.6, 14.2, 22.2, 14.2];
const STAB: Pts = [3.4, 18.2, 15.6, 25.4, 15.9, 28.4, 3.4, 28.6];
const FIN: Pts = [0, 8.5, 0.5, 11, 0.9, 15, 1.0, 20, 0.8, 25, 0.5, 27.8, 0, 28.2];
const CANOPY: Pts = [0, -23.6, 1.0, -22.2, 1.7, -19.8, 2.1, -16.8, 2.2, -14, 2.0, -11.4, 1.6, -9.6, 0.9, -8.4, 0, -8.0];
const FLAPERON: Pts = [5, 11.95, 15.5, 11.15, 15.5, 13.95, 5, 14.75];
const MISSILE_X = 24.4;

const geo = lazy(() => {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(WING, STAB, RAIL));
  const all = [sym(FUSE), WING, mirror(WING), STAB, mirror(STAB)];
  const surface: Surface = {
    key: 'f16-top', clip, box: bounds(...all), cell: 8,
    twoTone: polys(sym([0, -13, 3.0, -14.5, 5.6, -8.6, 9.6, -1, 12.6, 4.4, 12.4, 9.6, 9.2, 14.8, 4.8, 16.6, 4.2, 22, 2.4, 27, 0, 27])),
    radome: polys(sym([0, -33, 0.9, -31.6, 1.7, -29.6, 2.3, -27.6, 2.7, -25.6, 0, -25.2])),
    band: { x: -3.4, y: -28.4, w: 6.8, h: 2.6 },
    nose: { x: -4, y: -34, w: 8, h: 17, dir: 'x', out: 1 },
    tips: [{ x: 16.8, y: -3, w: 7.2, h: 18, dir: 'y', out: 1 }, { x: -24, y: -3, w: 7.2, h: 18, dir: 'y', out: -1 }],
    tails: [
      { x: 4.6, y: 18, w: 11.6, h: 11, dir: 'y', out: 1, ox: 4.6, oy: 28.8 },
      { x: -16.2, y: 18, w: 11.6, h: 11, dir: 'y', out: -1, ox: -4.6, oy: 28.8 },
    ],
    stripes: [[0, -25, 3, -8, 23, 11.5], [0, -25, -3, -8, -23, 11.5]],
    trim: [[-2.8, -25.9, 0, -25.5, 2.8, -25.9], [8.8, -1.7, 22.2, 9.6], [-8.8, -1.7, -22.2, 9.6],
      [1.7, -8.2, 1.9, 0, 1.6, 8.4], [-1.7, -8.2, -1.9, 0, -1.6, 8.4]],
  };
  const fin: Fin = { path: polys(sym(FIN)), q: [0.9, 12, -0.9, 12, -0.6, 27.4, 0.6, 27.4] };
  const shades = [
    { path: polys(contourStrip(FUSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(contourStrip(FUSE, 0.8, 1, 1)), color: 'rgba(0,0,0,0.1)' },
    { path: polys(contourStrip(FUSE, 0.84, 1, -1)), color: 'rgba(0,0,0,0.07)' },
    { path: polys(contourStrip(FUSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.13)', gloss: true },
    { path: polys([4.4, -4, 7.2, 0, 7.0, 14.5, 4.6, 14.7]), color: 'rgba(0,0,0,0.09)' },
    { path: pairs(FLAPERON, STAB), color: 'rgba(0,0,0,0.06)' },
  ];
  const panels = lines([
    [-2.7, -25.6, 0, -25.2, 2.7, -25.6], ...[[2.6, -21.5, 2.9, -15], [1.7, -8.2, 1.9, 0, 1.6, 8.6],
      [3.4, -16, 4.0, -5, 4.4, 5, 4.6, 14.6], [1.9, -2, 4.1, -2], [1.8, 4.5, 4.35, 4.5], [1.4, 15.4, 4.6, 15.4],
      [1.0, 21, 4.5, 21], [8.4, -2.6, 5.2, 0.8], [14, 4.4, 14, 14.1], [19, 8.6, 19, 13.7], [2.4, 23.6, 4.2, 23.6, 4.0, 27.2]]
      .flatMap((l) => [l, mirror(l)]),
  ]);
  const hinges = lines([[8.6, -0.4, 21.4, 10.4], [5, 11.95, 15.5, 11.15, 15.5, 13.95], [4.9, 19, 4.9, 28.4]], true);
  const le = lines([[8.7, -2.1, 22.3, 9.5], [3.9, 18.9, 15.2, 25.7]], true);
  const silhouette = new Path2D();
  silhouette.addPath(clip);
  silhouette.addPath(pairs([MISSILE_X - 1, 0, MISSILE_X + 1, 0, MISSILE_X + 1, 13.5, MISSILE_X - 1, 13.5], [-2.8, 26, 2.8, 26, 2.4, 30.8, -2.4, 30.8]));
  return { surface, fin, shades, panels, hinges, le, silhouette, canopy: polys(sym(CANOPY)) };
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
    ctx.fillRect(s * 12.05 - 0.5, -0.8, 1, 2);
    ctx.fillRect(s * 17.1 - 0.5, 3.4, 1, 2);
  }
  ctx.strokeStyle = 'rgba(25,30,36,0.8)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(0, -36.2);
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
  const r1 = 2.25 + o.throttle * 0.5;
  flame(ctx, 0, 30.4, r1 * 1.9, o.throttle, o.t);
  under(ctx);
  paintPass(ctx, l, g.surface, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.2 * l.gloss).toFixed(2)})`, 0.45);
  spine(ctx);
  finArtTop(ctx, l, [g.fin]);
  stroke(ctx, g.fin.path, l.ink, 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-0.55, 12, 0.45, 15);
  canopy(ctx, g.canopy);
  nozzleTop(ctx, 0, 26.6, 30.6, 2.75, r1);
  for (const s of [1, -1]) missileTop(ctx, s * MISSILE_X, 0, 13.5, 0.75);
}
