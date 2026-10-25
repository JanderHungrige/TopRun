import { getLang } from '../i18n';
import { gameText } from '../minigame-text';

/** Missile Evasion texts (doc 16). */
export const EVASION_TEXT = gameText({
  rule1: 'Missiles home in from every side. No guns.',
  rule2: 'Break hard when one closes in: it overshoots.',
  rule3: 'Flares fool missiles at your tail (green cone).',
  rule4: 'Score: missiles evaded. 3 hits and you are out.',
  ctrlKeys: 'Keyboard: arrows / WASD steer, F or Space flares, E or Shift high-G break',
  ctrlPad: 'Gamepad / stick: steer, X (or A) flares, Y (or B) high-G break',
  ctrlTouch: 'Touch / mouse: drag to steer, FLARE and BREAK buttons bottom right',
  score: '{n} missiles evaded',
  scoreOne: '1 missile evaded',
  live: '{n} EVADED   {time}',
  wave: 'WAVE {n}',
  launch: 'MISSILE LAUNCH',
  hull: 'HULL',
  flareKey: 'FLARE',
  breakKey: 'BREAK',
  ready: 'READY',
  active: 'HIGH G',
  gUnit: '{g} G',
  decoyed: '+1 DECOYED',
  overshoot: '+1 OVERSHOOT',
  burnout: '+1 BURNED OUT',
  resisted: 'NOT FOOLED',
  hit: 'HIT!',
  flareNow: 'FLARE!',
  shotDown: 'SHOT DOWN',
  survived: 'SURVIVED!',
  final: '{n} MISSILES EVADED',
  sam: 'SAM',
  aam: 'AAM',
}, {
  rule1: 'Raketen von allen Seiten. Keine Kanone.',
  rule2: 'Hart wegbrechen, wenn eine nah ist: sie fliegt vorbei.',
  rule3: 'Flares täuschen Raketen am Heck (grüner Kegel).',
  rule4: 'Punkte: ausgewichene Raketen. 3 Treffer und aus.',
  ctrlKeys: 'Tastatur: Pfeile / WASD lenken, F / Leertaste Flares, E / Shift High-G',
  ctrlPad: 'Gamepad / Stick: lenken, X (oder A) Flares, Y (oder B) High-G-Manöver',
  ctrlTouch: 'Touch / Maus: ziehen zum Lenken, Tasten FLARE und BREAK unten rechts',
  score: '{n} Raketen ausgewichen',
  scoreOne: '1 Rakete ausgewichen',
  live: '{n} AUSGEWICHEN   {time}',
  wave: 'WELLE {n}',
  launch: 'RAKETENSTART',
  hull: 'RUMPF',
  flareKey: 'FLARE',
  breakKey: 'BREAK',
  ready: 'BEREIT',
  active: 'HIGH G',
  gUnit: '{g} G',
  decoyed: '+1 GETÄUSCHT',
  overshoot: '+1 VORBEI',
  burnout: '+1 AUSGEBRANNT',
  resisted: 'NICHT GETÄUSCHT',
  hit: 'TREFFER!',
  flareNow: 'FLARE!',
  shotDown: 'ABGESCHOSSEN',
  survived: 'ÜBERLEBT!',
  final: '{n} RAKETEN AUSGEWICHEN',
  sam: 'SAM',
  aam: 'AAM',
});

export type EvasionKey = keyof typeof EVASION_TEXT.en;

/** Round clock, e.g. 1:05. */
export const clockText = (seconds: number): string => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** G load with one decimal in the current language, e.g. 5.2 / 5,2. */
export const gText = (g: number): string =>
  g.toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
