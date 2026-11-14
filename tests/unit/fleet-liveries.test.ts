import { describe, it, expect } from 'vitest';
import { LIVERIES, LIVERY_IDS, type LiveryId } from '../../src/data/liveries';
import { ALL_MISSIONS, campaignMissions } from '../../src/data/missions';
import { kitView } from '../../src/game/kit';
import {
  applyLivery, isLiveryUnlocked, liveriesFor, liveryFits, liveryKit, liveryOnShow, parseLiveries, regionOpen,
} from '../../src/game/liveries';
import { derivePlayerStats } from '../../src/game/loadout';
import { defaultSave, type SaveData } from '../../src/game/save';
import { LIVERIES_DE } from '../../src/i18n/liveries-de';
import { liveryLook, liverySwatch } from '../../src/render/livery-art';
import { tabs } from '../../src/scenes/hangar-items';

// The fleet's paint jobs (doc 100): two per theater of maps 3–5, for that world's craft.

type Progress = SaveData['progress'];

/** Progress with every mission of maps 1..n cleared at `stars`. */
const through = (n: number, stars = 2): Progress =>
  Object.fromEntries(ALL_MISSIONS.filter((m) => m.campaign <= n).map((m) => [m.id, { stars }]));

const FLEET: readonly LiveryId[] = LIVERY_IDS.filter((id) => {
  const k = liveryKit(id);
  return k === 'heli' || k === 'sub' || k === 'ship';
});

