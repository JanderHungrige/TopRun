import type { LineKey } from './lines-en';

// German spoken lines (doc 06). Same {placeholders} as English; the compiler rejects a missing key.
export const LINES_DE: Readonly<Record<LineKey, readonly string[]>> = {
  // Admiral "Ace" Kincaid
  'adm.open3': [
    'Hervorragend geflogen, {callsign}! Lehrbuchreif vom Katapult bis zur Landung.',
    'SO wird das gemacht, {callsign}. Die ganze Flotte redet über dich.',
    'Makellos, {callsign}. So einen Flug habe ich seit meinen eigenen besten Tagen nicht gesehen.',
  ],
  'adm.open2': [
    'Gute Arbeit da draußen, {callsign}. Mission erfüllt.',
    'Solider Einsatz, {callsign}. Auftrag erledigt, und der Jet ist heil zurück.',
  ],
  'adm.open1': [
    'Auftrag erledigt, {callsign}. Gerade so. Beim Zusehen sind mir graue Haare gewachsen.',
    'Mission erfüllt... aber das war hässlich. Da geht mehr, {callsign}.',
  ],
  'adm.shotDown': [
    'Du bist über feindlichem Wasser ausgestiegen. Die Rettungscrew hat sich ihren Sold heute verdient.',
    'Wir haben heute einen Jet verloren, Pilot. Abschütteln, daraus lernen, wieder fliegen.',
  ],
  'adm.objFailed': [
    'Du bist zurück, aber die Ziele stehen noch. Das ist kein Sieg.',
    'Schön geflogen, falsches Ergebnis. Der Auftrag WAR die Mission, Pilot.',
  ],
  'adm.aborted': [
    'Abbrechen ist nie leicht. Manchmal ist es die klügere Wahl. Sammeln und nochmal.',
    'Den Jet hast du heil zurückgebracht. Jetzt flieg wieder raus und bring es zu Ende.',
  ],
  'adm.boss': [
    '{boss} ist Geschichte. Davon wird man an der Bar noch jahrelang erzählen.',
    '{boss} vom Himmel geholt? Daraus sind Legenden gemacht, Pilot.',
  ],
  'adm.perfectLaunch': [
    'Und dieser Katapultstart? Perfekt. Die Deckcrew jubelt immer noch.',
    'Auch der Start war perfekt. Shooter sagt, du bist ein Naturtalent.',
  ],
  'adm.cleanHull': [
    'Kein Kratzer am Jet. Da lächelt sogar der Chief.',
    'Ohne einen Kratzer zurück. Das ist echte Fliegerkunst.',
  ],
  'adm.kills': [
    '{kills} Abschüsse heute. Der Feind wird sich deinen Rufnamen merken.',
    '{kills} bestätigte Abschüsse. Gar nicht schlecht, Pilot.',
  ],
  'adm.pay': [
    'Dein Sold: {total}. Gib ihn im Hangar klug aus.',
    '{total} sind auf deinem Konto. Der Chief hat neues Spielzeug für dich.',
  ],
  'adm.salvage': [
    'Das Bergungsgeld bringt {total}. Ruh dich aus, dann wieder rauf da.',
    'Vom Bergungsgeld bleiben dir {total}. Den Rest musst du dir verdienen.',
  ],
  'adm.nextTheater': [
    'Pack deine Sachen. Nächster Halt: {theater}.',
    'Deine neuen Befehle schicken dich nach {theater}. Viel Glück, Pilot.',
  ],
  'adm.finale': [
    'Der Krieg ist vorbei, {callsign}. Du bist der Beste der Besten. Willkommen bei TopGun.',
  ],
  'adm.livery': [
    'Und die Lackiererei hat etwas für dich: {livery}. Trag sie mit Stolz.',
    'Noch etwas. Die Crew hat dir eine neue Lackierung gemacht: {livery}. Sie wartet im Hangar.',
  ],
  'adm.liveryRare': [
    'Drei Sterne bei jedem Einsatz da draußen. Dafür gibt es etwas Besonderes: {livery}.',
    'Ein makelloser Einsatzraum, Pilot. Die Lackiererei hat das Beste rausgeholt: {livery}.',
  ],
  // Admiral — Ordensverleihung (Doc 25)
  'adm.medal': [
    'Achtung an Deck! {callsign}, es ist mir eine Ehre, dir diese Auszeichnung zu überreichen: {medal}.',
    '{callsign}, die ganze Flotte hat gesehen, was du da draußen geleistet hast. Dafür bekommst du diese Auszeichnung: {medal}. Trag sie mit Stolz.',
    'Steh gerade, {callsign}. Im Namen der ganzen Besatzung: {medal}. Das hast du dir verdient.',
  ],
  'adm.medalMore': [
    'Und noch eine, {callsign}: {medal}.',
    'Stillhalten, {callsign}, ich bin noch nicht fertig. Auch das noch: {medal}.',
    'Besorgt {callsign} mal eine breitere Brust. Hier kommt: {medal}.',
  ],
  // Chief "Wrench" Kowalski
  'chief.hello': [
    'Willkommen in meinem Hangar, {callsign}. Gucken ist erlaubt, anfassen nur, was du bezahlen kannst.',
    'Schon wieder da, {callsign}? Mal sehen, was wir an deinen Vogel schrauben können.',
  ],
  'chief.helloRich': [
    'Sieh mal einer an. {callsign} hat Geld! Auf geht’s zum Einkaufen.',
    'Fetter Gehaltsscheck, was, {callsign}? Ich hab genau das Richtige für dich.',
  ],
  'chief.helloBroke': [
    'Schon wieder pleite, {callsign}? Flieg eine Mission und komm mit Geld zurück.',
    'Knapp bei Kasse, {callsign}? Schauen kostet wenigstens nichts.',
  ],
  'chief.buyPlane': [
    'Die {plane}! Behandel sie gut. Sie ist eine Schönheit.',
    'Eine {plane}, frisch vom Band. Versuch, den Lack heil zu lassen.',
  ],
  'chief.buyGun': [
    'Mehr Läufe, mehr Spaß. Die Kanone singt jetzt.',
    'Kanone aufgerüstet. Du wirst den Unterschied spüren.',
  ],
  'chief.buySecondary': [
    '{item}, alles klar. Denk dran, sie an eine Station zu hängen.',
    'Gute Wahl. {item} liegt im Regal. Montieren und los.',
  ],
  'chief.buyEquipment': [
    '{item} eingebaut. Das hält dich in der Luft.',
    'Erledigt. {item} ist eingebaut und getestet.',
  ],
  'chief.mount': [
    '{item} eingehängt und scharf.',
    'Station mit {item} bewaffnet. Gute Jagd.',
  ],
  'chief.unmount': [
    'Von der Schiene genommen. Leichterer Jet, weniger Bumms.',
    'Station geräumt.',
  ],
  'chief.select': [
    'In fünf Minuten steht die {plane} auf dem Katapult.',
    'Die {plane} also. Vollgetankt und startklar.',
  ],
  'chief.denied': [
    'Dir fehlen noch {amount}, Flieger.',
    'Netter Versuch. Komm mit {amount} mehr wieder.',
  ],
  'chief.restricted': [
    'Die Phoenix passt nur an die Tomcat, Kleiner.',
    'Falscher Jet dafür. Die Phoenix braucht eine F-14.',
  ],
  'chief.idle': [
    'Nicht den Lack anfassen.',
    'Lass dir Zeit. Ich hab den ganzen Tag. Na ja, eigentlich nicht.',
    'Zu meiner Zeit flog man mit einem Schraubenschlüssel und einem Stoßgebet.',
  ],
  'chief.painted': [
    'Frische Farbe! In {livery} sieht sie richtig böse aus.',
    '{livery}, fertig. Versuch, sie beim ersten Einsatz nicht zu zerkratzen.',
  ],
  // Lt. Sam "Shooter" Reyes
  'sh.spool': [
    'Schub rauf, {callsign}! Halt die Nadel im Grünen.',
    'Triebwerke hoch, {callsign}! Zeig mir volle Leistung, schön ruhig.',
  ],
  'sh.green': [
    'Genau, im Grünen! Mit E einrasten!',
    'Grün! Drück E zum Einrasten!',
  ],
  'sh.overspeed': [
    'Vorsicht! Du kochst die Triebwerke!',
    'Zu viel! Nimm ein bisschen Gas weg!',
  ],
  'sh.launch': [
    'Los, los, los!',
    'Start!',
  ],
  'sh.perfect': [
    'Lehrbuchstart! Wunderschön!',
    'Perfekter Schuss! So macht man das!',
  ],
  'sh.good': [
    'Guter Start. Guten Flug.',
    'Sauberer Schuss. Du bist in der Luft.',
  ],
  'sh.late': [
    'Etwas langsam am Abzug, aber du fliegst.',
    'Ganz schön Zeit gelassen, was? In der Luft bist du trotzdem.',
  ],
  'sh.notYet': [
    'Noch nicht! Mehr Schub, rein ins Grüne.',
    'Zu wenig! Schieb ihn hoch ins Grüne.',
  ],
  'sh.locked': [
    'Eingerastet! Bereithalten... drei, zwei, eins...',
    'Schub fixiert. Festhalten... drei, zwei, eins...',
  ],
  'sh.waitForIt': [
    'Warte!',
    'Noch nicht, noch nicht!',
  ],
  'sh.go': [
    'LOS! Drück E!',
    'Start, Start, Start! Drück E!',
  ],
  // Lt. "Duke" Carter
  'wing.startPatrol': [
    'Hier Duke, {callsign}. Ich halte dir den Rücken frei. Route abfliegen und heim.',
    'Flügelmann in Position, {callsign}. Augen auf. Es ist ruhig... zu ruhig.',
  ],
  'wing.startIntercept': [
    'Hier Duke. Banditen im Anflug. Wir brauchen {n} Abschüsse.',
    'Das Radar leuchtet auf. {n} vom Himmel holen, dann geht’s heim.',
  ],
  'wing.startStrike': [
    'Hier Duke. Ziele: {n} {targets}. Heizen wir ihnen ein.',
    'Bodenziele voraus: {n} {targets}. Achtung, Flak.',
  ],
  'wing.startBoss': [
    'Hier Duke. Laut Aufklärung ist {boss} da draußen. Bleib wachsam.',
    'Es heißt, {boss} wartet auf uns. Verderben wir ihm den Tag.',
  ],
  'wing.halfway': [
    'Halbzeit. Bleib dicht dran.',
    'Die halbe Route ist geschafft. Du machst das super.',
  ],
  'wing.objectiveDone': [
    'Auftrag erfüllt! Ab nach Hause.',
    'Job erledigt. Gute Arbeit!',
  ],
  'wing.bossWarning': [
    'Dicker Brocken im Anflug! Das ist {boss}!',
    'Achtung! {boss} direkt voraus!',
  ],
  'wing.hullLow': [
    'Du ziehst eine Rauchfahne! Vorsicht!',
    'Dich hat es schwer erwischt! Schnapp dir ein Reparaturset!',
  ],
  'wing.special': [
    'Ich komme an deinen Flügel!',
    'Duke an deinem Flügel. Lass uns tanzen!',
  ],
  'wing.victory': [
    'Yeehaw! So wird das gemacht, {callsign}!',
    'Klasse geflogen, {callsign}! Heute Abend gehen die Drinks auf mich.',
  ],
  'wing.base': [
    'Willkommen zurück auf der Basis, {callsign}. Lust auf ein bisschen Freizeit?',
    'Dienstfrei, {callsign}! Worauf hast du Lust?',
  ],
  'wing.baseLocked': [
    'Das gibt es erst nach Einsatz {n}. Flieg weiter!',
    'Noch nicht. Schaff erst Einsatz {n}.',
  ],
  'wing.offer': [
    'Gut geflogen! Lust auf eine Runde {game} vor dem nächsten Einsatz?',
    'Hey, die Crew spielt {game}. Bist du dabei?',
  ],
  'wing.offerNew': [
    'Neu auf der Basis: {game}! Willst du es ausprobieren?',
    'Schau mal, {game} ist jetzt offen. Probierst du es?',
  ],
};
