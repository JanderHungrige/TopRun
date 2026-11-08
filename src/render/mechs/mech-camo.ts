import { PAINT_COLORS, PAINT_SIZE, cellAt, type Paint } from '../../game/mech-paint';

// A mech's camo as a canvas pattern (doc 87): the 16 × 16 paint, each cell `cell` px, repeated over the armour. Cached
// per paint and cell size.

const cache = new Map<string, HTMLCanvasElement>();

/** The paint drawn as a tile, each cell `cell` px. */
export function camoTile(paint: Paint, cell: number): HTMLCanvasElement | null {
  const key = `${cell}|${paint}`;
  const known = cache.get(key);
  if (known) return known;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = PAINT_SIZE * cell;
  c.height = PAINT_SIZE * cell;
  const g = c.getContext('2d');
  if (!g) return null;
  for (let y = 0; y < PAINT_SIZE; y++) {
    for (let x = 0; x < PAINT_SIZE; x++) {
      g.fillStyle = PAINT_COLORS[cellAt(paint, x, y)] ?? '#4e6b2e';
      g.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  if (cache.size > 40) cache.clear();
  cache.set(key, c);
  return c;
}

/** A fill style wearing the paint, or a flat olive while no canvas exists. */
export function camoFill(ctx: CanvasRenderingContext2D, paint: Paint, cell: number): CanvasPattern | string {
  const tile = camoTile(paint, cell);
  return (tile && ctx.createPattern(tile, 'repeat')) ?? '#4e6b2e';
}
