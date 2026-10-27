import { buildCampaign, intercept, patrol, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 2 (doc 35): missions m31–m60 in five new theaters, clearly harder (difficulty 31–60). German texts in
// i18n/missions-2-de.ts.

type Map2Theater = 'northsea' | 'himalaya' | 'jungle' | 'nightfall' | 'thunderhead';

const SEEDS: Readonly<Record<Map2Theater, readonly MissionSeed[]>> = {
  northsea: [
    { name: 'Rig Patrol', objective: patrol, pool: ['fulcrum', 'flanker', 'boat', 'aa'], briefing: 'New front, and the training wheels are off. The enemy has dug in on the North Sea oil rigs. Fly the patrol line and see what they have.' },
    { name: 'Platform Guns', objective: strike('aa', 6), pool: ['flanker', 'aa', 'boat', 'fulcrum'], briefing: 'Every rig bristles with flak. Silence 6 AA batteries so our strike packages can get in.' },
    { name: 'Storm Riders', objective: intercept(30), pool: ['flanker', 'fulcrum', 'bear', 'drone'], briefing: 'Flankers are using the storm as cover. Hunt them down: 30 kills.' },
    { name: 'Wolfpack', objective: strike('destroyer', 3), pool: ['destroyer', 'boat', 'flanker', 'hind'], briefing: 'A destroyer group is escorting supply ships to the rigs. Sink 3 destroyers.' },
    { name: 'Radar Picket', objective: strike('radar', 5), pool: ['radar', 'sam', 'aa', 'flanker', 'boat'], briefing: 'Radar posts on the outer rigs see every move we make. Blind them: 5 radar stations.' },
    { name: 'Kraken', objective: { type: 'boss', boss: 'kraken' }, pool: ['flanker', 'boat', 'destroyer'], briefing: 'KRAKEN, a sea fortress of armoured platforms, is the heart of the North Sea front. Tear it apart.' },
  ],
  himalaya: [
    { name: 'Thin Air', objective: patrol, pool: ['flanker', 'fulcrum', 'aa', 'tank'], briefing: 'Welcome to the roof of the world: thin air, tight valleys and a lot of guns. Fly the high pass.' },
    { name: 'Mountain SAMs', objective: strike('sam', 6), pool: ['sam', 'aa', 'flanker', 'hind'], briefing: 'SAM nests are hidden in the ridgelines. Knock out 6 of them.' },
    { name: 'Valley Convoy', objective: strike('tank', 8), pool: ['tank', 'aa', 'hind', 'fulcrum'], briefing: 'Armour is crawling up the valley road towards the pass. Stop 8 tanks.' },
    { name: "Eagle's Nest", objective: strike('radar', 5), pool: ['radar', 'sam', 'flanker', 'aa'], briefing: 'An early-warning chain sits on the peaks. Take down 5 radar stations.' },
    { name: 'Snow Blind', objective: intercept(34), pool: ['flanker', 'fulcrum', 'bear', 'hind'], briefing: 'Their best squadrons are up above the clouds. Shoot down 34.' },
    { name: 'Condor', objective: { type: 'boss', boss: 'condor' }, pool: ['flanker', 'fulcrum', 'hind'], briefing: 'The CONDOR gunship circles the pass and fires on everything that moves. Bring the giant down.' },
  ],
  jungle: [
    { name: 'Under the Canopy', objective: patrol, pool: ['hind', 'fulcrum', 'aa', 'tank'], briefing: 'Green Hell, they call it. Gunships hide under the canopy. Fly low and keep your eyes open.' },
    { name: 'River Depots', objective: strike('depot', 6), pool: ['depot', 'aa', 'hind', 'tank'], briefing: 'Fuel and ammunition are stockpiled along the river. Burn 6 depots.' },
    { name: 'Gunship Hunt', objective: intercept(36), pool: ['hind', 'flanker', 'drone', 'fulcrum'], briefing: 'Swarms of gunships and drones rule the jungle sky. Clear it: 36 kills.' },
    { name: 'Hidden Batteries', objective: strike('aa', 8), pool: ['aa', 'sam', 'hind', 'tank'], briefing: 'Flak batteries are dug in under the trees. Destroy 8 of them.' },
    { name: 'Supply Road', objective: strike('tank', 10), pool: ['tank', 'aa', 'sam', 'hind'], briefing: 'A tank column is pushing down the jungle road. Stop 10 of them.' },
    { name: 'Python', objective: { type: 'boss', boss: 'python' }, pool: ['hind', 'tank', 'aa'], briefing: 'The PYTHON armoured train hauls their heavy guns through the jungle. Derail it for good.' },
  ],
  nightfall: [
    { name: 'Into the Dark', objective: patrol, pool: ['flanker', 'fulcrum', 'aa', 'sam'], briefing: 'Night falls over the desert. Their radar sees in the dark, so make sure you do too. Fly the night patrol.' },
    { name: 'Moonlit SAMs', objective: strike('sam', 8), pool: ['sam', 'aa', 'flanker', 'tank'], briefing: 'A SAM belt guards the dunes. Take out 8 launchers before dawn.' },
    { name: 'Night Fighters', objective: intercept(40), pool: ['flanker', 'fulcrum', 'bear', 'drone'], briefing: 'Night fighters are hunting our tankers. Splash 40.' },
    { name: 'Fuel Farm', objective: strike('depot', 8), pool: ['depot', 'aa', 'sam', 'tank'], briefing: 'The fuel farm keeps their crawlers rolling. Burn 8 depots.' },
    { name: 'Desert Fox', objective: strike('tank', 12), pool: ['tank', 'sam', 'aa', 'hind'], briefing: 'An armoured spearhead is racing through the night. Stop 12 tanks.' },
    { name: 'Scorpion', objective: { type: 'boss', boss: 'scorpion' }, pool: ['tank', 'flanker', 'sam'], briefing: 'The SCORPION missile crawler is rolling for the coast. Crush it before it reaches launch range.' },
  ],
  thunderhead: [
    { name: 'Gathering Storm', objective: patrol, pool: ['flanker', 'fulcrum', 'boat', 'destroyer'], briefing: 'This is it: Operation Thunderhead. Their last stronghold hides under the storm. Fly the approach.' },
    { name: 'Iron Wall', objective: strike('destroyer', 4), pool: ['destroyer', 'boat', 'flanker', 'aa'], briefing: 'A wall of destroyers guards the storm front. Sink 4.' },
    { name: 'Lightning Strike', objective: strike('radar', 6), pool: ['radar', 'sam', 'aa', 'flanker', 'boat'], briefing: 'Their command radar ties the whole defence together. Cut it: 6 radar stations.' },
    { name: 'Thunder Run', objective: intercept(44), pool: ['flanker', 'fulcrum', 'bear', 'drone'], briefing: 'Everything they have left is in the air. Shoot down 44.' },
    { name: 'Last Ring', objective: strike('sam', 10), pool: ['sam', 'aa', 'destroyer', 'flanker'], briefing: 'The last SAM ring shields the fortress. Destroy 10 launchers.' },
    { name: 'Colossus', objective: { type: 'boss', boss: 'colossus' }, pool: ['flanker', 'fulcrum', 'drone'], briefing: 'COLOSSUS, their flying fortress, leads what is left of the enemy fleet. Bring it down and end this war for good.' },
  ],
};

const ORDER: readonly Map2Theater[] = ['northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead'];

/** Map 2: m31–m60. */
export const MISSIONS_2: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 2,
  first: 31,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 45 + n : 105 + Math.round((n - 31) * 1.2)),
}));
