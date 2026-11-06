import type { Look } from '../livery-art';
import { lazy, lines, polys, reversed, stroke, type Pts } from '../planes/geom';
import { wheel } from '../planes/parts';
import type { SideOpts } from '../planes/surface';
import { rotorDisc, rotorEdge } from './rotor';

/**
 * AH-64 Apache side view from real dimensions (doc 50): 15.5 m fuselage, the main gear 4.3 m behind the nose, the
 * rotor hub 3.9 m up, the 14.6 m rotor, the tail wheel under the fin and the tail rotor high on its left. Nose to the
 * right (+x), the main-gear contact point at the origin, 6.9 units per metre like the jets' side views.
 */

const K = 6.9;
const XM = 4.3;
const P = (p: Pts): number[] => p.map((v, i) => (i % 2 === 0 ? (XM - v) * K : -v * K));

const TOP = P([0, 1.15, 0.3, 1.5, 0.9, 1.8, 1.4, 2.3, 2.4, 2.55, 3.4, 2.75, 4.2, 3.1, 5.2, 3.15, 6.4, 2.75, 7.6, 2.45, 9.0, 2.15,
  13.4, 2.0, 14.4, 2.3]);
const BOTTOM = P([0, 1.15, 0.3, 0.9, 1.2, 0.75, 2.4, 0.72, 4.6, 0.82, 6.6, 0.95, 8.0, 1.25, 9.4, 1.55, 14.0, 1.5, 14.4, 1.6]);
const FIN = P([13.4, 2.0, 14.0, 2.0, 15.0, 3.4, 15.5, 3.55, 15.6, 3.2, 15.2, 1.7, 14.4, 1.4]);
const CANOPY = P([0.9, 1.8, 1.4, 2.35, 2.4, 2.6, 3.4, 2.8, 3.9, 2.85, 3.6, 2.2, 2.4, 2.0, 1.3, 1.75]);
const NACELLE = P([4.4, 2.35, 4.7, 2.75, 7.4, 2.75, 7.8, 2.55, 7.6, 2.05, 4.6, 2.0]);
const WING = P([3.6, 1.45, 6.0, 1.5, 6.0, 1.3, 3.8, 1.25]);
const STAB = P([13.4, 1.62, 14.8, 1.66, 14.8, 1.52, 13.5, 1.48]);
const at = (x: number, h: number): [number, number] => [(XM - x) * K, -h * K];

const geo = lazy(() => ({
  body: polys([...TOP, ...reversed(BOTTOM)]),
  fin: polys(FIN),
  canopy: polys(CANOPY),
  nacelle: polys(NACELLE),
  wing: polys(WING),
  stab: polys(STAB),
  frames: lines([[...at(2.45, 2.6), ...at(2.4, 2.0)], [...at(3.45, 2.8), ...at(3.5, 2.15)]]),
  panels: lines([[...at(4.4, 2.9), ...at(4.6, 0.82)], [...at(8.0, 2.4), ...at(8.0, 1.25)], [...at(11.5, 2.05), ...at(11.5, 1.52)]]),
}));

function hellfires(ctx: CanvasRenderingContext2D): void {
  const [x, y] = at(4.9, 1.05);
  ctx.fillStyle = '#5e6347';
  for (const dy of [0, 4]) ctx.fillRect(x - 12, y + dy, 24, 2.8);
  ctx.fillStyle = '#2a2d22';
  for (const dy of [0, 4]) ctx.fillRect(x + 10, y + dy, 2.5, 2.8);
}

export function drawAh64Side(ctx: CanvasRenderingContext2D, look: Look, o: SideOpts): void {
  const g = geo();
  const [gx] = at(XM, 0);
  const [tx, ty] = at(14.6, 0.32);
  ctx.strokeStyle = '#2b2e27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx, -0.5 * K);
  ctx.lineTo(gx, -0.3 * K);
  ctx.moveTo(tx, ty);
  ctx.lineTo(tx + 3, -1.45 * K);
  ctx.stroke();
  wheel(ctx, gx, -0.33 * K, 0.33 * K);
  wheel(ctx, tx, ty, 0.2 * K);
  ctx.fillStyle = look.base;
  ctx.fill(g.body);
  ctx.fill(g.fin);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill(polys(P([0.3, 0.95, 4.6, 0.85, 9.4, 1.55, 14.0, 1.5, 14.0, 1.75, 9.0, 1.85, 4.6, 1.2, 0.3, 1.25])));
  ctx.fillStyle = look.base;
  ctx.fill(g.nacelle);
  ctx.fill(g.stab);
  ctx.fill(g.wing);
  hellfires(ctx);
  stroke(ctx, g.body, look.ink, 0.8);
  stroke(ctx, g.fin, look.ink, 0.8);
  stroke(ctx, g.nacelle, look.ink, 0.7);
  stroke(ctx, g.panels, look.panel, 0.6);
  ctx.fillStyle = '#1d2a33';
  ctx.fill(g.canopy);
  stroke(ctx, g.frames, 'rgba(60,66,52,0.9)', 0.7);
  const [cx, cy] = at(1.25, 0.55);
  ctx.fillStyle = '#23261f';
  ctx.fillRect(cx - 3, cy - 2, 7, 5);
  ctx.fillRect(cx + 4, cy, 5, 1.6);
  const [hx, hy] = at(4.75, 3.9);
  ctx.fillStyle = '#2b2e27';
  ctx.fillRect(hx - 1.5, hy, 3, 0.75 * K);
  const [rx, ry] = at(15.2, 2.85);
  rotorDisc(ctx, rx - 2, ry, 1.4 * K, 4, o.t, -20);
  rotorEdge(ctx, hx, hy, 7.3 * K, o.t);
}
