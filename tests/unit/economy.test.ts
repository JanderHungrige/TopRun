import { describe, it, expect } from 'vitest';
import { applyResult, buy, canBuy, canMount, computePayout, computeStars, mount, selectPlane } from '../../src/game/economy';
import { defaultSave, type SaveData } from '../../src/game/save';
import { MISSIONS } from '../../src/data/missions';
import type { MissionResult } from '../../src/data/types';

const rich = (money = 1_000_000): SaveData => ({ ...defaultSave(), money });
const m1 = MISSIONS[0]!;

const result = (over: Partial<MissionResult> = {}): MissionResult => ({
  missionId: m1.id, success: true, aborted: false, takeoff: 'good', kills: 10, spawned: 20,
  objectiveDone: true, hullRatio: 0.5, collected: 300, bossKilled: false, ...over,
});

describe('Economy', () => {
  describe('canBuy', () => {
    it('rejects with insufficient-funds when money is too low', () => {
      const s = defaultSave();
      expect(canBuy(s, { type: 'plane', id: 'f14' })).toEqual({ ok: false, reason: 'insufficient-funds' });
      expect(canBuy(s, { type: 'secondary', id: 'aim9' })).toEqual({ ok: false, reason: 'insufficient-funds' });
      expect(canBuy(s, { type: 'equipment', id: 'flares' })).toEqual({ ok: true });
    });

    it('rejects already-owned planes and secondaries', () => {
      const s = buy(rich(), { type: 'secondary', id: 'aim9' });
      expect(canBuy(s, { type: 'plane', id: 'f16' })).toEqual({ ok: false, reason: 'already-owned' });
      expect(canBuy(s, { type: 'secondary', id: 'aim9' })).toEqual({ ok: false, reason: 'already-owned' });
      expect(canBuy(s, { type: 'secondary', id: 'mk82' }).ok).toBe(true);
    });

    it('rejects gun and equipment upgrades at max level', () => {
      const s = { ...rich(), gunLevel: 5 as const, equipment: { ...defaultSave().equipment, armor: 3, ecm: 1 } };
      expect(canBuy(s, { type: 'gun' })).toEqual({ ok: false, reason: 'max-level' });
      expect(canBuy(s, { type: 'equipment', id: 'armor' })).toEqual({ ok: false, reason: 'max-level' });
      expect(canBuy(s, { type: 'equipment', id: 'ecm' })).toEqual({ ok: false, reason: 'max-level' });
    });
  });

  describe('buy', () => {
    it('deducts the price and returns a new save without mutating the input', () => {
      const s = rich(30000);
      const next = buy(s, { type: 'plane', id: 'f14' });
      expect(next.money).toBe(8000);
      expect(next.ownedPlanes).toEqual(['f16', 'f14']);
      expect(next.selectedPlane).toBe('f16');
      expect(s.money).toBe(30000);
      expect(s.ownedPlanes).toEqual(['f16']);
    });

    it('raises gun level and equipment level by one', () => {
      const a = buy(rich(10000), { type: 'gun' });
      expect(a.gunLevel).toBe(2);
      expect(a.money).toBe(7500);
      const b = buy(buy(a, { type: 'equipment', id: 'armor' }), { type: 'equipment', id: 'flares' });
      expect(b.equipment.armor).toBe(1);
      expect(b.equipment.flares).toBe(1);
      expect(b.money).toBe(7500 - 3000 - 2000);
      expect(() => buy(defaultSave(), { type: 'plane', id: 'sr71' })).toThrow(/insufficient-funds/);
    });
  });

  describe('mount', () => {
    it('mounts an owned secondary into a free slot', () => {
      const s = buy(rich(), { type: 'secondary', id: 'aim9' });
      const next = mount(mount(s, 'f16', 'aim9', 1), 'f16', 'aim9', 0);
      expect(next.loadout.f16).toEqual(['aim9', 'aim9']);
      expect(s.loadout.f16).toEqual([null, null]);
    });

    it('rejects unowned weapons, out-of-range slots and Phoenix on non-F-14 planes', () => {
      let s = buy(rich(), { type: 'secondary', id: 'aim54' });
      expect(canMount(s, 'f16', 'mk82', 0)).toEqual({ ok: false, reason: 'not-owned' });
      expect(canMount(s, 'f14', 'aim54', 0)).toEqual({ ok: false, reason: 'plane-not-owned' });
      s = buy(s, { type: 'plane', id: 'f14' });
      expect(canMount(s, 'f16', 'aim54', 0)).toEqual({ ok: false, reason: 'restricted-plane' });
      expect(canMount(s, 'f14', 'aim54', 4)).toEqual({ ok: false, reason: 'bad-slot' });
      expect(canMount(s, 'f14', 'aim54', 3)).toEqual({ ok: true });
    });
  });

  describe('selectPlane', () => {
    it('only selects owned planes', () => {
      const s = defaultSave();
      expect(selectPlane(s, 'sr71').selectedPlane).toBe('f16');
      const owned = buy(rich(), { type: 'plane', id: 'sr71' });
      expect(selectPlane(owned, 'sr71').selectedPlane).toBe('sr71');
      expect(owned.selectedPlane).toBe('f16');
    });
  });

  describe('computePayout', () => {
    it('pays full base plus perfect-takeoff and hull bonuses on a first clear', () => {
      const p = computePayout(m1, result({ takeoff: 'perfect', hullRatio: 0.9 }), true);
      expect(p.base).toBe(1200);
      expect(p.takeoffBonus).toBe(180);
      expect(p.hullBonus).toBe(120);
      expect(p.collected).toBe(300);
      expect(p.total).toBe(1800);
    });

    it('pays half base on replays', () => {
      const p = computePayout(m1, result({ takeoff: 'skipped' }), false);
      expect(p.base).toBe(600);
      expect(p.takeoffBonus).toBe(0);
      expect(p.hullBonus).toBe(0);
      expect(p.total).toBe(900);
    });

    it('pays 50% salvage of collected money on failure', () => {
      const p = computePayout(m1, result({ success: false, collected: 451 }), true);
      expect(p.base).toBe(0);
      expect(p.salvage).toBe(225);
      expect(p.total).toBe(225);
      const applied = applyResult(defaultSave(), m1, result({ success: false, collected: 451 }));
      expect(applied.save.money).toBe(2225);
      expect(applied.save.progress).toEqual({});
    });
  });

  describe('computeStars', () => {
    it('awards 0 on failure and 1-3 on success by hull and kill ratio', () => {
      expect(computeStars(result({ success: false, hullRatio: 1, kills: 20 }))).toBe(0);
      expect(computeStars(result({ hullRatio: 0.5, kills: 10 }))).toBe(1);
      expect(computeStars(result({ hullRatio: 0.7, kills: 10 }))).toBe(2);
      expect(computeStars(result({ hullRatio: 0.9, kills: 16 }))).toBe(3);
      const first = applyResult(defaultSave(), m1, result({ hullRatio: 0.9, kills: 16 }));
      const replay = applyResult(first.save, m1, result());
      expect(replay.save.progress.m01).toEqual({ stars: 3 });
    });
  });
});
