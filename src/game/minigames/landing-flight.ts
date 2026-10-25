import { clamp } from '../../core/math';
import { deckY, DECK, type SeaState } from './landing-deck';

// Carrier Landing flight model (doc 18): the rules table, the jet's hook-point state and one tick of flying —
// glide path with inertia, line-up against the drifting deck, speed with engine lag — plus the ball and the AoA
// indexer the pilot reads. Pure.

const RAD = Math.PI / 180;
const G = 9.81;
export const KNOTS_PER_MS = 1.943844;

export const LANDING_RULES = Object.freeze({
  passes: 3,
  /** Start range to the touchdown target (m, 1.2 nm). */
  startRange: 2222,
  /** On-speed closure (m/s), glide slope (°), one ball (°). */
  speed: 86,
  glide: 3.5,
  ball: 0.25,
  /** The ball turns red below this (balls); it is frozen in the last metres before the target. */
  redBall: -2,
  ballShown: 3.2,
  ballFreeze: 20,
  /** Flight-path rate at full stick (°/s), its lag (1/s) and the flight-path limits (°). */
  qMax: 1.5,
  qK: 4,
  gammaMin: -9,
  gammaMax: 6,
  /** Lateral speed at full stick (m/s) and its lag (1/s). */
  latMax: 4,
  latK: 1.8,
  /** Engine lag (1/s), thrust per unit of power above trim (m/s²), drag (1/s), lift from speed (1/s). */
  engineK: 1.5,
  thrust: 6,
  trim: 0.5,
  drag: 0.3,
  lift: 0.1,
  /** Throttle with the power key released and no throttle lever. */
  keyPower: 0.35,
  /** AoA indexer bands (m/s). */
  onSpeed: 1.3,
  slightly: 2.6,
  /** Wave-off: the last `zone` m before the ramp, ramp clearance (m) inside `clearFrom` m, lane (m). */
  zone: 320,
  clearFrom: 150,
  rampClear: 1,
  laneLimit: 6,
  wayLowFrom: 1500,
  wayLow: -4,
  floor: -12,
  /** Touchdown more than this fast (m/s) skips the hook; airborne this far past the 4-wire = bolter. */
  skipFast: 6,
  floatPast: 40,
  trapDecel: 38,
  /** Automatic go-around: flight-path rate (°/s), climb angles (°), height kept over the deck (m). */
  autoQ: 6,
  bolterGamma: 7,
  waveoffGamma: 6,
  skim: 0.5,
  /** Seconds for the outcome, the grade card, and before the card can be skipped. */
  outcomeTime: 2.6,
  cardTime: 3.6,
  cardSkip: 1,
});
const R = LANDING_RULES;

export type AoaState = 'slow' | 'slightlySlow' | 'onSpeed' | 'slightlyFast' | 'fast';

/** The hook point, the flight path and the engine. */
export interface LandingJet {
  x: number;
  y: number;
  z: number;
  /** Flight-path angle (rad, climbing = +) and its rate (rad/s). */
  gamma: number;
  q: number;
  /** Lateral air velocity (m/s); relative to the deck subtract the drift. */
  vxa: number;
  /** Speed error against on-speed (m/s). */
  dv: number;
  engine: number;
  vy: number;
  vz: number;
}

/** Stick x / y −1 … 1 (right / up) and throttle 0 … 1. */
export interface FlightCmd {
  x: number;
  y: number;
  throttle: number;
}

export const ease = (v: number, target: number, k: number, dt: number): number => v + (target - v) * Math.min(1, k * dt);

/** One tick of flying; `qMax` (rad/s) is raised for the automatic go-around. */
export function flyJet(j: LandingJet, c: FlightCmd, gust: { x: number; y: number }, dt: number, qMax = R.qMax * RAD): LandingJet {
  const q = ease(j.q, clamp(c.y, -1, 1) * qMax, R.qK, dt);
  const gamma = clamp(j.gamma + q * dt, R.gammaMin * RAD, R.gammaMax * RAD);
  const vxa = ease(j.vxa, clamp(c.x, -1, 1) * R.latMax, R.latK, dt);
  const engine = ease(j.engine, clamp(c.throttle, 0, 1), R.engineK, dt);
  const dv = j.dv + (R.thrust * (engine - R.trim) - R.drag * j.dv - G * (gamma + R.glide * RAD)) * dt;
  const v = R.speed + dv;
  const vy = v * Math.sin(gamma) + R.lift * dv + gust.y;
  const vz = v * Math.cos(gamma);
  return { x: j.x + (vxa - DECK.drift + gust.x) * dt, y: j.y + vy * dt, z: j.z + vz * dt, gamma, q, vxa, dv, engine, vy, vz };
}

/** Glide-slope error seen from the target on the (moving) deck, in balls. */
export function ballOf(j: LandingJet, sea: SeaState, t: number): number {
  const range = Math.max(1, DECK.target - j.z);
  return (Math.atan2(j.y - deckY(sea, DECK.target, t), range) / RAD - R.glide) / R.ball;
}

export function aoaOf(dv: number): AoaState {
  if (Math.abs(dv) <= R.onSpeed) return 'onSpeed';
  if (dv < 0) return dv >= -R.slightly ? 'slightlySlow' : 'slow';
  return dv <= R.slightly ? 'slightlyFast' : 'fast';
}
