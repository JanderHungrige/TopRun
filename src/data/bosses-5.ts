import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// Map 5's bosses (doc 65), generic names; bow / front down (+y) as in data/bosses.ts. Art in render/bosses-5.ts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_5 = {
  barracuda: {
    id: 'barracuda', name: 'BARRACUDA', title: 'Hunter-Killer Sub', layer: 'ground',
    coreHp: 1700, coreWeapon: 'aimed', corePeriod: 1.6,
    hitboxes: [{ dx: 0, dy: 120, r: 30 }, { dx: 0, dy: 50, r: 40 }, { dx: 0, dy: -25, r: 42 }, { dx: 0, dy: -100, r: 34 }, { dx: 0, dy: -160, r: 24 }],
    parts: [
      part('tubeL', -20, 140, 14, 180, 'missile', 3.8), part('tubeR', 20, 140, 14, 180, 'missile', 3.8),
      part('sail', 0, 30, 18, 220, 'spread3', 2.0), part('rack', 0, -150, 16, 180, 'flak', 2.6),
    ],
    settleY: 200, sway: 60, swaySpeed: 0.25, bounty: 3000, escort: { kind: 'minisub', every: 6 },
  },
} as const satisfies Record<string, BossDef>;
