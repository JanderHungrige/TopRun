import type { EquipmentId } from './types';

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  description: string;
  prices: readonly number[]; // one entry per level; length = max level
  levelText: readonly string[];
}

export const EQUIPMENT: Readonly<Record<EquipmentId, EquipmentDef>> = Object.freeze({
  armor: {
    id: 'armor', name: 'Armor Plating', description: 'Titanium plates around cockpit and engines.',
    prices: [3000, 7000, 14000], levelText: ['+20% hull', '+40% hull', '+60% hull'],
  },
  engine: {
    id: 'engine', name: 'Engine Tuning', description: 'Tuned turbines and a hotter afterburner.',
    prices: [3000, 7000, 14000], levelText: ['+8% speed', '+16% speed', '+24% speed'],
  },
  flares: {
    id: 'flares', name: 'Flare Dispenser', description: 'Decoys that pull enemy missiles away. Key F.',
    prices: [2000, 4000, 8000], levelText: ['2 flares', '4 flares', '6 flares'],
  },
  ecm: {
    id: 'ecm', name: 'ECM Pod', description: 'Jams enemy fire control. Enemy bullets -25% damage, missiles turn 30% slower.',
    prices: [12000], levelText: ['Installed'],
  },
  damageControl: {
    id: 'damageControl', name: 'Damage Control', description: 'Once per mission, below 25% hull, restores 40% hull.',
    prices: [15000], levelText: ['Installed'],
  },
  magnet: {
    id: 'magnet', name: 'Cargo Magnet', description: 'Pickups drift towards you from much further away.',
    prices: [6000], levelText: ['Installed'],
  },
});

export const ARMOR_BONUS: readonly number[] = Object.freeze([0, 0.2, 0.4, 0.6]);
export const ENGINE_BONUS: readonly number[] = Object.freeze([0, 0.08, 0.16, 0.24]);
export const FLARE_COUNT: readonly number[] = Object.freeze([0, 2, 4, 6]);

export function maxEquipmentLevel(id: EquipmentId): number {
  return EQUIPMENT[id].prices.length;
}
