// The detail kit's sprite cache (doc 113): a part of the art that does not move is painted once per key, variant and
// scale bucket into an offscreen canvas and blitted from then on. The 'mono' variant is the same picture filled with one
// colour (the hit flash, the shadow: every detail of the outline kept), the 'burnt' one darkened to soot (wrecks).

export type Variant = { kind: 'live' } | { kind: 'burnt' } | { kind: 'mono'; colour: string };

/** Half extents of a painted area around its origin (logical units). */
export type Box = readonly [number, number];

/** The scale a sprite is painted at: the transform's larger axis in half steps, never below 1. Pure. */
export function scaleBucket(a: number, b: number, c: number, d: number): number {
  const s = Math.max(Math.hypot(a, b), Math.hypot(c, d));
  return Math.max(1, Math.ceil(s * 2) / 2);
}

/** Which picture a unit palette asks for: its silhouette in one colour, its wreck, or itself. Pure. */
export function variantOf(p: { mono: boolean; live: boolean; body: string }): Variant {
  if (p.mono) return { kind: 'mono', colour: p.body };
  return p.live ? { kind: 'live' } : { kind: 'burnt' };
}

export const spriteKey = (key: string, v: Variant, k: number): string =>
  `${key}|${v.kind === 'mono' ? `mono${v.colour}` : v.kind}@${k}`;

/** Above this scale (dev zoom) the art is drawn as vectors instead of a huge sprite. */
const MAX_SCALE = 8;
const LIMIT = 160;
const SOOT = 'rgba(30,24,20,0.72)';
const sprites = new Map<string, HTMLCanvasElement | null>();

function paintSprite(box: Box, k: number, v: Variant, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(box[0] * 2 * k));
  c.height = Math.max(1, Math.ceil(box[1] * 2 * k));
  const g = c.getContext('2d');
  if (!g) return null;
  g.scale(k, k);
  g.translate(box[0], box[1]);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  paint(g);
  if (v.kind === 'live') return c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = v.kind === 'mono' ? v.colour : SOOT;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** Draws `paint` (static art around the origin, inside `box`) through the cache, in the variant asked for. */
export function drawCached(
  ctx: CanvasRenderingContext2D, key: string, box: Box, paint: (g: CanvasRenderingContext2D) => void, v: Variant = { kind: 'live' },
): void {
  const m = ctx.getTransform();
  const k = scaleBucket(m.a, m.b, m.c, m.d);
  if (k > MAX_SCALE) return drawDirect(ctx, paint, v);
  const id = spriteKey(key, v, k);
  let c = sprites.get(id);
  if (c === undefined) {
    if (sprites.size >= LIMIT) sprites.clear(); // window resizes make new buckets
    c = paintSprite(box, k, v, paint);
    sprites.set(id, c);
  }
  if (c) ctx.drawImage(c, -box[0], -box[1], c.width / k, c.height / k);
  else drawDirect(ctx, paint, v);
}

/** Vector fallback (no DOM canvas, or dev zoom): the art itself; mono and burnt as a plain tint over it. */
function drawDirect(ctx: CanvasRenderingContext2D, paint: (g: CanvasRenderingContext2D) => void, v: Variant): void {
  if (v.kind !== 'live') ctx.globalAlpha *= 0.85;
  paint(ctx);
}
