import { buildCampaign, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { MissionDef, TheaterId } from './types';

// Map 3 (doc 48): missions m61–m90 in five new theaters, flown with helicopters. The kit starts from zero, so the
// threat is a fresh climb (difficulty 3 … 42, bot playtest) and the reward restarts at the map-1 formula (map 3 pays on top of
// it, game/map-three.ts). Pools lean on the ground: the war is fought low. German texts in i18n/missions-3-de.ts.

type Map3Theater = 'fjords' | 'highlands' | 'delta' | 'mesa' | 'ashfall';

const SEEDS: Readonly<Record<Map3Theater, readonly MissionSeed[]>> = {
  fjords: [
    { name: 'Into the Fjords', objective: patrol, pool: ['boat', 'hind', 'aa', 'drone'], briefing: 'New front, new wings: from here on we fly helicopters, low and slow between the rock walls. Fly the fjord and get a feel for the Apache.' },
    { name: 'Harbour Guns', objective: strike('aa', 5), pool: ['aa', 'boat', 'hind', 'shilka'], briefing: 'Flak nests guard the fishing harbours the enemy has taken. Silence 5 AA guns.' },
    { name: 'Fast Boats', objective: strike('boat', 8), pool: ['boat', 'aa', 'hind', 'drone'], briefing: 'Fast attack boats race through the narrows. Sink 8 of them before they reach open water.' },
    { name: 'Rotor Wash', objective: intercept(24), pool: ['hind', 'drone', 'fishbed', 'boat'], briefing: 'Enemy gunships hunt in the fjord. Take them on at their own game: 24 kills.' },
    { name: 'Cliff Radar', objective: strike('radar', 4), pool: ['radar', 'sam', 'aa', 'boat'], briefing: 'Radar posts sit on the cliff tops and watch every inlet. Knock out 4 of them.' },
    { name: 'Glacier', objective: { type: 'boss', boss: 'glacier' }, pool: ['boat', 'hind', 'aa'], briefing: 'GLACIER, an armoured icebreaker bristling with guns, is cutting a path for their fleet. Stop it in the ice.' },
  ],
  highlands: [
    { name: 'High Pass', objective: patrol, pool: ['tank', 'aa', 'hind', 'sam'], briefing: 'The highland passes are the only way through the mountains. Fly the pass and stay under their radar.' },
    { name: 'Ridge SAMs', objective: strike('sam', 5), pool: ['sam', 'aa', 'shilka', 'hind'], briefing: 'SAM sites cover the ridgelines. A helicopter can sneak up the valleys where jets cannot: take out 5.' },
    { name: 'Snowbound Column', objective: strike('tank', 8), pool: ['tank', 'shilka', 'aa', 'hind'], briefing: 'An armoured column is grinding up the snowy road to the pass. Stop 8 tanks.' },
    { name: 'Slope Bunkers', objective: strike('bunker', 5), pool: ['bunker', 'aa', 'tank', 'sam'], briefing: 'They have dug bunkers into the slopes. Crack 5 of them; the chain gun goes right through.' },
    { name: 'Gunship Duel', objective: intercept(28), pool: ['hind', 'drone', 'fulcrum', 'shilka'], briefing: 'Their gunships own the passes. Not for long: 28 kills.' },
    { name: 'Citadel', objective: { type: 'boss', boss: 'citadel' }, pool: ['hind', 'tank', 'aa'], briefing: 'CITADEL, an old mountain fortress rebuilt with missile batteries, holds the highest pass. Take it apart.' },
  ],
  delta: [
    { name: 'River Run', objective: patrol, pool: ['tank', 'aa', 'hind', 'drone'], briefing: 'The delta is a maze of channels and reeds. Follow the main river and see what moves.' },
    { name: 'Fuel Dumps', objective: strike('depot', 6), pool: ['depot', 'aa', 'hind', 'tank'], briefing: 'Fuel for their whole front is stored along the river. Burn 6 depots.' },
    { name: 'Dike Road', objective: strike('tank', 9), pool: ['tank', 'aa', 'hind', 'drone'], briefing: 'Their armour uses the dikes as roads through the swamp. Stop 9 tanks.' },
    { name: 'Swamp Flak', objective: strike('shilka', 6), pool: ['shilka', 'aa', 'tank', 'hind'], briefing: 'Shilka flak tracks prowl the dikes. Destroy 6 before they shred our transport helicopters.' },
    { name: 'Night Swarm', objective: intercept(32), pool: ['drone', 'hind', 'fulcrum', 'aa'], briefing: 'Drones and gunships swarm over the delta at dusk. Clear the sky: 32 kills.' },
    { name: 'Caiman', objective: { type: 'boss', boss: 'caiman' }, pool: ['hind', 'aa', 'tank'], briefing: 'CAIMAN, a river monitor with armour like a tank, rules the main channel. Send it to the bottom.' },
  ],
  mesa: [
    { name: 'Red Rock', objective: patrol, pool: ['tank', 'aa', 'sam', 'hind'], briefing: 'Mesa country: tablelands, deep gullies and long shadows. Fly the gullies and stay low.' },
    { name: 'Gully Convoy', objective: strike('tank', 10), pool: ['tank', 'shilka', 'aa', 'hind'], briefing: 'A supply convoy winds through the gullies under armoured escort. Stop 10 tanks.' },
    { name: 'Tableland SAMs', objective: strike('sam', 6), pool: ['sam', 'radar', 'shilka', 'aa'], briefing: 'SAMs on the tablelands cover the whole valley. Climb in under them and kill 6.' },
    { name: 'Dust Devils', objective: intercept(36), pool: ['hind', 'fulcrum', 'drone', 'foxbat'], briefing: 'Their air wing is throwing everything at us. Shoot down 36.' },
    { name: 'Rock Bunkers', objective: strike('bunker', 7), pool: ['bunker', 'aa', 'tank', 'sam'], briefing: 'Command bunkers are cut into the mesa walls. Crack 7 of them.' },
    { name: 'Mammoth', objective: { type: 'boss', boss: 'mammoth' }, pool: ['tank', 'shilka', 'hind'], briefing: 'MAMMOTH, the biggest tank ever built, is rolling for the border. Stop the monster.' },
  ],
  ashfall: [
    { name: 'Ash Clouds', objective: patrol, pool: ['boat', 'hind', 'aa', 'drone'], briefing: 'Ash Island: their last stronghold, a volcano wrapped in smoke. Fly the coast and find a way in.' },
    { name: 'Lava Coast Guns', objective: strike('aa', 9), pool: ['aa', 'shilka', 'boat', 'sam'], briefing: 'The coast is lined with flak. Silence 9 AA guns to open the way.' },
    { name: 'Frigate Screen', objective: strike('frigate', 3), pool: ['frigate', 'boat', 'destroyer', 'hind'], briefing: 'Missile frigates screen the island. Sink 3 of them.' },
    { name: 'Crater Radar', objective: strike('radar', 6), pool: ['radar', 'sam', 'aa', 'shilka'], briefing: 'Radar on the crater rim sees everything coming. Blind them: 6 stations.' },
    { name: 'Last Gunships', objective: intercept(40), pool: ['hind', 'fulcrum', 'flanker', 'drone'], briefing: 'Everything they have left is in the air. 40 kills, and the island is open.' },
    { name: 'Behemoth', objective: { type: 'boss', boss: 'behemoth' }, pool: ['hind', 'drone', 'flanker'], briefing: 'BEHEMOTH, a twin-rotor gunship the size of a ship, guards the volcano. Bring it down and end this war.' },
  ],
};

const ORDER: readonly Map3Theater[] = ['fjords', 'highlands', 'delta', 'mesa', 'ashfall'];

/** Map 3: m61–m90. */
export const MISSIONS_3: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 3,
  first: 61,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 60) : 100 + Math.round((n - 61) * 1.2)),
  difficulty: (n) => Math.round(3 + (n - 61) * 1.35),
  reward: (n) => round100(1200 + (n - 61) * 380),
}));
