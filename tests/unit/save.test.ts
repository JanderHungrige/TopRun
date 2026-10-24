import { describe, it, expect, vi } from 'vitest';
import { defaultSave, loadSave, parseSave, SAVE_KEY } from '../../src/game/save';

const valid = () => {
  const s = defaultSave();
  s.money = 12345;
  s.ownedPlanes = ['f16', 'f14'];
  s.selectedPlane = 'f14';
  s.gunLevel = 3;
  s.ownedSecondaries = ['aim9', 'aim54'];
  s.loadout.f14 = ['aim54', 'aim9', null, 'aim9'];
  s.equipment.armor = 2;
  s.progress = { m01: { stars: 3 }, m02: { stars: 1 } };
  return s;
};

describe('Save', () => {
  describe('defaultSave', () => {
    it('starts with 2000 money, F-16 owned and selected, gun level 1', () => {
      const s = defaultSave();
      expect(s.money).toBe(2000);
      expect(s.ownedPlanes).toEqual(['f16']);
      expect(s.selectedPlane).toBe('f16');
      expect(s.gunLevel).toBe(1);
      expect(s.loadout.f16).toEqual([null, null]);
      expect(s.loadout.f14).toHaveLength(4);
    });
  });

  describe('parseSave', () => {
    it('round-trips a valid save unchanged', () => {
      const s = valid();
      expect(parseSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
    });

    it('returns null for non-objects and wrong versions', () => {
      expect(parseSave(null)).toBeNull();
      expect(parseSave('save')).toBeNull();
      expect(parseSave([1, 2])).toBeNull();
      expect(parseSave({ ...valid(), version: 2 })).toBeNull();
    });

    it('clamps money, gun level, equipment and settings into range', () => {
      const raw = { ...valid(), money: -50, gunLevel: 99, equipment: { armor: 9, ecm: -3, flares: 2.7 }, settings: { music: 4, sfx: 'loud', autofire: 'yes' } };
      const s = parseSave(raw);
      expect(s?.money).toBe(0);
      expect(s?.gunLevel).toBe(5);
      expect(s?.equipment).toEqual({ armor: 3, engine: 0, flares: 2, ecm: 0, damageControl: 0, magnet: 0 });
      expect(s?.settings.music).toBe(1);
      expect(s?.settings.sfx).toBe(0.8);
      expect(s?.settings.autofire).toBe(false);
    });

    it('drops unknown plane, secondary and mission ids', () => {
      const raw = { ...valid(), ownedPlanes: ['f16', 'mig29', 'f14', 'f14'], ownedSecondaries: ['aim9', 'nuke'], progress: { m01: { stars: 2 }, m99: { stars: 3 }, hack: 1 } };
      const s = parseSave(raw);
      expect(s?.ownedPlanes).toEqual(['f16', 'f14']);
      expect(s?.ownedSecondaries).toEqual(['aim9']);
      expect(s?.progress).toEqual({ m01: { stars: 2 } });
    });

    it('always keeps the F-16 owned and falls back to it when selected plane is not owned', () => {
      const s = parseSave({ ...valid(), ownedPlanes: ['sr71'], selectedPlane: 'f14' });
      expect(s?.ownedPlanes).toEqual(['f16', 'sr71']);
      expect(s?.selectedPlane).toBe('f16');
      expect(parseSave({ ...valid(), selectedPlane: 'sr71' })?.selectedPlane).toBe('f16');
    });

    it('repairs loadouts: unowned weapons removed, length fixed to hardpoints, Phoenix only on F-14', () => {
      const raw = { ...valid(), ownedSecondaries: ['aim9', 'aim54'], loadout: { f16: ['aim54', 'mk82', 'aim9', 'aim9'], f14: ['aim54'], sr71: 'x' } };
      const s = parseSave(raw);
      expect(s?.loadout.f16).toEqual([null, null]);
      expect(s?.loadout.f14).toEqual(['aim54', null, null, null]);
      expect(s?.loadout.sr71).toEqual([null, null, null]);
    });
  });

  describe('loadSave', () => {
    it('returns defaults when storage holds corrupt JSON', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const storage = { getItem: (key: string) => (key === SAVE_KEY ? '{not json' : null) };
      expect(loadSave(storage)).toEqual(defaultSave());
      expect(loadSave({ getItem: () => null })).toEqual(defaultSave());
      expect(loadSave({ getItem: () => JSON.stringify(valid()) })).toEqual(valid());
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });
});
