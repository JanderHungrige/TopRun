/**
 * Mix decisions for the audio graph (doc 01 Audio), kept pure so they can be unit-tested:
 * bus gains from the device settings, the impact-bus shelf, the master limiter and the safety ceiling.
 */

/** Music and sfx bus trims at full volume. */
export const MUSIC_TRIM = 0.42;
export const SFX_TRIM = 0.8;

/** Master compressor (DynamicsCompressorNode params). */
export const LIMITER = { threshold: -8, knee: 6, ratio: 12, attack: 0.003, release: 0.25 } as const;

/** Low shelf on the impact bus that heavy effects play into (Hz, dB). */
export const IMPACT_SHELF = { frequency: 160, gain: 4 } as const;

/** Safety ceiling after the compressor: identity up to ±KNEE, soft to ±1 for inputs up to ±RANGE. */
export const CEILING_KNEE = 0.8;
export const CEILING_RANGE = 2;

/** The parts of the device settings the mix depends on. */
export interface Levels { music: number; sfx: number; musicOn: boolean; sfxOn: boolean }
export interface BusGains { music: number; sfx: number }

const unit = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Bus gains for the current settings: a switched-off bus is 0, otherwise its volume × trim. */
export function busGains(l: Levels): BusGains {
  return {
    music: l.musicOn ? unit(l.music) * MUSIC_TRIM : 0,
    sfx: l.sfxOn ? unit(l.sfx) * SFX_TRIM : 0,
  };
}

/** Ceiling transfer: linear up to `knee`, then a tanh knee with slope 1 at the join that approaches ±1. */
export function ceiling(x: number, knee = CEILING_KNEE): number {
  const a = Math.abs(x);
  if (a <= knee) return x;
  return Math.sign(x) * (knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee)));
}

/**
 * Wave-shaper curve for the ceiling. The shaper only sees −1…1, so it is fed through a gain of
 * 1 / CEILING_RANGE and the curve spans inputs of ±CEILING_RANGE (odd `n` puts a point exactly on 0).
 */
export function ceilingCurve(n = 4097, knee = CEILING_KNEE): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) curve[i] = ceiling(CEILING_RANGE * ((i / (n - 1)) * 2 - 1), knee);
  return curve;
}
