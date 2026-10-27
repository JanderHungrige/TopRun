import type { BossId, EnemyKind, EquipmentId, PlaneId, SecondaryId, TheaterId } from '../data/types';

// German content for the data tables (English lives in src/data). Proper names stay untranslated.

export const THEATERS_DE: Readonly<Record<TheaterId, { name: string; tagline: string }>> = {
  pacific: { name: 'Pazifik-Übungsgebiet', tagline: 'Verdien dir deine Schwingen' },
  gulf: { name: 'Persischer Golf', tagline: 'Ein Wüstensturm zieht auf' },
  arctic: { name: 'Arktischer Schild', tagline: 'Kalter Krieg, heißer Himmel' },
  canyon: { name: 'Roter Canyon', tagline: 'Tief und schnell' },
  leviathan: { name: 'Operation Leviathan', tagline: 'Beende den Krieg' },
  northsea: { name: 'Nordsee-Plattformen', tagline: 'Sturm über den Bohrinseln' },
  himalaya: { name: 'Dach der Welt', tagline: 'Dünne Luft, hoher Einsatz' },
  jungle: { name: 'Grüne Hölle', tagline: 'Unter dem Blätterdach' },
  nightfall: { name: 'Wüstennacht', tagline: 'Ins Dunkel' },
  thunderhead: { name: 'Operation Gewitterfront', tagline: 'Mach endgültig Schluss' },
};

export const PLANES_DE: Readonly<Record<PlaneId, { specialName: string; description: string }>> = {
  f16: {
    specialName: 'Fassrolle',
    description: 'Leichter, wendiger Mehrzweckjäger. Zwei Waffenstationen und eine schnelle Ausweich-Fassrolle.',
  },
  f14: {
    specialName: 'Flügelmann',
    description: 'Schwerer Schwenkflügel-Flottenverteidiger. Vier Waffenstationen, trägt die AIM-54 Phoenix und ruft einen Flügelmann.',
  },
  sr71: {
    specialName: 'Mach-3-Sprint',
    description: 'Der schnellste Jet aller Zeiten, umgerüstet für den Kampf. Der Mach-3-Sprint rammt alles aus dem Weg.',
  },
  a10: {
    specialName: 'GAU-8-Feuerstoß',
    description: 'Gepanzerter Panzerknacker rund um seine 30-mm-Kanone. Langsam und kaum kleinzukriegen; der GAU-8-Feuerstoß zerlegt Boden- und Luftziele.',
  },
  f35: {
    specialName: 'Tarnkappe',
    description: 'Tarnkappen-Mehrzweckjäger. Verschwindet vom Radar: Solange er getarnt ist, stellt der Feind das Feuer ein.',
  },
  tornado: {
    specialName: 'Atomschlag',
    description: 'Alter Schwenkflügel-Jagdbomber für Hardcore-Piloten: so alt, dass er in jeder Mission langsam Hülle verliert. Trägt eine Atomrakete.',
  },
};

export const SECONDARIES_DE: Readonly<Record<SecondaryId, { name: string; description: string }>> = {
  aim9: { name: 'AIM-9 Sidewinder', description: 'Wärmesuchende Luft-Luft-Rakete. Erfasst den nächsten Banditen voraus.' },
  rockets: { name: 'Zuni-Raketenbehälter', description: 'Feuert einen Fächer aus fünf ungelenkten Raketen. Trifft Luft- und Bodenziele.' },
  mk82: { name: 'Mk-82-Bomben', description: '500-Pfund-Freifallbombe. Großer Explosionsradius gegen Boden- und Seeziele.' },
  agm65: { name: 'AGM-65 Maverick', description: 'Fernsehgelenkte Luft-Boden-Rakete. Sucht SAM-Stellungen, Panzer und Schiffe.' },
  aim54: { name: 'AIM-54 Phoenix', description: 'Schwere Langstreckenrakete. Verheerend gegen Bosse. Nur für die F-14.' },
  aim120: { name: 'AIM-120 AMRAAM', description: 'Schnelle, wendige radargelenkte Rakete. Jagt die zähesten Jäger.' },
  jdam: { name: 'GBU-31 JDAM', description: '2000-Pfund-Bombe mit Satellitenlenkung. Die größte Explosion im Hangar.' },
};

