import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult } from '../../src/data/types';
import {
  CHALLENGE, convincing, freshChallenge, kitScore, missionTuning, nextChallenge, parseChallenge, parseSorties, recordSortie,
  sortieOf, type ChallengeState, type SortieEntry,
} from '../../src/game/challenge';
import { applyResult, buy } from '../../src/game/economy';
import { derivePlayerStats } from '../../src/game/loadout';
import { emptyStore, setProfileRookie, type ProfileStore } from '../../src/game/profiles';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

const m1 = MISSIONS[0]!;
const result = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: m1.id, success: true, aborted: false, takeoff: 'good', kills: 18, spawned: 20,
  objectiveDone: true, hullRatio: 0.9, collected: 0, bossKilled: false, ...over,
});
const sortie = (outcome: SortieEntry['outcome'], over: Partial<SortieEntry> = {}): SortieEntry =>
  ({ mission: 'm01', outcome, hull: 0.9, kills: 0.9, kit: 10, level: 0, at: 0, ...over });
const run = (c: ChallengeState, list: readonly SortieEntry[], kit = 10, maxed = false): ChallengeState =>
  list.reduce((s, e) => nextChallenge(s, e, kit, maxed, false), c);
const at = (level: number): ChallengeState => ({ ...freshChallenge(), level });

describe('Challenge level (doc 38)', () => {
  it('logs every sortie with its outcome, hull, kill share, kit and level', () => {
    const s = defaultSave();
    expect(sortieOf(m1, result(), s, 5)).toEqual({ mission: 'm01', outcome: 'win', hull: 0.9, kills: 0.9, kit: kitScore(s), level: 0, at: 5 });
    expect(sortieOf(m1, result({ success: false, hullRatio: 0 }), s, 5).outcome).toBe('down');
    expect(sortieOf(m1, result({ success: false, aborted: true }), s, 5).outcome).toBe('abort');
  });

  it('raises the kit score with anything bought', () => {
    const s = { ...defaultSave(), money: 1e6 };
    const k = kitScore(s);
    expect(kitScore(buy(s, { type: 'gun' }))).toBeGreaterThan(k);
    expect(kitScore(buy(s, { type: 'equipment', id: 'armor' }))).toBeGreaterThan(k);
    expect(kitScore(buy(s, { type: 'secondary', id: 'aim9' }))).toBeGreaterThan(k);
  });

  it('counts a win as convincing only with most of the hull left and most enemies down', () => {
    expect(convincing(sortie('win'))).toBe(true);
    expect(convincing(sortie('win', { hull: 0.6 }))).toBe(false);
    expect(convincing(sortie('win', { kills: 0.5 }))).toBe(false);
    expect(convincing(sortie('down'))).toBe(false);
  });

  it('steps up after three convincing wins in a row, never past 10', () => {
    expect(run(freshChallenge(), [sortie('win'), sortie('win')]).level).toBe(0);
    expect(run(freshChallenge(), [sortie('win'), sortie('win'), sortie('win')]).level).toBe(1);
    expect(run(freshChallenge(), [sortie('win'), sortie('win', { hull: 0.5 }), sortie('win'), sortie('win')]).level).toBe(0);
    expect(run(freshChallenge(), [sortie('win'), sortie('abort'), sortie('win'), sortie('win')]).level).toBe(0);
    expect(run(at(10), [sortie('win'), sortie('win'), sortie('win')]).level).toBe(10);
  });

  it('steps down only after seven times shot down in a row with an upgrade in between, or a maxed gun', () => {
    const downs = Array.from({ length: 7 }, () => sortie('down', { kit: 10 }));
    expect(run(at(3), downs, 10).level).toBe(3); // no upgrade: your problem
    expect(run(at(3), downs, 12).level).toBe(2); // bought something since the first failure
    expect(run(at(3), downs, 10, true).level).toBe(2); // gun at its top level
    expect(run(at(3), downs.slice(0, 6), 12).level).toBe(3);
    expect(run(at(3), [...downs.slice(0, 4), sortie('win', { hull: 0.3 }), ...downs.slice(0, 4)], 12).level).toBe(3); // a win resets
    expect(run(at(3), [...downs.slice(0, 4), sortie('abort'), ...downs.slice(0, 3)], 12).level).toBe(2); // aborts don't count
    expect(run(freshChallenge(), downs, 99, true).level).toBe(0); // today's game is the floor
  });

  it('keeps rookies out of the adaptive rules', () => {
    const c = nextChallenge(at(2), sortie('win'), 10, false, true);
    expect(c.level).toBe(2);
    expect(c.wins).toBe(0);
  });

  it('tunes a mission: +2 difficulty per level; Rookie eases enemies and adds hull instead', () => {
    expect(missionTuning({ challenge: at(3), rookie: false })).toEqual({ difficulty: 6, ease: 1, hullMul: 1 });
    expect(missionTuning({ challenge: at(3), rookie: true })).toEqual({ difficulty: 0, ease: CHALLENGE.rookie.ease, hullMul: 1.5 });
    const rookie = { ...defaultSave(), rookie: true };
    expect(derivePlayerStats(rookie).maxHull).toBe(Math.round(derivePlayerStats(defaultSave()).maxHull * 1.5));
  });

  it('records sorties through applyResult and keeps only the last 20', () => {
    let s: SaveData = defaultSave();
    for (let i = 0; i < 25; i++) s = applyResult(s, m1, result(), i).save;
    expect(s.sorties).toHaveLength(20);
    expect(s.sorties.at(-1)?.at).toBe(24);
    expect(s.challenge.level).toBe(8); // 24 convincing wins → 8 steps
    expect(recordSortie(s, m1, result({ success: false, hullRatio: 0 }), 99).challenge.fails).toBe(1);
  });

  it('parses challenge, sorties and rookie from untrusted saves', () => {
    expect(parseChallenge({ level: 99, wins: -3, fails: 'x' })).toEqual({ level: 10, wins: 0, fails: 0, failKit: 0 });
    expect(parseSorties([{ mission: 'm01', outcome: 'win', hull: 3, kills: 0.5, kit: 1, level: 2, at: 1 }, { outcome: 'boom' }, 7]))
      .toEqual([{ mission: 'm01', outcome: 'win', hull: 1, kills: 0.5, kit: 1, level: 2, at: 1 }]);
    const back = parseSave(JSON.parse(JSON.stringify({ ...defaultSave(), rookie: true, challenge: at(4) })));
    expect(back?.rookie).toBe(true);
    expect(back?.challenge.level).toBe(4);
    expect(parseSave(JSON.parse(JSON.stringify({ ...defaultSave(), rookie: 'yes' })))?.rookie).toBe(false);
  });

  it('switches Rookie for one pilot without touching the others', () => {
    const base = emptyStore();
    const store: ProfileStore = { ...base, profiles: [
      { id: 'a', callsign: 'ICE', avatar: 'pilot1', createdAt: 0, playedAt: 0, save: defaultSave() },
      { id: 'b', callsign: 'KID', avatar: 'pilot2', createdAt: 0, playedAt: 0, save: defaultSave() },
    ], activeId: 'a' };
    const next = setProfileRookie(store, 'b', true);
    expect(next.profiles.map((p) => p.save.rookie)).toEqual([false, true]);
    expect(next.activeId).toBe('a');
  });
});
