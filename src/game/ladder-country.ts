import { COUNTRY_CODES } from '../data/countries';
import { ZONE_COUNTRY } from '../data/time-zones';
import type { SaveData } from './save';

// A pilot's ladder flag (doc 28): the country the device is in at the first save or pilot pick, decided in the
// browser from its time zone (else its language region), stored once in the ladder link. Pure.

/** The country of a time zone name (`Europe/Berlin` → `DE`); null for UTC, `Etc/…` or an unknown name. */
export const countryFromZone = (zone: string | undefined): string | null => (zone ? ZONE_COUNTRY.get(zone) ?? null : null);

/** The region of the first language tag that has a known one (`de-DE` → `DE`, `zh-Hant-TW` → `TW`). */
export function countryFromLanguages(languages: readonly string[]): string | null {
  for (const tag of languages) {
    const region = /^[a-z]{2,3}(?:[-_][A-Za-z]{4})?[-_]([A-Za-z]{2})(?:[-_]|$)/i.exec(tag)?.[1]?.toUpperCase();
    if (region && COUNTRY_CODES.has(region)) return region;
  }
  return null;
}

/** Time zone first (where the device is), then the language region (what the user prefers). */
export const deviceCountry = (zone: string | undefined, languages: readonly string[]): string | null =>
  countryFromZone(zone) ?? countryFromLanguages(languages);

/** The save with its ladder country set, if it has a link without one; otherwise the same save. */
export function withLadderCountry(save: SaveData, country: string | null): SaveData {
  if (!save.ladder || save.ladder.country !== null || country === null) return save;
  return { ...save, ladder: { ...save.ladder, country } };
}
