import { describe, it, expect } from 'vitest';
import { CEREMONY_SETS } from '../../src/data/ceremony-sets';
import { CAMPAIGN_IDS } from '../../src/data/types';
import { ceremonySet } from '../../src/game/ceremony-stage';

// World ceremonies (doc 75): the deck on maps 1–3, a submarine pier on map 4, a space hangar on map 5, the jungle camp on
// map 6 (doc 98).

describe('World ceremonies (doc 75)', () => {
  it('holds the ceremony where the pilot\'s world is', () => {
    expect(CAMPAIGN_IDS.map(ceremonySet)).toEqual(['deck', 'deck', 'deck', 'pier', 'hangar', 'camp']);
  });

  it('has a picture and a saluting crew row for each new stage, on the 320 × 180 grid; stars only in the hangar', () => {
    for (const set of ['pier', 'hangar', 'camp'] as const) {
      const s = CEREMONY_SETS[set];
      expect(s.plate).toBe(set);
      expect(s.crew).not.toBeNull();
      if (!s.crew) continue;
      expect(s.crew.x).toBeGreaterThanOrEqual(0);
      expect(s.crew.y).toBeGreaterThanOrEqual(0);
      expect(s.crew.x).toBeLessThan(180);
      expect(s.crew.y).toBeLessThan(150);
      for (let k = 0; k < s.stars.length; k += 2) {
        expect(s.stars[k]).toBeLessThan(320);
        expect(s.stars[k + 1]).toBeLessThan(180);
      }
    }
    expect(CEREMONY_SETS.pier.stars).toHaveLength(0);
    expect(CEREMONY_SETS.hangar.stars.length).toBeGreaterThan(10);
  });
});
