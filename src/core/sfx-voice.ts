import { clamp, filterNode, gainNode, noiseNode, oscNode, rand, shaperNode } from './audio-nodes';

/**
 * Gibberish "talking" syllables: a sawtooth glottal source with a small pitch contour, shaped by two
 * band-pass formant filters that glide between randomly chosen vowels, plus an optional consonant puff.
 * Callers trigger one syllable per ~55–110 ms to make a character babble.
 */

/** First and second formant (Hz) of an average adult voice. */
type Vowel = readonly [f1: number, f2: number];
/** a, e, i, o, u */
const VOWELS: readonly Vowel[] = [[730, 1100], [520, 1800], [300, 2250], [520, 880], [330, 820]];
/** Formant index, band-pass Q, level. */
const BANDS: readonly (readonly [0 | 1, number, number])[] = [[0, 6, 1], [1, 11, 0.75]];
/** Fundamental at pitch 1; callers use ~0.75 (gruff) … 1.3 (female). */
const BASE_F0 = 150;
const LEVEL = 0.56;
/** Gain into the radio's clipper (sets how dirty it sounds) and the level after it. */
const RADIO_DRIVE = 2.5;
const RADIO_LEVEL = 0.16;

const pickVowel = (): Vowel => VOWELS[Math.floor(Math.random() * VOWELS.length)] ?? [600, 1200];

/** Soft attack, slight sag, soft release across the syllable. */
function envelope(ctx: AudioContext, dest: AudioNode, t: number, dur: number, peak: number): GainNode {
  const g = gainNode(ctx, 0);
  const attack = Math.min(0.018, dur * 0.25);
  const release = Math.min(0.035, dur * 0.35);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(peak * 0.8, t + dur - release);
  g.gain.linearRampToValueAtTime(0, t + dur);
  g.connect(dest);
  return g;
}

/** Parallel formant resonators gliding from vowel `a` to `b`; returns their shared input. */
function formants(ctx: AudioContext, dest: AudioNode, a: Vowel, b: Vowel, t: number, end: number, scale: number): GainNode {
  const input = gainNode(ctx, 1);
  for (const [k, q, level] of BANDS) {
    const f = filterNode(ctx, 'bandpass', a[k] * scale, q);
    f.frequency.setValueAtTime(a[k] * scale, t);
    f.frequency.linearRampToValueAtTime(b[k] * scale, end);
    input.connect(f).connect(gainNode(ctx, level)).connect(dest);
  }
  return input;
}

/** Sawtooth "vocal folds" with a rise-and-fall pitch contour that differs every syllable. */
function glottis(ctx: AudioContext, dest: AudioNode, t: number, end: number, f0: number): void {
  const o = oscNode(ctx, 'sawtooth', f0);
  const peakAt = t + (end - t) * rand(0.25, 0.6);
  o.frequency.setValueAtTime(f0 * rand(0.92, 1.04), t);
  o.frequency.linearRampToValueAtTime(f0 * rand(1, 1.1), peakAt);
  o.frequency.linearRampToValueAtTime(f0 * rand(0.86, 1), end);
  o.connect(dest);
  o.start(t);
  o.stop(end + 0.02);
}

/** Breathiness through the formants, and sometimes a short fricative/plosive puff at the onset. */
function breath(ctx: AudioContext, noise: AudioBuffer, formantIn: AudioNode, dest: AudioNode, t: number, end: number): void {
  const src = noiseNode(ctx, noise, 1);
  src.connect(gainNode(ctx, 0.05)).connect(formantIn);
  if (Math.random() < 0.45) {
    const puff = gainNode(ctx, 0);
    const len = rand(0.012, 0.03);
    puff.gain.setValueAtTime(0, t);
    puff.gain.linearRampToValueAtTime(0.07, t + 0.003);
    puff.gain.linearRampToValueAtTime(0, t + len);
    src.connect(filterNode(ctx, 'highpass', rand(1800, 5000), 0.8)).connect(puff).connect(dest);
  }
  src.start(t, Math.random() * 0.9);
  src.stop(end + 0.02);
}

/** Faint band-passed hiss with a few random pops under a radio syllable. */
function crackle(ctx: AudioContext, noise: AudioBuffer, out: AudioNode, t: number, end: number): void {
  const src = noiseNode(ctx, noise, rand(0.8, 1.2));
  const g = gainNode(ctx, 0);
  src.connect(filterNode(ctx, 'bandpass', 2200, 0.7)).connect(g).connect(out);
  const floor = 0.01;
  g.gain.setValueAtTime(floor, t);
  const pops = [rand(t, end), rand(t, end), rand(t, end)].sort((x, y) => x - y);
  for (const at of pops) {
    g.gain.setValueAtTime(rand(0.04, 0.09), at);
    g.gain.setValueAtTime(floor, at + rand(0.002, 0.005));
  }
  g.gain.setValueAtTime(floor, end);
  g.gain.linearRampToValueAtTime(0, end + 0.02);
  src.start(t, Math.random() * 0.9);
  src.stop(end + 0.03);
}

/** Aircraft-radio colouring: 300–3000 Hz band and light clipping; returns the node to feed. */
function radioBand(ctx: AudioContext, noise: AudioBuffer, out: AudioNode, t: number, end: number): AudioNode {
  const input = gainNode(ctx, RADIO_DRIVE);
  const level = gainNode(ctx, RADIO_LEVEL);
  level.connect(out);
  const lowpass = filterNode(ctx, 'lowpass', 3000, 0.7);
  lowpass.connect(filterNode(ctx, 'lowpass', 3000, 0.7)).connect(level);
  input
    .connect(filterNode(ctx, 'highpass', 300, 0.7))
    .connect(filterNode(ctx, 'highpass', 300, 0.7))
    .connect(shaperNode(ctx, 2.5, lowpass));
  crackle(ctx, noise, out, t, end);
  return input;
}

/** Schedules one babble syllable (60–140 ms) into `out` at `t`; returns when it has finished sounding. */
export function syllable(
  ctx: AudioContext, noise: AudioBuffer, out: AudioNode, t: number, pitch: number, radio: boolean,
): number {
  const p = clamp(pitch, 0.4, 2.5);
  const dur = rand(0.06, 0.14);
  const end = t + dur;
  const dest = radio ? radioBand(ctx, noise, out, t, end) : out;
  const amp = envelope(ctx, dest, t, dur, LEVEL / Math.min(1, p)); // low voices have weaker formant harmonics
  const from = pickVowel();
  const to = Math.random() < 0.4 ? pickVowel() : from; // sometimes a diphthong
  const formantIn = formants(ctx, amp, from, to, t, end, p ** 0.5);
  glottis(ctx, formantIn, t, end, BASE_F0 * p);
  breath(ctx, noise, formantIn, dest, t, end);
  return end + 0.03;
}
