// Shared ids and data shapes used across features. Pure types + frozen id lists.

/** The three map-1 jets, then the three sold once map 2 is open (doc 36). */
export type JetId = 'f16' | 'f14' | 'sr71' | 'a10' | 'f35' | 'tornado';
export const JET_IDS: readonly JetId[] = Object.freeze(['f16', 'f14', 'sr71', 'a10', 'f35', 'tornado'] as const);
/** The map-3 helicopters: the Apache (doc 49), then the Tiger, Comanche and Hind (doc 51). */
export type HeliId = 'ah64' | 'tiger' | 'rah66' | 'mi24';
export const HELI_IDS: readonly HeliId[] = Object.freeze(['ah64', 'tiger', 'rah66', 'mi24'] as const);
/** The map-4 spacecraft: one ship, built from modules (doc 54). */
export type ShipId = 'starship';
/** The map-5 attack subs: the Type 212 (doc 66), then the Seawolf, Virginia and Akula (doc 69). */
export type SubId = 'u212' | 'seawolf' | 'virginia' | 'akula';
export const SUB_IDS: readonly SubId[] = Object.freeze(['u212', 'seawolf', 'virginia', 'akula'] as const);
/** The map-6 mechs: the Strider (free), then the Ranger, Hornet and Titan (doc 79). */
export type MechId = 'strider' | 'ranger' | 'hornet' | 'titan';
export const MECH_IDS: readonly MechId[] = Object.freeze(['strider', 'ranger', 'hornet', 'titan'] as const);
/** Everything the pilot can fly: jets, helicopters, the ship, the subs and the mechs share the loadout, paint and
 *  progress records. */
export type PlaneId = JetId | HeliId | ShipId | SubId | MechId;
export const PLANE_IDS: readonly PlaneId[] = Object.freeze([...JET_IDS, ...HELI_IDS, 'starship', ...SUB_IDS, ...MECH_IDS]);

export const isJet = (id: PlaneId): id is JetId => (JET_IDS as readonly PlaneId[]).includes(id);
/** A plane as a jet, for what only jets do (minigames, photos, the hangar base): a helicopter reads as the F-16. */
export const asJet = (id: PlaneId): JetId => (isJet(id) ? id : 'f16');

/** AIM-120 and JDAM are sold once map 2 is open (doc 37); Hydra, Hellfire (doc 49) and Stinger (doc 51) are helicopter
 *  weapons; the MK48 and the depth mine sub weapons (doc 66). */
export type SecondaryId =
  | 'aim9' | 'rockets' | 'mk82' | 'agm65' | 'aim54' | 'aim120' | 'jdam' | 'hydra' | 'hellfire' | 'stinger' | 'spacerocket' | 'torpedo'
  | 'mk48' | 'depthmine' | 'shkval'
  // The mechs' weapons (doc 79): the rocket pod from the start, the rest invented in the lab (doc 82).
  | 'pod' | 'seeker' | 'mortar' | 'plasma' | 'rail'
  // The helicopters' station weapons of doc 99, the subs' of doc 101.
  | 'pulselaser' | 'sonic' | 'drones' | 'torpswarm' | 'sonarpulse' | 'decoy' | 'net';
export const SECONDARY_IDS: readonly SecondaryId[] = Object.freeze([
  'aim9', 'rockets', 'mk82', 'agm65', 'aim54', 'aim120', 'jdam', 'hydra', 'hellfire', 'stinger', 'spacerocket', 'torpedo',
  'mk48', 'depthmine', 'shkval', 'pod', 'seeker', 'mortar', 'plasma', 'rail', 'pulselaser', 'sonic', 'drones',
  'torpswarm', 'sonarpulse', 'decoy', 'net',
] as const);

export type EquipmentId = 'armor' | 'engine' | 'flares' | 'ecm' | 'damageControl' | 'magnet' | 'radar';
export const EQUIPMENT_IDS: readonly EquipmentId[] = Object.freeze([
  'armor', 'engine', 'flares', 'ecm', 'damageControl', 'magnet', 'radar',
] as const);

export type SpecialId =
  | 'roll' | 'wingman' | 'dash' | 'cannon' | 'stealth' | 'nuke' | 'longbow' | 'gunpods' | 'armour' | 'sonar'
  /** The Strider's jump jets: a leap over everything and a stomp on landing (doc 80). */
  | 'jumpjet';

/** Map 1 (m01–m30), map 2 (m31–m60, doc 35), map 3 (m61–m90, helicopters, doc 48), map 4 (m91–m120, under the sea,
 *  doc 65), map 5 (m121–m150, space, doc 56) — in that order since doc 74 — and map 6 (m151–m180, the jungle planet,
 *  doc 78). */
export type CampaignId = 1 | 2 | 3 | 4 | 5 | 6;
export const CAMPAIGN_IDS: readonly CampaignId[] = Object.freeze([1, 2, 3, 4, 5, 6] as const);

