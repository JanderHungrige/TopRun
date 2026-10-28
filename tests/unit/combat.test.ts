import { describe, it, expect } from 'vitest';
import { applyDamage, circleHit, hitScale, rollDrop, scaleBossHp, scaleEnemy, steerHoming, headingTo } from '../../src/game/combat';
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

    it('reduces enemy bullet damage by the ECM share', () => {
      expect(applyDamage(8, { source: 'enemyBullet', ecm: 0.75 })).toBe(6);
      expect(applyDamage(8, { source: 'enemyBullet' })).toBe(8);
      expect(applyDamage(12, { source: 'flak', ecm: 0.75 })).toBe(9);
      expect(applyDamage(20, { source: 'flak', ecm: 0.55 })).toBe(11);
      expect(applyDamage(22, { source: 'enemyMissile', ecm: 0.55 })).toBe(22);
    });

    it('lets uranium ammo raise the gun damage ground targets take (doc 43)', () => {
      expect(applyDamage(10, { source: 'gun', targetLayer: 'ground', ground: 0.8 })).toBe(8);
      expect(applyDamage(10, { source: 'gun', targetLayer: 'air', ground: 0.8 })).toBe(10);
      expect(applyDamage(10, { source: 'cannon', targetLayer: 'ground', ground: 0.65 })).toBe(10);
    });
  });

  describe('scaleEnemy', () => {
    it('scales hp, fire period and bounty with difficulty', () => {
      const base = scaleEnemy(ENEMIES.fishbed, 1);
      expect(base).toEqual({ hp: 30, period: 2.2, period2: 0, bulletSpeedMul: 1, bounty: 30 });
      const late = scaleEnemy(ENEMIES.fishbed, 11);
      expect(late.hp).toBe(57); // 30 × (1 + 0.6 + 0.3), doc 43
      expect(late.period).toBeCloseTo(2.2 / 1.3, 5);
      expect(late.bounty).toBe(39);
      expect(late.bulletSpeedMul).toBeCloseTo(1.15, 5);
    });
  });

  describe('threat curve (doc 43)', () => {
    it('keeps the Pacific within a few percent of the old linear scaling and bends upwards later', () => {
      const linear = (hp: number, d: number): number => hp * (1 + 0.06 * (d - 1));
      expect(scaleEnemy(ENEMIES.bear, 6).hp / linear(320, 6)).toBeLessThan(1.07);
      expect(scaleEnemy(ENEMIES.bear, 18).hp / linear(320, 18)).toBeCloseTo(1.43, 1);
      expect(scaleEnemy(ENEMIES.bear, 30).hp / linear(320, 30)).toBeCloseTo(1.92, 1);
      expect(scaleEnemy(ENEMIES.bear, 60).hp / linear(320, 60)).toBeCloseTo(3.3, 1);
    });

    it('scales boss HP with the same shape, a little gentler', () => {
      expect(scaleBossHp(1000, 1)).toBe(1000);
      expect(scaleBossHp(1000, 30)).toBe(Math.round(1000 * (1 + 0.05 * 29 + 0.002 * 29 * 29)));
      expect(scaleBossHp(1000, 30) / scaleEnemy({ ...ENEMIES.bear, hp: 1000 }, 30).hp).toBeLessThan(1);
    });

    it('makes enemy hits hurt more at higher difficulty', () => {
      expect(hitScale(1)).toBe(1);
      expect(hitScale(6)).toBeCloseTo(1.1, 5);
      expect(hitScale(60)).toBeCloseTo(2.18, 5);
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
