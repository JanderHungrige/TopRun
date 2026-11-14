import type { EnemyDef } from './enemies';
import type { Behavior, EnemyKind, EnemyWeapon, Layer } from './types';

// The alien steppe's invasion army (doc 105): what marches, crawls or stands is 'ground' (the GROUND key's grenades),
// what flies is 'air'. Bounty and radius follow the jungle's enemies of the same size. The war tripod is map 7's
// mini-boss. Names in English here, German in i18n/content-de.ts; art in render/enemies/steppe*.ts.

const unit = (
  kind: EnemyKind, name: string, layer: Layer, hp: number, speed: number, radius: number, bounty: number,
  weapon: EnemyWeapon, period: number, behaviors: readonly Behavior[], weapon2: EnemyWeapon = 'none', period2 = 0,
): EnemyDef => ({ kind, name, layer, hp, speed, radius, bounty, weapon, period, weapon2, period2, behaviors });

export const ENEMIES_7 = {
  crawler: unit('crawler', 'Crawler', 'ground', 30, 70, 13, 20, 'none', 0, ['ground']),
  trooper: unit('trooper', 'Alien Trooper', 'ground', 45, 40, 14, 30, 'aimed', 2.2, ['ground']),
  rider: unit('rider', 'Beast Rider', 'ground', 110, 120, 20, 70, 'aimed', 2.6, ['ground']),
  landingpod: { ...unit('landingpod', 'Landing Pod', 'ground', 160, 0, 22, 90, 'none', 0, ['ground']), spawn: { kind: 'trooper', every: 6 } },
  scoutdisc: unit('scoutdisc', 'Scout Disc', 'air', 24, 200, 12, 20, 'single', 2.0, ['sine', 'swoop']),
  discfighter: unit('discfighter', 'Disc Fighter', 'air', 60, 190, 18, 45, 'aimed', 1.8, ['swoop', 'strafe']),
  tripod: { ...unit('tripod', 'Tripod', 'ground', 260, 30, 26, 150, 'ray', 2.6, ['ground']), armor: 0.7 },
  siegebug: { ...unit('siegebug', 'Siege Crawler', 'ground', 300, 18, 30, 200, 'flak', 4.2, ['ground']), armor: 0.5 },
  shieldbearer: { ...unit('shieldbearer', 'Shield Bearer', 'ground', 150, 35, 20, 90, 'aimed', 2.8, ['ground']), shield: { reach: 90, share: 0.5 } },
  broodcarrier: { ...unit('broodcarrier', 'Brood Carrier', 'ground', 220, 25, 26, 110, 'single', 3.0, ['ground']), spawn: { kind: 'crawler', count: 4 } },
  plasmagun: unit('plasmagun', 'Plasma Cannon', 'ground', 120, 0, 22, 90, 'aimed', 2.6, ['ground'], 'spread3', 6.0),
  manta: unit('manta', 'Bomber Manta', 'air', 120, 70, 28, 90, 'flak', 3.2, ['straight']),
  wartripod: unit('wartripod', 'War Tripod', 'ground', 2600, 15, 58, 1200, 'ray', 2.0, ['ground'], 'missile', 4.0),
} as const satisfies Partial<Record<EnemyKind, EnemyDef>>;