export type TheaterId =
  | 'pacific' | 'gulf' | 'arctic' | 'canyon' | 'leviathan'
  | 'northsea' | 'himalaya' | 'jungle' | 'nightfall' | 'thunderhead'
  | 'fjords' | 'highlands' | 'delta' | 'mesa' | 'ashfall'
  | 'reef' | 'kelp' | 'wrecks' | 'trench' | 'abyss'
  | 'orbit' | 'belt' | 'moon' | 'rings' | 'deep'
  | 'landing' | 'canopy' | 'swamp' | 'ruins' | 'hive';
export const THEATER_IDS: readonly TheaterId[] = Object.freeze([
  'pacific', 'gulf', 'arctic', 'canyon', 'leviathan',
  'northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead',
  'fjords', 'highlands', 'delta', 'mesa', 'ashfall',
  'reef', 'kelp', 'wrecks', 'trench', 'abyss',
  'orbit', 'belt', 'moon', 'rings', 'deep',
  'landing', 'canopy', 'swamp', 'ruins', 'hive',
] as const);

export type EnemyKind =
  | 'drone' | 'fishbed' | 'fulcrum' | 'flanker' | 'hind' | 'bear'
  | 'aa' | 'sam' | 'tank' | 'radar' | 'depot' | 'boat' | 'destroyer'
  // New adversaries and the three mini-bosses (doc 44).
  | 'shilka' | 'bunker' | 'foxbat' | 'jammer' | 'frigate' | 'felon'
  | 'backfire' | 'fortress' | 'cruiser'
  // Map 4, space (docs 56, 58); the warden is map 4's mini-boss.
  | 'raider' | 'satgun' | 'corvette' | 'interceptor' | 'gunship' | 'battery' | 'warden'
  // Map 5, under the sea (doc 68): machines and creatures.
  | 'minisub' | 'seadrone' | 'seamine' | 'seaturret' | 'jelly' | 'eel'
  // Map 5's deep (doc 70); the boomer is map 5's mini-boss.
  | 'hunter' | 'torpboat' | 'squid' | 'crab' | 'sealab' | 'angler' | 'boomer'
  // Map 6, the jungle planet (docs 78, 81): machines and creatures; the brute is map 6's mini-boss.
  | 'walker' | 'hovertank' | 'artillery' | 'gundrone' | 'dropship' | 'raptor' | 'beetle' | 'spitter' | 'wasp' | 'brute'
  // The jungle planet's alien creatures and plants (doc 96).
  | 'sporepod' | 'lasher' | 'rhino' | 'toad' | 'spire' | 'totem' | 'lurker'
  | 'glider' | 'leatherwing' | 'dragonfly' | 'balloon' | 'skyjelly';

export type Layer = 'air' | 'ground';

export type Behavior =
  | 'straight' | 'sine' | 'dive' | 'swoop' | 'strafe' | 'hover' | 'kamikaze' | 'ground'
  /** The Backfire mini-boss: holds the top of the screen, then leaves (doc 44). */
  | 'loiter';

/** 'ring': a ring of spores round the source, turned with its age (doc 96). */
export type EnemyWeapon = 'none' | 'single' | 'aimed' | 'spread3' | 'missile' | 'flak' | 'ring';

export type BossId =
  | 'ironclad' | 'sandstorm' | 'blackjack' | 'typhoon' | 'leviathan'
  | 'kraken' | 'condor' | 'python' | 'scorpion' | 'colossus'
  | 'glacier' | 'citadel' | 'caiman' | 'mammoth' | 'behemoth'
  | 'halo' | 'quarry' | 'crater' | 'trident' | 'ark'
  | 'barracuda' | 'medusa' | 'bastion' | 'goliath' | 'jormungand'
  | 'ravager' | 'mantis' | 'basilisk' | 'sentinel' | 'queen';

export type TakeoffRating = 'perfect' | 'good' | 'early' | 'late' | 'skipped';

export type Objective =
  | { type: 'patrol' }
  | { type: 'intercept'; count: number }
  | { type: 'strike'; target: EnemyKind; count: number }
  | { type: 'boss'; boss: BossId };

export interface MissionDef {
  id: string;
  number: number;
  campaign: CampaignId;
  name: string;
  theater: TheaterId;
  briefing: string;
  objective: Objective;
  difficulty: number;
  reward: number;
  length: number;
  pool: readonly EnemyKind[];
  map: { x: number; y: number };
}

export interface MissionResult {
  missionId: string;
  success: boolean;
  aborted: boolean;
  takeoff: TakeoffRating;
  kills: number;
  spawned: number;
  objectiveDone: boolean;
  hullRatio: number;
  collected: number;
  bossKilled: boolean;
  /** Fired any missile, rocket or bomb (doc 24, Gunslinger). Missing = true. */
  usedSecondaries?: boolean;
  /** Rounds fired from the base's magazine, per weapon (doc 79); missing = none. */
  spent?: Partial<Record<SecondaryId, number>>;
  /** Measurements for the mission score (doc 39); missing in older results. */
  perf?: SortiePerf;
}

/** Gun rounds fired and hitting, damage taken as a share of maximum hull, pickups dropped and collected (doc 39). */
export interface SortiePerf {
  shots: number;
  hits: number;
  damage: number;
  drops: number;
  taken: number;
}

/** 1–7 from the start; 8–10 once map 2 is open (docs 37, 43). */
export type GunLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
