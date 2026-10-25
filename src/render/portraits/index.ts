import { drawBust, type ArtView, type BustArt } from '../pixel/bust';
import { PAL, hexOf } from '../pixel/palette';
import { ADMIRAL } from './admiral';
import { CHIEF } from './chief';
import { SHOOTER } from './shooter';
import type { Box, CharacterArt, CharacterId, Gesture, Mood, MoodShape, Rig } from './types';
import { WINGMAN } from './wingman';

/**
 * Animated head-and-shoulders portraits of the four talking characters as modern hi-res pixel art (doc 06,
 * doc 20). The caller animates `mouth` while a line is spoken; blinking, breathing and glances come from `t`.
 * Each animation state is rasterised once (pixel/bust.ts) and blitted with hard pixel edges.
 */

export type { Box, CharacterId, Frame, Gesture, Mood, MoodShape, Rig } from './types';
export interface PortraitState {
  t: number; // seconds; drives idle breathing and the internal blink timer (blink every ~3–5 s, deterministic from t)
  mouth: number; // 0 = closed .. 1 = wide open; the caller animates this while the character talks
  mood: Mood; // eyebrows, eyelids, mouth corners, a small head drop
  gesture: Gesture; // a hand/arm in frame; 'none' = no hands visible
  radio?: boolean; // draw as a live radio video feed: green phosphor palette, scanlines, flicker, thin frame
}

const ART: Readonly<Record<CharacterId, CharacterArt>> = { admiral: ADMIRAL, chief: CHIEF, shooter: SHOOTER, wingman: WINGMAN };
/** Per-character phase so the cast never blinks or bobs in sync. */
const SEED: Readonly<Record<CharacterId, number>> = { admiral: 0.3, chief: 1.9, shooter: 3.1, wingman: 4.6 };
const HEAD_SPACE: Readonly<Record<Gesture, boolean>> = { none: false, thumbsUp: false, point: false, salute: true, facepalm: true };

export const MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.7, lidTop: 0.12, lidLow: 0.06, pupil: 1, lift: 0.3, curv: 0.4, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.3, browOut: -0.5, arch: 1.3, lidTop: 0.06, lidLow: 0.38, pupil: 1, lift: 2.3, curv: 1.7, widen: 1.4, tilt: 0.035, nod: -0.6 },
  stern: { browIn: 2.5, browOut: -0.9, arch: 0.1, lidTop: 0.3, lidLow: 0.14, pupil: 0.95, lift: -0.7, curv: -0.1, widen: -1.3, tilt: 0, nod: 0.9 },
  worried: { browIn: -2.7, browOut: 1.3, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.72, lift: -1.7, curv: -0.8, widen: -0.9, tilt: -0.05, nod: 0.4 },
};

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

/** Quantises the continuous animation inputs to pixel-art frames. */
export function pixelRig(t: number, mouth: number, mood: Mood, gesture: Gesture, seed: number, table: Readonly<Record<Mood, MoodShape>>): Rig {
  const b = blinkAt(t, seed);
  const glance = hash(Math.floor(t / 2.3 + seed * 7));
  const look = glance > 0.72 ? (glance - 0.86) * 4 : 0;
  return {
    mood, gesture, m: table[mood],
    mouth: mouth < 0.2 ? 0 : mouth < 0.62 ? 1 : 2,
    blink: b < 0.3 ? 0 : b < 0.75 ? 1 : 2,
    look: look > 0.15 ? 1 : look < -0.15 ? -1 : 0,
    phase: Math.floor(t / 0.9 + seed) % 2 === 0 ? 0 : 1,
  };
}

export const rigKey = (r: Rig): string => `${r.mood}|${r.gesture}|${r.mouth}${r.blink}${r.look}${r.phase}`;
/** Idle breathing as a one-pixel drop of the whole figure. */
export const breath = (t: number, seed: number): number => (Math.sin(t * 1.6 + seed) > 0.25 ? 1 : 0);

function bust(id: CharacterId): BustArt<Rig> {
  const art = ART[id];
  return {
    id,
    background: art.background,
    ambient: art.ambient,
    figure(p, r) {
      art.body(p, r);
      const oy = p.oy;
      p.oy = oy + Math.round((r.m.nod + (r.gesture === 'facepalm' ? 2 : 0)) * p.k);
      art.head(p, r);
      if (HEAD_SPACE[r.gesture]) art.gesture(p, r);
      p.oy = oy;
      if (r.gesture !== 'none' && !HEAD_SPACE[r.gesture]) art.gesture(p, r);
    },
  };
}

const BUSTS: Readonly<Record<CharacterId, BustArt<Rig>>> = {
  admiral: bust('admiral'), chief: bust('chief'), shooter: bust('shooter'), wingman: bust('wingman'),
};
/** The pixel art of one character (tests render its frames directly). */
export const portraitArt = (id: CharacterId): BustArt<Rig> => BUSTS[id];

const GREEN_HI = hexOf(PAL.phosphor[5] ?? 0);
const GREEN_TOP = hexOf(PAL.phosphor[6] ?? 0);

/** The live radio feed over a pixel portrait: scanlines, flicker, a rolling bar, noise pixels, corner brackets. */
function radioFeed(g: CanvasRenderingContext2D, v: ArtView): void {
  g.fillStyle = 'rgba(0,18,12,0.38)';
  for (let y = 1; y < v.H; y += 2) g.fillRect(0, y, v.W, 1);
  g.fillStyle = `rgba(200,255,235,${(0.02 + hash(Math.floor(v.t * 14)) * 0.07).toFixed(3)})`;
  g.fillRect(0, 0, v.W, v.H);
  const band = Math.round(((v.t * 0.3) % 1) * v.H * 1.3 - v.H * 0.15);
  g.fillStyle = 'rgba(180,255,230,0.14)';
  g.fillRect(0, band, v.W, Math.max(2, Math.round(v.H * 0.1)));
  const f = Math.floor(v.t * 24);
  g.fillStyle = GREEN_TOP;
  for (let i = 0; i < 5; i++) g.fillRect(Math.floor(hash(f * 13 + i) * v.W), Math.floor(hash(f * 7 + i * 3.1) * v.H), 1, 1);
  const c = Math.max(3, Math.round(v.W * 0.16));
  g.fillStyle = GREEN_HI;
  for (const [x, y, sx, sy] of [[0, 0, 1, 1], [v.W - 1, 0, -1, 1], [0, v.H - 1, 1, -1], [v.W - 1, v.H - 1, -1, -1]] as const) {
    g.fillRect(sx > 0 ? x : x - c + 1, y, c, 1);
    g.fillRect(x, sy > 0 ? y : y - c + 1, 1, c);
  }
  if (Math.floor(v.t * 1.5) % 2 === 0) {
    g.fillStyle = '#ff5a44';
    g.fillRect(3, 3, 2, 2);
  }
}

/** Head-and-shoulders portrait filling the box (aspect ~5:6), bottom-aligned, clipped to the box. Looks right from 66×80 up to 260×312. */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CharacterId, box: Box, s: PortraitState): void {
  const seed = SEED[id];
  const rig = pixelRig(s.t, s.mouth, s.mood, s.gesture, seed, MOODS);
  drawBust(ctx, box, BUSTS[id], {
    rig, key: rigKey(rig), t: s.t, bob: breath(s.t, seed), radio: s.radio,
    overlay: s.radio ? radioFeed : undefined,
  });
}
