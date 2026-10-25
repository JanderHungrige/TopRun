import { createRng } from '../../src/core/rng';
import { DECK } from '../../src/game/minigames/landing-deck';
import {
  aoaOf, createLanding, LANDING_RULES as R, stepLanding, type LandingInput, type LandingState,
} from '../../src/game/minigames/landing';

// Pilots for the Carrier Landing tests and medal tuning (doc 18): a calm-air reference autopilot that sees
// the true state, and simulated keyboard pilots that only see the ball, the line-up and the AoA indexer —
// on a picture `delay` s old, decided every `every` s, misjudged by a drifting error of ±`noise` balls.

const DT = 1 / 60;
const RAD = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Continuous autopilot input: tracks the glide path to the (calm) target, the centreline and on-speed. */
export function holdInput(s: LandingState, next = true): LandingInput {
  const j = s.jet;
  const range = Math.max(30, DECK.target - j.z);
  const err = j.y - range * Math.tan(R.glide * RAD);
  const want = -R.glide * RAD - Math.atan((0.5 * err) / (R.speed + j.dv));
  const y = clamp((3 * (want - j.gamma)) / (R.qMax * RAD), -1, 1);
  const x = clamp((DECK.drift - 0.5 * j.x) / R.latMax, -1, 1);
  const throttle = clamp(R.trim + (9.81 * (j.gamma + R.glide * RAD)) / R.thrust - 0.5 * j.dv, 0, 1);
  return { x, y, throttle, next };
}

/** Flies a calm round with the autopilot until `stop` (or the end). */
export function flyCalm(start: LandingState, stop: (s: LandingState) => boolean = () => false): LandingState {
  let s = start;
  for (let i = 0; s.phase !== 'over' && !stop(s) && i < 60 * 200; i++) s = stepLanding(s, holdInput(s), DT);
  return s;
}

export const calmPilot = (seed = 1): LandingState => flyCalm(createLanding(seed, 0));

export interface PilotSkill {
  /** Perception delay (s). */
  delay: number;
  /** Seconds between two decisions (keys are held in between). */
  every: number;
  /** Ball misjudgement amplitude (balls); line-up error is 4 m per ball. */
  noise: number;
  /** Ball rate the pilot asks for per ball of error (1/s). */
  gain: number;
  /** How far ahead the pilot anticipates the pitch inertia (s). */
  lead: number;
}

export const ACE: PilotSkill = { delay: 0.15, every: 0.08, noise: 0.15, gain: 0.9, lead: 0.4 };
export const GOOD: PilotSkill = { delay: 0.2, every: 0.1, noise: 0.25, gain: 0.8, lead: 0.35 };
export const AVERAGE: PilotSkill = { delay: 0.25, every: 0.13, noise: 0.35, gain: 0.7, lead: 0.3 };
export const ROOKIE: PilotSkill = { delay: 0.32, every: 0.16, noise: 0.5, gain: 0.6, lead: 0.2 };
export const NOVICE: PilotSkill = { delay: 0.42, every: 0.2, noise: 0.75, gain: 0.5, lead: 0.1 };

const key = (want: number, have: number, dead: number): number => (want > have + dead ? 1 : want < have - dead ? -1 : 0);

/** One keyboard decision from an (old) picture plus the pilot's misjudgement. */
function decide(seen: LandingState, prev: LandingState, err: { ball: number; x: number }, k: PilotSkill): LandingInput {
  const j = seen.jet;
  const range = Math.max(30, DECK.target - j.z);
  const ball = seen.ball + err.ball;
  const ballRate = (seen.ball - prev.ball) / DT;
  // the pitch rate keeps moving the ball: anticipate `lead` s of it
  const pred = ballRate + ((R.speed + j.dv) * j.q * k.lead) / (range * R.ball * RAD);
  const y = key(-k.gain * ball, pred, 0.12);
  const xRate = (j.x - prev.jet.x) / DT;
  const x = key(-0.45 * (j.x + err.x), xRate, 0.35);
  const aoa = aoaOf(j.dv);
  const power = aoa === 'slow' || aoa === 'slightlySlow' ? 1 : R.keyPower;
  return { x, y, throttle: power, next: seen.phase === 'graded' };
}

/** Flies one round of three passes and returns the final state. */
export function flyRound(skill: PilotSkill, seed: number, motion = 1, observe?: (s: LandingState) => void): LandingState {
  const rng = createRng(seed * 7919 + 17);
  const lag = Math.max(1, Math.round(skill.delay / DT));
  const every = Math.max(1, Math.round(skill.every / DT));
  const history: LandingState[] = [];
  let s = createLanding(seed, motion);
  let input: LandingInput = { x: 0, y: 0, throttle: R.keyPower, next: false };
  let err = { ball: 0, x: 0 };
  let target = { ball: 0, x: 0 };
  for (let i = 0; s.phase !== 'over' && i < 60 * 200; i++) {
    history.push(s);
    if (history.length > lag + 2) history.shift();
    if (i % 40 === 0) target = { ball: rng.range(-1, 1) * skill.noise, x: rng.range(-1, 1) * skill.noise * 4 };
    err = { ball: err.ball + (target.ball - err.ball) * 0.05, x: err.x + (target.x - err.x) * 0.05 };
    if (i % every === 0) {
      const seen = history[Math.max(0, history.length - 1 - lag)] ?? s;
      const prev = history[Math.max(0, history.length - 2 - lag)] ?? seen;
      input = decide(seen, prev, err, skill);
    }
    s = stepLanding(s, input, DT);
    observe?.(s);
  }
  return s;
}
