import { describe, it, expect } from 'vitest';
import { defaultSettings, parseSettings, toggleAllSound, type Settings } from '../../src/game/settings';

const roundTrip = (s: Settings): Settings => parseSettings(JSON.parse(JSON.stringify(s)));

describe('Settings — sound and music switches (doc 01 Audio, doc 08)', () => {
  describe('defaults', () => {
    it('has both switches on and no legacy muted flag', () => {
      const d = defaultSettings();
      expect(d.sfxOn).toBe(true);
      expect(d.musicOn).toBe(true);
      expect('muted' in d).toBe(false);
    });

    it('turns a missing switch on', () => {
      const s = parseSettings({ music: 0.3, sfx: 0.4, autofire: true, lang: 'de' });
      expect(s.sfxOn).toBe(true);
      expect(s.musicOn).toBe(true);
      expect(s.music).toBe(0.3);
    });
  });

  describe('migration from the single muted flag', () => {
    it('turns both switches off for an old muted: true', () => {
      const s = parseSettings({ music: 0.6, sfx: 0.8, autofire: false, muted: true, lang: 'en' });
      expect(s.sfxOn).toBe(false);
      expect(s.musicOn).toBe(false);
    });

    it('keeps both on for muted: false or a non-boolean muted', () => {
      for (const muted of [false, 'yes', 1, null]) {
        const s = parseSettings({ muted });
        expect([s.sfxOn, s.musicOn]).toEqual([true, true]);
      }
    });

    it('lets stored switches win over the legacy flag', () => {
      const s = parseSettings({ muted: true, sfxOn: true });
      expect(s.sfxOn).toBe(true);
      expect(s.musicOn).toBe(false); // missing → falls back to the legacy flag
    });

    it('never writes the legacy flag back', () => {
      const s = parseSettings({ muted: true });
      expect('muted' in s).toBe(false);
      expect(roundTrip(s)).toEqual(s);
    });
  });

  describe('independent switches', () => {
    it('stores sound and music separately', () => {
      const musicOff = parseSettings({ ...defaultSettings(), musicOn: false });
      expect([musicOff.sfxOn, musicOff.musicOn]).toEqual([true, false]);
      const sfxOff = parseSettings({ ...defaultSettings(), sfxOn: false });
      expect([sfxOff.sfxOn, sfxOff.musicOn]).toEqual([false, true]);
      expect(roundTrip(musicOff)).toEqual(musicOff);
      expect(roundTrip(sfxOff)).toEqual(sfxOff);
    });
  });

  describe('garbage', () => {
    it('falls back to defaults for non-object input', () => {
      for (const raw of [null, undefined, 42, 'on', [], [true, false]]) expect(parseSettings(raw)).toEqual(defaultSettings());
    });

    it('ignores non-boolean switch values', () => {
      const s = parseSettings({ sfxOn: 'off', musicOn: 0 });
      expect([s.sfxOn, s.musicOn]).toEqual([true, true]);
    });
  });

  describe('toggleAllSound (M key)', () => {
    const d = defaultSettings();

    it('switches everything off while anything is on', () => {
      for (const [sfxOn, musicOn] of [[true, true], [true, false], [false, true]] as const) {
        const next = toggleAllSound({ ...d, sfxOn, musicOn });
        expect([next.sfxOn, next.musicOn]).toEqual([false, false]);
      }
    });

    it('switches everything on when all is off, leaving other settings alone', () => {
      const off = { ...d, sfxOn: false, musicOn: false, lang: 'de' as const, autofire: true, music: 0.25 };
      expect(toggleAllSound(off)).toEqual({ ...off, sfxOn: true, musicOn: true });
    });
  });
});
