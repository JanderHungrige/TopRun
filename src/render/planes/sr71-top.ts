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
 * SR-71 seen from above, nose up (-y). Real proportions (32.7 m × 16.9 m, length ≈ 1.9 × span): long chined
 * forebody blending into the inner wing, nacelles at mid half-span (±11) with spikes ahead of the leading
 * edge, small round-tipped outer wings, pointed tail cone. ~42 × 81 px.
 */

const BODY: Pts = [0, -44, 0.55, -41, 1.1, -38, 1.65, -34.5, 2.2, -30.5, 2.7, -26.5, 3.15, -22.5, 3.55, -18.5, 3.9, -14.5,
  4.25, -11, 4.9, -8.6, 5.9, -6.0, 7.0, -3.8, 8.0, -2.0, 8.4, -1.0, 11, 0.5, 13.8, 2.6, 15.6, 7, 17.4, 11.2, 19.0, 15, 20.3, 18.6,
  21.0, 21.4, 21.3, 23.6, 21.0, 25.4, 20.2, 26.6, 19.0, 27.1, 13.8, 27.6, 8.2, 28.0, 4.0, 28.3, 3.0, 30.6, 1.8, 33.6, 0.7, 35.8, 0, 37];
const CHINE_POINTS = 15; // BODY points from the nose to where the inner wing meets the nacelle
const TUBE: Pts = [0, -44, 0.45, -41, 0.85, -37, 1.25, -32, 1.6, -26, 1.85, -18, 2.0, -8, 2.0, 20, 1.9, 28, 1.3, 33, 0, 37];
const NACELLE: Pts = [8.4, -3, 9.2, -3.8, 12.8, -3.8, 13.6, -3, 13.8, 0, 13.8, 28.5, 13.3, 31, 8.7, 31, 8.2, 28.5, 8.2, 0];
const SPIKE: Pts = [11, -9.4, 12.0, -6.6, 13.0, -4.0, 9.0, -4.0, 10.0, -6.6];
const FIN: Pts = [11.4, 14.5, 7.8, 22.5, 7.6, 29.6, 11.4, 30.4];
const CANOPY: Pts = [0, -28.4, 1.0, -27.3, 1.45, -25.3, 1.55, -22.8, 1.2, -21.2, 0, -20.8];
const HATCH: Pts = [0, -19.6, 1.3, -19.2, 1.5, -16.6, 1.3, -14.4, 0, -14.1];
const NAC_X = 11;

/** Chine / inner-wing leading edge y at x, from the BODY outline. */
function chineY(x: number): number {
  for (let i = 2; i < CHINE_POINTS * 2; i += 2) {
    const x0 = BODY[i - 2] ?? 0;
    const x1 = BODY[i] ?? 0;
    if (x >= x0 && x <= x1) return (BODY[i - 1] ?? 0) + ((x - x0) / (x1 - x0)) * ((BODY[i + 1] ?? 0) - (BODY[i - 1] ?? 0));
  }
  return 0;
}

/** Chordwise skin corrugations on the inner and outer wing. */
function corrugations(): number[][] {
  const out: number[][] = [];
  for (let x = 4.6; x < 8.1; x += 0.85) out.push([x, chineY(x) + 1.2, x, 27.6]);
  for (let x = 14.8; x < 20.6; x += 1.4) out.push([x, 2.6 + (x - 13.8) * 2.8 + 1.2, x, 26.6]);
  return out.flatMap((l) => [l, mirror(l)]);
}

function surface(): Surface {
  const clip = new Path2D();
  clip.addPath(polys(sym(BODY)));
  clip.addPath(pairs(NACELLE));
  return {
    key: 'sr71-top', clip, box: bounds(sym(BODY)), cell: 8,
    band: { x: -3, y: -35.6, w: 6, h: 2.4 },
    nose: { x: -4.5, y: -45, w: 9, h: 21, dir: 'x', out: 1 },
    tips: [{ x: 16.2, y: 8, w: 5.6, h: 20, dir: 'y', out: 1 }, { x: -21.8, y: 8, w: 5.6, h: 20, dir: 'y', out: -1 }],
    stripes: [[0, -36, 5, -6, 20.4, 22.5], [0, -36, -5, -6, -20.4, 22.5]],
    trim: [[-1.8, -35.9, 0, -35.6, 1.8, -35.9], ...[[0.75, -40, 1.9, -31, 2.8, -23, 3.5, -15, 4.2, -10, 6.6, -4.4], [1.9, -14, 2.0, 27]]
      .flatMap((l) => [l, mirror(l)])],
  };
}

