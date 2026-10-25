import { getLang, interpolate, type Params } from './i18n';

// Per-minigame string tables (doc 10): each game keeps its own EN + DE texts with identical keys.

export interface GameText<K extends string> {
  en: Readonly<Record<K, string>>;
  de: Readonly<Record<K, string>>;
}

/** The compiler rejects a German table that misses (or adds) a key. */
export const gameText = <K extends string>(en: Readonly<Record<K, string>>, de: Readonly<Record<K, string>>): GameText<K> => ({ en, de });

export function mt<K extends string>(table: GameText<K>, key: K, params?: Params): string {
  return interpolate((getLang() === 'de' ? table.de : table.en)[key], params);
}
