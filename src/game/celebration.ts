import { MEDAL_IDS, MEDALS, type MedalId } from '../data/medals';
import { campaignMissions } from '../data/missions';
import type { CampaignId } from '../data/types';
import { earnedMedals } from './medals';
import { campaignStars } from './progress';
import type { SaveData } from './save';
import type { Route } from './state';

// A world's celebration (doc 64): three key frames with overlays and the title card, when it plays and what it
// sums up. Pure.

export const CELEBRATION = Object.freeze({
  /** Seconds per shot, the cross-fade between shots, the title card's start, the whole length. */
  shot: 7,
  fade: 1,
  cardAt: 16,
  length: 22,
});

export interface Beat {
  shot: 0 | 1 | 2;
  /** The shot being faded out, and how far the new one is in (1 = fully). */
  from: 0 | 1 | 2 | null;
  fade: number;
  /** Black over everything (fade in / out). */
  black: number;
  /** The player's craft crossing the sky, 0…1, or null. */
  flyby: number | null;
  fireworks: boolean;
  confetti: boolean;
  /** The admiral's line is up. */
  line: boolean;
  /** The title card's opacity. */
  card: number;
  end: boolean;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function celebrationBeat(t: number): Beat {
  const { shot: S, fade: F, cardAt, length } = CELEBRATION;
  const shot = (t < S ? 0 : t < 2 * S ? 1 : 2) as Beat['shot'];
  const into = t - shot * S;
  const from = shot > 0 && into < F ? ((shot - 1) as Beat['shot']) : null;
  return {
    shot, from, fade: from === null ? 1 : clamp01(into / F),
    black: Math.max(clamp01(1 - t / F), clamp01((t - (length - F)) / F)),
    flyby: shot === 0 && t >= 1.5 && t <= 6.5 ? (t - 1.5) / 5 : null,
    fireworks: (shot === 0 && t >= 2) || shot === 2,
    confetti: shot === 1,
    line: shot === 1 && into >= 1,
    card: clamp01((t - cardAt) / F),
    end: t >= length,
  };
}

/** ENTER / tap: to the title card first, then to the end. */
export const skipTo = (t: number): number => (t < CELEBRATION.cardAt ? CELEBRATION.cardAt : CELEBRATION.length);

/** A world's seven campaign medals (doc 62): its theater ribbons, its victory medal and its golden star. */
export function worldMedalIds(world: CampaignId): MedalId[] {
  return MEDAL_IDS.filter((id) => MEDALS[id].group === 'campaign').slice((world - 1) * 7, world * 7);
}

export interface WorldSummary { stars: number; maxStars: number; medals: number; maxMedals: number }

export function worldSummary(save: SaveData, world: CampaignId): WorldSummary {
  const ids = worldMedalIds(world);
  const earned = earnedMedals(save, 0);
  return {
    stars: campaignStars(save, world), maxStars: campaignMissions(world).length * 3,
    medals: ids.filter((id) => earned.includes(id)).length, maxMedals: ids.length,
  };
}

/** After a debrief: a finale plays the world's celebration first, then the medal ceremony (if any), then `next`. */
export function afterDebrief(o: { finale: boolean; world: CampaignId; medals: readonly MedalId[]; next: Route }): Route {
  const honours: Route = o.medals.length > 0 ? { to: 'ceremony', medals: [...o.medals], then: o.next } : o.next;
  return o.finale && CELEBRATED.includes(o.world) ? { to: 'celebration', world: o.world, then: honours } : honours;
}

/** The worlds whose celebration exists (docs 64, 72): every world's, world 5's since Deep Water's wave 3. */
export const CELEBRATED: readonly CampaignId[] = Object.freeze([1, 2, 3, 4, 5] as const);
