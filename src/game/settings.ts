import { isLang, type Lang } from '../i18n/i18n';
import { parseJoyProfile, type JoyProfile } from './joystick';

/** Device-wide settings (doc 08): shared by every pilot on this browser. */
export interface Settings {
  music: number;
  sfx: number;
  autofire: boolean;
  /** Sound effects on — title SOUND switch (doc 01 Audio). */
  sfxOn: boolean;
  /** Music on — title MUSIC switch (doc 01 Audio). */
  musicOn: boolean;
  lang: Lang;
  /** Joystick / HOTAS bindings from the JOYSTICK setup (doc 01), null = defaults. */
  joystick: JoyProfile | null;
  /** Offer an off-duty minigame after some missions (doc 10). */
  minigameOffers: boolean;
}

export const defaultSettings = (): Settings => ({
  music: 0.6, sfx: 0.8, autofire: false, sfxOn: true, musicOn: true, lang: 'en', joystick: null, minigameOffers: true,
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function unit(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

const flag = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

export function parseSettings(v: unknown): Settings {
  const d = defaultSettings();
  if (!isRecord(v)) return d;
  const legacyOn = v.muted !== true; // pre-2026-10-25 single mute flag: muted: true → both switches off
  return {
    music: unit(v.music, d.music),
    sfx: unit(v.sfx, d.sfx),
    autofire: flag(v.autofire, d.autofire),
    sfxOn: flag(v.sfxOn, legacyOn),
    musicOn: flag(v.musicOn, legacyOn),
    lang: isLang(v.lang) ? v.lang : d.lang,
    joystick: parseJoyProfile(v.joystick),
    minigameOffers: flag(v.minigameOffers, d.minigameOffers),
  };
}

/** M key: anything audible → everything off; all off → everything on. */
export function toggleAllSound(s: Settings): Settings {
  const on = !(s.sfxOn || s.musicOn);
  return { ...s, sfxOn: on, musicOn: on };
}
