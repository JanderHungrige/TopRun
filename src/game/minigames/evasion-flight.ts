import { clamp, wrapAngle, type Vec } from '../../core/math';
import { headingTo } from '../combat';

// Missile Evasion (doc 16): the player's jet seen from above. Heading 0 = up, clockwise positive
// (as in missions). Turn rate with roll-in, momentum (the velocity lags the nose), high-G break. Pure.

export const JET = Object.freeze({
  /** Cruise and break speed, px/s. */
  speed: 250,
  breakSpeed: 290,
  /** Turn-rate limits, rad/s. */
  turn: 1.9,
  breakTurn: 3.4,
  /** Commanded turn rate per radian of heading error. */
  steerGain: 5,
  /** How fast the turn rate follows the command (roll-in), 1/s. */
  rollK: 9,
  /** How fast the velocity follows the nose (momentum), 1/s. */
  grip: 7,
  /** Speed easing during / after a break, 1/s. */
  boostK: 4,
  settleK: 5,
  /** Break duration and the time from one break to the next, s. */
  breakTime: 1,
  breakCooldown: 6,
  /** Steering input below this length holds the heading. */
  deadzone: 0.25,
  /** G load = 1 + |turn rate| × speed / gDiv. */
  gDiv: 120,
});

export interface EvJet {
  x: number;
  y: number;
  heading: number;
  /** Current turn rate, rad/s (positive = clockwise / right). */
  omega: number;
  vx: number;
  vy: number;
  /** Speed the nose is flying at (the velocity eases towards heading × speed). */
  speed: number;
  /** Seconds of high-G break left. */
  breakT: number;
  /** Seconds until the break is ready again. */
  breakCd: number;
}

export const createJet = (): EvJet =>
  ({ x: 0, y: 0, heading: 0, omega: 0, vx: 0, vy: -JET.speed, speed: JET.speed, breakT: 0, breakCd: 0 });

export const breakReady = (j: EvJet): boolean => j.breakCd <= 0;
export const turnLimit = (j: EvJet): number => (j.breakT > 0 ? JET.breakTurn : JET.turn);
export const gLoad = (j: EvJet): number => 1 + (Math.abs(j.omega) * j.speed) / JET.gDiv;
/** 0 … 1 while the break is on (for the engine sound and the afterburner flame). */
export const breakLevel = (j: EvJet): number => clamp((j.speed - JET.speed) / (JET.breakSpeed - JET.speed), 0, 1);

/** The turn rate the pilot asks for: towards the pushed screen direction, or hold the heading. */
export function steerCommand(heading: number, steer: Vec, limit: number): number {
  if (Math.hypot(steer.x, steer.y) < JET.deadzone) return 0;
  const err = wrapAngle(headingTo(0, 0, steer.x, steer.y) - heading);
  return clamp(err * JET.steerGain, -limit, limit);
}

/** One tick. `brk` = break pressed this tick (starts it if ready). */
export function flyJet(j: EvJet, steer: Vec, brk: boolean, dt: number): EvJet {
  let breakT = Math.max(0, j.breakT - dt);
  let breakCd = Math.max(0, j.breakCd - dt);
  if (brk && j.breakCd <= 0) {
    breakT = JET.breakTime;
    breakCd = JET.breakCooldown;
  }
  const limit = breakT > 0 ? JET.breakTurn : JET.turn;
  const cmd = steerCommand(j.heading, steer, limit);
  const omega = clamp(j.omega + (cmd - j.omega) * Math.min(1, JET.rollK * dt), -limit, limit);
  const heading = wrapAngle(j.heading + omega * dt);
  const boosting = breakT > 0;
  const target = boosting ? JET.breakSpeed : JET.speed;
  const speed = j.speed + (target - j.speed) * Math.min(1, (boosting ? JET.boostK : JET.settleK) * dt);
  const g = Math.min(1, JET.grip * dt);
  const vx = j.vx + (Math.sin(heading) * speed - j.vx) * g;
  const vy = j.vy + (-Math.cos(heading) * speed - j.vy) * g;
  return { x: j.x + vx * dt, y: j.y + vy * dt, heading, omega, vx, vy, speed, breakT, breakCd };
}
