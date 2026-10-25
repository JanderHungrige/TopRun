import type { Vec } from '../../core/math';
import { LINE } from './palette';
import { closedPath, lazy, memo, shapes, taper } from './paths';
import type { SkinTone } from './types';
import type { Pass } from './extremities';

// People kit (doc 17): the head in profile, upright frame with the neck pivot at the origin, face towards
// +x, crown at y = −39, chin at y ≈ 5 (about 1/7.8 of the body). Built per frame because the jaw opens.

const LW_HEAD = 1.5;

/** Head silhouette: skull, brow ridge, nose, lips and chin; `drop` 0 … 1 opens the jaw. */
export function headPath(drop: number): Path2D {
  const d = drop * 3.4;
  const p = new Path2D();
  p.moveTo(-9, 3);
  p.quadraticCurveTo(-20, -2, -21, -17);
  p.quadraticCurveTo(-21.5, -36, -5, -39.2);
  p.quadraticCurveTo(9, -41, 14.5, -30);
  p.quadraticCurveTo(17.2, -25, 17.1, -21.6);
  p.quadraticCurveTo(16.7, -19.8, 16.3, -19);
  p.quadraticCurveTo(19.3, -14.5, 21.9, -10.2);
  p.quadraticCurveTo(22.7, -8.3, 20.9, -7.7);
  p.quadraticCurveTo(19.6, -7.3, 18.2, -6.9);
  p.quadraticCurveTo(18.6, -5.4, 18.9, -3.9);
  p.quadraticCurveTo(18.9, -2.9, 18.1, -2.4);
  p.quadraticCurveTo(18.7 - d * 0.15, -1.1 + d, 18.2 - d * 0.2, 0.1 + d);
  p.quadraticCurveTo(16.9 - d * 0.2, 1.8 + d, 16.5 - d * 0.25, 2.8 + d);
  p.quadraticCurveTo(18.8 - d * 0.3, 5.2 + d, 17.6 - d * 0.3, 7.9 + d);
  p.quadraticCurveTo(15.4 - d * 0.3, 9.4 + d, 10 - d * 0.2, 8.6 + d * 0.8);
  p.quadraticCurveTo(5, 8 + d * 0.4, 0, 8);
  p.closePath();
  return p;
}

const STATIC = lazy(() => ({
  ear: closedPath([-3, -22.5, -9, -24, -12.2, -18, -11.4, -11, -8.4, -7.6, -5.2, -8.6, -4, -13]),
  earIn: shapes([taper([-6.2, -20.5, -9.4, -17.6, -8.8, -12.6, -6.6, -11], 2.4)]),
  defs: shapes([
    taper([5.5, -12.5, 10, -10.4, 14.6, -9], 2.4), // under the cheekbone
    taper([-7.5, -4.5, 2, 2.8, 13, 6.4], 2.8), // jawline
    taper([16.2, -9.4, 15.2, -6.4, 15.5, -3.2], 1.3), // nasolabial fold
    taper([14.6, 3, 16, 3.6, 17.2, 3.2], 1.6), // under the lower lip
    taper([-1, -30, 4, -27.5, 8, -26], 2.4), // temple
  ]),
  socket: closedPath([10.6, -19.4, 14.4, -21, 17, -18.6, 16.2, -15.4, 12.6, -14.6, 10.4, -16.6]),
  nostril: closedPath(taper([17.4, -8.4, 18.6, -9.6, 20.2, -8.6], 1.5)),
  upperLip: closedPath([18.2, -6.8, 18.9, -3.9, 18.1, -2.5, 15.8, -2.6, 16.6, -4.8]),
}));

const HEADS = new Map<string, Path2D>();

/** The head silhouette for a jaw opening, built once per opening. */
export const headPathFor = (drop: number): Path2D => memo(() => headPath(drop), HEADS, drop.toFixed(3));

export function headLine(ctx: CanvasRenderingContext2D, path: Path2D): void {
  ctx.lineWidth = LW_HEAD + 0.4;
  ctx.strokeStyle = LINE;
  ctx.stroke(path);
}

/**
 * Skin of the head: base, a soft light / shade pair from the light direction (lx, ly in the head frame),
 * cheekbone, jaw, temple and eye-socket shading, nostril and upper-lip tint.
 */
export function headSkin(ctx: CanvasRenderingContext2D, path: Path2D, skin: SkinTone, lx: number, ly: number): void {
  const s = STATIC();
  ctx.fillStyle = skin.base;
  ctx.fill(path);
  ctx.save();
  ctx.clip(path);
  ctx.fillStyle = skin.shadow;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(-lx * 19, -17 - ly * 19, 24, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fill(s.defs);
  ctx.globalAlpha = 0.4;
  ctx.fill(s.socket);
  ctx.fillStyle = skin.light;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(lx * 9 + 4, -18 + ly * 9, 9, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = skin.lip;
  ctx.fill(s.upperLip);
  ctx.globalAlpha = 1;
  ctx.fillStyle = skin.deep;
  ctx.fill(s.nostril);
  ctx.restore();
}

export function ear(ctx: CanvasRenderingContext2D, skin: SkinTone): void {
  const s = STATIC();
  ctx.fillStyle = skin.base;
  ctx.fill(s.ear);
  ctx.lineWidth = 1;
  ctx.strokeStyle = LINE;
  ctx.stroke(s.ear);
  ctx.fillStyle = skin.shadow;
  ctx.fill(s.earIn);
}

export interface NeckPoints {
  /** Torso side: back and front of the neck base. */
  back: Vec;
  front: Vec;
  /** Head side: nape and throat under the jaw. */
  nape: Vec;
  throat: Vec;
  /** Behind the ear (top of the neck muscle). */
  mastoid: Vec;
}

function neckPath(n: NeckPoints): Path2D {
  const p = new Path2D();
  const mx = (n.back.x + n.nape.x) / 2;
  const my = (n.back.y + n.nape.y) / 2;
  const fx = (n.front.x + n.throat.x) / 2;
  const fy = (n.front.y + n.throat.y) / 2;
  const cx = (mx + fx) / 2;
  const cy = (my + fy) / 2;
  p.moveTo(n.back.x, n.back.y);
  p.quadraticCurveTo(mx + (mx - cx) * 0.12, my + (my - cy) * 0.12, n.nape.x, n.nape.y);
  p.lineTo(n.throat.x, n.throat.y);
  p.quadraticCurveTo(fx + (fx - cx) * 0.08, fy + (fy - cy) * 0.08, n.front.x, n.front.y);
  p.closePath();
  return p;
}

/** The neck between the torso and the head (world points), with the neck muscle shaded. */
export function neck(ctx: CanvasRenderingContext2D, pass: Pass, skin: SkinTone, n: NeckPoints): void {
  const p = neckPath(n);
  if (pass === 'line') {
    ctx.lineWidth = LW_HEAD + 0.4;
    ctx.strokeStyle = LINE;
    ctx.stroke(p);
    return;
  }
  ctx.fillStyle = skin.base;
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.beginPath();
  ctx.moveTo(n.mastoid.x, n.mastoid.y);
  ctx.lineTo((n.front.x * 2 + n.back.x) / 3, (n.front.y * 2 + n.back.y) / 3);
  ctx.strokeStyle = skin.shadow;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(n.nape.x, n.nape.y);
  ctx.lineTo(n.throat.x, n.throat.y);
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();
}
