import { describe, it, expect } from 'vitest';
import { COUNTRY_CODES } from '../../src/data/countries';
import { FLAGS, flagMarks } from '../../src/data/flags';

describe('Ladder flags (doc 28)', () => {
  it('draws the common countries and only real ones', () => {
    for (const code of ['DE', 'AT', 'CH', 'NL', 'FR', 'IT', 'ES', 'GB', 'US', 'DK', 'SE', 'NO', 'PL', 'JP']) expect(FLAGS[code], code).toBeDefined();
    for (const code of Object.keys(FLAGS)) expect(COUNTRY_CODES.has(code), code).toBe(true);
    expect(Object.keys(FLAGS).length).toBeGreaterThanOrEqual(50);
  });

  it('uses only #rrggbb colours and marks inside the flag', () => {
    const hex = /^#[0-9a-f]{6}$/;
    for (const [code, spec] of Object.entries(FLAGS)) {
      const colours = [...('bands' in spec ? spec.bands : []), ...('field' in spec ? [spec.field, spec.cross, spec.inner ?? '#000000'] : [])];
      for (const c of colours) expect(c, code).toMatch(hex);
      for (const m of flagMarks(spec)) {
        expect(m.color, code).toMatch(hex);
        for (const v of [m.x, m.y, m.w, m.h]) expect(v >= 0 && v <= 1, code).toBe(true);
      }
    }
  });
});
