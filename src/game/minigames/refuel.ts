import { clamp } from '../../core/math';
import type { Medals } from './core';
import { AIR, createAir, NO_SWING, roughTarget, stepSwing, wander, type AirModel, type Swing, type Vec3 } from './refuel-air';

// Air Refuelling rules (doc 15): fly the drogue basket onto the probe at a gentle closure, then hold
// position while the fuel flows. Tanker frame in metres (x right, y up, z forward). Pure and deterministic.

export type { Vec3 } from './refuel-air';

export const REFUEL_RULES = Object.freeze({
  roundTime: 60,
  /** Start: probe this far behind the basket and offset right / below it (m). */
  startGap: 7,
  startX: 1.1,
  startY: -0.8,
  maxGap: 16,
  maxSide: 6,
  /** Sideways / vertical speed at full deflection (m/s) and how fast it is reached (1/s). */
  steerSpeed: 1.6,
  steerK: 2.6,
  /** Closure with the throttle at idle / full (m/s) and the engine lag (1/s). */
  closeIdle: -1.2,
  closeFull: 2.6,
  thrustK: 1,
  /** The probe must be within this of the ring centre (m) … */
  captureR: 0.33,
  /** … at a closure inside this window (m/s). */
  safeMin: 0.3,
  safeMax: 1.8,
  /** After a failure the jet drops back to these gaps (m) at this closure (m/s). */
  backoffGap: 3,
  softGap: 1.5,
  backoffClosure: -1.5,
  backoffK: 3,
  /** Plugged: hold box half sizes (m) and push depths (m). */
  boxX: 0.7,
  boxY: 0.5,
  flowMin: 1,
  flowMax: 3,
  slackMax: 3.6,
  /** lbs/s at a fully open valve; valve open / close times (s). */
  flowRate: 150,
  flowRamp: 1.2,
  flowClose: 0.3,
  /** Swing speed given to a knocked basket (m/s). */
  missKick: 0.8,
  fastKick: 1.5,
  softKick: 0.3,
});
const R = REFUEL_RULES;

export const REFUEL_MEDALS: Readonly<Medals> = Object.freeze({ bronze: 2000, silver: 5000, gold: 7250 });
export const KNOTS_PER_MS = 1.943844;

export type RefuelPhase = 'approach' | 'contact' | 'backoff' | 'over';
export type ContactKind = 'contact' | 'miss' | 'tooFast' | 'tooSoft';
export type DisconnectKind = 'droppedOff' | 'slack' | 'brokeOff';
export type RefuelEventKind = ContactKind | DisconnectKind;
export type PodLight = 'amber' | 'green' | 'red' | 'off';
export type RefuelStatus = 'cleared' | 'pushIn' | 'flowing' | 'tooFar' | 'backOff' | 'over';

export interface RefuelEvent {
  kind: RefuelEventKind;
  t: number;
  /** Probe distance from the ring centre (contact attempts) or from the trail (disconnects), m. */
  offset: number;
  closure: number;
}

/** Stick x / y −1 … 1 (right / up), throttle 0 … 1. */
export interface RefuelInput {
  x: number;
  y: number;
  throttle: number;
}

