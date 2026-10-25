import type { RankId } from '../data/ranks';
import { ladderStats } from '../game/ladder-stats';
import { earnedMedals } from '../game/medals';
import { pilotRating, rankFor, type RatingStats } from '../game/rating';
import type { SaveData } from '../game/save';
import { goldCount, minigameTiers } from './minigames/registry';

// A pilot's save → rating stats and standing (docs 26, 28): stars, minigame medals, the earned
// medals (doc 24) and the kills from the service record.

export const pilotStats = (save: SaveData): RatingStats =>
  ladderStats(save, minigameTiers(save), earnedMedals(save, goldCount(save)).length, save.record.kills);

export function pilotStanding(save: SaveData): { rating: number; rank: RankId } {
  const rating = pilotRating(pilotStats(save));
  return { rating, rank: rankFor(rating) };
}
