import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 6 (doc 78): the jungle planet, walked by the mechs (doc 79). The kit starts from zero again, so the threat is a
// fresh climb, and the reward restarts at the map-1 formula (map 6 pays on top, MAP_SIX in game/map-three.ts). Five
// theaters, m151–m180. German texts in i18n/missions-6-de.ts. The alien creatures and plants of doc 96 join the pools of
// their theaters.

type Map6Theater = 'landing' | 'canopy' | 'swamp' | 'ruins' | 'hive';

const SEEDS: Readonly<Record<Map6Theater, readonly MissionSeed[]>> = {
  landing: [
    { name: 'Boots on the Ground', objective: patrol, pool: ['walker', 'raptor', 'gundrone', 'hovertank', 'sporepod'], briefing: 'The dropships are down. Walk the perimeter of the landing zone and learn how your mech moves on this world.' },
    { name: 'Gun Nests', objective: strike('artillery', 5), pool: ['artillery', 'walker', 'raptor'], briefing: 'Enemy artillery is shelling the landing zone. Walk in and knock out 5 guns.' },
    { name: 'Raptor Pack', objective: intercept(24), pool: ['raptor', 'gundrone', 'walker', 'hovertank', 'dragonfly', 'leatherwing'], briefing: 'Packs of raptors hunt around the clearing. Keep them off the engineers: 24 kills.' },
    { name: 'Tank Trap', objective: strike('hovertank', 4), pool: ['hovertank', 'walker', 'gundrone', 'rhino'], briefing: 'Hover tanks race along the riverbank toward our base. Stop 4 of them.' },
    { name: 'Night Perimeter', objective: patrol, pool: ['walker', 'raptor', 'spitter', 'gundrone', 'rhino', 'leatherwing', 'sporepod'], briefing: 'The jungle wakes up at night. Hold the perimeter until dawn.' },
    { name: 'Ravager', objective: { type: 'boss', boss: 'ravager' }, pool: ['walker', 'gundrone', 'hovertank'], briefing: 'RAVAGER, a giant assault walker, is marching on the landing zone. Stop it before it reaches the base.' },
  ],
  canopy: [
    { name: 'Green Roof', objective: patrol, pool: ['raptor', 'wasp', 'walker', 'lasher', 'glider'], briefing: 'Under the canopy it is dark and loud. Push into the rainforest and stay alive.' },
    { name: 'Spitter Grove', objective: strike('spitter', 6), pool: ['spitter', 'raptor', 'wasp', 'lasher', 'sporepod'], briefing: 'Carnivorous spitter plants have grown over the trail. Clear a way through: 6 of them.' },
    { name: 'Wasp Storm', objective: intercept(28), pool: ['wasp', 'gundrone', 'raptor', 'leatherwing', 'glider'], briefing: 'Giant wasps swarm out of the trees. 28 kills.' },
    { name: 'Walker Patrol', objective: strike('walker', 8), pool: ['walker', 'hovertank', 'wasp'], briefing: 'Enemy walkers patrol the jungle trails. Bring down 8.' },
    { name: 'Deep Green', objective: patrol, pool: ['spitter', 'walker', 'beetle', 'wasp', 'lasher', 'balloon', 'glider'], briefing: 'We go deeper than any patrol before. Everything here wants to eat you.' },
    { name: 'Mantis', objective: { type: 'boss', boss: 'mantis' }, pool: ['wasp', 'raptor'], briefing: 'MANTIS, a bio-machine as tall as the trees, rules the canopy. Cut it down.' },
  ],
  swamp: [
    { name: 'Knee Deep', objective: patrol, pool: ['beetle', 'raptor', 'gundrone', 'toad', 'dragonfly'], briefing: 'The swamp slows everything down, us too. Wade through and keep your guns hot.' },
    { name: 'Beetle Bog', objective: strike('beetle', 6), pool: ['beetle', 'spitter', 'raptor', 'toad', 'lurker'], briefing: 'Armoured beetles nest in the mud. Crack 6 shells.' },
    { name: 'Drone Mist', objective: intercept(30), pool: ['gundrone', 'wasp', 'dropship', 'dragonfly', 'skyjelly'], briefing: 'Gun drones hide in the swamp mist. 30 kills.' },
    { name: 'Dropship Hunt', objective: strike('dropship', 4), pool: ['dropship', 'gundrone', 'hovertank'], briefing: 'Their dropships ferry walkers across the swamp. Shoot down 4.' },
    { name: 'Black Water', objective: patrol, pool: ['beetle', 'hovertank', 'spitter', 'wasp', 'lurker', 'toad', 'skyjelly'], briefing: 'Black water, no bottom, and something big moving underneath.' },
    { name: 'Basilisk', objective: { type: 'boss', boss: 'basilisk' }, pool: ['beetle', 'gundrone'], briefing: 'BASILISK, an armoured swamp beast, guards the way north. Put it down.' },
  ],
  ruins: [
    { name: 'Old Stones', objective: patrol, pool: ['walker', 'artillery', 'wasp', 'totem', 'glider'], briefing: 'The ruins of an ancient city lie in the jungle, and the enemy has dug in among them.' },
    { name: 'Temple Guns', objective: strike('artillery', 7), pool: ['artillery', 'walker', 'beetle', 'totem', 'rhino'], briefing: 'Artillery hides in the temple courtyards. Silence 7 guns.' },
    { name: 'Sky Raiders', objective: intercept(32), pool: ['dropship', 'gundrone', 'wasp', 'glider', 'leatherwing'], briefing: 'Their air wing rises from the ruins. 32 kills.' },
    { name: 'Armour Column', objective: strike('hovertank', 6), pool: ['hovertank', 'walker', 'artillery'], briefing: 'An armoured column rolls along the old stone road. Stop 6 hover tanks.' },
    { name: 'Sacred Ground', objective: patrol, pool: ['walker', 'spitter', 'artillery', 'raptor', 'wasp', 'totem', 'rhino', 'glider'], briefing: 'The heart of the ruins. Every stone hides a gun.' },
    { name: 'Sentinel', objective: { type: 'boss', boss: 'sentinel' }, pool: ['walker', 'gundrone'], briefing: 'SENTINEL, a stone guardian machine older than the city, has woken up. Stop it.' },
  ],
  hive: [
    { name: 'The Nest', objective: patrol, pool: ['wasp', 'raptor', 'beetle', 'spire', 'sporepod'], briefing: 'The hive is alive. Walk in, and whatever crawls out, shoot it.' },
    { name: 'Brood Chambers', objective: strike('spitter', 8), pool: ['spitter', 'beetle', 'wasp', 'spire', 'balloon'], briefing: 'The hive grows new guards in its chambers. Destroy 8 spitters.' },
    { name: 'Swarm', objective: intercept(40), pool: ['wasp', 'gundrone', 'raptor', 'skyjelly', 'balloon', 'leatherwing'], briefing: 'Everything with wings comes at once. 40 kills.' },
    { name: 'Queen\'s Guard', objective: strike('walker', 10), pool: ['walker', 'beetle', 'dropship'], briefing: 'Their last walkers guard the queen\'s chamber. Bring down 10.' },
    { name: 'Heart of the Hive', objective: patrol, pool: ['beetle', 'walker', 'spitter', 'wasp', 'hovertank', 'spire', 'sporepod', 'skyjelly'], briefing: 'The queen is close. Everything the hive has left stands in the way.' },
    { name: 'Hive Queen', objective: { type: 'boss', boss: 'queen' }, pool: ['wasp', 'raptor'], briefing: 'The HIVE QUEEN is waking up. End the war on this planet for good.' },
  ],
};

const ORDER: readonly Map6Theater[] = ['landing', 'canopy', 'swamp', 'ruins', 'hive'];

/** Map 6: m151–m180 (doc 78). */
export const MISSIONS_6: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 6,
  first: 151,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 150) : 100 + Math.round((n - 151) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 151) * 1.35),
  reward: (n) => round100(1200 + (n - 151) * 380),
}));