/** The probe tip's position and velocity in the tanker frame. */
export interface RefuelJet {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface RefuelState {
  air: AirModel;
  /** Wander scale: 1 in the game, 0 = calm air (reference pilots in the tests). */
  turbulence: number;
  t: number;
  phase: RefuelPhase;
  jet: RefuelJet;
  /** Where the free basket is (wander × roughness + swing). */
  trail: Vec3;
  swing: Swing;
  rough: number;
  /** basket.z − probe.z: > 0 while the basket is ahead. */
  gap: number;
  /** −d(gap)/dt this tick (m/s). */
  closure: number;
  /** Hose pushed in while plugged (m), else 0. */
  push: number;
  /** Fuel valve 0 … 1. */
  valve: number;
  fuel: number;
  contacts: number;
  disconnects: number;
  /** Gap the jet drops back to in `backoff`. */
  backoffTo: number;
  event: RefuelEvent | null;
  /** Counts events so the scene can spot a new one. */
  events: number;
}

function trailAt(air: AirModel, t: number, scale: number, swing: Swing): Vec3 {
  const w = wander(air, t);
  return { x: w.x * scale + swing.x, y: w.y * scale + swing.y, z: w.z * scale };
}

export function createRefuel(seed: number, turbulence = 1): RefuelState {
  const air = createAir(seed);
  const trail = trailAt(air, 0, turbulence * AIR.roughStart, NO_SWING);
  const jet = { x: trail.x + R.startX, y: trail.y + R.startY, z: trail.z - R.startGap, vx: 0, vy: 0, vz: 0 };
  return {
    air, turbulence, t: 0, phase: 'approach', jet, trail, swing: NO_SWING, rough: AIR.roughStart, gap: R.startGap, closure: 0,
    push: 0, valve: 0, fuel: 0, contacts: 0, disconnects: 0, backoffTo: R.backoffGap, event: null, events: 0,
  };
}

/** Free basket minus probe tip (x / y, m): where to steer. */
export const offsetOf = (s: RefuelState): { x: number; y: number } => ({ x: s.trail.x - s.jet.x, y: s.trail.y - s.jet.y });
/** Probe tip minus free basket (x / y, m): the plugged position error. */
export const holdOf = (s: RefuelState): { x: number; y: number } => ({ x: s.jet.x - s.trail.x, y: s.jet.y - s.trail.y });
/** Where the basket is drawn: on the probe while plugged, else on its trail. */
export const basketPos = (s: RefuelState): Vec3 => (s.phase === 'contact' ? { x: s.jet.x, y: s.jet.y, z: s.jet.z } : s.trail);
export const fuelScore = (s: RefuelState): number => Math.round(s.fuel);

export function judgeContact(offset: number, closure: number): ContactKind {
  if (offset > R.captureR) return 'miss';
  if (closure > R.safeMax) return 'tooFast';
  if (closure < R.safeMin) return 'tooSoft';
  return 'contact';
}

export function podLight(s: RefuelState): PodLight {
  switch (s.phase) {
    case 'approach': return 'amber';
    case 'contact': return s.valve > 0 ? 'green' : 'amber';
    case 'backoff': return 'red';
    case 'over': return 'off';
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}

export function refuelStatus(s: RefuelState): RefuelStatus {
  switch (s.phase) {
    case 'approach': return 'cleared';
    case 'backoff': return 'backOff';
    case 'over': return 'over';
    case 'contact':
      if (s.push > R.flowMax) return 'tooFar';
      return s.push >= R.flowMin ? 'flowing' : 'pushIn';
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}

const ease = (v: number, target: number, k: number, dt: number): number => v + (target - v) * Math.min(1, k * dt);

function moveJet(s: RefuelState, input: RefuelInput, trail: Vec3, dt: number): RefuelJet {
  const j = s.jet;
  const vx = ease(j.vx, clamp(input.x, -1, 1) * R.steerSpeed, R.steerK, dt);
  const vy = ease(j.vy, clamp(input.y, -1, 1) * R.steerSpeed, R.steerK, dt);
  const power = R.closeIdle + (R.closeFull - R.closeIdle) * clamp(input.throttle, 0, 1);
  let vz = s.phase === 'backoff' ? ease(j.vz, R.backoffClosure, R.backoffK, dt) : ease(j.vz, power, R.thrustK, dt);
  let z = j.z + vz * dt;
  if (trail.z - z > R.maxGap) {
    z = trail.z - R.maxGap;
    vz = Math.max(vz, 0);
  }
  const x = clamp(j.x + vx * dt, trail.x - R.maxSide, trail.x + R.maxSide);
  const y = clamp(j.y + vy * dt, trail.y - R.maxSide, trail.y + R.maxSide);
  return { x, y, z, vx, vy, vz };
}

/** Unit vector from the probe to the basket (straight up when centred). */
function awayDir(s: RefuelState): { x: number; y: number } {
  const o = offsetOf(s);
  const e = Math.hypot(o.x, o.y);
  return e > 1e-6 ? { x: o.x / e, y: o.y / e } : { x: 0, y: 1 };
}

const KICK: Readonly<Record<RefuelEventKind, { away: number; up: number }>> = {
  contact: { away: 0, up: 0 },
  miss: { away: R.missKick, up: 0 },
  tooFast: { away: R.fastKick, up: R.fastKick },
  tooSoft: { away: R.softKick, up: 0 },
  slack: { away: R.missKick, up: R.fastKick },
  droppedOff: { away: 0, up: 0 },
  brokeOff: { away: R.softKick, up: 0 },
};

/** A failed contact or a disconnect: the basket is knocked, the jet backs off. */
function fail(s: RefuelState, event: RefuelEvent, swing: Swing, trail: Vec3): RefuelState {
  const d = awayDir({ ...s, trail });
  const k = KICK[event.kind];
  const kicked = { ...swing, vx: swing.vx + d.x * k.away, vy: swing.vy + d.y * k.away + k.up };
  const soft = event.kind === 'tooSoft' || event.kind === 'droppedOff';
  return {
    ...s, phase: 'backoff', trail, swing: kicked, push: 0, valve: 0, event, events: s.events + 1,
    backoffTo: soft ? R.softGap : R.backoffGap,
  };
}

function approachStep(s: RefuelState, prevGap: number): RefuelState {
  if (!(prevGap > 0 && s.gap <= 0)) return s;
  const o = offsetOf(s);
  const offset = Math.hypot(o.x, o.y);
  const kind = judgeContact(offset, s.closure);
  const event: RefuelEvent = { kind, t: s.t, offset, closure: s.closure };
  if (kind !== 'contact') return fail(s, event, s.swing, s.trail);
  return { ...s, phase: 'contact', push: Math.max(0, -s.gap), contacts: s.contacts + 1, event, events: s.events + 1 };
}

function disconnectKind(s: RefuelState, push: number): DisconnectKind | null {
  const h = holdOf(s);
  if (push < 0) return 'droppedOff';
  if (push > R.slackMax) return 'slack';
  if (Math.abs(h.x) > R.boxX || Math.abs(h.y) > R.boxY) return 'brokeOff';
  return null;
}

function contactStep(s: RefuelState, dt: number): RefuelState {
  const push = -s.gap;
  const kind = disconnectKind(s, push);
  if (kind) {
    // released where the probe is: the basket springs back to its trail from there
    const h = holdOf(s);
    const swing = { ...s.swing, x: s.swing.x + h.x, y: s.swing.y + h.y };
    const trail = { ...s.trail, x: s.jet.x, y: s.jet.y };
    const failed = fail(s, { kind, t: s.t, offset: Math.hypot(h.x, h.y), closure: s.closure }, swing, trail);
    return { ...failed, disconnects: s.disconnects + 1 };
  }
  const open = push >= R.flowMin && push <= R.flowMax;
  const valve = open ? Math.min(1, s.valve + dt / R.flowRamp) : Math.max(0, s.valve - dt / R.flowClose);
  return { ...s, push, valve, fuel: s.fuel + R.flowRate * valve * dt };
}

function phaseStep(s: RefuelState, prevGap: number, dt: number): RefuelState {
  switch (s.phase) {
    case 'approach': return approachStep(s, prevGap);
    case 'contact': return contactStep(s, dt);
    case 'backoff': return s.gap >= s.backoffTo ? { ...s, phase: 'approach' } : s;
    case 'over': return s;
    default: throw new Error(`unhandled: ${s.phase satisfies never}`);
  }
}

export function stepRefuel(s: RefuelState, input: RefuelInput, dt: number): RefuelState {
  if (s.phase === 'over') return s;
  const t = s.t + dt;
  const rough = ease(s.rough, roughTarget(t, s.contacts), AIR.roughK, dt);
  const swing = stepSwing(s.swing, dt);
  const trail = trailAt(s.air, t, rough * s.turbulence, swing);
  const jet = moveJet(s, input, trail, dt);
  const gap = trail.z - jet.z;
  const moved: RefuelState = { ...s, t, rough, swing, trail, jet, gap, closure: (s.gap - gap) / dt };
  const next = phaseStep(moved, s.gap, dt);
  return t >= R.roundTime - 1e-9 ? { ...next, phase: 'over', valve: 0 } : next;
}
