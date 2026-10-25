import type { Look } from '../livery-art';
import { flame } from '../shapes';
import type { Pts } from './geom';
import { bounds, contourStrip, lazy, lines, mirror, pairs, polys, stroke, sym } from './geom';
import type { Shade } from './paint-pass';
import { paintPass, panelLines } from './paint-pass';
import { glare, nozzleTop } from './parts';
import type { Fin, Surface, TopOpts } from './surface';
import { finArtTop } from './tail-art';

/** SR-71 seen from above, nose up (-y): chined fuselage, delta wing, nacelles at ±14. ~58 × 80 px. */

const BODY: Pts = [0, -44, 0.9, -41, 1.8, -38, 2.7, -34.5, 3.7, -30.5, 4.8, -26, 6.0, -21.5, 7.4, -16.5, 9.0, -11.5, 10.6, -7,
  14, -4, 17.6, 0, 19.6, 4.2, 22.0, 9.6, 24.6, 15.6, 26.8, 20.6, 28.4, 24.6, 29.0, 26.4, 28.8, 28.0, 17.8, 29.0, 17.6, 30,
  10.4, 30.2, 5.0, 30.6, 3.4, 32.5, 1.8, 35.2, 0, 37];
const TUBE: Pts = [0, -44, 0.6, -41, 1.2, -38, 1.8, -34, 2.3, -29, 2.5, -22, 2.6, -10, 2.6, 20, 2.2, 30, 1.4, 34, 0, 36.5];
const NACELLE: Pts = [10.6, -12, 11.2, -12.8, 16.8, -12.8, 17.4, -12, 17.6, -8, 17.6, 28, 17.0, 31, 11.0, 31, 10.4, 28, 10.4, -8];
const SPIKE: Pts = [14, -20.5, 15.1, -17, 16.4, -12.6, 11.6, -12.6, 12.9, -17];
const FIN: Pts = [14.4, 15.5, 11.0, 23.5, 10.9, 30.0, 14.4, 30.6];
const CANOPY: Pts = [0, -28.6, 1.1, -27.4, 1.6, -25.2, 1.7, -22.4, 1.3, -20.6, 0, -20.2];
const HATCH: Pts = [0, -19.2, 1.4, -18.8, 1.6, -16, 1.4, -13.6, 0, -13.3];

/** Chine edge y at x (inner wing leading edge), from the BODY outline. */
function chineY(x: number): number {
  for (let i = 2; i < 22; i += 2) {
    const x0 = BODY[i - 2] ?? 0;
    const x1 = BODY[i] ?? 0;
    if (x >= x0 && x <= x1) return (BODY[i - 1] ?? 0) + ((x - x0) / (x1 - x0)) * ((BODY[i + 1] ?? 0) - (BODY[i - 1] ?? 0));
  }
  return 0;
}

/** Chordwise skin corrugations on the inner and outer wing. */
function corrugations(): number[][] {
  const out: number[][] = [];
  for (let x = 3.8; x < 10; x += 1.2) out.push([x, chineY(x) + 1.5, x, 29.8]);
  for (let x = 19; x < 28; x += 1.5) out.push([x, (x - 17.6) * 2.28 + 1.2, x, 28.4]);
  return out.flatMap((l) => [l, mirror(l)]);
}

