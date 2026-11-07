import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// Map 4's bosses (doc 56), generic names; nose / front down (+y) as in data/bosses.ts. Art in render/bosses-4.ts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_4 = {
  halo: {
    id: 'halo', name: 'HALO', title: 'Ring Battle Station', layer: 'ground',
    coreHp: 3200, coreWeapon: 'spread3', corePeriod: 2.4,
    hitboxes: [{ dx: 0, dy: 0, r: 46 }, { dx: -105, dy: 0, r: 34 }, { dx: 105, dy: 0, r: 34 }, { dx: 0, dy: -105, r: 34 }, { dx: 0, dy: 105, r: 34 }],
    parts: [
      part('n', 0, 105, 17, 220, 'aimed', 1.5), part('s', 0, -105, 17, 220, 'missile', 4.0),
      part('w', -105, 0, 17, 220, 'flak', 2.3), part('e', 105, 0, 17, 220, 'flak', 2.3),
    ],
    settleY: 190, sway: 90, swaySpeed: 0.3, bounty: 3000, escort: { kind: 'raider', every: 6 },
  },
  quarry: {
    id: 'quarry', name: 'QUARRY', title: 'Asteroid Fortress', layer: 'ground',
    coreHp: 3800, coreWeapon: 'missile', corePeriod: 3.4,
    hitboxes: [{ dx: 0, dy: 0, r: 72 }, { dx: -70, dy: -40, r: 34 }, { dx: 70, dy: -40, r: 34 }, { dx: -60, dy: 50, r: 34 }, { dx: 60, dy: 50, r: 34 }, { dx: 0, dy: 95, r: 30 }],
    parts: [
      part('drill', 0, 95, 18, 300, 'spread3', 2.0), part('p1', -60, 50, 16, 260, 'aimed', 1.6),
      part('p2', 60, 50, 16, 260, 'aimed', 1.6), part('p3', -70, -40, 16, 260, 'flak', 2.4),
      part('p4', 70, -40, 16, 260, 'flak', 2.4),
    ],
    settleY: 190, sway: 80, swaySpeed: 0.22, bounty: 4000, escort: { kind: 'interceptor', every: 7 },
  },
  crater: {
    id: 'crater', name: 'CRATER', title: 'Lunar Citadel', layer: 'ground',
    coreHp: 4400, coreWeapon: 'spread3', corePeriod: 2.8,
    hitboxes: [{ dx: 0, dy: 0, r: 66 }, { dx: -95, dy: -60, r: 30 }, { dx: 95, dy: -60, r: 30 }, { dx: -95, dy: 60, r: 30 }, { dx: 95, dy: 60, r: 30 }, { dx: 0, dy: -100, r: 28 }],
    parts: [
      part('t1', -95, 60, 16, 280, 'aimed', 1.8), part('t2', 95, 60, 16, 280, 'aimed', 1.8),
      part('t3', -95, -60, 16, 280, 'flak', 2.7), part('t4', 95, -60, 16, 280, 'flak', 2.7),
      part('silo', 0, -100, 18, 320, 'missile', 3.4),
    ],
    settleY: 200, sway: 0, swaySpeed: 0, bounty: 5000, escort: { kind: 'raider', every: 8 },
  },
  trident: {
    id: 'trident', name: 'TRIDENT', title: 'Three-Hulled Dreadnought', layer: 'ground',
    coreHp: 5000, coreWeapon: 'aimed', corePeriod: 1.7,
    hitboxes: [
      { dx: 0, dy: -90, r: 36 }, { dx: 0, dy: -20, r: 42 }, { dx: 0, dy: 60, r: 42 }, { dx: 0, dy: 130, r: 32 },
      { dx: -72, dy: -10, r: 30 }, { dx: 72, dy: -10, r: 30 }, { dx: -72, dy: 60, r: 30 }, { dx: 72, dy: 60, r: 30 },
    ],
    parts: [
      part('bow', 0, 140, 18, 320, 'spread3', 1.9), part('gunL', -72, 90, 16, 280, 'aimed', 1.7),
      part('gunR', 72, 90, 16, 280, 'aimed', 1.7), part('rackL', -72, -40, 16, 280, 'missile', 3.6),
      part('rackR', 72, -40, 16, 280, 'missile', 3.6), part('stern', 0, -120, 18, 300, 'flak', 2.2),
    ],
    settleY: 185, sway: 120, swaySpeed: 0.3, bounty: 6000, escort: { kind: 'raider', every: 6 },
  },
  ark: {
    id: 'ark', name: 'ARK', title: 'Mothership', layer: 'ground',
    coreHp: 6200, coreWeapon: 'spread3', corePeriod: 1.6,
    hitboxes: [
      { dx: 0, dy: 0, r: 80 }, { dx: -110, dy: -20, r: 46 }, { dx: 110, dy: -20, r: 46 }, { dx: -60, dy: 90, r: 40 },
      { dx: 60, dy: 90, r: 40 }, { dx: 0, dy: -110, r: 44 }, { dx: 0, dy: 140, r: 34 },
    ],
    parts: [
      part('prow', 0, 150, 20, 380, 'spread3', 1.6), part('b1', -130, 30, 16, 300, 'aimed', 1.1),
      part('b2', 130, 30, 16, 300, 'aimed', 1.1), part('bay1', -110, -60, 18, 320, 'missile', 3.2),
      part('bay2', 110, -60, 18, 320, 'missile', 3.2), part('f1', -60, -120, 15, 280, 'flak', 2.0),
      part('f2', 60, -120, 15, 280, 'flak', 2.0),
    ],
    settleY: 175, sway: 100, swaySpeed: 0.25, bounty: 8000, escort: { kind: 'interceptor', every: 5 },
  },
} as const satisfies Record<string, BossDef>;
