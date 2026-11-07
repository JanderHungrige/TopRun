import { describe, it, expect } from 'vitest';
import { campaignMissions } from '../../src/data/missions';
import type { CampaignId } from '../../src/data/types';
import { afterDebrief, CELEBRATION, celebrationBeat, skipTo, worldSummary } from '../../src/game/celebration';
import { defaultSave } from '../../src/game/save';

// World celebrations (doc 64): three key frames with overlays, the title card, then where the game goes next.

const cleared = (c: CampaignId, stars: number): Record<string, { stars: number }> =>
  Object.fromEntries(campaignMissions(c).map((m) => [m.id, { stars }]));

describe('World celebrations (doc 64)', () => {
  it('fades in shot a with the fly-by, cross-fades to b with confetti and the admiral, then c and the title card', () => {
    expect(celebrationBeat(0)).toMatchObject({ shot: 0, black: 1, card: 0, end: false });
    const a = celebrationBeat(3);
    expect(a).toMatchObject({ shot: 0, black: 0, fireworks: true, confetti: false, line: false });
    expect(a.flyby).toBeGreaterThan(0);
    const b = celebrationBeat(10);
    expect(b).toMatchObject({ shot: 1, confetti: true, line: true, flyby: null });
    expect(celebrationBeat(CELEBRATION.shot + 0.5)).toMatchObject({ shot: 1, from: 0 });
    expect(celebrationBeat(CELEBRATION.shot + 0.5).fade).toBeCloseTo(0.5, 5);
    const c = celebrationBeat(CELEBRATION.cardAt + 2);
    expect(c).toMatchObject({ shot: 2, fireworks: true, card: 1 });
    expect(celebrationBeat(CELEBRATION.length - 0.2).black).toBeGreaterThan(0.5);
    expect(celebrationBeat(CELEBRATION.length).end).toBe(true);
  });

  it('skips to the title card first, then to the end', () => {
    expect(skipTo(2)).toBe(CELEBRATION.cardAt);
    expect(skipTo(CELEBRATION.cardAt + 1)).toBe(CELEBRATION.length);
  });

  it('sums the world\'s stars and medals', () => {
    const s = { ...defaultSave(), progress: { ...cleared(1, 1), ...cleared(2, 3) } };
    expect(worldSummary(s, 2)).toEqual({ stars: 90, maxStars: 90, medals: 7, maxMedals: 7 });
    expect(worldSummary(s, 1)).toMatchObject({ stars: 30, medals: 6 });
    expect(worldSummary(s, 4)).toMatchObject({ stars: 0, medals: 0 });
  });

  it('plays the celebration after a finale, then the medal ceremony, then where the player was going', () => {
    const next = { to: 'map' } as const;
    expect(afterDebrief({ finale: false, world: 2, medals: [], next })).toEqual(next);
    expect(afterDebrief({ finale: false, world: 2, medals: ['ace'], next })).toEqual({ to: 'ceremony', medals: ['ace'], then: next });
    expect(afterDebrief({ finale: true, world: 3, medals: [], next })).toEqual({ to: 'celebration', world: 3, then: next });
    expect(afterDebrief({ finale: true, world: 4, medals: ['victory4'], next }))
      .toEqual({ to: 'celebration', world: 4, then: { to: 'ceremony', medals: ['victory4'], then: next } });
  });
});
