import { buildCampaign, defend, intercept, patrol, round100, strike, type MissionSeed } from './mission-build';
import type { BossId, EnemyKind, MissionDef, TheaterId } from './types';

// Map 7 (doc 102): the alien steppe of Kharsa, driven by the tanks and buggies (doc 103). The kit starts from zero again,
// so the threat is a fresh climb and the reward restarts at the map-1 formula (map 7 pays on top, MAP_SEVEN in
// game/map-three.ts). Five theaters, m181–m210; the 1st, 3rd and 5th mission of each is a drive, the 2nd, 4th and 6th a
// defence of the outpost (doc 106), the boss coming after the last wave. German texts in i18n/missions-7-de.ts.

type Map7Theater = 'grass' | 'saltflats' | 'badlands' | 'barrows' | 'impact';

/** A defence mission: hold the outpost for `waves` waves. */
const hold = (name: string, waves: number, pool: readonly EnemyKind[], briefing: string): MissionSeed =>
  ({ name, objective: defend(waves), pool, briefing, defend: waves });

/** A boss defence: `waves` waves, then the boss marches on the outpost. */
const siege = (name: string, boss: BossId, waves: number, pool: readonly EnemyKind[], briefing: string): MissionSeed =>
  ({ name, objective: { type: 'boss', boss }, pool, briefing, defend: waves });

