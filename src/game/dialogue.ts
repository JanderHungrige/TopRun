// Pure helpers for talking characters (doc 06): typewriter text, timing and mouth animation.

export const CHARS_PER_SEC = 34;
export const SYLLABLES_PER_SEC = 9;
export const HOLD_AFTER_TYPING = 1.6;

/** The visible prefix of `text` after `elapsed` seconds of typing. */
export function typewriter(text: string, elapsed: number, cps = CHARS_PER_SEC): string {
  const n = Math.max(0, Math.min(text.length, Math.floor(elapsed * cps)));
  return text.slice(0, n);
}

export function typingTime(text: string, cps = CHARS_PER_SEC): number {
  return text.length / cps;
}

/** How long a line stays up in total (typing + reading time). */
export function lineDuration(text: string, cps = CHARS_PER_SEC): number {
  return Math.max(1.8, typingTime(text, cps) + 1.4);
}

/** Small deterministic hash → [0, 1). */
function hash01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function syllableIndex(t: number): number {
  return Math.floor(t * SYLLABLES_PER_SEC);
}

/** Mouth openness 0..1: a syllable pattern while talking, closed otherwise. */
export function mouthOpen(t: number, talking: boolean): number {
  if (!talking) return 0;
  const phase = t * SYLLABLES_PER_SEC;
  const local = phase - Math.floor(phase);
  const amp = 0.45 + 0.55 * hash01(Math.floor(phase));
  return Math.max(0, Math.min(1, Math.sin(local * Math.PI) * amp));
}

/** Deterministic variant index; feed a running counter so an event never repeats back to back. */
export function pickVariant(count: number, seed: number): number {
  if (count <= 0) return 0;
  return Math.abs(Math.floor(seed)) % count;
}
