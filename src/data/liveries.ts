import type { TheaterId } from './types';

// Paint jobs (doc 09): which liveries exist and what unlocks them. How they look: render/livery-art.ts.

export type LiveryId =
  | 'standard' | 'gullgray' | 'blackflag' | 'desert' | 'sunburst' | 'arctic' | 'aggressor'
  | 'woodland' | 'tiger' | 'airshow' | 'blackgold';

export const LIVERY_IDS: readonly LiveryId[] = Object.freeze([
  'standard', 'gullgray', 'blackflag', 'desert', 'sunburst', 'arctic', 'aggressor', 'woodland', 'tiger', 'airshow', 'blackgold',
] as const);

/** null = always available. 'boss': the theater's boss mission cleared. 'stars': 3★ on all its missions. */
export type LiveryUnlock = { theater: TheaterId; kind: 'boss' | 'stars' } | null;

export interface LiveryDef {
  id: LiveryId;
  name: string;
  unlock: LiveryUnlock;
}

const def = (id: LiveryId, name: string, unlock: LiveryUnlock): LiveryDef => ({ id, name, unlock });

export const LIVERIES: Readonly<Record<LiveryId, LiveryDef>> = Object.freeze({
  standard: def('standard', 'Factory Standard', null),
  gullgray: def('gullgray', 'Seventies Navy', { theater: 'pacific', kind: 'boss' }),
  blackflag: def('blackflag', 'Black Flag', { theater: 'pacific', kind: 'stars' }),
  desert: def('desert', 'Desert Camo', { theater: 'gulf', kind: 'boss' }),
  sunburst: def('sunburst', 'Sunburst', { theater: 'gulf', kind: 'stars' }),
  arctic: def('arctic', 'Arctic Splinter', { theater: 'arctic', kind: 'boss' }),
  aggressor: def('aggressor', 'Aggressor Blue', { theater: 'arctic', kind: 'stars' }),
  woodland: def('woodland', 'European Woodland', { theater: 'canyon', kind: 'boss' }),
  tiger: def('tiger', 'Tiger Stripes', { theater: 'canyon', kind: 'stars' }),
  airshow: def('airshow', 'Air Show', { theater: 'leviathan', kind: 'boss' }),
  blackgold: def('blackgold', 'Black & Gold', { theater: 'leviathan', kind: 'stars' }),
});
