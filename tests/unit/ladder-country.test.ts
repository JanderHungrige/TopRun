import { describe, it, expect } from 'vitest';
import { COUNTRY_CODES } from '../../src/data/countries';
import { ZONE_COUNTRY } from '../../src/data/time-zones';
import { countryFromLanguages, countryFromZone, deviceCountry, withLadderCountry } from '../../src/game/ladder-country';
import { parseLadderLink } from '../../src/game/ladder-stats';
import { defaultSave } from '../../src/game/save';

const LINK = { id: 'p_0123456789abcdefghijkl', secret: 's'.repeat(43), share: true };

describe('Ladder country (doc 28)', () => {
  it('maps the device time zone to its country, old browser names included', () => {
    expect(countryFromZone('Europe/Berlin')).toBe('DE');
    expect(countryFromZone('Europe/Vienna')).toBe('AT');
    expect(countryFromZone('Europe/Zurich')).toBe('CH');
    expect(countryFromZone('America/New_York')).toBe('US');
    expect(countryFromZone('Asia/Calcutta')).toBe('IN');
    expect(countryFromZone('Europe/Kiev')).toBe('UA');
    expect(countryFromZone('UTC')).toBeNull();
    expect(countryFromZone('Etc/GMT+1')).toBeNull();
    expect(countryFromZone(undefined)).toBeNull();
    for (const code of ZONE_COUNTRY.values()) expect(COUNTRY_CODES.has(code)).toBe(true);
    expect(COUNTRY_CODES.size).toBeGreaterThan(240);
  });

  it('falls back to the region of the first browser language that has one', () => {
    expect(countryFromLanguages(['de-DE', 'en-US'])).toBe('DE');
    expect(countryFromLanguages(['en', 'de-at'])).toBe('AT');
    expect(countryFromLanguages(['zh-Hant-TW'])).toBe('TW');
    expect(countryFromLanguages(['es-419', 'en'])).toBeNull();
    expect(countryFromLanguages(['en-XX'])).toBeNull();
    expect(deviceCountry('UTC', ['nl-NL'])).toBe('NL');
    expect(deviceCountry('Europe/Berlin', ['en-US'])).toBe('DE');
    expect(deviceCountry(undefined, [])).toBeNull();
  });

  it('stores the country once in the ladder link and never changes it', () => {
    const save = { ...defaultSave(), ladder: { ...LINK, country: null } };
    const first = withLadderCountry(save, 'DE');
    expect(first.ladder?.country).toBe('DE');
    expect(withLadderCountry(first, 'FR')).toBe(first);
    expect(withLadderCountry(save, null)).toBe(save);
    const unlinked = defaultSave();
    expect(withLadderCountry(unlinked, 'DE')).toBe(unlinked);
  });

  it('reads old links without a country and drops an invalid one', () => {
    expect(parseLadderLink(LINK)).toEqual({ ...LINK, country: null });
    expect(parseLadderLink({ ...LINK, country: 'CH' })?.country).toBe('CH');
    expect(parseLadderLink({ ...LINK, country: 'Narnia' })).toEqual({ ...LINK, country: null });
  });
});
