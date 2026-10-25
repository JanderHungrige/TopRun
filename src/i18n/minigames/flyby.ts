import { getLang } from '../i18n';
import { gameText } from '../minigame-text';

/** Tower Flyby texts (doc 13). */
export const FLYBY_TEXT = gameText({
  rule1: 'Three high-speed passes over the control tower.',
  rule2: 'Bumpy air! The lower over the roof, the more points.',
  rule3: 'Afterburner pays up to ×1.5 but is twitchy.',
  rule4: 'Under 10 ft the coffee spills: +{bonus}. Hits: 0.',
  ctrlKeys: 'Keyboard: ↑ / ↓ or W / S pitch, hold Space / J for afterburner',
  ctrlPad: 'Gamepad / stick: up / down, hold A (fire) for afterburner',
  ctrlTouch: 'Touch / mouse: drag on the left, hold on the right for afterburner',
  score: '{score} pts',
  live: 'PASS {pass}/{total}   {score}',
  feetOver: 'FEET OVER THE TOWER',
  ft: '{ft} FT',
  tower: 'TOWER',
  spillZone: 'COFFEE',
  banner: 'PASS {pass} / {total}',
  finalPass: 'FINAL PASS',
  burner: 'AFTERBURNER',
  mult: '×{mult}',
  points: '+{points}',
  detail: '{ft} FT  ·  ×{mult}',
  spill: 'COFFEE SPILL +{bonus}',
  tooHigh: 'TOO HIGH',
  scrape: 'SCRAPE!',
  nearMiss: 'NEAR MISS!',
  ground: 'GROUND!',
  noScore: 'NO POINTS',
}, {
  rule1: 'Drei Überflüge mit Vollgas über den Tower.',
  rule2: 'Böen! Je tiefer übers Dach, desto mehr Punkte.',
  rule3: 'Nachbrenner bringt bis ×1,5, ist aber nervös.',
  rule4: 'Unter 10 ft kippt der Kaffee: +{bonus}. Treffer: 0.',
  ctrlKeys: 'Tastatur: ↑ / ↓ oder W / S Nase, Leertaste / J halten: Nachbrenner',
  ctrlPad: 'Gamepad / Stick: hoch / runter, A (Feuer) halten: Nachbrenner',
  ctrlTouch: 'Touch / Maus: links ziehen, rechts halten für Nachbrenner',
  score: '{score} Pkt.',
  live: 'ÜBERFLUG {pass}/{total}   {score}',
  feetOver: 'FUSS ÜBER DEM TOWER',
  ft: '{ft} FT',
  tower: 'TOWER',
  spillZone: 'KAFFEE',
  banner: 'ÜBERFLUG {pass} / {total}',
  finalPass: 'LETZTER ÜBERFLUG',
  burner: 'NACHBRENNER',
  mult: '×{mult}',
  points: '+{points}',
  detail: '{ft} FT  ·  ×{mult}',
  spill: 'KAFFEE VERSCHÜTTET +{bonus}',
  tooHigh: 'ZU HOCH',
  scrape: 'GESTREIFT!',
  nearMiss: 'BEINAHE-CRASH!',
  ground: 'BODENKONTAKT!',
  noScore: 'KEINE PUNKTE',
});

export type FlybyKey = keyof typeof FLYBY_TEXT.en;

/** A number in the current language's format, e.g. 2,450 / 2.450 or 1.48 / 1,48. */
export const flybyNum = (n: number, digits = 0): string =>
  n.toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
