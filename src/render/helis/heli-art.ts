import type { Look } from '../livery-art';
import { bounds, pairs, polys, reversed, stroke, sym, type Pts } from '../planes/geom';
import { paintFleet, shapeKey } from '../fleet-paint';
import { wheel } from '../planes/parts';
import type { SideOpts, TopOpts } from '../planes/surface';
import { rotorBar, rotorDisc, rotorEdge } from './rotor';

// A helicopter drawn from its geometry (doc 51): the Tiger, Comanche and Hind share this renderer; the Apache has its
// own (doc 50). Top views nose up (-y) in 3.6 units per metre; side views nose right, 6.9 units per metre, the main
// gear's contact point at the origin — the same scales as the jets.

/** A helicopter from above. Halves (`body`, `canopies`) are right halves; `wing`, `stab`, `nacelle`, `fins` are drawn
 *  with their mirror image. */
export interface HeliTop {
  body: Pts;
  canopies: readonly Pts[];
  wing: Pts;
  stab: Pts;
  nacelle?: Pts;
  exhaust?: Pts;
  fins?: Pts;
  stores(ctx: CanvasRenderingContext2D): void;
  hub: { x: number; y: number };
  rotor: { r: number; blades: number; spin: number };
  /** Tail rotor seen edge-on (`x` < 0 = left of the fin), or a shrouded fan in the tail. */
  tail: { kind: 'rotor' | 'fan'; x: number; y: number; half: number };
  /** A mast sight above the rotor head (Tiger). */
  mast?: number;
}

const SHADE = 'rgba(0,0,0,0.15)';

/** The right half of a symmetric outline as a polygon closed along the centre line, for the shaded side. */
const rightHalf = (half: Pts): number[] => [0, half[1] ?? 0, ...half, 0, half[half.length - 1] ?? 0];

interface TopPaths { body: Path2D; shade: Path2D; wings: Path2D; stab: Path2D; silhouette: Path2D }
const cache = new WeakMap<HeliTop, TopPaths>();

/** The helicopter's paths, built once. */
function paths(h: HeliTop): TopPaths {
  let p = cache.get(h);
  if (!p) {
    const silhouette = new Path2D();
    silhouette.addPath(polys(sym(h.body)));
    silhouette.addPath(pairs(h.wing, h.stab, ...(h.nacelle ? [h.nacelle] : [])));
    p = { body: polys(sym(h.body)), shade: polys(rightHalf(h.body)), wings: pairs(h.wing), stab: pairs(h.stab), silhouette };
    cache.set(h, p);
  }
  return p;
}

export const heliTopSilhouette = (h: HeliTop): Path2D => paths(h).silhouette;

