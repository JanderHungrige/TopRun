import { describe, it, expect } from 'vitest';
import { CAMPAIGN_IDS } from '../../src/data/types';
import { crewLook, kitCrewLook, portraitKey } from '../../src/game/crew-looks';
import { DIVE_CALL, SEPARATION_CALL, SHOOTER_EVENTS } from '../../src/game/dialogue-scripts';
import { LINES_DE } from '../../src/i18n/lines-de';
import { LINES_EN } from '../../src/i18n/lines-en';

// The crew in each world's outfit (doc 76): the chief and Shooter under the sea and in space; Shooter calls the dive and
// the rocket launch.

describe('Crew looks (doc 76)', () => {
  it('dresses the crew for the world: the carrier on maps 1–3, the sea on map 4, space on map 5', () => {
    expect(CAMPAIGN_IDS.map(crewLook)).toEqual(['carrier', 'carrier', 'carrier', 'sea', 'space', 'jungle']);
    expect([kitCrewLook('jet'), kitCrewLook('heli'), kitCrewLook('sub'), kitCrewLook('ship'), kitCrewLook('mech')]).toEqual(['carrier', 'carrier', 'sea', 'space', 'jungle']);
  });

  it('gives only the chief and Shooter other outfits', () => {
    expect(portraitKey('chief', 'sea')).toBe('chief-sea');
    expect(portraitKey('shooter', 'space')).toBe('shooter-space');
    expect(portraitKey('chief', 'carrier')).toBe('chief');
    expect(portraitKey('admiral', 'sea')).toBe('admiral');
    expect(portraitKey('wingman', 'space')).toBe('wingman');
  });

  it('has Shooter call every dive grade and every separation in both languages', () => {
    for (const ev of [...Object.values(DIVE_CALL), ...Object.values(SEPARATION_CALL), 'flood', 'dive', 'countdown', 'liftoff', 'orbit'] as const) {
      const key = SHOOTER_EVENTS[ev].key;
      expect(LINES_EN[key].length).toBeGreaterThan(0);
      expect(LINES_DE[key].length).toBe(LINES_EN[key].length);
    }
  });
});