const geo = lazy(() => {
  const surf = surface();
  const shades: Shade[] = [
    { path: polys(contourStrip(TUBE, 0.45, 1, 1)), color: 'rgba(0,0,0,0.16)' },
    { path: polys(contourStrip(TUBE, 0.1, 0.55, -1)), color: 'rgba(255,255,255,0.1)', gloss: true },
    { path: pairs([4.2, 26.4, 8.2, 26.1, 8.2, 28, 4, 28.3], [13.8, 25.8, 20.4, 25.2, 19, 27.1, 13.8, 27.6]), color: 'rgba(0,0,0,0.1)' },
    ...[-1, 1].flatMap((s) => [
      { path: polys([s * NAC_X - 2.4, -4, s * NAC_X - 0.7, -4, s * NAC_X - 0.7, 31, s * NAC_X - 2.4, 31]), color: 'rgba(255,255,255,0.1)', gloss: true },
      { path: polys([s * NAC_X + 0.9, -4, s * NAC_X + 2.9, -4, s * NAC_X + 2.9, 31, s * NAC_X + 0.9, 31]), color: 'rgba(0,0,0,0.2)' },
    ]),
  ];
  const panels = lines([[-2.0, -34, 0, -33.7, 2.0, -34], ...corrugations(), ...[[1.9, -20, 2.0, 28], [8.2, 4, 13.8, 4],
    [8.2, 14, 13.8, 14], [8.2, 22, 13.8, 22], [NAC_X, -3.8, NAC_X, 13]].flatMap((l) => [l, mirror(l)])]);
  const hinges = lines([[4.2, 26.4, 8.2, 26.1], [13.8, 25.8, 20.4, 25.2], [17, 25.5, 17, 27.3], [11.4, 14.5, 11.4, 30.4]], true);
  const fins: Fin[] = [FIN, mirror(FIN)].map((p) => ({ path: polys(p), q: p }));
  const silhouette = new Path2D();
  silhouette.addPath(surf.clip);
  silhouette.addPath(pairs(SPIKE, [8.6, 30, 13.4, 30, 13.6, 34.4, 8.4, 34.4]));
  return {
    surface: surf, shades, panels, hinges, fins, silhouette, spikes: pairs(SPIKE), canopy: polys(sym(CANOPY)), hatch: polys(sym(HATCH)),
    walkway: lines([[2.6, -9, 4.6, -6.2, 6.4, -3, 6.6, 0, 6.6, 25.6, 3.4, 27.4]], true),
  };
});

export const sr71Silhouette = (): Path2D => geo().silhouette;

function inlets(ctx: CanvasRenderingContext2D, spikes: Path2D): void {
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * NAC_X, -3.6, 2.5, 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#121418';
    ctx.fill();
  }
  ctx.fillStyle = '#59606a';
  ctx.fill(spikes);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (const s of [-1, 1]) ctx.fillRect(s * NAC_X - 1.1, -7.8, 0.8, 3.6);
}

function cockpit(ctx: CanvasRenderingContext2D, g: ReturnType<typeof geo>, l: Look): void {
  ctx.fillStyle = '#3f5d75';
  ctx.fill(g.canopy);
  ctx.fillStyle = 'rgba(10,20,30,0.45)';
  ctx.fillRect(0, -27, 1.3, 5.8);
  stroke(ctx, g.canopy, 'rgba(10,12,16,0.85)', 0.4);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-1.35, -25.5);
  ctx.lineTo(1.35, -25.5);
  ctx.moveTo(0, -28.2);
  ctx.lineTo(0, -25.5);
  ctx.stroke();
  glare(ctx, -0.6, -23.8, 0.4, 2.2, -0.1, 0.5);
  stroke(ctx, g.hatch, l.ink, 0.35);
  ctx.fillStyle = '#3f5d75';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * 0.9, -17.6, 0.3, 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSR71Top(ctx: CanvasRenderingContext2D, l: Look, o: TopOpts): void {
  const g = geo();
  const r1 = 2.6 + o.throttle * 0.4;
  flame(ctx, -NAC_X, 34.2, r1 * 1.9, o.throttle, o.t);
  flame(ctx, NAC_X, 34.2, r1 * 1.9, o.throttle, o.t + 0.4);
  paintPass(ctx, l, g.surface, { shades: g.shades, bank: o.bank });
  panelLines(ctx, l, g.panels, g.hinges);
  stroke(ctx, g.walkway, 'rgba(178,58,58,0.32)', 0.26);
  inlets(ctx, g.spikes);
  finArtTop(ctx, l, g.fins, 'rgba(0,0,0,0.3)');
  for (const f of g.fins) stroke(ctx, f.path, l.ink, 0.35);
  for (const s of [-1, 1]) nozzleTop(ctx, s * NAC_X, 31, 34.4, 2.5, r1);
  cockpit(ctx, g, l);
  ctx.strokeStyle = 'rgba(25,30,36,0.85)';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(0, -43); // pitot boom
  ctx.lineTo(0, -47.5);
  ctx.stroke();
}
