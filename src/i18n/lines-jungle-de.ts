import type { JUNGLE_LINES_EN } from './lines-jungle-en';
import { STEPPE_LINES_DE } from './lines-steppe-de';

// The jungle planet's lines in German (docs 78, 82, 83); same {placeholders} as English.
export const JUNGLE_LINES_DE: Readonly<Record<keyof typeof JUNGLE_LINES_EN, readonly string[]>> = {
  ...STEPPE_LINES_DE,
  'adm.jungle': [
    'Und noch eine Welt, {callsign}: ein Dschungelplanet. Keine Startbahn, kein Wasser, also wird gelaufen. Deine Mechs warten. Schau auf den Globus.',
  ],
  'adm.finale6': [
    'Der Bau ist tot und der Dschungel ist still, {callsign}. Du bist durch den Krieg eines ganzen Planeten marschiert.',
  ],
  'adm.celebrate6': ['Von den Flugdecks bis in einen Dschungel auf einer anderen Welt, {callsign}. Da draußen hält dich nichts mehr auf.'],
  'maj.hello': [
    'Willkommen im Dreck, {callsign}! Major Brennan. Ich baue, was wir brauchen, du hältst mir die Käfer von der Baustelle.',
    '{callsign}! Vorsicht, Schlamm. Was bauen wir heute?',
  ],
  'maj.firstVisit': [
    'So läuft das, {callsign}: Geld bezahlt die Gebäude. Zuerst den Generator, der versorgt alles mit Strom. Die Raffinerie macht Legierung, aus Legierung baust du Mechs, Kanonen und Munition.',
  ],
  'maj.built': [
    'Steht! {building} läuft.',
    'Fertig. {building} ist aufgebaut.',
  ],
  'maj.upgraded': [
    '{building} ist jetzt größer und besser. Stufe {level}!',
  ],
  'maj.broke': [
    'Dafür fehlt uns das Geld, {callsign}. Flieg ein paar Einsätze und komm wieder.',
  ],
  'maj.lowPower': [
    'Uns fehlt Strom: Alles läuft nur mit {share} %. Bau den Generator aus, {callsign}.',
  ],
  'maj.rounds': [
    '{n} {kind} vom Band. Sie liegen im Magazin.',
  ],
  'maj.noFactory': [
    'Keine Fabrik, keine Munition. Bau zuerst die Munitionsfabrik, {callsign}.',
  ],
  'maj.magazineFull': [
    'Das Magazin ist voll. Bau die Fabrik aus, wenn du mehr lagern willst.',
  ],
  'doc.hello': [
    'Ah, {callsign}! Dr. Moreau. Vorsicht mit dem Frosch. Was erfinden wir heute?',
    '{callsign}! Komm rein, komm rein. Der Planet steckt voller Überraschungen, und mein Labor auch.',
  ],
  'doc.noLab': [
    'Noch gibt es kein Laborgebäude, {callsign}. Bitte den Major, eins zu bauen, dann erfinde ich dir alles.',
  ],
  'doc.started': [
    '{project}! Eine prächtige Idee. Nach jedem Einsatz stecke ich die Arbeit des Labors hinein.',
  ],
  'doc.invented': [
    'Heureka! {project} funktioniert! Probier es aus, {callsign}.',
    'Fertig, {callsign}: {project}. Aber bitte nicht aufs Labor richten.',
  ],
  'doc.needsLab': [
    'Dafür brauchen wir ein größeres Labor: Stufe {level}. Der Major kann es bauen.',
  ],
  'doc.needsFirst': [
    'Zuerst müssen wir {project} erfinden. Ein Schritt nach dem anderen.',
  ],
  'sh.bayOpen': [
    'Ladeluke offen, {callsign}. Grünes Licht in drei … zwei …',
    'Über der Landezone, {callsign}. Halt dich fest.',
  ],
  'sh.drop': [
    'Absprung, Absprung! Halt die Bremsraketen und setz sie sanft auf, {callsign}!',
    'Du bist draußen! Zünde die Bremsraketen im Grünen und lande weich, {callsign}!',
  ],
  'sh.dropPerfect': [
    'Federleicht! Genau auf dem Landeplatz.',
    'Absprung wie aus dem Lehrbuch. Kein Riss im Schlamm.',
  ],
  'sh.dropGood': [
    'Unten und auf den Beinen. Guter Absprung.',
    'Ein kleiner Rumms, aber du bist unten.',
  ],
  'sh.dropEarly': [
    'Du hast den Treibstoff zu hoch verbraucht! Das war ein langer letzter Fall.',
    'Bremsraketen leer über den Bäumen. Warte nächstes Mal aufs Grüne.',
  ],
  'sh.dropLate': [
    'Zu spät gezündet! Das gab einen Krater, {callsign}.',
    'Die Landung hat den ganzen Dschungel erschüttert, {callsign}. Zünde nächstes Mal früher.',
  ],
  'chief.helloMechs': [
    'Willkommen im Mech-Hangar, {callsign}. Legierung rein, Mechs raus. Was du brauchst, schraube ich dran.',
  ],
};
