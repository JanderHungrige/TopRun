import type { TheaterId } from './types';

// Paint jobs (doc 09): which liveries exist and what unlocks them. How they look: render/livery-art.ts.

export type LiveryId =
  | 'standard' | 'gullgray' | 'blackflag' | 'desert' | 'sunburst' | 'arctic' | 'aggressor'
  | 'woodland' | 'tiger' | 'airshow' | 'blackgold'
  | 'seagrey' | 'deepblue' | 'snowrock' | 'polarred' | 'jungle' | 'emerald' | 'nightops' | 'nighthawk' | 'stormgrey' | 'legend'
  // The fleet's (doc 100): map 3 the helicopters, map 4 the subs, map 5 the spacecraft.
  | 'fjordsplinter' | 'northlights' | 'snowfield' | 'rescue' | 'deltaswamp' | 'swamptiger' | 'mesasand' | 'redrock' | 'ashgrey' | 'lava'
  | 'reefblue' | 'coral' | 'kelpgreen' | 'serpent' | 'rusthulk' | 'ghostship' | 'trenchblack' | 'angler' | 'abyssviolet' | 'kraken'
  | 'orbitalwhite' | 'stationstripes' | 'asteroid' | 'prospector' | 'lunardust' | 'moonshot' | 'ringgold' | 'saturn' | 'deepspace' | 'nebula'
  // Map 7's, the tanks and buggies (doc 112).
  | 'steppegold' | 'grassfire' | 'saltcrust' | 'mirage' | 'reddust' | 'raider' | 'barrowmoss' | 'runestone' | 'craterash' | 'starfall';

export const LIVERY_IDS: readonly LiveryId[] = Object.freeze([
  'standard', 'gullgray', 'blackflag', 'desert', 'sunburst', 'arctic', 'aggressor', 'woodland', 'tiger', 'airshow', 'blackgold',
  'seagrey', 'deepblue', 'snowrock', 'polarred', 'jungle', 'emerald', 'nightops', 'nighthawk', 'stormgrey', 'legend',
  'fjordsplinter', 'northlights', 'snowfield', 'rescue', 'deltaswamp', 'swamptiger', 'mesasand', 'redrock', 'ashgrey', 'lava',
  'reefblue', 'coral', 'kelpgreen', 'serpent', 'rusthulk', 'ghostship', 'trenchblack', 'angler', 'abyssviolet', 'kraken',
  'orbitalwhite', 'stationstripes', 'asteroid', 'prospector', 'lunardust', 'moonshot', 'ringgold', 'saturn', 'deepspace', 'nebula',
  'steppegold', 'grassfire', 'saltcrust', 'mirage', 'reddust', 'raider', 'barrowmoss', 'runestone', 'craterash', 'starfall',
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
  // Doc 100: the fleet's, for the craft of the theater's world.
  fjordsplinter: def('fjordsplinter', 'Fjord Splinter', { theater: 'fjords', kind: 'region' }),
  northlights: def('northlights', 'Northern Lights', { theater: 'fjords', kind: 'stars' }),
  snowfield: def('snowfield', 'Snowfield', { theater: 'highlands', kind: 'region' }),
  rescue: def('rescue', 'Mountain Rescue', { theater: 'highlands', kind: 'stars' }),
  deltaswamp: def('deltaswamp', 'Delta Swamp', { theater: 'delta', kind: 'region' }),
  swamptiger: def('swamptiger', 'Swamp Tiger', { theater: 'delta', kind: 'stars' }),
  mesasand: def('mesasand', 'Mesa Sand', { theater: 'mesa', kind: 'region' }),
  redrock: def('redrock', 'Red Rock', { theater: 'mesa', kind: 'stars' }),
  ashgrey: def('ashgrey', 'Ash Grey', { theater: 'ashfall', kind: 'region' }),
  lava: def('lava', 'Lava', { theater: 'ashfall', kind: 'stars' }),
  reefblue: def('reefblue', 'Reef Blue', { theater: 'reef', kind: 'region' }),
  coral: def('coral', 'Coral', { theater: 'reef', kind: 'stars' }),
  kelpgreen: def('kelpgreen', 'Kelp Green', { theater: 'kelp', kind: 'region' }),
  serpent: def('serpent', 'Sea Serpent', { theater: 'kelp', kind: 'stars' }),
  rusthulk: def('rusthulk', 'Rust Hulk', { theater: 'wrecks', kind: 'region' }),
  ghostship: def('ghostship', 'Ghost Ship', { theater: 'wrecks', kind: 'stars' }),
  trenchblack: def('trenchblack', 'Trench Black', { theater: 'trench', kind: 'region' }),
  angler: def('angler', 'Angler', { theater: 'trench', kind: 'stars' }),
  abyssviolet: def('abyssviolet', 'Abyss Violet', { theater: 'abyss', kind: 'region' }),
  kraken: def('kraken', 'Kraken', { theater: 'abyss', kind: 'stars' }),
  orbitalwhite: def('orbitalwhite', 'Orbital White', { theater: 'orbit', kind: 'region' }),
  stationstripes: def('stationstripes', 'Station Stripes', { theater: 'orbit', kind: 'stars' }),
  asteroid: def('asteroid', 'Asteroid Grey', { theater: 'belt', kind: 'region' }),
  prospector: def('prospector', 'Prospector', { theater: 'belt', kind: 'stars' }),
  lunardust: def('lunardust', 'Lunar Dust', { theater: 'moon', kind: 'region' }),
  moonshot: def('moonshot', 'Moonshot', { theater: 'moon', kind: 'stars' }),
  ringgold: def('ringgold', 'Ring Gold', { theater: 'rings', kind: 'region' }),
  saturn: def('saturn', 'Saturn', { theater: 'rings', kind: 'stars' }),
  deepspace: def('deepspace', 'Deep Space', { theater: 'deep', kind: 'region' }),
  nebula: def('nebula', 'Nebula', { theater: 'deep', kind: 'stars' }),
  steppegold: def('steppegold', 'Steppe Gold', { theater: 'grass', kind: 'region' }),
  grassfire: def('grassfire', 'Grass Fire', { theater: 'grass', kind: 'stars' }),
  saltcrust: def('saltcrust', 'Salt Crust', { theater: 'saltflats', kind: 'region' }),
  mirage: def('mirage', 'Mirage', { theater: 'saltflats', kind: 'stars' }),
  reddust: def('reddust', 'Red Dust', { theater: 'badlands', kind: 'region' }),
  raider: def('raider', 'Mesa Raider', { theater: 'badlands', kind: 'stars' }),
  barrowmoss: def('barrowmoss', 'Barrow Moss', { theater: 'barrows', kind: 'region' }),
  runestone: def('runestone', 'Rune Stone', { theater: 'barrows', kind: 'stars' }),
  craterash: def('craterash', 'Crater Ash', { theater: 'impact', kind: 'region' }),
  starfall: def('starfall', 'Starfall', { theater: 'impact', kind: 'stars' }),
});
