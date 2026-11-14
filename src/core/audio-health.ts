// Audio health and load (doc 01, bug B1): older iPads could not render the full sound graph when a lot was happening —
// the sound stuttered, then Safari stopped the context for good. Each frame the engine compares the audio clock with
// the wall clock; when the audio falls behind real time it sheds load (the `lite` tier), when its clock stands still or
// the context closes it asks for a rebuild, a suspended or interrupted context it asks to resume. Pure.

/** How much the sound may cost: desktop, touch device (from the start), or the session's load-shedding mode. */
export type AudioTier = 'full' | 'touch' | 'lite';
export type AudioAction = 'none' | 'resume' | 'rebuild';

export interface AudioBudget {
  /** Effect voices sounding at once. */
  voices: number;
  /** Oversampling of the radio voice's clipper and of the master's safety ceiling. */
  radio: OverSampleType;
  ceiling: OverSampleType;
  /** Music reverb length (s); 0 = no reverb. */
  reverb: number;
  /** Layers an effect plays at most (its loudest). */
  layers: number;
}

const BUDGETS: Readonly<Record<AudioTier, AudioBudget>> = {
  full: { voices: 24, radio: '4x', ceiling: '2x', reverb: 2.2, layers: 8 },
  touch: { voices: 16, radio: '2x', ceiling: '2x', reverb: 1.2, layers: 8 },
  lite: { voices: 8, radio: 'none', ceiling: 'none', reverb: 0, layers: 2 },
};

export const budget = (tier: AudioTier): AudioBudget => BUDGETS[tier];

/** Tablets and phones start a step lighter; anything else gets the full graph. */
export const initialTier = (maxTouchPoints: number): AudioTier => (maxTouchPoints > 1 ? 'touch' : 'full');

/** The watch: its tier, the start of the current window on both clocks, and how long it has looked strained / stalled. */
export interface AudioHealth {
  tier: AudioTier;
  wall: number;
  audio: number;
  strained: number;
  stalled: number;
  /** Wall time of the last resume request (they are spaced a second apart). */
  kick: number;
}

/** One frame's view: wall clock and audio clock (s), the context's state, whether the page is visible. */
export interface HealthInput { wall: number; audio: number; state: string; visible: boolean }

export const HEALTH = Object.freeze({
  /** A window of wall time over which the two clocks are compared (s). */
  window: 0.5,
  /** Audio advancing slower than this share of real time is the render thread falling behind. */
  strain: 0.92,
  /** …and slower than this, standing still. */
  stall: 0.05,
  /** Strained this long in all → lite; stalled this long → rebuild (s). */
  toLite: 1,
  toRebuild: 1.5,
  /** Seconds between two resume requests. */
  kickEvery: 1,
});

export const freshHealth = (tier: AudioTier, wall: number, audio: number): AudioHealth =>
  ({ tier, wall, audio, strained: 0, stalled: 0, kick: -Infinity });

const restart = (h: AudioHealth, i: HealthInput): AudioHealth => ({ ...h, wall: i.wall, audio: i.audio, stalled: 0 });

/** Advances the watch by one frame: the new watch and what the engine should do. */
export function stepHealth(h: AudioHealth, i: HealthInput): { health: AudioHealth; action: AudioAction } {
  if (!i.visible) return { health: { ...restart(h, i), strained: 0 }, action: 'none' };
  if (i.state === 'closed') return { health: restart(h, i), action: 'rebuild' };
  if (i.state !== 'running') {
    const due = i.wall - h.kick >= HEALTH.kickEvery;
    return { health: { ...restart(h, i), kick: due ? i.wall : h.kick }, action: due ? 'resume' : 'none' };
  }
  const span = i.wall - h.wall;
  if (span < HEALTH.window) return { health: h, action: 'none' };
  const rate = (i.audio - h.audio) / span;
  const strained = rate < HEALTH.strain ? h.strained + span : Math.max(0, h.strained - span * 0.5);
  const stalled = rate < HEALTH.stall ? h.stalled + span : 0;
  const tier: AudioTier = h.tier === 'lite' || strained >= HEALTH.toLite ? 'lite' : h.tier;
  const next = { ...h, tier, wall: i.wall, audio: i.audio, strained, stalled };
  if (stalled >= HEALTH.toRebuild) return { health: { ...next, stalled: 0 }, action: 'rebuild' };
  return { health: next, action: 'none' };
}
