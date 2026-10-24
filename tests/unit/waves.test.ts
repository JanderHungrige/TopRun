import { describe, it, expect } from 'vitest';
import { generateTimeline, PF_W, type SpawnEvent } from '../../src/game/waves';
import { MISSIONS } from '../../src/data/missions';
import { isAir } from '../../src/data/enemies';

const enemies = (events: SpawnEvent[]) => events.flatMap((e) => (e.type === 'enemy' ? [e] : []));

describe('Wave timeline', () => {
  describe('generateTimeline', () => {
    it('is deterministic for the same mission', () => {
      const m = MISSIONS[9]!;
      expect(generateTimeline(m)).toEqual(generateTimeline(m));
      expect(generateTimeline(m)).not.toEqual(generateTimeline(MISSIONS[10]!));
      expect(generateTimeline(m).length).toBeGreaterThan(20);
    });

    it('returns events sorted by time within the mission length', () => {
      for (const m of MISSIONS) {
        const ev = generateTimeline(m);
        ev.slice(1).forEach((e, i) => expect(e.t).toBeGreaterThanOrEqual(ev[i]!.t));
        expect(ev[0]!.t).toBeGreaterThan(0);
        ev.forEach((e) => expect(e.t).toBeLessThanOrEqual(m.length));
      }
    });

    it('only spawns kinds from the mission pool inside the playfield', () => {
      for (const m of MISSIONS) {
        for (const e of enemies(generateTimeline(m))) {
          expect(m.pool).toContain(e.kind);
          expect(e.x).toBeGreaterThanOrEqual(30);
          expect(e.x).toBeLessThanOrEqual(PF_W - 30);
        }
      }
    });

    it('spawns at least count + 2 targets on strike missions', () => {
      const strikes = MISSIONS.filter((m) => m.objective.type === 'strike');
      expect(strikes.length).toBeGreaterThan(5);
      for (const m of strikes) {
        if (m.objective.type !== 'strike') continue;
        const target = m.objective.target;
        expect(enemies(generateTimeline(m)).filter((e) => e.kind === target).length).toBeGreaterThanOrEqual(m.objective.count + 2);
      }
    });

    it('spawns at least 1.3x the required air kills on intercept missions', () => {
      for (const m of MISSIONS) {
        if (m.objective.type !== 'intercept') continue;
        const air = enemies(generateTimeline(m)).filter((e) => isAir(e.kind)).length;
        expect(air).toBeGreaterThanOrEqual(Math.ceil(m.objective.count * 1.3));
      }
    });

    it('spawns heavy units at most once per wave', () => {
      for (const m of MISSIONS) {
        const heavy = enemies(generateTimeline(m)).filter((e) => e.kind === 'destroyer');
        heavy.slice(1).forEach((e, i) => expect(e.t - heavy[i]!.t).toBeGreaterThan(0.5));
        expect(heavy.length).toBeLessThan(m.length / 4);
      }
    });

    it('ends boss missions with exactly one boss event at the mission length', () => {
      for (const m of MISSIONS) {
        const bosses = generateTimeline(m).filter((e) => e.type === 'boss');
        if (m.objective.type === 'boss') {
          expect(bosses).toHaveLength(1);
          expect(bosses[0]).toEqual({ type: 'boss', t: m.length, boss: m.objective.boss });
        } else {
          expect(bosses).toHaveLength(0);
        }
      }
    });
  });
});
