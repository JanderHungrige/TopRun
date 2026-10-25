import { describe, it, expect } from 'vitest';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, type SaveData } from '../../src/game/save';

const tomcat = (): SaveData => {
  const s = defaultSave();
  s.ownedPlanes = ['f16', 'f14'];
  s.selectedPlane = 'f14';
  s.ownedSecondaries = ['aim9', 'aim54', 'mk82'];
  return s;
};

describe('Loadout', () => {
  describe('derivePlayerStats', () => {
    it('applies plane hull and speed with armor and engine upgrades', () => {
      const s = tomcat();
      s.equipment.armor = 2;
      s.equipment.engine = 3;
      const st = derivePlayerStats(s);
      expect(st.plane.id).toBe('f14');
      expect(st.maxHull).toBe(224);
      expect(st.speed).toBe(360);
      expect(st.gunDamageMul).toBe(1.2);
      expect(derivePlayerStats(defaultSave()).maxHull).toBe(100);
    });

    it('merges ammo of the same weapon mounted in several slots', () => {
      const s = tomcat();
      s.loadout.f14 = ['aim9', 'aim54', 'aim9', 'mk82'];
      const st = derivePlayerStats(s);
      expect(st.secondaries).toEqual([
        { id: 'aim9', ammo: 12 },
        { id: 'aim54', ammo: 2 },
        { id: 'mk82', ammo: 6 },
      ]);
    });

    it('maps flare level to flare count and passes ecm, damage control and magnet', () => {
      const s = tomcat();
      s.equipment.flares = 2;
      s.equipment.ecm = 1;
      s.equipment.magnet = 1;
      const st = derivePlayerStats(s);
      expect(st.flares).toBe(4);
      expect(st.ecm).toBe(true);
      expect(st.damageControl).toBe(false);
      expect(st.magnet).toBe(true);
    });

    it('maps the early-warning radar to earlyWarning', () => {
      const s = tomcat();
      expect(derivePlayerStats(s).earlyWarning).toBe(false);
      s.equipment.radar = 1;
      expect(derivePlayerStats(s).earlyWarning).toBe(true);
    });

    it('ignores empty slots', () => {
      const s = tomcat();
      s.loadout.f14 = [null, 'mk82', null, null];
      const st = derivePlayerStats(s);
      expect(st.secondaries).toEqual([{ id: 'mk82', ammo: 6 }]);
      expect(derivePlayerStats(defaultSave()).secondaries).toEqual([]);
    });
  });
});
