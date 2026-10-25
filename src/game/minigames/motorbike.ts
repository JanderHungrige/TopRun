import type { Medals } from './core';
import { createBike, stepBike, type Bike, type Lean, type ShiftRating } from './motorbike-bike';
import { COURSE, judgeObstacle, MISHAP, TRUCK, type Mishap } from './motorbike-course';
import { jetAt, LIFTOFF_T, LIFTOFF_X } from './motorbike-jet';

// Motorbike vs. Jet (doc 22): one race — the bike against Duke's take-off roll, the obstacles, mishaps and the
// margin at lift-off. Pure; one call per fixed tick.

/** Margin at lift-off (m); bronze = beat the jet. Tuned with simulated riders (doc 22). */
export const MOTORBIKE_MEDALS: Medals = { bronze: 0, silver: 40, gold: 150 };
/** After lift-off the bike rolls out on a light brake. */
const ROLL_OUT_BRAKE = 4;

export interface RideInput {
  /** 0 … 1. */
  throttle: number;
  brake: boolean;
  lean: Lean;
  shift: boolean;
}

export type ObstacleResult = 'pending' | 'clean' | Mishap;

export type RaceEvent =
  | { kind: 'shift'; rating: ShiftRating }
  | { kind: 'clear'; index: number; close: boolean }
  | { kind: 'mishap'; index: number; mishap: Mishap }
  | { kind: 'truckGo' }
  | { kind: 'marker' }
  | { kind: 'liftoff'; margin: number };

export interface RaceState {
  /** Seconds since GO. */
  t: number;
  bike: Bike;
  /** Seconds without drive left, and the mishap that caused it. */
  stun: number;
  mishap: Mishap | null;
  /** Per COURSE entry. */
  results: readonly ObstacleResult[];
  /** Seconds of throttle on the current oil patch. */
  oilT: number;
  /** Race time the fuel truck pulled out. */
  truckAt: number | null;
  shifts: Readonly<Record<ShiftRating, number>>;
  /** Race time the bike passed the lift-off marker. */
  passedAt: number | null;
  /** Bike − marker at lift-off (m); set once, then the race is over. */
  margin: number | null;
  /** What happened this tick. */
  events: readonly RaceEvent[];
}

export function createRace(): RaceState {
  return {
    t: 0, bike: createBike(), stun: 0, mishap: null, results: COURSE.map(() => 'pending'), oilT: 0, truckAt: null,
    shifts: { perfect: 0, early: 0, late: 0, auto: 0 }, passedAt: null, margin: null, events: [],
  };
}

/** Live gap: the bike's front wheel minus the jet's nose (m), positive = the bike leads. */
export const raceGap = (s: RaceState): number => s.bike.x - jetAt(s.t).x;

export const finalScore = (s: RaceState): number => Math.round(s.margin ?? 0);

export const isClean = (s: RaceState): boolean => s.results.every((r) => r !== 'bump' && r !== 'slide' && r !== 'gate' && r !== 'truck');

function applyMishap(s: RaceState, index: number, m: Mishap, events: RaceEvent[]): RaceState {
  events.push({ kind: 'mishap', index, mishap: m });
  const results = s.results.map((r, i) => (i === index ? m : r));
  const o = COURSE[index];
  if (m === 'truck' && o) {
    const wait = TRUCK.blockTo - (s.t - (s.truckAt ?? s.t)) + 0.3;
    const bike: Bike = { ...s.bike, x: Math.min(s.bike.x, o.x - 0.5), v: 0, gear: 1, boost: 0, bog: 0, limiter: 0 };
    return { ...s, bike, results, stun: Math.max(MISHAP.truck.stun, wait), mishap: m };
  }
  const bike: Bike = { ...s.bike, v: s.bike.v * MISHAP[m].keep, boost: 0, bog: 0, limiter: 0 };
  return { ...s, bike, results, stun: MISHAP[m].stun, mishap: m };
}

