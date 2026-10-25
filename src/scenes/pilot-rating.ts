import type { RankId } from '../data/ranks';
import { ladderStats } from '../game/ladder-stats';
import { pilotRating, rankFor, type RatingStats } from '../game/rating';
import type { SaveData } from '../game/save';
import { minigameTiers } from './minigames/registry';

// A pilot's save → rating stats and standing (docs 26, 28). Medals and kills join once the
// service record of Home Base Honours (doc 24) is on this branch.

export const pilotStats = (save: SaveData): RatingStats => ladderStats(save, minigameTiers(save), 0, 0);

export function pilotStanding(save: SaveData): { rating: number; rank: RankId } {
  const rating = pilotRating(pilotStats(save));
  return { rating, rank: rankFor(rating) };
}
