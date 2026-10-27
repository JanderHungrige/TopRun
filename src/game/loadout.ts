import { ARMOR_BONUS, ENGINE_BONUS, FLARE_COUNT } from '../data/equipment';
import type { LiveryId } from '../data/liveries';
import { PLANES, type PlaneDef } from '../data/planes';
import type { GunLevel, SecondaryId } from '../data/types';
import { SECONDARIES, type WeaponRole } from '../data/weapons';
import { CHALLENGE } from './challenge';
import { doubleFirepower, jetGunLevel } from './firepower';
import type { SaveData } from './save';

export interface SecondaryAmmo {
  id: SecondaryId;
  ammo: number;
  /** Twin pods on a new jet: double ammo, both pods fire per trigger (doc 37). */
  twin: boolean;
}

export interface PlayerStats {
  plane: PlaneDef;
  maxHull: number;
  speed: number;
  gunLevel: GunLevel;
  /** Second gun of the new jets, 0 = none (doc 37). */
  gun2Level: number;
  gunDamageMul: number;
  secondaries: SecondaryAmmo[];
  flares: number;
  ecm: boolean;
  damageControl: boolean;
  magnet: boolean;
  /** Early-Warning Radar fitted (doc 02/05). */
  earlyWarning: boolean;
  /** Paint job of the selected jet (doc 09). */
  livery: LiveryId;
}

/** The single source of the player's combat stats for a mission. */
export function derivePlayerStats(save: SaveData): PlayerStats {
  const plane = PLANES[save.selectedPlane];
  const eq = save.equipment;
  const secondaries: SecondaryAmmo[] = [];
  const double = doubleFirepower(plane.id);
  for (const id of save.loadout[plane.id]) {
    if (id === null) continue;
    const twin = double && save.twinSecondaries.includes(id);
    const ammo = SECONDARIES[id].ammoPerSlot * (twin ? 2 : 1);
    const existing = secondaries.find((s) => s.id === id);
    if (existing) existing.ammo += ammo;
    else secondaries.push({ id, ammo, twin });
  }
  return {
    plane,
    maxHull: Math.round(plane.hull * (1 + (ARMOR_BONUS[eq.armor] ?? 0)) * (save.rookie ? CHALLENGE.rookie.hullMul : 1)),
    speed: Math.round(plane.speed * (1 + (ENGINE_BONUS[eq.engine] ?? 0))),
    gunLevel: jetGunLevel(plane.id, save.gunLevel) as GunLevel,
    gun2Level: double ? save.gun2Level : 0,
    gunDamageMul: plane.gunDamageMul,
    secondaries,
    flares: FLARE_COUNT[eq.flares] ?? 0,
    ecm: eq.ecm > 0,
    damageControl: eq.damageControl > 0,
    magnet: eq.magnet > 0,
    earlyWarning: eq.radar > 0,
    livery: save.livery[plane.id],
  };
}

type Stores = ReadonlyArray<{ id: SecondaryId; ammo: number }>;

const usable = (s: { id: SecondaryId; ammo: number } | undefined, role: WeaponRole): boolean =>
  !!s && s.ammo > 0 && SECONDARIES[s.id].role === role;

/**
 * The slot the AIR or GROUND key fires (doc 05): the picked slot while it has ammo, else the first
 * mounted weapon of that role with ammo, or −1.
 */
export function slotFor(secondaries: Stores, role: WeaponRole, pick = -1): number {
  if (usable(secondaries[pick], role)) return pick;
  return secondaries.findIndex((s) => usable(s, role));
}

/** SWITCH: the next weapon of that role with ammo after the one firing now, wrapping; unchanged if none other. */
export function nextPick(secondaries: Stores, role: WeaponRole, pick: number): number {
  const now = slotFor(secondaries, role, pick);
  for (let k = 1; k <= secondaries.length; k++) {
    const i = (now + k) % secondaries.length;
    if (usable(secondaries[i], role)) return i;
  }
  return now;
}

/** At least two weapons of that role still have ammo, so SWITCH does something. */
export const canSwitch = (secondaries: Stores, role: WeaponRole): boolean =>
  secondaries.filter((s) => usable(s, role)).length >= 2;
