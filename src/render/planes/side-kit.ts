import type { Look } from '../livery-art';
import { stroke } from './geom';
import { glare } from './parts';
import type { Fin } from './surface';
import { finArtSide } from './tail-art';

/** Side-view helpers shared by the jets: far fin, arrestor hook, canopy glass, wing sliver, receptacles. */

/** The far-side fin peeking out behind the near one: base colour + tail art, darkened. */
export function farFin(ctx: CanvasRenderingContext2D, l: Look, f: Fin, size: number): void {
  ctx.strokeStyle = l.ink;
  ctx.lineWidth = 0.75;
  ctx.stroke(f.path);
  ctx.fillStyle = l.base;
  ctx.fill(f.path);
  finArtSide(ctx, l, f, size);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill(f.path);
}

/** Arrestor hook hinged at (x, y): stowed along the belly, or lowered toward the deck. */
export function tailHook(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, down: boolean): void {
  const a = down ? 0.95 : -0.12;
  const ex = x - Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3b4047';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.strokeStyle = down ? '#e8c01c' : '#3b4047';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(ex + Math.cos(a) * 1.6, ey - Math.sin(a) * 1.6);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex + 0.6, ey + 0.9);
  ctx.stroke();
}

export interface CanopyStyle {
  glass: string; // canopy tint
  tint: string; // overlay over the cockpit interior
  frame: string;
}

/**
 * Canopy: glass, the cockpit interior (seat, helmet — drawn by `inside`), a tint over it, the frame and
 * the glare streak along the top.
 */
export function canopySide(
  ctx: CanvasRenderingContext2D, path: Path2D, st: CanopyStyle, inside: () => void, gx: number, gy: number, glen: number,
): void {
  ctx.fillStyle = st.glass;
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  inside();
  ctx.fillStyle = st.tint;
  ctx.fill(path);
  ctx.restore();
  stroke(ctx, path, st.frame, 0.45);
  glare(ctx, gx, gy, glen, glen * 0.13, -0.08, 0.55);
}

/** Edge-on wing / stabilator: a darker sliver with a light upper edge. */
export function sliver(ctx: CanvasRenderingContext2D, path: Path2D, edge: Path2D, gloss: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fill(path);
  stroke(ctx, edge, `rgba(255,255,255,${(0.28 * Math.min(1.6, gloss)).toFixed(2)})`, 0.4);
}
