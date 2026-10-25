// Naval ranks by pilot rating (doc 26). Names live in the UI tables (`rank.<id>`).
// Shared with the ladder service, so this file imports nothing.

export type RankId = 'ensign' | 'ltjg' | 'lt' | 'lcdr' | 'cdr' | 'capt' | 'radm' | 'adm';

export interface Rank {
  id: RankId;
  /** Lowest rating that holds this rank. */
  from: number;
}

export const RANKS: readonly Rank[] = Object.freeze([
  { id: 'ensign', from: 0 },
  { id: 'ltjg', from: 800 },
  { id: 'lt', from: 2000 },
  { id: 'lcdr', from: 4000 },
  { id: 'cdr', from: 6500 },
  { id: 'capt', from: 9500 },
  { id: 'radm', from: 13000 },
  { id: 'adm', from: 16500 },
]);

export const RANK_IDS: readonly RankId[] = Object.freeze(RANKS.map((r) => r.id));
