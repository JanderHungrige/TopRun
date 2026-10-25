import { clamp } from '../../core/math';
import type { PlaneId } from '../../data/types';
import type { Medals } from './core';
import { burnerLevel, flyJet, gust, jetSpan, lowestPoint, SPEED, type FlybyInput, type FlybyJet } from './flyby-jet';

// Tower Flyby (doc 13): three passes over the tower, scored by clearance over the roof. Pure.

export { BURNER_SPEED, SPEED } from './flyby-jet';
export type { FlybyInput, FlybyJet } from './flyby-jet';

export const PASSES = 3;
/** Roof altitude and half width of the tower. */
export const TOWER_ROOF = 230;
export const ROOF_HALF_W = 64;
export const START_X = -2300;
export const START_ALT = 380;
/** Seconds between a decided pass and the next start. */
export const EXIT_TIME = 1.5;
/** Clearance (px) at which a pass stops scoring. */
export const SCORE_RANGE = 150;
export const BASE_POINTS = 600;
export const MAX_MULT = 1.5;
/** Under this clearance (px) the controller spills his coffee. */
export const SPILL_CLEARANCE = 25;
export const SPILL_BONUS = 200;
/** Tower hits shallower than this bounce the jet over the roof (scrape); deeper ones streak past. */
export const SCRAPE_DEPTH = 40;
/** Where a hit leaves the lowest point: over the roof / the ground. */
export const ROOF_LIFT = 4;
export const GROUND_LIFT = 2;
export const FLYBY_MEDALS: Medals = { bronze: 1200, silver: 2000, gold: 2700 };

export type PassOutcome = 'scored' | 'tooHigh' | 'tower' | 'ground';

export interface PassResult {
  outcome: PassOutcome;
  /** Minimum clearance over the roof in px (negative for a tower hit); null for a ground contact. */
  clearance: number | null;
  mult: number;
  spill: boolean;
  points: number;
}

export interface FlybyState {
  plane: PlaneId;
  /** Gust strength, 1 = normal bumpy air, 0 = calm (reference pilots in the tests). */
  turbulence: number;
  /** 0-based pass index. */
  pass: number;
  jet: FlybyJet;
  /** Seconds since this pass started. */
  t: number;
  /** Lowest clearance so far while over the roof. */
  minClear: number | null;
  /** Speed when the jet's origin crossed the tower. */
  towerSpeed: number | null;
  /** This pass, once decided. */
  result: PassResult | null;
  /** Seconds since `result` was decided. */
  exitT: number;
  /** Finished passes. */
  results: readonly PassResult[];
  done: boolean;
}

const startJet = (): FlybyJet => ({ x: START_X, alt: START_ALT, pitch: 0, speed: SPEED, burner: false });

function startPass(s: Pick<FlybyState, 'plane' | 'turbulence'>, pass: number, results: readonly PassResult[]): FlybyState {
  const { plane, turbulence } = s;
  return { plane, turbulence, pass, jet: startJet(), t: 0, minClear: null, towerSpeed: null, result: null, exitT: 0, results, done: false };
}

export const createFlyby = (plane: PlaneId, turbulence = 1): FlybyState => startPass({ plane, turbulence }, 0, []);

export const speedMult = (speed: number): number => 1 + (MAX_MULT - 1) * burnerLevel(speed);

export function scorePass(clearance: number, speed: number): PassResult {
  const mult = speedMult(speed);
  const closeness = clamp(1 - clearance / SCORE_RANGE, 0, 1);
  if (closeness <= 0) return { outcome: 'tooHigh', clearance, mult, spill: false, points: 0 };
  const spill = clearance < SPILL_CLEARANCE;
  const points = Math.round(BASE_POINTS * closeness * mult) + (spill ? SPILL_BONUS : 0);
  return { outcome: 'scored', clearance, mult, spill, points };
}

/** True while the jet's span overlaps the roof. */
export function overTower(plane: PlaneId, jet: FlybyJet): boolean {
  const span = jetSpan(plane, jet.pitch);
  return jet.x + span.front > -ROOF_HALF_W && jet.x - span.back < ROOF_HALF_W;
}

/** Sets the pitch to at least `pitch`, then raises the jet so its lowest point is at `low`. */
function liftTo(plane: PlaneId, jet: FlybyJet, low: number, pitch: number): FlybyJet {
  const p = Math.max(jet.pitch, pitch);
  return { ...jet, pitch: p, alt: jet.alt + low - lowestPoint(plane, jet.alt, p) };
}

const fail = (outcome: 'tower' | 'ground', clearance: number | null): PassResult =>
  ({ outcome, clearance, mult: 1, spill: false, points: 0 });

/** Ground, roof and the end of the tower window while the pass is still open. */
function judge(s: FlybyState, prevX: number): FlybyState {
  const { plane, jet } = s;
  const low = lowestPoint(plane, jet.alt, jet.pitch);
  if (low <= 0) {
    return { ...s, jet: liftTo(plane, jet, GROUND_LIFT, 0), result: fail('ground', null) };
  }
  const towerSpeed = prevX < 0 && jet.x >= 0 ? jet.speed : s.towerSpeed;
  if (overTower(plane, jet)) {
    const c = low - TOWER_ROOF;
    if (c > 0) return { ...s, towerSpeed, minClear: Math.min(s.minClear ?? c, c) };
    const bounced = c > -SCRAPE_DEPTH ? liftTo(plane, jet, TOWER_ROOF + ROOF_LIFT, 0.05) : jet;
    return { ...s, towerSpeed, jet: bounced, result: fail('tower', c) };
  }
  if (jet.x <= 0) return { ...s, towerSpeed };
  return { ...s, towerSpeed, result: scorePass(s.minClear ?? low - TOWER_ROOF, towerSpeed ?? jet.speed) };
}

/** Once decided: climb out, keep the jet off the ground, then start the next pass or end the round. */
function exit(s: FlybyState, result: PassResult, dt: number): FlybyState {
  const exitT = s.exitT + dt;
  if (exitT < EXIT_TIME) {
    const low = lowestPoint(s.plane, s.jet.alt, s.jet.pitch);
    const jet = low < GROUND_LIFT ? { ...s.jet, alt: s.jet.alt + GROUND_LIFT - low } : s.jet;
    return { ...s, jet, exitT };
  }
  const results = [...s.results, result];
  if (results.length >= PASSES) return { ...s, exitT, results, result: null, done: true };
  return startPass(s, s.pass + 1, results);
}

export function stepFlyby(s: FlybyState, input: FlybyInput, dt: number): FlybyState {
  if (s.done) return s;
  const lift = s.result ? 0 : gust(s.pass, s.t) * s.turbulence;
  const flown: FlybyState = { ...s, t: s.t + dt, jet: flyJet(s.jet, input, dt, s.result !== null, lift) };
  if (s.result) return exit(flown, s.result, dt);
  return judge(flown, s.jet.x);
}

/** Finished passes plus the current one once decided. */
export function totalScore(s: FlybyState): number {
  return s.results.reduce((a, r) => a + r.points, 0) + (s.result?.points ?? 0);
}
