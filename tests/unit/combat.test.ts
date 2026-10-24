import { describe, it, expect } from 'vitest';
import { applyDamage, circleHit, rollDrop, scaleEnemy, steerHoming, headingTo } from '../../src/game/combat';
import { emptyTally, isMissionOver, objectiveMet, objectiveProgress, type EndCheck } from '../../src/game/objectives';
import { ENEMIES } from '../../src/data/enemies';

const end = (over: Partial<EndCheck> = {}): EndCheck => ({
  playerDead: false, bossMission: false, bossKilled: false, t: 10, length: 80, enemiesOnScreen: 3, overtime: 0, ...over,
});

describe('Combat rules', () => {
  describe('circleHit', () => {
    it('detects overlap and separation', () => {
      expect(circleHit(0, 0, 10, 15, 0, 6)).toBe(true);
      expect(circleHit(0, 0, 10, 16, 0, 6)).toBe(true);
      expect(circleHit(0, 0, 10, 16.1, 0, 6)).toBe(false);
      expect(circleHit(0, 0, 5, 3, 4, 0)).toBe(true);
    });
  });

  describe('applyDamage', () => {
    it('halves gun damage against ground targets', () => {
      expect(applyDamage(10, { source: 'gun', targetLayer: 'ground' })).toBe(5);
      expect(applyDamage(10, { source: 'gun', targetLayer: 'air' })).toBe(10);
      expect(applyDamage(140, { source: 'secondary', targetLayer: 'ground' })).toBe(140);
    });

    it('reduces enemy bullet damage by 25% with ECM', () => {
      expect(applyDamage(8, { source: 'enemyBullet', ecm: true })).toBe(6);
      expect(applyDamage(8, { source: 'enemyBullet', ecm: false })).toBe(8);
      expect(applyDamage(12, { source: 'flak', ecm: true })).toBe(9);
      expect(applyDamage(22, { source: 'enemyMissile', ecm: true })).toBe(22);
    });
  });

  describe('scaleEnemy', () => {
    it('scales hp, fire period and bounty with difficulty', () => {
      const base = scaleEnemy(ENEMIES.fishbed, 1);
      expect(base).toEqual({ hp: 30, period: 2.2, period2: 0, bulletSpeedMul: 1, bounty: 30 });
      const late = scaleEnemy(ENEMIES.fishbed, 11);
      expect(late.hp).toBe(48);
      expect(late.period).toBeCloseTo(2.2 / 1.3, 5);
      expect(late.bounty).toBe(39);
      expect(late.bulletSpeedMul).toBeCloseTo(1.15, 5);
    });
  });

  describe('steerHoming', () => {
    it('turns toward the target no faster than the turn rate', () => {
      expect(headingTo(0, 0, 0, -10)).toBeCloseTo(0, 5);
      expect(headingTo(0, 0, 10, 0)).toBeCloseTo(Math.PI / 2, 5);
      const h = steerHoming(0, 0, 0, 100, 0, 2, 0.1);
      expect(h).toBeCloseTo(0.2, 5);
      const near = steerHoming(0, 0, 0, 1, -100, 2, 0.1);
      expect(near).toBeCloseTo(Math.atan2(1, 100), 5);
    });
  });

  describe('objectives', () => {
    it('tracks patrol, intercept, strike and boss objectives', () => {
      const tally = { ...emptyTally(), kills: 9, airKills: 7, killsByKind: { sam: 3 } };
      expect(objectiveMet({ type: 'patrol' }, tally, true)).toBe(true);
      expect(objectiveMet({ type: 'patrol' }, tally, false)).toBe(false);
      expect(objectiveProgress({ type: 'intercept', count: 12 }, tally)).toEqual({ current: 7, required: 12 });
      expect(objectiveMet({ type: 'strike', target: 'sam', count: 3 }, tally, true)).toBe(true);
      expect(objectiveMet({ type: 'strike', target: 'radar', count: 1 }, tally, true)).toBe(false);
      expect(objectiveMet({ type: 'boss', boss: 'ironclad' }, { ...tally, bossKilled: true }, true)).toBe(true);
    });
  });

  describe('isMissionOver', () => {
    it('ends on death, boss kill, or timeline end with an empty screen', () => {
      expect(isMissionOver(end())).toBe(false);
      expect(isMissionOver(end({ playerDead: true }))).toBe(true);
      expect(isMissionOver(end({ t: 80, enemiesOnScreen: 2 }))).toBe(false);
      expect(isMissionOver(end({ t: 80, enemiesOnScreen: 0 }))).toBe(true);
      expect(isMissionOver(end({ t: 88, enemiesOnScreen: 2, overtime: 8 }))).toBe(true);
      expect(isMissionOver(end({ bossMission: true, t: 200, enemiesOnScreen: 0 }))).toBe(false);
      expect(isMissionOver(end({ bossMission: true, bossKilled: true }))).toBe(true);
    });
  });

  describe('rollDrop', () => {
    it('returns drops according to the roll thresholds', () => {
      expect(rollDrop(0)).toBe('cash');
      expect(rollDrop(0.139)).toBe('cash');
      expect(rollDrop(0.15)).toBe('repair');
      expect(rollDrop(0.2)).toBe('power');
      expect(rollDrop(0.25)).toBe('ammo');
      expect(rollDrop(0.27)).toBeNull();
      expect(rollDrop(0.99)).toBeNull();
    });
  });
});
