import type { MinigameId } from '../../data/minigames';
import { medalFor, type Medal } from '../../game/minigames/core';
import type { SaveData } from '../../game/save';
import type { MinigameModule } from './contract';
import { EVASION } from './evasion';
import { FLYBY } from './flyby';
import { FORMATION } from './formation';
import { LANDING } from './landing';
import { MOTORBIKE } from './motorbike';
import { PIANO } from './piano';
import { PUSHUPS } from './pushups';
import { RANKS } from './ranks';
import { REFUEL } from './refuel';
import { TACTICS } from './tactics';
import { VOLLEYBALL } from './volleyball';

// The minigames that are built (doc 10). Only these appear in the hub (others: COMING SOON) and offers.
export const PLAYABLE: readonly MinigameModule[] = [
  PUSHUPS,
  FLYBY,
  FORMATION,
  VOLLEYBALL,
  REFUEL,
  MOTORBIKE,
  EVASION,
  PIANO,
  LANDING,
  TACTICS,
  RANKS,
];

export const playableIds = (): MinigameId[] => PLAYABLE.map((m) => m.id);
export const moduleFor = (id: MinigameId): MinigameModule | undefined => PLAYABLE.find((m) => m.id === id);

/** The medal tier of each built minigame's personal best, in PLAYABLE order (ladder, doc 28). */
export const minigameTiers = (save: SaveData): Array<Medal | null> =>
  PLAYABLE.map((m) => {
    const r = save.minigames[m.id];
    return r ? medalFor(r.best, m.medals, m.higherIsBetter) : null;
  });

/** How many built minigames have a gold personal best (medals Off-Duty Star / Base Legend, doc 24). */
export const goldCount = (save: SaveData): number => minigameTiers(save).filter((tier) => tier === 'gold').length;
