import type { Medals } from './core';
import { createJet, flyJet, type EvJet } from './evasion-flight';
import {
  DECOY, decoyChance, launchMissile, SEEKER, stepMissile, tailAngle, type Missile, type MissileKind,
} from './evasion-missiles';
import { planWave, rand, WAVES, waveMul, type PendingLaunch, type Side } from './evasion-waves';

// Missile Evasion (doc 16): the round — waves of homing missiles, flares, high-G breaks, hull, score
// (missiles evaded). Pure and deterministic for a seed; each step lists its events for the scene.

export const EVASION_RULES = Object.freeze({
  roundTime: 90,
  hull: 3,
  /** Seconds after a hit in which further missiles do no damage. */
  grace: 1.2,
  flareCharges: 3,
  /** Seconds per recharged flare charge. */
  flareRecharge: 4,
  flareLife: 2,
});
const R = EVASION_RULES;

export const EVASION_MEDALS: Readonly<Medals> = Object.freeze({ bronze: 12, silver: 24, gold: 38 });

export type EndReason = 'down' | 'time';
export type EvadeHow = 'overshoot' | 'burnout' | 'decoyed';

export type EvasionEvent =
  | { type: 'wave'; wave: number }
  | { type: 'warn'; kind: MissileKind; side: Side; x: number; y: number }
  | { type: 'launch'; id: number; kind: MissileKind; side: Side; x: number; y: number }
  | { type: 'flare'; x: number; y: number }
  | { type: 'break' }
  | { type: 'evaded'; id: number; how: EvadeHow; x: number; y: number }
  | { type: 'resisted'; id: number; x: number; y: number }
  | { type: 'hit'; id: number; x: number; y: number; damage: boolean }
  | { type: 'pop'; id: number; x: number; y: number; blast: boolean }
  | { type: 'over'; reason: EndReason };

export interface Flare { id: number; x: number; y: number; vx: number; vy: number; ttl: number }

/** One tick of input: the pushed screen direction (length ≤ 1), flare / break pressed this tick. */
export interface EvasionInput { steerX: number; steerY: number; flare: boolean; brk: boolean }
export const NO_INPUT: EvasionInput = Object.freeze({ steerX: 0, steerY: 0, flare: false, brk: false });

export interface EvasionState {
  t: number;
  seed: number;
  /** False = drill mode without waves (tests). */
  waves: boolean;
  jet: EvJet;
  hull: number;
  grace: number;
  charges: number;
  /** Seconds towards the next flare charge. */
  recharge: number;
  flares: readonly Flare[];
  missiles: readonly Missile[];
  pending: readonly PendingLaunch[];
  /** Current wave, 0 before the first. */
  wave: number;
  /** Seconds since the current wave was resolved. */
  idle: number;
  nextId: number;
  evaded: number;
  /** Damaging hits taken. */
  hits: number;
  over: EndReason | null;
  /** What happened in the last step. */
  events: readonly EvasionEvent[];
}

export const createEvasion = (seed: number, waves = true): EvasionState => ({
  t: 0, seed: (seed ^ 0x9e3779b9) >>> 0, waves, jet: createJet(), hull: R.hull, grace: 0, charges: R.flareCharges, recharge: 0,
  flares: [], missiles: [], pending: [], wave: 0, idle: 0, nextId: 1, evaded: 0, hits: 0, over: null, events: [],
});

function recharge(s: EvasionState, dt: number): EvasionState {
  if (s.charges >= R.flareCharges) return { ...s, recharge: 0 };
  const r = s.recharge + dt;
  return r >= R.flareRecharge ? { ...s, charges: s.charges + 1, recharge: r - R.flareRecharge } : { ...s, recharge: r };
}

/** A flare pack: two flares behind the jet, one decoy roll per tracking missile in range. */
function releaseFlares(s: EvasionState, events: EvasionEvent[]): EvasionState {
  if (s.charges <= 0) return s;
  const j = s.jet;
  const bx = -Math.sin(j.heading);
  const by = Math.cos(j.heading);
  const x = j.x + bx * 16;
  const y = j.y + by * 16;
  const flares = [-1, 1].map((side, i): Flare => ({
    id: s.nextId + i, x, y, ttl: R.flareLife,
    vx: j.vx * 0.3 + bx * 60 - by * side * 90, vy: j.vy * 0.3 + by * 60 + bx * side * 90,
  }));
  events.push({ type: 'flare', x, y });
  let seed = s.seed;
  let evaded = s.evaded;
  const missiles = s.missiles.map((m, i): Missile => {
    if (m.mode !== 'tracking' || Math.hypot(m.x - j.x, m.y - j.y) > DECOY.range) return m;
    const [r, next] = rand(seed);
    seed = next;
    if (r >= decoyChance(tailAngle(j, m.x, m.y))) {
      events.push({ type: 'resisted', id: m.id, x: m.x, y: m.y });
      return m;
    }
    evaded++;
    events.push({ type: 'evaded', id: m.id, how: 'decoyed', x: m.x, y: m.y });
    return { ...m, mode: 'decoyed', modeT: 0, flare: flares[i % 2]?.id ?? null };
  });
  return { ...s, seed, evaded, missiles, charges: s.charges - 1, nextId: s.nextId + 2, flares: [...s.flares, ...flares] };
}

