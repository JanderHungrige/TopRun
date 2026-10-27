import { MISSIONS_2_DE } from './missions-2-de';

// German mission names and briefings, keyed by mission id (m01 … m30; map 2's m31 … m60 in missions-2-de.ts).
const MISSIONS_1_DE: Readonly<Record<string, { name: string; briefing: string }>> = {
  m01: { name: 'Erster Einsatz', briefing: 'Willkommen in der Staffel, Frischling. Flieg das Übungsgebiet ab und bleib am Leben. Die Flugleitung meldet Zieldrohnen, die feindlich geworden sind.' },
  m02: { name: 'Banditen auf Angels 12', briefing: 'Ein Schwarm MiG-21 testet die Luftverteidigung der Flotte. Hol mindestens 12 Banditen vom Himmel.' },
  m03: { name: 'Inselradar', briefing: 'Ein feindlicher Horchposten auf der Atollkette verfolgt unseren Träger. Schalte 3 Radarstationen aus.' },
  m04: { name: 'Vorpostenkette', briefing: 'Jäger und Kampfhubschrauber bilden eine Vorpostenkette vor der Flotte. Durchbrich sie: 18 Abschüsse.' },
  m05: { name: 'Konvoibrecher', briefing: 'Ein schneller Konvoi bringt Nachschub zwischen den Inseln. Versenke 4 Patrouillenboote.' },
  m06: { name: 'Ironclad', briefing: 'Das Schlachtschiff IRONCLAD hält auf die Flotte zu. Zerstöre seine Geschütztürme und schick es auf den Grund.' },
  m07: { name: 'Wüstendämmerung', briefing: 'Neues Einsatzgebiet, neue Regeln. Flieg die Morgenpatrouille über der Wüste und verschaff dir einen Überblick.' },
  m08: { name: 'SAM-Gasse', briefing: 'Ein Gürtel aus SAM-Stellungen bewacht den Pass. Schalte 4 davon aus, damit die Bomber durchkommen. Täuschkörper empfohlen.' },
  m09: { name: 'Angriff aufs Öllager', briefing: 'Schneid ihnen den Treibstoff ab. Zerstöre 3 Treibstofflager. Bomben erledigen das schnell.' },
  m10: { name: 'Fulcrum-Furie', briefing: 'Ihre beste MiG-29-Staffel ist in der Luft. Schieß 24 Flugzeuge ab.' },
  m11: { name: 'Panzerkolonne', briefing: 'Eine Panzerkolonne rast auf die Grenze zu. Halte sie auf: Zerstöre 6 Kampfpanzer.' },
  m12: { name: 'Sandstorm', briefing: 'Die Festung SANDSTORM ist das Rückgrat ihrer gesamten Verteidigungslinie. Bring sie zu Fall.' },
  m13: { name: 'Nordwache', briefing: 'Arktispatrouille. Kaltes Wasser, noch kälterer Empfang. Bleib wachsam und komm heil zurück.' },
  m14: { name: 'Eisbrecher', briefing: 'Zwei Zerstörer eskortieren Eisbrecher durch das Packeis. Versenke beide.' },
  m15: { name: 'Radar-Blackout', briefing: 'Mach sie blind. Vier Radarstationen auf dem Schelfeis müssen ausfallen.' },
  m16: { name: 'Bärenjagd', briefing: 'Tu-95-Langstreckenbomber im Anflug. Hol 5 Bears runter, bevor sie in Schussweite kommen.' },
  m17: { name: 'Whiteout', briefing: 'Ein Schneesturm und ein Himmel voller Banditen. 30 Abschüsse.' },
  m18: { name: 'Blackjack', briefing: 'BLACKJACK, ihr schwerster strategischer Bomber, ist hinter einem Drohnenschirm in der Luft. Abfangen und zerstören.' },
  m19: { name: 'Flug durch den Roten Canyon', briefing: 'Flieg unter ihrem Radar durch den Roten Canyon. Tief, schnell und lebendig.' },
  m20: { name: 'Hornissennest', briefing: 'Die Canyonwände verbergen ein dichtes SAM-Netz. Zerstöre 5 SAM-Stellungen.' },
  m21: { name: 'Hubschrauberfriedhof', briefing: 'Ein Kampfhubschrauber-Regiment sammelt sich im Canyon. Schieß 8 Hinds ab.' },
  m22: { name: 'Nachschublinie', briefing: 'Ihre vorgeschobenen Basen hängen an diesen Lagern. Fackel 5 davon ab.' },
  m23: { name: 'Flanker-Ass', briefing: 'Ihr bestes Fliegerass und seine Su-27-Staffel jagen dich. 34 Abschüsse.' },
  m24: { name: 'Typhoon', briefing: 'TYPHOON, ein experimenteller Nurflügler, ist über uns. Nichts so Großes sollte fliegen. Ändere das.' },
  m25: { name: 'Sturmfront', briefing: 'Operation Leviathan beginnt. Kämpf dich durch die Sturmfront in die Heimatgewässer des Feindes.' },
  m26: { name: 'Vorposten-Zerstörer', briefing: 'Drei Zerstörer schirmen den feindlichen Superträger ab. Versenke sie.' },
  m27: { name: 'Drohnenschwarm', briefing: 'Sie schicken alles, was sie haben. Hol 45 Drohnen und Jäger vom Himmel.' },
  m28: { name: 'Küstenbatterien', briefing: 'Batterien auf Vulkaninseln decken die Trägergruppe. Bring 6 SAM-Stellungen zum Schweigen.' },
  m29: { name: 'Auge des Sturms', briefing: 'Die letzte Luftschlacht. 40 Abschüsse, und der Himmel gehört uns.' },
  m30: { name: 'Leviathan', briefing: 'LEVIATHAN, der feindliche Superträger. Beende diesen Krieg. Gute Jagd, Pilot.' },
};

export const MISSIONS_DE: Readonly<Record<string, { name: string; briefing: string }>> = { ...MISSIONS_1_DE, ...MISSIONS_2_DE };
