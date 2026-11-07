import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 5 (doc 65): under the sea, steered with the attack subs (doc 66). The kit starts from zero again, so the threat
// is a fresh climb like map 4's and the reward restarts at the map-1 formula (map 5 pays on top, MAP_FIVE in
// game/map-three.ts). Five theaters, m121–m150 (docs 65, 70). German texts in i18n/missions-5-de.ts.

type Map5Theater = 'reef' | 'kelp' | 'wrecks' | 'trench' | 'abyss';

const SEEDS: Readonly<Record<Map5Theater, readonly MissionSeed[]>> = {
  reef: [
    { name: 'Shallow Water', objective: patrol, pool: ['minisub', 'seadrone', 'seaturret'], briefing: 'The war has gone under the sea. Take the sub down over the reef, learn how she handles and keep your eyes open.' },
    { name: 'Reef Guns', objective: strike('seaturret', 5), pool: ['seaturret', 'minisub', 'jelly'], briefing: 'Turrets bolted to the coral cover the channel. Destroy 5 so our divers can pass.' },
    { name: 'Minefield', objective: intercept(24), pool: ['seamine', 'seadrone', 'minisub'], briefing: 'They have mined the reef and sent drones to guard the mines. Clear the water: 24 kills.' },
    { name: 'Eel Grounds', objective: strike('eel', 6), pool: ['eel', 'minisub', 'seaturret'], briefing: 'Something in their labs has made the eels angry, and electric. Put 6 of them down before they reach our divers.' },
    { name: 'Night Reef', objective: patrol, pool: ['minisub', 'eel', 'jelly', 'seamine'], briefing: 'The reef at night belongs to whatever glows. Stay close to the bottom and keep shooting.' },
    { name: 'Barracuda', objective: { type: 'boss', boss: 'barracuda' }, pool: ['minisub', 'seadrone'], briefing: 'BARRACUDA, their hunter-killer sub, prowls the edge of the reef. Find it and sink it.' },
  ],
  kelp: [
    { name: 'Green Gloom', objective: patrol, pool: ['minisub', 'eel', 'jelly'], briefing: 'The kelp grows taller than a church out here, and anything can hide in it. Go in slowly.' },
    { name: 'Kelp Hunters', objective: strike('hunter', 4), pool: ['hunter', 'minisub', 'seaturret'], briefing: 'Their hunter subs stalk our divers between the stalks. Sink 4 of them.' },
    { name: 'Swarm Season', objective: intercept(28), pool: ['jelly', 'seadrone', 'eel'], briefing: 'The jellyfish are swarming, and their drones hide among them. Clear the water: 28 kills.' },
    { name: 'Crab Walk', objective: strike('crab', 6), pool: ['crab', 'seaturret', 'minisub'], briefing: 'Giant crabs, bred in their labs, march on our listening posts. Stop 6 of them.' },
    { name: 'Deep Green', objective: patrol, pool: ['hunter', 'eel', 'crab', 'jelly'], briefing: 'The forest gets darker the deeper we go. Stay on course and keep firing.' },
    { name: 'Medusa', objective: { type: 'boss', boss: 'medusa' }, pool: ['jelly', 'eel'], briefing: 'MEDUSA, a jellyfish the size of a house, rules the kelp. Cut her down.' },
  ],
  wrecks: [
    { name: 'Ghost Fleet', objective: patrol, pool: ['hunter', 'seamine', 'crab'], briefing: 'A whole fleet lies on the bottom here, and the enemy uses the wrecks for cover. Watch every hull.' },
    { name: 'Surface Raiders', objective: strike('torpboat', 5), pool: ['torpboat', 'minisub', 'seaturret'], briefing: 'Torpedo boats are hunting us from the surface. Look up and sink 5 of them.' },
    { name: 'Salvage Guns', objective: strike('seaturret', 8), pool: ['seaturret', 'crab', 'hunter'], briefing: 'They have bolted guns onto the old wrecks. Silence 8 of them.' },
    { name: 'Wolf Pack', objective: intercept(32), pool: ['hunter', 'minisub', 'seadrone'], briefing: 'A wolf pack of hunter subs has found us. Break it: 32 kills.' },
    { name: 'Rust and Bones', objective: patrol, pool: ['torpboat', 'hunter', 'crab', 'seamine'], briefing: 'Mines among the wrecks, boats above them. Thread the field and come back.' },
    { name: 'Bastion', objective: { type: 'boss', boss: 'bastion' }, pool: ['minisub', 'hunter'], briefing: 'BASTION, a fortress on a rock shelf among the wrecks, guards the way down. Crack it.' },
  ],
  trench: [
    { name: 'The Drop', objective: patrol, pool: ['squid', 'hunter', 'sealab'], briefing: 'The seabed falls away into the trench. Follow it down, and keep away from the walls.' },
    { name: 'Sea Labs', objective: strike('sealab', 5), pool: ['sealab', 'seaturret', 'squid'], briefing: 'Their labs cling to the trench walls. Destroy 5 of them.' },
    { name: 'Ink Storm', objective: intercept(36), pool: ['squid', 'eel', 'seadrone'], briefing: 'Squid swarm out of the dark, ink everywhere. 36 kills.' },
    { name: 'Convoy Overhead', objective: strike('torpboat', 6), pool: ['torpboat', 'hunter', 'squid'], briefing: 'A convoy of torpedo boats passes over the trench. Sink 6 from below.' },
    { name: 'Wall Guns', objective: patrol, pool: ['sealab', 'crab', 'squid', 'hunter'], briefing: 'Guns in the walls, labs on the ledges. Hold the middle and keep going down.' },
    { name: 'Goliath', objective: { type: 'boss', boss: 'goliath' }, pool: ['squid', 'eel'], briefing: 'GOLIATH, a giant squid, waits at the bottom of the trench. Something has to stop it.' },
  ],
  abyss: [
    { name: 'Where the Light Ends', objective: patrol, pool: ['angler', 'squid', 'hunter'], briefing: 'No light reaches the abyss. Only things that glow, and things that bite.' },
    { name: 'Black Smokers', objective: strike('sealab', 7), pool: ['sealab', 'crab', 'angler'], briefing: 'Their last labs draw power from the hot vents. Destroy 7 of them.' },
    { name: 'Glow in the Dark', objective: intercept(40), pool: ['angler', 'jelly', 'squid'], briefing: 'The dark is full of lights, and every light has teeth. 40 kills.' },
    { name: 'Last Wolf Pack', objective: strike('hunter', 8), pool: ['hunter', 'torpboat', 'angler'], briefing: 'Everything they have left has come down here. Sink 8 hunter subs.' },
    { name: 'The Bottom', objective: patrol, pool: ['hunter', 'sealab', 'angler', 'squid', 'crab'], briefing: 'The bottom of the sea. One more push, and there is nowhere left for them to go.' },
    { name: 'Jormungand', objective: { type: 'boss', boss: 'jormungand' }, pool: ['angler', 'squid'], briefing: 'JORMUNGAND, a sea serpent older than any war, has woken in the abyss. This is the last fight.' },
  ],
};

const ORDER: readonly Map5Theater[] = ['reef', 'kelp', 'wrecks', 'trench', 'abyss'];

/** Map 5: m121–m150 (docs 65, 70). */
export const MISSIONS_5: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 5,
  first: 121,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 120) : 100 + Math.round((n - 121) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 121) * 1.35),
  reward: (n) => round100(1200 + (n - 121) * 380),
}));
