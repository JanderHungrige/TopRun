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
    levelText: [
      '+20 % Panzerung', '+40 % Panzerung', '+60 % Panzerung', '+80 % Panzerung', '+100 % Panzerung', '+125 % Panzerung', '+150 % Panzerung',
      '+175 % Panzerung', '+200 % Panzerung', '+225 % Panzerung', '+250 % Panzerung', '+275 % Panzerung', '+300 % Panzerung', '+325 % Panzerung',
    ],
  },
  engine: {
    name: 'Triebwerkstuning', description: 'Getunte Turbinen und ein heißerer Nachbrenner.',
    levelText: ['+8 % Tempo', '+16 % Tempo', '+24 % Tempo', '+30 % Tempo', '+36 % Tempo', '+40 % Tempo', '+44 % Tempo', '+48 % Tempo', '+52 % Tempo', '+56 % Tempo'],
  },
  flares: {
    name: 'Täuschkörperwerfer', description: 'Täuschkörper lenken feindliche Raketen ab. Taste F.',
    levelText: [
      '2 Täuschkörper', '4 Täuschkörper', '6 Täuschkörper', '8 Täuschkörper', '10 Täuschkörper', '12 Täuschkörper', '14 Täuschkörper',
      '16 Täuschkörper', '18 Täuschkörper', '20 Täuschkörper', '22 Täuschkörper', '24 Täuschkörper', '26 Täuschkörper', '28 Täuschkörper',
    ],
  },
  ecm: {
    name: 'ECM-Störbehälter', description: 'Stört die feindliche Feuerleitung: feindliche Kugeln machen weniger Schaden, feindliche Raketen drehen langsamer.',
    levelText: [
      '−25 % Kugelschaden, Raketen drehen 30 % langsamer', '−35 % Kugelschaden, Raketen drehen 40 % langsamer', '−45 % Kugelschaden, Raketen drehen 50 % langsamer',
      '−50 % Kugelschaden, Raketen drehen 55 % langsamer', '−55 % Kugelschaden, Raketen drehen 60 % langsamer', '−60 % Kugelschaden, Raketen drehen 65 % langsamer',
    ],
  },
  damageControl: {
    name: 'Schadenskontrolle', description: 'Unter 25 % Panzerung wird ein Teil wiederhergestellt: einmal pro Mission, auf der höchsten Stufe dreimal.',
    levelText: [
      'Einmal pro Mission +40 % Panzerung', 'Einmal pro Mission +60 % Panzerung', 'Zweimal pro Mission +60 % Panzerung',
      'Zweimal pro Mission +70 % Panzerung', 'Zweimal pro Mission +80 % Panzerung', 'Dreimal pro Mission +80 % Panzerung',
    ],
  },
  magnet: {
    name: 'Frachtmagnet', description: 'Aufsammelbares fliegt dir aus viel größerer Entfernung zu.',
    levelText: ['Aufsammeln ab 160 px', 'Aufsammeln ab 280 px, schneller herangezogen', 'Aufsammeln ab 400 px, schneller herangezogen', 'Aufsammeln ab 520 px, am schnellsten herangezogen'],
  },
  radar: {
    name: 'Frühwarnradar', description: 'Größere Radarreichweite: Banditen erscheinen auf dem Schirm, bevor sie da sind.',
    levelText: [
      'Banditen 4 s früher auf dem Radar', 'Banditen 7 s früher auf dem Radar, Reichweite 1.400 px, zeigt Tarnkappenjäger',
      'Banditen 10 s früher auf dem Radar, Reichweite 1.700 px', 'Banditen 13 s früher auf dem Radar, Reichweite 2.000 px, funktioniert trotz Störung',
    ],
  },
};

type Forms = readonly [singular: string, plural: string];

export const ENEMIES_EN_PLURAL: Readonly<Record<EnemyKind, string>> = {
  drone: 'Attack Drones', fishbed: 'MiG-21 Fishbeds', fulcrum: 'MiG-29 Fulcrums', flanker: 'Su-27 Flankers',
  hind: 'Mi-24 Hinds', bear: 'Tu-95 Bears', aa: 'AA Guns', sam: 'SAM Sites', tank: 'Battle Tanks',
  radar: 'Radar Stations', depot: 'Fuel Depots', boat: 'Patrol Boats', destroyer: 'Destroyers',
  shilka: 'ZSU-23-4 Shilkas', bunker: 'Hardened Bunkers', foxbat: 'MiG-25 Foxbats', jammer: 'Il-22 Jammers',
  frigate: 'Missile Frigates', felon: 'Su-57 Felons', backfire: 'Tu-22M Backfires', fortress: 'AA Fortresses', cruiser: 'Missile Cruisers',
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
  shilka: ['Schilka-Flakpanzer', 'Schilka-Flakpanzer'],
  bunker: ['Betonbunker', 'Betonbunker'],
  foxbat: ['MiG-25 Foxbat', 'MiG-25 Foxbats'],
  jammer: ['Il-22-Störflugzeug', 'Il-22-Störflugzeuge'],
  frigate: ['Raketenfregatte', 'Raketenfregatten'],
  felon: ['Su-57 Felon', 'Su-57 Felons'],
  backfire: ['Tu-22M Backfire', 'Tu-22M Backfires'],
  fortress: ['Flakfestung', 'Flakfestungen'],
  cruiser: ['Raketenkreuzer', 'Raketenkreuzer'],
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
