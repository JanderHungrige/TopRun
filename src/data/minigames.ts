// Off-duty minigames (doc 10): which games exist and after which mission each unlocks.

export type MinigameId =
  | 'pushups' | 'flyby' | 'formation' | 'volleyball' | 'refuel'
  | 'motorbike' | 'evasion' | 'piano' | 'landing' | 'tactics';

export const MINIGAME_IDS: readonly MinigameId[] = Object.freeze([
  'pushups', 'flyby', 'formation', 'volleyball', 'refuel', 'motorbike', 'evasion', 'piano', 'landing', 'tactics',
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
});
