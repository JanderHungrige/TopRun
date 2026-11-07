import { describe, it, expect } from 'vitest';
import { MEDAL_IDS, MEDALS, type MedalId } from '../../src/data/medals';
import { campaignMissions } from '../../src/data/missions';
import type { CampaignId } from '../../src/data/types';
import { earnedMedals } from '../../src/game/medals';
import { maxRating, RATING } from '../../src/game/rating';
import { defaultSave, type SaveData } from '../../src/game/save';
import { LOCKER_CHEST, uniformLayout } from '../../src/game/uniform-layout';
import { MEDALS_DE } from '../../src/i18n/medals-de';

// World medals (docs 62, 72): maps 2–5 get campaign ribbons, a victory medal and a golden star like map 1.

const MAP_MEDALS: Readonly<Record<2 | 3 | 4 | 5, readonly MedalId[]>> = {
  2: ['northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead', 'victory2', 'allstars2'],
  3: ['fjords', 'highlands', 'delta', 'mesa', 'ashfall', 'victory3', 'allstars3'],
  4: ['orbit', 'belt', 'moon', 'rings', 'deep', 'victory4', 'allstars4'],
  5: ['reef', 'kelp', 'wrecks', 'trench', 'abyss', 'victory5', 'allstars5'],
};

const flown = (c: CampaignId, stars: number, upTo = 30): SaveData['progress'] =>
  Object.fromEntries(campaignMissions(c).slice(0, upTo).map((m) => [m.id, { stars }]));

describe('World medals (doc 62)', () => {
  it('adds 28 campaign medals after map 1\'s, in catalogue order, with German names', () => {
    expect(MEDAL_IDS).toHaveLength(46);
    const campaign = MEDAL_IDS.filter((id) => MEDALS[id].group === 'campaign');
    expect(campaign).toEqual(['pacific', 'gulf', 'arctic', 'canyon', 'leviathan', 'victory', 'allstars', ...MAP_MEDALS[2], ...MAP_MEDALS[3], ...MAP_MEDALS[4], ...MAP_MEDALS[5]]);
    for (const id of campaign) expect(MEDALS_DE[id].name.length).toBeGreaterThan(3);
    for (const c of [2, 3, 4, 5] as const) {
      expect(MAP_MEDALS[c].slice(0, 5).every((id) => MEDALS[id].look.shape === 'ribbon')).toBe(true);
      expect(MEDALS[MAP_MEDALS[c][4] ?? 'victory'].look.metal).toBe('gold');
    }
  });

  it('awards a theater ribbon for its boss, the victory medal for the map\'s last mission', () => {
    const half = { ...defaultSave(), progress: { ...flown(1, 1), ...flown(2, 2, 12) } };
    const got = earnedMedals(half, 0);
    expect(got).toEqual(expect.arrayContaining(['northsea', 'himalaya']));
    expect(got).not.toContain('jungle');
    expect(got).not.toContain('victory2');
    const all = { ...defaultSave(), progress: { ...flown(1, 1), ...flown(2, 2), ...flown(3, 2), ...flown(4, 2), ...flown(5, 2) } };
    expect(earnedMedals(all, 0)).toEqual(expect.arrayContaining([
      ...MAP_MEDALS[2].slice(0, 6), ...MAP_MEDALS[3].slice(0, 6), ...MAP_MEDALS[4].slice(0, 6), ...MAP_MEDALS[5].slice(0, 6),
    ]));
    expect(earnedMedals(all, 0)).not.toContain('allstars5');
    expect(earnedMedals(all, 0)).not.toContain('allstars3');
  });

  it('gives a golden star for three stars on every mission of that map only', () => {
    const s = { ...defaultSave(), progress: { ...flown(1, 2), ...flown(2, 2), ...flown(3, 3) } };
    const got = earnedMedals(s, 0);
    expect(got).toContain('allstars3');
    expect(got).not.toContain('allstars2');
    expect(got).not.toContain('allstars');
  });

  it('counts every medal for the rating and fits 25 ribbons on the dress whites, five smaller ones a row', () => {
    expect(RATING.maxMedals).toBe(46);
    expect(maxRating()).toBe(65500 + 46 * RATING.medal);
    const ribbons = MEDAL_IDS.filter((id) => MEDALS[id].look.shape === 'ribbon');
    expect(ribbons).toHaveLength(25);
    const slots = uniformLayout(ribbons).slots;
    expect(new Set(slots.map((s) => s.row)).size).toBe(5);
    expect(Math.min(...slots.map((s) => s.y))).toBeGreaterThanOrEqual(LOCKER_CHEST.minTop);
    // The rack stays as wide as three full bars: five a row are smaller bars, still readable (doc 72).
    const left = Math.min(...slots.map((s) => s.box.x));
    const right = Math.max(...slots.map((s) => s.box.x + s.box.w));
    expect(right - left).toBeLessThanOrEqual(3 * LOCKER_CHEST.ribbonW + 2 * 2 + 4);
    expect(Math.min(...slots.map((s) => s.box.w))).toBeGreaterThanOrEqual(24);
    expect(Math.min(...slots.map((s) => s.box.h))).toBeGreaterThanOrEqual(7);
  });
});
