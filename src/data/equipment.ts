import type { EquipmentId } from './types';

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  description: string;
  prices: readonly number[]; // one entry per level; length = max level
  levelText: readonly string[];
  /** Levels on sale before map 2 opens; the rest come with map 2 (doc 37). Default: all. */
  map1Levels?: number;
}

export const EQUIPMENT: Readonly<Record<EquipmentId, EquipmentDef>> = Object.freeze({
  armor: {
    id: 'armor', name: 'Armor Plating', description: 'Titanium plates around cockpit and engines.',
    prices: [3000, 7000, 14000, 28000, 50000, 90000, 150000, 170000, 185000, 200000, 215000, 230000, 250000, 270000],
    levelText: [
      '+20% hull', '+40% hull', '+60% hull', '+80% hull', '+100% hull', '+125% hull', '+150% hull',
      '+175% hull', '+200% hull', '+225% hull', '+250% hull', '+275% hull', '+300% hull', '+325% hull',
    ],
    map1Levels: 4,
  },
  engine: {
    id: 'engine', name: 'Engine Tuning', description: 'Tuned turbines and a hotter afterburner.',
    prices: [3000, 7000, 14000, 24000, 50000, 60000, 70000, 80000, 90000, 100000],
    levelText: ['+8% speed', '+16% speed', '+24% speed', '+30% speed', '+36% speed', '+40% speed', '+44% speed', '+48% speed', '+52% speed', '+56% speed'],
    map1Levels: 4,
  },
  flares: {
    id: 'flares', name: 'Flare Dispenser', description: 'Decoys that pull enemy missiles away. Key F.',
    prices: [2000, 4000, 8000, 12000, 20000, 35000, 55000, 65000, 75000, 85000, 95000, 105000, 115000, 125000],
    levelText: [
      '2 flares', '4 flares', '6 flares', '8 flares', '10 flares', '12 flares', '14 flares',
      '16 flares', '18 flares', '20 flares', '22 flares', '24 flares', '26 flares', '28 flares',
    ],
    map1Levels: 4,
  },
  ecm: {
    id: 'ecm', name: 'ECM Pod', description: 'Jams enemy fire control: enemy bullets do less damage, enemy missiles turn slower.',
    prices: [12000, 28000, 70000, 90000, 115000, 145000],
    levelText: [
      '-25% bullet damage, missiles turn 30% slower', '-35% bullet damage, missiles turn 40% slower', '-45% bullet damage, missiles turn 50% slower',
      '-50% bullet damage, missiles turn 55% slower', '-55% bullet damage, missiles turn 60% slower', '-60% bullet damage, missiles turn 65% slower',
    ],
    map1Levels: 2,
  },
  damageControl: {
    id: 'damageControl', name: 'Damage Control', description: 'Below 25% hull, restores part of the hull: once per mission, up to three times at the top level.',
    prices: [15000, 32000, 80000, 100000, 125000, 155000],
    levelText: [
      'Restores 40% hull once per mission', 'Restores 60% hull once per mission', 'Restores 60% hull twice per mission',
      'Restores 70% hull twice per mission', 'Restores 80% hull twice per mission', 'Restores 80% hull three times per mission',
    ],
    map1Levels: 2,
  },
  magnet: {
    id: 'magnet', name: 'Cargo Magnet', description: 'Pickups drift towards you from much further away.',
    prices: [6000, 14000, 25000, 40000],
    levelText: ['Pickups from 160 px', 'Pickups from 280 px, pulled in faster', 'Pickups from 400 px, pulled in faster', 'Pickups from 520 px, pulled in fastest'],
    map1Levels: 2,
  },
  radar: {
    id: 'radar', name: 'Early-Warning Radar', description: 'Longer radar range: see bandits on the scope before they arrive.',
    prices: [8000, 18000, 30000, 45000],
    levelText: [
      'Bandits on radar 4 s earlier', 'Bandits on radar 7 s earlier, range 1,400 px, shows stealth fighters',
      'Bandits on radar 10 s earlier, range 1,700 px', 'Bandits on radar 13 s earlier, range 2,000 px, works while jammed',
    ],
    map1Levels: 2,
  },
});

/** Effects per level, index = level (0 = not fitted). Docs 02, 37, 43 (wave 3 doubles every table on map 2). */
export const ARMOR_BONUS: readonly number[] = Object.freeze([
  0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25,
]);
export const ENGINE_BONUS: readonly number[] = Object.freeze([0, 0.08, 0.16, 0.24, 0.3, 0.36, 0.4, 0.44, 0.48, 0.52, 0.56]);
export const FLARE_COUNT: readonly number[] = Object.freeze([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28]);
/** ECM: share of enemy bullet / flak damage that still hits, and enemy missile turn rate. */
export const ECM_BULLET: readonly number[] = Object.freeze([1, 0.75, 0.65, 0.55, 0.5, 0.45, 0.4]);
export const ECM_TURN: readonly number[] = Object.freeze([1, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35]);
/** Damage control: hull share restored and uses per mission. */
export const DAMAGE_CONTROL_RESTORE: readonly number[] = Object.freeze([0, 0.4, 0.6, 0.6, 0.7, 0.8, 0.8]);
export const DAMAGE_CONTROL_USES: readonly number[] = Object.freeze([0, 1, 1, 2, 2, 2, 3]);
/** Cargo magnet: reach and pull speed in px / px per second (no magnet: 46 / 260). */
export const MAGNET_REACH: readonly number[] = Object.freeze([46, 160, 280, 400, 520]);
export const MAGNET_PULL: readonly number[] = Object.freeze([260, 420, 560, 680, 800]);
/** Early-Warning Radar: radar range and how many seconds ahead spawns show (doc 05). */
export const RADAR_RANGE: readonly number[] = Object.freeze([720, 1100, 1400, 1700, 2000]);
export const RADAR_AHEAD: readonly number[] = Object.freeze([0, 4, 7, 10, 13]);
/** From this Early-Warning Radar level the scope burns through a jammer (wave 3, doc 43). */
export const RADAR_BURN_THROUGH = 4;

/** The value for a level, the last entry for anything above the table. */
export const atLevel = (table: readonly number[], level: number): number =>
  table[Math.max(0, Math.min(table.length - 1, Math.floor(level)))] ?? 0;

export function maxEquipmentLevel(id: EquipmentId): number {
  return EQUIPMENT[id].prices.length;
}

/** The top level on sale before map 2 opens (doc 37). */
export function map1EquipmentLevel(id: EquipmentId): number {
  return EQUIPMENT[id].map1Levels ?? maxEquipmentLevel(id);
}
