// Medals (doc 24): the catalogue. Generic names and original designs — no real decorations.

export type MedalId =
  | 'pacific' | 'gulf' | 'arctic' | 'canyon' | 'leviathan' | 'victory' | 'allstars'
  // Maps 2–4 (doc 62).
  | 'northsea' | 'himalaya' | 'jungle' | 'nightfall' | 'thunderhead' | 'victory2' | 'allstars2'
  | 'fjords' | 'highlands' | 'delta' | 'mesa' | 'ashfall' | 'victory3' | 'allstars3'
  // Under the sea (doc 72; map 4 since doc 74 — the ids keep the world's old number).
  | 'reef' | 'kelp' | 'wrecks' | 'trench' | 'abyss' | 'victory5' | 'allstars5'
  // Space (doc 62; map 5 since doc 74).
  | 'orbit' | 'belt' | 'moon' | 'rings' | 'deep' | 'victory4' | 'allstars4'
  // The jungle planet, map 6 (doc 85).
  | 'landing' | 'canopy' | 'swamp' | 'ruins' | 'hive' | 'victory6' | 'allstars6'
  | 'ace' | 'topace' | 'giant' | 'untouchable' | 'gunslinger' | 'catapult'
  | 'offduty5' | 'offduty10' | 'sorties25' | 'sorties100' | 'triple';

export const MEDAL_IDS: readonly MedalId[] = Object.freeze([
  'pacific', 'gulf', 'arctic', 'canyon', 'leviathan', 'victory', 'allstars',
  'northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead', 'victory2', 'allstars2',
  'fjords', 'highlands', 'delta', 'mesa', 'ashfall', 'victory3', 'allstars3',
  'reef', 'kelp', 'wrecks', 'trench', 'abyss', 'victory5', 'allstars5',
  'orbit', 'belt', 'moon', 'rings', 'deep', 'victory4', 'allstars4',
  'landing', 'canopy', 'swamp', 'ruins', 'hive', 'victory6', 'allstars6',
  'ace', 'topace', 'giant', 'untouchable', 'gunslinger', 'catapult',
  'offduty5', 'offduty10', 'sorties25', 'sorties100', 'triple',
] as const);

export type MedalGroup = 'campaign' | 'combat' | 'offduty' | 'dedication';
export type MedalShape = 'ribbon' | 'star' | 'cross' | 'disc' | 'wings' | 'pin';
export type MedalMetal = 'gold' | 'silver' | 'bronze';

export interface MedalLook {
  /** Ribbon stripes, outside to centre (mirrored), as hex colours. */
  ribbon: readonly string[];
  shape: MedalShape;
  metal: MedalMetal;
}

export interface MedalDef {
  id: MedalId;
  group: MedalGroup;
  name: string;
  citation: string;
  look: MedalLook;
}

const m = (id: MedalId, group: MedalGroup, name: string, citation: string, ribbon: readonly string[], shape: MedalShape, metal: MedalMetal): MedalDef =>
  ({ id, group, name, citation, look: { ribbon, shape, metal } });

