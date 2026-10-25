import { RANKS, type RankId } from '../data/ranks.ts';

// Pilot rating for the online ladder (doc 26). Pure; the ladder service runs the same code,
// so imports carry their `.ts` extension (Node runs TypeScript natively).

export interface RatingStats {
  stars: number;
  medals: number;
  kills: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export const RATING = Object.freeze({
  star: 100, maxStars: 90,
  medal: 250, maxMedals: 18,
  kill: 2, maxKills: 2000,
  gold: 150, silver: 80, bronze: 40, games: 10,
});

const whole = (v: number, hi: number): number => (Number.isFinite(v) ? Math.min(hi, Math.max(0, Math.floor(v))) : 0);

/** Non-negative integers within the caps; minigame medals share the 10 games, golds first. */
export function clampStats(s: RatingStats): RatingStats {
  const golds = whole(s.golds, RATING.games);
  const silvers = whole(s.silvers, RATING.games - golds);
  return {
    stars: whole(s.stars, RATING.maxStars),
    medals: whole(s.medals, RATING.maxMedals),
    kills: whole(s.kills, RATING.maxKills),
    golds,
    silvers,
    bronzes: whole(s.bronzes, RATING.games - golds - silvers),
  };
}

export function pilotRating(stats: RatingStats): number {
  const s = clampStats(stats);
  return s.stars * RATING.star + s.medals * RATING.medal + s.kills * RATING.kill
    + s.golds * RATING.gold + s.silvers * RATING.silver + s.bronzes * RATING.bronze;
}

export const maxRating = (): number =>
  pilotRating({ stars: RATING.maxStars, medals: RATING.maxMedals, kills: RATING.maxKills, golds: RATING.games, silvers: 0, bronzes: 0 });

export function rankFor(rating: number): RankId {
  let rank: RankId = 'ensign';
  for (const r of RANKS) if (rating >= r.from) rank = r.id;
  return rank;
}
