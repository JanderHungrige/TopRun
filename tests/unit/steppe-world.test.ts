import { describe, expect, it } from 'vitest';
import { BOSSES_7 } from '../../src/data/bosses-7';
import { ENEMIES } from '../../src/data/enemies';
import { ENEMIES_7 } from '../../src/data/enemies-7';
import { steppe, THEATERS } from '../../src/data/theaters';
import { THEATERS_7 } from '../../src/data/theaters-7';
import { deathBrood, RAY, shieldShare, spawnDue } from '../../src/game/steppe-army';

// The alien steppe (doc 105): the invasion army, its spawners and shields, the heat ray, the five bosses, the floors.

describe('Steppe world (doc 105)', () => {
  it('fields an invasion army of thirteen kinds, on foot and in the air', () => {
    expect(Object.keys(ENEMIES_7)).toHaveLength(13);
    const air = Object.values(ENEMIES_7).filter((e) => e.layer === 'air').map((e) => e.kind);
    expect(air).toEqual(['scoutdisc', 'discfighter', 'manta']);
    for (const k of Object.keys(ENEMIES_7) as (keyof typeof ENEMIES_7)[]) expect(ENEMIES[k]).toEqual(ENEMIES_7[k]);
    expect(ENEMIES.tripod.weapon).toBe('ray');
    expect(ENEMIES.wartripod.hp).toBeGreaterThan(2000);
  });

  it('lets a landing pod out a trooper every 6 s, and a brood carrier four crawlers when it dies', () => {
    const pod = ENEMIES.landingpod;
    expect(spawnDue(pod, 5.99, 0.016)).toBe(false);
    expect(spawnDue(pod, 6.005, 0.016)).toBe(true);
    expect(spawnDue(pod, 12.01, 0.016)).toBe(true);
    expect(spawnDue(ENEMIES.crawler, 6.005, 0.016)).toBe(false);
    const brood = deathBrood(ENEMIES.broodcarrier, 100, 200);
    expect(brood).toHaveLength(4);
    for (const b of brood) expect(Math.hypot(b.x - 100, b.y - 200)).toBeLessThan(30);
    expect(deathBrood(ENEMIES.trooper, 0, 0)).toEqual([]);
  });

  it('halves the hits on others within a live shield bearer\'s reach, never on itself', () => {
    const bearer = { x: 0, y: 0, dead: false, def: ENEMIES.shieldbearer };
    const near = { x: 60, y: 0, dead: false, def: ENEMIES.trooper };
    const far = { x: 200, y: 0, dead: false, def: ENEMIES.trooper };
    expect(shieldShare(near, [bearer, near, far])).toBe(0.5);
    expect(shieldShare(far, [bearer, near, far])).toBe(1);
    expect(shieldShare(bearer, [bearer, near])).toBe(1);
    expect(shieldShare(near, [{ ...bearer, dead: true }, near])).toBe(1);
  });

  it('fires the heat ray as six fast bolts in a line', () => {
    expect(RAY).toEqual({ bolts: 6, gap: 14, speed: 360, damage: 10 });
  });

  it('brings five bosses, each tougher than the last, the HARVESTER first', () => {
    const ids = Object.keys(BOSSES_7);
    expect(ids).toEqual(['harvester', 'longshanks', 'juggernaut', 'dreadnought', 'mothership']);
    const hp = Object.values(BOSSES_7).map((b) => b.coreHp);
    expect([...hp].sort((a, b) => a - b)).toEqual(hp);
  });

  it('lays a steppe floor under every map-7 theater', () => {
    for (const id of Object.keys(THEATERS_7) as (keyof typeof THEATERS_7)[]) {
      expect(THEATERS[id].campaign).toBe(7);
      expect(steppe(THEATERS[id].terrain)).toBe(true);
    }
    expect(steppe(THEATERS.hive.terrain)).toBe(false);
  });
});
