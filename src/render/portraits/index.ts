import { ADMIRAL } from './admiral';
import { CHIEF } from './chief';
import { SHOOTER } from './shooter';
import { WINGMAN } from './wingman';

/**
 * Animated head-and-shoulders portraits of the four talking characters, vector-drawn (no assets).
 * The caller animates `mouth` while a line is spoken; blinking, breathing and sway come from `t`.
 */

export type CharacterId = 'admiral' | 'chief' | 'shooter' | 'wingman';
export type Mood = 'neutral' | 'happy' | 'stern' | 'worried';
export type Gesture = 'none' | 'thumbsUp' | 'point' | 'salute' | 'facepalm';
export interface PortraitState {
  t: number; // seconds; drives idle breathing/sway and the internal blink timer (blink every ~3–5 s, deterministic from t)
  mouth: number; // 0 = closed .. 1 = wide open; the caller animates this while the character talks
  mood: Mood; // eyebrows, mouth corners, small head tilt
  gesture: Gesture; // a hand/arm in frame; 'none' = no hands visible
  radio?: boolean; // draw as a live radio video feed: scanlines, slight flicker/noise, green-cyan tint, thin frame
}
export interface Box { x: number; y: number; w: number; h: number }

// ---- internal, shared with the character modules (type-only imports there) ----

/** Visible area in logical units (wider or taller than the 100×120 frame when the box aspect differs). */
export interface Frame { l: number; r: number; t: number; b: number }

export interface MoodShape {
  browIn: number; browOut: number; arch: number; // brow inner / outer offset (+ = lower), arch height
  lidTop: number; lidLow: number; pupil: number; // eyelid closure 0..1, pupil scale
  lift: number; curv: number; widen: number; // mouth-corner lift, smile depth, extra half-width
  tilt: number; nod: number; // head roll (rad) and drop
}

/** Per-frame animation values handed to every part. */
export interface Rig { t: number; mouth: number; mood: Mood; m: MoodShape; gesture: Gesture; blink: number; look: number }

export interface CharacterArt {
  background(ctx: CanvasRenderingContext2D, f: Frame, t: number): void;
  body(ctx: CanvasRenderingContext2D, r: Rig): void;
  head(ctx: CanvasRenderingContext2D, r: Rig): void;
  /** Draws r.gesture (never 'none'): salute / facepalm run in head space, the others in body space. */
  gesture(ctx: CanvasRenderingContext2D, r: Rig): void;
}

const FRAME_W = 100;
const FRAME_H = 120;
const NECK_Y = 84; // pivot for head tilt / nod

const ART: Readonly<Record<CharacterId, CharacterArt>> = { admiral: ADMIRAL, chief: CHIEF, shooter: SHOOTER, wingman: WINGMAN };
/** Per-character phase so the cast never blinks or bobs in sync. */
const SEED: Readonly<Record<CharacterId, number>> = { admiral: 0.3, chief: 1.9, shooter: 3.1, wingman: 4.6 };
const HEAD_SPACE: Readonly<Record<Gesture, boolean>> = { none: false, thumbsUp: false, point: false, salute: true, facepalm: true };

const MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.7, lidTop: 0.12, lidLow: 0.06, pupil: 1, lift: 0.3, curv: 0.4, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.3, browOut: -0.5, arch: 1.3, lidTop: 0.06, lidLow: 0.38, pupil: 1, lift: 2.3, curv: 1.7, widen: 1.4, tilt: 0.035, nod: -0.6 },
  stern: { browIn: 2.5, browOut: -0.9, arch: 0.1, lidTop: 0.3, lidLow: 0.14, pupil: 0.95, lift: -0.7, curv: -0.1, widen: -1.3, tilt: 0, nod: 0.9 },
  worried: { browIn: -2.7, browOut: 1.3, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.72, lift: -1.7, curv: -0.8, widen: -0.9, tilt: -0.05, nod: 0.4 },
};

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 0 = open .. 1 = shut: one 0.16 s blink every 3–5 s, deterministic from t. */
function blinkAt(t: number, seed: number): number {
  const k = Math.floor(t / 4);
  const d = (t - k * 4 - hash(k + seed * 31)) / 0.16;
  return d < 0 || d > 1 ? 0 : 1 - Math.abs(d * 2 - 1);
}

function makeRig(s: PortraitState, seed: number): Rig {
  const glance = hash(Math.floor(s.t / 2.3 + seed * 7));
  return {
    t: s.t,
    mouth: Math.min(1, Math.max(0, s.mouth)),
    mood: s.mood,
    m: MOODS[s.mood],
    gesture: s.gesture,
    blink: blinkAt(s.t, seed),
    look: glance > 0.72 ? (glance - 0.86) * 4 : 0, // an occasional sideways glance
  };
}

