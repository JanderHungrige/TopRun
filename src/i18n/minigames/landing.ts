import type { PassResult } from '../../game/minigames/landing';
import type { FaultCat, Grade, Segment } from '../../game/minigames/landing-grade';
import { getLang } from '../i18n';
import { gameText, mt } from '../minigame-text';

/** Carrier Landing texts (doc 18). Paddles' lines are original. */
export const LANDING_TEXT = gameText({
  rule1: 'Night recovery: three passes to a trap aboard the carrier.',
  rule2: 'Fly the ball: keep the amber ball level with the green datum lights.',
  rule3: 'Stay on the centreline lights and keep the AoA donut lit (on speed).',
  rule4: 'Paddles grades: OK 4 · Fair 3 · No grade 2 · Bolter 1 · Wave-off 0',
  ctrlKeys: 'Keyboard: ↑ / ↓ glide path, ← / → line-up, hold Space / J for more power',
  ctrlPad: 'Gamepad / stick: fly, hold A (fire) or use the throttle lever',
  ctrlTouch: 'Touch / mouse: drag on the left to fly, hold on the right for power',
  score: '{pts} pts',
  live: 'PASS {n}/{of}   {pts} PTS',
  ball: 'BALL',
  lineup: 'LINE-UP',
  aoa: 'AOA',
  pwr: 'PWR',
  nm: '{nm} NM',
  paddles: 'PADDLES · LSO',
  board: 'LSO BOARD',
  boardBolter: 'B',
  boardWaveoff: 'WO',
  passOf: 'PASS {n} OF {of}',
  passShort: 'PASS {n}',
  gradeOk: 'OK',
  gradeFair: 'FAIR',
  gradeNoGrade: 'NO GRADE',
  gradeBolter: 'BOLTER',
  gradeWaveoff: 'WAVE-OFF',
  pts: '+{n} PTS',
  pt: '+{n} PT',
  wire: '{wire}-WIRE',
  wirePop: '{wire}-WIRE!',
  bolterPop: 'BOLTER!',
  waveoffPop: 'WAVE OFF!',
  next: 'SPACE / TAP — NEXT PASS',
  nextLast: 'SPACE / TAP — FINISH',
  recovered: 'RECOVERY COMPLETE',
  total: '{pts} POINTS',
  comment: 'PADDLES: “{text}”',
  commentFault: '{fault} {where}',
  commentClean: 'Steady all the way',
  commentWire: '{text} · {wire}-wire',
  bolterLong: 'Floated over the wires',
  bolterFast: 'Too fast — the hook skipped',
  waveLow: 'Too low in close',
  waveLineup: 'Way off the centreline',
  high: 'high', highLittle: 'a little high',
  low: 'low', lowLittle: 'a little low',
  fast: 'fast', fastLittle: 'a little fast',
  slow: 'slow', slowLittle: 'a little slow',
  left: 'lined up left', leftLittle: 'a little left',
  right: 'lined up right', rightLittle: 'a little right',
  middle: 'in the middle',
  close: 'in close',
  ramp: 'at the ramp',
  callRogerBall: 'Roger ball, {callsign}. Keep it coming.',
  callPower: 'Power.',
  callHigh: "You're high.",
  callRight: 'Right for line-up.',
  callLeft: 'Come left for line-up.',
  callFast: "You're fast — ease the power.",
  callEasy: 'Easy with it.',
  callNice: 'Looking good. Steady now.',
  callWaveoff: 'Wave off, wave off!',
  callBolter: 'Bolter, bolter!',
  callWelcome: 'Welcome aboard, {callsign}.',
}, {
  rule1: 'Nachtlandung: drei Anflüge, fang ein Fangseil an Bord.',
  rule2: 'Fliege den Ball: gelber Ball auf Höhe der grünen Bezugslichter.',
  rule3: 'Bleib auf der Mittellinie und halte den AoA-Ring an (richtige Fahrt).',
  rule4: 'Noten: OK 4 · Brauchbar 3 · Ohne Note 2 · Bolter 1 · Durchstarten 0',
  ctrlKeys: 'Tastatur: ↑ / ↓ Gleitpfad, ← / → Mittellinie, Leertaste / J halten für mehr Schub',
  ctrlPad: 'Gamepad / Stick: fliegen, A (Feuer) halten oder Schubhebel',
  ctrlTouch: 'Touch / Maus: links ziehen zum Fliegen, rechts halten für Schub',
  score: '{pts} Pkt.',
  live: 'ANFLUG {n}/{of}   {pts} PKT',
  ball: 'BALL',
  lineup: 'MITTELLINIE',
  aoa: 'AOA',
  pwr: 'SCHUB',
  nm: '{nm} NM',
  paddles: 'PADDLES · LSO',
  board: 'LSO-TAFEL',
  boardBolter: 'B',
  boardWaveoff: 'DS',
  passOf: 'ANFLUG {n} VON {of}',
  passShort: 'ANFLUG {n}',
  gradeOk: 'OK',
  gradeFair: 'BRAUCHBAR',
  gradeNoGrade: 'OHNE NOTE',
  gradeBolter: 'BOLTER',
  gradeWaveoff: 'DURCHSTARTEN',
  pts: '+{n} PKT',
  pt: '+{n} PKT',
  wire: 'SEIL {wire}',
  wirePop: 'SEIL {wire}!',
  bolterPop: 'BOLTER!',
  waveoffPop: 'DURCHSTARTEN!',
  next: 'LEERTASTE / TIPPEN — NÄCHSTER ANFLUG',
  nextLast: 'LEERTASTE / TIPPEN — FERTIG',
  recovered: 'ALLE ANFLÜGE GEFLOGEN',
  total: '{pts} PUNKTE',
  comment: 'PADDLES: „{text}“',
  commentFault: '{fault} {where}',
  commentClean: 'Sauber bis zum Schluss',
  commentWire: '{text} · Seil {wire}',
  bolterLong: 'Über die Seile geschwebt',
  bolterFast: 'Zu schnell — der Haken ist gesprungen',
  waveLow: 'Zu tief im Endanflug',
  waveLineup: 'Weit neben der Mittellinie',
  high: 'hoch', highLittle: 'etwas hoch',
  low: 'tief', lowLittle: 'etwas tief',
  fast: 'schnell', fastLittle: 'etwas schnell',
  slow: 'langsam', slowLittle: 'etwas langsam',
  left: 'links versetzt', leftLittle: 'etwas links',
  right: 'rechts versetzt', rightLittle: 'etwas rechts',
  middle: 'in der Mitte',
  close: 'im Endanflug',
  ramp: 'an der Rampe',
  callRogerBall: 'Roger Ball, {callsign}. Weiter so.',
  callPower: 'Schub.',
  callHigh: 'Du bist hoch.',
  callRight: 'Rechts für die Mittellinie.',
  callLeft: 'Links für die Mittellinie.',
  callFast: 'Zu schnell — Schub raus.',
  callEasy: 'Ruhig, nicht so hastig.',
  callNice: 'Sieht gut aus. Ruhig weiter.',
  callWaveoff: 'Durchstarten, durchstarten!',
  callBolter: 'Bolter, Bolter!',
  callWelcome: 'Willkommen an Bord, {callsign}.',
});

