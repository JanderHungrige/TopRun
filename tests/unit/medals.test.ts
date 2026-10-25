import { describe, it, expect } from 'vitest';
import { MEDAL_IDS, MEDALS } from '../../src/data/medals';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult, TheaterId } from '../../src/data/types';
import { applyResult } from '../../src/game/economy';
import { earnedMedals, newMedals } from '../../src/game/medals';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { emptyRecord, recordMission, type ServiceRecord } from '../../src/game/service-record';
import { placeholders } from '../../src/i18n/i18n';
import { MEDALS_DE } from '../../src/i18n/medals-de';

const result = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: MISSIONS[0]!.id, success: true, aborted: false, takeoff: 'good', kills: 10, spawned: 20,
  objectiveDone: true, hullRatio: 0.6, collected: 0, bossKilled: false, usedSecondaries: true, ...over,
});

const cleared = (n: number, stars = 2): SaveData['progress'] =>
  Object.fromEntries(MISSIONS.slice(0, n).map((m) => [m.id, { stars }]));

const withRecord = (r: Partial<ServiceRecord>, progress: SaveData['progress'] = {}): SaveData =>
  ({ ...defaultSave(), progress, record: { ...emptyRecord(), ...r } });

const bossOf = (th: TheaterId): number => MISSIONS.findIndex((m) => m.theater === th && m.objective.type === 'boss') + 1;

describe('Medals', () => {
  describe('service record', () => {
    it('counts sorties, wins, kills, bosses, flawless and gun-only missions', () => {
      let r = recordMission(emptyRecord(), result({ kills: 12 }), 'f16');
      r = recordMission(r, result({ success: false, hullRatio: 0, kills: 3 }), 'f16');
      r = recordMission(r, result({ bossKilled: true, hullRatio: 1, usedSecondaries: false, kills: 20 }), 'f14');
      expect(r).toMatchObject({ sorties: 3, wins: 2, kills: 35, bossKills: 1, flawless: 1, gunOnly: 1 });
      expect(r.planesFlown).toEqual(['f16', 'f14']);
    });

    it('ignores aborted sorties and never counts gun-only without the flag', () => {
      const r = recordMission(emptyRecord(), result({ aborted: true, success: false }), 'f16');
      expect(r).toEqual(emptyRecord());
      const { usedSecondaries: _u, ...legacy } = result();
      expect(recordMission(emptyRecord(), legacy, 'f16').gunOnly).toBe(0);
    });

    it('tracks perfect-launch streaks', () => {
      let r = emptyRecord();
      for (const t of ['perfect', 'perfect', 'perfect', 'good', 'perfect'] as const) r = recordMission(r, result({ takeoff: t }), 'f16');
      expect(r.launchStreak).toBe(1);
      expect(r.bestLaunchStreak).toBe(3);
    });
  });

  describe('earning', () => {
    it('awards a campaign ribbon per theater boss, the victory medal and the golden star', () => {
      expect(earnedMedals(defaultSave(), 0)).toEqual([]);
      expect(earnedMedals(withRecord({}, cleared(bossOf('pacific'))), 0)).toEqual(['pacific']);
      expect(earnedMedals(withRecord({}, cleared(30)), 0)).toEqual(['pacific', 'gulf', 'arctic', 'canyon', 'leviathan', 'victory']);
      expect(earnedMedals(withRecord({}, cleared(30, 3)), 0)).toContain('allstars');
    });

    it('awards combat feats from the service record', () => {
      const ids = (r: Partial<ServiceRecord>): string[] => earnedMedals(withRecord(r), 0);
      expect(ids({ kills: 49 })).toEqual([]);
      expect(ids({ kills: 50 })).toEqual(['ace']);
      expect(ids({ kills: 250 })).toEqual(['ace', 'topace']);
      expect(ids({ bossKills: 3 })).toEqual(['giant']);
      expect(ids({ flawless: 1 })).toEqual(['untouchable']);
      expect(ids({ gunOnly: 1 })).toEqual(['gunslinger']);
      expect(ids({ bestLaunchStreak: 5 })).toEqual(['catapult']);
    });

    it('awards minigame golds and dedication', () => {
      expect(earnedMedals(defaultSave(), 5)).toEqual(['offduty5']);
      expect(earnedMedals(defaultSave(), 10)).toEqual(['offduty5', 'offduty10']);
      expect(earnedMedals(withRecord({ sorties: 25 }), 0)).toEqual(['sorties25']);
      expect(earnedMedals(withRecord({ sorties: 100, planesFlown: ['f16', 'f14', 'sr71'] }), 0)).toEqual(['sorties25', 'sorties100', 'triple']);
    });

    it('lists what is new between two saves', () => {
      const before = withRecord({ kills: 45 });
      const after = withRecord({ kills: 52 }, cleared(bossOf('pacific')));
      expect(newMedals(earnedMedals(before, 0), earnedMedals(after, 0))).toEqual(['pacific', 'ace']);
    });
  });

  describe('mission results and saves', () => {
    it('applyResult updates the record and stores the photo data of the best run', () => {
      const save = { ...defaultSave(), selectedPlane: 'f16' as const };
      const a = applyResult(save, MISSIONS[0]!, result({ hullRatio: 1, kills: 30, spawned: 30 }), 1000).save;
      expect(a.record.sorties).toBe(1);
      expect(a.progress[MISSIONS[0]!.id]).toMatchObject({ stars: 3, at: 1000, plane: 'f16', livery: 'standard' });
      const worse = applyResult({ ...a, selectedPlane: 'f14' }, MISSIONS[0]!, result({ hullRatio: 0.2, kills: 1 }), 2000).save;
      expect(worse.progress[MISSIONS[0]!.id]).toMatchObject({ stars: 3, at: 1000, plane: 'f16' });
    });

    it('parses the record and photo fields defensively', () => {
      const raw = JSON.parse(JSON.stringify({
        ...defaultSave(),
        record: { sorties: 4, kills: -3, wins: 'x', planesFlown: ['f16', 'mig'] },
        progress: { [MISSIONS[0]!.id]: { stars: 2, at: 500, plane: 'f14', livery: 'tiger' }, [MISSIONS[1]!.id]: { stars: 1, at: 'soon' } },
      }));
      const s = parseSave(raw)!;
      expect(s.record).toEqual({ ...emptyRecord(), sorties: 4, planesFlown: ['f16'] });
      expect(s.progress[MISSIONS[0]!.id]).toEqual({ stars: 2, at: 500, plane: 'f14', livery: 'standard' });
      expect(s.progress[MISSIONS[1]!.id]).toEqual({ stars: 1 });
      expect(defaultSave().record).toEqual(emptyRecord());
    });
  });

  describe('catalogue', () => {
    it('has 18 medals with English and German names and citations', () => {
      expect(MEDAL_IDS).toHaveLength(18);
      for (const id of MEDAL_IDS) {
        expect(MEDALS[id].name.length).toBeGreaterThan(3);
        expect(MEDALS[id].citation.length).toBeGreaterThan(10);
        expect(MEDALS_DE[id].name.length).toBeGreaterThan(3);
        expect(placeholders(MEDALS_DE[id].citation)).toEqual(placeholders(MEDALS[id].citation));
      }
    });
  });
});
