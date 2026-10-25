import { clamp, type Vec } from '../../core/math';
import type { PlaneId } from '../../data/types';
import type { Medals } from './core';
import { leadPose, ROUND_END, SHOW_END, SHOW_START, SMOKE_OFF, SMOKE_ON, smokeOn, type LeadPose } from './formation-script';

// Formation Flying (doc 14): slots, your jet's inertia and turn drift, zones and scoring. Pure.

export const ACCEL = 400;
export const DRAG = 1.6;
export const INNER_R = 18;
export const OUTER_R = 40;
export const INNER_RATE = 100;
export const OUTER_RATE = 50;
export const SMOKE_MULT = 2;
/** The slot spreads with altitude: the jets come closer to the camera in the pitch-up. */
export const ALT_GROW = 0.22;
/** Look-ahead of the prediction pip, s. */
export const PREDICT_T = 0.5;
/** Closer than this to the lead's centre: Duke wants room. */
export const CROWD_R = 70;
/** Start offset from the slot (x mirrored for a left wing): the join-up. */
export const JOIN_FROM = { x: 70, y: 120 } as const;
export const BOUNDS = { x0: 40, x1: 1240, y0: 90, y1: 690 } as const;
/** Jet wash: peak deterministic bump on your jet in px/s (two sines per axis). */
export const WASH = 45;
export const MAX_POINTS = INNER_RATE * (SHOW_END - SHOW_START) + INNER_RATE * (SMOKE_MULT - 1) * (SMOKE_OFF - SMOKE_ON);
export const FORMATION_MEDALS: Medals = { bronze: 2000, silver: 4000, gold: 5700 };

export type SlotId = 'right' | 'left';
export type Zone = 'inner' | 'outer' | 'out';
export type Stick = Vec;

/** Right-wing offset from the lead's centre per pilot jet (behind = +y), so the wingtips never touch. */
const SLOT_BASE: Readonly<Record<PlaneId, Vec>> = { f16: { x: 94, y: 72 }, f14: { x: 106, y: 74 }, sr71: { x: 100, y: 90 } };
const SIDE: Readonly<Record<SlotId, number>> = { right: 1, left: -1 };

export interface WingSpec {
  slot: SlotId;
  plane: PlaneId;
}

export interface WingState extends WingSpec {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Distance to the slot and to the lead's centre, px. */
  dist: number;
  leadDist: number;
  zone: Zone;
  points: number;
  /** Seconds in a row out of the slot / in the inner zone (scored time only). */
  outT: number;
  innerT: number;
}

export interface FormationState {
  t: number;
  /** The formation's heading change since GO, rad (+ = right): the sea turns with it. */
  heading: number;
  /** Jet-wash strength, 1 = normal, 0 = calm air (reference pilots in the tests). */
  wash: number;
  wings: readonly WingState[];
  done: boolean;
}

export const slotOffset = (slot: SlotId, plane: PlaneId): Vec => ({ x: SLOT_BASE[plane].x * SIDE[slot], y: SLOT_BASE[plane].y });

export function slotPoint(lead: Pick<LeadPose, 'x' | 'y' | 'yaw' | 'alt'>, slot: SlotId, plane: PlaneId): Vec {
  const o = slotOffset(slot, plane);
  const k = 1 + ALT_GROW * lead.alt;
  const c = Math.cos(lead.yaw);
  const s = Math.sin(lead.yaw);
  return { x: lead.x + (o.x * c - o.y * s) * k, y: lead.y + (o.x * s + o.y * c) * k };
}

export const zoneFor = (d: number): Zone => (d <= INNER_R ? 'inner' : d <= OUTER_R ? 'outer' : 'out');

const scored = (t: number): boolean => t > SHOW_START && t <= SHOW_END;

/** Points per second for a zone at time t (0 outside the show, ×2 with the smoke on). */
export function pointRate(zone: Zone, t: number): number {
  if (!scored(t)) return 0;
  const mult = smokeOn(t) ? SMOKE_MULT : 1;
  switch (zone) {
    case 'inner': return INNER_RATE * mult;
    case 'outer': return OUTER_RATE * mult;
    case 'out': return 0;
    default: throw new Error(`unhandled: ${zone satisfies never}`);
  }
}

/** The best possible score up to time t. */
export function maxPointsUntil(t: number): number {
  const show = clamp(t, SHOW_START, SHOW_END) - SHOW_START;
  const smoke = clamp(t, SMOKE_ON, SMOKE_OFF) - SMOKE_ON;
  return INNER_RATE * show + INNER_RATE * (SMOKE_MULT - 1) * smoke;
}

function measure(w: WingState, lead: LeadPose): WingState {
  const at = slotPoint(lead, w.slot, w.plane);
  const dist = Math.hypot(w.x - at.x, w.y - at.y);
  return { ...w, dist, leadDist: Math.hypot(w.x - lead.x, w.y - lead.y), zone: zoneFor(dist) };
}

