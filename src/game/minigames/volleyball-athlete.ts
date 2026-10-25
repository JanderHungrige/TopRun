import type { Aim, HitKind } from './volleyball-hit';
import type { Team } from './volleyball-score';

// Beach Volleyball (doc 21): the four athletes — running, jumping, diving and swinging. Every athlete faces
// the net; positions are metres from it (x), feet height above the sand (y). Pure.

export type AthleteId = 'you' | 'duke' | 'breaker' | 'riptide';
export const ATHLETE_IDS: readonly AthleteId[] = Object.freeze(['you', 'duke', 'breaker', 'riptide'] as const);
export const TEAM_OF: Readonly<Record<AthleteId, Team>> = { you: 'home', duke: 'home', breaker: 'away', riptide: 'away' };
export const PARTNER: Readonly<Record<AthleteId, AthleteId>> = { you: 'duke', duke: 'you', breaker: 'riptide', riptide: 'breaker' };
/** A team's two players, by serve index. */
export const TEAM_IDS: Readonly<Record<Team, readonly [AthleteId, AthleteId]>> = { home: ['you', 'duke'], away: ['breaker', 'riptide'] };
/** Which side of the net a team's court is on. */
export const sideSign = (t: Team): -1 | 1 => (t === 'home' ? -1 : 1);
/** The direction towards the net (and the opponents) for a team. */
export const facingOf = (t: Team): -1 | 1 => (t === 'home' ? 1 : -1);

export const BODY_RULES = Object.freeze({
  run: 5.4,
  accel: 40,
  airAccel: 8,
  jumpV: 4.8,
  g: 12,
  /** Seconds a swing can connect, then seconds before the next swing can start. */
  swingActive: 0.3,
  swingRecover: 0.2,
  diveTime: 0.8,
  diveSpeed: 6.5,
  diveDrag: 9,
  /** Closest an athlete gets to the net, farthest back. */
  minGap: 0.25,
  maxX: 9.5,
});
const B = BODY_RULES;

export type SwingKind = 'ground' | 'air' | 'serve';
export interface Swing {
  kind: SwingKind;
  /** Seconds since the swing started. */
  t: number;
  aim: Aim;
  /** Connected with the ball (the rest of the active window does nothing). */
  hit: boolean;
}

export type Mood = 'none' | 'cheer' | 'slump';

export interface Athlete {
  id: AthleteId;
  x: number;
  /** Feet height above the sand. */
  y: number;
  vx: number;
  vy: number;
  swing: Swing | null;
  /** Seconds left of a dive (lunge + lying in the sand); 0 = on the feet. */
  dive: number;
  /** The last hit this athlete made and seconds since (render: hit poses). */
  pose: HitKind | null;
  poseT: number;
  mood: Mood;
}

export const makeAthlete = (id: AthleteId, x: number): Athlete => ({
  id, x, y: 0, vx: 0, vy: 0, swing: null, dive: 0, pose: null, poseT: 9, mood: 'none',
});

export const grounded = (a: Athlete): boolean => a.y <= 0 && a.vy <= 0;

/** Allowed x range for a team's athletes. */
export function boundsOf(team: Team): [number, number] {
  return team === 'home' ? [-B.maxX, -B.minGap] : [B.minGap, B.maxX];
}

const approach = (v: number, target: number, step: number): number => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

/** One physics step: run towards `want` m/s (clamped to the run speed), air control, gravity, dive slide. */
export function runAthlete(a: Athlete, want: number, dt: number): Athlete {
  const target = Math.max(-B.run, Math.min(B.run, want));
  let vx: number;
  if (a.dive > 0) vx = a.vx * Math.exp(-B.diveDrag * dt);
  else vx = approach(a.vx, target, (grounded(a) ? B.accel : B.airAccel) * dt);
  let y = a.y;
  let vy = a.vy;
  if (!grounded(a)) {
    y = a.y + a.vy * dt - 0.5 * B.g * dt * dt;
    vy = a.vy - B.g * dt;
    if (y <= 0) [y, vy] = [0, 0];
  }
  const [lo, hi] = boundsOf(TEAM_OF[a.id]);
  const x0 = a.x + vx * dt;
  const x = Math.max(lo, Math.min(hi, x0));
  const dive = Math.max(0, a.dive - dt);
  return { ...a, x, y, vx: x === x0 ? vx : 0, vy, dive, poseT: a.poseT + dt };
}

/** Leaves the sand (no double jumps, not out of a dive). */
export function jumpAthlete(a: Athlete): Athlete {
  if (!grounded(a) || a.dive > 0) return a;
  return { ...a, vy: B.jumpV, vx: a.vx * 0.7 };
}

/** Starts a swing; returns the athlete unchanged while a swing is still running or recovering, or diving. */
export function startSwing(a: Athlete, kind: SwingKind, aim: Aim): Athlete {
  if (a.swing || a.dive > 0) return a;
  return { ...a, swing: { kind, t: 0, aim, hit: false } };
}

export const swingLive = (a: Athlete): boolean => a.swing !== null && !a.swing.hit && a.swing.t <= B.swingActive;

export function tickSwing(a: Athlete, dt: number): Athlete {
  if (!a.swing) return a;
  const t = a.swing.t + dt;
  return { ...a, swing: t > B.swingActive + B.swingRecover ? null : { ...a.swing, t } };
}

/** A lunge towards the ball (dir ±1) that can dig it on the way, then lying in the sand until the dive time is over. */
export function startDive(a: Athlete, dir: -1 | 1): Athlete {
  if (!grounded(a) || a.dive > 0) return a;
  return { ...a, dive: B.diveTime, vx: dir * B.diveSpeed, swing: { kind: 'ground', t: 0, aim: 'mid', hit: false } };
}
