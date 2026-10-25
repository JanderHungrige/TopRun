import type { MinigameId } from '../../data/minigames';
import type { MinigameModule } from './contract';
import { EVASION } from './evasion';
import { FLYBY } from './flyby';
import { FORMATION } from './formation';
import { LANDING } from './landing';
import { MOTORBIKE } from './motorbike';
import { PIANO } from './piano';
import { PUSHUPS } from './pushups';
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
];

export const playableIds = (): MinigameId[] => PLAYABLE.map((m) => m.id);
export const moduleFor = (id: MinigameId): MinigameModule | undefined => PLAYABLE.find((m) => m.id === id);
