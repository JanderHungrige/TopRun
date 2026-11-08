import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// Map 6's bosses (doc 81), generic names; front down (+y) as in data/bosses.ts. Art in render/bosses-6.ts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_6 = {
  ravager: {
    id: 'ravager', name: 'RAVAGER', title: 'Assault Walker', layer: 'ground',
    coreHp: 1800, coreWeapon: 'aimed', corePeriod: 1.6,
    hitboxes: [{ dx: 0, dy: 0, r: 56 }, { dx: -78, dy: 10, r: 30 }, { dx: 78, dy: 10, r: 30 }, { dx: 0, dy: -70, r: 34 }],
    parts: [
      part('armL', -80, 30, 16, 200, 'aimed', 1.6), part('armR', 80, 30, 16, 200, 'aimed', 1.6),
      part('rack', 0, -60, 18, 220, 'missile', 4.0), part('chin', 0, 46, 14, 180, 'spread3', 2.4),
    ],
    settleY: 200, sway: 70, swaySpeed: 0.25, bounty: 3000, escort: { kind: 'walker', every: 6 },
  },
  mantis: {
    id: 'mantis', name: 'MANTIS', title: 'Bio-Machine', layer: 'ground',
    coreHp: 3200, coreWeapon: 'spread3', corePeriod: 2.2,
    hitboxes: [{ dx: 0, dy: 40, r: 40 }, { dx: 0, dy: -30, r: 46 }, { dx: 0, dy: -110, r: 40 }, { dx: -70, dy: 80, r: 26 }, { dx: 70, dy: 80, r: 26 }],
    parts: [
      part('scytheL', -72, 92, 16, 220, 'aimed', 1.6), part('scytheR', 72, 92, 16, 220, 'aimed', 1.6),
      part('eyes', 0, 62, 15, 240, 'spread3', 2.0), part('sting', 0, -130, 16, 240, 'missile', 3.6),
    ],
    settleY: 200, sway: 100, swaySpeed: 0.3, bounty: 4000, escort: { kind: 'wasp', every: 4 },
  },
  basilisk: {
    id: 'basilisk', name: 'BASILISK', title: 'Swamp Beast', layer: 'ground',
    coreHp: 3800, coreWeapon: 'spread3', corePeriod: 2.0,
    hitboxes: [{ dx: 0, dy: 110, r: 38 }, { dx: 0, dy: 30, r: 54 }, { dx: 0, dy: -60, r: 46 }, { dx: 0, dy: -140, r: 28 }],
    parts: [
      part('jaws', 0, 130, 18, 280, 'spread3', 1.8), part('spineL', -40, 10, 15, 240, 'flak', 2.4),
      part('spineR', 40, 10, 15, 240, 'flak', 2.4), part('tail', 0, -150, 16, 260, 'missile', 3.6),
    ],
    settleY: 190, sway: 90, swaySpeed: 0.22, bounty: 5000, escort: { kind: 'beetle', every: 6 },
  },
  sentinel: {
    id: 'sentinel', name: 'SENTINEL', title: 'Temple Guardian', layer: 'ground',
    coreHp: 4400, coreWeapon: 'aimed', corePeriod: 1.4,
    hitboxes: [{ dx: 0, dy: 0, r: 70 }, { dx: -96, dy: 30, r: 32 }, { dx: 96, dy: 30, r: 32 }, { dx: 0, dy: -86, r: 34 }],
    parts: [
      part('eye', 0, 24, 18, 320, 'aimed', 1.4), part('handL', -96, 40, 16, 260, 'spread3', 2.2),
      part('handR', 96, 40, 16, 260, 'spread3', 2.2), part('crown', 0, -90, 16, 260, 'missile', 3.4),
    ],
    settleY: 200, sway: 0, swaySpeed: 0, bounty: 6000, escort: { kind: 'walker', every: 5 },
  },
  queen: {
    id: 'queen', name: 'HIVE QUEEN', title: 'Hive Mother', layer: 'ground',
    coreHp: 5000, coreWeapon: 'spread3', corePeriod: 1.6,
    hitboxes: [
      { dx: 0, dy: 100, r: 36 }, { dx: 0, dy: 20, r: 52 }, { dx: -90, dy: 0, r: 34 }, { dx: 90, dy: 0, r: 34 },
      { dx: 0, dy: -80, r: 46 }, { dx: 0, dy: -150, r: 30 },
    ],
    parts: [
      part('head', 0, 120, 20, 340, 'spread3', 1.6), part('wingL', -90, 0, 16, 280, 'aimed', 1.5),
      part('wingR', 90, 0, 16, 280, 'aimed', 1.5), part('sac', 0, -90, 18, 300, 'flak', 2.2),
      part('ovi', 0, -150, 16, 280, 'missile', 3.4),
    ],
    settleY: 180, sway: 110, swaySpeed: 0.26, bounty: 8000, escort: { kind: 'wasp', every: 4 },
  },
} as const satisfies Record<string, BossDef>;
