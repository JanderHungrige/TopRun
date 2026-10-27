import { wrapAngle } from '../core/math';
import type { EnemyDef } from '../data/enemies';
import type { Layer } from '../data/types';

export const circleHit = (ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean => {
  const dx = bx - ax;
  const dy = by - ay;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
};

/** `cannon` = the A-10's GAU-8 burst: full damage on ground targets, unlike the gun (doc 36). */
export type DamageSource = 'gun' | 'cannon' | 'secondary' | 'ram' | 'enemyBullet' | 'enemyMissile' | 'flak' | 'collision';

export const PLAYER_DAMAGE = Object.freeze({ bullet: 8, missile: 22, flak: 12, collision: 25 });
export const COLLISION_DAMAGE_TO_ENEMY = 80;
export const GROUND_GUN_FACTOR = 0.5;
export const ECM_BULLET_FACTOR = 0.75;
export const ECM_TURN_FACTOR = 0.7;

export interface DamageContext {
  source: DamageSource;
  targetLayer?: Layer;
  ecm?: boolean;
}

export function applyDamage(base: number, c: DamageContext): number {
  switch (c.source) {
    case 'gun': return c.targetLayer === 'ground' ? base * GROUND_GUN_FACTOR : base;
    case 'enemyBullet':
    case 'flak': return c.ecm ? base * ECM_BULLET_FACTOR : base;
    case 'cannon':
    case 'secondary':
    case 'ram':
    case 'enemyMissile':
    case 'collision': return base;
    default: throw new Error(`unhandled: ${c.source satisfies never}`);
  }
}

export interface ScaledEnemy {
  hp: number;
  period: number;
  period2: number;
  bulletSpeedMul: number;
  bounty: number;
}

export function scaleEnemy(def: EnemyDef, difficulty: number): ScaledEnemy {
  const d = Math.max(0, difficulty - 1);
  const fire = 1 + 0.03 * d;
  return {
    hp: Math.round(def.hp * (1 + 0.06 * d)),
    period: def.period / fire,
    period2: def.period2 / fire,
    bulletSpeedMul: 1 + 0.015 * d,
    bounty: Math.round(def.bounty * (1 + 0.03 * d)),
  };
}

export const scaleBossHp = (hp: number, difficulty: number): number => Math.round(hp * (1 + 0.05 * Math.max(0, difficulty - 1)));

/** Heading convention: 0 = straight up (-y), positive = clockwise. */
export const headingTo = (x: number, y: number, tx: number, ty: number): number => Math.atan2(tx - x, -(ty - y));

export function steerHoming(heading: number, x: number, y: number, tx: number, ty: number, turnRate: number, dt: number): number {
  const diff = wrapAngle(headingTo(x, y, tx, ty) - heading);
  const max = turnRate * dt;
  return wrapAngle(heading + Math.max(-max, Math.min(max, diff)));
}

export type DropKind = 'cash' | 'repair' | 'power' | 'ammo';

/** Maps a uniform roll in [0,1) to a drop: 14% cash, 5% repair, 4% power, 4% ammo. */
export function rollDrop(roll: number): DropKind | null {
  if (roll < 0.14) return 'cash';
  if (roll < 0.19) return 'repair';
  if (roll < 0.23) return 'power';
  if (roll < 0.27) return 'ammo';
  return null;
}
