import type { Box, Frame, Mood, MoodShape, Rig } from '../portraits';
import { LINE, neck, paint, poly, shaded, stroke, type Skin } from '../portraits/parts';
import { circle, ellipse, fillPair, fillPoly } from '../shapes';

/**
 * Shared pieces of the player avatars: a kid-proportioned mood table and rig, the flight suit with harness and a
 * blank name tape, the carrier-deck sky, and the gold "selected" glow. Same logical 100×120 frame as the portraits.
 */

export const FRAME_W = 100;
export const FRAME_H = 120;
/** Pivot for head tilt / nod (base of the neck). */
export const NECK_Y = 81;
const TAU = Math.PI * 2;
const STRAP = '#2c3029';

export interface Sky {
  top: string; mid: string; low: string; sea: string; cloud: string;
  sun: string; glow: string; sunX: number; sunY: number; sunR: number; // glow = "r,g,b" of the sun's halo
  island: -1 | 1; // which side the carrier island stands on
}
export interface Suit { base: string; dark: string; light: string; tee: string }
export interface AvatarArt {
  sky: Sky;
  moods: Readonly<Record<Mood, MoodShape>>;
  tilt: number; // resting head tilt (rad)
  body(ctx: CanvasRenderingContext2D, r: Rig): void;
  head(ctx: CanvasRenderingContext2D, r: Rig): void;
  /** Optional layer in front of the head, in body space. */
  front?(ctx: CanvasRenderingContext2D, r: Rig): void;
}

const BASE: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.8, lidTop: 0.08, lidLow: 0.05, pupil: 1, lift: 0.4, curv: 0.5, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.2, browOut: -0.6, arch: 1.4, lidTop: 0.04, lidLow: 0.34, pupil: 1, lift: 2.1, curv: 1.6, widen: 1.2, tilt: 0.04, nod: -0.6 },
  stern: { browIn: 2.2, browOut: -0.8, arch: 0.1, lidTop: 0.26, lidLow: 0.12, pupil: 0.95, lift: -0.5, curv: -0.1, widen: -1, tilt: 0, nod: 0.8 },
  worried: { browIn: -2.4, browOut: 1.1, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.75, lift: -1.4, curv: -0.7, widen: -0.8, tilt: -0.05, nod: 0.4 },
};

/** The kid mood table with a resting smile added to every mood (negative = straighter). Built once per avatar. */
export function moods(smile: number): Readonly<Record<Mood, MoodShape>> {
  const build = (m: MoodShape): MoodShape => ({ ...m, lift: m.lift + smile, curv: m.curv + smile * 0.8 });
  return { neutral: build(BASE.neutral), happy: build(BASE.happy), stern: build(BASE.stern), worried: build(BASE.worried) };
}

export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 0 = open .. 1 = shut: one 0.16 s blink every 3–5 s, deterministic from t. */
function blinkAt(t: number, seed: number): number {
  const k = Math.floor(t / 4);
  const d = (t - k * 4 - hash(k + seed * 31)) / 0.16;
  return d < 0 || d > 1 ? 0 : 1 - Math.abs(d * 2 - 1);
}

export function avatarRig(t: number, mouth: number, mood: Mood, seed: number, table: Readonly<Record<Mood, MoodShape>>): Rig {
  const glance = hash(Math.floor(t / 2.6 + seed * 7));
  return {
    t,
    mouth: Math.min(1, Math.max(0, mouth)),
    mood,
    m: table[mood],
    gesture: 'none',
    blink: blinkAt(t, seed),
    look: glance > 0.75 ? (glance - 0.875) * 4 : 0,
  };
}

