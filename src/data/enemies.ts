import type { Behavior, EnemyKind, EnemyWeapon, Layer } from './types';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  layer: Layer;
  hp: number;
  speed: number;
  radius: number;
  bounty: number;
  /** Extra factor on gun damage (the hardened bunker, doc 44); default 1. */
  armor?: number;
  /** Stealth: hidden from radar and missile locks until it fires (doc 44). */
  stealth?: boolean;
  weapon: EnemyWeapon;
  period: number;
  weapon2: EnemyWeapon;
  period2: number;
  behaviors: readonly Behavior[];
}

const def = (
  kind: EnemyKind, name: string, layer: Layer, hp: number, speed: number, radius: number,
  bounty: number, weapon: EnemyWeapon, period: number, behaviors: readonly Behavior[],
  weapon2: EnemyWeapon = 'none', period2 = 0,
): EnemyDef => ({ kind, name, layer, hp, speed, radius, bounty, weapon, period, weapon2, period2, behaviors });

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDef>> = Object.freeze({
  drone: def('drone', 'Attack Drone', 'air', 12, 170, 12, 15, 'none', 0, ['kamikaze', 'sine']),
  fishbed: def('fishbed', 'MiG-21 Fishbed', 'air', 30, 170, 18, 30, 'single', 2.2, ['straight', 'sine', 'swoop']),
  fulcrum: def('fulcrum', 'MiG-29 Fulcrum', 'air', 55, 230, 20, 50, 'aimed', 1.6, ['dive', 'swoop']),
  flanker: def('flanker', 'Su-27 Flanker', 'air', 110, 190, 24, 90, 'missile', 3.5, ['strafe'], 'aimed', 1.8),
  hind: def('hind', 'Mi-24 Hind', 'air', 80, 110, 22, 60, 'spread3', 2.0, ['hover']),
  bear: def('bear', 'Tu-95 Bear', 'air', 320, 70, 40, 180, 'aimed', 1.2, ['straight']),
  aa: def('aa', 'AA Gun', 'ground', 50, 0, 16, 35, 'flak', 2.5, ['ground']),
  sam: def('sam', 'SAM Site', 'ground', 70, 0, 18, 55, 'missile', 4.0, ['ground']),
  tank: def('tank', 'Battle Tank', 'ground', 60, 30, 16, 40, 'aimed', 2.8, ['ground']),
  radar: def('radar', 'Radar Station', 'ground', 90, 0, 22, 70, 'none', 0, ['ground']),
  depot: def('depot', 'Fuel Depot', 'ground', 120, 0, 26, 80, 'none', 0, ['ground']),
  boat: def('boat', 'Patrol Boat', 'ground', 70, 50, 18, 50, 'aimed', 2.4, ['ground']),
  destroyer: def('destroyer', 'Destroyer', 'ground', 420, 25, 50, 250, 'aimed', 1.4, ['ground'], 'missile', 5),
  // New adversaries (doc 44).
  shilka: def('shilka', 'ZSU-23-4 Shilka', 'ground', 75, 30, 16, 50, 'aimed', 1.4, ['ground'], 'flak', 3.8),
  bunker: { ...def('bunker', 'Hardened Bunker', 'ground', 160, 0, 20, 70, 'spread3', 2.4, ['ground']), armor: 0.5 },
  foxbat: def('foxbat', 'MiG-25 Foxbat', 'air', 90, 400, 22, 80, 'missile', 2.6, ['straight']),
  jammer: def('jammer', 'Il-22 Jammer', 'air', 260, 60, 30, 160, 'none', 0, ['straight']),
  frigate: def('frigate', 'Missile Frigate', 'ground', 300, 25, 34, 180, 'missile', 3.6, ['ground'], 'flak', 2.2),
  felon: { ...def('felon', 'Su-57 Felon', 'air', 150, 210, 22, 120, 'missile', 3.4, ['strafe'], 'aimed', 1.8), stealth: true },
  // Mini-bosses (doc 44).
  backfire: def('backfire', 'Tu-22M Backfire', 'air', 2000, 70, 44, 900, 'spread3', 1.8, ['loiter'], 'missile', 3.5),
  fortress: def('fortress', 'AA Fortress', 'ground', 2200, 0, 64, 1000, 'flak', 1.6, ['ground'], 'missile', 3.4),
  cruiser: def('cruiser', 'Missile Cruiser', 'ground', 2300, 20, 60, 1100, 'missile', 3.2, ['ground'], 'flak', 1.7),
  // Space (doc 56): 'ground' is anything big and slow — satellites, warships.
  raider: def('raider', 'Raider Fighter', 'air', 50, 230, 18, 50, 'aimed', 1.6, ['dive', 'swoop', 'sine']),
  satgun: def('satgun', 'Gun Satellite', 'ground', 70, 0, 18, 50, 'flak', 2.4, ['ground']),
  corvette: def('corvette', 'Corvette', 'ground', 380, 22, 46, 230, 'aimed', 1.5, ['ground'], 'missile', 4.6),
  interceptor: def('interceptor', 'Interceptor', 'air', 90, 300, 20, 70, 'missile', 4.5, ['dive', 'strafe'], 'aimed', 1.6),
  gunship: def('gunship', 'Gunship', 'ground', 240, 30, 30, 150, 'spread3', 2.2, ['ground'], 'flak', 3.0),
  battery: def('battery', 'Lunar Battery', 'ground', 140, 0, 20, 90, 'aimed', 2.2, ['ground'], 'missile', 6.5),
  // Map 4's mini-boss (doc 58).
  warden: def('warden', 'Battlecruiser', 'ground', 2200, 20, 60, 1000, 'spread3', 1.8, ['ground'], 'missile', 3.2),
  // Under the sea (doc 68): 'air' is anything in the water, 'ground' the seabed; the creatures carry no guns but sting.
  minisub: def('minisub', 'Midget Sub', 'air', 60, 150, 20, 50, 'aimed', 1.8, ['sine', 'swoop']),
  seadrone: def('seadrone', 'Sea Drone', 'air', 12, 130, 12, 15, 'none', 0, ['kamikaze', 'sine']),
  seamine: def('seamine', 'Sea Mine', 'air', 32, 40, 16, 20, 'none', 0, ['straight']),
  seaturret: def('seaturret', 'Seabed Turret', 'ground', 70, 0, 18, 50, 'flak', 2.4, ['ground']),
  jelly: def('jelly', 'Jellyfish', 'air', 30, 50, 18, 25, 'none', 0, ['sine']),
  eel: def('eel', 'Electric Eel', 'air', 45, 210, 16, 40, 'single', 2.0, ['sine', 'swoop']),
  // The deep (doc 70); the torpedo boat runs on the surface, seen from below.
  hunter: def('hunter', 'Hunter Sub', 'air', 90, 120, 24, 90, 'aimed', 2.2, ['strafe'], 'missile', 10),
  torpboat: def('torpboat', 'Torpedo Boat', 'air', 100, 60, 26, 110, 'aimed', 3.0, ['straight']),
  squid: def('squid', 'Squid', 'air', 70, 240, 18, 60, 'aimed', 2.2, ['dive', 'swoop']),
  crab: def('crab', 'Giant Crab', 'ground', 160, 25, 22, 90, 'aimed', 2.6, ['ground']),
  sealab: def('sealab', 'Sea Lab', 'ground', 180, 0, 28, 160, 'missile', 9, ['ground'], 'flak', 4.2),
  angler: def('angler', 'Anglerfish', 'air', 80, 90, 20, 80, 'single', 1.6, ['hover']),
  // Map 5's mini-boss (doc 70).
  boomer: def('boomer', 'Missile Sub', 'ground', 2200, 20, 60, 1000, 'spread3', 1.8, ['ground'], 'missile', 4.5),
  // The jungle planet (doc 81): 'air' is anything that runs or flies freely, 'ground' the heavy and the rooted.
  walker: def('walker', 'Enemy Walker', 'ground', 90, 35, 20, 60, 'aimed', 2.0, ['ground']),
  hovertank: def('hovertank', 'Hover Tank', 'ground', 110, 55, 20, 70, 'spread3', 2.6, ['ground']),
  artillery: def('artillery', 'Artillery Gun', 'ground', 120, 0, 20, 80, 'flak', 2.4, ['ground'], 'missile', 7),
  gundrone: def('gundrone', 'Gun Drone', 'air', 28, 170, 13, 25, 'single', 2.0, ['sine', 'swoop']),
  dropship: def('dropship', 'Dropship', 'air', 260, 60, 32, 160, 'aimed', 1.6, ['straight'], 'missile', 6),
  raptor: def('raptor', 'Raptor', 'air', 40, 220, 15, 35, 'none', 0, ['kamikaze', 'dive']),
  beetle: { ...def('beetle', 'Armoured Beetle', 'ground', 170, 25, 22, 90, 'aimed', 2.6, ['ground']), armor: 0.6 },
  spitter: def('spitter', 'Spitter Plant', 'ground', 70, 0, 18, 50, 'spread3', 2.4, ['ground']),
  wasp: def('wasp', 'Giant Wasp', 'air', 22, 200, 12, 20, 'none', 0, ['kamikaze', 'sine']),
  // Map 6's mini-boss (doc 81).
  brute: def('brute', 'Brute Walker', 'ground', 2300, 18, 56, 1100, 'spread3', 1.8, ['ground'], 'missile', 3.8),
});

export const AIR_KINDS: readonly EnemyKind[] = Object.freeze(
  (Object.keys(ENEMIES) as EnemyKind[]).filter((k) => ENEMIES[k].layer === 'air'),
);

export function isAir(kind: EnemyKind): boolean {
  return ENEMIES[kind].layer === 'air';
}

/** Sea units only make sense on water theaters; land units on land. Used by the wave generator. */
export const SEA_KINDS: readonly EnemyKind[] = Object.freeze(['boat', 'destroyer', 'frigate', 'cruiser'] as const);
