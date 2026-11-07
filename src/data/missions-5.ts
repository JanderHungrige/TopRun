import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 5 (docs 56, 74): space, flown with the modular spacecraft (doc 54), the last world. The kit starts from zero
// again, so the threat is a fresh climb (the ship is a bigger target), and the reward restarts at the map-1 formula
// (map 5 pays on top, MAP_FIVE in game/map-three.ts). Five theaters, m121–m150 (docs 58, 74). German texts in
// i18n/missions-5-de.ts.

type Map5Theater = 'orbit' | 'belt' | 'moon' | 'rings' | 'deep';

const SEEDS: Readonly<Record<Map5Theater, readonly MissionSeed[]>> = {
  orbit: [
    { name: 'First Light', objective: patrol, pool: ['raider', 'drone', 'satgun'], briefing: 'The war has left the atmosphere. Take the ship up, fly the orbit line and learn what your modules can do.' },
    { name: 'Gun Satellites', objective: strike('satgun', 6), pool: ['satgun', 'raider', 'drone'], briefing: 'Armed satellites cover the launch corridor. Knock out 6 of them so our supply rockets can climb.' },
    { name: 'Raider Swarm', objective: intercept(26), pool: ['raider', 'drone', 'satgun'], briefing: 'Raider fighters jump our convoys out of the sun. Clear them out: 26 kills.' },
    { name: 'Corvette Screen', objective: strike('corvette', 3), pool: ['corvette', 'raider', 'satgun'], briefing: 'Three corvettes screen their orbital station. Break the screen.' },
    { name: 'Dark Orbit', objective: patrol, pool: ['raider', 'corvette', 'satgun', 'drone'], briefing: 'We swing round the night side, where they cannot see us coming either. Stay alive and keep shooting.' },
    { name: 'Halo', objective: { type: 'boss', boss: 'halo' }, pool: ['raider', 'satgun'], briefing: 'HALO, a ring-shaped battle station, holds the high ground above the planet. Take it down.' },
  ],
  belt: [
    { name: 'Rock Field', objective: patrol, pool: ['raider', 'interceptor', 'satgun'], briefing: 'The belt is full of rocks, and of guns hiding behind them. Fly through and stay sharp.' },
    { name: 'Prospectors', objective: strike('gunship', 4), pool: ['gunship', 'raider', 'satgun'], briefing: 'Armed mining gunships strip the belt for their war. Stop 4 of them.' },
    { name: 'Interceptor Nest', objective: intercept(30), pool: ['interceptor', 'raider', 'drone'], briefing: 'A new interceptor wing is based out here. 30 kills will empty the nest.' },
    { name: 'Ore Convoy', objective: strike('corvette', 4), pool: ['corvette', 'gunship', 'raider'], briefing: 'Corvettes escort the ore convoy home. Sink 4 of them.' },
    { name: 'Hollow Rocks', objective: patrol, pool: ['satgun', 'gunship', 'interceptor', 'raider'], briefing: 'They have dug guns into the asteroids themselves. Expect fire from every side.' },
    { name: 'Quarry', objective: { type: 'boss', boss: 'quarry' }, pool: ['raider', 'interceptor'], briefing: 'QUARRY, a fortress carved out of an asteroid, guards the belt. Crack it open.' },
  ],
  moon: [
    { name: 'Dust Line', objective: patrol, pool: ['battery', 'raider', 'interceptor'], briefing: 'The war has reached the moon. Batteries in the craters fire at anything overhead.' },
    { name: 'Crater Guns', objective: strike('battery', 6), pool: ['battery', 'raider', 'drone'], briefing: 'Six lunar batteries cover the landing zone. Silence them.' },
    { name: 'Moonrise', objective: intercept(32), pool: ['interceptor', 'raider', 'drone'], briefing: 'Their fighters rise from the far side. 32 kills.' },
    { name: 'Supply Line', objective: strike('gunship', 5), pool: ['gunship', 'battery', 'interceptor'], briefing: 'Gunships carry supplies between the lunar bases. Take out 5.' },
    { name: 'Far Side', objective: patrol, pool: ['battery', 'gunship', 'interceptor', 'raider'], briefing: 'We go round to the far side, where no one of ours has flown yet.' },
    { name: 'Crater', objective: { type: 'boss', boss: 'crater' }, pool: ['battery', 'interceptor'], briefing: 'CRATER, a citadel dug into the biggest crater on the moon, runs their war up here. End it.' },
  ],
  rings: [
    { name: 'Ice Rings', objective: patrol, pool: ['interceptor', 'raider', 'satgun'], briefing: 'The giant\'s rings are ice and rock, and enemy patrols weave through them.' },
    { name: 'Ring Stations', objective: strike('satgun', 10), pool: ['satgun', 'gunship', 'interceptor'], briefing: 'Ten gun satellites sit in the rings. Clear them.' },
    { name: 'Storm Band', objective: intercept(36), pool: ['interceptor', 'raider', 'drone'], briefing: 'Fighters hide in the planet\'s storm bands. 36 kills.' },
    { name: 'Heavy Escort', objective: strike('corvette', 6), pool: ['corvette', 'gunship', 'interceptor'], briefing: 'A fleet is forming in the rings. Six corvettes first.' },
    { name: 'Ring Shadow', objective: patrol, pool: ['gunship', 'corvette', 'interceptor', 'satgun'], briefing: 'We fly in the planet\'s shadow. Cold, dark and full of enemies.' },
    { name: 'Trident', objective: { type: 'boss', boss: 'trident' }, pool: ['interceptor', 'raider'], briefing: 'TRIDENT, a three-hulled dreadnought, leads their fleet. Sink it.' },
  ],
  deep: [
    { name: 'Past the Last Light', objective: patrol, pool: ['interceptor', 'raider', 'gunship'], briefing: 'Out here there is nothing but their last fleet. Go and find it.' },
    { name: 'Picket Line', objective: strike('corvette', 7), pool: ['corvette', 'interceptor', 'satgun'], briefing: 'A picket line of corvettes watches the way in. Sink 7.' },
    { name: 'Dark Swarm', objective: intercept(40), pool: ['interceptor', 'raider', 'drone'], briefing: 'Every fighter they have left is out here. 40 kills.' },
    { name: 'Fleet Yards', objective: strike('gunship', 8), pool: ['gunship', 'corvette', 'interceptor'], briefing: 'The fleet yards build their gunships. Destroy 8.' },
    { name: 'Final Approach', objective: patrol, pool: ['gunship', 'corvette', 'interceptor', 'raider', 'satgun'], briefing: 'The mothership is close. Everything they have left stands in the way.' },
    { name: 'Ark', objective: { type: 'boss', boss: 'ark' }, pool: ['interceptor', 'raider'], briefing: 'ARK, their mothership, has come for the planet. This is the last fight. Bring it down.' },
  ],
};

const ORDER: readonly Map5Theater[] = ['orbit', 'belt', 'moon', 'rings', 'deep'];

/** Map 5: m121–m150 (docs 56, 58, 74). */
export const MISSIONS_5: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 5,
  first: 121,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 120) : 100 + Math.round((n - 121) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 121) * 1.35),
  reward: (n) => round100(1200 + (n - 121) * 380),
}));