function drawFigure(ctx: CanvasRenderingContext2D, art: CharacterArt, r: Rig, seed: number): void {
  const palm = r.gesture === 'facepalm';
  const inHead = HEAD_SPACE[r.gesture];
  ctx.save();
  ctx.translate(0, Math.sin(r.t * 1.6 + seed) * 0.45); // breathing
  art.body(ctx, r);
  ctx.save();
  const tilt = r.m.tilt + Math.sin(r.t * 0.8 + seed) * 0.018 + (palm ? 0.07 : 0);
  const bob = Math.sin(r.t * 1.6 + seed + 0.5) * 0.5 + r.m.nod + r.mouth * 0.6 + (palm ? 2 : 0);
  ctx.translate(0, NECK_Y);
  ctx.rotate(tilt);
  ctx.translate(0, bob - NECK_Y);
  art.head(ctx, r);
  if (inHead) art.gesture(ctx, r);
  ctx.restore();
  if (r.gesture !== 'none' && !inHead) art.gesture(ctx, r);
  ctx.restore();
}

function radioTint(ctx: CanvasRenderingContext2D, b: Box, t: number): void {
  ctx.globalCompositeOperation = 'color'; // keeps the luminance, so the portrait stays readable
  ctx.fillStyle = '#35d6ad';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(10,46,38,0.38)';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#b4dccf';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(200,255,235,${(0.02 + hash(Math.floor(t * 14)) * 0.06).toFixed(3)})`; // flicker
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const step = Math.max(2, Math.round(b.h / 80));
  ctx.fillStyle = 'rgba(0,18,14,0.22)';
  for (let y = b.y; y < b.y + b.h; y += step) ctx.fillRect(b.x, y, b.w, Math.max(1, step * 0.45));
  const band = b.y + (((t * 0.3) % 1 + 1) % 1) * b.h * 1.3 - b.h * 0.15; // slow rolling bar
  const g = ctx.createLinearGradient(0, band - b.h * 0.08, 0, band + b.h * 0.08);
  g.addColorStop(0, 'rgba(180,255,230,0)');
  g.addColorStop(0.5, 'rgba(180,255,230,0.12)');
  g.addColorStop(1, 'rgba(180,255,230,0)');
  ctx.fillStyle = g;
  ctx.fillRect(b.x, band - b.h * 0.08, b.w, b.h * 0.16);
  const f = Math.floor(t * 24);
  ctx.fillStyle = 'rgba(220,255,240,0.55)';
  for (let i = 0; i < 14; i++) ctx.fillRect(b.x + hash(f * 13 + i) * b.w, b.y + hash(f * 7 + i * 3.1) * b.h, 1 + hash(f + i) * 2, 1);
}

function radioFrame(ctx: CanvasRenderingContext2D, b: Box, t: number): void {
  const v = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h * 0.45, Math.min(b.w, b.h) * 0.3,
    b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) * 0.75);
  v.addColorStop(0, 'rgba(0,12,10,0)');
  v.addColorStop(1, 'rgba(0,12,10,0.5)');
  ctx.fillStyle = v;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  const lw = Math.max(1, b.w / 130);
  const c = b.w * 0.12;
  ctx.strokeStyle = 'rgba(130,255,215,0.55)';
  ctx.lineWidth = lw;
  ctx.strokeRect(b.x + lw / 2, b.y + lw / 2, b.w - lw, b.h - lw);
  ctx.strokeStyle = 'rgba(170,255,225,0.95)';
  ctx.lineWidth = lw * 2;
  ctx.beginPath();
  for (const [x, y, sx, sy] of [[b.x, b.y, 1, 1], [b.x + b.w, b.y, -1, 1], [b.x, b.y + b.h, 1, -1], [b.x + b.w, b.y + b.h, -1, -1]] as const) {
    ctx.moveTo(x + sx * c, y + sy * lw);
    ctx.lineTo(x + sx * lw, y + sy * lw);
    ctx.lineTo(x + sx * lw, y + sy * c);
  }
  ctx.stroke();
  if (Math.floor(t * 1.5) % 2 === 0) {
    ctx.fillStyle = '#ff5a44';
    ctx.beginPath();
    ctx.arc(b.x + b.w * 0.09, b.y + b.w * 0.09, Math.max(1.5, b.w * 0.022), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Head-and-shoulders portrait filling the box (aspect ~5:6), bottom-aligned, clipped to the box. Must look good from 90×108 up to 260×312. */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CharacterId, box: Box, s: PortraitState): void {
  const k = Math.min(box.w / FRAME_W, box.h / FRAME_H);
  if (!(k > 0)) return;
  const art = ART[id];
  const seed = SEED[id];
  const jitter = s.radio && hash(Math.floor(s.t * 11) + seed) > 0.93 ? 1.4 : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h);
  ctx.scale(k, k);
  ctx.translate(jitter, -FRAME_H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hw = box.w / 2 / k + 2;
  art.background(ctx, { l: -hw, r: hw, t: FRAME_H - box.h / k - 2, b: FRAME_H + 2 }, s.t);
  drawFigure(ctx, art, makeRig(s, seed), seed);
  ctx.restore();
  if (s.radio) {
    radioTint(ctx, box, s.t);
    radioFrame(ctx, box, s.t);
  }
  ctx.restore();
}
