import { describe, it, expect } from 'vitest';
import { CAVITATION, ELECTRIC, EXPLOSIVE, LOADER_LEVELS, SIDE_TUBE_LEVELS, SUB_ROUNDS_PRICES } from '../../src/data/sub-arms';
import { ALL_MISSIONS } from '../../src/data/missions';
import { SUB_IDS, SECONDARY_IDS } from '../../src/data/types';
import { SECONDARIES, secondaryAllowedOn } from '../../src/data/weapons';
import { kitScore } from '../../src/game/challenge';
import { buy, canBuy, priceOf } from '../../src/game/economy';
import { weaponOnSale } from '../../src/game/firepower';
import { canLoadGear, gearKit, loadGear } from '../../src/game/gear';
import { kitView } from '../../src/game/kit';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';
import { freshSubArms, parseSubArms, subArmsStats } from '../../src/game/sub-arms';

// The subs' new goods (doc 101): on sale, prices, buying, loading one ammo type, the save, the mission numbers.

const through = (n: number): SaveData['progress'] =>
  Object.fromEntries(ALL_MISSIONS.filter((m) => m.campaign <= n).map((m) => [m.id, { stars: 2 }]));
const subs = (money = 50_000_000): SaveData => kitView({ ...defaultSave(), money, progress: through(3) }, 'sub');

describe('Sub arsenal — on sale (doc 101)', () => {
  it('sells the harpoon upgrades and ammo only in the SUB PEN once map 4 is open', () => {
    expect(canBuy(subs(), { type: 'mod', id: 'loader' }).ok).toBe(true);
    expect(canBuy(subs(), { type: 'rounds', id: 'electric' }).ok).toBe(true);
    const heli = kitView({ ...defaultSave(), money: 50_000_000, progress: through(3) }, 'heli');
    expect(canBuy(heli, { type: 'mod', id: 'loader' })).toEqual({ ok: false, reason: 'locked' });
    expect(canBuy(subs(), { type: 'mod', id: 'gatling' })).toEqual({ ok: false, reason: 'locked' });
    const closed = kitView({ ...defaultSave(), money: 50_000_000, progress: through(2) }, 'sub');
    expect(canBuy(closed, { type: 'rounds', id: 'explosive' })).toEqual({ ok: false, reason: 'locked' });
    expect([gearKit('loader'), gearKit('cavitation'), gearKit('turret')]).toEqual(['sub', 'sub', 'heli']);
  });

  it('adds the torpedo swarm, sonar pulse, decoy drone and drift net as sub station weapons', () => {
    for (const id of ['torpswarm', 'sonarpulse', 'decoy', 'net'] as const) {
      expect(SECONDARY_IDS).toContain(id);
      expect(SECONDARIES[id].campaign).toBe(4);
      expect(SECONDARIES[id].planes).toEqual(SUB_IDS);
      expect(secondaryAllowedOn(id, 'u212')).toBe(true);
      expect(secondaryAllowedOn(id, 'ah64')).toBe(false);
      expect(weaponOnSale(subs(), id)).toBe(true);
    }
    expect([SECONDARIES.torpswarm.role, SECONDARIES.sonarpulse.role, SECONDARIES.decoy.role, SECONDARIES.net.role]).toEqual(['ground', 'ground', 'air', 'ground']);
    expect(SECONDARIES.sonarpulse.recharge).toBe(4);
  });
});

describe('Sub arsenal — buying and loading (doc 101)', () => {
  it('climbs the Rapid Loader at its prices, then stops', () => {
    let s = subs();
    for (const lvl of LOADER_LEVELS) {
      expect(priceOf(s, { type: 'mod', id: 'loader' })).toBe(lvl.price);
      s = buy(s, { type: 'mod', id: 'loader' });
    }
    expect(s.subArms.loader).toBe(4);
    expect(canBuy(s, { type: 'mod', id: 'loader' })).toEqual({ ok: false, reason: 'max-level' });
    expect(priceOf(subs(), { type: 'mod', id: 'sideTubes' })).toBe(SIDE_TUBE_LEVELS[0]?.price);
    expect(priceOf(subs(), { type: 'rounds', id: 'cavitation' })).toBe(SUB_ROUNDS_PRICES[0]);
  });

  it('loads the first ammo type bought, keeps it, and loads another on request', () => {
    let s = buy(subs(), { type: 'rounds', id: 'electric' });
    expect(s.subArms.loaded).toBe('electric');
    s = buy(s, { type: 'rounds', id: 'cavitation' });
    expect(s.subArms.loaded).toBe('electric');
    expect(canLoadGear(s, 'cavitation')).toBe(true);
    expect(loadGear(s, 'cavitation').subArms.loaded).toBe('cavitation');
    expect(s.heliArms.loaded).toBe('tracer');
  });

  it('counts the subs\' gear in the sub kit\'s score', () => {
    const plain = subs();
    expect(kitScore(buy(plain, { type: 'mod', id: 'homing' })) - kitScore(plain)).toBe(10);
  });
});

describe('Sub arsenal — save and mission numbers (doc 101)', () => {
  it('starts empty with explosive tips loaded and clamps forged levels', () => {
    expect(defaultSave().subArms).toEqual(freshSubArms());
    expect(parseSubArms({ loader: 9, homing: -1, electric: 2.5, loaded: 'tracer' }))
      .toEqual({ ...freshSubArms(), loader: 4, electric: 2, loaded: 'explosive' });
    const raw = JSON.parse(JSON.stringify({ ...defaultSave(), subArms: { cavitation: 3, loaded: 'cavitation' } }));
    expect(parseSave(raw)?.subArms).toMatchObject({ cavitation: 3, loaded: 'cavitation' });
  });

  it('gives each ammo type its effect', () => {
    expect(subArmsStats({ ...freshSubArms(), explosive: 2 }).splash).toEqual({ share: EXPLOSIVE.share[1], radius: EXPLOSIVE.radius[1] });
    expect(subArmsStats({ ...freshSubArms(), electric: 3, loaded: 'electric' }).chain)
      .toEqual({ targets: ELECTRIC.targets[2], reach: ELECTRIC.reach, share: ELECTRIC.share[2], stun: ELECTRIC.stun[2] });
    expect(subArmsStats({ ...freshSubArms(), cavitation: 1, loaded: 'cavitation' }).pierce).toEqual({ count: CAVITATION.pierce[0], speed: CAVITATION.speed });
    expect(subArmsStats({ ...freshSubArms(), loader: 2, homing: 1, sideTubes: 3 })).toMatchObject({
      gatling: { mul: 1.3, spinUp: 0.7 }, doorGuns: { range: 320, damage: 16 }, rounds: null, chain: null, pierce: null,
    });
  });

  it('hands the sub its arms in the mission, the helicopter\'s stay with the helicopter', () => {
    const s = { ...subs(), subArms: { ...freshSubArms(), loader: 1, electric: 1, loaded: 'electric' as const } };
    const st = derivePlayerStats(s);
    expect(st.arms?.gatling).toEqual({ mul: 1.15, spinUp: 0.8 });
    expect(st.rounds).toBe('electric');
    expect(st.burnGround).toBe(false);
  });
});
