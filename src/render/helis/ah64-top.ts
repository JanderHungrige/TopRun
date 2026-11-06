import type { Look } from '../livery-art';
import { lazy, lines, pairs, polys, stroke, sym, type Pts } from '../planes/geom';
import type { TopOpts } from '../planes/surface';
import { rotorBar, rotorDisc } from './rotor';

/**
 * AH-64 Apache seen from above, nose up (-y), 3.6 units per metre (doc 50): a narrow fuselage with the tandem
 * cockpit and the nose sensor turret, engine nacelles either side of the rotor mast, stub wings with a rocket pod
 * and a Hellfire rack on each, a long tail boom with the tailplane, the tail rotor on the left of the fin, and the
 * 14.6 m main rotor as a spinning disc over it all.
 */

const FUSE: Pts = [0, -24.5, 0.8, -24.2, 1.4, -23.2, 1.6, -21.5, 1.7, -19, 1.9, -15, 2.1, -10, 2.3, -6, 2.6, -2, 2.6, 4, 2.3, 8,
  1.6, 12, 1.2, 16, 1.0, 24, 0.9, 30, 0.6, 32, 0, 32.5];
const CANOPY: Pts = [0, -20.5, 1.1, -19.8, 1.5, -17.5, 1.6, -14, 1.5, -10.5, 1.3, -9, 0, -8.6];
const NACELLE: Pts = [2.3, -3, 3.4, -4.6, 4.8, -4.6, 5.4, -3.2, 5.5, 4, 5.0, 9, 3.6, 10.6, 2.6, 9];
const WING: Pts = [2.4, -1.8, 9.4, -2.4, 9.8, -1.6, 9.8, 1.4, 9.4, 2.0, 2.6, 2.4];
const STAB: Pts = [0.8, 27.4, 6.0, 26.8, 6.4, 27.6, 6.2, 29.6, 0.8, 30.2];
const FIN: Pts = [-0.5, 23.5, 0.5, 23.5, 0.6, 33.2, -0.6, 33.2];
const HUB = { x: 0, y: -4 };
const ROTOR_R = 26.5;
const TAIL_ROTOR = { x: -2.1, y: 30.6, half: 5 };

const geo = lazy(() => ({
  body: polys(sym(FUSE)),
  nacelles: pairs(NACELLE),
  wings: pairs(WING),
  stab: pairs(STAB),
  fin: polys(FIN),
  canopy: polys(sym(CANOPY)),
  frames: lines([[-1.55, -14.4, 1.55, -14.4], [0, -20.3, 0, -8.8]]),
  panels: lines([[-2.4, -5, 2.4, -5], [-2.5, 6, 2.5, 6], [-1.2, 15, 1.2, 15], [-1, 22, 1, 22]]),
  exhausts: pairs([3.2, 9.4, 4.6, 9.4, 4.4, 10.8, 3.4, 10.8]),
  silhouette: (() => {
    const p = new Path2D();
    p.addPath(polys(sym(FUSE)));
    p.addPath(pairs(NACELLE, WING, STAB));
    return p;
  })(),
}));

/** The outline for shadows and hit flashes; the rotor disc is left out (it casts only a faint shimmer). */
export const ah64Silhouette = (): Path2D => geo().silhouette;

/** Rocket pod (inner station) and a four-round Hellfire rack (outer) under each stub wing. */
function stores(ctx: CanvasRenderingContext2D): void {
  for (const sx of [-1, 1]) {
    ctx.fillStyle = '#3b4128';
    ctx.beginPath();
    ctx.roundRect(sx * 5.6 - 1.2, -4.2, 2.4, 7.8, 1.1);
    ctx.fill();
    ctx.fillStyle = '#c9c4a8';
    ctx.fillRect(sx * 5.6 - 1.2, -4.2, 2.4, 0.9);
    for (const dx of [-0.7, 0.7]) {
      ctx.fillStyle = '#6b7052';
      ctx.fillRect(sx * 8.6 + dx - 0.45, -4.6, 0.9, 6.2);
      ctx.fillStyle = '#2a2d22';
      ctx.fillRect(sx * 8.6 + dx - 0.45, -4.6, 0.9, 1);
    }
  }
}

export function drawAh64Top(ctx: CanvasRenderingContext2D, look: Look, o: TopOpts): void {
  const g = geo();
  const shade = 'rgba(0,0,0,0.16)';
  ctx.fillStyle = look.base;
  ctx.fill(g.stab);
  ctx.fill(g.wings);
  stores(ctx);
  ctx.fillStyle = look.base;
  ctx.fill(g.body);
  ctx.fillStyle = shade;
  ctx.fill(polys([0.9, -12, 2.3, -6, 2.6, -2, 2.6, 4, 2.3, 8, 1.6, 12, 1.2, 16, 1.0, 24, 0.9, 30, 0, 32, 0, -12]));
  ctx.fillStyle = look.base;
  ctx.fill(g.nacelles);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill(pairs([4.2, -4.4, 4.8, -4.6, 5.4, -3.2, 5.5, 4, 5.0, 9, 4.2, 9]));
  ctx.fillStyle = '#1b1d17';
  ctx.fill(g.exhausts);
  ctx.fillStyle = look.base;
  ctx.fill(g.fin);
  stroke(ctx, g.body, look.ink, 0.5);
  stroke(ctx, g.nacelles, look.ink, 0.45);
  stroke(ctx, g.wings, look.ink, 0.45);
  stroke(ctx, g.stab, look.ink, 0.45);
  stroke(ctx, g.panels, look.panel, 0.35);
  ctx.fillStyle = '#1d2a33';
  ctx.fill(g.canopy);
  ctx.fillStyle = 'rgba(190,220,240,0.32)';
  ctx.fill(polys([-0.9, -19.4, -0.2, -19.8, -0.3, -15.5, -1.2, -15.2]));
  stroke(ctx, g.frames, 'rgba(60,66,52,0.9)', 0.4);
  ctx.fillStyle = '#23261f';
  ctx.beginPath();
  ctx.arc(0, -23.1, 1.25, 0, Math.PI * 2);
  ctx.fill();
  rotorBar(ctx, TAIL_ROTOR.x, TAIL_ROTOR.y, TAIL_ROTOR.half, o.t);
  // The rotor disc leans into the turn.
  rotorDisc(ctx, HUB.x + o.bank * 1.8, HUB.y, ROTOR_R, 4, o.t, 11);
}
