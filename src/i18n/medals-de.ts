import type { MedalId } from '../data/medals';

/** German medal names and citations (doc 24); English lives in src/data/medals.ts. */
export const MEDALS_DE: Readonly<Record<MedalId, { name: string; citation: string }>> = {
  pacific: { name: 'Pazifik-Feldzugsband', citation: 'Für die Versenkung des Schlachtschiffs IRONCLAD und die Befreiung des pazifischen Übungsgebiets.' },
  gulf: { name: 'Golf-Feldzugsband', citation: 'Für die Zerstörung der Festung SANDSTORM am Persischen Golf.' },
  arctic: { name: 'Arktis-Feldzugsband', citation: 'Für das Abfangen des Bombers BLACKJACK über dem Arktischen Schild.' },
  canyon: { name: 'Canyon-Feldzugsband', citation: 'Für den Abschuss des Nurflüglers TYPHOON über dem Roten Canyon.' },
  leviathan: { name: 'Leviathan-Feldzugsband', citation: 'Für die Versenkung des Superträgers LEVIATHAN und das Ende des Krieges auf See.' },
  victory: { name: 'Siegesmedaille', citation: 'Für alle dreißig Einsätze des Feldzugs bis zum Sieg.' },
  allstars: { name: 'Goldener Stern', citation: 'Für drei Sterne in jedem einzelnen Einsatz des Feldzugs. Makellos.' },
  ace: { name: 'Ass-Schwingen', citation: 'Für fünfzig im Kampf zerstörte Gegner.' },
  topace: { name: 'Top-Ass', citation: 'Für zweihundertfünfzig zerstörte Gegner. Die Besten der Besten.' },
  giant: { name: 'Riesenbezwinger', citation: 'Für die Zerstörung von drei feindlichen Großzielen.' },
  untouchable: { name: 'Unantastbar', citation: 'Für einen Einsatz ohne einen einzigen Kratzer am Flugzeug.' },
  gunslinger: { name: 'Revolverheld', citation: 'Für einen gewonnenen Einsatz nur mit der Bordkanone. Keine Raketen, keine Bomben.' },
  catapult: { name: 'Katapult-Stern', citation: 'Für fünf perfekte Katapultstarts hintereinander.' },
  offduty5: { name: 'Dienstfrei-Stern', citation: 'Für Gold in fünf verschiedenen Freizeit-Herausforderungen auf der Basis.' },
  offduty10: { name: 'Legende der Basis', citation: 'Für Gold in jeder Freizeit-Herausforderung. Die ganze Basis kennt deinen Namen.' },
  sorties25: { name: 'Einsatznadel', citation: 'Für fünfundzwanzig geflogene Einsätze.' },
  sorties100: { name: 'Eiserner Pilot', citation: 'Für hundert geflogene Einsätze. Immer bereit.' },
  triple: { name: 'Dreifache Bedrohung', citation: 'Für Einsätze in allen drei Jets der Staffel.' },
};
