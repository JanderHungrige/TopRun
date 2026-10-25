import { interpolate } from '../i18n/i18n';

// Picture wall (doc 32): the date on a photo's caption. The pattern and month names come from the UI tables
// (`photo.datePattern`, `photo.months`), so the formatting stays pure and language-neutral here. Pure.

export interface DateParts { y: number; m: number; d: number }
export interface DateFormat {
  /** Placeholders: {d} {dd} {m} {mm} {mon} {y}. */
  pattern: string;
  /** Twelve month names, January first. */
  months: readonly string[];
}

/** The calendar date of `at` (ms since the epoch) in a time zone `tzOffsetMin` minutes behind UTC
 *  (Date#getTimezoneOffset's convention: Berlin in summer = −120). */
export function localDate(at: number, tzOffsetMin: number): DateParts {
  const t = new Date(at - tzOffsetMin * 60_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** The caption date, or null without a time. */
export function formatPhotoDate(at: number | null, f: DateFormat, tzOffsetMin: number): string | null {
  if (at === null || !Number.isFinite(at) || at <= 0) return null;
  const { y, m, d } = localDate(at, tzOffsetMin);
  return interpolate(f.pattern, { d, dd: pad(d), m, mm: pad(m), mon: f.months[m - 1] ?? pad(m), y });
}

/** Splits the UI table's space-separated month list. */
export const monthList = (s: string): string[] => s.split(/\s+/).filter(Boolean);