/** Maps 2–5 (docs 62, 72): a campaign ribbon per theater boss, the map's victory medal and its golden star. */
const WORLD_MEDALS = {
  northsea: m('northsea', 'campaign', 'North Sea Campaign Ribbon', 'For storming the sea fortress KRAKEN among the North Sea rigs.', ['#22303d', '#ff9d2e', '#9fb4c3'], 'ribbon', 'bronze'),
  himalaya: m('himalaya', 'campaign', 'Roof of the World Ribbon', 'For downing the heavy gunship CONDOR above the highest peaks on Earth.', ['#3b4a6b', '#e9f2f7', '#c9a46a'], 'ribbon', 'bronze'),
  jungle: m('jungle', 'campaign', 'Green Hell Campaign Ribbon', 'For stopping the armoured train PYTHON deep in the jungle.', ['#1f4d2a', '#8ad14a', '#d9b44a'], 'ribbon', 'silver'),
  nightfall: m('nightfall', 'campaign', 'Desert Night Campaign Ribbon', 'For destroying the missile crawler SCORPION in the desert night.', ['#151a33', '#c79a5a', '#6a7cff'], 'ribbon', 'silver'),
  thunderhead: m('thunderhead', 'campaign', 'Thunderhead Campaign Ribbon', 'For bringing down the flying fortress COLOSSUS inside the storm.', ['#2a2f3a', '#ffd84a', '#7a8aa0'], 'ribbon', 'gold'),
  victory2: m('victory2', 'campaign', 'Second Front Medal', 'For flying all thirty missions of the second front to victory.', ['#5b2a86', '#f2f2ee', '#c27bff'], 'cross', 'gold'),
  allstars2: m('allstars2', 'campaign', 'Golden Star, Second Front', 'For three stars on every single mission of the second front.', ['#ffd25a', '#5b2a86', '#ffd25a'], 'star', 'gold'),
  fjords: m('fjords', 'campaign', 'Fjord Country Ribbon', 'For breaking the armoured icebreaker GLACIER in the fjords.', ['#1d4d6e', '#e9f2f7', '#3f8a6a'], 'ribbon', 'bronze'),
  highlands: m('highlands', 'campaign', 'Highland Passes Ribbon', 'For taking the mountain fortress CITADEL above the passes.', ['#4a5a3a', '#d8c79a', '#8a6a4a'], 'ribbon', 'bronze'),
  delta: m('delta', 'campaign', 'River Delta Campaign Ribbon', 'For sinking the river monitor CAIMAN in the delta.', ['#2a5a4a', '#6ab0c0', '#b0a050'], 'ribbon', 'silver'),
  mesa: m('mesa', 'campaign', 'Mesa Country Campaign Ribbon', 'For stopping the super-heavy tank MAMMOTH among the red mesas.', ['#7a3a22', '#e0956a', '#f1dcaa'], 'ribbon', 'silver'),
  ashfall: m('ashfall', 'campaign', 'Ash Island Campaign Ribbon', 'For downing the twin-rotor gunship BEHEMOTH over the volcano.', ['#2a2624', '#ff5a1f', '#8a8078'], 'ribbon', 'gold'),
  victory3: m('victory3', 'campaign', 'Low Level Medal', 'For flying all thirty helicopter missions of the low-level war to victory.', ['#3a4a2a', '#ff8a3d', '#d8c79a'], 'disc', 'gold'),
  allstars3: m('allstars3', 'campaign', 'Golden Star, Low Level', 'For three stars on every single helicopter mission.', ['#ffd25a', '#3a4a2a', '#ffd25a'], 'star', 'gold'),
  orbit: m('orbit', 'campaign', 'Low Orbit Campaign Ribbon', 'For taking down the ring battle station HALO above the planet.', ['#0a1630', '#7fb4ff', '#e9f2f7'], 'ribbon', 'bronze'),
  belt: m('belt', 'campaign', 'Asteroid Belt Campaign Ribbon', 'For cracking the asteroid fortress QUARRY.', ['#2a2018', '#ffb46b', '#9c8a74'], 'ribbon', 'bronze'),
  moon: m('moon', 'campaign', 'Lunar Front Campaign Ribbon', 'For ending the lunar citadel CRATER on the moon.', ['#3d4048', '#e6edf7', '#4f8cff'], 'ribbon', 'silver'),
  rings: m('rings', 'campaign', 'Ring Giant Campaign Ribbon', 'For sinking the three-hulled dreadnought TRIDENT in the giant\'s rings.', ['#1a2a40', '#ffd27a', '#9fb4c8'], 'ribbon', 'silver'),
  deep: m('deep', 'campaign', 'Deep Space Campaign Ribbon', 'For bringing down the mothership ARK past the last star.', ['#1a0a24', '#ff6a8a', '#7a6488'], 'ribbon', 'gold'),
  victory4: m('victory4', 'campaign', 'Deep Space Medal', 'For flying all thirty missions of the war in space to victory.', ['#0a1630', '#5fe3ff', '#e9f2f7'], 'star', 'gold'),
  allstars4: m('allstars4', 'campaign', 'Golden Star, Deep Space', 'For three stars on every single mission in space.', ['#ffd25a', '#0a1630', '#ffd25a'], 'star', 'gold'),
  // Under the sea (doc 72), map 4 since doc 74.
  reef: m('reef', 'campaign', 'Coral Reef Campaign Ribbon', 'For sinking the hunter-killer sub BARRACUDA at the edge of the reef.', ['#0f6a7c', '#ff8a78', '#d8d6aa'], 'ribbon', 'bronze'),
  kelp: m('kelp', 'campaign', 'Kelp Forest Campaign Ribbon', 'For cutting down MEDUSA, queen of the jellyfish, in the kelp.', ['#0e3a34', '#8ff07a', '#c8d86a'], 'ribbon', 'bronze'),
  wrecks: m('wrecks', 'campaign', 'Wreck Field Campaign Ribbon', 'For cracking the seabed fortress BASTION among the wrecks.', ['#1a3a50', '#b8743e', '#a6a89a'], 'ribbon', 'silver'),
  trench: m('trench', 'campaign', 'Trench Campaign Ribbon', 'For stopping the giant squid GOLIATH at the bottom of the trench.', ['#04142a', '#7fb4ff', '#5f6a78'], 'ribbon', 'silver'),
  abyss: m('abyss', 'campaign', 'Abyss Campaign Ribbon', 'For laying the sea serpent JORMUNGAND to rest in the abyss.', ['#05101c', '#5ff0e0', '#4a5260'], 'ribbon', 'gold'),
  victory5: m('victory5', 'campaign', 'Deep Water Medal', 'For fighting all thirty missions of the war under the sea to victory.', ['#0b5a66', '#5ff0e0', '#d8d6aa'], 'disc', 'gold'),
  allstars5: m('allstars5', 'campaign', 'Golden Star, Deep Water', 'For three stars on every single mission under the sea.', ['#ffd25a', '#0b5a66', '#ffd25a'], 'star', 'gold'),
  // The jungle planet (doc 85), map 6.
  landing: m('landing', 'campaign', 'Landing Zone Campaign Ribbon', 'For stopping the assault walker RAVAGER at the edge of the landing zone.', ['#5a3a24', '#c99a62', '#ffd25a'], 'ribbon', 'bronze'),
  canopy: m('canopy', 'campaign', 'Rainforest Campaign Ribbon', 'For cutting down the bio-machine MANTIS under the canopy.', ['#1f3a1c', '#6fae4a', '#c8ff6a'], 'ribbon', 'bronze'),
  swamp: m('swamp', 'campaign', 'Mangrove Swamp Campaign Ribbon', 'For putting down the swamp beast BASILISK in the black water.', ['#1d2a22', '#7d8f5a', '#9effd2'], 'ribbon', 'silver'),
  ruins: m('ruins', 'campaign', 'Temple Ruins Campaign Ribbon', 'For stopping the stone guardian SENTINEL among the temple ruins.', ['#3a4a2a', '#c4c0a0', '#ffb84a'], 'ribbon', 'silver'),
  hive: m('hive', 'campaign', 'Hive Campaign Ribbon', 'For ending the HIVE QUEEN in the heart of her nest.', ['#2a1a2a', '#a06a90', '#ff7ad2'], 'ribbon', 'gold'),
  victory6: m('victory6', 'campaign', 'Jungle Planet Medal', 'For walking all thirty missions of the war on the jungle planet to victory.', ['#2f6a1e', '#c8ff6a', '#c99a62'], 'disc', 'gold'),
  allstars6: m('allstars6', 'campaign', 'Golden Star, Jungle Planet', 'For three stars on every single mission on the jungle planet.', ['#ffd25a', '#2f6a1e', '#ffd25a'], 'star', 'gold'),
} as const;

