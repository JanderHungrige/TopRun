import { filterNode, gainNode, noiseNode, oscNode, SILENT } from './audio-nodes';
import type { Wave } from './audio-nodes';
import { syllable } from './sfx-voice';

/** Sounds built from the layer table below. */
type LayerSfx =
  | 'gun' | 'missile' | 'rocket' | 'bombDrop' | 'explosionSmall' | 'explosionLarge' | 'explosionHuge'
  | 'hit' | 'playerHit' | 'pickup' | 'cash' | 'powerup' | 'flare' | 'catapult' | 'warning'
  | 'uiMove' | 'uiSelect' | 'uiBack' | 'buy' | 'denied' | 'enemyShot' | 'enemyMissile' | 'special' | 'splash'
  | 'radioClick' | 'cannon' | 'stealth' | 'nukeLaunch' | 'nuke' | 'chalk' | 'wipe' | 'clap';
/** Procedural babble syllables (see sfx-voice.ts). */
type VoiceSfx = 'voice' | 'radioVoice';
export type SfxName = LayerSfx | VoiceSfx;

export interface SfxOptions { volume?: number; pan?: number /* -1..1 */; pitch?: number /* rate multiplier */ }

interface Timing { at?: number; a?: number; h?: number; q?: number /* filter Q, noise only */; sw?: number }
/**
 * Attack `a`, hold `h`, exponential decay `d`, starting `at` s after trigger; `f` sweeps f[0]→f[1] Hz over
 * `sw` s (default: the whole layer), then stays at f[1].
 */
interface Env extends Timing { f: [number, number]; d: number; v: number }
interface Tone extends Env { w: Wave }
interface Hiss extends Env { n: BiquadFilterType }
type Layer = Tone | Hiss;

/** Oscillator layer: wave, Hz from → to, decay s, volume, optional timing. */
const tone = (w: Wave, f0: number, f1: number, d: number, v: number, x: Timing = {}): Tone =>
  ({ w, f: [f0, f1], d, v, ...x });
/** Filtered-noise layer: filter type, cutoff Hz from → to, decay s, volume, optional timing / Q. */
const hiss = (n: BiquadFilterType, f0: number, f1: number, d: number, v: number, x: Timing = {}): Hiss =>
  ({ n, f: [f0, f1], d, v, ...x });
/** Bass punch (doc 01 Audio): a sine whose pitch drops f0 → f1 within `sw` s, then decays over `d`. */
const thump = (f0: number, f1: number, sw: number, d: number, v: number, x: Timing = {}): Tone =>
  tone('sine', f0, f1, d, v, { ...x, sw });
const arp = (w: Wave, notes: number[], step: number, v: number, d = 0.07): Tone[] =>
  notes.map((f, i) => tone(w, f, f, i === notes.length - 1 ? d * 2.5 : d, v, { at: i * step }));
const alarm = (): Tone[] => Array.from({ length: 8 }, (_, i) =>
  tone('square', i % 2 ? 660 : 880, i % 2 ? 640 : 860, 0.04, 0.11, { at: i * 0.17, a: 0.01, h: 0.12 }));

