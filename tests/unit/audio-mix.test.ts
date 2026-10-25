import { describe, it, expect } from 'vitest';
import { busGains, ceiling, ceilingCurve, CEILING_KNEE, MUSIC_TRIM, SFX_TRIM } from '../../src/core/audio-mix';
import { HEAVY, lowestHz, thumpCount, type SfxName } from '../../src/core/sfx-recipes';
import { parseSettings } from '../../src/game/settings';

const levels = { music: 0.5, sfx: 0.75, musicOn: true, sfxOn: true };

describe('Audio mix (doc 01 Audio)', () => {
  describe('busGains', () => {
    it('scales each volume by its trim while switched on', () => {
      expect(busGains(levels)).toEqual({ music: 0.5 * MUSIC_TRIM, sfx: 0.75 * SFX_TRIM });
    });

    it('silences only the switched-off bus', () => {
      expect(busGains({ ...levels, musicOn: false })).toEqual({ music: 0, sfx: 0.75 * SFX_TRIM });
      expect(busGains({ ...levels, sfxOn: false })).toEqual({ music: 0.5 * MUSIC_TRIM, sfx: 0 });
      expect(busGains({ ...levels, sfxOn: false, musicOn: false })).toEqual({ music: 0, sfx: 0 });
    });

    it('clamps volumes to 0–1 and treats non-finite ones as 0', () => {
      expect(busGains({ ...levels, music: 3, sfx: -1 })).toEqual({ music: MUSIC_TRIM, sfx: 0 });
      expect(busGains({ ...levels, music: Number.NaN, sfx: Number.POSITIVE_INFINITY })).toEqual({ music: 0, sfx: 0 });
    });

    it('mutes both buses for a migrated legacy muted save', () => {
      expect(busGains(parseSettings({ music: 0.6, sfx: 0.8, muted: true }))).toEqual({ music: 0, sfx: 0 });
    });
  });

  describe('safety ceiling', () => {
    it('is transparent up to the knee', () => {
      for (const x of [0, 0.1, -0.35, 0.5, -0.79, CEILING_KNEE]) expect(ceiling(x)).toBe(x);
    });

    it('saturates smoothly towards ±1 and never reaches it within twice full scale', () => {
      let prev = ceiling(CEILING_KNEE);
      for (let x = CEILING_KNEE + 0.01; x <= 2; x += 0.01) {
        const y = ceiling(x);
        expect(y).toBeGreaterThan(prev);
        expect(y).toBeLessThan(1);
        expect(ceiling(-x)).toBe(-y);
        prev = y;
      }
      expect(ceiling(CEILING_KNEE + 1e-6) - CEILING_KNEE).toBeCloseTo(1e-6, 9); // slope 1 at the join: no kink
      expect(ceiling(1)).toBeGreaterThan(0.9);
      expect(ceiling(2)).toBeGreaterThan(0.99);
    });

    it('builds a wave-shaper curve over ±2 with an exact zero and identity below the knee', () => {
      const c = ceilingCurve();
      expect(c).toHaveLength(4097);
      expect(c[2048]).toBe(0);
      expect(c[2560]).toBeCloseTo(0.5, 6); // input 0.5 sits at index (0.5 / 2 + 1) / 2 × 4096
      expect(c[0]).toBeCloseTo(-ceiling(2), 6);
      expect(Math.max(...c.map(Math.abs))).toBeLessThan(1);
    });
  });

  describe('bass layers', () => {
    const ui: SfxName[] = ['uiMove', 'uiSelect', 'uiBack', 'pickup', 'cash', 'powerup', 'buy', 'radioClick'];

    it('gives every heavy sound a pitched-down thump that reaches the low end', () => {
      for (const name of HEAVY) {
        expect(thumpCount(name), name).toBeGreaterThanOrEqual(1);
        expect(lowestHz(name), name).toBeLessThanOrEqual(90);
      }
      for (const name of ['gun', 'missile', 'explosionSmall', 'explosionLarge', 'explosionHuge', 'hit'] as const) {
        expect(HEAVY.has(name), name).toBe(true);
      }
    });

    it('keeps UI sounds off the impact bus and at or above 200 Hz', () => {
      for (const name of ui) {
        expect(HEAVY.has(name), name).toBe(false);
        expect(thumpCount(name), name).toBe(0);
        expect(lowestHz(name), name).toBeGreaterThanOrEqual(200);
      }
    });
  });
});
