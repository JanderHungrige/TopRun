import { describe, it, expect } from 'vitest';
import { formatMoney } from '../../src/core/math';
import { MINIGAME_IDS } from '../../src/data/minigames';
import { ALL_MISSIONS, campaignMissions, MISSIONS } from '../../src/data/missions';
import { ADMIN_MONEY, adminStored, adminView, isAdminPilot } from '../../src/game/admin';
import { buy, canBuy } from '../../src/game/economy';
import { openMinigames } from '../../src/game/minigames/core';
import { isUnlocked, mapTwoOpen, nextMission, nextMissionOn } from '../../src/game/progress';
import { defaultSave, parseSave, type SaveData } from '../../src/game/save';

// The admin pilot (doc 47): preset pilot 4 called ADMIN — every mission, unlimited money, off the ladder.

const cleared = (save: SaveData, ids: string[]): SaveData =>
  ({ ...save, progress: { ...save.progress, ...Object.fromEntries(ids.map((id) => [id, { stars: 1 }])) } });

describe('Admin pilot (doc 47)', () => {
  it('is the 4th preset card with the callsign ADMIN, however it was typed', () => {
    expect(isAdminPilot({ avatar: 'pilot4', callsign: 'ADMIN' })).toBe(true);
    expect(isAdminPilot({ avatar: 'pilot4', callsign: '  admin ' })).toBe(true);
    expect(isAdminPilot({ avatar: 'pilot1', callsign: 'ADMIN' })).toBe(false);
    expect(isAdminPilot({ avatar: 'pilot4', callsign: 'ADMINS' })).toBe(false);
    expect(isAdminPilot({ avatar: 'pilot4', callsign: 'MAVERICK' })).toBe(false);
  });

  it('opens every mission on every map and starts at the first one not yet flown', () => {
    const plain = defaultSave();
    const admin = adminView(plain);
    expect(ALL_MISSIONS.filter((m) => !isUnlocked(plain, m)).length).toBe(ALL_MISSIONS.length - 1);
    expect(ALL_MISSIONS.every((m) => isUnlocked(admin, m))).toBe(true);
    expect(mapTwoOpen(plain)).toBe(false);
    expect(mapTwoOpen(admin)).toBe(true);
    expect(nextMission(admin).id).toBe('m01');
    expect(nextMission(adminView(cleared(plain, ['m01', 'm02']))).id).toBe('m03');
    expect(nextMissionOn(admin, 2).id).toBe(campaignMissions(2)[0]?.id);
    const all = adminView(cleared(plain, ALL_MISSIONS.map((m) => m.id)));
    expect(nextMission(all).id).toBe(ALL_MISSIONS[ALL_MISSIONS.length - 1]?.id);
  });

  it('never runs out of money, and map-2 kit is on sale', () => {
    const admin = adminView(defaultSave());
    expect(admin.money).toBe(ADMIN_MONEY);
    expect(canBuy(defaultSave(), { type: 'he' })).toEqual({ ok: false, reason: 'locked' });
    expect(canBuy(admin, { type: 'he' })).toEqual({ ok: true });
    let s = admin;
    for (let i = 0; i < 10; i++) s = adminView(buy(s, { type: 'he' }));
    expect(s.heLevel).toBe(10);
    expect(s.money).toBe(ADMIN_MONEY);
    expect(formatMoney(ADMIN_MONEY)).toBe('$∞');
    expect(formatMoney(12345)).toBe('$12,345');
  });

  it('opens every playable rec-room game', () => {
    const playable = [...MINIGAME_IDS];
    expect(openMinigames(defaultSave(), playable)).toEqual([]);
    expect(openMinigames(adminView(defaultSave()), playable)).toEqual(playable);
    expect(openMinigames(cleared(defaultSave(), MISSIONS.map((m) => m.id)), playable).length).toBeGreaterThan(0);
  });

  it('is stored off the ladder with a full purse, and the flag is never read back', () => {
    const link = { id: 'a'.repeat(22), secret: 'b'.repeat(43), share: true, country: 'DE' };
    const stored = adminStored({ ...adminView(defaultSave()), ladder: link, money: 12 });
    expect(stored).toMatchObject({ admin: false, money: ADMIN_MONEY, ladder: { ...link, share: false } });
    expect(adminStored(defaultSave()).ladder).toBeNull();
    const forged = parseSave({ ...JSON.parse(JSON.stringify(defaultSave())), admin: true });
    expect(forged?.admin).toBe(false);
  });
});
