import { describe, it, expect } from 'vitest';
import { cloudIsAhead, cloudProfile, parseCloudSave, parsePilotMatches } from '../../src/game/cloud-pilot';
import { defaultSave, type SaveData } from '../../src/game/save';
import type { PilotMatch } from '../../src/game/ladder-cloud';
import type { Profile } from '../../src/game/profiles';

const REF = 'p_0123456789abcdefghijkl';
const LINK = { id: REF, secret: 's'.repeat(43), share: true, country: 'DE' };
const MATCH: PilotMatch = { ref: REF, callsign: 'ICEMAN', avatar: 'pilot11', country: 'DE', rank: 'ltjg', rating: 1690, savedAt: 99 };
const save = (over: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), ladder: LINK, money: 4200, ...over });

describe('Cloud pilots in the browser (doc 34)', () => {
  it('reads the callsign lookup defensively', () => {
    expect(parsePilotMatches({ pilots: [MATCH] })).toEqual([MATCH]);
    expect(parsePilotMatches({ pilots: [{ ...MATCH, ref: '../x' }, { ...MATCH, callsign: '<b>' }, { ...MATCH, rank: 'pope' }, 3] })).toEqual([]);
    expect(parsePilotMatches({ pilots: [{ ...MATCH, avatar: 'evil', country: 'ZZ' }] })).toEqual([{ ...MATCH, avatar: null, country: null }]);
    expect(parsePilotMatches('<!doctype html>')).toBeNull();
  });

  it('takes a downloaded save only when it parses and belongs to the chosen pilot', () => {
    const json = JSON.parse(JSON.stringify(save()));
    expect(parseCloudSave({ save: json, savedAt: 5 }, REF)?.money).toBe(4200);
    expect(parseCloudSave({ save: json, savedAt: 5 }, 'p_somebodyelsesomebodyel')).toBeNull();
    expect(parseCloudSave({ save: { ...json, ladder: null }, savedAt: 5 }, REF)).toBeNull();
    expect(parseCloudSave({ save: 'junk', savedAt: 5 }, REF)).toBeNull();
    expect(parseCloudSave(null, REF)).toBeNull();
  });

  it('joins as a new pilot, or replaces the one with the same ladder entry, with the avatar from the ladder key', () => {
    const fresh = cloudProfile(MATCH, save(), [], 'pNEW', 1000);
    expect(fresh).toEqual({ id: 'pNEW', callsign: 'ICEMAN', avatar: 'pilot11', createdAt: 1000, playedAt: 1000, save: save() });
    const mine: Profile = { id: 'pOLD', callsign: 'ICEMAN', avatar: 'pilot2', createdAt: 7, playedAt: 8, save: save({ money: 1 }) };
    expect(cloudProfile(MATCH, save(), [mine], 'pNEW', 1000)).toMatchObject({ id: 'pOLD', createdAt: 7, avatar: 'pilot11', save: { money: 4200 } });
    const look = { age: 'adult', gender: 'female', skin: 'fair', hair: 'red', length: 'long', face: 'f2' } as const;
    const built = cloudProfile({ ...MATCH, avatar: 'adult-female-fair-red-long-f2' }, save({ look }), [], 'pNEW', 1000);
    expect(built.avatar).toBe('pilot3');
    expect(cloudProfile({ ...MATCH, avatar: null }, save(), [], 'pNEW', 1000).avatar).toBe('pilot1');
  });

  it('offers the cloud copy only when it is further than this device', () => {
    const rating = (s: SaveData): number => s.money;
    expect(cloudIsAhead(save({ money: 100 }), save({ money: 200 }), rating)).toBe(true);
    expect(cloudIsAhead(save({ money: 200 }), save({ money: 200 }), rating)).toBe(false);
    expect(cloudIsAhead(save({ money: 300 }), save({ money: 200 }), rating)).toBe(false);
  });
});
