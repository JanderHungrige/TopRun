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
} as const satisfies Record<string, BossDef>;
