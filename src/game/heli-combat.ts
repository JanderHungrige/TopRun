import { DOOR_GUN, GATLING_SPIN_DOWN, TURRET } from '../data/heli-arms';
import { circleHit } from './combat';

// The heli arsenal's combat math (doc 99), pure: the Gatling's spin, the turret's swivel, the door guns' arcs, the laser's
// aim, the sonic wave's front, painting, the HEDP burst and the energy weapons' recharge. Bearings: 0 = straight up the
// screen, positive = to the right, like a gun barrel's angle.

export interface Point { x: number; y: number }

const bearing = (from: Point, to: Point): number => Math.atan2(to.x - from.x, -(to.y - from.y));

/** One step of the barrels' spin (0 … 1): up over `spinUp` s while firing, down over GATLING_SPIN_DOWN s when not. */
export function spinStep(spin: number, firing: boolean, spinUp: number, dt: number): number {
  return firing ? Math.min(1, spin + dt / Math.max(0.01, spinUp)) : Math.max(0, spin - dt / GATLING_SPIN_DOWN);
}

/** The gun's rate multiplier at a spin: × 1 at rest, the full factor at full spin. */
export const spinRate = (spin: number, mul: number): number => 1 + (mul - 1) * spin;

/** The angle the turret adds to the rounds: the bearing of the nearest target ahead within range and swivel + slack,
 *  clamped to the swivel; 0 without one. */
export function turretAim(from: Point, targets: readonly Point[], swivel: number, range = TURRET.range): number {
  if (swivel <= 0) return 0;
  let best: number | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    if (t.y >= from.y) continue;
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    const b = bearing(from, t);
    if (d > range || Math.abs(b) > swivel + TURRET.slack || d >= bestD) continue;
    bestD = d;
    best = b;
  }
  return best === null ? 0 : Math.max(-swivel, Math.min(swivel, best));
}

/** The door gun on `side` (−1 left, 1 right): the nearest target in its arc within range, or null. */
export function doorTarget<T extends Point>(from: Point, targets: readonly T[], side: -1 | 1, range: number): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    const b = bearing(from, t) * side;
    if (d > range || d >= bestD || b < DOOR_GUN.from || b > DOOR_GUN.to) continue;
    bestD = d;
    best = t;
  }
  return best;
}

/** The laser's mark: the nearest target within the cone ahead and the range, or null. */
export function laserTarget<T extends Point>(from: Point, targets: readonly T[], cone: number, range: number): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    if (d > range || d >= bestD || t.y >= from.y || Math.abs(bearing(from, t)) > cone) continue;
    bestD = d;
    best = t;
  }
  return best;
}

/** The sonic wave's front ran from radius r0 to r1 this step: does it pass `p` (within `pad`, a target's size) inside
 *  its arc ahead? */
export function inWave(origin: Point, cone: number, r0: number, r1: number, p: Point, pad = 0): boolean {
  const d = Math.hypot(p.x - origin.x, p.y - origin.y);
  return d >= r0 - pad && d <= r1 + pad && Math.abs(bearing(origin, p)) <= cone;
}

/** A hit on a target still painted (`paintT` > 0) takes the tracer's bonus. */
export const paintedDamage = (amount: number, paintT: number, bonus: number): number => (paintT > 0 ? amount * (1 + bonus) : amount);

/** The enemies besides the one hit that an HEDP burst of `radius` reaches. */
export function splashTargets<T extends Point & { radius: number }>(hit: T, others: readonly T[], radius: number): T[] {
  return others.filter((o) => o !== hit && circleHit(hit.x, hit.y, radius, o.x, o.y, o.radius));
}

/** One step of an energy weapon: `charge` (0 … 1) fills over `recharge` s and becomes a whole charge, up to `max`. */
export function rechargeStep(ammo: number, charge: number, max: number, recharge: number, dt: number): { ammo: number; charge: number } {
  if (recharge <= 0) return { ammo, charge };
  if (ammo >= max) return { ammo: max, charge: 0 };
  const next = charge + dt / recharge;
  return next >= 1 ? { ammo: ammo + 1, charge: 0 } : { ammo, charge: next };
}
