import { gameText } from '../minigame-text';

export type RangeKey = keyof typeof RANGE_TEXT.en;

/** FIRING RANGE texts (doc 90). */
export const RANGE_TEXT = gameText({
  rule1: 'The mech gunnery range in the jungle: wooden boards pop up behind the berms and bushes.',
  rule2: 'Shoot the enemy walkers. Spare the monkey boards: hitting one costs points and your streak.',
  rule3: 'One minute. Quick hits and long streaks score more; the boards come faster and stay up shorter as the minute runs.',
  ctrlKeys: 'Keyboard: arrows aim · SPACE fire',
  ctrlPad: 'Gamepad: stick aims · A fires',
  ctrlTouch: 'Touch / mouse: tap a board to shoot it',
  score: '{n} points',
  time: 'TIME {n}',
  streak: 'STREAK ×{n}',
  hit: '+{n}',
  friend: 'NOT THE MONKEY! {n}',
  miss: 'MISS',
}, {
  rule1: 'Der Mech-Schießstand im Dschungel: Holzscheiben klappen hinter Wällen und Büschen hoch.',
  rule2: 'Triff die feindlichen Läufer. Verschone die Affenscheiben: Ein Treffer kostet Punkte und deine Serie.',
  rule3: 'Eine Minute. Schnelle Treffer und lange Serien bringen mehr; die Scheiben kommen immer schneller und bleiben kürzer oben.',
  ctrlKeys: 'Tastatur: Pfeile zielen · LEERTASTE schießt',
  ctrlPad: 'Gamepad: Stick zielt · A schießt',
  ctrlTouch: 'Touch / Maus: Scheibe antippen, um zu schießen',
  score: '{n} Punkte',
  time: 'ZEIT {n}',
  streak: 'SERIE ×{n}',
  hit: '+{n}',
  friend: 'NICHT DEN AFFEN! {n}',
  miss: 'DANEBEN',
});
