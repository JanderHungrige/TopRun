// Image portraits (doc 33): which frame of a character's portrait shows at a moment — the base image, the talk
// (open) or half frame following the speech box's mouth value (doc 06), a 120 ms blink once every 3–6 s with a per-character phase —
// and the one-pixel breathing bob. Pure and deterministic in time, so a row of portraits never moves in sync and
// tests can pin exact moments.

export type PortraitFrame = 'base' | 'talk' | 'half' | 'blink';
export type MouthShape = 'closed' | 'half' | 'open';

/** Seconds one blink lasts. */
export const BLINK_TIME = 0.12;
/** Blinks start once per window, somewhere in its first BLINK_JITTER seconds: 3–6 s apart. */
const BLINK_WINDOW = 4.5;
const BLINK_JITTER = 1.5;

export function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** True while a blink is shown at time t (seconds) for the character with phase `seed`. */
export function blinking(t: number, seed: number): boolean {
  const local = t + seed * 1.7;
  const k = Math.floor(local / BLINK_WINDOW);
  const start = k * BLINK_WINDOW + hash01(k * 7.31 + seed * 13.7) * BLINK_JITTER;
  return local >= start && local < start + BLINK_TIME;
}

/** The speech box's mouth value (0 closed, 0.5 half, 1 open) as a shape. */
export const mouthShape = (mouth: number): MouthShape => (mouth >= 0.75 ? 'open' : mouth >= 0.35 ? 'half' : 'closed');

/** Idle breathing: the portrait sinks by one image pixel for part of each breath (0 or 1). */
export const breathBob = (t: number, seed: number): 0 | 1 => (Math.sin(t * 1.6 + seed) > 0.25 ? 1 : 0);

/** The frame to show: the open (talk) or half mouth frame while the mouth is open (where the character has it),
 *  else blink (if it has one) while blinking, else the base image. */
export function portraitFrame(t: number, mouth: number, seed: number, has: { talk: boolean; half: boolean; blink: boolean }): PortraitFrame {
  const shape = mouthShape(mouth);
  if (shape === 'open' && has.talk) return 'talk';
  if (shape === 'half' && has.half) return 'half';
  if (has.blink && blinking(t, seed)) return 'blink';
  return 'base';
}
