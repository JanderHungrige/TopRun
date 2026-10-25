// Pilot callsign rules (doc 08). Pure.

export const CALLSIGN_MIN = 2;
export const CALLSIGN_MAX = 12;
const ALLOWED = /^[A-Z0-9ÄÖÜ -]+$/;

export type CallsignCheck = 'ok' | 'too-short' | 'too-long' | 'invalid-chars' | 'taken';

/** Trims, collapses inner whitespace and upper-cases. */
export function normalizeCallsign(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Keeps only the characters a callsign may contain (used while typing). */
export function filterCallsignInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9ÄÖÜ -]/g, '').slice(0, CALLSIGN_MAX);
}

export function validateCallsign(raw: string, existing: readonly string[]): CallsignCheck {
  const c = normalizeCallsign(raw);
  if (c.length < CALLSIGN_MIN) return 'too-short';
  if (c.length > CALLSIGN_MAX) return 'too-long';
  if (!ALLOWED.test(c)) return 'invalid-chars';
  if (existing.some((e) => normalizeCallsign(e) === c)) return 'taken';
  return 'ok';
}
