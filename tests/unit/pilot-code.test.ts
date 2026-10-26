import { describe, expect, it } from 'vitest';
import { MISSIONS } from '../../src/data/missions';
import { checksum, CODE_PREFIX, decodePilotCode, encodePilotCode, pilotCodeFile } from '../../src/game/pilot-code';
import { createProfile, emptyStore, importProfile, MAX_PROFILES, type Profile, type ProfileStore } from '../../src/game/profiles';
import { defaultSave } from '../../src/game/save';

// Doc 08: the pilot code — a whole pilot as one line of text to back up and restore without accounts.

function veteran(): Profile {
  const save = defaultSave();
  for (const m of MISSIONS) save.progress[m.id] = { stars: 3, at: 1_790_000_000_000 + m.number, plane: 'f14', livery: 'standard' };
  return {
    id: 'pmvpc20hta67i', callsign: 'ICE-MAN 2', avatar: 'pilot3', createdAt: 1_789_000_000_000, playedAt: 1_790_000_100_000,
    save: {
      ...save, money: 987_654, ownedPlanes: ['f16', 'f14', 'sr71'], selectedPlane: 'f14', gunLevel: 5,
      ladder: { id: `p_${'a'.repeat(22)}`, secret: 'S'.repeat(43), share: true },
      look: { age: 'adult', gender: 'female', skin: 'olive', hair: 'red', length: 'short' },
    },
  };
}

function store(...callsigns: string[]): ProfileStore {
  let s = emptyStore();
  callsigns.forEach((c, i) => {
    const r = createProfile(s, c, 'pilot1', 100 + i, `id${i}`);
    if (!r.ok) throw new Error(r.reason);
    s = r.store;
  });
  return s;
}

describe('pilot code', () => {
  it('round-trips a whole pilot, ladder link and look included, in a short line of text', async () => {
    const p = veteran();
    const code = await encodePilotCode(p);
    expect(code.startsWith(CODE_PREFIX)).toBe(true);
    expect(code).toMatch(/^TOPGUN1:[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    expect(code.length).toBeLessThan(2500);
    expect(await decodePilotCode(code)).toEqual({ ok: true, profile: p });
  });

  it('finds the code inside pasted text, across line breaks and spaces, and in the saved file', async () => {
    const p = veteran();
    const code = await encodePilotCode(p);
    const chopped = code.replace(/(.{40})/g, '$1\n  ');
    expect(await decodePilotCode(`Here is my pilot:\n${chopped}\nsee you!`)).toEqual({ ok: true, profile: p });
    const file = pilotCodeFile(p, code, 'How to restore.');
    expect(file.name).toBe('topgun-ice-man-2.txt');
    expect(file.text).toContain(code);
    expect(await decodePilotCode(file.text)).toEqual({ ok: true, profile: p });
  });

  it('says what is wrong instead of crashing', async () => {
    const code = await encodePilotCode(veteran());
    expect(await decodePilotCode('')).toEqual({ ok: false, reason: 'no-code' });
    expect(await decodePilotCode('hello pilot')).toEqual({ ok: false, reason: 'no-code' });
    expect(await decodePilotCode(code.slice(0, -1))).toEqual({ ok: false, reason: 'no-code' });
    const dot = code.lastIndexOf('.');
    const flipped = `${code.slice(0, 20)}${code[20] === 'A' ? 'B' : 'A'}${code.slice(21)}`;
    expect(await decodePilotCode(flipped)).toEqual({ ok: false, reason: 'checksum' });
    expect(await decodePilotCode(`${code.slice(0, dot - 5)}${code.slice(dot)}`)).toEqual({ ok: false, reason: 'checksum' });
    expect(await decodePilotCode(`${CODE_PREFIX}AAAA.${checksum('AAAA')}`)).toEqual({ ok: false, reason: 'corrupt' });
    expect(await decodePilotCode(`${CODE_PREFIX}${'A'.repeat(30_000)}.${checksum('A'.repeat(30_000))}`)).toEqual({ ok: false, reason: 'no-code' });
  });

  it('rejects a well-formed code whose pilot does not validate', async () => {
    const bad = { ...veteran(), callsign: '!' } as Profile;
    expect(await decodePilotCode(await encodePilotCode(bad))).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('restoring a pilot', () => {
  it('adds a new pilot and makes them active', () => {
    const r = importProfile(store('MAVERICK'), veteran(), 5000);
    expect(r.ok && r.replaced).toBe(false);
    if (!r.ok) return;
    expect(r.store.profiles.map((p) => p.callsign)).toEqual(['MAVERICK', 'ICE-MAN 2']);
    expect(r.store.activeId).toBe('pmvpc20hta67i');
    expect(r.store.profiles[1]?.playedAt).toBe(5000);
    expect(r.store.profiles[1]?.save.money).toBe(987_654);
  });

  it('replaces the same pilot (same id) in place, even when this device has fewer missions', () => {
    const p = veteran();
    const older: Profile = { ...p, save: defaultSave() };
    const s: ProfileStore = { ...store('MAVERICK'), profiles: [older, ...store('MAVERICK').profiles] };
    const r = importProfile(s, p, 6000);
    expect(r.ok && r.replaced).toBe(true);
    if (!r.ok) return;
    expect(r.store.profiles.map((x) => x.id)).toEqual(['pmvpc20hta67i', 'id0']);
    expect(r.store.profiles[0]?.save.money).toBe(987_654);
    expect(r.store.activeId).toBe('pmvpc20hta67i');
  });

  it('refuses a callsign another pilot already has, and a full device', () => {
    expect(importProfile(store('ICE-MAN 2'), veteran(), 1)).toEqual({ ok: false, reason: 'taken' });
    const six = store(...Array.from({ length: MAX_PROFILES }, (_, i) => `PILOT ${i}`));
    expect(importProfile(six, veteran(), 1)).toEqual({ ok: false, reason: 'full' });
  });
});
