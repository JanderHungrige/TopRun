import { gameText } from '../minigame-text';

export type HighFiveKey = keyof typeof HIGHFIVE_TEXT.en;

/** High Five texts (doc 42). Duke is the wingman, Lt. "Duke" Carter. */
export const HIGHFIVE_TEXT = gameText({
  rule1: 'Celebrate with Duke on the flight deck: run, jump, slap up high, swing down, slap down low.',
  rule2: 'Press when the shrinking ring meets the target: JUMP, UP HIGH, DOWN LOW.',
  rule3: 'Eight runs, each one faster. PERFECT 100, GOOD 60, MISS 0.',
  rule4: 'Mashing does not help: an early press is a miss.',
  ctrlKeys: 'Keyboard: SPACE / ENTER',
  ctrlPad: 'Gamepad: A',
  ctrlTouch: 'Touch / mouse: tap anywhere',
  score: '{n} points',
  rep: 'RUN {n} / {total}',
  jump: 'JUMP',
  high: 'UP HIGH',
  low: 'DOWN LOW',
  perfect: 'PERFECT!',
  good: 'GOOD',
  miss: 'MISS',
}, {
  rule1: 'Feier mit Duke auf dem Flugdeck: anlaufen, springen, oben abklatschen, runterschwingen, unten abklatschen.',
  rule2: 'Drück, wenn der schrumpfende Ring das Ziel trifft: SPRUNG, OBEN, UNTEN.',
  rule3: 'Acht Anläufe, jeder schneller. PERFEKT 100, GUT 60, DANEBEN 0.',
  rule4: 'Hämmern hilft nicht: zu früh gedrückt ist daneben.',
  ctrlKeys: 'Tastatur: LEERTASTE / ENTER',
  ctrlPad: 'Gamepad: A',
  ctrlTouch: 'Touch / Maus: irgendwo tippen',
  score: '{n} Punkte',
  rep: 'ANLAUF {n} / {total}',
  jump: 'SPRUNG',
  high: 'OBEN',
  low: 'UNTEN',
  perfect: 'PERFEKT!',
  good: 'GUT',
  miss: 'DANEBEN',
});
