import { createRng } from '../../src/core/rng';
import {
  createRefuel, holdOf, offsetOf, REFUEL_RULES as R, stepRefuel, type RefuelInput, type RefuelState,
} from '../../src/game/minigames/refuel';

// Simulated keyboard pilots for the Air Refuelling medal tuning (doc 15). Digital keys only: each axis is
// −1 / 0 / +1 and the throttle is either held or not, decided every `every` seconds on a picture that is
// `delay` seconds old and misjudged by a slowly drifting error of up to ±`noise` m.

export interface PilotSkill {
  /** Perception delay (s). */
  delay: number;
  /** Seconds between two decisions (keys are held in between). */
  every: number;
  /** Judgement error amplitude (m). */
  noise: number;
  /** Closure the pilot aims for on the way in (m/s). */
  approach: number;
  /** How hard the pilot steers at an error (1/s): slower pilots learn to be gentler. */
  gain: number;
}

export const ACE: PilotSkill = { delay: 0.12, every: 0.08, noise: 0.05, approach: 1.0, gain: 2.4 };
export const GOOD: PilotSkill = { delay: 0.2, every: 0.12, noise: 0.1, approach: 1.2, gain: 2 };
export const AVERAGE: PilotSkill = { delay: 0.25, every: 0.14, noise: 0.13, approach: 1.3, gain: 1.7 };
export const ROOKIE: PilotSkill = { delay: 0.3, every: 0.16, noise: 0.16, approach: 1.5, gain: 1.4 };
export const NOVICE: PilotSkill = { delay: 0.4, every: 0.2, noise: 0.22, approach: 1.6, gain: 1 };

const DT = 1 / 60;
/** Push depth the pilot tries to hold while plugged (m). */
const HOLD_PUSH = 2;

const key = (want: number, have: number, dead: number): number => (want > have + dead ? 1 : want < have - dead ? -1 : 0);

/** One decision from an (old) picture of the state plus the pilot's current misjudgement. */
function decide(seen: RefuelState, prevSeen: RefuelState, err: { x: number; y: number }, skill: PilotSkill): RefuelInput {
  const plugged = seen.phase === 'contact';
  const off = plugged ? { x: -holdOf(seen).x, y: -holdOf(seen).y } : offsetOf(seen);
  const prevOff = prevSeen.phase === 'contact' ? { x: -holdOf(prevSeen).x, y: -holdOf(prevSeen).y } : offsetOf(prevSeen);
  const ex = off.x + err.x;
  const ey = off.y + err.y;
  // desired jet velocity: close the error, plus the target's own drift (offset rate + own velocity)
  const tx = skill.gain * ex + (off.x - prevOff.x) / DT + seen.jet.vx;
  const ty = skill.gain * ey + (off.y - prevOff.y) / DT + seen.jet.vy;
  const x = key(tx, seen.jet.vx, 0.25);
  const y = key(ty, seen.jet.vy, 0.25);
  let closure: number;
  if (plugged) closure = Math.max(-0.6, Math.min(0.6, 0.8 * (HOLD_PUSH - seen.push)));
  else if (seen.phase === 'backoff') closure = 0;
  else if (seen.gap < 2.5 && Math.hypot(ex, ey) > 0.2) closure = 0.15;
  else closure = skill.approach;
  return { x, y, throttle: seen.closure < closure ? 1 : 0 };
}

/** Flies one 60 s round in the seeded turbulence and returns the final state. */
export function flyRound(skill: PilotSkill, seed: number, turbulence = 1, observe?: (s: RefuelState) => void): RefuelState {
  const rng = createRng(seed * 7919 + 13);
  const lag = Math.max(1, Math.round(skill.delay / DT));
  const every = Math.max(1, Math.round(skill.every / DT));
  const history: RefuelState[] = [];
  let s = createRefuel(seed, turbulence);
  let input: RefuelInput = { x: 0, y: 0, throttle: 0 };
  let err = { x: 0, y: 0 };
  let errTarget = { x: 0, y: 0 };
  for (let i = 0; s.phase !== 'over' && i < 60 * 70; i++) {
    history.push(s);
    if (i % 30 === 0) errTarget = { x: rng.range(-1, 1) * skill.noise, y: rng.range(-1, 1) * skill.noise };
    err = { x: err.x + (errTarget.x - err.x) * 0.05, y: err.y + (errTarget.y - err.y) * 0.05 };
    if (i % every === 0) {
      const seen = history[Math.max(0, history.length - 1 - lag)] ?? s;
      const prevSeen = history[Math.max(0, history.length - 2 - lag)] ?? seen;
      input = decide(seen, prevSeen, err, skill);
    }
    s = stepRefuel(s, input, DT);
    observe?.(s);
  }
  return s;
}

/** Calm-air reference pilot: lines up exactly, closes at `closure` m/s, then holds `push` m. */
export function calmPilot(closure: number, push = HOLD_PUSH): RefuelState {
  let s = createRefuel(1, 0);
  for (let i = 0; s.phase !== 'over' && i < 60 * 70; i++) {
    const off = s.phase === 'contact' ? { x: -holdOf(s).x, y: -holdOf(s).y } : offsetOf(s);
    const want = s.phase === 'contact' ? 0.8 * (push - s.push) : s.phase === 'backoff' ? 0 : closure;
    const input = {
      x: Math.max(-1, Math.min(1, (2.5 * off.x) / R.steerSpeed)),
      y: Math.max(-1, Math.min(1, (2.5 * off.y) / R.steerSpeed)),
      throttle: Math.max(0, Math.min(1, (want - R.closeIdle) / (R.closeFull - R.closeIdle) + (want - s.closure) * 2)),
    };
    s = stepRefuel(s, input, DT);
  }
  return s;
}