const SFX: Record<LayerSfx, Layer[]> = {
  gun: [tone('square', 1400, 420, 0.05, 0.2), hiss('highpass', 3200, 1500, 0.04, 0.28), thump(240, 70, 0.03, 0.06, 0.26)],
  missile: [
    hiss('bandpass', 500, 3200, 0.55, 0.55, { q: 2, a: 0.04 }), tone('sawtooth', 180, 520, 0.4, 0.07, { a: 0.02 }),
    thump(150, 55, 0.1, 0.3, 0.26, { a: 0.004 }), hiss('lowpass', 500, 140, 0.4, 0.16, { a: 0.02 }),
  ],
  rocket: [
    hiss('bandpass', 900, 2600, 0.28, 0.4, { q: 1.5, a: 0.01 }), tone('square', 300, 120, 0.06, 0.1),
    thump(170, 65, 0.04, 0.07, 0.22),
  ],
  bombDrop: [
    tone('square', 220, 90, 0.05, 0.1), tone('sine', 1500, 600, 0.4, 0.1, { a: 0.05, h: 0.3 }), thump(160, 70, 0.03, 0.06, 0.2),
  ],
  explosionSmall: [
    hiss('lowpass', 3000, 300, 0.3, 0.6), tone('triangle', 180, 55, 0.22, 0.4, { sw: 0.08 }), thump(120, 52, 0.07, 0.26, 0.42),
  ],
  explosionLarge: [
    hiss('lowpass', 2500, 150, 0.7, 0.8, { h: 0.05 }), thump(150, 45, 0.1, 0.55, 0.7),
    tone('triangle', 100, 48, 0.4, 0.22, { sw: 0.12 }), hiss('lowpass', 300, 80, 0.9, 0.3, { a: 0.01, h: 0.05 }),
    hiss('bandpass', 1800, 600, 0.35, 0.3, { q: 0.8, at: 0.06 }),
  ],
  explosionHuge: [
    hiss('lowpass', 2000, 80, 1.6, 1, { a: 0.01, h: 0.2 }), thump(130, 36, 0.18, 1.2, 0.9, { h: 0.1 }),
    tone('sawtooth', 70, 32, 0.9, 0.12), hiss('bandpass', 1500, 400, 0.8, 0.35, { q: 0.7, at: 0.15 }),
    hiss('lowpass', 1200, 100, 0.9, 0.45, { at: 0.35 }), thump(110, 40, 0.12, 0.7, 0.4, { at: 0.35 }),
  ],
  hit: [tone('square', 1100, 600, 0.035, 0.12), hiss('highpass', 4000, 2500, 0.03, 0.16), thump(200, 80, 0.02, 0.035, 0.16)],
  playerHit: [
    tone('sawtooth', 240, 60, 0.28, 0.32), hiss('lowpass', 3000, 300, 0.3, 0.6), tone('square', 90, 45, 0.2, 0.18),
    thump(150, 50, 0.06, 0.22, 0.45),
  ],
  pickup: arp('square', [784, 1047, 1568], 0.05, 0.12),
  cash: [...arp('square', [1319, 1760, 2637], 0.045, 0.1), tone('triangle', 2637, 2637, 0.3, 0.12, { at: 0.09 })],
  powerup: [...arp('square', [523, 659, 784, 1047, 1319], 0.06, 0.11), tone('sawtooth', 200, 1600, 0.35, 0.05)],
  flare: [tone('sine', 700, 180, 0.12, 0.25), hiss('highpass', 2500, 7000, 0.4, 0.3, { a: 0.01, h: 0.05 })],
  // thunk, steam hiss through the 1.4 s stroke, shuttle clank at the end
  catapult: [
    thump(130, 42, 0.08, 0.4, 0.9), hiss('lowpass', 900, 120, 0.25, 0.7),
    hiss('highpass', 1200, 2600, 0.8, 0.45, { a: 0.06, h: 0.7 }),
    hiss('bandpass', 3500, 5000, 0.7, 0.25, { q: 0.6, a: 0.04, h: 0.5 }),
    tone('square', 260, 90, 0.12, 0.14, { at: 1.35 }), hiss('lowpass', 1500, 200, 0.3, 0.5, { at: 1.35 }),
    thump(140, 55, 0.04, 0.12, 0.4, { at: 1.35 }),
  ],
  warning: alarm(),
  uiMove: [tone('square', 660, 700, 0.035, 0.07)],
  uiSelect: arp('square', [880, 1320], 0.05, 0.09),
  uiBack: arp('square', [660, 440], 0.05, 0.09),
  buy: [...arp('triangle', [659, 988, 1319], 0.06, 0.2, 0.09), hiss('highpass', 6000, 6000, 0.25, 0.1, { at: 0.12 })],
  denied: [0, 0.14].flatMap((at) => [
    tone('square', 120, 110, 0.03, 0.11, { at, h: 0.08 }), tone('sawtooth', 123, 113, 0.03, 0.09, { at, h: 0.08 }),
  ]),
  enemyShot: [tone('square', 760, 380, 0.07, 0.08), hiss('bandpass', 2000, 1000, 0.05, 0.1)],
  enemyMissile: [
    hiss('bandpass', 300, 1800, 0.5, 0.4, { q: 2, a: 0.04 }), tone('sawtooth', 120, 300, 0.35, 0.06),
    thump(120, 55, 0.08, 0.2, 0.09),
  ],
  special: [
    tone('sawtooth', 110, 1760, 0.45, 0.1, { a: 0.05, h: 0.15 }), tone('square', 55, 880, 0.45, 0.06, { a: 0.05 }),
    hiss('bandpass', 400, 6000, 0.5, 0.35, { a: 0.25 }), thump(140, 45, 0.08, 0.4, 0.6, { at: 0.4 }),
  ],
  splash: [
    hiss('lowpass', 5000, 200, 0.6, 0.7, { a: 0.005, h: 0.05 }), thump(220, 60, 0.06, 0.25, 0.4),
    hiss('bandpass', 2500, 900, 0.45, 0.2, { q: 1.2, at: 0.08 }),
  ],
  // A-10 GAU-8 "BRRRT" (doc 36): 3 s of a ~65 Hz tearing buzz (3,900 rounds/min) — two detuned saws for the grit, a
  // sub-octave square and band noise for the blast — then the rolling echo of the rounds arriving.
  cannon: [
    tone('sawtooth', 70, 64, 0.12, 0.24, { a: 0.03, h: 2.85 }), tone('sawtooth', 67, 61, 0.12, 0.14, { a: 0.03, h: 2.85 }),
    tone('square', 33, 31, 0.12, 0.12, { a: 0.03, h: 2.85 }), hiss('bandpass', 1100, 800, 0.15, 0.4, { q: 1.4, a: 0.02, h: 2.85 }),
    hiss('lowpass', 500, 160, 1.4, 0.45, { at: 2.9, a: 0.1 }), thump(90, 40, 0.2, 1.0, 0.35, { at: 3.0 }),
  ],
  // F-35 stealth: a falling shimmer as the jet fades out
  stealth: [
    hiss('bandpass', 5000, 600, 0.8, 0.35, { q: 3, a: 0.05 }), tone('sine', 1800, 300, 0.7, 0.08, { a: 0.02 }),
    tone('triangle', 900, 150, 0.6, 0.06, { a: 0.02 }),
  ],
  // Tornado nuke: a heavy launch, then the deepest blast in the game with a long rumble
  nukeLaunch: [
    hiss('bandpass', 300, 2400, 1.0, 0.6, { q: 1.5, a: 0.05 }), tone('sawtooth', 90, 300, 0.9, 0.08, { a: 0.03 }),
    thump(120, 40, 0.15, 0.5, 0.5),
  ],
  nuke: [
    hiss('lowpass', 3000, 60, 3.2, 1, { a: 0.01, h: 0.4 }), thump(100, 25, 0.5, 2.6, 1, { h: 0.2 }),
    tone('sawtooth', 50, 22, 2.4, 0.14, { h: 0.3 }), hiss('bandpass', 1400, 200, 1.6, 0.4, { q: 0.6, at: 0.3 }),
    thump(70, 28, 0.3, 1.8, 0.6, { at: 0.6 }), hiss('lowpass', 600, 60, 2.4, 0.5, { at: 1.0 }),
  ],
  // chalkboard (doc 40): a dry scratch of chalk on slate, the soft swish of a sponge
  chalk: [hiss('bandpass', 3400, 2400, 0.05, 0.12, { q: 2.2, a: 0.004 }), hiss('highpass', 6000, 5000, 0.03, 0.05, { at: 0.02 })],
  wipe: [hiss('lowpass', 1500, 500, 0.14, 0.16, { a: 0.03 }), hiss('bandpass', 900, 700, 0.1, 0.06, { q: 0.8, at: 0.04 })],
  // Two palms meeting (doc 42): a short bright slap.
  clap: [hiss('bandpass', 1900, 1100, 0.07, 0.42, { q: 1.3, a: 0.002 }), hiss('highpass', 5200, 3600, 0.035, 0.18)],
  // push-to-talk squelch: key click, ~120 ms band-limited noise burst that cuts off sharply, release tick
  radioClick: [
    tone('square', 2400, 1500, 0.006, 0.12, { a: 0.001 }),
    hiss('bandpass', 2600, 1900, 0.018, 0.2, { q: 0.9, a: 0.003, h: 0.1 }),
    tone('square', 1300, 1000, 0.005, 0.07, { at: 0.118, a: 0.001 }),
  ],
};