export const MEDALS: Readonly<Record<MedalId, MedalDef>> = Object.freeze({
  pacific: m('pacific', 'campaign', 'Pacific Campaign Ribbon', 'For sinking the battleship IRONCLAD and clearing the Pacific Training Range.', ['#1d6596', '#ffd25a', '#f2f2ee'], 'ribbon', 'bronze'),
  gulf: m('gulf', 'campaign', 'Gulf Campaign Ribbon', 'For bringing down the SANDSTORM fortress over the Persian Gulf.', ['#b48f55', '#2a9aa8', '#f1dcaa'], 'ribbon', 'bronze'),
  arctic: m('arctic', 'campaign', 'Arctic Campaign Ribbon', 'For intercepting the BLACKJACK bomber above the Arctic Shield.', ['#22486a', '#e9f2f7', '#7fe3ff'], 'ribbon', 'silver'),
  canyon: m('canyon', 'campaign', 'Canyon Campaign Ribbon', 'For downing the TYPHOON flying wing over the Red Canyon.', ['#863f22', '#ff6b3d', '#e0956a'], 'ribbon', 'silver'),
  leviathan: m('leviathan', 'campaign', 'Leviathan Campaign Ribbon', 'For sinking the supercarrier LEVIATHAN and ending the war at sea.', ['#101f2e', '#ff5a1f', '#7d96ab'], 'ribbon', 'gold'),
  victory: m('victory', 'campaign', 'Victory Medal', 'For flying all thirty missions of the campaign to victory.', ['#b8202a', '#f2f2ee', '#1d3a8a'], 'star', 'gold'),
  allstars: m('allstars', 'campaign', 'Golden Star', 'For three stars on every single mission of the campaign. Flawless.', ['#ffd25a', '#1d3a8a', '#ffd25a'], 'star', 'gold'),
  ...WORLD_MEDALS,
  ace: m('ace', 'combat', 'Ace Wings', 'For fifty enemies destroyed in combat.', ['#2f3f66', '#c9d2dc'], 'wings', 'silver'),
  topace: m('topace', 'combat', 'Top Ace', 'For two hundred and fifty enemies destroyed. The best of the best.', ['#1a1a1a', '#ffd25a', '#b8202a'], 'wings', 'gold'),
  giant: m('giant', 'combat', 'Giant Slayer', 'For destroying three enemy capital threats.', ['#5b2a86', '#ffd25a'], 'cross', 'gold'),
  untouchable: m('untouchable', 'combat', 'Untouchable', 'For completing a mission without a scratch on the airframe.', ['#f2f2ee', '#5fd4ff', '#f2f2ee'], 'disc', 'silver'),
  gunslinger: m('gunslinger', 'combat', 'Gunslinger', 'For winning a mission with the cannon alone. No missiles, no bombs.', ['#5d3a1a', '#d08a4e'], 'cross', 'bronze'),
  catapult: m('catapult', 'combat', 'Catapult Star', 'For five perfect carrier launches in a row.', ['#2a6a3a', '#ffd25a', '#2a6a3a'], 'star', 'silver'),
  offduty5: m('offduty5', 'offduty', 'Off-Duty Star', 'For gold in five different off-duty challenges at the home base.', ['#ff9d2e', '#f2f2ee'], 'star', 'bronze'),
  offduty10: m('offduty10', 'offduty', 'Base Legend', 'For gold in every off-duty challenge. The whole base knows your name.', ['#ff9d2e', '#5b2a86', '#ffd25a'], 'disc', 'gold'),
  sorties25: m('sorties25', 'dedication', 'Sortie Pin', 'For twenty-five sorties flown.', ['#3d4450'], 'pin', 'bronze'),
  sorties100: m('sorties100', 'dedication', 'Iron Pilot', 'For one hundred sorties flown. Always ready.', ['#3d4450', '#9aa3ad', '#3d4450'], 'disc', 'silver'),
  triple: m('triple', 'dedication', 'Triple Threat', 'For flying sorties in all three of the squadron’s jets.', ['#b23a3a', '#f2f2ee', '#262a31'], 'pin', 'silver'),
});