/** Carrier deck at sea under a per-avatar sky: sun + halo, drifting clouds, horizon, island, deck. */
export function deckBackdrop(ctx: CanvasRenderingContext2D, f: Frame, t: number, k: Sky): void {
  const w = f.r - f.l;
  const g = ctx.createLinearGradient(0, f.t, 0, 78);
  g.addColorStop(0, k.top);
  g.addColorStop(0.6, k.mid);
  g.addColorStop(1, k.low);
  ctx.fillStyle = g;
  ctx.fillRect(f.l, f.t, w, 78 - f.t);
  const halo = ctx.createRadialGradient(k.sunX, k.sunY, k.sunR * 0.6, k.sunX, k.sunY, k.sunR * 5);
  halo.addColorStop(0, `rgba(${k.glow},0.6)`);
  halo.addColorStop(1, `rgba(${k.glow},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(f.l, f.t, w, 78 - f.t);
  circle(ctx, k.sunX, k.sunY, k.sunR, k.sun);
  const span = w + 50;
  for (let i = 0; i < 3; i++) {
    const x = f.l - 25 + ((((t * 2.2 + i * 47) % span) + span) % span);
    ellipse(ctx, x, 14 + i * 17, 12 + i * 3, 2.6, k.cloud);
    ellipse(ctx, x + 5, 12.4 + i * 17, 6.5, 2.4, k.cloud);
  }
  ctx.fillStyle = k.sea;
  ctx.fillRect(f.l, 78, w, 13);
  poly(ctx, [f.l, 78.3, f.r, 78.3], 'rgba(255,255,255,0.4)', 0.6);
  for (let i = 0; i < 4; i++) poly(ctx, [k.sunX - 7 + i * 1.5, 80.4 + i * 2.6, k.sunX + 7 - i * 1.5, 80.4 + i * 2.6], k.sun, 0.8);
  const ix = k.island * 36; // the carrier's island: hull block, bridge with windows, mast
  ctx.fillStyle = '#56616e';
  ctx.fillRect(ix - 8, 74, 16, 17);
  ctx.fillRect(ix - 4.4, 67.6, 8.8, 6.6);
  ctx.fillStyle = 'rgba(16,26,36,0.65)';
  ctx.fillRect(ix - 3.6, 69.2, 7.2, 1.6);
  poly(ctx, [ix, 67.6, ix, 60.4], '#56616e', 0.8);
  ellipse(ctx, ix + 0.6, 61.2, 2.6, 0.9, '#56616e', -0.35); // radar
  ctx.fillStyle = '#474c52';
  ctx.fillRect(f.l, 90.5, w, f.b - 90.5);
  ctx.fillStyle = '#6b7178';
  ctx.fillRect(f.l, 90.5, w, 1.2);
  poly(ctx, [f.l, 104, f.r, 95], '#e8c01c', 1);
}

function suitPath(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(-8, 80);
  ctx.bezierCurveTo(-18, 82.6, -32, 84, -38.5, 93);
  ctx.lineTo(-52, 126);
  ctx.lineTo(52, 126);
  ctx.lineTo(38.5, 93);
  ctx.bezierCurveTo(32, 84, 18, 82.6, 8, 80);
  ctx.closePath();
}

function harness(ctx: CanvasRenderingContext2D): void {
  for (const sd of [-1, 1]) poly(ctx, [sd * 18.5, 84.5, sd * 14.6, 104, sd * 12.6, 126], STRAP, 3.8);
  poly(ctx, [-14.6, 108.6, 14.6, 108.6], STRAP, 3);
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(sd * 14.2 - 2.7, 106.3, 5.4, 4.8, 1);
    paint(ctx, '#c3c8cb', LINE, 0.6);
  }
}

/** Neck, flight suit with open collar, zip, harness and a blank name tape (the game prints the callsign elsewhere). */
export function flightSuit(ctx: CanvasRenderingContext2D, s: Suit, skin: Skin): void {
  neck(ctx, skin, 6.6);
  shaded(ctx, suitPath, s.base, s.dark, 46, 114, 22, 34);
  fillPoly(ctx, [-6.6, 80.6, 6.6, 80.6, 0, 91.6], s.tee);
  fillPoly(ctx, [-6.6, 80.6, 6.6, 80.6, 0, 86.4], skin.dark);
  fillPair(ctx, [6.2, 80, 14, 82.2, 10.6, 92, 1.4, 92.4], s.light, LINE);
  poly(ctx, [0, 92.4, 0, 126], 'rgba(0,0,0,0.35)', 0.7);
  harness(ctx);
  ctx.beginPath();
  ctx.roundRect(19.6, 95.4, 11.6, 4.8, 0.8);
  paint(ctx, '#6a4a30', LINE, 0.5);
  ctx.beginPath();
  ctx.roundRect(20.4, 96.1, 10, 3.4, 0.5);
  stroke(ctx, 'rgba(255,236,200,0.4)', 0.35);
}

/** Continues the path through the points with rounded corners (quadratic curves through the midpoints). */
export function smooth(ctx: CanvasRenderingContext2D, pts: readonly (readonly [number, number])[]): void {
  let px = NaN;
  let py = NaN;
  for (const [x, y] of pts) {
    if (Number.isNaN(px)) ctx.lineTo(x, y);
    else ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    px = x;
    py = y;
  }
  ctx.lineTo(px, py);
}

/** Round shoulder/chest patch: a ring and an inner disc for an emblem. */
export function roundPatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ring: string, inner: string): void {
  circle(ctx, x, y, r, ring);
  circle(ctx, x, y, r * 0.76, inner);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  stroke(ctx, LINE, 0.5);
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const d = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  paint(ctx, '#fff6c8');
}

/** A gold glow fading inwards from one edge: the gradient runs from (x0, y0) to (x1, y1) over the given rect. */
function edgeGlow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, rect: readonly number[], a: number): void {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, `rgba(255,205,70,${a.toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,205,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(rect[0] ?? 0, rect[1] ?? 0, rect[2] ?? 0, rect[3] ?? 0);
}

/** Pulsing gold frame with an inner glow and a twinkle, in box pixels (the caller has clipped to the box). */
export function selectionFrame(ctx: CanvasRenderingContext2D, b: Box, t: number): void {
  const lw = Math.max(1.5, Math.min(b.w, b.h) * 0.03);
  const d = Math.min(b.w, b.h) * 0.16;
  const a = 0.5 + Math.sin(t * 4.2) * 0.12;
  edgeGlow(ctx, 0, b.y, 0, b.y + d, [b.x, b.y, b.w, d], a);
  edgeGlow(ctx, 0, b.y + b.h, 0, b.y + b.h - d, [b.x, b.y + b.h - d, b.w, d], a);
  edgeGlow(ctx, b.x, 0, b.x + d, 0, [b.x, b.y, d, b.h], a);
  edgeGlow(ctx, b.x + b.w, 0, b.x + b.w - d, 0, [b.x + b.w - d, b.y, d, b.h], a);
  ctx.strokeStyle = '#ffcf3f';
  ctx.lineWidth = lw;
  ctx.strokeRect(b.x + lw / 2, b.y + lw / 2, b.w - lw, b.h - lw);
  ctx.strokeStyle = 'rgba(255,248,205,0.9)';
  ctx.lineWidth = Math.max(0.75, lw * 0.3);
  ctx.strokeRect(b.x + lw * 1.4, b.y + lw * 1.4, b.w - lw * 2.8, b.h - lw * 2.8);
  sparkle(ctx, b.x + b.w - lw * 3.4, b.y + lw * 3.4, lw * (1.7 + Math.sin(t * 6) * 0.6));
}
