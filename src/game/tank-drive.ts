import { VEHICLE, type VehicleKind } from '../data/tank-kit';
import type { PlaneId } from '../data/types';

// How the tanks and buggies drive in the top-down mission (doc 104): the steppe scrolls at a driving pace, a buggy closes
// on the stick quickly and slides into its turns, a tank gets going and stops late; the hull turns toward where it goes,
// and both leave marks in the grass. Plus the Jackal's nitro and the Bison's main gun. Pure.

export const TANK_DRIVE = Object.freeze({
  /** World scroll on map 7, share of the jets'. */
  scroll: 0.7,
  /** How fast the velocity closes on the stick: share of the gap per second, by kind of vehicle. */
  accel: Object.freeze({ buggy: 6, tank: 3.2 } satisfies Record<VehicleKind, number>),
  /** The hull's lean toward where it goes, at most (rad). */
  maxYaw: (22 * Math.PI) / 180,
  /** Ground covered between two sets of marks (px), and how long a mark stays (s). */
  markEvery: 10,
  markLife: 4,
});

/** Buggy or tank; anything else drives like a tank. */
export const vehicleOf = (id: PlaneId): VehicleKind => (id in VEHICLE ? VEHICLE[id as keyof typeof VEHICLE] : 'tank');

export const driveAccel = (id: PlaneId): number => TANK_DRIVE.accel[vehicleOf(id)];

/** The hull's angle (rad, + = right) for a velocity: toward where it goes, never more than `maxYaw` off straight up;
 *  straight when (nearly) standing. A buggy reverses nose-first, so going down still leans the way it steers. */
export function hullYaw(vx: number, vy: number): number {
  const speed = Math.hypot(vx, vy);
  if (speed < 12) return 0;
  const angle = Math.atan2(vx, Math.abs(vy) + speed * 0.35);
  return Math.max(-TANK_DRIVE.maxYaw, Math.min(TANK_DRIVE.maxYaw, angle));
}

/** The bob of the body (px) at a point of the drive: a buggy bounces quickly, a tank rumbles. */
export function bounce(kind: VehicleKind, driven: number, speed: number): number {
  if (speed < 12) return 0;
  return kind === 'buggy' ? Math.sin(driven * 0.21) * 1.2 : Math.sin(driven * 0.5) * 0.5;
}

/** Whether a new set of marks is due between two readings of the ground covered. */
export const markDue = (before: number, after: number): boolean =>
  Math.floor(after / TANK_DRIVE.markEvery) > Math.floor(before / TANK_DRIVE.markEvery);

/** The marks a vehicle leaves, as offsets across its body (px): two tracks or four tyres. */
export const markOffsets = (kind: VehicleKind): readonly number[] => (kind === 'tank' ? [-11, 11] : [-12, -7, 7, 12]);

/** The Jackal's nitro: the speed factor and what it does to the ground enemies it touches. */
export const NITRO = Object.freeze({ speed: 2, ram: 120 });

/** The Bison's main gun: the shell's speed, the hit on what it meets and the burst round it. */
export const MAIN_GUN = Object.freeze({ speed: 900, damage: 420, splash: 140, radius: 90 });

/** The Lynx's sentry: rounds per second, damage per round, reach (px) and life (s). */
export const SENTRY = Object.freeze({ rate: 6, damage: 18, reach: 260, life: 12 });