/** Rapid-fire sounds: rate-limited, pitch-jittered, and dropped (instead of voice-stealing) at the cap. */
export const SPAM: Partial<Record<SfxName, number>> = {
  gun: 0.045, hit: 0.03, enemyShot: 0.06, explosionSmall: 0.04, rocket: 0.05, enemyMissile: 0.09,
};
/** Minimum seconds between two triggers of the same sound. */
export const GAP: Partial<Record<SfxName, number>> = {
  missile: 0.06, explosionLarge: 0.06, explosionHuge: 0.15, pickup: 0.04, cash: 0.04, uiMove: 0.03,
  flare: 0.08, splash: 0.08, bombDrop: 0.08, warning: 1.4, playerHit: 0.08,
  voice: 0.055, radioVoice: 0.055, radioClick: 0.05, chalk: 0.06, wipe: 0.1, clap: 0.05,
};

/** Impacts and launches: played into the low-shelf impact bus (doc 01 Audio). UI sounds never are. */
export const HEAVY: ReadonlySet<SfxName> = new Set<SfxName>([
  'gun', 'missile', 'rocket', 'bombDrop', 'explosionSmall', 'explosionLarge', 'explosionHuge',
  'hit', 'playerHit', 'catapult', 'special', 'splash', 'enemyMissile', 'cannon', 'nukeLaunch', 'nuke',
]);

