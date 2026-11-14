import { HELI_FLIGHT, type Vec } from './heli-flight';
import { MECH_WALK } from './mech-walk';
import { TANK_DRIVE } from './tank-drive';
import type { FleetKitId } from '../data/fleet';
import type { CampaignId } from '../data/types';

// How a sub moves in the top-down mission (doc 67): the seabed scrolls slower still, and the sub glides on in the
// water — it eases toward the stick more slowly than a helicopter; plus the Type 212's sonar burst. Pure.

export const SUB_FLIGHT = Object.freeze({
  /** World scroll on map 4 (under the sea, doc 74), share of the jets'. */
  scroll: 0.65,
  /** How fast the velocity closes on the stick: share of the gap per second (the helicopter's is 6). */
  accel: 3.5,
});

/** A fleet craft's next velocity: eased toward `stick × speed` (stick components −1…1) at `accel`. */
export function fleetVelocity(v: Vec, stick: Vec, speed: number, accel: number, dt: number): Vec {
  const k = 1 - Math.exp(-accel * dt);
  return { x: v.x + (stick.x * speed - v.x) * k, y: v.y + (stick.y * speed - v.y) * k };
}

/** How quickly each fleet kit's craft close on the stick (docs 50, 67). */
export const DRIFT: Readonly<Record<FleetKitId, number>> = {
  heli: HELI_FLIGHT.accel, sub: SUB_FLIGHT.accel, mech: MECH_WALK.accel, tank: TANK_DRIVE.accel.tank,
};

/** The world's scroll factor on a map: slower for the helicopters (doc 50), the subs, the walking mechs (doc 80) and the
 *  driving tanks (doc 104). */
const SCROLL: Readonly<Record<CampaignId, number>> = {
  1: 1, 2: 1, 3: HELI_FLIGHT.scroll, 4: SUB_FLIGHT.scroll, 5: 1, 6: MECH_WALK.scroll, 7: TANK_DRIVE.scroll,
};
export const flightScroll = (c: CampaignId): number => SCROLL[c];

/** Sonar Burst (doc 67): the ring's reach (px), how long it takes to get there (s), the damage to what it reaches. */
export const SONAR = Object.freeze({ reach: 300, time: 0.6, damage: 60 });

/** The ring's radius `t` seconds after the ping. */
export const sonarRadius = (t: number): number => SONAR.reach * Math.min(1, Math.max(0, t) / SONAR.time);

/** The targets the ring crossed between two radii: further out than `r0`, no further than `r1`. */
export function sonarHits<T extends Vec>(targets: readonly T[], from: Vec, r0: number, r1: number): T[] {
  return targets.filter((e) => {
    const d = Math.hypot(e.x - from.x, e.y - from.y);
    return d > r0 && d <= r1;
  });
}
