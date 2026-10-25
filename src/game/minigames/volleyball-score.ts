import type { Medals } from './core';

// Beach Volleyball (doc 21): rally scoring to 7 (win by 2, cap 9), the serve order, the final score, medals,
// how good the rivals are at a given score, and the pure random step every seeded roll uses. Pure.

export type Team = 'home' | 'away';
export const otherTeam = (t: Team): Team => (t === 'home' ? 'away' : 'home');

export const VB_MATCH = Object.freeze({ target: 7, lead: 2, cap: 9, winBonus: 5 });
const M = VB_MATCH;

/** Tuned by simulated players (doc 21): bronze = any win, silver = win by 3, gold = win by 5. */
export const VB_MEDALS: Readonly<Medals> = Object.freeze({ bronze: 6, silver: 8, gold: 10 });

export const DUKE_SKILL = 0.85;
/** The rivals' skill at 0 : 0. */
export const RIVAL_BASE = 0.38;

export interface MatchScore {
  home: number;
  away: number;
}

export function matchWinner(s: MatchScore): Team | null {
  const hi = Math.max(s.home, s.away);
  if (s.home === s.away) return null;
  if (hi >= M.cap || (hi >= M.target && Math.abs(s.home - s.away) >= M.lead)) return s.home > s.away ? 'home' : 'away';
  return null;
}

/** One more point for `team` wins the match. */
export function matchPoint(s: MatchScore, team: Team): boolean {
  return matchWinner({ ...s, [team]: s[team] + 1 }) === team;
}

/** The final score: your points minus theirs, plus the win bonus. */
export function vbScore(s: MatchScore): number {
  return s.home - s.away + (matchWinner(s) === 'home' ? M.winBonus : 0);
}

/** The rivals get better as the match heats up (and the more you score). */
export function rivalSkill(s: MatchScore): number {
  return Math.min(0.9, RIVAL_BASE + 0.05 * s.home + 0.02 * s.away);
}

/** Serving team and, per team, the index (0 / 1) of the player who serves for it now / served last. */
export interface ServeOrder {
  team: Team;
  home: 0 | 1;
  away: 0 | 1;
}

/** You serve first; the rivals' first server (after their first side-out) is index 0. */
export const FIRST_SERVE: Readonly<ServeOrder> = Object.freeze({ team: 'home', home: 0, away: 1 });

/** The rally winner serves; when the serve changes sides, that team's other player serves. */
export function nextServe(o: ServeOrder, winner: Team): ServeOrder {
  if (winner === o.team) return o;
  const flip = (i: 0 | 1): 0 | 1 => (i === 0 ? 1 : 0);
  return winner === 'home' ? { team: 'home', home: flip(o.home), away: o.away } : { team: 'away', home: o.home, away: flip(o.away) };
}

/** mulberry32 step: a number in [0, 1) and the next seed. */
export function rand(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}
