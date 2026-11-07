import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 4 (doc 56): space, flown with the modular spacecraft (doc 54). The kit starts from zero again, so the threat is
// a fresh climb a step below map 3's (the ship is a bigger target), and the reward restarts at the map-1 formula (map 4
// pays on top, MAP_FOUR in game/map-three.ts). Wave 5 opens it with Low Orbit, m91–m96. German texts in
// i18n/missions-4-de.ts.

type Map4Theater = 'orbit';

const SEEDS: Readonly<Record<Map4Theater, readonly MissionSeed[]>> = {
  orbit: [
    { name: 'First Light', objective: patrol, pool: ['raider', 'drone', 'satgun'], briefing: 'The war has left the atmosphere. Take the ship up, fly the orbit line and learn what your modules can do.' },
    { name: 'Gun Satellites', objective: strike('satgun', 6), pool: ['satgun', 'raider', 'drone'], briefing: 'Armed satellites cover the launch corridor. Knock out 6 of them so our supply rockets can climb.' },
    { name: 'Raider Swarm', objective: intercept(26), pool: ['raider', 'drone', 'satgun'], briefing: 'Raider fighters jump our convoys out of the sun. Clear them out: 26 kills.' },
    { name: 'Corvette Screen', objective: strike('corvette', 3), pool: ['corvette', 'raider', 'satgun'], briefing: 'Three corvettes screen their orbital station. Break the screen.' },
    { name: 'Dark Orbit', objective: patrol, pool: ['raider', 'corvette', 'satgun', 'drone'], briefing: 'We swing round the night side, where they cannot see us coming either. Stay alive and keep shooting.' },
    { name: 'Halo', objective: { type: 'boss', boss: 'halo' }, pool: ['raider', 'satgun'], briefing: 'HALO, a ring-shaped battle station, holds the high ground above the planet. Take it down.' },
  ],
};

const ORDER: readonly Map4Theater[] = ['orbit'];

/** Map 4: m91–m96 so far (doc 56). */
export const MISSIONS_4: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 4,
  first: 91,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 90) : 100 + Math.round((n - 91) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 91) * 1.35),
  reward: (n) => round100(1200 + (n - 91) * 380),
}));
