import { approach, clamp, lerp, wrapAngle, type Vec } from '../../core/math';
import { headingTo } from '../combat';
import type { EvJet } from './evasion-flight';

// Missile Evasion (doc 16): homing missiles. Lead pursuit with a turn-rate and a turn-acceleration
// limit (tight turns, slow to reverse), a seeker gimbal (overshoot = lock lost), motor burn-out,
// flare decoy chance by aspect. Pure.

export type MissileKind = 'sam' | 'aam';
/** tracking = homing on the jet; decoyed = chasing a flare; lost = overshot; spent = motor burnt out. */
export type MissileMode = 'tracking' | 'decoyed' | 'lost' | 'spent';

export interface MissileSpec {
  launchSpeed: number;
  topSpeed: number;
  /** Seconds from launch to top speed. */
  boostTime: number;
  /** Turn-rate limit, rad/s, and how fast the turn rate can change, rad/s². */
  turn: number;
  turnAccel: number;
  /** Motor time, s: after it the missile is spent. */
  burn: number;
}

export const MISSILE_SPECS: Readonly<Record<MissileKind, Readonly<MissileSpec>>> = Object.freeze({
  sam: { launchSpeed: 120, topSpeed: 380, boostTime: 1, turn: 2.9, turnAccel: 6, burn: 6 },
  aam: { launchSpeed: 300, topSpeed: 470, boostTime: 0.5, turn: 3.6, turnAccel: 9, burn: 4.5 },
});

export const SEEKER = Object.freeze({
  /** Lead pursuit: aim ahead of the jet by this share of its estimated velocity × time to go … */
  lead: 0.6,
  /** … with this commanded turn rate per radian of aim error. */
  gain: 5,
  /** The missile's estimate of the jet's velocity follows the real one at this rate, 1/s (tracking lag). */
  track: 3,
  /** Jet more than this off the nose = lock lost (overshoot). */
  gimbal: (72 * Math.PI) / 180,
  hitRadius: 14,
});

export const DECOY = Object.freeze({
  /** Flares work on tracking missiles within this range of the jet. */
  range: 260,
  tailChance: 0.9,
  headChance: 0.15,
  /** Full chance up to `cone` off the tail, falling linearly to `headChance` at `wide`. */
  cone: (45 * Math.PI) / 180,
  wide: (135 * Math.PI) / 180,
});

/** What happens to a missile after it stops tracking (seconds, px, 1/s). */
export const AFTERLIFE = Object.freeze({ lostTime: 1.2, spentTime: 1, decoyTime: 1.6, flareHit: 16, spentDrag: 1.4 });

export interface Missile {
  id: number;
  kind: MissileKind;
  wave: number;
  x: number;
  y: number;
  heading: number;
  omega: number;
  speed: number;
  /** Seconds since launch (motor time used). */
  age: number;
  mode: MissileMode;
  /** Seconds in the current mode. */
  modeT: number;
  /** Flare id while decoyed. */
  flare: number | null;
  /** The missile's (lagging) estimate of the jet's velocity. */
  tvx: number;
  tvy: number;
  speedMul: number;
  turnMul: number;
}

export type MissileOutcome = 'burnout' | 'overshoot' | 'pop' | 'fizzle' | null;
export interface MissileStep { m: Missile | null; event: MissileOutcome }

export function launchMissile(
  id: number, kind: MissileKind, wave: number, x: number, y: number, tx: number, ty: number, mul = { speed: 1, turn: 1 },
): Missile {
  const heading = headingTo(x, y, tx, ty);
  const speed = MISSILE_SPECS[kind].launchSpeed * mul.speed;
  return {
    id, kind, wave, x, y, heading, omega: 0, speed, age: 0, mode: 'tracking', modeT: 0, flare: null, tvx: 0, tvy: 0, speedMul: mul.speed, turnMul: mul.turn,
  };
}

const boostSpeed = (m: Missile, age: number): number => {
  const s = MISSILE_SPECS[m.kind];
  return lerp(s.launchSpeed, s.topSpeed, clamp(age / s.boostTime, 0, 1)) * m.speedMul;
};

/** Angle between the missile's nose and the line to (x, y), 0 … π. */
export const offBoresight = (m: Missile, x: number, y: number): number => Math.abs(wrapAngle(headingTo(m.x, m.y, x, y) - m.heading));

/** Angle between the jet's tail and the line to (x, y): 0 = dead astern, π = head-on. */
export const tailAngle = (jet: EvJet, x: number, y: number): number =>
  Math.abs(wrapAngle(headingTo(jet.x, jet.y, x, y) - jet.heading - Math.PI));

export function decoyChance(tail: number): number {
  if (tail <= DECOY.cone) return DECOY.tailChance;
  if (tail >= DECOY.wide) return DECOY.headChance;
  return lerp(DECOY.tailChance, DECOY.headChance, (tail - DECOY.cone) / (DECOY.wide - DECOY.cone));
}

