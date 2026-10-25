import { LINES_DE } from './lines-de';
import { LINES_EN, type LineKey } from './lines-en';
import { UI_DE } from './ui-de';
import { UI_EN, type UiKey } from './ui-en';

export type Lang = 'en' | 'de';
export const LANGS: readonly Lang[] = Object.freeze(['en', 'de'] as const);
export type Params = Readonly<Record<string, string | number>>;

let current: Lang = 'en';
const listeners: Array<(lang: Lang) => void> = [];

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  for (const fn of listeners) fn(lang);
}

/** Called when the language changes (e.g. to rebuild cached text layers). */
export function onLangChange(fn: (lang: Lang) => void): void {
  listeners.push(fn);
}

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'de';

/** Replaces {name} placeholders; unknown placeholders stay visible so a missing param is obvious. */
export function interpolate(s: string, params?: Params): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

export function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

export function t(key: UiKey, params?: Params): string {
  const table = current === 'de' ? UI_DE : UI_EN;
  return interpolate(table[key], params);
}

/** A spoken line; `seed` picks a variant deterministically. */
export function line(key: LineKey, params?: Params, seed = 0): string {
  const pool = (current === 'de' ? LINES_DE : LINES_EN)[key];
  const text = pool[Math.abs(Math.floor(seed)) % pool.length] ?? '';
  return interpolate(text, params);
}

export function lineVariants(key: LineKey): number {
  return (current === 'de' ? LINES_DE : LINES_EN)[key].length;
}
