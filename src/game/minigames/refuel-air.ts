import { TAU } from '../../core/math';
import { createRng } from '../../core/rng';

// Air Refuelling turbulence (doc 15): the drogue basket's seeded, smooth wander, how rough the air is,
// and the damped swing of a basket that was knocked or released. Pure.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** One sine component: amplitude (m), angular frequency (rad/s), phase (rad). */
export interface AirWave {
  a: number;
  w: number;
  p: number;
}

export interface AirModel {
  x: readonly AirWave[];
  y: readonly AirWave[];
  z: readonly AirWave[];
}

/** Basket swing: offset (m) and velocity (m/s) on top of the wander, x / y. */
export interface Swing {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const AIR = Object.freeze({
  /** Roughness at the start of the round … */
  roughStart: 0.8,
  /** … plus this much over the full minute. */
  roughTime: 1.2,
  /** Roughness added per contact after the first, up to `roughContactCap` of them. */
  roughContact: 0.25,
  roughContactCap: 3,
  /** Roughness eases to its target at this rate (1/s). */
  roughK: 0.5,
  /** Swing spring (1/s²) and damping (1/s). */
  swingK: 7,
  swingDamp: 2.2,
  roundTime: 60,
});

export const NO_SWING: Swing = Object.freeze({ x: 0, y: 0, vx: 0, vy: 0 });

/** Periods (s) and amplitudes (m) per axis; each period is jittered ×0.85…1.15 by the seed. */
const SPEC: Readonly<Record<keyof AirModel, readonly (readonly [number, number])[]>> = {
  x: [[11, 0.3], [5.3, 0.17], [2.9, 0.07]],
  y: [[9, 0.22], [4.6, 0.13], [2.3, 0.05]],
  z: [[7, 0.2], [3.1, 0.08]],
};

export function createAir(seed: number): AirModel {
  const rng = createRng(seed ^ 0x2f6b9a1d);
  const waves = (spec: readonly (readonly [number, number])[]): AirWave[] =>
    spec.map(([period, a]) => ({ a, w: TAU / (period * rng.range(0.85, 1.15)), p: rng.range(0, TAU) }));
  return { x: waves(SPEC.x), y: waves(SPEC.y), z: waves(SPEC.z) };
}

const sum = (waves: readonly AirWave[], t: number): number => waves.reduce((acc, w) => acc + w.a * Math.sin(w.w * t + w.p), 0);

/** The basket's wander at roughness 1 (m from its nominal trail position). */
export const wander = (air: AirModel, t: number): Vec3 => ({ x: sum(air.x, t), y: sum(air.y, t), z: sum(air.z, t) });

/** Roughness the air is heading for: rises through the minute and with each contact after the first. */
export function roughTarget(t: number, contacts: number): number {
  const later = Math.min(Math.max(contacts - 1, 0), AIR.roughContactCap);
  return AIR.roughStart + (AIR.roughTime * Math.min(t, AIR.roundTime)) / AIR.roundTime + AIR.roughContact * later;
}

/** One semi-implicit step of the damped spring that pulls a swinging basket back to its trail. */
export function stepSwing(s: Swing, dt: number): Swing {
  const vx = s.vx + (-AIR.swingK * s.x - AIR.swingDamp * s.vx) * dt;
  const vy = s.vy + (-AIR.swingK * s.y - AIR.swingDamp * s.vy) * dt;
  return { x: s.x + vx * dt, y: s.y + vy * dt, vx, vy };
}