/** The next undecided obstacle: truck trigger, then the verdict for this tick. */
function course(s: RaceState, prevX: number, input: RideInput, dt: number, events: RaceEvent[]): RaceState {
  const index = s.results.indexOf('pending');
  const o = COURSE[index];
  if (!o) return s;
  let st = s;
  if (o.kind === 'truck' && st.truckAt === null && st.bike.x >= o.x - TRUCK.trigger) {
    st = { ...st, truckAt: st.t };
    events.push({ kind: 'truckGo' });
  }
  const truckT = st.truckAt === null ? null : st.t - st.truckAt;
  const v = judgeObstacle(o, { prevX, bike: st.bike, throttle: input.throttle, brake: input.brake, oilT: st.oilT, truckT, dt });
  if (v.result === null) return { ...st, oilT: v.oilT };
  if (v.result !== 'clean') return applyMishap({ ...st, oilT: 0 }, index, v.result, events);
  const close = o.kind === 'truck' && truckT !== null && truckT - TRUCK.blockTo < TRUCK.close;
  events.push({ kind: 'clear', index, close });
  return { ...st, oilT: 0, results: st.results.map((r, i) => (i === index ? 'clean' : r)) };
}

/** Marker and lift-off; the margin is interpolated to the exact lift-off moment inside the tick. */
function finish(s: RaceState, prev: RaceState, dt: number, events: RaceEvent[]): RaceState {
  let st = s;
  if (st.passedAt === null && prev.bike.x < LIFTOFF_X && st.bike.x >= LIFTOFF_X) {
    st = { ...st, passedAt: st.t };
    events.push({ kind: 'marker' });
  }
  if (prev.t >= LIFTOFF_T || st.t < LIFTOFF_T) return st;
  const f = dt > 0 ? (LIFTOFF_T - prev.t) / dt : 1;
  const margin = prev.bike.x + (st.bike.x - prev.bike.x) * f - LIFTOFF_X;
  events.push({ kind: 'liftoff', margin });
  return { ...st, margin };
}

function rollOut(s: RaceState, dt: number): RaceState {
  const r = stepBike(s.bike, { throttle: 0, brake: false, lean: 0, shift: false, stunned: false }, dt);
  const v = Math.max(0, r.bike.v - ROLL_OUT_BRAKE * dt);
  return { ...s, t: s.t + dt, bike: { ...r.bike, v }, stun: Math.max(0, s.stun - dt), events: [] };
}

export function stepRace(s: RaceState, input: RideInput, dt: number): RaceState {
  if (s.margin !== null) return rollOut(s, dt);
  const events: RaceEvent[] = [];
  const stunned = s.stun > 0;
  const truckHold = s.mishap === 'truck' && stunned;
  const r = stepBike(s.bike, { ...input, stunned }, dt);
  if (r.shift) events.push({ kind: 'shift', rating: r.shift });
  const bike = truckHold ? { ...r.bike, x: s.bike.x, v: 0 } : r.bike;
  const shifts = r.shift ? { ...s.shifts, [r.shift]: s.shifts[r.shift] + 1 } : s.shifts;
  const stun = Math.max(0, s.stun - dt);
  let st: RaceState = { ...s, t: s.t + dt, bike, shifts, stun, mishap: stun > 0 ? s.mishap : null, events };
  st = course(st, s.bike.x, input, dt, events);
  st = finish(st, s, dt, events);
  return { ...st, events };
}

/** HUD hint once the truck rolls: at the current speed the bike would reach its lane while it is blocked → brake. */
export function truckHint(s: RaceState): 'brake' | 'go' | null {
  const o = COURSE[s.results.indexOf('pending')];
  if (!o || o.kind !== 'truck' || s.truckAt === null) return null;
  const eta = s.t - s.truckAt + (o.x - s.bike.x) / Math.max(1, s.bike.v);
  return eta > TRUCK.blockFrom - 0.1 && eta < TRUCK.blockTo + 0.05 ? 'brake' : 'go';
}