export const EQUIPMENT_DE: Readonly<Record<EquipmentId, { name: string; description: string; levelText: readonly string[] }>> = {
  armor: {
    name: 'Panzerplatten', description: 'Titanplatten um Cockpit und Triebwerke.',
    levelText: ['+20 % Panzerung', '+40 % Panzerung', '+60 % Panzerung', '+80 % Panzerung', '+100 % Panzerung'],
  },
  engine: {
    name: 'Triebwerkstuning', description: 'Getunte Turbinen und ein heißerer Nachbrenner.',
    levelText: ['+8 % Tempo', '+16 % Tempo', '+24 % Tempo'],
  },
  flares: {
    name: 'Täuschkörperwerfer', description: 'Täuschkörper lenken feindliche Raketen ab. Taste F.',
    levelText: ['2 Täuschkörper', '4 Täuschkörper', '6 Täuschkörper', '8 Täuschkörper', '10 Täuschkörper'],
  },
  ecm: {
    name: 'ECM-Störbehälter', description: 'Stört die feindliche Feuerleitung. Feindliche Kugeln −25 % Schaden, Raketen drehen 30 % langsamer.',
    levelText: ['−25 % Kugelschaden, langsamere Raketen'],
  },
  damageControl: {
    name: 'Schadenskontrolle', description: 'Einmal pro Mission, unter 25 % Panzerung: stellt 40 % wieder her.',
    levelText: ['Einmal pro Mission +40 % Panzerung'],
  },
  magnet: {
    name: 'Frachtmagnet', description: 'Aufsammelbares fliegt dir aus viel größerer Entfernung zu.',
    levelText: ['Größere Sammelreichweite'],
  },
  radar: {
    name: 'Frühwarnradar', description: 'Größere Radarreichweite: Banditen erscheinen bis zu 4 Sekunden früher auf dem Schirm.',
    levelText: ['Banditen 4 s früher auf dem Radar'],
  },
};

type Forms = readonly [singular: string, plural: string];

export const ENEMIES_EN_PLURAL: Readonly<Record<EnemyKind, string>> = {
  drone: 'Attack Drones', fishbed: 'MiG-21 Fishbeds', fulcrum: 'MiG-29 Fulcrums', flanker: 'Su-27 Flankers',
  hind: 'Mi-24 Hinds', bear: 'Tu-95 Bears', aa: 'AA Guns', sam: 'SAM Sites', tank: 'Battle Tanks',
  radar: 'Radar Stations', depot: 'Fuel Depots', boat: 'Patrol Boats', destroyer: 'Destroyers',
};

export const ENEMIES_DE: Readonly<Record<EnemyKind, Forms>> = {
  drone: ['Angriffsdrohne', 'Angriffsdrohnen'],
  fishbed: ['MiG-21 Fishbed', 'MiG-21 Fishbeds'],
  fulcrum: ['MiG-29 Fulcrum', 'MiG-29 Fulcrums'],
  flanker: ['Su-27 Flanker', 'Su-27 Flanker'],
  hind: ['Mi-24 Hind', 'Mi-24 Hinds'],
  bear: ['Tu-95 Bear', 'Tu-95 Bears'],
  aa: ['Flakgeschütz', 'Flakgeschütze'],
  sam: ['SAM-Stellung', 'SAM-Stellungen'],
  tank: ['Kampfpanzer', 'Kampfpanzer'],
  radar: ['Radarstation', 'Radarstationen'],
  depot: ['Treibstofflager', 'Treibstofflager'],
  boat: ['Patrouillenboot', 'Patrouillenboote'],
  destroyer: ['Zerstörer', 'Zerstörer'],
};

export const BOSSES_DE: Readonly<Record<BossId, string>> = {
  ironclad: 'Schlachtschiff',
  sandstorm: 'Küstenfestung',
  blackjack: 'Strategischer Bomber',
  typhoon: 'Nurflügler',
  leviathan: 'Feindlicher Superträger',
  kraken: 'Seefestung',
  condor: 'Schweres Kampfflugzeug',
  python: 'Panzerzug',
  scorpion: 'Raketenkriecher',
  colossus: 'Fliegende Festung',
};
