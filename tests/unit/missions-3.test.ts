import { describe, it, expect } from 'vitest';
import { BOSSES } from '../../src/data/bosses';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { MISSIONS_2 } from '../../src/data/missions-2';
import { MISSIONS_3 } from '../../src/data/missions-3';
import { campaignTheaters } from '../../src/data/theaters';
import { miniBosses } from '../../src/data/reinforcements';
import { adminView } from '../../src/game/admin';
import { MAP_THREE } from '../../src/game/map-three';
import { mapTwoHit, mapTwoHp, payScale } from '../../src/game/map-two';
import { isUnlocked, mapOpen, nextMission, nextMissionOn } from '../../src/game/progress';
import { defaultSave, type SaveData } from '../../src/game/save';

// Map 3 (doc 48): m61–m90 flown with helicopters, a fresh threat climb, its own pay, opened after m60.

const MAP3 = ['fjords', 'highlands', 'delta', 'mesa', 'ashfall'];
const cleared = (save: SaveData, ids: readonly string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });

describe('Third map (doc 48)', () => {
  it('holds missions m61–m90 on map 3 with a fresh threat climb and the map-1 reward formula', () => {
    expect(MISSIONS_3.map((m) => m.id)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 61}`));
    expect(MISSIONS_3.every((m, i) => m.number === i + 61 && m.campaign === 3)).toBe(true);
    expect(MISSIONS_3.map((m) => m.difficulty).slice(0, 3)).toEqual([3, 4, 6]);
    expect(MISSIONS_3[29]?.difficulty).toBe(42);
    expect(MISSIONS_3[0]?.reward).toBe(1200);
    expect(MISSIONS_3[29]?.reward).toBe(Math.round((1200 + 29 * 380) * 1.5 / 100) * 100);
    expect(campaignMissions(3)).toEqual(MISSIONS_3);
    expect(ALL_MISSIONS.slice(60, 90)).toEqual(MISSIONS_3);
  });

  it('has five theaters of six missions, a boss every sixth', () => {
    expect(campaignTheaters(3)).toEqual(MAP3);
    MAP3.forEach((th, k) => {
      const six = MISSIONS_3.slice(k * 6, k * 6 + 6);
      expect(six.every((m) => m.theater === th)).toBe(true);
      const boss = six[5]?.objective;
      expect(boss?.type).toBe('boss');
      if (boss?.type === 'boss') expect(BOSSES[boss.boss].id).toBe(boss.boss);
      expect(six.slice(0, 5).every((m) => m.objective.type !== 'boss')).toBe(true);
    });
    const bosses = MISSIONS_3.flatMap((m) => (m.objective.type === 'boss' ? [m.objective.boss] : []));
    expect(bosses).toEqual(['glacier', 'citadel', 'caiman', 'mammoth', 'behemoth']);
  });

  it('opens after m60, then mission by mission; the admin has it at once', () => {
    const before = cleared(defaultSave(), MISSIONS_2.slice(0, 29).map((m) => m.id));
    const m61 = MISSIONS_3[0];
    const m62 = MISSIONS_3[1];
    if (!m61 || !m62) throw new Error('missing');
    expect(mapOpen(before, 3)).toBe(false);
    expect(isUnlocked(before, m61)).toBe(false);
    const open = cleared(before, ['m60']);
    expect(mapOpen(open, 3)).toBe(true);
    expect(isUnlocked(open, m61)).toBe(true);
    expect(isUnlocked(open, m62)).toBe(false);
    expect(nextMission(open).id).toBe('m61');
    expect(nextMissionOn(cleared(open, ['m61']), 3).id).toBe('m62');
    expect(mapOpen(adminView(defaultSave()), 3)).toBe(true);
  });

  it('pays on its own scale and adds no map-2 HP or hit factor', () => {
    expect(payScale(60)).toBeCloseTo(1 + 0.08 * 30 + 0.004 * 900, 9);
    expect(payScale(61)).toBe(MAP_THREE.pay);
    expect(payScale(90)).toBeCloseTo(MAP_THREE.pay * (1 + MAP_THREE.ramp * 29), 9);
    for (const n of [61, 75, 90]) {
      expect(mapTwoHp(n)).toBe(1);
      expect(mapTwoHit(n)).toBe(1);
    }
  });

  it('sends one mini-boss per mission from the highlands on, none in the fjords', () => {
    for (const m of MISSIONS_3) {
      const mb = miniBosses(m);
      if (m.number < 67 || m.objective.type === 'boss') expect(mb).toEqual([]);
      else expect(mb).toHaveLength(1);
    }
  });
});
