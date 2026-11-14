import type { CampaignId } from '../data/types';
import { INTRO_WORLDS } from './intro';
import { campaignComplete } from './progress';
import type { SaveData } from './save';

// The hangar TV's tape shelf (doc 63): one tape per world with two recordings — the welcome film once the pilot has seen
// it (doc 97), the victory once the whole world is cleared (doc 64). Pure.

export interface Tape {
  world: CampaignId;
  finished: boolean;
  welcome: boolean;
}

/** A tape's two recordings. */
export type TapeSide = 'welcome' | 'victory';

export const WORLDS: readonly CampaignId[] = Object.freeze([1, 2, 3, 4, 5, 6, 7] as const);

export const tapeShelf = (save: SaveData): Tape[] => WORLDS.map((world) => ({
  world, finished: campaignComplete(save, world), welcome: INTRO_WORLDS.includes(world) && save.intros.includes(world),
}));

/** What a tape holds, welcome first; empty for a blank tape. */
export const tapeSides = (tape: Tape): TapeSide[] => [
  ...(tape.welcome ? (['welcome'] as const) : []), ...(tape.finished ? (['victory'] as const) : []),
];
