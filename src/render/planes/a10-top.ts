import type { Look } from '../livery-art';
import type { Pts } from './geom';
import { bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import type { Shade } from './paint-pass';
import { paintPass, panelLines } from './paint-pass';
import { glare, missileTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';

/**
 * A-10 seen from above, nose up (-y). Real proportions (16.3 m long, 17.5 m span, length ≈ 0.93 × span): blunt
 * nose with the GAU-8 muzzle, bubble canopy far forward, straight thick wing with the main-gear pods ahead of it,
 * two engine pods high on the rear fuselage, a straight tailplane with a fin on each tip.
 */

const FUSE: Pts = [0, -32, 1.2, -31.6, 2.0, -30.6, 2.5, -29, 2.8, -26.5, 3.0, -23, 3.1, -18, 3.2, -12, 3.3, -6, 3.3, 0, 3.2, 6,
  3.0, 12, 2.7, 18, 2.3, 23, 1.9, 27, 1.4, 29.6, 0, 30.2];
const WING: Pts = [3.0, -3.4, 10, -3.4, 30.2, -2.6, 31.4, -1.8, 32, 0, 31.8, 2.6, 31, 4.0, 10, 6.8, 3.1, 7.2];
const POD: Pts = [7.0, -6.2, 7.6, -7.6, 8.3, -8.0, 9.0, -7.6, 9.6, -6.2, 9.6, -3, 7.0, -3];
const STAB: Pts = [1.8, 22.4, 13.4, 22.0, 13.9, 22.8, 13.9, 27.6, 13.4, 28.2, 1.6, 28.2];
const FIN: Pts = [13.2, 19.2, 14.0, 19.0, 14.6, 21, 14.7, 26, 14.4, 30.2, 13.6, 30.8, 13.0, 29, 12.9, 22];
const NACELLE: Pts = [3.6, 4.2, 4.2, 3.0, 5.6, 2.6, 7.0, 3.0, 7.8, 4.0, 8.1, 6, 8.1, 13, 7.8, 15.6, 7.2, 17.4, 4.0, 17.4, 3.4, 15.6,
  3.1, 13, 3.1, 6];
const CANOPY: Pts = [0, -25.4, 1.1, -24.8, 1.8, -23, 2.1, -20.5, 2.0, -17.6, 1.6, -15.8, 0.9, -15.0, 0, -14.8];
const AILERON: Pts = [20, 3.3, 30.6, 2.8, 30.4, 4.1, 20, 5.0];
const NACELLE_X = 5.6;

function bodySurface(): Surface {
  const clip = new Path2D();
  clip.addPath(polys(sym(FUSE)));
  clip.addPath(pairs(WING, POD, STAB, FIN));
  return {
    key: 'a10-top', clip, box: bounds(sym(FUSE), WING, mirror(WING), STAB, mirror(STAB)), cell: 8,
    twoTone: polys(sym([0, -14, 3.2, -12, 6, -3.3, 14, -3.2, 14, 6.4, 3.1, 7.4, 3.0, 12, 2.6, 22, 0, 22])),
    radome: polys(sym([0, -32, 1.2, -31.6, 2.0, -30.6, 2.5, -29, 0, -28.8])),
    band: { x: -3.1, y: -27.6, w: 6.2, h: 2.4 },
    nose: { x: -3.4, y: -33, w: 6.8, h: 15, dir: 'x', out: 1 },
    tips: [{ x: 25, y: -3.6, w: 7.6, h: 9, dir: 'y', out: 1 }, { x: -32.6, y: -3.6, w: 7.6, h: 9, dir: 'y', out: -1 }],
    tails: [
      { x: 1.8, y: 21.8, w: 12.2, h: 6.6, dir: 'y', out: 1, ox: 2, oy: 28 },
      { x: -14, y: 21.8, w: 12.2, h: 6.6, dir: 'y', out: -1, ox: -2, oy: 28 },
    ],
    stripes: [[0, -24, 2.8, -6, 31.2, 0.6], [0, -24, -2.8, -6, -31.2, 0.6]],
    trim: [[-2.6, -27, 0, -26.6, 2.6, -27], ...[[4, -3.8, 30, -3.0]].flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const body = bodySurface();
  const nacelle: Surface = { key: 'a10-nacelle', clip: pairs(NACELLE), box: bounds(NACELLE, mirror(NACELLE)), cell: 8 };
  const shades: Shade[] = [
    { path: polys(contourStrip(FUSE, 0.5, 1, 1)), color: 'rgba(0,0,0,0.12)' },
    { path: polys(contourStrip(FUSE, 0.12, 0.55, -1)), color: 'rgba(255,255,255,0.13)', gloss: true },
    { path: pairs([3.1, 2.4, 31.6, 1.2, 31, 4.0, 10, 6.8, 3.1, 7.2]), color: 'rgba(0,0,0,0.07)' },
    { path: pairs(AILERON), color: 'rgba(0,0,0,0.06)' },
    { path: pairs([1.8, 26, 13.9, 25.6, 13.9, 27.6, 13.4, 28.2, 1.6, 28.2]), color: 'rgba(0,0,0,0.08)' },
    { path: pairs(POD), color: 'rgba(0,0,0,0.06)' },
  ];
  const nacelleShades: Shade[] = [
    { path: pairs([3.4, 5, 4.6, 4.2, 4.4, 16.8, 3.4, 16.4]), color: 'rgba(255,255,255,0.16)', gloss: true },
    { path: pairs([6.6, 4, 8.1, 6, 8.1, 13, 7.2, 17.4, 6.4, 17.4]), color: 'rgba(0,0,0,0.16)' },
  ];
  const panels = lines([[-2.3, -27.6, 0, -27.2, 2.3, -27.6], ...[[2.9, -12, 3.2, -6], [1.6, -14, 1.8, 2], [1.6, 8, 1.4, 21],
    [3.2, -1, 1.2, -1], [3.1, 8, 1.4, 8], [10, -3.4, 10, 6.8], [17, -3.2, 17, 6.0], [24, -3.0, 24, 5.2], [3, 18, 1.5, 18]]
    .flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[10, 5.3, 20, 4.4], [20, 3.3, 30.6, 2.8], [2.2, 26, 13.6, 25.6]], true);
  const nacellePanels = lines([[3.4, 7, 7.8, 7], [3.2, 12, 8.0, 12]], true);
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p === FIN ? [14.0, 19.4, 13.1, 19.6, 13.3, 30.4, 14.4, 30.2]
    : mirror([14.0, 19.4, 13.1, 19.6, 13.3, 30.4, 14.4, 30.2]) }));
  const silhouette = new Path2D();
  silhouette.addPath(body.clip);
  silhouette.addPath(nacelle.clip);
  silhouette.addPath(pairs(FIN, [-0.9, -34.8, 0.6, -34.8, 0.6, -31, -0.9, -31]));
  return {
    body, nacelle, shades, nacelleShades, panels, hinges, nacellePanels, fins, silhouette,
    le: lines([[3.4, -3.3, 30.2, -2.5]], true), canopy: polys(sym(CANOPY)),
    intakes: pairs([4.0, 3.2, 7.2, 3.2, 7.6, 4.4, 3.6, 4.4]),
  };
});

