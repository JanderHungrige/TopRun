import { circle, ellipse } from '../shapes';
import type { Gesture, Rig } from './index';

/** Shared portrait pieces, logical 100×120 frame (x -50..50, y 0..120, eyes near y = 50); light from the upper left. */

export const LINE = 'rgba(32,18,12,0.55)';
export const INK = '#26150f';
const TAU = Math.PI * 2;
const NAIL = 'rgba(255,255,255,0.45)';

export interface Skin { base: string; dark: string; light: string; lip: string }
export interface Face { w: number; jaw: number; top: number; chin: number }
export interface Eyes { x: number; y: number; rx: number; ry: number; iris: string; lash?: boolean }
export interface Brows { x0: number; x1: number; y: number; th: number; color: string; bias?: number }
export interface Mouth { y: number; w: number; lip: string; shade: string; grin?: boolean; smirk?: number; full?: string }
export interface Hand { skin: string; dark: string; sleeve: string; sleeveDark: string }

export const jawDrop = (r: Rig): number => r.mouth * 2.2;

export function stroke(ctx: CanvasRenderingContext2D, color: string, lw: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}
/** Fills the current path and optionally outlines it. */
export function paint(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line?: string, lw = 0.9): void {
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) stroke(ctx, line, lw);
}
/** Starts a new path with a single quadratic curve. */
export function curve(ctx: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx, cy, x1, y1);
}
/** Continues the current path through flat x,y pairs (starts it if empty). */
export function trace(ctx: CanvasRenderingContext2D, pts: readonly number[]): void {
  for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i] ?? 0, pts[i + 1] ?? 0);
}
/** Strokes an open polyline. */
export function poly(ctx: CanvasRenderingContext2D, pts: readonly number[], color: string, lw: number): void {
  ctx.beginPath();
  trace(ctx, pts);
  stroke(ctx, color, lw);
}

/** Flat fill + a dark panel ellipse clipped to the shape + thin outline (the game's panel style). */
export function shaded(ctx: CanvasRenderingContext2D, path: (c: CanvasRenderingContext2D) => void,
  fill: string, dark: string, ex: number, ey: number, rx: number, ry: number): void {
  path(ctx);
  paint(ctx, fill);
  ctx.save();
  ctx.clip();
  ellipse(ctx, ex, ey, rx, ry, dark);
  ctx.restore();
  path(ctx);
  stroke(ctx, LINE, 0.9);
}

export function torsoPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-10, 84);
  ctx.bezierCurveTo(-22, 86.5, -38, 87, -45, 96);
  trace(ctx, [-60, 126, 60, 126, 45, 96]);
  ctx.bezierCurveTo(38, 87, 22, 86.5, 10, 84);
  ctx.closePath();
}

export const torso = (ctx: CanvasRenderingContext2D, fill: string, dark: string): void =>
  shaded(ctx, torsoPath, fill, dark, 54, 114, 27, 36);

export function neck(ctx: CanvasRenderingContext2D, s: Skin, hw: number): void {
  ctx.beginPath();
  ctx.rect(-hw, 62, hw * 2, 28);
  paint(ctx, s.base, LINE);
  ctx.save();
  ctx.clip();
  ellipse(ctx, hw * 0.45, 74, hw * 1.3, 11, s.dark);
  ctx.restore();
}

function headPath(ctx: CanvasRenderingContext2D, f: Face, drop: number): void {
  const c = f.chin + drop;
  ctx.beginPath();
  ctx.moveTo(0, f.top);
  ctx.bezierCurveTo(f.w * 0.78, f.top, f.w, f.top + 9, f.w, 50);
  ctx.bezierCurveTo(f.w, 61, f.jaw + 2.5, c - 7, f.jaw, c - 3);
  ctx.quadraticCurveTo(f.jaw * 0.55, c, 0, c);
  ctx.quadraticCurveTo(-f.jaw * 0.55, c, -f.jaw, c - 3);
  ctx.bezierCurveTo(-f.jaw - 2.5, c - 7, -f.w, 61, -f.w, 50);
  ctx.bezierCurveTo(-f.w, f.top + 9, -f.w * 0.78, f.top, 0, f.top);
  ctx.closePath();
}

