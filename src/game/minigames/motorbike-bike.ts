import { approach } from '../../core/math';

// Motorbike vs. Jet (doc 22): the bike — gears, rev meter, shift ratings, limiter, lean, drive, drag. Pure.
// Units: metres and seconds; x is the front wheel's distance from the start line.

export const GEARS = 6;
/** Speed at the redline per gear (m/s). */
export const GEAR_TOP: readonly number[] = [26, 38, 50, 62, 75, 90];
/** Drive at peak torque per gear (m/s²). */
export const GEAR_PULL: readonly number[] = [11, 9, 7.6, 6.4, 5.4, 4.6];
/** The rev meter never drops below idle (the clutch slips at a standstill). */
export const IDLE_RPM = 0.25;
/** Shift press zones on the rev meter: ignored below `ignore`, early below `green`, perfect up to `late`. */
export const SHIFT = { ignore: 0.55, green: 0.8, late: 0.92 } as const;
/** Torque left at the redline (it falls off past the green band). */
export const REDLINE_TORQUE = 0.6;
/** The gearbox shifts down by itself below this rev-meter reading: on the throttle / off it or braking. */
export const DOWNSHIFT_RPM = 0.35;
export const DOWNSHIFT_OFF_RPM = 0.6;
/** A perfect shift multiplies the drive for a moment; an early one bogs the engine down. */
export const BOOST = { mult: 1.6, time: 0.7 } as const;
export const BOG = { mult: 0.4, time: 0.35 } as const;
/** Seconds on the limiter before the gearbox shifts up by itself; it keeps bouncing down to LIMITER_DROP. */
export const LIMITER_TIME = 0.3;
const LIMITER_DROP = 0.97;
/** Air drag a = DRAG·v² sitting up; factors for a full tuck and a full wheelie. */
export const DRAG = 5e-4;
export const TUCK_DRAG = 0.7;
export const WHEELIE_DRAG = 1.15;
/** Share of the drive left on the back wheel. */
export const WHEELIE_DRIVE = 0.8;
export const ROLLING = 0.15;
export const ENGINE_BRAKE = 0.8;
export const BRAKE = 14;
/** Lean response per second. */
export const LEAN_RATE = { wheelieUp: 3.5, wheelieDown: 5, tuck: 4 } as const;

export type ShiftRating = 'perfect' | 'early' | 'late' | 'auto';
/** −1 = lean back (wheelie), 0 = sit, +1 = tuck. */
export type Lean = -1 | 0 | 1;

export interface Bike {
  x: number;
  v: number;
  /** 1 … GEARS. */
  gear: number;
  /** 0 … 1: front wheel lift. */
  wheelie: number;
  /** 0 … 1: chest on the tank. */
  tuck: number;
  /** Seconds of perfect-shift boost / early-shift bog left. */
  boost: number;
  bog: number;
  /** Seconds on the limiter so far. */
  limiter: number;
}

export interface BikeControls {
  /** 0 … 1. */
  throttle: number;
  brake: boolean;
  lean: Lean;
  shift: boolean;
  /** A mishap: no drive, no lean. */
  stunned: boolean;
}

export const createBike = (): Bike => ({ x: 0, v: 0, gear: 1, wheelie: 0, tuck: 0, boost: 0, bog: 0, limiter: 0 });

const redline = (gear: number): number => GEAR_TOP[gear - 1] ?? GEAR_TOP[GEARS - 1] ?? 1;

export const rpm = (b: Pick<Bike, 'v' | 'gear'>): number => Math.max(IDLE_RPM, b.v / redline(b.gear));

/** Torque share of the peak at this rev-meter reading. */
export function torque(r: number): number {
  if (r <= 0.3) return 0.5;
  if (r < SHIFT.green) return 0.5 + (0.5 * (r - 0.3)) / (SHIFT.green - 0.3);
  if (r <= SHIFT.late) return 1;
  return 1 - (1 - REDLINE_TORQUE) * Math.min(1, (r - SHIFT.late) / (1 - SHIFT.late));
}