describe('Fleet liveries — the paint jobs (doc 100)', () => {
  it('adds ten per world for the helicopters, the subs and the spacecraft, each with a look and a German name', () => {
    expect(FLEET).toHaveLength(30);
    for (const kit of ['heli', 'sub', 'ship'] as const) expect(LIVERY_IDS.filter((id) => liveryKit(id) === kit)).toHaveLength(10);
    for (const id of FLEET) {
      expect(LIVERIES_DE[id], id).toBeTruthy();
      expect(liverySwatch(id)).toHaveLength(3);
      expect(liveryLook('ah64', id).base).toMatch(/^#/);
    }
  });

  it('gives every theater of maps 3–5 a region camo and a 3★ reward', () => {
    for (const c of [3, 4, 5] as const) {
      const theaters = [...new Set(campaignMissions(c).map((m) => m.theater))];
      expect(theaters).toHaveLength(5);
      for (const th of theaters) {
        const kinds = FLEET.filter((id) => LIVERIES[id].unlock?.theater === th).map((id) => LIVERIES[id].unlock?.kind).sort();
        expect(kinds, th).toEqual(['region', 'stars']);
      }
    }
  });

  it('belongs to its world\'s craft: jets maps 1–2, helicopters 3, subs 4, the spacecraft 5', () => {
    expect([liveryKit('standard'), liveryKit('gullgray'), liveryKit('legend'), liveryKit('fjordsplinter'), liveryKit('reefblue'), liveryKit('nebula')])
      .toEqual([null, 'jet', 'jet', 'heli', 'sub', 'ship']);
    expect(liveriesFor('heli')[0]).toBe('standard');
    expect(liveriesFor('heli')).toHaveLength(11);
    expect(liveriesFor('jet')).toHaveLength(21);
    expect(liveryFits('ah64', 'lava')).toBe(true);
    expect(liveryFits('f16', 'lava')).toBe(false);
    expect(liveryFits('starship', 'reefblue')).toBe(false);
    expect(liveryFits('u212', 'standard')).toBe(true);
  });
});

describe('Fleet liveries — unlocks (doc 100)', () => {
  it('opens a map\'s first region with the map, not from the start', () => {
    expect(regionOpen({}, 'fjords')).toBe(false);
    expect(isLiveryUnlocked({}, 'fjordsplinter')).toBe(false);
    expect(regionOpen(through(2), 'fjords')).toBe(true);
    expect(isLiveryUnlocked(through(2), 'fjordsplinter')).toBe(true);
    expect(isLiveryUnlocked(through(2), 'snowfield')).toBe(false);
    expect(regionOpen(through(3), 'reef')).toBe(true);
    expect(regionOpen(through(2), 'reef')).toBe(false);
  });

  it('pays the 3★ reward for three stars on every mission of the theater', () => {
    expect(isLiveryUnlocked(through(3, 2), 'northlights')).toBe(false);
    expect(isLiveryUnlocked(through(3, 3), 'northlights')).toBe(true);
  });

  it('shows a world\'s paint jobs only once its map is open', () => {
    expect(liveryOnShow(through(2), 'lava')).toBe(true);
    expect(liveryOnShow(through(2), 'kraken')).toBe(false);
    expect(liveryOnShow(through(3), 'kraken')).toBe(true);
    expect(liveryOnShow({}, 'gullgray')).toBe(true);
  });
});

describe('Fleet liveries — wearing them (doc 100)', () => {
  const save = (): SaveData => ({ ...defaultSave(), progress: through(5, 3) });

  it('paints a helicopter with its own paint jobs only', () => {
    const s = save();
    expect(applyLivery(s, 'ah64', 'lava').livery.ah64).toBe('lava');
    expect(applyLivery(s, 'f16', 'lava')).toBe(s);
    expect(applyLivery(s, 'ah64', 'reefblue')).toBe(s);
    expect(applyLivery(s, 'starship', 'nebula').livery.starship).toBe('nebula');
  });

  it('drops a paint job a craft may not wear from an untrusted save', () => {
    const parsed = parseLiveries({ ah64: 'reefblue', u212: 'reefblue', f16: 'lava', starship: 'saturn' }, through(5, 3));
    expect([parsed.ah64, parsed.u212, parsed.f16, parsed.starship]).toEqual(['standard', 'reefblue', 'standard', 'saturn']);
  });

  it('flies the spacecraft in its paint job', () => {
    const s = kitView({ ...save(), livery: { ...save().livery, starship: 'prospector' } }, 'ship');
    expect(derivePlayerStats(s).livery).toBe('prospector');
  });

  it('gives the helicopters\' and subs\' hangars a PAINT tab with their own paint jobs, and the jets none of theirs', () => {
    const heli = tabs(kitView(save(), 'heli'));
    const paint = heli.find((tab) => tab.name === 'hangar.tabPaint');
    expect(paint?.items.map((i) => (i.type === 'livery' ? i.id : ''))).toEqual(liveriesFor('heli'));
    const sub = tabs(kitView(save(), 'sub')).find((tab) => tab.name === 'hangar.tabPaint');
    expect(sub?.items).toHaveLength(11);
    const jets = tabs(save()).find((tab) => tab.name === 'hangar.tabPaint');
    expect(jets?.items.some((i) => i.type === 'livery' && liveryKit(i.id) !== 'jet' && liveryKit(i.id) !== null)).toBe(false);
    expect(tabs(kitView(save(), 'mech')).some((tab) => tab.name === 'hangar.tabPaint')).toBe(false);
  });
});

describe('Tank liveries (doc 112)', () => {
  const TANK = LIVERY_IDS.filter((id) => liveryKit(id) === 'tank');
  const save = (stars = 3): SaveData => ({ ...defaultSave(), progress: through(7, stars) });

  it('adds ten for the tanks and buggies, a region camo and a 3★ reward per theater of map 7, each with a look and a German name', () => {
    expect(TANK).toEqual(['steppegold', 'grassfire', 'saltcrust', 'mirage', 'reddust', 'raider', 'barrowmoss', 'runestone', 'craterash', 'starfall']);
    for (const th of new Set(campaignMissions(7).map((m) => m.theater))) {
      const kinds = TANK.filter((id) => LIVERIES[id].unlock?.theater === th).map((id) => LIVERIES[id].unlock?.kind).sort();
      expect(kinds, th).toEqual(['region', 'stars']);
    }
    for (const id of TANK) {
      expect(LIVERIES_DE[id], id).toBeTruthy();
      expect(liverySwatch(id)).toHaveLength(3);
      expect(liveryLook('lynx', id).base).toMatch(/^#/);
    }
    expect(liveriesFor('tank')).toEqual(['standard', ...TANK]);
  });

  it('opens Steppe Gold with map 7 and pays Grass Fire for three stars on the Sea of Grass', () => {
    expect(isLiveryUnlocked(through(5), 'steppegold')).toBe(false);
    expect(isLiveryUnlocked(through(6), 'steppegold')).toBe(true);
    expect(isLiveryUnlocked(through(7, 2), 'grassfire')).toBe(false);
    expect(isLiveryUnlocked(through(7, 3), 'grassfire')).toBe(true);
    expect(liveryOnShow(through(5), 'starfall')).toBe(false);
    expect(liveryOnShow(through(6), 'starfall')).toBe(true);
  });

  it('paints only the tanks and buggies with them, and keeps other paint off the tanks', () => {
    const s = save();
    expect(applyLivery(s, 'jackal', 'steppegold').livery.jackal).toBe('steppegold');
    expect(applyLivery(s, 'ah64', 'steppegold')).toBe(s);
    expect(applyLivery(s, 'bison', 'lava')).toBe(s);
    expect(liveryFits('viper', 'runestone')).toBe(true);
    const parsed = parseLiveries({ lynx: 'grassfire', jackal: 'reefblue' }, through(7, 2));
    expect([parsed.lynx, parsed.jackal]).toEqual(['standard', 'standard']);
  });

  it('gives the MOTOR POOL a PAINT tab with the steppe paint jobs, and drives the vehicle in its paint', () => {
    const paint = tabs(kitView(save(), 'tank')).find((tab) => tab.name === 'hangar.tabPaint');
    expect(paint?.items.map((i) => (i.type === 'livery' ? i.id : ''))).toEqual(liveriesFor('tank'));
    const s = kitView({ ...save(), livery: { ...save().livery, lynx: 'raider' } }, 'tank');
    expect(derivePlayerStats({ ...s, selectedPlane: 'lynx' }).livery).toBe('raider');
  });
});
