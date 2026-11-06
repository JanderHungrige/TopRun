// How a helicopter flies in the top-down mission (doc 50): the ground scrolls slower, and the helicopter eases toward
// the stick instead of moving at once; plus the Apache's Longbow target choice. Pure.

export const HELI_FLIGHT = Object.freeze({
  /** World scroll on map 3, share of the jets' (doc 50). */
  scroll: 0.75,
  /** How fast the velocity closes on the stick: share of the gap per second. */
  accel: 6,
});

export interface Vec { x: number; y: number }

/** The helicopter's next velocity: eased toward `stick × speed` (stick components −1…1). */
export function heliVelocity(v: Vec, stick: Vec, speed: number, dt: number): Vec {
  const k = 1 - Math.exp(-HELI_FLIGHT.accel * dt);
  return { x: v.x + (stick.x * speed - v.x) * k, y: v.y + (stick.y * speed - v.y) * k };
}

/** Longbow Salvo (doc 50): at most this many targets, one Hellfire each. */
export const LONGBOW = Object.freeze({ max: 4 });

/** The targets the Longbow radar locks: the nearest first, at most LONGBOW.max. */
export function longbowTargets<T extends Vec>(candidates: readonly T[], from: Vec): T[] {
  return [...candidates]
    .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))
    .slice(0, LONGBOW.max);
}