const geo = lazy(() => {
  const clip = new Path2D();
  clip.addPath(polys(sym(BODY)));
  clip.addPath(pairs(NACELLE));
  const surface: Surface = {
    key: 'sr71-top', clip, box: bounds(sym(BODY)), cell: 9,
    band: { x: -4, y: -35.5, w: 8, h: 2.4 },
    nose: { x: -7, y: -45, w: 14, h: 22, dir: 'x', out: 1 },
    tips: [{ x: 22.8, y: 8, w: 7, h: 22, dir: 'y', out: 1 }, { x: -29.8, y: 8, w: 7, h: 22, dir: 'y', out: -1 }],
    stripes: [[0, -36, 9, -4, 28, 25], [0, -36, -9, -4, -28, 25]],
    trim: [[-2.6, -35.6, 0, -35.3, 2.6, -35.6], ...[[1.2, -40, 3.2, -31, 5.4, -22, 8.0, -13.4, 10.0, -8.4], [2.4, -13, 2.6, 28]]
      .flatMap((l) => [l, mirror(l)])],
  };
  const shades: Shade[] = [
    { path: polys(contourStrip(TUBE, 0.45, 1, 1)), color: 'rgba(0,0,0,0.16)' },
    { path: polys(contourStrip(TUBE, 0.1, 0.55, -1)), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: pairs([4.8, 27.8, 10.4, 27.6, 10.4, 30.2, 5, 30.6], [17.8, 26.4, 28.6, 25.4, 28.8, 28, 17.8, 29]), color: 'rgba(0,0,0,0.1)' },
    ...[-1, 1].flatMap((s) => [
      { path: polys([s * 14 - 2.8, -12, s * 14 - 0.9, -12, s * 14 - 0.9, 30, s * 14 - 2.8, 30]), color: 'rgba(255,255,255,0.1)', gloss: true },
      { path: polys([s * 14 + 1.2, -12, s * 14 + 3.7, -12, s * 14 + 3.7, 30, s * 14 + 1.2, 30]), color: 'rgba(0,0,0,0.2)' },
    ]),
  ];
  const panels = lines([[-2.6, -34, 0, -33.7, 2.6, -34], ...corrugations(), ...[[2.5, -20, 2.6, 30], [10.4, -6, 17.6, -6],
    [10.4, 8, 17.6, 8], [10.4, 20, 17.6, 20], [14, -12, 14, 15]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[4.6, 27.8, 10.4, 27.6], [17.8, 26.4, 28.6, 25.4], [23, 25.9, 23, 28.6], [14.4, 15.5, 14.4, 30.6]], true);
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p }));
  const silhouette = new Path2D();
  silhouette.addPath(clip);
  silhouette.addPath(pairs(SPIKE, [11, 30, 17, 30, 17.4, 34.4, 10.6, 34.4]));
  return {
    surface, shades, panels, hinges, fins, silhouette, spikes: pairs(SPIKE), canopy: polys(sym(CANOPY)), hatch: polys(sym(HATCH)),
    walkway: lines([[3, -6, 9.4, -6, 9.4, 26, 3, 26]], true),
  };
});

export const sr71Silhouette = (): Path2D => geo().silhouette;

function inlets(ctx: CanvasRenderingContext2D, spikes: Path2D): void {
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 14, -12.6, 3.3, 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#121418';
    ctx.fill();
  }
  ctx.fillStyle = '#59606a';
  ctx.fill(spikes);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (const s of [-1, 1]) ctx.fillRect(s * 14 - 1.6, -17, 1.2, 4.2);
}

function cockpit(ctx: CanvasRenderingContext2D, g: ReturnType<typeof geo>, l: Look): void {
  ctx.fillStyle = '#3f5d75';
  ctx.fill(g.canopy);
  ctx.fillStyle = 'rgba(10,20,30,0.45)';
  ctx.fillRect(0, -27, 1.4, 6.2);
  stroke(ctx, g.canopy, 'rgba(10,12,16,0.85)', 0.4);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-1.5, -25.3);
  ctx.lineTo(1.5, -25.3);
  ctx.moveTo(0, -28.4);
  ctx.lineTo(0, -25.3);
  ctx.stroke();
  glare(ctx, -0.7, -24, 0.45, 2.4, -0.1, 0.5);
  stroke(ctx, g.hatch, l.ink, 0.35);
  ctx.fillStyle = '#3f5d75';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 1.0, -17.4, 0.32, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSR71Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 3.4 + o.throttle * 0.4;
  flame(ctx, -14, 34.2, r1 * 1.9, o.throttle, o.t);
  flame(ctx, 14, 34.2, r1 * 1.9, o.throttle, o.t + 0.4);
  paintPass(ctx, l, g.surface, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.walkway, 'rgba(178,58,58,0.32)', 0.26);
  inlets(ctx, g.spikes);
  finArtTop(ctx, l, g.fins);
  for (const f of g.fins) stroke(ctx, f.path, l.ink, 0.35);
  for (const s of [-1, 1]) nozzleTop(ctx, s * 14, 31, 34.4, 3.3, r1);
  cockpit(ctx, g, l);
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -43); // pitot boom
  ctx.lineTo(0, -47.5);
  ctx.stroke();
}