const layersOf = (name: SfxName): readonly Layer[] => (name === 'voice' || name === 'radioVoice' ? [] : SFX[name]);

/** Number of bass-thump layers (swept sines) in a sound. */
export const thumpCount = (name: SfxName): number =>
  layersOf(name).filter((l) => 'w' in l && l.w === 'sine' && l.sw !== undefined).length;

/** Lowest frequency a sound reaches: a tone's lower sweep end, a filter's lower cutoff (low-pass noise = 0). */
export function lowestHz(name: SfxName): number {
  const lows = layersOf(name).map((l) => ('n' in l && l.n === 'lowpass' ? 0 : Math.min(l.f[0], l.f[1])));
  return Math.min(Infinity, ...lows);
}

/** Where and when one SFX instance renders: its private output gain, start time and pitch multiplier. */
export interface SfxTarget { ctx: AudioContext; noise: AudioBuffer; out: AudioNode; now: number; pitch: number }

const layerEnd = (l: Layer): number => (l.at ?? 0) + (l.a ?? 0.003) + (l.h ?? 0) + l.d;

function renderLayer(t: SfxTarget, l: Layer): void {
  const { ctx, pitch } = t;
  const s = t.now + (l.at ?? 0);
  const a = l.a ?? 0.003;
  const end = s + a + (l.h ?? 0) + l.d;
  const g = gainNode(ctx, SILENT);
  g.gain.setValueAtTime(SILENT, s);
  g.gain.linearRampToValueAtTime(l.v, s + a);
  g.gain.setValueAtTime(l.v, end - l.d);
  g.gain.exponentialRampToValueAtTime(SILENT, end);
  g.connect(t.out);
  let src: AudioScheduledSourceNode;
  let freq: AudioParam;
  if ('w' in l) {
    const o = oscNode(ctx, l.w, l.f[0]);
    [src, freq] = [o, o.frequency];
    o.connect(g);
    o.start(s);
  } else {
    const f = filterNode(ctx, l.n, l.f[0], l.q ?? 1);
    const b = noiseNode(ctx, t.noise, pitch);
    [src, freq] = [b, f.frequency];
    b.connect(f).connect(g);
    b.start(s, Math.random() * 0.9); // random offset decorrelates overlapping noise layers
  }
  freq.setValueAtTime(l.f[0] * pitch, s);
  freq.exponentialRampToValueAtTime(l.f[1] * pitch, l.sw === undefined ? end : Math.min(end, s + l.sw));
  src.stop(end + 0.02);
}

/** Schedules one instance of `name` into `t.out`; returns the time it has finished sounding. */
export function renderSfx(name: SfxName, t: SfxTarget): number {
  if (name === 'voice' || name === 'radioVoice') {
    return syllable(t.ctx, t.noise, t.out, t.now, t.pitch, name === 'radioVoice');
  }
  const layers = SFX[name];
  for (const l of layers) renderLayer(t, l);
  return t.now + Math.max(...layers.map(layerEnd));
}
