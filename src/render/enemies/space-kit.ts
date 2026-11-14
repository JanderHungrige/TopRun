import { shade } from '../detail/color';
import { edges, glow, path, plate, sym, type Pts } from '../detail/parts';
import type { ShipPal } from './space-pal';

// The pieces space's detailed ships are built from (doc 119), light from the upper left (−x, −y), sterns up (−y): faceted
// and plated hulls, plates of another tone, drop shadows of raised parts, engraved panel seams, engine bells, cockpit
// glass and greebles for the cached bodies (their equipment is in space-gear.ts); the flickering exhausts and blinking
// lights are drawn live and check `p.mono` first, so a one-colour pass stays a clean silhouette.

type Ctx = CanvasRenderingContext2D;

/** "r,g,b" of a #rrggbb colour, for the glows. Pure. */
export function rgbOf(hex: string): string {
  const n = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
  return Number.isFinite(n) ? `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` : '255,255,255';
}

/** The points mirrored across x = 0 (seam lists, pairs of parts). */
export const flipX = (pts: Pts): number[] => pts.map((v, i) => (i % 2 ? v : -v));

function bounds(pts: Pts): [number, number, number, number] {
  const xs = pts.filter((_, i) => i % 2 === 0);
  const ys = pts.filter((_, i) => i % 2 === 1);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** A plated part: its fill, a sheen from the lit upper left to the shaded lower right, lit edges and the outline. */
export function plating(ctx: Ctx, pts: Pts, fill: string, p: ShipPal, w = 0.6, k = 1): Path2D {
  const shape = path(pts);
  ctx.fillStyle = fill;
  ctx.fill(shape);
  const [x0, y0, x1, y1] = bounds(pts);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(255,255,255,${(0.2 * k).toFixed(3)})`);
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, `rgba(0,0,0,${(0.28 * k).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.fill(shape);
  edges(ctx, pts, w * 0.8);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = w;
  ctx.stroke(shape);
  return shape;
}

/** A symmetric hull from its right half, rounded across — the left lit, the right in shade, the two meeting in a crisp
 *  ridge at the spine — the stern a little lighter than the bow, lit edges and the outline. */
export function keel(ctx: Ctx, right: Pts, fill: string, p: ShipPal, w = 0.7): Path2D {
  const pts = sym(right);
  const shape = path(pts);
  const [x0, y0, x1, y1] = bounds(pts);
  ctx.fillStyle = fill;
  ctx.fill(shape);
  ctx.save();
  ctx.clip(shape);
  const across = ctx.createLinearGradient(x0, 0, x1, 0); // rounded toward the edges, a crisp ridge at the spine
  across.addColorStop(0, 'rgba(255,255,255,0.04)');
  across.addColorStop(0.22, 'rgba(255,255,255,0.2)');
  across.addColorStop(0.495, 'rgba(255,255,255,0.08)');
  across.addColorStop(0.505, 'rgba(0,0,0,0.1)');
  across.addColorStop(0.8, 'rgba(0,0,0,0.2)');
  across.addColorStop(1, 'rgba(0,0,0,0.36)');
  ctx.fillStyle = across;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const along = ctx.createLinearGradient(0, y0, 0, y1);
  along.addColorStop(0, 'rgba(255,255,255,0.1)');
  along.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = along;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(-0.45, y0, 0.45, y1 - y0);
  ctx.restore();
  edges(ctx, pts, w * 0.8);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = w;
  ctx.stroke(shape);
  return shape;
}

/** Plates of another tone inside `clip`, groups of x, y, w, h, k (k > 0 lighter, < 0 darker), each with its seam. */
export function tints(ctx: Ctx, clip: Path2D, list: Pts): void {
  ctx.save();
  ctx.clip(clip);
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = 'rgba(0,0,0,0.32)';
  for (let i = 0; i < list.length; i += 5) {
    const [x, y, w, h, k] = [0, 1, 2, 3, 4].map((j) => list[i + j] ?? 0) as [number, number, number, number, number];
    ctx.fillStyle = k > 0 ? `rgba(255,255,255,${k.toFixed(3)})` : `rgba(0,0,0,${(-k).toFixed(3)})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

/** The soft shadow a raised part (polygon) casts on the hull beneath, away from the light; clipped to the hull. */
export function drop(ctx: Ctx, pts: Pts, d: number, clip: Path2D): void {
  ctx.save();
  ctx.clip(clip);
  ctx.translate(d, d);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill(path(pts));
  ctx.translate(d * 0.5, d * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fill(path(pts));
  ctx.restore();
}

/** Engraved panel seams, groups of x0, y0, x1, y1: a dark groove with its lit lip beside it. */
export function seams(ctx: Ctx, list: Pts, w = 0.35): void {
  for (const [colour, d] of [['rgba(0,0,0,0.42)', 0], ['rgba(255,255,255,0.2)', w * 0.9]] as const) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let i = 0; i < list.length; i += 4) {
      ctx.moveTo((list[i] ?? 0) + d, (list[i + 1] ?? 0) + d);
      ctx.lineTo((list[i + 2] ?? 0) + d, (list[i + 3] ?? 0) + d);
    }
    ctx.stroke();
  }
}

/** An engine bell on the stern at (x, y), opening aft (−y) over `len`: banded bare metal, the hot throat glowing. */
export function bell(ctx: Ctx, x: number, y: number, r: number, len: number, p: ShipPal): void {
  const pts = [x - r * 0.72, y, x + r * 0.72, y, x + r, y - len, x - r, y - len];
  plating(ctx, pts, p.metal, p, 0.45, 0.6);
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.25)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = g;
  ctx.fill(path(pts));
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  for (const k of [0.35, 0.65]) ctx.fillRect(x - r * (0.72 + 0.28 * k), y - len * k - 0.2, r * 2 * (0.72 + 0.28 * k), 0.4);
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.ellipse(x, y - len, r, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p.engine;
  ctx.beginPath();
  ctx.ellipse(x, y - len, r * 0.72, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(x - r * 0.4, y - len - 0.15, r * 0.8, 0.3);
}

/** The exhaust behind an engine bell's mouth at (x, y), flickering; none in one colour. */
export function plume(ctx: Ctx, x: number, y: number, r: number, t: number, p: ShipPal, rgb = rgbOf(p.engine)): void {
  if (p.mono) return;
  const f = 1.6 + Math.sin(t * 30 + x) * 0.3;
  glow(ctx, x, y - r * f * 0.4, r * 2.6, rgb, 0.32);
  const g = ctx.createLinearGradient(0, y, 0, y - r * f * 2.2);
  g.addColorStop(0, 'rgba(240,250,255,0.95)');
  g.addColorStop(0.35, `rgba(${rgb},0.75)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y);
  ctx.quadraticCurveTo(x - r * 0.7, y - r * f * 1.2, x, y - r * f * 2.2);
  ctx.quadraticCurveTo(x + r * 0.7, y - r * f * 1.2, x + r * 0.8, y);
  ctx.fill();
}

/** Cockpit glass: the frame, the glass from dark at its back to sky at its front, a canopy bow, the glint. */
export function canopy(ctx: Ctx, x: number, y: number, rx: number, ry: number, p: ShipPal): void {
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 0.45, ry + 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(x - rx, y - ry, x + rx * 0.6, y + ry);
  g.addColorStop(0, '#0c1824');
  g.addColorStop(0.55, shade(p.glass, -0.45));
  g.addColorStop(1, p.glass);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,26,34,0.8)';
  ctx.lineWidth = Math.max(0.25, rx * 0.16);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.9, y - ry * 0.25);
  ctx.quadraticCurveTo(x, y - ry * 0.05, x + rx * 0.9, y - ry * 0.25);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.4, y + ry * 0.2, rx * 0.2, ry * 0.42, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

/** Greebles: small bevelled boxes, groups of x, y, w, h, in the hull's colour stepped by `k`. */
export function greebles(ctx: Ctx, list: Pts, p: ShipPal, k = -0.12): void {
  for (let i = 0; i < list.length; i += 4) {
    plate(ctx, list[i] ?? 0, list[i + 1] ?? 0, list[i + 2] ?? 0, list[i + 3] ?? 0, shade(p.hull, k), p.ink, 0.3);
  }
}

/** A blinking running light (live): its halo and the lamp, `on` 0 … 1; nothing in one colour. */
export function lamp(ctx: Ctx, p: ShipPal, x: number, y: number, r: number, rgb: string, on: number): void {
  if (p.mono || on <= 0.05) return;
  glow(ctx, x, y, r * 3.4, rgb, 0.6 * on);
  ctx.fillStyle = `rgba(${rgb},${on.toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${(0.9 * on).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}
