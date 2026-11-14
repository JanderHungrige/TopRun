import { shade } from '../detail/color';
import { grille, hatch, plate } from '../detail/parts';
import { hash } from './fx';
import { seams } from './space-kit';
import type { ShipPal } from './space-pal';

// Surface detail for space's large hulls (doc 119): clutter scattered over a hull deterministically — small plates,
// vents, hatches and panel joints — so a broad deck reads as built, not painted; and regolith or rock grain (light and
// dark specks) for the asteroid and the crater floor. Both draw inside a clip and into cached hulls only.

type Ctx = CanvasRenderingContext2D;

/** `n` pieces of hull clutter over the box x0 … x1, y0 … y1 inside `clip`, picked by `seed`; `s` scales them. */
export function scatter(ctx: Ctx, clip: Path2D, box: readonly [number, number, number, number], n: number, seed: number, p: ShipPal, s = 1): void {
  const [x0, y0, x1, y1] = box;
  ctx.save();
  ctx.clip(clip);
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed + i * 3.1) * (x1 - x0), y = y0 + hash(seed + i * 7.7) * (y1 - y0);
    const pick = hash(seed + i * 1.3);
    const w = (2.4 + hash(seed + i * 5.3) * 5) * s, h = (1.8 + hash(seed + i * 9.1) * 3.6) * s;
    if (pick < 0.38) plate(ctx, x, y, w, h, shade(p.hull, -0.16 + hash(seed + i) * 0.26), p.ink, 0.3 * s);
    else if (pick < 0.6) grille(ctx, x, y, w, h, Math.max(2, Math.round(w / (1.3 * s))), 'y');
    else if (pick < 0.75) hatch(ctx, x, y, h * 0.45, shade(p.hull, 0.04));
    else seams(ctx, [x, y, x + w * 1.6, y, x + w * 1.6, y, x + w * 1.6, y + h * 1.4], 0.35 * s);
  }
  ctx.restore();
}

/** Grain: `n` specks over the box inside `clip`, lighter and darker than what is under them. */
export function grain(ctx: Ctx, clip: Path2D, box: readonly [number, number, number, number], n: number, seed: number, size = 1.4): void {
  const [x0, y0, x1, y1] = box;
  ctx.save();
  ctx.clip(clip);
  for (let i = 0; i < n; i++) {
    const x = x0 + hash(seed + i * 2.3) * (x1 - x0), y = y0 + hash(seed + i * 6.1) * (y1 - y0);
    const k = hash(seed + i * 4.7);
    const r = size * (0.4 + hash(seed + i * 8.3));
    ctx.fillStyle = k < 0.5 ? `rgba(0,0,0,${(0.12 + k * 0.3).toFixed(3)})` : `rgba(255,240,220,${((k - 0.5) * 0.3).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
