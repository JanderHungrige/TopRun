import { describe, it, expect, vi } from 'vitest';
import { normalizeCallsign, validateCallsign, filterCallsignInput } from '../../src/game/callsign';
import {
  activeProfile, createProfile, deleteProfile, emptyStore, loadStore, MAX_PROFILES, migrateLegacy, parseStore,
  profileSummary, selectProfile, sortedProfiles, STORE_KEY, updateActiveSave, updateSettings, type ProfileStore,
} from '../../src/game/profiles';
import { defaultSave, SAVE_KEY } from '../../src/game/save';
import { defaultSettings } from '../../src/game/settings';

function make(...callsigns: string[]): ProfileStore {
  let store = emptyStore();
  callsigns.forEach((c, i) => {
    const r = createProfile(store, c, 'pilot2', 1000 + i, `id${i}`);
    if (!r.ok) throw new Error(r.reason);
    store = r.store;
  });
  return store;
}

const storage = (items: Record<string, string>) => ({ getItem: (k: string) => items[k] ?? null });

describe('Pilot profiles', () => {
  describe('callsign', () => {
    it('normalizes whitespace and case', () => {
      expect(normalizeCallsign('  viper   one ')).toBe('VIPER ONE');
      expect(normalizeCallsign('ice-man')).toBe('ICE-MAN');
      expect(filterCallsignInput('ma<v>er!ick 77 long name')).toBe('MAVERICK 77 ');
    });

    it('rejects too short, too long, invalid characters and taken callsigns', () => {
      expect(validateCallsign('x', [])).toBe('too-short');
      expect(validateCallsign('ABCDEFGHIJKLM', [])).toBe('too-long');
      expect(validateCallsign('<script>', [])).toBe('invalid-chars');
      expect(validateCallsign('goose', ['GOOSE'])).toBe('taken');
      expect(validateCallsign(' Jäger 2 ', ['GOOSE'])).toBe('ok');
    });
  });

  describe('store', () => {
    it('creates a profile with a fresh save and makes it active', () => {
      const r = createProfile(emptyStore(), ' viper ', 'pilot3', 42, 'p1');
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.store.activeId).toBe('p1');
      expect(activeProfile(r.store)).toMatchObject({ id: 'p1', callsign: 'VIPER', avatar: 'pilot3', createdAt: 42, playedAt: 42 });
      expect(activeProfile(r.store)?.save).toEqual(defaultSave());
      expect(createProfile(r.store, 'Viper', 'pilot1', 43, 'p2')).toEqual({ ok: false, reason: 'taken' });
    });

    it('refuses a seventh profile', () => {
      const store = make('A1', 'A2', 'A3', 'A4', 'A5', 'A6');
      expect(store.profiles).toHaveLength(MAX_PROFILES);
      expect(createProfile(store, 'A7', 'pilot1', 9, 'x')).toEqual({ ok: false, reason: 'full' });
    });

    it('selects a profile and sorts the list by last played', () => {
      const store = selectProfile(make('ONE', 'TWO', 'THREE'), 'id0', 5000);
      expect(store.activeId).toBe('id0');
      expect(sortedProfiles(store).map((p) => p.callsign)).toEqual(['ONE', 'THREE', 'TWO']);
      expect(selectProfile(store, 'nope', 6000)).toBe(store);
    });

    it('deletes a profile and clears activeId when it was active', () => {
      const store = make('ONE', 'TWO');
      expect(store.activeId).toBe('id1');
      const a = deleteProfile(store, 'id0');
      expect(a.activeId).toBe('id1');
      expect(a.profiles.map((p) => p.id)).toEqual(['id1']);
      expect(deleteProfile(a, 'id1')).toMatchObject({ activeId: null, profiles: [] });
    });

    it('updates only the active profile save and the device settings', () => {
      const store = make('ONE', 'TWO');
      const next = updateActiveSave(store, { ...defaultSave(), money: 99999 });
      expect(next.profiles.map((p) => p.save.money)).toEqual([2000, 99999]);
      expect(updateActiveSave({ ...store, activeId: null }, defaultSave())).toEqual({ ...store, activeId: null });
      expect(updateSettings(store, { ...defaultSettings(), lang: 'de' }).settings.lang).toBe('de');
    });
  });

  describe('parseStore', () => {
    it('drops malformed profiles, fixes unknown avatars and dangling activeId', () => {
      const good = make('ONE', 'TWO');
      const raw = JSON.parse(JSON.stringify({
        ...good,
        activeId: 'ghost',
        settings: { music: 7, lang: 'xx' },
        profiles: [
          { ...good.profiles[0], avatar: 'dragon' },
          good.profiles[1],
          { ...good.profiles[1], id: 'dup-callsign' },
          { id: 'bad', callsign: 'BAD', save: { version: 9 } },
          'junk',
        ],
      }));
      const s = parseStore(raw);
      expect(s?.profiles.map((p) => [p.callsign, p.avatar])).toEqual([['ONE', 'pilot1'], ['TWO', 'pilot2']]);
      expect(s?.activeId).toBeNull();
      expect(s?.settings.music).toBe(1);
      expect(s?.settings.lang).toBe('en');
    });

    it('returns an empty store for non-objects and wrong versions', () => {
      expect(parseStore(null)).toBeNull();
      expect(parseStore([1])).toBeNull();
      expect(parseStore({ version: 2, profiles: [] })).toBeNull();
      expect(parseStore({ version: 1 })).toEqual(emptyStore());
    });
  });

  describe('migration', () => {
    it('turns a legacy save into the pilot PILOT and keeps its settings', () => {
      const legacy = { ...defaultSave(), money: 54321, settings: { music: 0.2, sfx: 0.3, autofire: true, muted: true, lang: 'de' } };
      const s = migrateLegacy(JSON.parse(JSON.stringify(legacy)), 7);
      expect(s?.profiles).toHaveLength(1);
      expect(s?.profiles[0]).toMatchObject({ callsign: 'PILOT', avatar: 'pilot1', playedAt: 7 });
      expect(s?.profiles[0]?.save.money).toBe(54321);
      expect(s?.settings).toEqual({ music: 0.2, sfx: 0.3, autofire: true, muted: true, lang: 'de' });
      expect(migrateLegacy({ version: 3 }, 7)).toBeNull();
    });
  });

  describe('loadStore', () => {
    it('prefers the profile store, falls back to migration, survives corrupt JSON', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const store = make('ONE');
      const legacy = JSON.stringify({ ...defaultSave(), money: 777 });
      expect(loadStore(storage({ [STORE_KEY]: JSON.stringify(store), [SAVE_KEY]: legacy })).profiles[0]?.callsign).toBe('ONE');
      expect(loadStore(storage({ [SAVE_KEY]: legacy }), 5).profiles[0]?.save.money).toBe(777);
      expect(loadStore(storage({ [STORE_KEY]: '{oops' }))).toEqual(emptyStore());
      expect(loadStore(storage({}))).toEqual(emptyStore());
      expect(loadStore(null)).toEqual(emptyStore());
      warn.mockRestore();
    });
  });

  describe('summary', () => {
    it('reports missions cleared, stars and money', () => {
      const store = make('ONE');
      const save = { ...defaultSave(), money: 12345, progress: { m01: { stars: 3 }, m02: { stars: 2 } } };
      const p = activeProfile(updateActiveSave(store, save));
      expect(p && profileSummary(p)).toEqual({ cleared: 2, stars: 5, money: 12345 });
    });
  });
});
