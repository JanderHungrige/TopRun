// Image portraits (doc 33): which frame of a character's portrait shows at a moment — the base image, the talk
// frame while the speech box's mouth value is open, a 120 ms blink once every 3–6 s with a per-character phase —
// and the one-pixel breathing bob. Pure and deterministic in time, so a row of portraits never moves in sync and
// tests can pin exact moments.

export type PortraitFrame = 'base' | 'talk' | 'blink';

/** Seconds one blink lasts. */
export const BLINK_TIME = 0.12;
/** Blinks start once per window, somewhere in its first BLINK_JITTER seconds: 3–6 s apart. */
const BLINK_WINDOW = 4.5;
const BLINK_JITTER = 1.5;
/** The speech box's mouth value (0 … 1) from which the talk frame shows. */
export const TALK_OPEN = 0.35;

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

/** True while the mouth is open far enough for the talk frame. */
export const talking = (mouth: number): boolean => mouth >= TALK_OPEN;

/** Idle breathing: the portrait sinks by one image pixel for part of each breath (0 or 1). */
export const breathBob = (t: number, seed: number): 0 | 1 => (Math.sin(t * 1.6 + seed) > 0.25 ? 1 : 0);

/** The frame to show: talk while the mouth is open (if the character has one), else blink (if it has one) while
 *  blinking, else the base image. */
export function portraitFrame(t: number, mouth: number, seed: number, has: { talk: boolean; blink: boolean }): PortraitFrame {
  if (has.talk && talking(mouth)) return 'talk';
  if (has.blink && blinking(t, seed)) return 'blink';
  return 'base';
}