/** What a shift press at this rev-meter reading counts as; null = ignored. */
export function shiftRating(r: number): Exclude<ShiftRating, 'auto'> | null {
  if (r < SHIFT.ignore) return null;
  if (r < SHIFT.green) return 'early';
  return r <= SHIFT.late ? 'perfect' : 'late';
}

function shiftUp(b: Bike, rating: ShiftRating): Bike {
  return {
    ...b, gear: b.gear + 1, limiter: 0,
    boost: rating === 'perfect' ? BOOST.time : 0, bog: rating === 'early' ? BOG.time : 0,
  };
}

function lean(b: Bike, c: BikeControls, dt: number): Bike {
  const back = c.lean === -1 && !c.stunned;
  const tuck = c.lean === 1 && !c.stunned;
  return {
    ...b,
    wheelie: c.stunned ? 0 : approach(b.wheelie, back ? 1 : 0, dt * (back ? LEAN_RATE.wheelieUp : LEAN_RATE.wheelieDown)),
    tuck: c.stunned ? 0 : approach(b.tuck, tuck ? 1 : 0, dt * LEAN_RATE.tuck),
  };
}

/** A shift press, or the gearbox shifting itself after the limiter. */
function gearbox(b: Bike, c: BikeControls, dt: number): { bike: Bike; shift: ShiftRating | null } {
  if (b.gear >= GEARS || c.stunned) return { bike: { ...b, limiter: 0 }, shift: null };
  const rating = c.shift ? shiftRating(rpm(b)) : null;
  if (rating) return { bike: shiftUp(b, rating), shift: rating };
  const bouncing = b.limiter > 0 && rpm(b) >= LIMITER_DROP && c.throttle > 0.05;
  if (rpm(b) < 1 && !bouncing) return { bike: { ...b, limiter: 0 }, shift: null };
  const limiter = b.limiter + dt;
  if (limiter >= LIMITER_TIME - 1e-9) return { bike: shiftUp(b, 'auto'), shift: 'auto' };
  return { bike: { ...b, limiter }, shift: null };
}

/** Forward acceleration from the engine (m/s²). */
export function drive(b: Bike, c: BikeControls): number {
  const r = rpm(b);
  if (c.stunned || r >= 1 || b.limiter > 0) return 0;
  const boost = b.boost > 0 ? BOOST.mult : 1;
  const bog = b.bog > 0 ? BOG.mult : 1;
  return c.throttle * (GEAR_PULL[b.gear - 1] ?? 0) * torque(r) * boost * bog * (1 - (1 - WHEELIE_DRIVE) * b.wheelie);
}

/** Deceleration from drag, rolling, engine braking and the brake (m/s²). */
export function resistance(b: Bike, c: BikeControls): number {
  const shape = (1 - (1 - TUCK_DRAG) * b.tuck) * (1 + (WHEELIE_DRAG - 1) * b.wheelie);
  const engine = c.throttle < 0.05 || c.stunned ? ENGINE_BRAKE : 0;
  return DRAG * shape * b.v * b.v + ROLLING + engine + (c.brake ? BRAKE : 0);
}

function downshift(b: Bike, c: BikeControls): Bike {
  const below = c.throttle > 0.3 && !c.brake && !c.stunned ? DOWNSHIFT_RPM : DOWNSHIFT_OFF_RPM;
  let gear = b.gear;
  while (gear > 1 && b.v / redline(gear) < below) gear--;
  return gear === b.gear ? b : { ...b, gear, limiter: 0 };
}

/** One tick of riding. */
export function stepBike(b0: Bike, c: BikeControls, dt: number): { bike: Bike; shift: ShiftRating | null } {
  const g = gearbox(lean(b0, c, dt), c, dt);
  const b = g.bike;
  const v = Math.max(0, b.v + (drive(b, c) - resistance(b, c)) * dt);
  const moved: Bike = {
    ...b, v, x: b.x + v * dt,
    boost: Math.max(0, b.boost - dt), bog: Math.max(0, b.bog - dt),
  };
  return { bike: downshift(moved, c), shift: g.shift };
}
