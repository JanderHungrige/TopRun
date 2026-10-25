import { GEAR_TOP, GEARS, rpm, stepBike, type Bike, type Lean } from '../../src/game/minigames/motorbike-bike';
import { COURSE, TRUCK, type Obstacle } from '../../src/game/minigames/motorbike-course';
import { createRace, stepRace, type RaceState, type RideInput } from '../../src/game/minigames/motorbike';
import { LIFTOFF_T } from '../../src/game/minigames/motorbike-jet';

// Motorbike vs. Jet (doc 22): simulated riders on the pure rules, for the medal tuning in motorbike-riders.test.ts.

const DT = 1 / 60;

export interface Skill {
  /** Rev-meter target for shift presses; null = never presses (the gearbox shifts at the limiter). */
  shiftAt: number | null;
  /** Timing error of a shift press (σ, seconds). */
  shiftSigma: number;
  /** Timing error of every obstacle action (σ, seconds). */
  sigma: number;
  /** Seconds before the front wheel reaches a bump at which the rider leans back. */
  bumpLead: number;
  /** Seconds before / after the oil at which the throttle closes / re-opens. */
  oilLead: number;
  /** Aimed arrival after the truck has cleared the lane (seconds). */
  truckMargin: number;
  /** Seconds before the rider reacts to the truck pulling out. */
  react: number;
  /** Rides tucked whenever no bump is near (false: only ducks for a gate). */
  tuck: boolean;
  /** Ignores the obstacles entirely (throttle only). */
  blind?: boolean;
  /** Course indexes the rider gets wrong (rides straight at them). */
  miss?: readonly number[];
}

export const PERFECT: Skill = { shiftAt: 0.86, shiftSigma: 0, sigma: 0, bumpLead: 0.3, oilLead: 0.05, truckMargin: 0.05, react: 0, tuck: true };
export const AUTO: Skill = { ...PERFECT, shiftAt: null };
export const LATE: Skill = { ...PERFECT, shiftAt: 0.96 };
export const UPRIGHT: Skill = { ...PERFECT, tuck: false };
export const BLIND: Skill = { ...AUTO, tuck: false, blind: true };
/** Human-like riders: shift timing σ, obstacle timing σ, reaction to the truck. */
export const SKILLED: Skill = { ...PERFECT, shiftSigma: 0.05, sigma: 0.05, bumpLead: 0.32, oilLead: 0.1, truckMargin: 0.15, react: 0.25 };
export const AVERAGE: Skill = { ...PERFECT, shiftSigma: 0.1, sigma: 0.09, bumpLead: 0.36, oilLead: 0.15, truckMargin: 0.25, react: 0.4 };
export const NOVICE: Skill = { ...PERFECT, shiftSigma: 0.18, sigma: 0.14, bumpLead: 0.4, oilLead: 0.2, truckMargin: 0.4, react: 0.55, tuck: false };

/** mulberry32 → standard normal (Box–Muller). */
function gauss(seed: number): () => number {
  let a = seed >>> 0;
  const u = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u());
}

interface Plan {
  skill: Skill;
  /** Per obstacle: timing errors (seconds). */
  noise: readonly number[];
  late: readonly number[];
  /** Per gear entry: shift timing error. */
  next: () => number;
  shiftErr: number;
  gear: number;
  pressed: boolean;
  lastV: number;
}

/** Seconds until the front wheel reaches `x` riding flat out from here (shifting as this rider does). */
function etaFlatOut(b: Bike, x: number, shiftAt: number | null): number {
  let bike = b;
  for (let i = 0; i < 300; i++) {
    if (bike.x >= x) return i * DT;
    const shift = shiftAt !== null && rpm(bike) >= shiftAt;
    bike = stepBike(bike, { throttle: 1, brake: false, lean: 1, shift, stunned: false }, DT).bike;
  }
  return 5;
}

function obstacleInput(s: RaceState, o: Obstacle, p: Plan, i: number, input: RideInput): RideInput {
  const b = s.bike;
  const k = p.skill;
  const n = p.noise[i] ?? 0;
  const tt = (o.x - b.x) / Math.max(b.v, 1);
  switch (o.kind) {
    case 'bump': return tt <= k.bumpLead + n ? { ...input, lean: -1 } : input;
    case 'gate': return tt <= 0.4 + n ? { ...input, lean: 1 } : input;
    case 'oil': {
      const after = (b.x - o.x - o.len) / Math.max(b.v, 1);
      return tt <= k.oilLead + n && after < k.oilLead + (p.late[i] ?? 0) ? { ...input, throttle: 0 } : input;
    }
    case 'truck': {
      if (s.truckAt === null || s.t - s.truckAt < k.react) return input;
      const arrive = s.t - s.truckAt + etaFlatOut(b, o.x, k.shiftAt);
      return arrive < TRUCK.blockTo + k.truckMargin + n ? { ...input, throttle: 0, brake: true } : input;
    }
    default: throw new Error(`unhandled: ${o.kind satisfies never}`);
  }
}

function shiftInput(s: RaceState, p: Plan): boolean {
  const b = s.bike;
  const at = p.skill.shiftAt;
  if (b.gear !== p.gear) {
    p.gear = b.gear;
    p.pressed = false;
    p.shiftErr = p.next() * p.skill.shiftSigma;
  }
  if (at === null || p.pressed || b.gear >= GEARS || s.stun > 0) return false;
  const rate = (b.v - p.lastV) / DT / (GEAR_TOP[b.gear - 1] ?? 1);
  if (rpm(b) < at + p.shiftErr * Math.max(0, rate)) return false;
  p.pressed = true;
  return true;
}

function decide(s: RaceState, p: Plan): RideInput {
  const lean: Lean = p.skill.tuck ? 1 : 0;
  let input: RideInput = { throttle: 1, brake: false, lean, shift: shiftInput(s, p) };
  const i = s.results.indexOf('pending');
  const o = COURSE[i];
  if (o && !p.skill.blind && !p.skill.miss?.includes(i)) input = obstacleInput(s, o, p, i, input);
  p.lastV = s.bike.v;
  return input;
}

/** One full race (to lift-off) with this rider; deterministic per seed. */
export function rideRace(skill: Skill, seed = 1): RaceState {
  const g = gauss(seed * 7919 + 13);
  const p: Plan = {
    skill, noise: COURSE.map(() => g() * skill.sigma), late: COURSE.map(() => g() * skill.sigma),
    next: g, shiftErr: 0, gear: 0, pressed: false, lastV: 0,
  };
  let s = createRace();
  for (let i = 0; i < Math.ceil((LIFTOFF_T + 1) / DT) && s.margin === null; i++) s = stepRace(s, decide(s, p), DT);
  return s;
}