/** Ears + head with its shade panel and forehead highlight. The chin drops while the mouth opens. */
export function face(ctx: CanvasRenderingContext2D, s: Skin, f: Face, r: Rig): void {
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sd * (f.w - 0.2), 53, 3.4, 5.8, sd * 0.12, 0, TAU);
    paint(ctx, sd > 0 ? s.dark : s.base, LINE, 0.8);
    ellipse(ctx, sd * (f.w + 0.8), 53.6, 1.3, 3.3, s.dark);
  }
  headPath(ctx, f, jawDrop(r));
  paint(ctx, s.base);
  ctx.save();
  ctx.clip();
  ellipse(ctx, f.w * 1.15, 60, f.w * 0.5, 36, s.dark);
  ellipse(ctx, -f.w * 0.42, f.top + 7.5, 3.8, 1.9, s.light);
  ctx.restore();
  headPath(ctx, f, jawDrop(r));
  stroke(ctx, LINE, 0.9);
}

export function nose(ctx: CanvasRenderingContext2D, s: Skin, y0: number, y1: number, w: number): void {
  curve(ctx, 0.6, y0, w * 1.1, y1 - 3, w * 0.9, y1 - 0.6);
  ctx.lineTo(0.2, y1);
  paint(ctx, s.dark);
  curve(ctx, -w, y1 - 1, 0, y1 + 1.8, w, y1 - 1);
  stroke(ctx, s.dark, 1.1);
  ellipse(ctx, -0.7, y1 - 2.5, 1.1, 1.5, s.light);
}

/** Skin covering the eye beyond a lid curve through the eye corners (mid = the curve's middle y). */
function lid(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, mid: number, edge: number, skin: string): void {
  curve(ctx, x - rx, y, x, 2 * mid - y, x + rx, y);
  trace(ctx, [x + rx + 1, y, x + rx + 1, edge, x - rx - 1, edge, x - rx - 1, y]);
  paint(ctx, skin);
}

/** Both eyes: almond whites, iris + pupil + catch-light, mood lids, and the blink. */
export function eyes(ctx: CanvasRenderingContext2D, r: Rig, e: Eyes, s: Skin): void {
  const top = e.y - e.ry + Math.max(r.blink, r.m.lidTop) * e.ry * 2.5;
  const low = e.y + e.ry - (r.blink > 0.4 ? 0 : r.m.lidLow) * e.ry * 1.1;
  const ir = e.ry * 0.95;
  for (const sd of [-1, 1]) {
    const x = sd * e.x;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, e.y, e.rx, e.ry, 0, 0, TAU);
    paint(ctx, '#f6f3ec');
    ctx.clip();
    circle(ctx, x + r.look, e.y + 0.2, ir, e.iris);
    circle(ctx, x + r.look, e.y + 0.2, ir * 0.52 * r.m.pupil, '#100a08');
    circle(ctx, x + r.look - ir * 0.38, e.y - ir * 0.32, ir * 0.3, 'rgba(255,255,255,0.9)');
    lid(ctx, x, e.y, e.rx, top, e.y - e.ry - 2, s.base);
    lid(ctx, x, e.y, e.rx, low, e.y + e.ry + 2, s.base);
    ctx.restore();
    curve(ctx, x - e.rx - 0.3, e.y, x, 2 * Math.min(top, e.y + e.ry * 0.35) - e.y, x + e.rx + 0.3, e.y);
    stroke(ctx, INK, 1.15);
    if (e.lash) poly(ctx, [x + sd * e.rx, e.y - 0.2, x + sd * (e.rx + 1.7), e.y - 1.6], INK, 1.1);
  }
}

export function brows(ctx: CanvasRenderingContext2D, r: Rig, b: Brows): void {
  const iy = b.y + r.m.browIn + (b.bias ?? 0);
  const oy = b.y + r.m.browOut;
  const my = (iy + oy) / 2 - r.m.arch - 0.8;
  const mx = (b.x0 + b.x1) / 2;
  for (const sd of [-1, 1]) {
    curve(ctx, sd * b.x0, iy - b.th * 0.5, sd * mx, my - b.th * 0.6, sd * b.x1, oy);
    ctx.quadraticCurveTo(sd * mx, my + b.th * 0.5, sd * b.x0, iy + b.th * 0.5);
    paint(ctx, b.color);
  }
}

