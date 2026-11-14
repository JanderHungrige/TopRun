import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// Map 7's bosses (doc 105): colossi and motherships of the invasion, generic names; front down (+y) as in data/bosses.ts.
// Each is tougher than the last and the finale the toughest (doc 78's band). Art in render/bosses-7.ts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_7 = {
  harvester: {
    id: 'harvester', name: 'HARVESTER', title: 'Reaper Machine', layer: 'ground',
    coreHp: 3000, coreWeapon: 'aimed', corePeriod: 1.4,
    hitboxes: [{ dx: 0, dy: 0, r: 60 }, { dx: -84, dy: 40, r: 30 }, { dx: 84, dy: 40, r: 30 }, { dx: 0, dy: -76, r: 32 }],
    parts: [
      part('drumL', -84, 62, 18, 300, 'spread3', 2.0), part('drumR', 84, 62, 18, 300, 'spread3', 2.0),
      part('chimney', 34, -70, 16, 300, 'missile', 3.4), part('dome', 0, 10, 16, 280, 'aimed', 1.5),
    ],
    settleY: 200, sway: 80, swaySpeed: 0.24, bounty: 3000, escort: { kind: 'crawler', every: 4 },
  },
  longshanks: {
    id: 'longshanks', name: 'LONGSHANKS', title: 'Giant Tripod', layer: 'ground',
    coreHp: 4200, coreWeapon: 'spread3', corePeriod: 1.8,
    hitboxes: [{ dx: 0, dy: 0, r: 54 }, { dx: -60, dy: 30, r: 26 }, { dx: 60, dy: 30, r: 26 }, { dx: 0, dy: -60, r: 30 }],
    parts: [
      part('rayL', -58, 34, 15, 300, 'ray', 2.4), part('rayR', 58, 34, 15, 300, 'ray', 2.4),
      part('pod', 0, -64, 16, 320, 'missile', 3.4), part('eye', 0, 30, 15, 320, 'spread3', 2.2),
    ],
    settleY: 200, sway: 110, swaySpeed: 0.2, bounty: 4000, escort: { kind: 'trooper', every: 4 },
  },
  juggernaut: {
    id: 'juggernaut', name: 'JUGGERNAUT', title: 'Siege Beast', layer: 'ground',
    coreHp: 4600, coreWeapon: 'spread3', corePeriod: 2.0,
    hitboxes: [{ dx: 0, dy: 100, r: 34 }, { dx: 0, dy: 20, r: 58 }, { dx: 0, dy: -70, r: 50 }, { dx: 0, dy: -140, r: 24 }],
    parts: [
      part('tusks', 0, 122, 18, 300, 'spread3', 1.8), part('howdah', 0, -10, 20, 320, 'flak', 2.4),
      part('riderL', -44, 30, 13, 220, 'aimed', 1.6), part('riderR', 44, 30, 13, 220, 'aimed', 1.6),
      part('tail', 0, -150, 15, 260, 'missile', 3.6),
    ],
    settleY: 190, sway: 70, swaySpeed: 0.2, bounty: 5000, escort: { kind: 'rider', every: 5 },
  },
  dreadnought: {
    id: 'dreadnought', name: 'DREADNOUGHT', title: 'Siege Ship', layer: 'ground',
    coreHp: 5000, coreWeapon: 'aimed', corePeriod: 1.3,
    hitboxes: [{ dx: 0, dy: 0, r: 64 }, { dx: -100, dy: 0, r: 34 }, { dx: 100, dy: 0, r: 34 }, { dx: 0, dy: 90, r: 30 }],
    parts: [
      part('turretL', -96, 20, 16, 280, 'aimed', 1.4), part('turretR', 96, 20, 16, 280, 'aimed', 1.4),
      part('bay', 0, 50, 18, 320, 'flak', 2.2), part('rack', 0, -70, 17, 300, 'missile', 3.2),
    ],
    settleY: 190, sway: 90, swaySpeed: 0.18, bounty: 6000, escort: { kind: 'discfighter', every: 4 },
  },
  mothership: {
    id: 'mothership', name: 'MOTHERSHIP', title: 'Invasion Heart', layer: 'ground',
    coreHp: 5600, coreWeapon: 'spread3', corePeriod: 1.6,
    hitboxes: [{ dx: 0, dy: 0, r: 80 }, { dx: -120, dy: 0, r: 40 }, { dx: 120, dy: 0, r: 40 }, { dx: 0, dy: -80, r: 40 }],
    parts: [
      part('emitW', -118, 0, 16, 280, 'ray', 2.4), part('emitE', 118, 0, 16, 280, 'ray', 2.4),
      part('emitS', 0, 78, 17, 300, 'aimed', 1.4), part('hangar', 0, -86, 18, 320, 'missile', 3.2),
    ],
    settleY: 190, sway: 120, swaySpeed: 0.22, bounty: 8000, escort: { kind: 'scoutdisc', every: 3 },
  },
} as const satisfies Record<string, BossDef>;
