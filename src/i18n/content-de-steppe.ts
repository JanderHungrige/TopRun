import type { BOSSES_7 } from '../data/bosses-7';
import type { ENEMIES_7 } from '../data/enemies-7';
import type { THEATERS_7 } from '../data/theaters-7';
import type { TankId } from '../data/types';

// The alien steppe's names in German (docs 102–105), and the enemies' English plurals: spread into the tables of
// content-de.ts. Same order as the data files.

type Forms = readonly [singular: string, plural: string];

export const STEPPE_THEATERS_DE: Readonly<Record<keyof typeof THEATERS_7, { name: string; tagline: string }>> = {
  grass: { name: 'Grasmeer', tagline: 'Wogen aus Gold' },
  saltflats: { name: 'Salzpfannen', tagline: 'Weiß und blendend' },
  badlands: { name: 'Rote Ödnis', tagline: 'Tafelberge und Schluchten' },
  barrows: { name: 'Hügelgräberfeld', tagline: 'Staub über den alten Hügeln' },
  impact: { name: 'Der Krater', tagline: 'Wo sie herunterkamen' },
};

export const STEPPE_PLANES_DE: Readonly<Record<TankId, { specialName: string; description: string }>> = {
  jackal: { specialName: 'Nitro', description: 'Offener Kampfbuggy mit Überrollbügel und Lafettenkanone. Schnell, leicht, und ein Nitrostoß rammt alles Kleine aus dem Weg.' },
  lynx: { specialName: 'Wachgeschütz', description: 'Leichter Panzer auf breiten Ketten. Sein Turm folgt dem Ziel, und das Wachgeschütz bleibt feuernd zurück.' },
  viper: { specialName: 'Raketensalve', description: 'Langer Buggy mit einem Raketenwerfer über der Hinterachse. Die Salve findet jedes Ziel in Sicht.' },
  bison: { specialName: 'Hauptgeschütz', description: 'Schwerer Panzer, langsam und kaum aufzuhalten. Sein Turm folgt dem Ziel, und das Hauptgeschütz feuert eine Granate, die einen Dreibeiner knackt.' },
};

export const STEPPE_SECONDARIES_DE: Readonly<Record<'grenade' | 'aarocket' | 'atgm' | 'mines' | 'flamer' | 'tesla', { name: string; description: string }>> = {
  grenade: { name: 'Granatwerfer', description: 'Wirft eine Granate nach vorn, die am Boden zerplatzt. Gut gegen Kolonnen, Krabbler und Landekapseln.' },
  aarocket: { name: 'Flugabwehrraketen', description: 'Zielsuchende Raketen, die alles jagen, was fliegt: Scheiben, Rochen, Drohnen.' },
  atgm: { name: 'Panzerabwehrrakete', description: 'Eine gelenkte Rakete, die das nächste Ziel am Boden findet. Knackt Dreibeine und Belagerungskäfer.' },
  mines: { name: 'Minenleger', description: 'Legt eine Mine, wo du gerade bist. Sie zündet, wenn etwas am Boden nahe kommt: leg sie auf die Pfade.' },
  flamer: { name: 'Flammenwerfer', description: 'Ein Feuerkegel nach vorn, der alles darin verbrennt. Läuft mit Treibstoff, den der Motor nachfüllt.' },
  tesla: { name: 'Teslaspule', description: 'Ein Blitz auf den nächsten Gegner voraus, der auf drei weitere in der Nähe überspringt. Lädt sich wieder auf.' },
};

export const STEPPE_ENEMIES_EN_PLURAL: Readonly<Record<keyof typeof ENEMIES_7, string>> = {
  crawler: 'Crawlers', trooper: 'Alien Troopers', rider: 'Beast Riders', landingpod: 'Landing Pods', scoutdisc: 'Scout Discs',
  discfighter: 'Disc Fighters', tripod: 'Tripods', siegebug: 'Siege Crawlers', shieldbearer: 'Shield Bearers',
  broodcarrier: 'Brood Carriers', plasmagun: 'Plasma Cannons', manta: 'Bomber Mantas', wartripod: 'War Tripods',
};

export const STEPPE_ENEMIES_DE: Readonly<Record<keyof typeof ENEMIES_7, Forms>> = {
  crawler: ['Krabbler', 'Krabbler'], trooper: ['Alien-Soldat', 'Alien-Soldaten'], rider: ['Bestienreiter', 'Bestienreiter'],
  landingpod: ['Landekapsel', 'Landekapseln'], scoutdisc: ['Späherscheibe', 'Späherscheiben'],
  discfighter: ['Diskusjäger', 'Diskusjäger'], tripod: ['Dreibein', 'Dreibeine'], siegebug: ['Belagerungskäfer', 'Belagerungskäfer'],
  shieldbearer: ['Schildträger', 'Schildträger'], broodcarrier: ['Brutträger', 'Brutträger'],
  plasmagun: ['Plasmageschütz', 'Plasmageschütze'], manta: ['Bombenrochen', 'Bombenrochen'], wartripod: ['Kriegsdreibein', 'Kriegsdreibeine'],
};

export const STEPPE_BOSSES_DE: Readonly<Record<keyof typeof BOSSES_7, string>> = {
  harvester: 'Mähmaschine', longshanks: 'Riesen-Dreibein', juggernaut: 'Belagerungsbestie', dreadnought: 'Belagerungsschiff',
  mothership: 'Herz der Invasion',
};