const SEEDS: Readonly<Record<Map7Theater, readonly MissionSeed[]>> = {
  grass: [
    { name: 'First Tracks', objective: patrol, pool: ['crawler', 'trooper', 'scoutdisc', 'rider'], briefing: 'The lander is down in the tall grass. Drive out, learn how your buggy handles, and meet the invaders.' },
    hold('Outpost Alpha', 5, ['crawler', 'trooper', 'rider'], 'Their columns are marching on our first outpost. Build towers on the pads and hold it for 5 waves.'),
    { name: 'Pod Fall', objective: strike('landingpod', 5), pool: ['landingpod', 'trooper', 'crawler', 'scoutdisc'], briefing: 'Landing pods are raining into the grass, and every one lets out troopers. Crack 5 pods.' },
    hold('Grass Fire', 5, ['crawler', 'rider', 'trooper', 'scoutdisc'], 'They set the grass alight to cover their advance. Hold the outpost for 5 waves.'),
    { name: 'Riders on the Plain', objective: intercept(26), pool: ['rider', 'crawler', 'discfighter', 'scoutdisc'], briefing: 'Beast riders sweep across the plain faster than our trucks. 26 kills.' },
    siege('Harvester', 'harvester', 6, ['crawler', 'rider', 'trooper'], 'Something huge is mowing the steppe flat on its way to our outpost: the HARVESTER. Hold 6 waves, then stop it.'),
  ],
  saltflats: [
    { name: 'White Out', objective: patrol, pool: ['tripod', 'trooper', 'discfighter', 'scoutdisc', 'crawler'], briefing: 'The salt flats blind the eye and hide nothing. Drive across and watch for the tall ones.' },
    hold('Salt Works', 6, ['trooper', 'tripod', 'crawler', 'scoutdisc'], 'The old salt works are our next outpost. Hold them for 6 waves.'),
    { name: 'Tripod Hunt', objective: strike('tripod', 4), pool: ['tripod', 'trooper', 'discfighter'], briefing: 'Tripods stalk the flats and burn whatever moves. Bring down 4.' },
    hold('Mirage', 6, ['crawler', 'rider', 'tripod', 'discfighter'], 'The heat plays tricks: columns appear out of nowhere. Hold the outpost for 6 waves.'),
    { name: 'Glass Desert', objective: intercept(28), pool: ['discfighter', 'scoutdisc', 'rider', 'crawler'], briefing: 'Their saucers skim the salt at full speed. 28 kills.' },
    siege('Longshanks', 'longshanks', 7, ['tripod', 'trooper', 'crawler'], 'LONGSHANKS, a tripod taller than a radio mast, strides toward the outpost. Hold 7 waves, then bring it down.'),
  ],
  badlands: [
    { name: 'Red Dust', objective: patrol, pool: ['siegebug', 'rider', 'crawler', 'trooper'], briefing: 'Red rock and dry gullies. The enemy has dug guns into every mesa.' },
    hold('Gully Fort', 6, ['siegebug', 'crawler', 'rider', 'manta'], 'A fort at the mouth of the gully is all that blocks the road. Hold it for 6 waves.'),
    { name: 'Gun Mesas', objective: strike('plasmagun', 6), pool: ['plasmagun', 'trooper', 'crawler'], briefing: 'Plasma cannons on the mesas shell our convoys. Silence 6.' },
    hold('Box Canyon', 7, ['siegebug', 'tripod', 'crawler', 'manta', 'rider'], 'They have us boxed in the canyon. Hold the outpost for 7 waves.'),
    { name: 'Manta Skies', objective: intercept(30), pool: ['manta', 'discfighter', 'scoutdisc'], briefing: 'Bomber mantas glide over the badlands. 30 kills.' },
    siege('Juggernaut', 'juggernaut', 7, ['siegebug', 'rider', 'crawler'], 'JUGGERNAUT, a siege beast carrying a gun fort on its back, is coming for the outpost. Hold 7 waves, then put it down.'),
  ],
  barrows: [
    { name: 'Old Mounds', objective: patrol, pool: ['shieldbearer', 'trooper', 'broodcarrier', 'discfighter', 'crawler'], briefing: 'Burial mounds older than any city, and the invaders camp between them.' },
    hold('Standing Stones', 7, ['shieldbearer', 'crawler', 'tripod', 'scoutdisc'], 'The ring of standing stones makes a fine outpost. Hold it for 7 waves.'),
    { name: 'Brood Hunt', objective: strike('broodcarrier', 6), pool: ['broodcarrier', 'crawler', 'manta'], briefing: 'Brood carriers haul their crawlers to the front. Kill 6 before they spill.' },
    hold('Dust Storm', 7, ['broodcarrier', 'rider', 'shieldbearer', 'manta', 'crawler'], 'A dust storm rolls in, and they march inside it. Hold the outpost for 7 waves.'),
    { name: 'Shield Wall', objective: strike('shieldbearer', 6), pool: ['shieldbearer', 'trooper', 'tripod', 'discfighter'], briefing: 'Shield bearers cover their columns. Break 6 shields.' },
    siege('Dreadnought', 'dreadnought', 8, ['shieldbearer', 'tripod', 'manta'], 'DREADNOUGHT, a siege ship, hovers over the mounds toward the outpost. Hold 8 waves, then shoot it down.'),
  ],
  impact: [
    { name: 'Crater Rim', objective: patrol, pool: ['trooper', 'tripod', 'siegebug', 'discfighter', 'manta', 'landingpod'], briefing: 'The rim of the crater where they came down. Their whole army stands between us and the bottom.' },
    hold('Last Line', 7, ['crawler', 'rider', 'tripod', 'siegebug', 'broodcarrier', 'manta'], 'Everything they have left is coming. Hold the last line for 7 waves.'),
    { name: 'Pod Storm', objective: strike('landingpod', 8), pool: ['landingpod', 'trooper', 'discfighter', 'scoutdisc'], briefing: 'The mothership drops its last pods. Crack 8.' },
    hold('Siege', 8, ['siegebug', 'shieldbearer', 'tripod', 'rider', 'manta', 'broodcarrier'], 'They lay siege to the outpost on the crater floor. Hold it for 8 waves.'),
    { name: 'Into the Crater', objective: patrol, pool: ['crawler', 'trooper', 'rider', 'tripod', 'siegebug', 'shieldbearer', 'discfighter', 'manta'], briefing: 'Down into the crater. The mothership is right below.' },
    siege('Mothership', 'mothership', 8, ['discfighter', 'manta', 'tripod', 'crawler'], 'The MOTHERSHIP rises from the crater. Hold 8 waves, then end the invasion for good.'),
  ],
};

const ORDER: readonly Map7Theater[] = ['grass', 'saltflats', 'badlands', 'barrows', 'impact'];

/** Map 7: m181–m210 (doc 102). */
export const MISSIONS_7: readonly MissionDef[] = Object.freeze(buildCampaign({
  campaign: 7,
  first: 181,
  seeds: ORDER.map((id): [TheaterId, readonly MissionSeed[]] => [id, SEEDS[id]]),
  length: (n, boss) => (boss ? 40 + (n - 180) : 100 + Math.round((n - 181) * 1.2)),
  difficulty: (n) => Math.round(2 + (n - 181) * 1.35),
  reward: (n) => round100(1200 + (n - 181) * 380),
}));