function moveFlares(s: EvasionState, dt: number): EvasionState {
  if (s.flares.length === 0) return s;
  const flares = s.flares
    .map((f) => ({ ...f, x: f.x + f.vx * dt, y: f.y + f.vy * dt, vx: f.vx * (1 - 1.5 * dt), vy: f.vy * (1 - 1.5 * dt), ttl: f.ttl - dt }))
    .filter((f) => f.ttl > 0);
  return { ...s, flares };
}

/** Warnings and launches of the current wave; the next wave once this one is resolved. */
function runWaves(s: EvasionState, events: EvasionEvent[], dt: number): EvasionState {
  const j = s.jet;
  const pending: PendingLaunch[] = [];
  const missiles = [...s.missiles];
  let nextId = s.nextId;
  for (const p of s.pending) {
    const x = j.x + p.offset.x;
    const y = j.y + p.offset.y;
    if (!p.warned && s.t >= p.at - WAVES.warn) events.push({ type: 'warn', kind: p.kind, side: p.side, x, y });
    if (s.t < p.at) {
      pending.push(p.warned ? p : { ...p, warned: s.t >= p.at - WAVES.warn });
      continue;
    }
    missiles.push(launchMissile(nextId, p.kind, p.wave, x, y, j.x, j.y, waveMul(p.wave)));
    events.push({ type: 'launch', id: nextId, kind: p.kind, side: p.side, x, y });
    nextId++;
  }
  const st = { ...s, pending, missiles, nextId };
  if (pending.length > 0 || missiles.some((m) => m.mode === 'tracking')) return { ...st, idle: 0 };
  const idle = s.idle + dt;
  if (s.wave === 0 ? s.t < WAVES.first : idle < WAVES.gap) return { ...st, idle };
  const plan = planWave(s.wave + 1, s.t, s.seed);
  events.push({ type: 'wave', wave: s.wave + 1 });
  return { ...st, idle: 0, wave: s.wave + 1, pending: plan.launches, seed: plan.seed };
}

/** Closest approach of the missile to the jet during the tick (both moving linearly) is within the hit radius. */
function hitDuring(m0: Missile, m1: Missile, j0: EvJet, j1: EvJet): boolean {
  const ax = m0.x - j0.x;
  const ay = m0.y - j0.y;
  const dx = m1.x - j1.x - ax;
  const dy = m1.y - j1.y - ay;
  const len2 = dx * dx + dy * dy;
  const k = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
  return Math.hypot(ax + dx * k, ay + dy * k) <= SEEKER.hitRadius;
}

function moveMissiles(s: EvasionState, prevJet: EvJet, events: EvasionEvent[], dt: number): EvasionState {
  let { hull, grace, evaded, hits } = s;
  const missiles: Missile[] = [];
  for (const m of s.missiles) {
    const flare = m.flare === null ? null : s.flares.find((f) => f.id === m.flare) ?? null;
    const step = stepMissile(m, s.jet, flare, dt);
    if (m.mode === 'tracking' && step.m && hitDuring(m, step.m, prevJet, s.jet)) {
      const damage = grace <= 0;
      if (damage) {
        hull--;
        hits++;
        grace = R.grace;
      }
      events.push({ type: 'hit', id: m.id, x: step.m.x, y: step.m.y, damage });
      continue;
    }
    const at = step.m ?? m;
    if (step.event === 'overshoot' || step.event === 'burnout') {
      evaded++;
      events.push({ type: 'evaded', id: m.id, how: step.event, x: at.x, y: at.y });
    }
    if (step.event === 'pop' || step.event === 'fizzle') events.push({ type: 'pop', id: m.id, x: at.x, y: at.y, blast: step.event === 'pop' });
    if (step.m) missiles.push(step.m);
  }
  return { ...s, missiles, hull, grace, evaded, hits };
}

function finish(s: EvasionState, events: EvasionEvent[]): EvasionState {
  if (s.hull <= 0) {
    events.push({ type: 'over', reason: 'down' });
    return { ...s, hull: 0, over: 'down', events };
  }
  if (s.t < R.roundTime) return { ...s, events };
  for (const m of s.missiles) events.push({ type: 'pop', id: m.id, x: m.x, y: m.y, blast: true });
  events.push({ type: 'over', reason: 'time' });
  return { ...s, missiles: [], pending: [], over: 'time', events };
}

export function stepEvasion(s: EvasionState, input: EvasionInput, dt: number): EvasionState {
  if (s.over) return s.events.length > 0 ? { ...s, events: [] } : s;
  const events: EvasionEvent[] = [];
  const jet = flyJet(s.jet, { x: input.steerX, y: input.steerY }, input.brk, dt);
  if (input.brk && s.jet.breakCd <= 0) events.push({ type: 'break' });
  let st: EvasionState = recharge({ ...s, t: s.t + dt, jet, grace: Math.max(0, s.grace - dt) }, dt);
  if (input.flare) st = releaseFlares(st, events);
  st = moveFlares(st, dt);
  if (st.waves) st = runWaves(st, events, dt);
  return finish(moveMissiles(st, s.jet, events, dt), events);
}
