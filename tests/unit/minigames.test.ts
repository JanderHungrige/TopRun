import { describe, it, expect } from 'vitest';
import { MINIGAME_IDS, MINIGAMES, type MinigameId } from '../../src/data/minigames';
import { MISSIONS } from '../../src/data/missions';
import {
  medalFor, newlyUnlockedMinigames, offerAfterMission, parseMinigames, recordScore, unlockedMinigames,
} from '../../src/game/minigames/core';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { defaultSettings, parseSettings } from '../../src/game/settings';
import { placeholders } from '../../src/i18n/i18n';
import { MINIGAME_NAMES } from '../../src/i18n/minigames/names';

type Progress = SaveData['progress'];

/** Progress with missions 1..n cleared. */
const upTo = (n: number): Progress => Object.fromEntries(MISSIONS.slice(0, n).map((m) => [m.id, { stars: 2 }]));
const ALL: readonly MinigameId[] = MINIGAME_IDS;

describe('Minigames core', () => {
  describe('unlocks', () => {
    it('unlocks playable games after their mission, in data order', () => {
      expect(unlockedMinigames({}, ALL)).toEqual([]);
      expect(unlockedMinigames(upTo(1), ALL)).toEqual(['pushups']);
      expect(unlockedMinigames(upTo(6), ALL)).toEqual(['pushups', 'flyby', 'formation', 'volleyball', 'darts', 'highfive']);
      expect(unlockedMinigames(upTo(6), ['flyby'])).toEqual(['flyby']);
      expect(unlockedMinigames(upTo(30), ALL)).toEqual([...MINIGAME_IDS]);
    });

    it('lists what a mission newly unlocked', () => {
      expect(newlyUnlockedMinigames(upTo(2), upTo(3), ALL)).toEqual(['flyby']);
      expect(newlyUnlockedMinigames(upTo(3), upTo(4), ALL)).toEqual(['highfive']);
      expect(newlyUnlockedMinigames(upTo(12), upTo(13), ALL)).toEqual([]);
    });

    it('spreads the twenty unlocks over map 1, one game per mission at most', () => {
      const after = MINIGAME_IDS.map((id) => MINIGAMES[id].unlockAfter);
      expect(after.slice(0, 10)).toEqual([1, 3, 5, 6, 9, 12, 15, 18, 21, 24]);
      expect(MINIGAME_IDS.slice(10)).toEqual(['darts', 'highfive', 'targetpod', 'pool', 'ranks', 'parachute', 'airshow', 'deck', 'canyon', 'dogfight']);
      expect(after.slice(10)).toEqual([2, 4, 7, 8, 10, 11, 14, 16, 20, 27]);
      expect(new Set(after).size).toBe(20);
      expect(after.every((n) => n >= 1 && n <= 30)).toBe(true);
    });

    it('sorts the new games into flying and off duty', () => {
      const flying = MINIGAME_IDS.slice(10).filter((id) => MINIGAMES[id].kind === 'flying');
      expect(flying).toEqual(['targetpod', 'parachute', 'airshow', 'canyon', 'dogfight']);
    });
  });

  describe('offers', () => {
    const offer = (n: number, over: Partial<Parameters<typeof offerAfterMission>[0]> = {}) =>
      offerAfterMission({ missionNumber: n, before: upTo(n - 1), after: upTo(n), playable: ALL, enabled: true, ...over });

    it('offers a newly unlocked game first', () => {
      expect(offer(1)).toEqual({ id: 'pushups', isNew: true });
      expect(offer(6)).toEqual({ id: 'volleyball', isNew: true });
    });

    it('otherwise offers an unlocked game every third mission, deterministically', () => {
      expect(offer(13)).toBeNull();
      expect(offer(4)).toEqual({ id: 'highfive', isNew: true });
      const o = offer(30);
      expect(o?.isNew).toBe(false);
      expect(unlockedMinigames(upTo(30), ALL)).toContain(o?.id);
      expect(offer(30)).toEqual(o);
    });

    it('offers nothing when switched off, nothing playable, or replaying a cleared mission', () => {
      expect(offer(1, { enabled: false })).toBeNull();
      expect(offer(1, { playable: [] })).toBeNull();
      expect(offer(4, { before: upTo(10), after: upTo(10) })).toBeNull();
    });
  });

  describe('medals and bests', () => {
    const medals = { bronze: 10, silver: 20, gold: 30 };
    const times = { bronze: 60, silver: 45, gold: 30 };

    it('awards medals for high scores or for low times', () => {
      expect(medalFor(35, medals, true)).toBe('gold');
      expect(medalFor(20, medals, true)).toBe('silver');
      expect(medalFor(12, medals, true)).toBe('bronze');
      expect(medalFor(9, medals, true)).toBeNull();
      expect(medalFor(29, times, false)).toBe('gold');
      expect(medalFor(50, times, false)).toBe('bronze');
      expect(medalFor(61, times, false)).toBeNull();
    });

    it('counts plays and keeps the best score in the right direction', () => {
      const first = recordScore(defaultSave(), 'pushups', 20, true);
      expect(first.newBest).toBe(true);
      expect(first.save.minigames.pushups).toEqual({ best: 20, plays: 1 });
      const worse = recordScore(first.save, 'pushups', 15, true);
      expect(worse.newBest).toBe(false);
      expect(worse.save.minigames.pushups).toEqual({ best: 20, plays: 2 });
      const time = recordScore(recordScore(defaultSave(), 'landing', 40, false).save, 'landing', 35, false);
      expect(time.newBest).toBe(true);
      expect(time.save.minigames.landing).toEqual({ best: 35, plays: 2 });
    });
  });

  describe('persistence', () => {
    it('starts empty and drops malformed records', () => {
      expect(defaultSave().minigames).toEqual({});
      expect(parseMinigames({ pushups: { best: 31, plays: 4 }, chess: { best: 1, plays: 1 } })).toEqual({ pushups: { best: 31, plays: 4 } });
      expect(parseMinigames({ flyby: { best: 'x', plays: 1 }, piano: { best: 5, plays: -1 }, refuel: { best: Infinity, plays: 1 } })).toEqual({});
      expect(parseMinigames(null)).toEqual({});
      const raw = JSON.parse(JSON.stringify({ ...defaultSave(), minigames: { tactics: { best: 7, plays: 2 } } }));
      expect(parseSave(raw)?.minigames).toEqual({ tactics: { best: 7, plays: 2 } });
    });

    it('offers are a device setting, on by default', () => {
      expect(defaultSettings().minigameOffers).toBe(true);
      expect(parseSettings({ ...defaultSettings(), minigameOffers: false }).minigameOffers).toBe(false);
      expect(parseSettings({ ...defaultSettings(), minigameOffers: 'no' }).minigameOffers).toBe(true);
    });
  });

  describe('text', () => {
    it('names every game in both languages', () => {
      for (const id of MINIGAME_IDS) {
        expect(MINIGAME_NAMES.en[id].length).toBeGreaterThan(2);
        expect(placeholders(MINIGAME_NAMES.de[id])).toEqual(placeholders(MINIGAME_NAMES.en[id]));
      }
    });
  });
});
