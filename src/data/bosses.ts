import { BOSSES_2 } from './bosses-2';
import type { BossId, EnemyKind, EnemyWeapon, Layer } from './types';

export interface Hitbox {
  dx: number;
  dy: number;
  r: number;
}

export interface BossPartDef {
  id: string;
  dx: number;
  dy: number;
  r: number;
  hp: number;
  weapon: EnemyWeapon;
  period: number;
}

export interface BossDef {
  id: BossId;
  name: string;
  title: string;
  layer: Layer;
  coreHp: number;
  coreWeapon: EnemyWeapon;
  corePeriod: number;
  hitboxes: readonly Hitbox[];
  parts: readonly BossPartDef[];
  settleY: number;
  sway: number;
  swaySpeed: number;
  bounty: number;
  escort: { kind: EnemyKind; every: number } | null;
}

const part = (id: string, dx: number, dy: number, r: number, hp: number, weapon: EnemyWeapon, period: number): BossPartDef =>
  ({ id, dx, dy, r, hp, weapon, period });

// Boss art in render/draw-bosses.ts is laid out in the same local coordinates (nose/bow points down, +y).
const BOSSES_1 = {
  ironclad: {
    id: 'ironclad', name: 'IRONCLAD', title: 'Battleship', layer: 'ground',
    coreHp: 2600, coreWeapon: 'spread3', corePeriod: 3.2,
    hitboxes: [{ dx: 0, dy: -130, r: 40 }, { dx: 0, dy: -60, r: 46 }, { dx: 0, dy: 10, r: 46 }, { dx: 0, dy: 80, r: 44 }, { dx: 0, dy: 140, r: 34 }],
    parts: [
      part('t1', 0, 110, 20, 180, 'aimed', 1.8), part('t2', 0, 55, 20, 180, 'aimed', 2.0),
      part('t3', 0, -70, 20, 180, 'aimed', 2.0), part('t4', 0, -125, 20, 180, 'aimed', 1.8),
      part('m1', -32, -10, 14, 140, 'missile', 4.5), part('m2', 32, -10, 14, 140, 'missile', 4.5),
    ],
    settleY: 200, sway: 120, swaySpeed: 0.35, bounty: 2000, escort: null,
  },
  sandstorm: {
    id: 'sandstorm', name: 'SANDSTORM', title: 'Coastal Fortress', layer: 'ground',
    coreHp: 4000, coreWeapon: 'spread3', corePeriod: 2.6,
    hitboxes: [{ dx: 0, dy: 0, r: 80 }, { dx: -105, dy: 0, r: 58 }, { dx: 105, dy: 0, r: 58 }],
    parts: [
      part('s1', -130, -80, 20, 210, 'missile', 4.2), part('s2', 130, -80, 20, 210, 'missile', 4.2),
      part('a1', -130, 80, 20, 210, 'flak', 2.4), part('a2', 130, 80, 20, 210, 'flak', 2.4),
      part('c', 0, 45, 24, 330, 'spread3', 1.6),
    ],
    settleY: 180, sway: 0, swaySpeed: 0, bounty: 3000, escort: { kind: 'hind', every: 7 },
  },
  blackjack: {
    id: 'blackjack', name: 'BLACKJACK', title: 'Strategic Bomber', layer: 'air',
    coreHp: 5000, coreWeapon: 'aimed', corePeriod: 1.4,
    hitboxes: [{ dx: 0, dy: -40, r: 40 }, { dx: 0, dy: 35, r: 38 }, { dx: -90, dy: -25, r: 38 }, { dx: 90, dy: -25, r: 38 }, { dx: -150, dy: -45, r: 24 }, { dx: 150, dy: -45, r: 24 }],
    parts: [
      part('e1', -55, -55, 18, 240, 'aimed', 1.5), part('e2', 55, -55, 18, 240, 'aimed', 1.5),
      part('tg', 0, -100, 16, 210, 'spread3', 1.3),
      part('p1', -125, -35, 15, 180, 'missile', 4.0), part('p2', 125, -35, 15, 180, 'missile', 4.0),
    ],
    settleY: 170, sway: 160, swaySpeed: 0.45, bounty: 4000, escort: { kind: 'drone', every: 3 },
  },
  typhoon: {
    id: 'typhoon', name: 'TYPHOON', title: 'Flying Wing', layer: 'air',
    coreHp: 6000, coreWeapon: 'missile', corePeriod: 3.4,
    hitboxes: [{ dx: 0, dy: 0, r: 58 }, { dx: -110, dy: -15, r: 42 }, { dx: 110, dy: -15, r: 42 }, { dx: -190, dy: -38, r: 28 }, { dx: 190, dy: -38, r: 28 }],
    parts: [
      part('w1', -80, 12, 18, 270, 'aimed', 1.4), part('w2', 80, 12, 18, 270, 'aimed', 1.4),
      part('w3', -160, -22, 16, 220, 'flak', 2.2), part('w4', 160, -22, 16, 220, 'flak', 2.2),
      part('n', 0, 40, 18, 300, 'spread3', 1.2),
    ],
    settleY: 160, sway: 140, swaySpeed: 0.5, bounty: 5000, escort: { kind: 'fulcrum', every: 6 },
  },
  leviathan: {
    id: 'leviathan', name: 'LEVIATHAN', title: 'Enemy Supercarrier', layer: 'ground',
    coreHp: 8000, coreWeapon: 'spread3', corePeriod: 2.2,
    hitboxes: [{ dx: 0, dy: -170, r: 56 }, { dx: 0, dy: -85, r: 70 }, { dx: 0, dy: 0, r: 72 }, { dx: 0, dy: 85, r: 70 }, { dx: 0, dy: 165, r: 56 }],
    parts: [
      part('c1', -78, -185, 16, 240, 'aimed', 1.3), part('c2', 78, -185, 16, 240, 'aimed', 1.3),
      part('c3', -78, 175, 16, 240, 'aimed', 1.3), part('c4', 78, 175, 16, 240, 'aimed', 1.3),
      part('s1', 86, -40, 18, 300, 'missile', 3.6), part('s2', 86, 40, 18, 300, 'missile', 3.6),
      part('g', -55, 0, 20, 330, 'spread3', 1.8),
    ],
    settleY: 225, sway: 80, swaySpeed: 0.3, bounty: 8000, escort: { kind: 'fishbed', every: 3.2 },
  },
} satisfies Record<string, BossDef>;

export const BOSSES: Readonly<Record<BossId, BossDef>> = Object.freeze({ ...BOSSES_1, ...BOSSES_2 });
