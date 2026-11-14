import type { STEPPE_LINES_EN } from './lines-steppe-en';

// The alien steppe's lines in German (docs 102, 103); same {placeholders} as English.
export const STEPPE_LINES_DE: Readonly<Record<keyof typeof STEPPE_LINES_EN, readonly string[]>> = {
  'adm.steppe': [
    'Noch eine Welt, {callsign}: Kharsa, ein Steppenplanet, und eine Alien-Armee marschiert darüber. Wir gehen mit Panzern und Buggys rein. Schau auf den Globus.',
  ],
  'adm.finale7': [
    'Das Mutterschiff liegt am Boden und die Steppe gehört wieder uns, {callsign}. Du hast eine Invasion zurück in den Himmel gejagt.',
  ],
  'adm.celebrate7': ['Vom Flugdeck bis ins Gras von Kharsa, {callsign}. Sieben Welten, und jede steht noch wegen dir.'],
  'wing.startDefend': [
    'Außenposten in Sicht, {callsign}. Bau auf den Plätzen und halt ihn {n} Wellen lang.',
    'Da kommen sie, {callsign}. Türme hoch, Waffen heiß: {n} Wellen halten.',
  ],
  'chief.helloTanks': [
    'Willkommen im Fuhrpark, {callsign}. Ketten, Räder, Kanonen. Such dir was aus, ich tank es voll.',
    'Wieder überall Staub, {callsign}. Mit welchem fahren wir heute raus?',
  ],
  'ort.start': [
    'Captain Ortega, Postenkommando. Bau auf den Plätzen, {callsign}. Sie sind bald hier.',
    'Ortega hier. Die Bauplätze gehören dir, {callsign}: Stell Türme auf, bevor sie kommen.',
  ],
  'ort.wave': ['Welle {n} von {total} kommt die Pfade runter!', 'Da kommt Welle {n} von {total}!', 'Kontakt! Welle {n} von {total}.'],
  'ort.lastWave': ['Letzte Welle, {callsign}! Alles, was sie haben.', 'Das sind die letzten, {callsign}. Halten!'],
  'ort.held': ['Welle gehalten, {callsign}. Nutz die Zeit: bauen, ausbauen.', 'Die ist durch, {callsign}. Mach dich bereit für die nächste.', 'Gehalten! Gib den Nachschub aus, {callsign}.'],
  'ort.half': ['Sie kommen durchs Tor, {callsign}!', 'Wir kriegen Treffer an der Mauer, {callsign}!'],
  'ort.quarter': ['Die Mauer hält nicht mehr lange!', 'Noch ein Stoß und sie überrennen uns!'],
  'ort.boss': ['{boss} kommt auf den Außenposten zu! Hol ihn runter, bevor er uns platt macht!'],
  'ort.victory': ['Der Außenposten steht. Gut gefahren, {callsign}.', 'Wir haben gehalten. Heute Abend gibt es warmes Essen, das geht auf mich, {callsign}.'],
  'ort.special': ['So wird das gemacht, {callsign}!', 'Schön, {callsign}!'],
  'nov.hello': [
    'Dr. Novak, sehr erfreut! Ihre Technik ist ein Wunder, {callsign}: Gib mir Einsätze und ich gebe dir Waffen.',
    '{callsign}! Komm rein, Vorsicht mit den Kabeln. Was nehmen wir heute auseinander?',
  ],
  'nov.noLab': ['Noch kein Labor, {callsign}. Ein Container, etwas Strom, ein Mikroskop: {price}. Drück U und ich lege sofort los.'],
  'nov.bought': ['Ein Labor der Stufe {level}! Jetzt geht es los.', 'Stufe {level}! Mehr Werkbänke, mehr Forschung.'],
  'nov.broke': ['Dafür reicht das Geld noch nicht, {callsign}. Flieg noch ein paar Einsätze.'],
  'nov.started': ['{project}, ausgezeichnete Wahl. Die Punkte aus jedem Einsatz fließen hinein.', 'Bin dran: {project}. Flieg du weiter, ich tüftle weiter.'],
  'nov.invented': ['Heureka! {project} ist fertig, {callsign}.', 'Es funktioniert, {callsign}! {project}, erfunden.'],
  'nov.needsLab': ['Dafür braucht es ein Labor der Stufe {level}, {callsign}. Drück U, sobald du es dir leisten kannst.'],
  'nov.needsFirst': ['Eins nach dem anderen: erst {project}, dann das.'],
  'sh.rampOpen': ['Die Rampe kommt runter, {callsign}. Achte auf die Ampel.', 'Der Lander steht, {callsign}. Bei Rot hochdrehen, bei Grün los.'],
  'sh.rampLights': ['Rot ist an! Halt die Nadel im Grünen.', 'Jetzt kommt die Ampel. Gefühlvoll am Gas!'],
  'sh.rampPerfect': ['Perfekter Start! Ab mit dir, {callsign}!', 'Wie aus dem Lehrbuch, {callsign}. Sauber runter von der Rampe!'],
  'sh.rampGood': ['Guter Start. Schnapp sie dir, {callsign}.', 'Gar nicht schlecht, {callsign}. Rollt!'],
  'sh.rampEarly': ['Zu viel Drehzahl! Die Räder drehen durch, {callsign}.', 'Sachte mit dem Gas, {callsign}! Das war viel Staub.'],
  'sh.rampLate': ['Abgewürgt, {callsign}. Vor Grün mehr Drehzahl.', 'Lahm von der Rampe, {callsign}. Nächstes Mal höher drehen.'],
};
