// The towers of a defence (doc 106): what each costs in supply to build and upgrade, its reach and its fire by level
// (1–3). The MG nest and the flak tower are known from the start; the steppe lab invents the others and every tower's
// marks (doc 107). Pure data.

export type TowerId = 'mgnest' | 'flak' | 'mortarpit' | 'tesla' | 'jammer' | 'rockets';
export const TOWER_IDS: readonly TowerId[] = Object.freeze(['mgnest', 'flak', 'mortarpit', 'tesla', 'jammer', 'rockets'] as const);

/** What a tower hits: anything, only fliers, or only what is on the ground. */
export type TowerReach = 'any' | 'air' | 'ground';

export interface TowerLevel {
  range: number;
  /** Seconds between shots (a burst, a shell, a zap, a salvo); 0 for the jammer, which never fires. */
  period: number;
  damage: number;
  /** Rounds per second for the MG nest's stream (its `period` is 1 / rate). */
  rate?: number;
  /** The flak burst's and the mortar shell's blast, the tesla's jumps, the jammer's slow, the battery's rockets. */
  radius?: number;
  jumps?: number;
  slow?: number;
  rockets?: number;
}

export interface TowerDef {
  id: TowerId;
  name: string;
  /** Supply to build it, then to reach level 2 and 3. */
  cost: readonly [number, number, number];
  reach: TowerReach;
  /** Never fires at anything closer (the mortar). */
  minRange?: number;
  levels: readonly [TowerLevel, TowerLevel, TowerLevel];
}

export const TOWERS: Readonly<Record<TowerId, TowerDef>> = Object.freeze({
  mgnest: {
    id: 'mgnest', name: 'MG Nest', cost: [60, 50, 80], reach: 'any',
    levels: [
      { range: 150, period: 1 / 5, rate: 5, damage: 8 },
      { range: 165, period: 1 / 6.5, rate: 6.5, damage: 10 },
      { range: 180, period: 1 / 8, rate: 8, damage: 12 },
    ],
  },
  flak: {
    id: 'flak', name: 'Flak Tower', cost: [80, 60, 90], reach: 'air',
    levels: [
      { range: 220, period: 1.2, damage: 30, radius: 40 },
      { range: 240, period: 1.0, damage: 40, radius: 40 },
      { range: 260, period: 0.8, damage: 55, radius: 40 },
    ],
  },
  mortarpit: {
    id: 'mortarpit', name: 'Mortar Pit', cost: [100, 70, 100], reach: 'ground', minRange: 60,
    levels: [
      { range: 300, period: 2.4, damage: 60, radius: 55 },
      { range: 300, period: 2.1, damage: 85, radius: 55 },
      { range: 300, period: 1.8, damage: 115, radius: 55 },
    ],
  },
  tesla: {
    id: 'tesla', name: 'Tesla Tower', cost: [120, 80, 120], reach: 'any',
    levels: [
      { range: 130, period: 1.0, damage: 30, jumps: 3 },
      { range: 130, period: 1.0, damage: 40, jumps: 4 },
      { range: 130, period: 1.0, damage: 52, jumps: 5 },
    ],
  },
  jammer: {
    id: 'jammer', name: 'Jammer', cost: [70, 50, 80], reach: 'any',
    levels: [
      { range: 140, period: 0, damage: 0, slow: 0.35 },
      { range: 160, period: 0, damage: 0, slow: 0.45 },
      { range: 180, period: 0, damage: 0, slow: 0.55 },
    ],
  },
  rockets: {
    id: 'rockets', name: 'Rocket Battery', cost: [140, 90, 130], reach: 'any',
    levels: [
      { range: 260, period: 2.5, damage: 45, rockets: 2 },
      { range: 260, period: 2.5, damage: 45, rockets: 3 },
      { range: 260, period: 2.5, damage: 45, rockets: 4 },
    ],
  },
});

/** Known from the start; the rest are invented in the steppe lab (doc 107). */
export const TOWER_STARTERS: readonly TowerId[] = Object.freeze(['mgnest', 'flak'] as const);

/** A tower mark's factors (doc 107): damage and reach. */
export const TOWER_MARKS: readonly { damage: number; range: number }[] = Object.freeze([
  { damage: 1, range: 1 }, { damage: 1.25, range: 1.1 }, { damage: 1.5, range: 1.2 },
]);
