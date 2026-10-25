import type { AirPal } from './kit';

/**
 * Static-layer cache for the detailed aircraft. Everything that does not move (airframe, camouflage,
 * panel lines, canopies, stores) is painted once per kind into an offscreen sprite at the current device
 * scale and then blitted, so a frame only draws the sprite plus the animated parts.
 */

export type AirFn = (ctx: CanvasRenderingContext2D, a: AirPal, t: number) => void;

export interface AirArt {
  pal: AirPal;
  /** Half extents [x, y] of the static layer in logical units. */
  box: readonly [number, number];
  /** Animated parts under the airframe (afterburners). */
  under?: AirFn;
  /** Static airframe; must not depend on t. */
  body: (ctx: CanvasRenderingContext2D, a: AirPal) => void;
  /** Animated parts on top (props, rotors, beacons). */
  over?: AirFn;
}

/** Above this device scale (dev zoom only) the layer is painted as vectors instead of a huge sprite. */
const MAX_SCALE = 8;
const sprites = new Map<string, HTMLCanvasElement>();

function sprite(key: string, art: AirArt, k: number): HTMLCanvasElement | null {
  const id = `${key}@${k}`;
  let c = sprites.get(id);
  if (c) return c;
  if (sprites.size > 48) sprites.clear(); // window resizes create new scale buckets
  c = document.createElement('canvas');
  c.width = Math.ceil(art.box[0] * 2 * k);
  c.height = Math.ceil(art.box[1] * 2 * k);
  const g = c.getContext('2d');
  if (!g) return null;
  g.scale(k, k);
  g.translate(art.box[0], art.box[1]);
  g.lineJoin = 'round';
  art.body(g, art.pal);
  sprites.set(id, c);
  return c;
}

/** Paints the static layer of a live (non-silhouette) aircraft through the sprite cache. */
export function staticLayer(ctx: CanvasRenderingContext2D, key: string, art: AirArt): void {
  const m = ctx.getTransform();
  const s = Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d));
  const k = Math.max(1, Math.ceil(s * 2) / 2); // 0.5 buckets, never below the device scale
  const c = k > MAX_SCALE ? null : sprite(key, art, k);
  if (c) ctx.drawImage(c, -art.box[0], -art.box[1], c.width / k, c.height / k);
  else art.body(ctx, art.pal);
}
