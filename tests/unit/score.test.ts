import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult } from '../../src/data/types';
import { applyResult } from '../../src/game/economy';
import { ladderStats } from '../../src/game/ladder-stats';
import { missionScore, SCORE } from '../../src/game/score';
import { defaultSave, parseSave } from '../../src/game/save';

const m1 = MISSIONS[0]!;
const result = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: m1.id, success: true, aborted: false, takeoff: 'perfect', kills: 20, spawned: 20, objectiveDone: true,
  hullRatio: 1, collected: 0, bossKilled: false, perf: { shots: 100, hits: 50, damage: 0, drops: 4, taken: 4 }, ...over,
});

describe('Mission score (doc 39)', () => {
  it('gives a flawless run the full 1000', () => {
    expect(missionScore(result())).toEqual({ kills: 300, damage: 300, accuracy: 200, launch: 100, pickups: 100, total: SCORE.max });
  });

  it('weighs kills, damage avoided, accuracy, the launch and pickups', () => {
    const s = missionScore(result({ kills: 15, takeoff: 'good', perf: { shots: 200, hits: 50, damage: 0.4, drops: 4, taken: 1 } }));
    expect(s).toEqual({ kills: 225, damage: 180, accuracy: 167, launch: 60, pickups: 25, total: 657 });
  });

  it('counts damage taken even when repairs brought the hull back, and caps it at one hull', () => {
    expect(missionScore(result({ hullRatio: 1, perf: { shots: 1, hits: 1, damage: 0.5, drops: 0, taken: 0 } })).damage).toBe(150);
    expect(missionScore(result({ perf: { shots: 1, hits: 1, damage: 3, drops: 0, taken: 0 } })).damage).toBe(0);
  });

  it('scores nothing for a lost or aborted mission, and full marks for what older results did not measure', () => {
    expect(missionScore(result({ success: false })).total).toBe(0);
    expect(missionScore(result({ success: false, aborted: true })).total).toBe(0);
    const old = missionScore(result({ perf: undefined }));
    expect(old.accuracy).toBe(200);
    expect(old.damage).toBe(300);
    expect(old.pickups).toBe(100);
  });

  it('keeps the best score per mission and counts it into the rating stats', () => {
    let s = applyResult(defaultSave(), m1, result({ kills: 10 }), 1).save;
    const first = s.progress.m01?.score ?? 0;
    expect(first).toBeGreaterThan(0);
    s = applyResult(s, m1, result({ kills: 2 }), 2).save;
    expect(s.progress.m01?.score).toBe(first);
    s = applyResult(s, m1, result(), 3).save;
    expect(s.progress.m01?.score).toBe(1000);
    expect(ladderStats(s, [], 0, 0).score).toBe(1000);
    expect(parseSave(JSON.parse(JSON.stringify(s)))?.progress.m01?.score).toBe(1000);
  });
});