/** Seconds until impact at the current closing speed; Infinity while the range opens. */
export function closingTime(m: Missile, jet: EvJet): number {
  const rx = jet.x - m.x;
  const ry = jet.y - m.y;
  const r = Math.hypot(rx, ry);
  if (r < 1e-6) return 0;
  const closing = ((Math.sin(m.heading) * m.speed - jet.vx) * rx + (-Math.cos(m.heading) * m.speed - jet.vy) * ry) / r;
  return closing > 1 ? r / closing : Infinity;
}

/**
 * Time to impact as a pilot reads it (RWR colours, simulated pilots): the closing time, or sooner
 * if the missile would close faster flying straight at the jet (it is still turning in).
 */
export function impactTime(m: Missile, jet: EvJet): number {
  const r = Math.hypot(m.x - jet.x, m.y - jet.y);
  const toward = m.speed + (jet.vx * (m.x - jet.x) + jet.vy * (m.y - jet.y)) / Math.max(1, r);
  return Math.min(closingTime(m, jet), r / Math.max(60, toward));
}

/** Turn rate after one tick of steering at (ax, ay), within the missile's limits. */
export function turnTowards(m: Missile, ax: number, ay: number, dt: number): number {
  const spec = MISSILE_SPECS[m.kind];
  const lim = spec.turn * m.turnMul;
  const cmd = clamp(wrapAngle(headingTo(m.x, m.y, ax, ay) - m.heading) * SEEKER.gain, -lim, lim);
  return approach(m.omega, cmd, spec.turnAccel * m.turnMul * dt);
}

function fly(m: Missile, omega: number, speed: number, dt: number): Missile {
  const heading = wrapAngle(m.heading + omega * dt);
  const x = m.x + Math.sin(heading) * speed * dt;
  const y = m.y - Math.cos(heading) * speed * dt;
  return { ...m, x, y, heading, omega, speed, age: m.age + dt, modeT: m.modeT + dt };
}

const settle = (m: Missile, dt: number): number => approach(m.omega, 0, MISSILE_SPECS[m.kind].turnAccel * dt);

/** Where a tracking missile aims: ahead of the jet by a share of its estimated velocity × time to go. */
export function leadPoint(m: Missile, jet: EvJet): Vec {
  const tGo = Math.hypot(jet.x - m.x, jet.y - m.y) / Math.max(100, m.speed);
  return { x: jet.x + m.tvx * tGo * SEEKER.lead, y: jet.y + m.tvy * tGo * SEEKER.lead };
}

/** Lead pursuit with a lagging velocity estimate: accurate at range, slow to see a sudden break. */
function track(m: Missile, jet: EvJet, dt: number): MissileStep {
  const k = Math.min(1, SEEKER.track * dt);
  const seen = { ...m, tvx: m.tvx + (jet.vx - m.tvx) * k, tvy: m.tvy + (jet.vy - m.tvy) * k };
  const aim = leadPoint(seen, jet);
  const next = fly(seen, turnTowards(seen, aim.x, aim.y, dt), boostSpeed(m, m.age + dt), dt);
  if (next.age >= MISSILE_SPECS[m.kind].burn) return { m: { ...next, mode: 'spent', modeT: 0 }, event: 'burnout' };
  if (offBoresight(next, jet.x, jet.y) > SEEKER.gimbal) return { m: { ...next, mode: 'lost', modeT: 0 }, event: 'overshoot' };
  return { m: next, event: null };
}

function chaseFlare(m: Missile, flare: Vec | null, dt: number): MissileStep {
  const omega = flare ? turnTowards(m, flare.x, flare.y, dt) : settle(m, dt);
  const next = fly(m, omega, m.speed, dt);
  const reached = flare !== null && Math.hypot(flare.x - next.x, flare.y - next.y) < AFTERLIFE.flareHit;
  return reached || next.modeT >= AFTERLIFE.decoyTime ? { m: null, event: 'pop' } : { m: next, event: null };
}

/** One tick of a missile in any mode; `flare` = the flare it chases (decoyed only). */
export function stepMissile(m: Missile, jet: EvJet, flare: Vec | null, dt: number): MissileStep {
  switch (m.mode) {
    case 'tracking': return track(m, jet, dt);
    case 'decoyed': return chaseFlare(m, flare, dt);
    case 'lost': {
      const next = fly(m, settle(m, dt), m.speed, dt);
      return next.modeT >= AFTERLIFE.lostTime ? { m: null, event: 'pop' } : { m: next, event: null };
    }
    case 'spent': {
      const next = fly(m, m.omega, m.speed * Math.max(0, 1 - AFTERLIFE.spentDrag * dt), dt);
      return next.modeT >= AFTERLIFE.spentTime ? { m: null, event: 'fizzle' } : { m: next, event: null };
    }
    default: throw new Error(`unhandled: ${m.mode satisfies never}`);
  }
}
