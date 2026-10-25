import type { Look } from '../livery-art';
import { paintSurface } from '../livery-art';
import type { Surface } from './surface';

/** A translucent overlay that gives a surface its 3-D shading (precomputed path + rgba colour). */
export interface Shade {
  path: Path2D;
  color: string;
  gloss?: boolean; // highlight: scaled by the livery's gloss
}

export interface PassOpts {
  shades: readonly Shade[];
  bank?: number; // top view: darken the lowered wing
  halo?: boolean; // outline (default true)
}

/**
 * The shared paint pass of one surface: an ink halo stroked under the surface (the fill covers its inner
 * half and every internal seam, leaving a clean outer outline), then — clipped to the outline — the
 * livery, the shading overlays and the bank cue.
 */
export function paintPass(ctx: CanvasRenderingContext2D, l: Look, s: Surface, o: PassOpts): void {
  if (o.halo !== false) {
    ctx.strokeStyle = l.ink;
    ctx.lineWidth = 0.75;
    ctx.stroke(s.clip);
  }
  ctx.save();
  ctx.clip(s.clip);
  paintSurface(ctx, l, s);
  const a = ctx.globalAlpha;
  for (const sh of o.shades) {
    ctx.globalAlpha = sh.gloss ? a * Math.min(1.8, l.gloss) : a;
    ctx.fillStyle = sh.color;
    ctx.fill(sh.path);
  }
  ctx.globalAlpha = a;
  const bank = o.bank ?? 0;
  if (Math.abs(bank) > 0.02) {
    const b = s.box;
    ctx.fillStyle = `rgba(0,0,0,${(Math.abs(bank) * 0.2).toFixed(3)})`;
    ctx.fillRect(bank < 0 ? b.x : 0, b.y, bank < 0 ? -b.x : b.x + b.w, b.h);
    ctx.fillStyle = `rgba(255,255,255,${(Math.abs(bank) * 0.08).toFixed(3)})`;
    ctx.fillRect(bank < 0 ? 0 : b.x, b.y, bank < 0 ? b.x + b.w : -b.x, b.h);
  }
  ctx.restore();
}

/** Panel lines (thin, faint) and control-surface hinge lines (a little stronger). */
export function panelLines(ctx: CanvasRenderingContext2D, l: Look, panels: Path2D, hinges: Path2D): void {
  ctx.strokeStyle = l.panel;
  ctx.lineWidth = 0.26;
  ctx.stroke(panels);
  ctx.lineWidth = 0.38;
  ctx.stroke(hinges);
}
