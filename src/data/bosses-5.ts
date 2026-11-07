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
  medusa: {
    id: 'medusa', name: 'MEDUSA', title: 'Jellyfish Queen', layer: 'ground',
    coreHp: 3200, coreWeapon: 'spread3', corePeriod: 2.4,
    hitboxes: [{ dx: 0, dy: 30, r: 78 }, { dx: -70, dy: -60, r: 30 }, { dx: 70, dy: -60, r: 30 }, { dx: -30, dy: -90, r: 26 }, { dx: 30, dy: -90, r: 26 }],
    parts: [
      part('t1', -70, -60, 16, 200, 'aimed', 1.8), part('t2', 70, -60, 16, 200, 'aimed', 1.8),
      part('t3', -30, -95, 16, 220, 'spread3', 2.4), part('t4', 30, -95, 16, 220, 'spread3', 2.4),
    ],
    settleY: 210, sway: 90, swaySpeed: 0.2, bounty: 4000, escort: { kind: 'jelly', every: 4 },
  },
  bastion: {
    id: 'bastion', name: 'BASTION', title: 'Seabed Fortress', layer: 'ground',
    coreHp: 3800, coreWeapon: 'missile', corePeriod: 3.6,
    hitboxes: [{ dx: 0, dy: 0, r: 70 }, { dx: -95, dy: 30, r: 34 }, { dx: 95, dy: 30, r: 34 }, { dx: -80, dy: -55, r: 30 }, { dx: 80, dy: -55, r: 30 }],
    parts: [
      part('g1', -95, 40, 16, 240, 'aimed', 1.7), part('g2', 95, 40, 16, 240, 'aimed', 1.7),
      part('g3', -80, -55, 16, 240, 'flak', 2.5), part('g4', 80, -55, 16, 240, 'flak', 2.5),
      part('silo', 0, -40, 18, 280, 'missile', 3.6),
    ],
    settleY: 200, sway: 0, swaySpeed: 0, bounty: 5000, escort: { kind: 'minisub', every: 6 },
  },
  goliath: {
    id: 'goliath', name: 'GOLIATH', title: 'Giant Squid', layer: 'ground',
    coreHp: 4400, coreWeapon: 'aimed', corePeriod: 1.6,
    hitboxes: [{ dx: 0, dy: -70, r: 50 }, { dx: 0, dy: 10, r: 46 }, { dx: -50, dy: 90, r: 26 }, { dx: 50, dy: 90, r: 26 }, { dx: -20, dy: 130, r: 22 }, { dx: 20, dy: 130, r: 22 }],
    parts: [
      part('eyeL', -30, 20, 14, 220, 'aimed', 1.5), part('eyeR', 30, 20, 14, 220, 'aimed', 1.5),
      part('armL', -50, 100, 15, 240, 'spread3', 2.2), part('armR', 50, 100, 15, 240, 'spread3', 2.2),
      part('ink', 0, -40, 16, 260, 'flak', 2.0),
    ],
    settleY: 190, sway: 100, swaySpeed: 0.3, bounty: 6000, escort: { kind: 'squid', every: 5 },
  },
  jormungand: {
    id: 'jormungand', name: 'JORMUNGAND', title: 'Sea Serpent', layer: 'ground',
    coreHp: 4800, coreWeapon: 'spread3', corePeriod: 1.7,
    hitboxes: [
      { dx: 0, dy: 140, r: 36 }, { dx: -60, dy: 80, r: 34 }, { dx: 40, dy: 20, r: 36 }, { dx: -40, dy: -40, r: 36 },
      { dx: 50, dy: -100, r: 34 }, { dx: 0, dy: -150, r: 28 },
    ],
    parts: [
      part('head', 0, 150, 20, 340, 'spread3', 1.6), part('c1', -60, 80, 16, 280, 'aimed', 1.4),
      part('c2', 40, 20, 16, 280, 'missile', 3.4), part('c3', -40, -40, 16, 280, 'flak', 2.2),
    ],
    settleY: 175, sway: 110, swaySpeed: 0.28, bounty: 8000, escort: { kind: 'angler', every: 5 },
  },
} as const satisfies Record<string, BossDef>;
