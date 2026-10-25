import { ARMOR_BONUS, ENGINE_BONUS, FLARE_COUNT } from '../data/equipment';
import type { LiveryId } from '../data/liveries';
import { PLANES, type PlaneDef } from '../data/planes';
import type { GunLevel, SecondaryId } from '../data/types';
import { SECONDARIES } from '../data/weapons';
import type { SaveData } from './save';

export interface SecondaryAmmo {
  id: SecondaryId;
  ammo: number;
}

export interface PlayerStats {
  plane: PlaneDef;
  maxHull: number;
  speed: number;
  gunLevel: GunLevel;
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
  for (const id of save.loadout[plane.id]) {
    if (id === null) continue;
    const existing = secondaries.find((s) => s.id === id);
    if (existing) existing.ammo += SECONDARIES[id].ammoPerSlot;
    else secondaries.push({ id, ammo: SECONDARIES[id].ammoPerSlot });
  }
  return {
    plane,
    maxHull: Math.round(plane.hull * (1 + (ARMOR_BONUS[eq.armor] ?? 0))),
    speed: Math.round(plane.speed * (1 + (ENGINE_BONUS[eq.engine] ?? 0))),
    gunLevel: save.gunLevel,
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