/** A row of teeth: a band `th` thick (negative = upwards) following the lip curve with control y `ce`. */
function teethRow(ctx: CanvasRenderingContext2D, w: number, cl: number, cr: number, ce: number, th: number): void {
  curve(ctx, -w, cl, 0, ce, w, cr);
  ctx.lineTo(w, cr + th);
  ctx.quadraticCurveTo(0, ce + th, -w, cl + th);
  paint(ctx, '#f7f4ec');
}

function lipShade(ctx: CanvasRenderingContext2D, w: number, y: number, color: string): void {
  curve(ctx, -w * 0.4, y + 2, 0, y + 3, w * 0.4, y + 2);
  stroke(ctx, color, 1);
}

function closedMouth(ctx: CanvasRenderingContext2D, w: number, cl: number, cr: number, cu: number, ms: Mouth): void {
  const qy = (t: number): number => (1 - t) * (1 - t) * cl + 2 * t * (1 - t) * cu + t * t * cr;
  if (ms.full) {
    curve(ctx, -w * 0.76, qy(0.12), 0, qy(0.5) + 4.6, w * 0.76, qy(0.88));
    paint(ctx, ms.full);
  }
  curve(ctx, -w, cl, 0, cu, w, cr);
  stroke(ctx, INK, 1.1);
  lipShade(ctx, w, qy(0.5) + (ms.full ? 2.2 : 0), ms.shade);
}

/** Mouth from closed (0) to wide open (1), shaped by the mood; `grin` shows teeth whenever happy. */
export function mouth(ctx: CanvasRenderingContext2D, r: Rig, ms: Mouth): void {
  const grin = ms.grin === true && r.mood === 'happy';
  const gap = Math.max(r.mouth * 7, grin ? 2.8 : 0);
  const w = ms.w + r.m.widen - r.mouth * 1.4;
  const cl = ms.y - r.m.lift + r.mouth * 0.5;
  const cr = cl - (ms.smirk ?? 0);
  const up = ms.y - r.m.lift + r.m.curv - gap * 0.15;
  const cu = 2 * up - (cl + cr) / 2;
  const cd = cu + 2 * gap;
  if (r.m.lift > 1) { // smile creases
    poly(ctx, [-w - 0.8, cl - 1.6, -w - 1.7, cl, -w - 0.8, cl + 1.4], ms.shade, 0.8);
    poly(ctx, [w + 0.8, cr - 1.6, w + 1.7, cr, w + 0.8, cr + 1.4], ms.shade, 0.8);
  }
  if (gap < 0.6) return closedMouth(ctx, w, cl, cr, cu, ms);
  curve(ctx, -w, cl, 0, cu, w, cr);
  ctx.quadraticCurveTo(0, cd, -w, cl);
  paint(ctx, '#4a1614');
  ctx.save();
  ctx.clip();
  teethRow(ctx, w, cl, cr, cu, Math.min(gap * 0.42, 2.4));
  if (grin) teethRow(ctx, w, cl, cr, cd, -Math.min(gap * 0.4, 1.6));
  if (gap > 3.2) ellipse(ctx, 0, up + gap - 0.3, w * 0.5, gap * 0.25, '#c25856');
  ctx.restore();
  curve(ctx, -w, cl, 0, cu, w, cr);
  ctx.quadraticCurveTo(0, cd, -w, cl);
  stroke(ctx, ms.full ?? ms.lip, ms.full ? 1.5 : 0.9);
  lipShade(ctx, w, up + gap, ms.shade);
}

/** Thick round-capped polyline with an outline: arms, fingers. */
export function limb(ctx: CanvasRenderingContext2D, pts: readonly number[], r: number, color: string): void {
  poly(ctx, pts, LINE, r * 2 + 1.2);
  poly(ctx, pts, color, r * 2);
}

