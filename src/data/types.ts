// Shared ids and data shapes used across features. Pure types + frozen id lists.

/** The three map-1 jets, then the three sold once map 2 is open (doc 36). */
export type JetId = 'f16' | 'f14' | 'sr71' | 'a10' | 'f35' | 'tornado';
export const JET_IDS: readonly JetId[] = Object.freeze(['f16', 'f14', 'sr71', 'a10', 'f35', 'tornado'] as const);
/** The map-3 helicopters (doc 49). */
export type HeliId = 'ah64';
export const HELI_IDS: readonly HeliId[] = Object.freeze(['ah64'] as const);
/** Everything the pilot can fly: jets and helicopters share the loadout, paint and progress records. */
export type PlaneId = JetId | HeliId;
export const PLANE_IDS: readonly PlaneId[] = Object.freeze([...JET_IDS, ...HELI_IDS]);

export const isJet = (id: PlaneId): id is JetId => (JET_IDS as readonly PlaneId[]).includes(id);
/** A plane as a jet, for what only jets do (minigames, photos, the hangar base): a helicopter reads as the F-16. */
export const asJet = (id: PlaneId): JetId => (isJet(id) ? id : 'f16');

/** AIM-120 and JDAM are sold once map 2 is open (doc 37); the Hydra pod and the Hellfire are helicopter weapons (doc 49). */
export type SecondaryId = 'aim9' | 'rockets' | 'mk82' | 'agm65' | 'aim54' | 'aim120' | 'jdam' | 'hydra' | 'hellfire';
export const SECONDARY_IDS: readonly SecondaryId[] = Object.freeze([
  'aim9', 'rockets', 'mk82', 'agm65', 'aim54', 'aim120', 'jdam', 'hydra', 'hellfire',
] as const);

export type EquipmentId = 'armor' | 'engine' | 'flares' | 'ecm' | 'damageControl' | 'magnet' | 'radar';
export const EQUIPMENT_IDS: readonly EquipmentId[] = Object.freeze([
  'armor', 'engine', 'flares', 'ecm', 'damageControl', 'magnet', 'radar',
] as const);

export type SpecialId = 'roll' | 'wingman' | 'dash' | 'cannon' | 'stealth' | 'nuke' | 'longbow';

/** Map 1 (m01–m30), map 2 (m31–m60, doc 35) or map 3 (m61–m90, helicopters, doc 48). */
export type CampaignId = 1 | 2 | 3;
export const CAMPAIGN_IDS: readonly CampaignId[] = Object.freeze([1, 2, 3] as const);

export type TheaterId =
  | 'pacific' | 'gulf' | 'arctic' | 'canyon' | 'leviathan'
  | 'northsea' | 'himalaya' | 'jungle' | 'nightfall' | 'thunderhead'
  | 'fjords' | 'highlands' | 'delta' | 'mesa' | 'ashfall';
export const THEATER_IDS: readonly TheaterId[] = Object.freeze([
  'pacific', 'gulf', 'arctic', 'canyon', 'leviathan',
  'northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead',
  'fjords', 'highlands', 'delta', 'mesa', 'ashfall',
] as const);

export type EnemyKind =
  | 'drone' | 'fishbed' | 'fulcrum' | 'flanker' | 'hind' | 'bear'
  | 'aa' | 'sam' | 'tank' | 'radar' | 'depot' | 'boat' | 'destroyer'
  // New adversaries and the three mini-bosses (doc 44).
  | 'shilka' | 'bunker' | 'foxbat' | 'jammer' | 'frigate' | 'felon'
  | 'backfire' | 'fortress' | 'cruiser';

export type Layer = 'air' | 'ground';

export type Behavior =
  | 'straight' | 'sine' | 'dive' | 'swoop' | 'strafe' | 'hover' | 'kamikaze' | 'ground'
  /** The Backfire mini-boss: holds the top of the screen, then leaves (doc 44). */
  | 'loiter';

export type EnemyWeapon = 'none' | 'single' | 'aimed' | 'spread3' | 'missile' | 'flak';

export type BossId =
  | 'ironclad' | 'sandstorm' | 'blackjack' | 'typhoon' | 'leviathan'
  | 'kraken' | 'condor' | 'python' | 'scorpion' | 'colossus'
  | 'glacier' | 'citadel' | 'caiman' | 'mammoth' | 'behemoth';

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
