import type { TheaterId } from './types';

// Paint jobs (doc 09): which liveries exist and what unlocks them. How they look: render/livery-art.ts.

export type LiveryId =
  | 'standard' | 'gullgray' | 'blackflag' | 'desert' | 'sunburst' | 'arctic' | 'aggressor'
  | 'woodland' | 'tiger' | 'airshow' | 'blackgold'
  | 'seagrey' | 'deepblue' | 'snowrock' | 'polarred' | 'jungle' | 'emerald' | 'nightops' | 'nighthawk' | 'stormgrey' | 'legend';

export const LIVERY_IDS: readonly LiveryId[] = Object.freeze([
  'standard', 'gullgray', 'blackflag', 'desert', 'sunburst', 'arctic', 'aggressor', 'woodland', 'tiger', 'airshow', 'blackgold',
  'seagrey', 'deepblue', 'snowrock', 'polarred', 'jungle', 'emerald', 'nightops', 'nighthawk', 'stormgrey', 'legend',
] as const);

/**
 * null = always available. 'boss': the theater's boss mission cleared. 'stars': 3★ on all its missions.
 * 'region': the theater has opened — its first mission is playable (map-2 region camos, doc 09).
 */
export type LiveryUnlock = { theater: TheaterId; kind: 'boss' | 'stars' | 'region' } | null;

export interface LiveryDef {
  id: LiveryId;
  name: string;
  unlock: LiveryUnlock;
}

const def = (id: LiveryId, name: string, unlock: LiveryUnlock): LiveryDef => ({ id, name, unlock });

export const LIVERIES: Readonly<Record<LiveryId, LiveryDef>> = Object.freeze({
  standard: def('standard', 'Factory Standard', null),
  gullgray: def('gullgray', 'Seventies Navy', { theater: 'pacific', kind: 'region' }),
  blackflag: def('blackflag', 'Black Flag', { theater: 'pacific', kind: 'stars' }),
  desert: def('desert', 'Desert Camo', { theater: 'gulf', kind: 'region' }),
  sunburst: def('sunburst', 'Sunburst', { theater: 'gulf', kind: 'stars' }),
  arctic: def('arctic', 'Arctic Splinter', { theater: 'arctic', kind: 'region' }),
  aggressor: def('aggressor', 'Aggressor Blue', { theater: 'arctic', kind: 'stars' }),
  woodland: def('woodland', 'European Woodland', { theater: 'canyon', kind: 'region' }),
  tiger: def('tiger', 'Tiger Stripes', { theater: 'canyon', kind: 'stars' }),
  airshow: def('airshow', 'Air Show', { theater: 'leviathan', kind: 'region' }),
  blackgold: def('blackgold', 'Black & Gold', { theater: 'leviathan', kind: 'stars' }),
  // Map 2 (Second Front wave 4): a region camo ready when the region opens, and the 3★ reward. Map 1's region camos
  // moved from the boss to the region's opening in Fair Challenge wave 1 (doc 09).
  seagrey: def('seagrey', 'North Sea Grey', { theater: 'northsea', kind: 'region' }),
  deepblue: def('deepblue', 'Deep Blue', { theater: 'northsea', kind: 'stars' }),
  snowrock: def('snowrock', 'Mountain Snow', { theater: 'himalaya', kind: 'region' }),
  polarred: def('polarred', 'Polar Red', { theater: 'himalaya', kind: 'stars' }),
  jungle: def('jungle', 'Jungle', { theater: 'jungle', kind: 'region' }),
  emerald: def('emerald', 'Emerald', { theater: 'jungle', kind: 'stars' }),
  nightops: def('nightops', 'Night Ops', { theater: 'nightfall', kind: 'region' }),
  nighthawk: def('nighthawk', 'Night Hawk', { theater: 'nightfall', kind: 'stars' }),
  stormgrey: def('stormgrey', 'Storm Ghost', { theater: 'thunderhead', kind: 'region' }),
  legend: def('legend', 'Top Gun Legend', { theater: 'thunderhead', kind: 'stars' }),
});
