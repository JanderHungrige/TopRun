// Off-duty minigames (doc 10): which games exist and after which mission each unlocks. The second ten
// (initiative off-duty-minigames-2) follow the first ten in unlock order, on map-1 missions without an unlock yet.

export type MinigameId =
  | 'pushups' | 'flyby' | 'formation' | 'volleyball' | 'refuel'
  | 'motorbike' | 'evasion' | 'piano' | 'landing' | 'tactics'
  | 'darts' | 'highfive' | 'targetpod' | 'pool' | 'ranks'
  | 'parachute' | 'airshow' | 'deck' | 'canyon' | 'dogfight';

export const MINIGAME_IDS: readonly MinigameId[] = Object.freeze([
  'pushups', 'flyby', 'formation', 'volleyball', 'refuel', 'motorbike', 'evasion', 'piano', 'landing', 'tactics',
  'darts', 'highfive', 'targetpod', 'pool', 'ranks', 'parachute', 'airshow', 'deck', 'canyon', 'dogfight',
] as const);

export interface MinigameDef {
  id: MinigameId;
  /** Unlocked once this mission number is cleared. */
  unlockAfter: number;
  kind: 'flying' | 'offduty';
}

const def = (id: MinigameId, unlockAfter: number, kind: MinigameDef['kind']): MinigameDef => ({ id, unlockAfter, kind });

export const MINIGAMES: Readonly<Record<MinigameId, MinigameDef>> = Object.freeze({
  pushups: def('pushups', 1, 'offduty'),
  flyby: def('flyby', 3, 'flying'),
  formation: def('formation', 5, 'flying'),
  volleyball: def('volleyball', 6, 'offduty'),
  refuel: def('refuel', 9, 'flying'),
  motorbike: def('motorbike', 12, 'offduty'),
  evasion: def('evasion', 15, 'flying'),
  piano: def('piano', 18, 'offduty'),
  landing: def('landing', 21, 'flying'),
  tactics: def('tactics', 24, 'flying'),
  darts: def('darts', 2, 'offduty'),
  highfive: def('highfive', 4, 'offduty'),
  targetpod: def('targetpod', 7, 'flying'),
  pool: def('pool', 8, 'offduty'),
  ranks: def('ranks', 10, 'offduty'),
  parachute: def('parachute', 11, 'flying'),
  airshow: def('airshow', 14, 'flying'),
  deck: def('deck', 16, 'offduty'),
  canyon: def('canyon', 20, 'flying'),
  dogfight: def('dogfight', 27, 'flying'),
});
