import type { Behavior, EnemyKind, EnemyWeapon, Layer } from './types';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  layer: Layer;
  hp: number;
  speed: number;
  radius: number;
  bounty: number;
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
});

export const AIR_KINDS: readonly EnemyKind[] = Object.freeze(
  (Object.keys(ENEMIES) as EnemyKind[]).filter((k) => ENEMIES[k].layer === 'air'),
);

export function isAir(kind: EnemyKind): boolean {
  return ENEMIES[kind].layer === 'air';
}

/** Sea units only make sense on water theaters; land units on land. Used by the wave generator. */
export const SEA_KINDS: readonly EnemyKind[] = Object.freeze(['boat', 'destroyer'] as const);
