import { gameText } from '../minigame-text';

export type DockingKey = keyof typeof DOCKING_TEXT.en;

/** STATION DOCKING texts (doc 89). */
export const DOCKING_TEXT = gameText({
  rule1: 'Fly the shuttle into the station\'s docking port. In space nothing slows you down: every push lasts until you push back.',
  rule2: 'Touch the port slowly and in the middle. Faster than the red line, or beside the port, is a bump.',
  rule3: 'Three dockings; from the second the port drifts with the turning station. Slow, centred, quick and thrifty scores most.',
  ctrlKeys: 'Keyboard: arrows fire the thrusters',
  ctrlPad: 'Gamepad: stick fires the thrusters',
  ctrlTouch: 'Touch / mouse: hold beside the shuttle to push away from that side',
  score: '{n} points',
  round: 'DOCKING {n} / {total}',
  speed: 'SPEED {n}',
  fuel: 'FUEL',
  time: 'TIME {n}',
  docked: 'DOCKED! +{n}',
  crashed: 'BUMP! TOO FAST OR OFF THE PORT',
  timeout: 'TIME IS UP',
}, {
  rule1: 'Flieg das Shuttle in den Andockport der Station. Im Weltraum bremst dich nichts: Jeder Schub hält an, bis du gegenschiebst.',
  rule2: 'Berühre den Port langsam und genau in der Mitte. Schneller als die rote Linie oder neben dem Port gibt es einen Rums.',
  rule3: 'Drei Andockmanöver; ab dem zweiten driftet der Port mit der drehenden Station. Langsam, mittig, schnell und sparsam bringt am meisten.',
  ctrlKeys: 'Tastatur: Pfeile zünden die Steuerdüsen',
  ctrlPad: 'Gamepad: Stick zündet die Steuerdüsen',
  ctrlTouch: 'Touch / Maus: neben dem Shuttle halten, um von dieser Seite wegzuschieben',
  score: '{n} Punkte',
  round: 'ANDOCKEN {n} / {total}',
  speed: 'TEMPO {n}',
  fuel: 'TREIBSTOFF',
  time: 'ZEIT {n}',
  docked: 'ANGEDOCKT! +{n}',
  crashed: 'RUMMS! ZU SCHNELL ODER NEBEN DEM PORT',
  timeout: 'DIE ZEIT IST UM',
});
