import { isLang, type Lang } from '../i18n/i18n';

/** Device-wide settings (doc 08): shared by every pilot on this browser. */
export interface Settings {
  music: number;
  sfx: number;
  autofire: boolean;
  muted: boolean;
  lang: Lang;
}

export const defaultSettings = (): Settings => ({ music: 0.6, sfx: 0.8, autofire: false, muted: false, lang: 'en' });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function unit(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

export function parseSettings(v: unknown): Settings {
  const d = defaultSettings();
  if (!isRecord(v)) return d;
  return {
    music: unit(v.music, d.music),
    sfx: unit(v.sfx, d.sfx),
    autofire: typeof v.autofire === 'boolean' ? v.autofire : d.autofire,
    muted: typeof v.muted === 'boolean' ? v.muted : d.muted,
    lang: isLang(v.lang) ? v.lang : d.lang,
  };
}