export function drawHeliTop(ctx: CanvasRenderingContext2D, look: Look, o: TopOpts, h: HeliTop): void {
  const g = paths(h);
  const body = g.body;
  ctx.fillStyle = look.base;
  ctx.fill(g.stab);
  ctx.fill(g.wings);
  h.stores(ctx);
  ctx.fillStyle = look.base;
  ctx.fill(body);
  paintFleet(ctx, look, body, bounds(sym(h.body)), shapeKey(h, 'top'), 'top'); // its paint job (doc 100)
  ctx.fillStyle = SHADE;
  ctx.fill(g.shade);
  if (h.nacelle) {
    ctx.fillStyle = look.base;
    ctx.fill(pairs(h.nacelle));
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill(polys(h.nacelle));
    stroke(ctx, pairs(h.nacelle), look.ink, 0.45);
  }
  if (h.exhaust) {
    ctx.fillStyle = '#1b1d17';
    ctx.fill(pairs(h.exhaust));
  }
  if (h.fins) {
    ctx.fillStyle = look.base;
    ctx.fill(pairs(h.fins));
    stroke(ctx, pairs(h.fins), look.ink, 0.4);
  }
  stroke(ctx, body, look.ink, 0.5);
  stroke(ctx, g.wings, look.ink, 0.45);
  stroke(ctx, g.stab, look.ink, 0.45);
  for (const c of h.canopies) {
    ctx.fillStyle = '#1d2a33';
    ctx.fill(polys(sym(c)));
    stroke(ctx, polys(sym(c)), 'rgba(60,66,52,0.9)', 0.35);
  }
  const c0 = h.canopies[0];
  if (c0) {
    ctx.fillStyle = 'rgba(190,220,240,0.3)';
    ctx.fill(polys([-0.9, (c0[1] ?? 0) + 1.2, -0.2, (c0[1] ?? 0) + 0.8, -0.3, (c0[1] ?? 0) + 4.5, -1.1, (c0[1] ?? 0) + 4.8]));
  }
  tailRotorTop(ctx, h, o.t);
  rotorDisc(ctx, h.hub.x + o.bank * 1.8, h.hub.y, h.rotor.r, h.rotor.blades, o.t, h.rotor.spin);
  if (h.mast) {
    ctx.fillStyle = '#2b2e27';
    ctx.beginPath();
    ctx.arc(h.hub.x + o.bank * 1.8, h.hub.y, h.mast, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tailRotorTop(ctx: CanvasRenderingContext2D, h: HeliTop, t: number): void {
  if (h.tail.kind === 'rotor') return rotorBar(ctx, h.tail.x, h.tail.y, h.tail.half, t);
  ctx.fillStyle = '#15171a';
  ctx.beginPath();
  ctx.ellipse(h.tail.x, h.tail.y, 1.1, h.tail.half, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A helicopter from the side, in metres: `x` back from the nose, `h` up from the ground. */
export interface HeliSide {
  /** Main gear, metres behind the nose: the drawing's origin. */
  xm: number;
  top: Pts;
  bottom: Pts;
  canopies: readonly Pts[];
  fin: Pts;
  stab: Pts;
  wing: Pts;
  nacelle?: Pts;
  hub: readonly [number, number];
  rotorHalf: number;
  tail: { kind: 'rotor' | 'fan'; x: number; h: number; r: number };
  /** Wheels: [metres behind the nose, wheel radius in metres]. */
  wheels: readonly (readonly [number, number])[];
  windows?: readonly (readonly [number, number])[];
  mast?: number;
}

const K = 6.9;

export function drawHeliSide(ctx: CanvasRenderingContext2D, look: Look, o: SideOpts, s: HeliSide): void {
  const P = (p: Pts): number[] => p.map((v, i) => (i % 2 === 0 ? (s.xm - v) * K : -v * K));
  const at = (x: number, h: number): [number, number] => [(s.xm - x) * K, -h * K];
  ctx.strokeStyle = '#2b2e27';
  ctx.lineWidth = 2;
  for (const [x, r] of s.wheels) {
    const [wx, wy] = at(x, r);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + 1, -(r + 0.55) * K);
    ctx.stroke();
    wheel(ctx, wx, wy, r * K);
  }
  const body = polys([...P(s.top), ...reversed(P(s.bottom))]);
  ctx.fillStyle = look.base;
  ctx.fill(body);
  ctx.fill(polys(P(s.fin)));
  paintFleet(ctx, look, body, bounds(P(s.top), P(s.bottom)), shapeKey(s, 'side'), 'side');
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fill(polys([...P(s.bottom.map((v, i) => (i % 2 === 1 ? v + 0.35 : v))), ...reversed(P(s.bottom))]));
  ctx.fillStyle = look.base;
  if (s.nacelle) ctx.fill(polys(P(s.nacelle)));
  ctx.fill(polys(P(s.stab)));
  ctx.fill(polys(P(s.wing)));
  stroke(ctx, body, look.ink, 0.8);
  stroke(ctx, polys(P(s.fin)), look.ink, 0.8);
  if (s.nacelle) stroke(ctx, polys(P(s.nacelle)), look.ink, 0.7);
  ctx.fillStyle = '#1d2a33';
  for (const c of s.canopies) ctx.fill(polys(P(c)));
  for (const [x, h] of s.windows ?? []) {
    const [wx, wy] = at(x, h);
    ctx.fillRect(wx - 2.5, wy - 2.5, 5, 5);
  }
  const [hx, hy] = at(s.hub[0], s.hub[1]);
  ctx.fillStyle = '#2b2e27';
  ctx.fillRect(hx - 1.5, hy, 3, 0.7 * K);
  if (s.mast) {
    ctx.beginPath();
    ctx.arc(hx, hy - s.mast * K, 0.3 * K, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(hx - 0.8, hy - s.mast * K, 1.6, s.mast * K);
  }
  const [tx, ty] = at(s.tail.x, s.tail.h);
  if (s.tail.kind === 'rotor') rotorDisc(ctx, tx, ty, s.tail.r * K, 4, o.t, -20);
  else rotorDisc(ctx, tx, ty, s.tail.r * K, 8, o.t, -30);
  rotorEdge(ctx, hx, hy, s.rotorHalf * K, o.t);
}
