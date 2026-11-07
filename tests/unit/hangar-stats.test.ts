import { describe, it, expect } from 'vitest';
import { PLANES } from '../../src/data/planes';
import { CHALLENGE } from '../../src/game/challenge';
import { kitView } from '../../src/game/kit';
import { equipmentEffect, planeCardStats } from '../../src/game/hangar-stats';
import { defaultSave, type SaveData } from '../../src/game/save';

// Doc 02, bug B1: the hangar shows hull and speed with the fitted armour and engine tuning, as the mission flies them.

const mapTwo = (): SaveData =>
  ({ ...defaultSave(), money: 9e6, progress: Object.fromEntries(Array.from({ length: 35 }, (_, i) => [`m${String(i + 1).padStart(2, '0')}`, { stars: 2 }])) });

describe('Hangar stats (doc 02, B1)', () => {
  it('shows the plane card with the armour and engine fitted, not the bare jet', () => {
    const s = { ...mapTwo(), equipment: { ...mapTwo().equipment, armor: 10, engine: 6 } };
    const f16 = planeCardStats(s, 'f16');
    expect(f16).toMatchObject({ baseHull: PLANES.f16.hull, baseSpeed: PLANES.f16.speed });
    expect(f16.hull).toBe(Math.round(PLANES.f16.hull * 3.25));
    expect(f16.speed).toBe(Math.round(PLANES.f16.speed * 1.4));
    expect(planeCardStats(s, 'f14').hull).toBe(Math.round(PLANES.f14.hull * 3.25)); // equipment fits every jet
    expect(planeCardStats({ ...s, rookie: true }, 'f16').hull).toBe(Math.round(PLANES.f16.hull * 3.25 * CHALLENGE.rookie.hullMul));
  });

  it('shows what the next armour or engine level adds: now → next, none at the cap', () => {
    const s = { ...mapTwo(), equipment: { ...mapTwo().equipment, armor: 4, engine: 9 } };
    expect(equipmentEffect(s, 'armor')).toEqual({ stat: 'hull', now: Math.round(PLANES.f16.hull * 1.8), next: Math.round(PLANES.f16.hull * 2) });
    expect(equipmentEffect(s, 'engine')).toEqual({ stat: 'speed', now: Math.round(PLANES.f16.speed * 1.52), next: Math.round(PLANES.f16.speed * 1.56) });
    expect(equipmentEffect({ ...s, equipment: { ...s.equipment, engine: 10 } }, 'engine')?.next).toBeNull();
    expect(equipmentEffect(s, 'flares')).toBeNull();
  });

  it('measures the helicopter kit by the selected helicopter and its own equipment', () => {
    const s = kitView({ ...mapTwo(), heli: { selectedPlane: 'ah64', gunLevel: 1, equipment: { ...mapTwo().equipment, armor: 2 } } }, 'heli');
    expect(planeCardStats(s, 'ah64').hull).toBe(Math.round(PLANES.ah64.hull * 1.4));
    expect(equipmentEffect(s, 'armor')?.now).toBe(Math.round(PLANES.ah64.hull * 1.4));
  });
});
