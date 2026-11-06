import type { BossDef, BossPartDef } from './bosses';
import type { EnemyWeapon } from './types';

// The five bosses of map 3 (doc 48), generic names. Same local coordinates as data/bosses.ts (nose / bow points
// down, +y); the art in render/bosses-3.ts is laid out on these hitboxes and parts.

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

export const BOSSES_3 = {
  glacier: {
    id: 'glacier', name: 'GLACIER', title: 'Armoured Icebreaker', layer: 'ground',
    coreHp: 3000, coreWeapon: 'spread3', corePeriod: 2.6,
    hitboxes: [{ dx: 0, dy: -110, r: 40 }, { dx: 0, dy: -40, r: 46 }, { dx: 0, dy: 40, r: 46 }, { dx: 0, dy: 115, r: 40 }],
    parts: [
      part('bow', 0, 118, 18, 240, 'spread3', 1.9), part('f1', -38, 40, 15, 200, 'flak', 2.4),
      part('f2', 38, 40, 15, 200, 'flak', 2.4), part('m1', -34, -40, 15, 200, 'missile', 4.2),
      part('m2', 34, -40, 15, 200, 'missile', 4.2), part('aft', 0, -112, 18, 240, 'aimed', 1.7),
    ],
    settleY: 200, sway: 70, swaySpeed: 0.25, bounty: 3000, escort: { kind: 'boat', every: 6 },
  },
  citadel: {
    id: 'citadel', name: 'CITADEL', title: 'Mountain Fortress', layer: 'ground',
    coreHp: 4000, coreWeapon: 'missile', corePeriod: 3.2,
    hitboxes: [{ dx: 0, dy: 0, r: 72 }, { dx: -100, dy: -78, r: 34 }, { dx: 100, dy: -78, r: 34 }, { dx: -100, dy: 78, r: 34 }, { dx: 100, dy: 78, r: 34 }],
    parts: [
      part('t1', -100, -78, 18, 260, 'flak', 2.3), part('t2', 100, -78, 18, 260, 'flak', 2.3),
      part('t3', -100, 78, 18, 260, 'aimed', 1.6), part('t4', 100, 78, 18, 260, 'aimed', 1.6),
      part('gate', 0, 74, 18, 280, 'spread3', 2.0),
    ],
    settleY: 190, sway: 0, swaySpeed: 0, bounty: 4000, escort: { kind: 'hind', every: 7 },
  },
  caiman: {
    id: 'caiman', name: 'CAIMAN', title: 'River Monitor', layer: 'ground',
    coreHp: 5000, coreWeapon: 'aimed', corePeriod: 1.5,
    hitboxes: [{ dx: 0, dy: -92, r: 32 }, { dx: 0, dy: -28, r: 42 }, { dx: 0, dy: 38, r: 42 }, { dx: 0, dy: 100, r: 30 }],
    parts: [
      part('fore', 0, 72, 18, 280, 'spread3', 1.8), part('aft', 0, -72, 18, 280, 'spread3', 1.8),
      part('mortar', -34, 10, 15, 240, 'flak', 2.5), part('rack', 34, 10, 15, 240, 'missile', 3.9),
    ],
    settleY: 210, sway: 130, swaySpeed: 0.3, bounty: 5000, escort: { kind: 'hind', every: 6 },
  },
  mammoth: {
    id: 'mammoth', name: 'MAMMOTH', title: 'Super-Heavy Tank', layer: 'ground',
    coreHp: 6000, coreWeapon: 'spread3', corePeriod: 2.2,
    hitboxes: [{ dx: 0, dy: 0, r: 70 }, { dx: -84, dy: -50, r: 32 }, { dx: 84, dy: -50, r: 32 }, { dx: -84, dy: 50, r: 32 }, { dx: 84, dy: 50, r: 32 }],
    parts: [
      part('main', 0, 30, 22, 340, 'spread3', 2.0), part('s1', -52, 58, 15, 240, 'aimed', 1.5),
      part('s2', 52, 58, 15, 240, 'aimed', 1.5), part('aa1', -58, -60, 15, 220, 'flak', 2.4),
      part('aa2', 58, -60, 15, 220, 'flak', 2.4), part('pod', 0, -70, 16, 260, 'missile', 3.6),
    ],
    settleY: 195, sway: 110, swaySpeed: 0.28, bounty: 6000, escort: { kind: 'tank', every: 5 },
  },
  behemoth: {
    id: 'behemoth', name: 'BEHEMOTH', title: 'Twin-Rotor Gunship', layer: 'air',
    coreHp: 8000, coreWeapon: 'aimed', corePeriod: 1.3,
    hitboxes: [{ dx: 0, dy: -105, r: 38 }, { dx: 0, dy: -30, r: 44 }, { dx: 0, dy: 45, r: 44 }, { dx: 0, dy: 115, r: 36 }, { dx: -72, dy: 10, r: 28 }, { dx: 72, dy: 10, r: 28 }],
    parts: [
      part('chin', 0, 142, 16, 300, 'aimed', 1.2), part('d1', -44, 40, 15, 260, 'spread3', 1.6),
      part('d2', 44, 40, 15, 260, 'spread3', 1.6), part('p1', -78, 6, 16, 280, 'missile', 3.6),
      part('p2', 78, 6, 16, 280, 'missile', 3.6), part('tail', 0, -140, 16, 260, 'flak', 2.2),
    ],
    settleY: 170, sway: 160, swaySpeed: 0.42, bounty: 8000, escort: { kind: 'hind', every: 5 },
  },
} as const satisfies Record<string, BossDef>;
