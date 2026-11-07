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
  fjords: { name: 'Fjordland', tagline: 'Zwischen den Wänden' },
  highlands: { name: 'Hochland-Pässe', tagline: 'Am Grat entlang' },
  delta: { name: 'Flussdelta', tagline: 'Dem Wasser nach' },
  mesa: { name: 'Tafelberge', tagline: 'Roter Fels, lange Schatten' },
  ashfall: { name: 'Ascheinsel', tagline: 'Feuer unter der Asche' },
  orbit: { name: 'Niedriger Orbit', tagline: 'Über dem Blau' },
  belt: { name: 'Asteroidengürtel', tagline: 'Felsen mit Geschützen' },
  moon: { name: 'Mondfront', tagline: 'Staub und Krater' },
  rings: { name: 'Ringriese', tagline: 'Eis in den Ringen' },
  deep: { name: 'Tiefer Raum', tagline: 'Hinter dem letzten Stern' },
  reef: { name: 'Korallenriff', tagline: 'Klares Wasser, scharfe Zähne' },
  kelp: { name: 'Kelpwald', tagline: 'Verloren im Grün' },
  wrecks: { name: 'Wrackfeld', tagline: 'Geisterschiffe' },
  trench: { name: 'Der Graben', tagline: 'Hinab ins Dunkel' },
  abyss: { name: 'Der Abgrund', tagline: 'Wo das Licht endet' },
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
  ah64: {
    specialName: 'Longbow-Salve',
    description: 'Gepanzerter Kampfhubschrauber. Eine 30-mm-Kettenkanone unter der Nase, vier Waffenstationen und das Longbow-Radar.',
  },
  tiger: {
    specialName: 'Waffenbehälter',
    description: 'Wendiger europäischer Kampfhubschrauber. Kräftige Kanone, vier Waffenstationen und Waffenbehälter, die eine Stufe Feuerkraft dazugeben.',
  },
  rah66: {
    specialName: 'Tarnmodus',
    description: 'Tarnkappen-Aufklärungshubschrauber. Der schnellste Rotor im Hangar; getarnt stellt der Feind das Feuer ein.',
  },
  starship: {
    specialName: 'Überladung',
    description: 'Ein Schiff, das mit dir wächst: Jedes Modul, das du anbringst, ändert seine Form, Hülle, Geschwindigkeit und Waffen.',
  },
  mi24: {
    specialName: 'Fliegender Panzer',
    description: 'Der fliegende Panzer. Schwere Panzerung, sechs Waffenstationen und ein paar Sekunden, in denen nichts durchkommt. Träge in der Kurve.',
  },
  u212: {
    specialName: 'Sonarstoß',
    description: 'Leises deutsches Jagd-U-Boot mit Brennstoffzellenantrieb. Vier Rohre, eine Harpunenkanone und ein Aktivsonar, das das Wasser ringsum freiräumt.',
  },
  seawolf: {
    specialName: 'Superkavitation',
    description: 'Der schnellste Jäger im Bunker. Eine harte Kanone und ein Schub in einer Blasenhülle, der durch alles hindurchrammt.',
  },
  virginia: {
    specialName: 'Schleichfahrt',
    description: 'Leises modernes Jagd-U-Boot. Auf Schleichfahrt verschwindet sie von jedem Sonar: Der Feind stellt das Feuer ein, Torpedos verlieren sie.',
  },
  akula: {
    specialName: 'Doppelhülle',
    description: 'Groß, breit und doppelt gebaut. Sechs Rohre und ein paar Sekunden, in denen nichts durchkommt. Träge in der Kurve.',
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
  hydra: { name: 'Hydra-70-Raketenbehälter', description: 'Ein Behälter ungelenkter 70-mm-Raketen, im Fächer abgefeuert. Trifft Luft- und Bodenziele.' },
  hellfire: { name: 'AGM-114 Hellfire', description: 'Lasergelenkte Panzerabwehrrakete. Findet Panzer, Bunker und Boote.' },
  stinger: { name: 'FIM-92 Stinger', description: 'Wärmesuchende Luft-Luft-Rakete für Hubschrauber. Jagt Kampfhubschrauber und Jets.' },
  spacerocket: { name: 'Weltraumrakete', description: 'Zielsuchende Raketen aus den Raketenflügeln. Sie finden alles, was sich bewegt.' },
  torpedo: { name: 'Plasmatorpedo', description: 'Langsame zielsuchende Plasmageschosse aus den Torpedoschächten, für Kriegsschiffe, Stationen und Bosse.' },
  mk48: { name: 'MK48-Torpedo', description: 'Drahtgelenkter schwerer Torpedo. Langsam, aber er findet alles im Wasser: U-Boote, Drohnen, Minen und Monster.' },
  shkval: { name: 'VA-111 Schkwal', description: 'Superkavitierende Raketentorpedos, im Fächer abgefeuert. Schnell, ungelenkt, sie treffen alles im Wasser.' },
  depthmine: { name: 'Grundmine', description: 'Sinkt unter das Boot und platzt am Meeresgrund. Eine weite Explosion gegen Geschütze und alles am Boden.' },
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
  raider: 'Raider Fighters', satgun: 'Gun Satellites', corvette: 'Corvettes', interceptor: 'Interceptors', gunship: 'Gunships',
  battery: 'Lunar Batteries', warden: 'Battlecruisers',
  minisub: 'Midget Subs', seadrone: 'Sea Drones', seamine: 'Sea Mines', seaturret: 'Seabed Turrets', jelly: 'Jellyfish', eel: 'Electric Eels',
  hunter: 'Hunter Subs', torpboat: 'Torpedo Boats', squid: 'Squid', crab: 'Giant Crabs', sealab: 'Sea Labs', angler: 'Anglerfish', boomer: 'Missile Subs',
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
  raider: ['Raider-Jäger', 'Raider-Jäger'],
  satgun: ['Geschützsatellit', 'Geschützsatelliten'],
  corvette: ['Korvette', 'Korvetten'],
  interceptor: ['Abfangjäger', 'Abfangjäger'],
  gunship: ['Kanonenboot', 'Kanonenboote'],
  battery: ['Mondbatterie', 'Mondbatterien'],
  warden: ['Schlachtkreuzer', 'Schlachtkreuzer'],
  minisub: ['Kleinst-U-Boot', 'Kleinst-U-Boote'],
  seadrone: ['Seedrohne', 'Seedrohnen'],
  seamine: ['Seemine', 'Seeminen'],
  seaturret: ['Meeresboden-Geschütz', 'Meeresboden-Geschütze'],
  jelly: ['Qualle', 'Quallen'],
  eel: ['Zitteraal', 'Zitteraale'],
  hunter: ['Jagd-U-Boot', 'Jagd-U-Boote'],
  torpboat: ['Torpedoboot', 'Torpedoboote'],
  squid: ['Kalmar', 'Kalmare'],
  crab: ['Riesenkrabbe', 'Riesenkrabben'],
  sealab: ['Unterwasserlabor', 'Unterwasserlabore'],
  angler: ['Anglerfisch', 'Anglerfische'],
  boomer: ['Raketen-U-Boot', 'Raketen-U-Boote'],
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
  glacier: 'Gepanzerter Eisbrecher',
  citadel: 'Bergfestung',
  caiman: 'Flussmonitor',
  mammoth: 'Superschwerer Panzer',
  behemoth: 'Tandemrotor-Kampfhubschrauber',
  halo: 'Ring-Kampfstation',
  quarry: 'Asteroidenfestung',
  crater: 'Mondzitadelle',
  trident: 'Dreirumpf-Schlachtschiff',
  ark: 'Mutterschiff',
  barracuda: 'Jagd-U-Boot',
  medusa: 'Quallenkönigin',
  bastion: 'Meeresgrundfestung',
  goliath: 'Riesenkalmar',
  jormungand: 'Seeschlange',
};
