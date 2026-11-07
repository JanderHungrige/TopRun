import type { Look } from '../livery-art';
import { lines, pairs, polys, reversed, stroke, sym, type Pts } from '../planes/geom';
import type { SideOpts, TopOpts } from '../planes/surface';

/**
 * The rest of the sub fleet (doc 69) in the Type 212's arcade style (doc 67): bow up (-y) in the top view, bow to the
 * right in the side view with the keel at y = 0. Each class is a spec — hull, sail, planes, tail — drawn by one routine:
 * the Seawolf long and fat with a shrouded pump-jet, the Virginia near-black with a filleted sail, the Akula broad with
 * the towed-array pod on its fin.
 */

export interface SubSpec {
  /** Right halves, top view: hull and sail; one side of the bow / sail planes and of the tail fins. */
  hull: Pts;
  sail: Pts;
  planes: Pts;
  tail: Pts;
  /** The screw (a spinning blur) or a pump-jet (a shrouded ring) at the stern. */
  stern: { y: number; w: number; jet: boolean };
  /** Side view: the hull's top and bottom profile (bow first), the sail and the fins. */
  sideTop: Pts;
  sideBottom: Pts;
  sideSail: Pts;
  sideFins: Pts;
  /** The Akula's pod on top of the fin (side view), or null. */
  pod: Pts | null;
}

export const SEAWOLF_SUB: SubSpec = {
  hull: [0, -34, 2.6, -33, 5, -30.4, 6.9, -26, 8.1, -19, 8.4, -10, 8.4, 10, 7.8, 17, 6.4, 23, 4.4, 28, 2.4, 31.4, 0, 32.4],
  sail: [0, -21, 1.6, -20.2, 2.5, -17.8, 2.7, -13, 2.3, -9.4, 1.4, -7.6, 0, -7.2],
  planes: [6.6, -25, 12, -24.2, 12.2, -22.8, 7.2, -21.6],
  tail: [3, 25.8, 10.4, 27.6, 10.6, 29.6, 3, 29.6],
  stern: { y: 33.6, w: 3.2, jet: true },
  sideTop: [56, -8, 54, -12.6, 49, -15.6, 40, -16.6, -32, -16.6, -42, -15, -50, -11.6, -55, -8.6, -58, -7],
  sideBottom: [56, -8, 54, -3.4, 49, -0.8, 40, 0, -32, 0, -42, -1.4, -50, -4, -55, -6, -58, -7],
  sideSail: [30, -16.6, 29.2, -24, 27, -26, 16, -26.4, 13.6, -25, 12, -16.6],
  sideFins: [-48, -12.8, -53, -21, -56, -21, -55, -11, -48, -2.2, -53, 6, -56, 6, -55, -3],
  pod: null,
};

export const VIRGINIA_SUB: SubSpec = {
  hull: [0, -34.4, 2.2, -33.6, 4.4, -31.4, 6.2, -27.4, 7.4, -21, 7.8, -12, 7.8, 9, 7.2, 16, 5.8, 22.4, 4, 27.6, 2.2, 31, 0, 32],
  sail: [0, -22.4, 2.4, -21.2, 3.2, -18, 3, -13, 2.2, -10.2, 0, -9.6],
  planes: [3, -16.8, 7.8, -16.2, 8, -15, 3, -14.6],
  tail: [2.8, 25, 9.4, 28.6, 9.8, 30.6, 8.4, 30.8, 2, 28.2],
  stern: { y: 33.2, w: 3, jet: true },
  sideTop: [56, -7.4, 54.4, -11.8, 50, -14.8, 41, -15.8, -30, -15.8, -41, -14.4, -49, -11, -54, -8, -57, -6.6],
  sideBottom: [56, -7.4, 54.4, -3, 50, -0.7, 41, 0, -30, 0, -41, -1.2, -49, -3.6, -54, -5.4, -57, -6.6],
  sideSail: [33, -15.8, 31, -21, 28.6, -24.6, 18, -25, 15, -22, 13.4, -15.8],
  sideFins: [-47, -12, -52, -20.4, -55, -20.4, -54, -10.4, -47, -2.4, -52, 5.6, -55, 5.6, -54, -3],
  pod: null,
};

