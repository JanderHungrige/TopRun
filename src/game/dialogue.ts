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

export function syllableIndex(t: number): number {
  return Math.floor(t * SYLLABLES_PER_SEC);
}

/** Seconds each mouth shape is held (classic pixel-game lip flap: at most ~7 changes a second). */
export const MOUTH_HOLD = 0.15;
/** Mouth shapes as values: closed, half open, open. */
export type MouthValue = 0 | 0.5 | 1;

const VOWEL = /[aeiouyäöüàáâéèêíìîóòôúùû]/giu;
const PAUSE = /[,.;:!?…]/u;
/** The open–closed flap for speakers without the text, never the same shape twice in a row. */
const FLAP: readonly MouthValue[] = [1, 0.5, 1, 0, 0.5, 1, 0.5, 0];

/** The shape the text typed during hold k asks for: pause → closed, 2+ vowels → open, 1 → half, none → closed. */
function textShape(text: string, k: number, cps: number): MouthValue {
  const from = Math.floor(k * MOUTH_HOLD * cps);
  if (from >= text.length) return 0;
  const chunk = text.slice(from, Math.max(from + 1, Math.floor((k + 1) * MOUTH_HOLD * cps)));
  if (PAUSE.test(chunk)) return 0;
  const vowels = chunk.match(VOWEL)?.length ?? 0;
  return vowels >= 2 ? 1 : vowels === 1 ? 0.5 : 0;
}

/** Mouth while a line is typed (doc 06): follows the text, held MOUTH_HOLD s; an open shape never repeats. */
export function mouthFromText(text: string, t: number, cps = CHARS_PER_SEC): MouthValue {
  const k = Math.floor(Math.max(0, t) / MOUTH_HOLD);
  let prev: MouthValue = 0;
  for (let i = 0; i <= k; i++) {
    const want = textShape(text, i, cps);
    prev = want > 0 && want === prev ? (want === 1 ? 0.5 : 1) : want;
  }
  return prev;
}

/** Mouth for speakers without the text at hand: the held flap while talking, closed otherwise. */
export function mouthOpen(t: number, talking: boolean): MouthValue {
  if (!talking) return 0;
  return FLAP[Math.floor(Math.max(0, t) / MOUTH_HOLD) % FLAP.length] ?? 0;
}

/** Deterministic variant index; feed a running counter so an event never repeats back to back. */
export function pickVariant(count: number, seed: number): number {
  if (count <= 0) return 0;
  return Math.abs(Math.floor(seed)) % count;
}
