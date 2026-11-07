import type { CampaignId } from '../data/types';
import { campaignComplete } from './progress';
import type { SaveData } from './save';

// The hangar TV's tape shelf (doc 63): one tape per world, recorded once the whole world is cleared. Pure.

export interface Tape {
  world: CampaignId;
  finished: boolean;
}

export const WORLDS: readonly CampaignId[] = Object.freeze([1, 2, 3, 4, 5] as const);

export const tapeShelf = (save: SaveData): Tape[] => WORLDS.map((world) => ({ world, finished: campaignComplete(save, world) }));
