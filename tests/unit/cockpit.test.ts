import { describe, it, expect } from 'vitest';
import {
  buttonStates, EARLY_RANGE, RADAR_RANGE, radarContacts, warningLights,
  type ButtonInput, type RadarInput, type WarningInput,
} from '../../src/game/cockpit';

const radar = (over: Partial<RadarInput> = {}): RadarInput => ({
  player: { x: 320, y: 600 }, enemies: [], boss: null, missiles: [], upcoming: [], ...over,
});

const buttons = (over: Partial<ButtonInput> = {}): ButtonInput => ({
  secondaries: [{ ammo: 6 }, { ammo: 2 }], secIndex: 0, secCooldown: 0, flares: 2, flareCapacity: 2,
  specialCooldown: 0, specialMax: 5, specialActive: 0, ...over,
});

const warn = (over: Partial<WarningInput> = {}): WarningInput => ({
  player: { x: 300, y: 600, alive: true }, hullRatio: 0.9, missiles: [], bossActive: false,
  powerTimer: 0, ecm: false, damageControl: false, damageControlUsed: false, ...over,
});

describe('Cockpit', () => {
  describe('radarContacts', () => {
    it('maps on-screen contacts relative to the player and clips beyond range', () => {
      const c = radarContacts(radar({
        enemies: [
          { x: 320, y: 240, layer: 'air', dead: false },
          { x: 680, y: 600, layer: 'ground', dead: false },
          { x: 320, y: -400, layer: 'air', dead: false },
          { x: 100, y: 100, layer: 'air', dead: true },
        ],
      }), false);
      expect(c).toEqual([
        { x: 0, y: -0.5, kind: 'air' },
        { x: 0.5, y: 0, kind: 'ground' },
      ]);
    });

    it('ignores upcoming spawns without the early-warning radar', () => {
      const c = radarContacts(radar({ upcoming: [{ dt: 1, x: 320 }] }), false);
      expect(c).toEqual([]);
    });

    it('plots spawns due in the next 4 s ahead with early warning and widens the range', () => {
      const input = radar({
        enemies: [{ x: 320, y: -400, layer: 'air', dead: false }],
        upcoming: [{ dt: 1, x: 320 }, { dt: 5, x: 320 }, { dt: -1, x: 320 }],
      });
      const c = radarContacts(input, true);
      expect(c).toHaveLength(2);
      expect(c[0]).toEqual({ x: 0, y: -1000 / EARLY_RANGE, kind: 'air' });
      expect(c[1]?.kind).toBe('upcoming');
      expect(c[1]?.y).toBeCloseTo((-60 - 140 - 600) / EARLY_RANGE, 6);
      expect(EARLY_RANGE).toBeGreaterThan(RADAR_RANGE);
    });

    it('marks the boss and enemy missiles', () => {
      const c = radarContacts(radar({
        boss: { x: 320, y: 200 },
        missiles: [{ x: 300, y: 500, enemy: true }, { x: 330, y: 500, enemy: false }],
      }), false);
      expect(c.map((x) => x.kind)).toEqual(['boss', 'missile']);
    });
  });

  describe('buttonStates', () => {
    it('reports the missile button as none, empty, cooldown or ready', () => {
      expect(buttonStates(buttons({ secondaries: [] })).missile).toBe('none');
      expect(buttonStates(buttons({ secondaries: [{ ammo: 0 }] })).missile).toBe('empty');
      expect(buttonStates(buttons({ secCooldown: 0.2 })).missile).toBe('cooldown');
      expect(buttonStates(buttons()).missile).toBe('ready');
    });

    it('enables switch only with two loaded weapons', () => {
      expect(buttonStates(buttons()).switch).toBe('ready');
      expect(buttonStates(buttons({ secondaries: [{ ammo: 6 }, { ammo: 0 }] })).switch).toBe('none');
      expect(buttonStates(buttons({ secondaries: [{ ammo: 6 }] })).switch).toBe('none');
    });

    it('reports flare and special states including recharge progress', () => {
      expect(buttonStates(buttons({ flareCapacity: 0, flares: 0 })).flare).toBe('none');
      expect(buttonStates(buttons({ flares: 0 })).flare).toBe('empty');
      expect(buttonStates(buttons()).flare).toBe('ready');
      expect(buttonStates(buttons()).special).toEqual({ state: 'ready', progress: 1 });
      expect(buttonStates(buttons({ specialCooldown: 1.25 })).special).toEqual({ state: 'cooldown', progress: 0.75 });
      expect(buttonStates(buttons({ specialActive: 0.4, specialCooldown: 4.6 })).special.state).toBe('active');
    });
  });

  describe('warningLights', () => {
    it('raises missile, low hull, boss, power, ecm and damage control lamps', () => {
      expect(warningLights(warn())).toEqual({ missile: false, lowHull: false, boss: false, power: false, ecm: false, damageControl: 'none' });
      const near = { x: 300, y: 400, enemy: true, decoyed: false };
      expect(warningLights(warn({ missiles: [near] })).missile).toBe(true);
      expect(warningLights(warn({ missiles: [{ ...near, decoyed: true }] })).missile).toBe(false);
      expect(warningLights(warn({ missiles: [{ ...near, y: 300 }] })).missile).toBe(false);
      expect(warningLights(warn({ missiles: [{ ...near, enemy: false }] })).missile).toBe(false);
      const all = warningLights(warn({ hullRatio: 0.2, bossActive: true, powerTimer: 3, ecm: true, damageControl: true }));
      expect(all).toMatchObject({ lowHull: true, boss: true, power: true, ecm: true, damageControl: 'armed' });
      expect(warningLights(warn({ damageControl: true, damageControlUsed: true })).damageControl).toBe('used');
      expect(warningLights(warn({ hullRatio: 0, player: { x: 0, y: 0, alive: false } })).lowHull).toBe(false);
    });
  });
});