export const AKULA_SUB: SubSpec = {
  hull: [0, -33, 3.2, -32, 6.2, -29, 8.4, -24, 9.6, -16, 10, -6, 10, 10, 9.4, 17, 7.8, 23, 5.4, 28, 2.8, 31.2, 0, 32],
  sail: [0, -12.6, 2.4, -11.6, 3.4, -8.6, 3.6, -3, 3, 1.8, 1.6, 4, 0, 4.4],
  planes: [8.6, -24.4, 13.8, -23.4, 14, -21.6, 9.2, -20.4],
  tail: [3.6, 25, 11.6, 27, 11.8, 29.4, 3.4, 29.4],
  stern: { y: 33.2, w: 4.4, jet: false },
  sideTop: [56, -9, 53.6, -14.4, 48, -18, 38, -19.2, -30, -19.2, -40, -17.6, -48, -14, -54, -10, -57, -8],
  sideBottom: [56, -9, 53.6, -3.8, 48, -1, 38, 0, -30, 0, -40, -1.6, -48, -4.4, -54, -6.6, -57, -8],
  sideSail: [10, -19.2, 9, -27, 6.4, -30, -6, -30.4, -9.4, -28, -11, -19.2],
  sideFins: [-46, -15.4, -50, -25.8, -54, -25.8, -54, -13, -46, -2.8, -51, 6.4, -55, 6.4, -54, -3.6],
  pod: [-49, -25.8, -48.6, -28.4, -54.6, -28.4, -55.6, -26.6],
};

const cache = new Map<SubSpec, ReturnType<typeof build>>();

function build(s: SubSpec): { hull: Path2D; sail: Path2D; planes: Path2D; tail: Path2D; deck: Path2D; seams: Path2D; silhouette: Path2D } {
  const silhouette = new Path2D();
  silhouette.addPath(polys(sym(s.hull)));
  silhouette.addPath(pairs(s.planes, s.tail));
  return {
    hull: polys(sym(s.hull)), sail: polys(sym(s.sail)), planes: pairs(s.planes), tail: pairs(s.tail),
    deck: polys([-1, -30, 1, -30, 1.2, 20, 0, 27, -1.2, 20]),
    seams: lines([[-7.8, -14, 7.8, -14], [-8, 4, 8, 4], [-6.4, 18, 6.4, 18]]),
    silhouette,
  };
}

const geo = (s: SubSpec): ReturnType<typeof build> => {
  let g = cache.get(s);
  if (!g) {
    g = build(s);
    cache.set(s, g);
  }
  return g;
};

export const subSilhouette = (s: SubSpec): Path2D => geo(s).silhouette;

function stern(ctx: CanvasRenderingContext2D, s: SubSpec, t: number): void {
  const { y, w, jet } = s.stern;
  if (jet) {
    ctx.strokeStyle = '#1a1f24';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, y, w, 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(200,220,230,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, y + (jet ? 0 : 0.8), w * Math.abs(Math.cos(t * 30)) + 1, 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSubTop(ctx: CanvasRenderingContext2D, s: SubSpec, look: Look, o: TopOpts): void {
  const g = geo(s);
  ctx.fillStyle = look.base;
  ctx.fill(g.tail);
  ctx.fill(g.planes);
  stroke(ctx, g.tail, look.ink, 0.45);
  stroke(ctx, g.planes, look.ink, 0.45);
  stern(ctx, s, o.t);
  ctx.fillStyle = look.base;
  ctx.fill(g.hull);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill(polys(o.bank >= 0 ? [1.2, -30, 8, -19, 8, 8, 5, 24, 1, 31] : [-1.2, -30, -8, -19, -8, 8, -5, 24, -1, 31]));
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill(g.deck);
  stroke(ctx, g.seams, look.panel, 0.35);
  stroke(ctx, g.hull, look.ink, 0.55);
  ctx.fillStyle = look.under;
  ctx.fill(g.sail);
  stroke(ctx, g.sail, look.ink, 0.45);
}

export function drawSubSide(ctx: CanvasRenderingContext2D, s: SubSpec, look: Look, o: SideOpts): void {
  const hull = polys([...s.sideTop, ...reversed(s.sideBottom)]);
  ctx.fillStyle = look.base;
  ctx.fill(polys(s.sideFins.slice(0, 8), s.sideFins.slice(8)));
  if (s.pod) ctx.fill(polys(s.pod));
  ctx.fill(hull);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill(polys([...s.sideBottom, -50, -5, 46, -5]));
  stroke(ctx, hull, look.ink, 0.7);
  ctx.fillStyle = look.under;
  const sail = polys(s.sideSail);
  ctx.fill(sail);
  stroke(ctx, sail, look.ink, 0.6);
  const tailX = s.sideTop[s.sideTop.length - 2] ?? -57;
  ctx.fillStyle = 'rgba(200,220,230,0.35)';
  ctx.beginPath();
  ctx.ellipse(tailX - 1, -7, 0.9, 4.4 * Math.abs(Math.cos(o.t * 30)) + 1, 0, 0, Math.PI * 2);
  ctx.fill();
}