export type LandingKey = keyof typeof LANDING_TEXT.en;
const tx = (k: LandingKey, p?: Record<string, string | number>): string => mt(LANDING_TEXT, k, p);

export const GRADE_KEY: Readonly<Record<Grade, LandingKey>> = {
  ok: 'gradeOk', fair: 'gradeFair', noGrade: 'gradeNoGrade', bolter: 'gradeBolter', waveoff: 'gradeWaveoff',
};
const FAULT_KEY: Readonly<Record<FaultCat, readonly [LandingKey, LandingKey]>> = {
  high: ['high', 'highLittle'], low: ['low', 'lowLittle'], fast: ['fast', 'fastLittle'],
  slow: ['slow', 'slowLittle'], left: ['left', 'leftLittle'], right: ['right', 'rightLittle'],
};
const WHERE_KEY: Readonly<Record<Segment, LandingKey>> = { middle: 'middle', close: 'close', ramp: 'ramp' };

const capital = (s: string): string => s.charAt(0).toLocaleUpperCase(getLang() === 'de' ? 'de-DE' : 'en-US') + s.slice(1);

/** Paddles' comment on a pass, e.g. "A little high in the middle · 4-wire". */
export function passComment(r: PassResult): string {
  const fault = r.note ? capital(tx('commentFault', { fault: tx(FAULT_KEY[r.note.cat][r.note.little ? 1 : 0]), where: tx(WHERE_KEY[r.note.where]) })) : null;
  switch (r.outcome.kind) {
    case 'trap': return tx('commentWire', { text: fault ?? tx('commentClean'), wire: r.outcome.wire });
    case 'bolter': {
      const why = tx(r.outcome.reason === 'fast' ? 'bolterFast' : 'bolterLong');
      return fault ? `${why} · ${fault}` : why;
    }
    case 'waveoff': return tx(r.outcome.reason === 'low' ? 'waveLow' : 'waveLineup');
    default: throw new Error(`unhandled: ${r.outcome satisfies never}`);
  }
}

/** A number in the current language's format, e.g. 1.2 / 1,2. */
export const landingNum = (n: number, digits = 0): string =>
  n.toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