function startWing(spec: WingSpec, lead: LeadPose): WingState {
  const at = slotPoint(lead, spec.slot, spec.plane);
  const x = at.x + JOIN_FROM.x * SIDE[spec.slot];
  const y = at.y + JOIN_FROM.y;
  return measure({ ...spec, x, y, vx: 0, vy: 0, dist: 0, leadDist: 0, zone: 'out', points: 0, outT: 0, innerT: 0 }, lead);
}

/** Wings fly in the given slots; the game uses one ('right'), co-op would add a 'left' wing. */
export function createFormation(wings: readonly WingSpec[], wash = 1): FormationState {
  const lead = leadPose(0);
  return { t: 0, heading: 0, wash, wings: wings.map((w) => startWing(w, lead)), done: false };
}

function unitStick(stick: Stick): Vec {
  const x = Number.isFinite(stick.x) ? stick.x : 0;
  const y = Number.isFinite(stick.y) ? stick.y : 0;
  const len = Math.hypot(x, y);
  return len > 1 ? { x: x / len, y: y / len } : { x, y };
}

/** Jet wash from the lead at time t (px/s), deterministic; different per slot. */
export function jetWash(t: number, slot: SlotId): Vec {
  const p = slot === 'right' ? 0 : 1.7;
  return {
    x: WASH * (0.6 * Math.sin(1.3 * t + 0.4 + p) + 0.4 * Math.sin(3.7 * t + 2.1 + p)),
    y: WASH * (0.6 * Math.sin(1.1 * t + 1.9 + p) + 0.4 * Math.sin(3.1 * t + 0.2 + p)),
  };
}

/** Inertia (exact exponential drag per tick), turn drift around the lead, jet wash, the screen edges. */
function flyWing(w: WingState, stick: Stick, lead: LeadPose, wash: Vec, dt: number): WingState {
  const u = unitStick(stick);
  const decay = Math.exp(-DRAG * dt);
  const vx = (u.x * ACCEL) / DRAG + (w.vx - (u.x * ACCEL) / DRAG) * decay;
  const vy = (u.y * ACCEL) / DRAG + (w.vy - (u.y * ACCEL) / DRAG) * decay;
  const rx = w.x - lead.x;
  const ry = w.y - lead.y;
  const x = w.x + ((w.vx + vx) / 2 + lead.turn * ry + wash.x) * dt;
  const y = w.y + ((w.vy + vy) / 2 - lead.turn * rx + wash.y) * dt;
  const cx = clamp(x, BOUNDS.x0, BOUNDS.x1);
  const cy = clamp(y, BOUNDS.y0, BOUNDS.y1);
  return { ...w, x: cx, y: cy, vx: cx === x ? vx : 0, vy: cy === y ? vy : 0 };
}

function stepWing(w: WingState, stick: Stick, lead: LeadPose, s: FormationState, dt: number): WingState {
  const t = s.t + dt;
  const b = jetWash(t, w.slot);
  const m = measure(flyWing(w, stick, lead, { x: b.x * s.wash, y: b.y * s.wash }, dt), lead);
  const counts = scored(t);
  return {
    ...m,
    points: m.points + pointRate(m.zone, t) * dt,
    outT: counts && m.zone === 'out' ? m.outT + dt : 0,
    innerT: counts && m.zone === 'inner' ? m.innerT + dt : 0,
  };
}

/** One tick; `sticks[i]` steers wing i (missing = centred). */
export function stepFormation(s: FormationState, sticks: readonly Stick[], dt: number): FormationState {
  if (s.done) return s;
  const t = s.t + dt;
  const lead = leadPose(t);
  const wings = s.wings.map((w, i) => stepWing(w, sticks[i] ?? { x: 0, y: 0 }, lead, s, dt));
  return { ...s, t, heading: s.heading + lead.turn * dt, wings, done: t >= ROUND_END - 1e-9 };
}

/** Where wing i coasts to in `T` s with the stick centred (the prediction pip). */
export function predict(s: FormationState, i: number, T = PREDICT_T): Vec {
  const w = s.wings[i];
  if (!w) return { x: 0, y: 0 };
  const lead = leadPose(s.t);
  const f = (1 - Math.exp(-DRAG * T)) / DRAG;
  return { x: w.x + w.vx * f + lead.turn * (w.y - lead.y) * T, y: w.y + w.vy * f - lead.turn * (w.x - lead.x) * T };
}

/** Points so far over the best possible so far (1 before the show starts). */
export function rating(s: FormationState, i: number): number {
  const max = maxPointsUntil(s.t);
  return max > 0 ? clamp((s.wings[i]?.points ?? 0) / max, 0, 1) : 1;
}

export const finalScore = (s: FormationState, i = 0): number => Math.round(s.wings[i]?.points ?? 0);
