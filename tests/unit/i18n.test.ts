import { afterEach, describe, it, expect } from 'vitest';
import { getLang, interpolate, line, placeholders, setLang, t } from '../../src/i18n/i18n';
import { UI_EN, type UiKey } from '../../src/i18n/ui-en';
import { UI_DE } from '../../src/i18n/ui-de';
import { LINES_EN, type LineKey } from '../../src/i18n/lines-en';
import { LINES_DE } from '../../src/i18n/lines-de';
import { MISSIONS_DE } from '../../src/i18n/missions-de';
import { BOSSES_DE, ENEMIES_DE, ENEMIES_EN_PLURAL, EQUIPMENT_DE, PLANES_DE, SECONDARIES_DE, THEATERS_DE } from '../../src/i18n/content-de';
import { enemyName, missionBriefing, missionName, objectiveText } from '../../src/i18n/content';
import { ALL_MISSIONS, MISSIONS } from '../../src/data/missions';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { EQUIPMENT } from '../../src/data/equipment';
import { EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS, THEATER_IDS, type EnemyKind } from '../../src/data/types';
import { defaultSettings, parseSettings } from '../../src/game/settings';

afterEach(() => setLang('en'));

describe('Languages', () => {
  describe('t', () => {
    it('returns English by default and German after setLang(de)', () => {
      expect(getLang()).toBe('en');
      expect(t('title.newPilot')).toBe('NEW PILOT');
      setLang('de');
      expect(getLang()).toBe('de');
      expect(t('title.newPilot')).toBe('NEUER PILOT');
      expect(t('title.language')).toBe('SPRACHE: DEUTSCH');
    });

    it('replaces {params} and leaves unknown placeholders visible', () => {
      expect(t('map.progress', { done: 3, stars: 7 })).toBe('3/30 MISSIONS  ·  ★ 7/90');
      expect(interpolate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
      expect(interpolate('no params')).toBe('no params');
      expect(line('adm.pay', { total: '$1,800' }, 0)).toContain('$1,800');
    });
  });

  describe('UI tables', () => {
    it('German has a non-empty string for every English key', () => {
      const keys = Object.keys(UI_EN) as UiKey[];
      expect(keys.length).toBeGreaterThan(150);
      expect(Object.keys(UI_DE).sort()).toEqual([...keys].sort());
      for (const k of keys) expect(UI_DE[k].trim().length, k).toBeGreaterThan(0);
    });

    it('English and German use the same placeholders per key', () => {
      for (const k of Object.keys(UI_EN) as UiKey[]) {
        expect(placeholders(UI_DE[k]), k).toEqual(placeholders(UI_EN[k]));
      }
    });
  });

  describe('line tables', () => {
    it('every line key has variants in both languages with matching placeholders', () => {
      const keys = Object.keys(LINES_EN) as LineKey[];
      expect(Object.keys(LINES_DE).sort()).toEqual([...keys].sort());
      for (const k of keys) {
        const en = LINES_EN[k];
        const de = LINES_DE[k];
        expect(en.length, k).toBeGreaterThan(0);
        expect(de.length, k).toBeGreaterThan(0);
        const want = placeholders(en[0] ?? '');
        for (const v of [...en, ...de]) expect(placeholders(v), `${k}: ${v}`).toEqual(want);
      }
    });
  });

  describe('content', () => {
    it('covers all 60 missions (both maps), theaters, planes, weapons, equipment, enemies and bosses in German', () => {
      for (const m of ALL_MISSIONS) {
        expect(MISSIONS_DE[m.id]?.name, m.id).toBeTruthy();
        expect(MISSIONS_DE[m.id]?.briefing, m.id).toBeTruthy();
      }
      expect(Object.keys(MISSIONS_DE)).toHaveLength(60);
      THEATER_IDS.forEach((id) => expect(THEATERS_DE[id].name).toBeTruthy());
      PLANE_IDS.forEach((id) => expect(PLANES_DE[id].description).toBeTruthy());
      SECONDARY_IDS.forEach((id) => expect(SECONDARIES_DE[id].description).toBeTruthy());
      EQUIPMENT_IDS.forEach((id) => expect(EQUIPMENT_DE[id].levelText).toHaveLength(EQUIPMENT[id].levelText.length));
      // Level texts describe the effect: the hangar list shows them whether or not the add-on is owned (doc 02).
      EQUIPMENT_IDS.forEach((id) => [...EQUIPMENT[id].levelText, ...EQUIPMENT_DE[id].levelText]
        .forEach((lt) => expect(lt, id).not.toMatch(/^(installed|eingebaut)$/i)));
      (Object.keys(ENEMIES) as EnemyKind[]).forEach((k) => {
        expect(ENEMIES_DE[k][0]).toBeTruthy();
        expect(ENEMIES_EN_PLURAL[k]).toBeTruthy();
      });
      (Object.keys(BOSSES) as Array<keyof typeof BOSSES>).forEach((id) => expect(BOSSES_DE[id]).toBeTruthy());
    });

    it('enemyName uses singular and plural forms per language', () => {
      expect(enemyName('radar')).toBe('Radar Station');
      expect(enemyName('radar', 3)).toBe('Radar Stations');
      setLang('de');
      expect(enemyName('radar')).toBe('Radarstation');
      expect(enemyName('radar', 3)).toBe('Radarstationen');
      expect(missionName(MISSIONS[0]!)).toBe('Erster Einsatz');
      expect(missionBriefing(MISSIONS[0]!)).toContain('Staffel');
    });

    it('objectiveText is localised', () => {
      const m3 = MISSIONS[2]!;
      expect(objectiveText(m3.objective)).toBe('Strike: destroy 3 Radar Stations');
      setLang('de');
      expect(objectiveText(m3.objective)).toBe('Angriff: 3 Radarstationen zerstören');
      expect(objectiveText({ type: 'boss', boss: 'ironclad' })).toBe('Ziel zerstören: IRONCLAD (Schlachtschiff)');
    });
  });

  describe('save', () => {
    it('parses settings.lang and falls back to en for unknown values', () => {
      expect(defaultSettings().lang).toBe('en');
      expect(parseSettings({ ...defaultSettings(), lang: 'de' }).lang).toBe('de');
      expect(parseSettings({ ...defaultSettings(), lang: 'fr' }).lang).toBe('en');
      expect(parseSettings(null).lang).toBe('en');
    });
  });
});
