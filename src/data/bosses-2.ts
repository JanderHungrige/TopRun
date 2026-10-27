import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// The five bosses of map 2 (doc 35), generic names. Same local coordinates as data/bosses.ts (nose / bow points
// down, +y); the art in render/bosses-2.ts is laid out on these hitboxes and parts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_2 = {
  kraken: {
    id: 'kraken', name: 'KRAKEN', title: 'Sea Fortress', layer: 'ground',
    coreHp: 3600, coreWeapon: 'spread3', corePeriod: 2.4,
    hitboxes: [{ dx: 0, dy: 0, r: 70 }, { dx: -125, dy: -30, r: 50 }, { dx: 125, dy: -30, r: 50 }, { dx: 0, dy: -110, r: 40 }],
    parts: [
      part('f1', -140, -45, 18, 260, 'flak', 2.2), part('f2', 140, -45, 18, 260, 'flak', 2.2),
      part('m1', -110, 0, 16, 240, 'missile', 4.0), part('m2', 110, 0, 16, 240, 'missile', 4.0),
      part('t1', -30, 45, 18, 280, 'aimed', 1.6), part('t2', 30, 45, 18, 280, 'aimed', 1.6),
      part('c', 0, -110, 20, 320, 'spread3', 1.8),
    ],
    settleY: 190, sway: 0, swaySpeed: 0, bounty: 9000, escort: { kind: 'boat', every: 6 },
  },
  condor: {
    id: 'condor', name: 'CONDOR', title: 'Heavy Gunship', layer: 'air',
    coreHp: 4200, coreWeapon: 'aimed', corePeriod: 1.2,
    hitboxes: [{ dx: 0, dy: -60, r: 40 }, { dx: 0, dy: 20, r: 42 }, { dx: 0, dy: 95, r: 30 }, { dx: -110, dy: -10, r: 34 }, { dx: 110, dy: -10, r: 34 }, { dx: -190, dy: -5, r: 24 }, { dx: 190, dy: -5, r: 24 }],
    parts: [
      part('e1', -80, -15, 16, 260, 'flak', 2.6), part('e2', 80, -15, 16, 260, 'flak', 2.6),
      part('e3', -150, -10, 16, 240, 'aimed', 1.8), part('e4', 150, -10, 16, 240, 'aimed', 1.8),
      part('g1', -34, 50, 15, 280, 'spread3', 1.4), part('g2', 34, 50, 15, 280, 'spread3', 1.4),
      part('tail', 0, -125, 14, 220, 'missile', 4.2),
    ],
    settleY: 170, sway: 180, swaySpeed: 0.4, bounty: 10000, escort: { kind: 'fulcrum', every: 6 },
  },
  python: {
    id: 'python', name: 'PYTHON', title: 'Armoured Train', layer: 'ground',
    coreHp: 4800, coreWeapon: 'spread3', corePeriod: 2.2,
    hitboxes: [{ dx: -200, dy: 0, r: 30 }, { dx: -130, dy: 0, r: 34 }, { dx: -60, dy: 0, r: 34 }, { dx: 10, dy: 0, r: 34 }, { dx: 80, dy: 0, r: 34 }, { dx: 150, dy: 0, r: 34 }, { dx: 215, dy: 0, r: 28 }],
    parts: [
      part('a1', -130, 0, 18, 280, 'aimed', 1.6), part('k1', -60, 0, 18, 280, 'flak', 2.2),
      part('r', 10, 0, 20, 320, 'missile', 3.8), part('k2', 80, 0, 18, 280, 'flak', 2.2),
      part('a2', 150, 0, 18, 280, 'aimed', 1.6),
    ],
    settleY: 200, sway: 140, swaySpeed: 0.35, bounty: 11000, escort: { kind: 'hind', every: 5 },
  },
  scorpion: {
    id: 'scorpion', name: 'SCORPION', title: 'Missile Crawler', layer: 'ground',
    coreHp: 5600, coreWeapon: 'spread3', corePeriod: 2.0,
    hitboxes: [{ dx: 0, dy: 0, r: 62 }, { dx: 0, dy: -85, r: 44 }, { dx: -85, dy: 62, r: 30 }, { dx: 85, dy: 62, r: 30 }, { dx: 0, dy: -150, r: 28 }],
    parts: [
      part('c1', -92, 78, 18, 300, 'aimed', 1.5), part('c2', 92, 78, 18, 300, 'aimed', 1.5),
      part('f1', -56, -18, 16, 260, 'flak', 2.2), part('f2', 56, -18, 16, 260, 'flak', 2.2),
      part('sting', 0, -150, 20, 380, 'missile', 3.4),
    ],
    settleY: 190, sway: 100, swaySpeed: 0.3, bounty: 12000, escort: { kind: 'tank', every: 5 },
  },
  colossus: {
    id: 'colossus', name: 'COLOSSUS', title: 'Flying Fortress', layer: 'air',
    coreHp: 7000, coreWeapon: 'missile', corePeriod: 3.0,
    hitboxes: [{ dx: 0, dy: 0, r: 70 }, { dx: -120, dy: -20, r: 50 }, { dx: 120, dy: -20, r: 50 }, { dx: -220, dy: -40, r: 32 }, { dx: 220, dy: -40, r: 32 }, { dx: 0, dy: 90, r: 40 }],
    parts: [
      part('w1', -90, 30, 18, 320, 'aimed', 1.3), part('w2', 90, 30, 18, 320, 'aimed', 1.3),
      part('p1', -170, -15, 18, 300, 'missile', 3.6), part('p2', 170, -15, 18, 300, 'missile', 3.6),
      part('f1', -40, -50, 16, 280, 'flak', 2.0), part('f2', 40, -50, 16, 280, 'flak', 2.0),
      part('n', 0, 110, 20, 360, 'spread3', 1.2),
    ],
    settleY: 165, sway: 150, swaySpeed: 0.45, bounty: 15000, escort: { kind: 'flanker', every: 5 },
  },
} as const satisfies Record<string, BossDef>;