export const a10Silhouette = (): Path2D => geo().silhouette;

function canopy(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.fillStyle = '#7fa9c2';
  ctx.fill(path);
  ctx.fillStyle = 'rgba(20,45,70,0.45)';
  ctx.beginPath();
  ctx.ellipse(0.5, -19.6, 1.3, 4.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,32,36,0.75)';
  ctx.fillRect(-0.8, -18.6, 1.6, 1.4); // seat
  ctx.fillRect(-1.5, -22.8, 3.0, 0.7); // coaming
  stroke(ctx, path, 'rgba(35,40,46,0.8)', 0.4);
  glare(ctx, -0.8, -20.6, 0.5, 3.0, -0.1, 0.55);
}

/** GAU-8 muzzle (seven barrels peeking from the nose, offset to port) and the pitot. */
function gun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#2c3036';
  ctx.fillRect(-0.9, -34.6, 1.5, 3.2);
  ctx.fillStyle = '#6b727b';
  for (let i = 0; i < 3; i++) ctx.fillRect(-0.75 + i * 0.45, -34.6, 0.25, 2.6);
}

/** Engine pods: intake rings, the pods themselves and the exhausts (no afterburner on the TF34). */
function engines(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const heat = 0.25 + o.throttle * 0.35;
  const g = geo();
  for (const s of [1, -1]) {
    ctx.fillStyle = 'rgba(40,44,50,0.5)';
    ctx.fillRect(s * NACELLE_X - 1.1, 3.6, 2.2, 13.8); // pylon shadow
  }
  paintPass(ctx, l, g.nacelle, { shades: g.nacelleShades, bank: o.bank });
  panelLines(ctx, l, g.nacellePanels, new Path2D());
  ctx.fillStyle = 'rgba(20,22,26,0.8)';
  ctx.fill(g.intakes);
  for (const s of [1, -1]) {
    ctx.fillStyle = '#3a3f46';
    ctx.beginPath();
    ctx.ellipse(s * NACELLE_X, 17.6, 2.0, 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,170,90,${(heat * 0.35).toFixed(2)})`; // exhaust glow, no afterburner on the TF34
    ctx.beginPath();
    ctx.ellipse(s * NACELLE_X, 17.8, 1.3, 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawA10Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  for (const s of [1, -1]) for (const x of [14.5, 20.5]) missileTop(ctx, s * x, -6.4, 9, 0.7);
  gun(ctx);
  paintPass(ctx, l, g.body, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.le, `rgba(255,255,255,${(0.22 * l.gloss).toFixed(2)})`, 0.45);
  engines(ctx, l, o);
  finArtTop(ctx, l, g.fins);
  for (const f of g.fins) stroke(ctx, f.path, l.ink, 0.35);
  canopy(ctx, g.canopy);
}
