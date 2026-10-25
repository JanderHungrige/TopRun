import { clamp } from '../../core/math';
import type { PlaneId } from '../../data/types';

// Tower Flyby jet (doc 13): hull geometry and the flight step. Pure.

/** Drawing scale of the jet; hull points below are in plane units. */
export const JET_SCALE = 1.1;
export const SPEED = 900;
export const BURNER_SPEED = 1300;
/** Speed eases towards its target by min(1, k·dt). */
export const SPEED_RESP = 1.6;
export const MAX_PITCH = 0.3;
export const PITCH_RESP = 3.5;
export const BURNER_PITCH_RESP = 6;
export const PULL_UP_PITCH = 0.32;
/** Share of the forward speed that the pitch turns into climb. */
export const CLIMB = 0.6;
/** Ceiling for the draw origin: keeps the jet below the shell's top bar. */
export const MAX_ALT = 520;
export const FT_PER_PX = 0.4;
/** Bumpy air: peak vertical gust in px/s (two sines, phased per pass). */
export const GUST = 40;

/** Bottom outline of each jet, [x forward, y up] from the draw origin (main-gear contact), gear up. */
const HULL: Readonly<Record<PlaneId, readonly (readonly [number, number])[]>> = {
  f16: [[52, 18.6], [25.6, 8.6], [6, 8.2], [-37.8, 7.4], [-56, 15.4]],
  f14: [[62, 20.5], [17.5, 13.2], [-6, 12.4], [-41, 8.2], [-46.5, 8.8], [-65.6, 18.8]],
  sr71: [[80, 18.4], [15, 11.4], [-48, 11.4], [-60, 12.2], [-64, 17.6]],
};

export interface FlybyJet {
  /** Along the runway; the tower stands at x = 0. */
  x: number;
  /** Height of the draw origin above the ground. */
  alt: number;
  /** Radians, nose up positive. */
  pitch: number;
  speed: number;
  burner: boolean;
}

export interface FlybyInput {
  /** -1 … 1, +1 = nose up. */
  climb: number;
  burner: boolean;
}

/** Height above the ground of the jet's lowest point at this altitude and pitch. */
export function lowestPoint(plane: PlaneId, alt: number, pitch: number): number {
  const s = Math.sin(pitch);
  const c = Math.cos(pitch);
  let low = Infinity;
  for (const [px, py] of HULL[plane]) low = Math.min(low, px * s + py * c);
  return alt + low * JET_SCALE;
}

/** How far the jet reaches ahead of (front) and behind (back) its origin, in px. */
export function jetSpan(plane: PlaneId, pitch: number): { front: number; back: number } {
  const s = Math.sin(pitch);
  const c = Math.cos(pitch);
  let front = -Infinity;
  let back = Infinity;
  for (const [px, py] of HULL[plane]) {
    const x = px * c - py * s;
    front = Math.max(front, x);
    back = Math.min(back, x);
  }
  return { front: front * JET_SCALE, back: -back * JET_SCALE };
}

export const feet = (px: number): number => Math.round(px * FT_PER_PX);

/** 0 at normal speed … 1 with the afterburner fully spooled. */
export const burnerLevel = (speed: number): number => clamp((speed - SPEED) / (BURNER_SPEED - SPEED), 0, 1);

/** Vertical gust (px/s) at `t` seconds into pass `pass`; deterministic. */
export function gust(pass: number, t: number): number {
  return GUST * (0.6 * Math.sin(1.9 * t + 0.7 + pass * 2.3) + 0.4 * Math.sin(4.7 * t + 2 + pass * 1.1));
}

/** One tick of flight. `pullUp` takes the stick away and climbs out; `lift` is the gust in px/s. */
export function flyJet(jet: FlybyJet, input: FlybyInput, dt: number, pullUp: boolean, lift = 0): FlybyJet {
  const burner = input.burner;
  let target = pullUp ? PULL_UP_PITCH : clamp(input.climb, -1, 1) * MAX_PITCH;
  if (jet.alt >= MAX_ALT) target = Math.min(target, 0);
  const resp = burner ? BURNER_PITCH_RESP : PITCH_RESP;
  const pitch = jet.pitch + (target - jet.pitch) * Math.min(1, resp * dt);
  const speed = jet.speed + ((burner ? BURNER_SPEED : SPEED) - jet.speed) * Math.min(1, SPEED_RESP * dt);
  const alt = Math.min(MAX_ALT, jet.alt + (speed * Math.sin(pitch) * CLIMB + lift) * dt);
  return { x: jet.x + speed * dt, alt, pitch, speed, burner };
}
