import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import { THEATERS } from '../../src/data/theaters';
import { SEA_KINDS } from '../../src/data/enemies';
import { THEATER_IDS } from '../../src/data/types';
import { isUnlocked, nextMission } from '../../src/game/progress';
import { defaultSave } from '../../src/game/save';

describe('Campaign data', () => {
  describe('MISSIONS', () => {
    it('contains 30 missions numbered 1..30 with unique ids', () => {
      expect(MISSIONS).toHaveLength(30);
      expect(MISSIONS.map((m) => m.number)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
      expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(30);
      expect(MISSIONS[0]?.id).toBe('m01');
    });

    it('has 5 theaters with 6 missions each and a boss as every 6th mission', () => {
      for (const t of THEATER_IDS) expect(MISSIONS.filter((m) => m.theater === t)).toHaveLength(6);
      MISSIONS.forEach((m) => expect(m.objective.type === 'boss').toBe(m.number % 6 === 0));
      expect(new Set(MISSIONS.filter((m) => m.objective.type === 'boss').map((m) => m.theater)).size).toBe(5);
    });

    it('has non-decreasing rewards outside boss missions and positive lengths', () => {
      const normal = MISSIONS.filter((m) => m.objective.type !== 'boss');
      normal.slice(1).forEach((m, i) => expect(m.reward).toBeGreaterThanOrEqual(normal[i]!.reward));
      MISSIONS.forEach((m) => {
        expect(m.length).toBeGreaterThan(40);
        expect(m.reward).toBeGreaterThan(0);
        expect(m.difficulty).toBe(m.number);
      });
    });

    it('strike targets are part of the mission pool', () => {
      for (const m of MISSIONS) {
        if (m.objective.type === 'strike') expect(m.pool).toContain(m.objective.target);
        // Land theaters cannot host ships.
        if (THEATERS[m.theater].base === 'land') SEA_KINDS.forEach((k) => expect(m.pool).not.toContain(k));
      }
    });

    it('map positions lie inside the 1280x720 map', () => {
      for (const m of MISSIONS) {
        expect(m.map.x).toBeGreaterThan(40);
        expect(m.map.x).toBeLessThan(860);
        expect(m.map.y).toBeGreaterThan(90);
        expect(m.map.y).toBeLessThan(700);
      }
    });
  });

  describe('progress', () => {
    it('unlocks mission 1 always and mission n only after n-1 is cleared', () => {
      const s = defaultSave();
      expect(isUnlocked(s, MISSIONS[0]!)).toBe(true);
      expect(isUnlocked(s, MISSIONS[1]!)).toBe(false);
      s.progress.m01 = { stars: 1 };
      expect(isUnlocked(s, MISSIONS[1]!)).toBe(true);
      expect(isUnlocked(s, MISSIONS[2]!)).toBe(false);
    });

    it('nextMission returns the highest unlocked mission', () => {
      const s = defaultSave();
      expect(nextMission(s).id).toBe('m01');
      s.progress = { m01: { stars: 1 }, m02: { stars: 2 } };
      expect(nextMission(s).id).toBe('m03');
    });
  });
});
