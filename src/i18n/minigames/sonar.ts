import { gameText } from '../minigame-text';

export type SonarKey = keyof typeof SONAR_TEXT.en;

/** SONAR HUNT texts (doc 88). */
export const SONAR_TEXT = gameText({
  rule1: 'An enemy sub hides somewhere in the dark water. Find it with the sonar and sink it with a torpedo.',
  rule2: 'A ping sends out an echo ring exactly as far as the sub is. Where the rings cross, the sub hides.',
  rule3: 'Five subs, eight torpedoes. Every extra ping and every miss costs points. From the third sub on, it slips away now and then.',
  ctrlKeys: 'Keyboard: arrows move · SPACE ping · F torpedo',
  ctrlPad: 'Gamepad: stick · A ping · X torpedo',
  ctrlTouch: 'Touch / mouse: tap a cell, then PING or TORPEDO',
  score: '{n} points',
  sub: 'SUB {n} / {total}',
  torpedoes: 'TORPEDOES {n}',
  ping: 'PING',
  torpedo: 'TORPEDO',
  sunk: 'SUNK! +{n}',
  miss: 'MISS',
  slipped: 'IT SLIPPED AWAY!',
}, {
  rule1: 'Ein feindliches U-Boot versteckt sich irgendwo im dunklen Wasser. Finde es mit dem Sonar und versenke es mit einem Torpedo.',
  rule2: 'Ein Ping schickt einen Echoring genau so weit hinaus, wie das U-Boot entfernt ist. Wo sich die Ringe kreuzen, steckt es.',
  rule3: 'Fünf U-Boote, acht Torpedos. Jeder zusätzliche Ping und jeder Fehlschuss kostet Punkte. Ab dem dritten U-Boot schleicht es sich ab und zu davon.',
  ctrlKeys: 'Tastatur: Pfeile bewegen · LEERTASTE Ping · F Torpedo',
  ctrlPad: 'Gamepad: Stick · A Ping · X Torpedo',
  ctrlTouch: 'Touch / Maus: Feld antippen, dann PING oder TORPEDO',
  score: '{n} Punkte',
  sub: 'U-BOOT {n} / {total}',
  torpedoes: 'TORPEDOS {n}',
  ping: 'PING',
  torpedo: 'TORPEDO',
  sunk: 'VERSENKT! +{n}',
  miss: 'DANEBEN',
  slipped: 'ES IST ENTWISCHT!',
});
