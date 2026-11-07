import type { LaunchLineKey } from './lines-launch-en';

// Lt. Sam "Shooter" Reyes ruft die Starts der späten Welten aus (doc 76) — German; keys must match lines-launch-en.ts.
export const LAUNCH_LINES_DE: Readonly<Record<LaunchLineKey, readonly string[]>> = {
  'sh.flood': [
    'Das Welldeck wird geflutet, {callsign}. Halt sie ruhig.',
    'Das Wasser kommt, {callsign}. Ganz ruhig jetzt.',
  ],
  'sh.dive': [
    'Du bist frei! Flute die Tanks und bring sie zwischen Netz und Riff!',
    'Raus mit dir! Ab in die Lücke, unter dem Netz durch, über dem Riff!',
  ],
  'sh.divePerfect': [
    'Perfekt getrimmt! Genau durch die Mitte der Lücke.',
    'Lehrbuchreif getaucht! Kein Kratzer.',
  ],
  'sh.diveGood': [
    'Gut getaucht. Du bist durch.',
    'Durch die Lücke. Gut gemacht.',
  ],
  'sh.diveShallow': [
    'Etwas zu flach, {callsign}! Das war knapp am Netz.',
    'Zu hoch, {callsign}! Pass nächstes Mal aufs Netz auf.',
  ],
  'sh.diveDeep': [
    'Etwas zu tief, {callsign}! Das war knapp am Riff.',
    'Zu tief, {callsign}! Geh sparsamer mit dem Ballast um.',
  ],
  'sh.countdown': [
    'Startkontrolle an {callsign}: Alle Systeme bereit. T minus zehn.',
    'Du hast Startfreigabe, {callsign}. Der Countdown läuft.',
  ],
  'sh.liftoff': [
    'Abheben! Wirf jede Stufe ab, sobald sie ausgebrannt ist!',
    'Wir haben abgehoben! Achte auf den Treibstoff und trenn, wenn er leer ist!',
  ],
  'sh.sepPerfect': [
    'Saubere Trennung! Genau auf den Punkt.',
    'Perfekte Stufentrennung!',
  ],
  'sh.sepGood': [
    'Gute Trennung.',
    'Stufe ab. Gut.',
  ],
  'sh.sepEarly': [
    'Zu früh, {callsign}! In der Stufe war noch Treibstoff.',
    'Zu früh getrennt, {callsign}. Du hast Treibstoff verschenkt.',
  ],
  'sh.sepLate': [
    'Spät getrennt, aber du steigst noch.',
    'Da bist du eine Weile ohne Schub geflogen. Es geht trotzdem aufwärts.',
  ],
  'sh.orbit': [
    'Du bist im Orbit, {callsign}. Gute Jagd da oben.',
    'Orbit erreicht. Der Rest liegt bei dir, {callsign}.',
  ],
};
