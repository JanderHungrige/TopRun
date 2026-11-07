import type { TakeoffRating } from '../data/types';

// The helicopters' deck liftoff (doc 53): the rotor spools up, the collective lifts the helicopter off the deck while
// gusts pitch its nose and the stick holds it level, and at hover height E noses over and goes. Rated like the
// carrier catapult (doc 04). Pure state machine; angles in radians (+ = nose up), heights in metres.

export type LiftoffPhase = 'spool' | 'lift' | 'hover' | 'away' | 'done';

export interface LiftoffInput {
  /** Collective: SPACE / J / ↑ / gamepad A / touch hold. */
  collective: boolean;
  /** Cyclic: ← nose up (−1) … → nose down (+1). */
  stick: number;
  /** E / gamepad Y / GO button — a fresh press this tick. */
  action: boolean;
  skip: boolean;
}

export interface LiftoffState {
  phase: LiftoffPhase;
  /** Seconds in the current phase. */
  t: number;
  clock: number;
  rpm: number;
  alt: number;
  pitch: number;
  pitchVel: number;
  /** Worst pitch since the wheels left the deck. */
  maxPitch: number;
  /** Seconds from leaving the deck to hover height. */
  climbTime: number;
  rating: TakeoffRating | null;
  /** E was pressed before hover height (counts as early). */
  early: boolean;
}

export const LIFTOFF = Object.freeze({
  spool: 2.2,
  hover: 12,
  climb: 3.4,
  sink: 2.2,
  /** Gust torque at full height, rad/s²; on the deck a third of it. */
  gust: 1.8,
  stick: 2.6,
  damping: 2.0,
  /** Seconds at hover height before it goes anyway (late). */
  wait: 4,
  /** Away: seconds of nose-down climb shown before the mission starts. */
  away: 1.3,
  perfectPitch: 0.15,
  goodPitch: 0.3,
  perfectReaction: 1.0,
  goodReaction: 2.5,
});

export const createLiftoff = (): LiftoffState =>
  ({ phase: 'spool', t: 0, clock: 0, rpm: 0, alt: 0, pitch: 0, pitchVel: 0, maxPitch: 0, climbTime: 0, rating: null, early: false });

/** The gust's torque at a moment: three slow sines, stronger off the deck. */
export function gust(clock: number, alt: number): number {
  const s = Math.sin(clock * 1.3) * 0.55 + Math.sin(clock * 2.9 + 1.7) * 0.3 + Math.sin(clock * 0.7 + 4) * 0.15;
  return s * LIFTOFF.gust * (1 / 3 + (2 / 3) * Math.min(1, alt / LIFTOFF.hover));
}

/** How the liftoff rates: level and quick is perfect; pressing E before hover height is early. */
export function rateLiftoff(maxPitch: number, reaction: number, early: boolean): TakeoffRating {
  if (early) return 'early';
  if (maxPitch <= LIFTOFF.perfectPitch && reaction <= LIFTOFF.perfectReaction) return 'perfect';
  if (maxPitch <= LIFTOFF.goodPitch && reaction <= LIFTOFF.goodReaction) return 'good';
  return 'late';
}

function attitude(s: LiftoffState, stick: number, dt: number): Pick<LiftoffState, 'pitch' | 'pitchVel'> {
  if (s.alt <= 0) return { pitch: 0, pitchVel: 0 };
  const acc = gust(s.clock, s.alt) - LIFTOFF.stick * Math.max(-1, Math.min(1, stick)) - LIFTOFF.damping * s.pitchVel;
  const pitchVel = s.pitchVel + acc * dt;
  return { pitchVel, pitch: Math.max(-0.7, Math.min(0.7, s.pitch + pitchVel * dt)) };
}

export function stepLiftoff(s: LiftoffState, i: LiftoffInput, dt: number): LiftoffState {
  const n: LiftoffState = { ...s, t: s.t + dt, clock: s.clock + dt };
  if (i.skip && s.phase !== 'away' && s.phase !== 'done') return { ...n, phase: 'done', rating: 'skipped' };
  switch (s.phase) {
    case 'spool': {
      const rpm = Math.min(1, s.rpm + dt / LIFTOFF.spool);
      return rpm >= 1 ? { ...n, rpm, phase: 'lift', t: 0 } : { ...n, rpm };
    }
    case 'lift': {
      const alt = Math.max(0, s.alt + (i.collective ? LIFTOFF.climb : -LIFTOFF.sink) * dt);
      const air = { ...n, alt, ...attitude({ ...s, alt }, i.stick, dt) };
      const flying = { ...air, maxPitch: alt > 0 ? Math.max(s.maxPitch, Math.abs(air.pitch)) : s.maxPitch, climbTime: s.climbTime + (alt > 0 ? dt : 0) };
      if (i.action && alt > 0) return { ...flying, phase: 'away', t: 0, early: true, rating: rateLiftoff(flying.maxPitch, 0, true) };
      return alt >= LIFTOFF.hover ? { ...flying, alt: LIFTOFF.hover, phase: 'hover', t: 0 } : flying;
    }
    case 'hover': {
      const air = { ...n, ...attitude(s, i.stick, dt) };
      const held = { ...air, maxPitch: Math.max(s.maxPitch, Math.abs(air.pitch)) };
      if (i.action || held.t >= LIFTOFF.wait) return { ...held, phase: 'away', t: 0, rating: rateLiftoff(held.maxPitch, held.t, false) };
      return held;
    }
    case 'away':
      return n.t >= LIFTOFF.away ? { ...n, phase: 'done' } : { ...n, alt: s.alt + 9 * dt, pitch: Math.max(-0.3, s.pitch - dt * 0.6) };
    case 'done':
      return n;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
