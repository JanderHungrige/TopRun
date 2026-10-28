import { describe, it, expect } from 'vitest';
import { ENEMIES, isAir, SEA_KINDS } from '../../src/data/enemies';
import { ALL_MISSIONS, MISSIONS } from '../../src/data/missions';
import { isMiniBoss, MINI_BOSSES, miniBosses, NEW_KINDS, reinforcements } from '../../src/data/reinforcements';
import { THEATERS } from '../../src/data/theaters';
import type { EnemyKind } from '../../src/data/types';
import { cloaked, holdsScroll, jamming, LOITER, loiter, STEALTH } from '../../src/game/adversaries';
import { radarContacts } from '../../src/game/cockpit';
import { applyDamage } from '../../src/game/combat';
import { generateTimeline } from '../../src/game/waves';

const kindsIn = (missionId: string): EnemyKind[] => {
  const m = ALL_MISSIONS.find((x) => x.id === missionId);
  return m ? generateTimeline(m).flatMap((e) => (e.type === 'enemy' ? [e.kind] : [])) : [];
};

describe('New adversaries (doc 44)', () => {
  describe('reinforcements', () => {
    it('leaves the Pacific and m07 exactly as they were', () => {
      for (const m of MISSIONS.slice(0, 7)) {
        expect(reinforcements(m)).toEqual([]);
        expect(miniBosses(m)).toEqual([]);
      }
    });

    it('brings something new in every theater from the Gulf on', () => {
      const theaters = new Set(ALL_MISSIONS.filter((m) => m.number >= 8).map((m) => m.theater));
      for (const th of theaters) {
        const found = ALL_MISSIONS.filter((m) => m.theater === th).flatMap((m) => kindsIn(m.id)).filter((k) => NEW_KINDS.includes(k));
        expect(found.length, th).toBeGreaterThan(0);
      }
      expect(kindsIn('m08')).toContain('shilka');
    });

    it('never puts ships into land theaters and never repeats a kind the pool already has', () => {
      for (const m of ALL_MISSIONS) {
        const extra = reinforcements(m);
        if (THEATERS[m.theater].base === 'land') expect(extra.filter((k) => SEA_KINDS.includes(k))).toEqual([]);
        for (const k of extra) expect(m.pool).not.toContain(k);
      }
    });

    it('meets the stealth fighter from the Canyon on', () => {
      const canyon = ALL_MISSIONS.filter((m) => m.theater === 'canyon').flatMap((m) => kindsIn(m.id));
      expect(canyon).toContain('felon');
      expect(MISSIONS.filter((m) => m.number < 19).flatMap((m) => reinforcements(m))).not.toContain('felon');
    });
  });

  describe('mini-bosses', () => {
    it('come halfway through every non-boss mission from the Arctic on, twice on map 2', () => {
      for (const m of ALL_MISSIONS) {
        const mb = miniBosses(m);
        if (m.objective.type === 'boss' || m.number < 13) expect(mb).toEqual([]);
        else expect(mb.map((x) => x.at)).toEqual(m.campaign === 1 ? [0.55] : [0.4, 0.75]);
        for (const x of mb) {
          expect(MINI_BOSSES).toContain(x.kind);
          if (THEATERS[m.theater].base === 'land') expect(x.kind).not.toBe('cruiser');
          else expect(x.kind).not.toBe('fortress');
        }
      }
    });

    it('are in the timeline at their time and are tough', () => {
      const m = ALL_MISSIONS.find((x) => x.id === 'm13');
      if (!m) throw new Error('m13');
      const ev = generateTimeline(m).find((e) => e.type === 'enemy' && isMiniBoss(e.kind));
      expect(ev?.t).toBeCloseTo(m.length * 0.55, 6);
      for (const k of MINI_BOSSES) expect(ENEMIES[k].hp).toBeGreaterThanOrEqual(2000);
      expect(isAir('backfire')).toBe(true);
    });
  });

  describe('rules', () => {
    it('hides a stealth fighter until it fires or comes close', () => {
      expect(cloaked(true, 0, 400)).toBe(true);
      expect(cloaked(true, 0.5, 400)).toBe(false);
      expect(cloaked(true, 0, STEALTH.near - 1)).toBe(false);
      expect(cloaked(false, 0, 400)).toBe(false);
      expect(ENEMIES.felon.stealth).toBe(true);
    });

    it('jams while a jammer is on screen, and slows the scroll for a ground mini-boss', () => {
      const j = { kind: 'jammer' as const, y: 200, dead: false };
      expect(jamming([j], 720)).toBe(true);
      expect(jamming([{ ...j, dead: true }], 720)).toBe(false);
      expect(jamming([{ ...j, y: -100 }], 720)).toBe(false);
      expect(holdsScroll([{ kind: 'fortress', y: 200, dead: false }], 720, isMiniBoss)).toBe(true);
      expect(holdsScroll([{ kind: 'fortress', y: 600, dead: false }], 720, isMiniBoss)).toBe(false);
      expect(holdsScroll([{ kind: 'cruiser', y: 420, dead: false }], 720, isMiniBoss)).toBe(true);
      expect(holdsScroll([{ kind: 'backfire', y: 200, dead: false }], 720, isMiniBoss)).toBe(false);
    });

    it('lets the Backfire hold the top of the screen, then leave', () => {
      expect(loiter(2, 320, 40, 150, 640, 70, 0).vy).toBeGreaterThan(0);
      expect(Math.abs(loiter(2, 320, 150, 150, 640, 70, 0).vy)).toBeLessThan(1);
      expect(loiter(LOITER.hold + 1, 320, 150, 150, 640, 70, 0)).toEqual({ vx: 0, vy: 84 });
    });

    it('halves the gun against a bunker but not the GAU-8', () => {
      const armor = ENEMIES.bunker.armor;
      expect(applyDamage(10, { source: 'gun', targetLayer: 'ground', armor })).toBe(2.5);
      expect(applyDamage(10, { source: 'gun', targetLayer: 'ground', ground: 1, armor })).toBe(5);
      expect(applyDamage(10, { source: 'cannon', targetLayer: 'ground', armor })).toBe(10);
    });

    it('keeps cloaked fighters off the radar below level 2, and shows only static while jammed', () => {
      const input = {
        player: { x: 320, y: 600 }, boss: null, missiles: [], upcoming: [],
        enemies: [{ x: 320, y: 300, layer: 'air' as const, dead: false, hidden: true }, { x: 300, y: 400, layer: 'air' as const, dead: false }],
      };
      expect(radarContacts(input, 1)).toHaveLength(1);
      expect(radarContacts(input, 2)).toHaveLength(2);
      expect(radarContacts({ ...input, jammed: true }, 2)).toEqual([]);
    });
  });
});
