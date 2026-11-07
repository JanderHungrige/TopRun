import { PLANES } from '../data/planes';
import type { EquipmentId, PlaneId } from '../data/types';
import { equipmentCap } from './firepower';
import { derivePlayerStats } from './loadout';
import type { SaveData } from './save';

// What the hangar shows for hull and speed (doc 02, bug B1): the values the mission flies — the fitted armour and
// engine tuning (and the Rookie hull) included — not the bare plane's. Pure.

export interface PlaneCardStats {
  hull: number;
  speed: number;
  baseHull: number;
  baseSpeed: number;
}

/** A plane's hull and speed with the current equipment (equipment fits every plane of the kit). */
export function planeCardStats(save: SaveData, id: PlaneId): PlaneCardStats {
  const st = derivePlayerStats({ ...save, selectedPlane: id });
  return { hull: st.maxHull, speed: st.speed, baseHull: PLANES[id].hull, baseSpeed: PLANES[id].speed };
}

export interface EquipmentEffect {
  stat: 'hull' | 'speed';
  now: number;
  /** After the next level; null at the level cap. */
  next: number | null;
}

/** Armour and engine tuning on the selected plane: hull or speed now and after the next level; null for the rest. */
export function equipmentEffect(save: SaveData, id: EquipmentId): EquipmentEffect | null {
  if (id !== 'armor' && id !== 'engine') return null;
  const stat = id === 'armor' ? 'hull' : 'speed';
  const value = (s: SaveData): number => {
    const card = planeCardStats(s, s.selectedPlane);
    return stat === 'hull' ? card.hull : card.speed;
  };
  const level = save.equipment[id];
  const next = level < equipmentCap(save, id) ? value({ ...save, equipment: { ...save.equipment, [id]: level + 1 } }) : null;
  return { stat, now: value(save), next };
}
