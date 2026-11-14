import type { Look } from './look';
import type { Rect } from './planes/geom';
import { drawCamo } from './planes/livery-patterns';

// The helicopters' and subs' paint jobs on their outlines (doc 100): the jets' camouflage generator clipped to the
// craft's body, and a trim stripe along it — top views run nose up, side views nose right.

const keys = new WeakMap<object, string>();
let made = 0;

/** A stable cache key for one drawing's geometry (the camouflage is built once per outline and pattern). */
export function shapeKey(shape: object, view: string): string {
  let k = keys.get(shape);
  if (!k) {
    k = `fleet${(made += 1)}`;
    keys.set(shape, k);
  }
  return `${k}-${view}`;
}

/** Lays a look's camouflage and trim over a body already filled with its base colour. */
export function paintFleet(ctx: CanvasRenderingContext2D, look: Look, clip: Path2D, box: Rect, key: string, view: 'top' | 'side'): void {
  if (!look.camo && !look.trim) return;
  ctx.save();
  ctx.clip(clip);
  const cell = Math.max(3, Math.min(box.w, box.h) * 0.22);
  if (look.camo) drawCamo(ctx, look.camo, { key, clip, box, cell });
  if (look.trim) {
    ctx.fillStyle = look.trim;
    const t = Math.max(0.8, cell * 0.16);
    if (view === 'top') for (const s of [-1, 1]) ctx.fillRect(box.x + box.w / 2 + s * box.w * 0.16 - t / 2, box.y, t, box.h);
    else ctx.fillRect(box.x, box.y + box.h * 0.42, box.w, t);
  }
  ctx.restore();
}
