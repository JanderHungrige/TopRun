import { headingTo } from '../../src/game/combat';
import { createEvasion, NO_INPUT, stepEvasion, type EvasionInput, type EvasionState } from '../../src/game/minigames/evasion';
import { breakReady } from '../../src/game/minigames/evasion-flight';
import { DECOY, decoyChance, impactTime, tailAngle, type Missile } from '../../src/game/minigames/evasion-missiles';

// Simulated pilots for the Missile Evasion playtest (doc 16). Not a test file itself.

const DT = 1 / 60;
/** A pilot for one round: sees a (possibly delayed) state, returns this tick's input. */
export type Pilot = (s: EvasionState) => EvasionInput;
export type PilotFactory = () => Pilot;

export interface PilotSkill {
  /** Perception delay, s: the pilot reacts to what was on screen this long ago. */
  delay: number;
  /** Break when the most urgent missile is this many seconds from impact (negative = never). */
  breakAt: number;
  /** How long a break turn is held, s, and how far it turns (rad, towards the missile's side). */
  hold: number;
  turn: number;
  /** Use the high-G break for missiles that are already this close (s to impact; 0 = never). */
  lateAt: number;
  /** Flare once the missiles in range add up to this decoy chance (0 = never flare) … */
  flareWorth: number;
  /** … counting only those at most this many seconds from impact. */
  flareAt: number;
  /** Timing error, s: each decision threshold is off by up to this much (seeded). */
  jitter: number;
}

export const ACE: PilotSkill = { delay: 0.15, breakAt: 0.9, lateAt: 0.6, hold: 1, turn: Math.PI / 2, flareWorth: 0.7, flareAt: 1.2, jitter: 0.05 };

const tracking = (s: EvasionState): Missile[] => s.missiles.filter((m) => m.mode === 'tracking');
const dir = (h: number) => ({ x: Math.sin(h), y: -Math.cos(h) });
const steerTo = (h: number, extra: Partial<EvasionInput> = {}): EvasionInput => ({ ...NO_INPUT, steerX: Math.sin(h), steerY: -Math.cos(h), ...extra });
const range = (s: EvasionState, m: Missile): number => Math.hypot(m.x - s.jet.x, m.y - s.jet.y);
/** What a pilot reads off the screen (and the RWR colours show). */
const eta = (s: EvasionState, m: Missile): number => impactTime(m, s.jet);

/** Steering that turns the tail towards the threats' centre (drag them behind), announced launches included. */
function drag(s: EvasionState, ms: readonly Missile[]): EvasionInput {
  const pts = [...ms.map((m) => ({ x: m.x, y: m.y })), ...s.pending.filter((p) => p.warned).map((p) => ({ x: s.jet.x + p.offset.x, y: s.jet.y + p.offset.y }))];
  if (pts.length === 0) return NO_INPUT;
  const cx = pts.reduce((a, m) => a + m.x, 0) / pts.length;
  const cy = pts.reduce((a, m) => a + m.y, 0) / pts.length;
  const away = dir(headingTo(cx, cy, s.jet.x, s.jet.y));
  return { ...NO_INPUT, steerX: away.x, steerY: away.y };
}

function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** A defensive pilot: drags missiles behind, flares those in the tail cone, breaks hard into close ones. */
export function skilled(k: PilotSkill): PilotFactory {
  return () => {
    let breakUntil = -1;
    let breakTo = 0;
    let target = -1;
    let decisions = 0;
    return (s) => {
      const ms = tracking(s);
      if (ms.length === 0) return drag(s, ms);
      const err = () => k.jitter * (hash(++decisions + s.seed) * 2 - 1);
      const at = k.flareAt + err();
      const worth = ms.filter((m) => range(s, m) < DECOY.range && eta(s, m) < at).reduce((a, m) => a + decoyChance(tailAngle(s.jet, m.x, m.y)), 0);
      const flare = k.flareWorth > 0 && s.charges > 0 && worth >= k.flareWorth;
      const urgent = ms.reduce((a, m) => (eta(s, m) < eta(s, a) ? m : a));
      const late = breakReady(s.jet) && eta(s, urgent) < k.lateAt + err();
      const busy = s.t < breakUntil && ms.some((m) => m.id === target);
      if (busy && !(late && urgent.id !== target)) return steerTo(breakTo, { flare });
      if (k.breakAt > 0 && eta(s, urgent) < k.breakAt + err()) {
        const side = Math.sin(headingTo(s.jet.x, s.jet.y, urgent.x, urgent.y) - s.jet.heading) >= 0 ? 1 : -1;
        const g = late;
        breakTo = s.jet.heading + side * k.turn;
        breakUntil = s.t + k.hold;
        target = urgent.id;
        return steerTo(breakTo, { flare, brk: g });
      }
      return { ...drag(s, ms), flare };
    };
  };
}

export const idle: PilotFactory = () => () => NO_INPUT;
/** Holds a hard right turn all round. */
export const circler: PilotFactory = () => (s) => steerTo(s.jet.heading + 1.5);
/** Holds a hard turn and pops flares and the break whenever a missile is up. */
export const spinner: PilotFactory = () => (s) => steerTo(s.jet.heading + 1.5, { flare: tracking(s).length > 0, brk: tracking(s).length > 0 });
/** Flies straight on and flares as soon as any missile is in range. */
export const flareSpammer: PilotFactory = () => (s) => ({ ...NO_INPUT, flare: tracking(s).some((m) => range(s, m) < DECOY.range) });

/** Plays a full round; the pilot sees the state `delay` s late. */
export function playRound(seed: number, factory: PilotFactory, delay = 0): EvasionState {
  const pilot = factory();
  let s = createEvasion(seed);
  const seen: EvasionState[] = [];
  const lag = Math.round(delay / DT);
  for (let tick = 0; tick < 60 * 100 && !s.over; tick++) {
    seen.push(s);
    if (seen.length > lag + 1) seen.shift();
    s = stepEvasion(s, pilot(seen[0] ?? s), DT);
  }
  return s;
}
