import { deviceScale } from './pixel/blit';

// Medal ceremony (doc 25): the close-up card's art grid (also the hangar base's, doc 30). The deck itself is now the
// layered key frame (ceremony-stage.ts); the art pixel here is about 3 logical px (whole device pixels).

/** The scene's art grid: D device px and G logical px per art pixel. */
export interface Grid { D: number; G: number; W: number; H: number }

export function artGrid(ctx: CanvasRenderingContext2D): Grid {
  const s = deviceScale(ctx);
  const D = Math.max(2, Math.round(3 * s));
  const G = D / s;
  return { D, G, W: Math.ceil(1280 / G), H: Math.ceil(720 / G) };
}
