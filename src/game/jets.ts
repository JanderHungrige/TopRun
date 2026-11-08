import { FLEET, isFleet } from '../data/fleet';
import { MECH_BAY } from '../data/mech-kit';
import { PLANES } from '../data/planes';
import { MECH_IDS, type MechId, type PlaneId, type SpecialId } from '../data/types';
import { kitOfPlane } from './kit';
import { mapOpen, mapTwoOpen } from './progress';
import type { SaveData } from './save';

// Rules of the jets sold once map 2 is open, of the fleet kits (docs 49, 66), and of every plane's E ability (doc 36).

/** In the jets' hangar: map-1 jets always, the A-10, F-35 and Tornado once map 2 is open. In a fleet kit's hangar:
 *  its craft once its map is open (docs 49, 66); a mech once the mech bay can build it (doc 79). */
export function jetOnSale(save: SaveData, id: PlaneId): boolean {
  const p = PLANES[id];
  if (kitOfPlane(id) !== save.kit) return false;
  if (isFleet(p.kind)) return mapOpen(save, FLEET[p.kind].campaign) && save.outpost.buildings.mechbay >= mechBayFor(id);
  return p.campaign === 1 || mapTwoOpen(save);
}

export const isMech = (id: PlaneId): id is MechId => (MECH_IDS as readonly PlaneId[]).includes(id);

/** The mech bay level a craft needs: its own for a mech (doc 79), none for everything else. */
export const mechBayFor = (id: PlaneId): number => (isMech(id) ? MECH_BAY[id] : 0);

/** Map 2 is open but the pilot owns none of its jets yet: the crew chief points them out (doc 36). */
export function newJetsWaiting(save: SaveData): boolean {
  return save.kit === 'jet' && mapTwoOpen(save) && !save.ownedPlanes.some((id) => PLANES[id].campaign === 2);
}

export interface SpecialRules {
  /** The jet cannot be hit while the special runs. */
  invulnerable: boolean;
  /** Enemies hold fire and stop homing while the special runs. */
  stealth: boolean;
}

export function specialRules(special: SpecialId): SpecialRules {
  switch (special) {
    case 'roll':
    case 'dash':
    case 'jumpjet':
    case 'armour': return { invulnerable: true, stealth: false };
    case 'stealth': return { invulnerable: false, stealth: true };
    case 'wingman':
    case 'cannon':
    case 'nuke':
    case 'longbow':
    case 'gunpods':
    case 'sonar': return { invulnerable: false, stealth: false };
    default: throw new Error(`unhandled: ${special satisfies never}`);
  }
}

/** A-10 GAU-8 burst: rounds per second, base damage per round (× the jet's gun factor), jitter in radians. */
export const CANNON = Object.freeze({ roundsPerSec: 50, damage: 16, jitter: (1.5 * Math.PI) / 180 });

export const cannonDamage = (gunDamageMul: number): number => CANNON.damage * gunDamageMul;

/** The Tornado is the jet that ages during a mission. */
export const agingJet = (id: PlaneId): boolean => id === 'tornado';

/** Tornado age: share of maximum hull lost per second, and the floor the drain alone never goes below. */
export const AGE = Object.freeze({ perSec: 0.0015, floor: 0.1 });

/** The Tornado's hull after `dt` seconds of age drain (never below the floor, never raised by it). */
export function ageDrain(hull: number, maxHull: number, dt: number): number {
  const floor = maxHull * AGE.floor;
  if (hull <= floor) return hull;
  return Math.max(floor, hull - maxHull * AGE.perSec * dt);
}

/** Tornado nuke: boss shares, the missile's climb (s, px/s) and how long the burst lights the screen (s). */
export const NUKE = Object.freeze({ bossShare: 0.2, partShare: 0.5, flightSec: 1.2, climb: 260, burstSec: 1.4 });

export const nukeBossDamage = (maxHp: number): number => Math.round(maxHp * NUKE.bossShare);
export const nukePartDamage = (maxHp: number): number => Math.round(maxHp * NUKE.partShare);
