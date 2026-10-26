import { drawBust, type BustArt } from '../pixel/bust';
import { hash, radioFeed } from './overlays';
import type { Box, CharacterArt, Gesture, Mood, MoodShape, Rig } from './types';
import { WINGMAN } from './wingman';

/**
 * The last procedural portrait (docs 20, 33): the wingman, drawn in code until the owner's `wingman.png` exists —
 * then `portraits/index.ts` uses the image automatically. Retiring it is a one-file follow-up: drop the fallback in
 * `portraits/index.ts`, then delete this file, `wingman.ts`, `parts.ts`, `features.ts`, `hands.ts` and
 * `tests/unit/pixel-cast.test.ts` (the head tilt `Pix.rot` / `nudge` in `pixel/raster.ts` is then unused too).
 */

export interface ProceduralState { t: number; mouth: number; mood: Mood; gesture: Gesture; radio?: boolean }

const HEAD_SPACE: Readonly<Record<Gesture, boolean>> = { none: false, thumbsUp: false, point: false, salute: true, facepalm: true };
const SEED = 4.6;

export const MOODS: Readonly<Record<Mood, MoodShape>> = {
  neutral: { browIn: 0, browOut: 0, arch: 0.7, lidTop: 0.12, lidLow: 0.06, pupil: 1, lift: 0.3, curv: 0.4, widen: 0, tilt: 0, nod: 0 },
  happy: { browIn: -1.3, browOut: -0.5, arch: 1.3, lidTop: 0.06, lidLow: 0.38, pupil: 1, lift: 2.3, curv: 1.7, widen: 1.4, tilt: 0.035, nod: -0.6 },
  stern: { browIn: 2.5, browOut: -0.9, arch: 0.1, lidTop: 0.3, lidLow: 0.14, pupil: 0.95, lift: -0.7, curv: -0.1, widen: -1.3, tilt: 0, nod: 0.9 },
  worried: { browIn: -2.7, browOut: 1.3, arch: 0.3, lidTop: 0, lidLow: 0, pupil: 0.72, lift: -1.7, curv: -0.8, widen: -0.9, tilt: -0.05, nod: 0.4 },
};

/** 0 = open .. 1 = shut: one 0.16 s blink every 3–5 s, deterministic from t. */
function blinkAt(t: number, seed: number): number {
  const k = Math.floor(t / 4);
  const d = (t - k * 4 - hash(k + seed * 31)) / 0.16;
  return d < 0 || d > 1 ? 0 : 1 - Math.abs(d * 2 - 1);
}

/** Quantises the continuous animation inputs to pixel-art frames. */
export function pixelRig(t: number, mouth: number, mood: Mood, gesture: Gesture, seed: number): Rig {
  const b = blinkAt(t, seed);
  const glance = hash(Math.floor(t / 2.3 + seed * 7));
  const look = glance > 0.72 ? (glance - 0.86) * 4 : 0;
  return {
    mood, gesture, m: MOODS[mood],
    mouth: mouth < 0.2 ? 0 : mouth < 0.62 ? 1 : 2,
    blink: b < 0.3 ? 0 : b < 0.75 ? 1 : 2,
    look: look > 0.15 ? 1 : look < -0.15 ? -1 : 0,
    phase: Math.floor(t / 0.9 + seed) % 2 === 0 ? 0 : 1,
  };
}

const rigKey = (r: Rig): string => `${r.mood}|${r.gesture}|${r.mouth}${r.blink}${r.look}${r.phase}`;

function bust(id: string, art: CharacterArt): BustArt<Rig> {
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

/** The wingman's pixel art (tests render its frames directly). */
export const wingmanArt: BustArt<Rig> = bust('wingman', WINGMAN);

/** The procedural wingman filling the box: moods, gestures, talking, blinking, the radio feed. */
export function drawProceduralWingman(ctx: CanvasRenderingContext2D, box: Box, s: ProceduralState): void {
  const rig = pixelRig(s.t, s.mouth, s.mood, s.gesture, SEED);
  drawBust(ctx, box, wingmanArt, {
    rig, key: rigKey(rig), t: s.t, bob: Math.sin(s.t * 1.6 + SEED) > 0.25 ? 1 : 0, radio: s.radio,
    overlay: s.radio ? radioFeed : undefined,
  });
}
