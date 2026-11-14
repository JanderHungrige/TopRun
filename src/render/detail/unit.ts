import type { Pal, UnitFn } from '../draw-ground-units';
import { drawCached, variantOf, type Box } from './sprite';

// A detailed ground, sea or creature unit behind the `UnitFn` that drawEnemy calls (doc 113). Like the detailed aircraft
// (render/enemies/air-units.ts) it brings its own colours and reads only `mono` / `live` from the unit palette: the
// static body is drawn through the sprite cache (tinted for the flash and the shadow, sooted for the wreck), the moving
// parts around it in the art's palette or its one-colour version.

export interface DetailArt<P> {
  /** The live colours. */
  pal: P;
  /** The same palette with every colour `c` (silhouette passes). */
  mono: (c: string) => P;
  /** Half extents of the static body around the unit's centre. */
  box: Box;
  /** The static body; must not depend on time or aim. */
  body: (ctx: CanvasRenderingContext2D, p: P) => void;
  /** Moving parts under the body (legs, wakes, exhausts). */
  under?: (ctx: CanvasRenderingContext2D, p: P, t: number, aim: number) => void;
  /** Moving parts on top (turrets that aim, rotors, glows). */
  over?: (ctx: CanvasRenderingContext2D, p: P, t: number, aim: number) => void;
}

/** The one colour a wreck's moving parts are drawn in (a moving part cached on its own can tell a wreck by it). */
export const BURNT_PARTS = '#2a2420';

export function detailUnit<P>(key: string, art: DetailArt<P>): UnitFn {
  return (ctx, u: Pal, t, aim) => {
    const v = variantOf(u);
    const p = v.kind === 'mono' ? art.mono(v.colour) : v.kind === 'burnt' ? art.mono(BURNT_PARTS) : art.pal;
    const time = v.kind === 'burnt' ? 0 : t;
    art.under?.(ctx, p, time, aim);
    drawCached(ctx, key, art.box, (g) => art.body(g, art.pal), v);
    art.over?.(ctx, p, time, aim);
  };
}
