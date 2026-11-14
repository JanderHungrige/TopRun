import type { Look } from '../livery-art';
import { lazy, lines, pairs, polys, reversed, stroke, sym, type Pts } from '../planes/geom';
import { paintFleet } from '../fleet-paint';
import type { SideOpts, TopOpts } from '../planes/surface';

/**
 * Type 212 attack sub (doc 67), drawn in arcade proportions — about a helicopter's size on screen, beam stretched
 * for readability. Top view: bow up (-y), the long rounded teardrop hull with a lighter deck line, the sail a little
 * forward of the middle, the bow planes, the X-rudder at the stern and the screw as a spinning blur. Side view: bow
 * to the right (+x), the keel at y = 0.
 */

/** Arcade proportions: the beam drawn 1.35 × and the length 1.1 × the outline below. */
const wide = (p: Pts): Pts => p.map((v, i) => (i % 2 === 0 ? v * 1.35 : v * 1.1));

const HULL: Pts = wide([0, -33, 1.8, -32.4, 3.4, -30.6, 4.6, -27.6, 5.3, -23.5, 5.6, -18, 5.6, 6, 5.3, 12, 4.6, 17, 3.6, 22,
  2.5, 26, 1.5, 29, 0.8, 31, 0, 31.6]);
const SAIL: Pts = wide([0, -15.5, 1.1, -15, 1.7, -13.4, 1.9, -10.5, 1.8, -6.5, 1.3, -3.6, 0, -2.6]);
const BOW_PLANE: Pts = wide([4.8, -25.2, 8.6, -24.6, 8.8, -23.6, 5.2, -22.6]);
const RUDDER: Pts = wide([2.6, 24.4, 6.8, 28.6, 7.2, 30.4, 6.2, 30.6, 1.6, 27.6]);

const geo = lazy(() => ({
  hull: polys(sym(HULL)),
  sail: polys(sym(SAIL)),
  planes: pairs(BOW_PLANE),
  rudders: pairs(RUDDER),
  deck: polys(wide([-0.9, -29, 0.9, -29, 1.1, 18, 0, 26, -1.1, 18])),
  sonar: polys(sym(wide([0, -33, 1.8, -32.4, 3.4, -30.6, 4.2, -28.4, 0, -27.4]))),
  seams: lines([wide([-5.5, -12, 5.5, -12]), wide([-5.6, 2, 5.6, 2]), wide([-4.6, 15, 4.6, 15])]),
  silhouette: (() => {
    const p = new Path2D();
    p.addPath(polys(sym(HULL)));
    p.addPath(pairs(BOW_PLANE, RUDDER));
    return p;
  })(),
}));

export const u212Silhouette = (): Path2D => geo().silhouette;

/** The screw at the stern: a dark hub and a blur of blades that turns with time. */
function screw(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = 'rgba(200,220,230,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 35.8, 4.6 * Math.abs(Math.cos(t * 30)) + 1.2, 1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1f24';
  ctx.beginPath();
  ctx.arc(0, 35.2, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawU212Top(ctx: CanvasRenderingContext2D, look: Look, o: TopOpts): void {
  const g = geo();
  ctx.fillStyle = look.base;
  ctx.fill(g.rudders);
  ctx.fill(g.planes);
  stroke(ctx, g.rudders, look.ink, 0.45);
  stroke(ctx, g.planes, look.ink, 0.45);
  screw(ctx, o.t);
  ctx.fillStyle = look.base;
  ctx.fill(g.hull);
  paintFleet(ctx, look, g.hull, { x: -7, y: -38, w: 14, h: 76 }, 'u212-top', 'top'); // its paint job (doc 100)
  // Rolling into a turn shows the darker flank on the outside.
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill(polys(wide(o.bank >= 0 ? [1.2, -30, 5.6, -18, 5.6, 6, 3.6, 22, 0.8, 30] : [-1.2, -30, -5.6, -18, -5.6, 6, -3.6, 22, -0.8, 30])));
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill(g.deck);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill(g.sonar);
  stroke(ctx, g.seams, look.panel, 0.35);
  stroke(ctx, g.hull, look.ink, 0.55);
  ctx.fillStyle = look.under;
  ctx.fill(g.sail);
  stroke(ctx, g.sail, look.ink, 0.45);
  ctx.fillStyle = 'rgba(160,200,220,0.35)';
  ctx.fillRect(-0.7, -15.6, 1.4, 2.4);
}

// Side view: 112 units long, the keel at 0, bow at +x.
const SIDE_TOP: Pts = [56, -6.5, 54.6, -10, 51, -12.6, 44, -13.8, -30, -13.8, -40, -12.6, -48, -10, -53, -7.6, -56, -6];
const SIDE_BOTTOM: Pts = [56, -6.5, 54.6, -3.2, 51, -0.9, 44, 0, -30, 0, -40, -1.2, -48, -3.2, -53, -5, -56, -6];
const SIDE_SAIL: Pts = [24, -13.8, 23.4, -19.6, 21.6, -21.6, 12, -22, 9.6, -21, 8.4, -13.8];
const SIDE_FIN: Pts = [-46, -10.6, -51, -17.6, -54, -17.6, -53, -9];
const SIDE_KEEL: Pts = [-46, -2.8, -51, 3.6, -54, 3.6, -53, -4.2];

const side = lazy(() => ({
  hull: polys([...SIDE_TOP, ...reversed(SIDE_BOTTOM)]),
  sail: polys(SIDE_SAIL),
  fins: polys(SIDE_FIN, SIDE_KEEL),
  waterline: lines([[44, -6.9, -48, -6.9]]),
  seams: lines([[34, -13.6, 34, -0.2], [-6, -13.6, -6, -0.2], [-30, -13.6, -30, -0.2]]),
}));

export function drawU212Side(ctx: CanvasRenderingContext2D, look: Look, o: SideOpts): void {
  const s = side();
  ctx.fillStyle = look.base;
  ctx.fill(s.fins);
  stroke(ctx, s.fins, look.ink, 0.6);
  ctx.fillStyle = look.base;
  ctx.fill(s.hull);
  paintFleet(ctx, look, s.hull, { x: -56, y: -14, w: 112, h: 14 }, 'u212-side', 'side');
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill(polys([56, -6.5, 54.6, -3.2, 51, -0.9, 44, 0, -30, 0, -40, -1.2, -48, -3.2, -53, -5, -56, -6, -30, -5, 44, -5]));
  stroke(ctx, s.seams, look.panel, 0.5);
  stroke(ctx, s.hull, look.ink, 0.7);
  ctx.fillStyle = look.under;
  ctx.fill(s.sail);
  stroke(ctx, s.sail, look.ink, 0.6);
  ctx.fillStyle = 'rgba(160,200,220,0.4)';
  ctx.fillRect(18, -20.4, 3, 1.4);
  stroke(ctx, s.waterline, 'rgba(255,255,255,0.12)', 0.6);
  ctx.fillStyle = 'rgba(200,220,230,0.35)';
  ctx.beginPath();
  ctx.ellipse(-57, -6, 0.9, 4 * Math.abs(Math.cos(o.t * 30)) + 1, 0, 0, Math.PI * 2);
  ctx.fill();
}
