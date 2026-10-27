// Shared ids and data shapes used across features. Pure types + frozen id lists.

/** The three map-1 jets, then the three sold once map 2 is open (doc 36). */
export type PlaneId = 'f16' | 'f14' | 'sr71' | 'a10' | 'f35' | 'tornado';
export const PLANE_IDS: readonly PlaneId[] = Object.freeze(['f16', 'f14', 'sr71', 'a10', 'f35', 'tornado'] as const);

export type SecondaryId = 'aim9' | 'rockets' | 'mk82' | 'agm65' | 'aim54';
export const SECONDARY_IDS: readonly SecondaryId[] = Object.freeze([
  'aim9', 'rockets', 'mk82', 'agm65', 'aim54',
] as const);

export type EquipmentId = 'armor' | 'engine' | 'flares' | 'ecm' | 'damageControl' | 'magnet' | 'radar';
export const EQUIPMENT_IDS: readonly EquipmentId[] = Object.freeze([
  'armor', 'engine', 'flares', 'ecm', 'damageControl', 'magnet', 'radar',
] as const);

export type SpecialId = 'roll' | 'wingman' | 'dash' | 'cannon' | 'stealth' | 'nuke';

/** Map 1 (m01–m30) or map 2 (m31–m60, doc 35). */
export type CampaignId = 1 | 2;

export type TheaterId =
  | 'pacific' | 'gulf' | 'arctic' | 'canyon' | 'leviathan'
  | 'northsea' | 'himalaya' | 'jungle' | 'nightfall' | 'thunderhead';
export const THEATER_IDS: readonly TheaterId[] = Object.freeze([
  'pacific', 'gulf', 'arctic', 'canyon', 'leviathan',
  'northsea', 'himalaya', 'jungle', 'nightfall', 'thunderhead',
] as const);

export type EnemyKind =
  | 'drone' | 'fishbed' | 'fulcrum' | 'flanker' | 'hind' | 'bear'
  | 'aa' | 'sam' | 'tank' | 'radar' | 'depot' | 'boat' | 'destroyer';

export type Layer = 'air' | 'ground';

export type Behavior =
  | 'straight' | 'sine' | 'dive' | 'swoop' | 'strafe' | 'hover' | 'kamikaze' | 'ground';

export type EnemyWeapon = 'none' | 'single' | 'aimed' | 'spread3' | 'missile' | 'flak';

export type BossId =
  | 'ironclad' | 'sandstorm' | 'blackjack' | 'typhoon' | 'leviathan'
  | 'kraken' | 'condor' | 'python' | 'scorpion' | 'colossus';

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
}

export type GunLevel = 1 | 2 | 3 | 4 | 5;