/** Sleeved arm along `pts` (shoulder → wrist) with a dark panel down its right side. */
export function arm(ctx: CanvasRenderingContext2D, pts: readonly number[], h: Hand): void {
  limb(ctx, pts, 6.4, h.sleeve);
  ctx.save();
  ctx.translate(3, 0.6);
  poly(ctx, pts, h.sleeveDark, 4.4);
  ctx.restore();
}

/** Front-on fist (curled fingers facing the viewer) centred on (x, y). */
export function fist(ctx: CanvasRenderingContext2D, x: number, y: number, h: Hand): void {
  ctx.beginPath();
  ctx.roundRect(x - 7, y - 6, 14, 12.5, 4.5);
  paint(ctx, h.skin, LINE);
  ctx.save();
  ctx.clip();
  ellipse(ctx, x + 8.6, y, 5, 9, h.dark);
  ctx.restore();
  for (let i = 0; i < 3; i++) poly(ctx, [x - 6.4, y - 2.2 + i * 3.1, x + 2.6, y - 2.2 + i * 3.1], LINE, 0.7);
}

/** Fist with the index finger pointing from (x, y) by (dx, dy) and the thumb across the curled fingers. */
export function pointHand(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, h: Hand): void {
  fist(ctx, x, y, h);
  limb(ctx, [x - 2, y - 3, x - 2 + dx, y - 3 + dy], 2.5, h.skin);
  ellipse(ctx, x - 2 + dx * 0.97, y - 3 + dy * 0.97, 1.3, 1, NAIL, Math.atan2(dy, dx));
  limb(ctx, [x + 3, y - 1.4, x - 3, y + 0.6], 2, h.skin);
}

function thumbsUp(ctx: CanvasRenderingContext2D, x: number, y: number, h: Hand): void {
  arm(ctx, [x + 11, y + 40, x + 3, y + 5], h);
  fist(ctx, x, y, h);
  limb(ctx, [x - 3.4, y - 5, x - 3.9, y - 15], 2.7, h.skin);
  ellipse(ctx, x - 3.9, y - 15.6, 1.3, 0.9, NAIL);
}

function salute(ctx: CanvasRenderingContext2D, h: Hand): void {
  arm(ctx, [-68, 104, -50, 74, -26, 48], h);
  limb(ctx, [-26, 47.6, -9, 38.6], 3.6, h.skin);
  poly(ctx, [-19, 42.4, -9.6, 37.4], LINE, 0.6);
  poly(ctx, [-18.2, 44.6, -9, 39.8], LINE, 0.6);
}

const SPREAD: readonly (readonly [number, number])[] = [[-2.15, 9], [-1.78, 11], [-1.42, 11.5], [-1.06, 10], [2.9, 7.5]]; // [angle, length]

function facepalm(ctx: CanvasRenderingContext2D, h: Hand): void {
  arm(ctx, [48, 130, 33, 92, 18, 67], h);
  limb(ctx, [17, 65, 7, 55], 5.6, h.skin);
  for (const [a, len] of SPREAD) { // fingers start 6 units out from the palm centre (1, 48)
    limb(ctx, [1 + Math.cos(a) * 6, 48 + Math.sin(a) * 6, 1 + Math.cos(a) * (6 + len), 48 + Math.sin(a) * (6 + len)], 2.3, h.skin);
  }
  ctx.beginPath();
  ctx.ellipse(1.5, 50, 10, 8.6, -0.35, 0, TAU);
  paint(ctx, h.skin, LINE);
  ctx.save();
  ctx.clip();
  ellipse(ctx, 13, 52, 5.5, 11, h.dark, -0.35);
  ctx.restore();
}

/** The generic version of each gesture, in the space index.ts sets up for it. */
export function gesture(ctx: CanvasRenderingContext2D, g: Gesture, h: Hand): void {
  switch (g) {
    case 'none': return;
    case 'thumbsUp': return thumbsUp(ctx, 27, 99, h);
    case 'point':
      arm(ctx, [34, 138, 26, 103], h);
      return pointHand(ctx, 22, 98, -11, -7, h);
    case 'salute': return salute(ctx, h);
    case 'facepalm': return facepalm(ctx, h);
    default: throw new Error(`unhandled: ${g satisfies never}`);
  }
}
