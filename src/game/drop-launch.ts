import type { TakeoffRating } from '../data/types';

// The mech's drop (doc 84): the dropship opens its bay over the jungle, the mech falls, and the pilot fires the retro
// rockets (hold) to land softly in the clearing; the speed at touchdown rates the drop like the carrier catapult
// (doc 04). Pure state machine; altitude in metres above the clearing, speed positive down.

export type DropPhase = 'bay' | 'fall' | 'landed' | 'done';
export type DropGrade = 'perfect' | 'good' | 'early' | 'late';

export interface DropInput {
  /** Holding the retro rockets. */
  burn: boolean;
  skip: boolean;
}

export interface DropState {
  phase: DropPhase;
  t: number;
  alt: number;
  /** Fall speed, m/s. */
  v: number;
  /** Retro fuel left, s. */
  fuel: number;
  burning: boolean;
  grade: DropGrade | null;
  /** Touchdown speed. */
  impact: number;
  rating: TakeoffRating | null;
}

export const DROP = Object.freeze({
  bay: 1.6,
  start: 120,
  gravity: 9,
  /** The retros' push, against gravity. */
  retro: 22,
  terminal: 25,
  /** Held retros bring the fall down to this and hold it there: the soft descent. */
  soft: 2,
  fuel: 5,
  perfect: 3,
  good: 8,
  landed: 1.4,
});

export const createDrop = (): DropState =>
  ({ phase: 'bay', t: 0, alt: DROP.start, v: 0, fuel: DROP.fuel, burning: false, grade: null, impact: 0, rating: null });

/** The grade for a touchdown at `speed`: soft is perfect or good; hard is early when the fuel ran out above the ground
 *  (the retros were fired too soon), late when there was fuel left (fired too late). */
export function gradeDrop(speed: number, fuelLeft: number): DropGrade {
  if (speed <= DROP.perfect) return 'perfect';
  if (speed <= DROP.good) return 'good';
  return fuelLeft <= 0 ? 'early' : 'late';
}

/** One tick of the fall: gravity pulls; the retros, while held and fuelled, brake it down to the soft descent and hold
 *  it there. */
function fall(s: DropState, burn: boolean, dt: number): Pick<DropState, 'alt' | 'v' | 'fuel' | 'burning'> {
  const burning = burn && s.fuel > 0;
  const free = Math.min(DROP.terminal, s.v + DROP.gravity * dt);
  const v = burning ? Math.max(Math.min(s.v, DROP.soft), s.v + (DROP.gravity - DROP.retro) * dt) : free;
  return { alt: Math.max(0, s.alt - v * dt), v, fuel: Math.max(0, s.fuel - (burning ? dt : 0)), burning };
}

export function stepDrop(s: DropState, i: DropInput, dt: number): DropState {
  const n: DropState = { ...s, t: s.t + dt };
  if (i.skip && s.phase !== 'landed' && s.phase !== 'done') return { ...n, phase: 'done', rating: 'skipped' };
  switch (s.phase) {
    case 'bay':
      return n.t >= DROP.bay ? { ...n, phase: 'fall', t: 0 } : n;
    case 'fall': {
      const moved = { ...n, ...fall(s, i.burn, dt) };
      if (moved.alt > 0) return moved;
      const grade = gradeDrop(moved.v, moved.fuel);
      return { ...moved, phase: 'landed', t: 0, grade, impact: moved.v, v: 0, burning: false, rating: grade };
    }
    case 'landed':
      return n.t >= DROP.landed ? { ...n, phase: 'done' } : n;
    case 'done':
      return n;
    default:
      throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}
