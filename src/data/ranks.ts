// Naval ranks by pilot rating (doc 26). Names live in the UI tables (`rank.<id>`).
// Shared with the ladder service, so this file imports nothing.

export type RankId =
  | 'ensign' | 'ltjg' | 'lt' | 'lcdr' | 'cdr' | 'capt' | 'radm' | 'adm' | 'fadm' | 'legend' | 'ace' | 'staradm' | 'deepadm' | 'junglemarshal' | 'steppemarshal';

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
  // Above Admiral once map-2 stars count (doc 35).
  { id: 'fadm', from: 20000 },
  { id: 'legend', from: 25000 },
  // Above Top Gun Legend once map-3 stars count (doc 48).
  { id: 'ace', from: 36000 },
  // Above Ace of Aces once map-4 stars count — under the sea (docs 72, 74).
  { id: 'deepadm', from: 48000 },
  // Above Admiral of the Deep once map-5 stars count — space, the last world (docs 58, 74).
  { id: 'staradm', from: 60000 },
  // Above Star Admiral once map-6 stars count — the jungle planet (doc 85).
  { id: 'junglemarshal', from: 72000 },
  // Above Jungle Marshal once map-7 stars count — the alien steppe (doc 110).
  { id: 'steppemarshal', from: 84000 },
]);

export const RANK_IDS: readonly RankId[] = Object.freeze(RANKS.map((r) => r.id));
