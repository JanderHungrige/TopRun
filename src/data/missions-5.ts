import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 5 (doc 65): under the sea, steered with the attack subs (doc 66). The kit starts from zero again, so the threat
// is a fresh climb like map 4's and the reward restarts at the map-1 formula (map 5 pays on top, MAP_FIVE in
// game/map-three.ts). The Coral Reef (m121–m126) first. German texts in i18n/missions-5-de.ts.

type Map5Theater = 'reef';

const SEEDS: Readonly<Record<Map5Theater, readonly MissionSeed[]>> = {
  reef: [
    { name: 'Shallow Water', objective: patrol, pool: ['minisub', 'seadrone', 'seaturret'], briefing: 'The war has gone under the sea. Take the sub down over the reef, learn how she handles and keep your eyes open.' },
    { name: 'Reef Guns', objective: strike('seaturret', 5), pool: ['seaturret', 'minisub', 'jelly'], briefing: 'Turrets bolted to the coral cover the channel. Destroy 5 so our divers can pass.' },
    { name: 'Minefield', objective: intercept(24), pool: ['seamine', 'seadrone', 'minisub'], briefing: 'They have mined the reef and sent drones to guard the mines. Clear the water: 24 kills.' },
    { name: 'Eel Grounds', objective: strike('eel', 6), pool: ['eel', 'minisub', 'seaturret'], briefing: 'Something in their labs has made the eels angry, and electric. Put 6 of them down before they reach our divers.' },
    { name: 'Night Reef', objective: patrol, pool: ['minisub', 'eel', 'jelly', 'seamine'], briefing: 'The reef at night belongs to whatever glows. Stay close to the bottom and keep shooting.' },
    { name: 'Barracuda', objective: { type: 'boss', boss: 'barracuda' }, pool: ['minisub', 'seadrone'], briefing: 'BARRACUDA, their hunter-killer sub, prowls the edge of the reef. Find it and sink it.' },
  ],
};

const ORDER: readonly Map5Theater[] = ['reef'];

/** Map 5: m121– (doc 65). */
export const MISSIONS_5: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 5,
  first: 121,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 120) : 100 + Math.round((n - 121) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 121) * 1.35),
  reward: (n) => round100(1200 + (n - 121) * 380),
}));
