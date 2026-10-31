import { maxEquipmentLevel } from '../data/equipment';
import { LIVERY_IDS, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS } from '../data/missions';
import { perPlane, PLANES } from '../data/planes';
import {
  EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS,
  type EquipmentId, type GunLevel, type PlaneId, type SecondaryId,
} from '../data/types';
import { AMMO_TYPES, MAX_AMMO_LEVEL, MAX_INCENDIARY_LEVEL, MAX_MARK, type AmmoType } from '../data/arsenal';
import { MAX_HE_LEVEL } from '../data/he-gun';
import { MAX_GUN2_LEVEL, MAX_GUN_LEVEL, secondaryAllowedOn } from '../data/weapons';
import { parseLook, type AvatarLook } from './avatar-look';
import { freshChallenge, parseChallenge, parseSorties, type ChallengeState, type SortieEntry } from './challenge';
import { parseLadderLink, type LadderLink } from './ladder-stats';
import { isLiveryUnlocked, parseLiveries } from './liveries';
import { parseMinigames, type MinigameRecords } from './minigames/core';
import { emptyRecord, parseRecord, type ServiceRecord } from './service-record';

/** Legacy single-save key (pre-profiles); read once for migration (doc 08). */
export const SAVE_KEY = 'topgun.save.v1';
export const START_MONEY = 2000;

export type Loadout = Array<SecondaryId | null>;

export interface SaveData {
  version: 1;
  money: number;
  ownedPlanes: PlaneId[];
  selectedPlane: PlaneId;
  gunLevel: GunLevel;
  /** Second gun of the new jets, 0 = none (doc 37). */
  gun2Level: number;
  ownedSecondaries: SecondaryId[];
  /** Weapons bought a second time: twin pods on the new jets (doc 37). */
  twinSecondaries: SecondaryId[];
  /** Uranium ammo for the gun, 0 = ordinary rounds (doc 43). */
  ammoLevel: number;
  /** Incendiary ammo for the gun, 0 = none (doc 45). */
  incendiaryLevel: number;
  /** The ammo type loaded for the next sortie (doc 45). */
  ammoType: AmmoType;
  /** Bofors 40 mm HE gun, 0 = none (doc 46). */
  heLevel: number;
  /** Mark of every missile, rocket pod and bomb: 1 = Mk I … 6 = Mk VI (doc 43). */
  weaponLevels: Record<SecondaryId, number>;
  loadout: Record<PlaneId, Loadout>;
  equipment: Record<EquipmentId, number>;
  progress: Record<string, ProgressEntry>;
  /** Paint job per jet (doc 09). */
  livery: Record<PlaneId, LiveryId>;
  /** Off-duty minigame personal bests (doc 10). */
  minigames: MinigameRecords;
  /** This pilot's online ladder entry (doc 28); null until the first save. */
  ladder: LadderLink | null;
  /** Service record for the medals (doc 24). */
  record: ServiceRecord;
  /** Own avatar from the builder (doc 29); null = the preset profile.avatar. */
  look: AvatarLook | null;
  /** Challenge level and its streaks (doc 38). */
  challenge: ChallengeState;
  /** The last 20 sorties (doc 38). */
  sorties: SortieEntry[];
  /** Rookie: easier enemies, more hull, no adaptive challenge (doc 38). */
  rookie: boolean;
}

/** A cleared mission; `at` / `plane` / `livery` describe the best run for its photo (docs 24, 27). */
export interface ProgressEntry {
  stars: number;
  at?: number;
  plane?: PlaneId;
  livery?: LiveryId;
  /** Best mission score, 0–1000 (doc 39); missing until the mission is won after this release. */
  score?: number;
}

const freshMarks = (): Record<SecondaryId, number> => Object.fromEntries(SECONDARY_IDS.map((id) => [id, 1])) as Record<SecondaryId, number>;

const emptyLoadout = (plane: PlaneId): Loadout => Array.from({ length: PLANES[plane].hardpoints }, () => null);

export function defaultSave(): SaveData {
  return {
    version: 1,
    money: START_MONEY,
    ownedPlanes: ['f16'],
    selectedPlane: 'f16',
    gunLevel: 1,
    gun2Level: 0,
    ownedSecondaries: [],
    twinSecondaries: [],
    ammoLevel: 0,
    incendiaryLevel: 0,
    ammoType: 'uranium',
    heLevel: 0,
    weaponLevels: freshMarks(),
    loadout: perPlane(emptyLoadout),
    equipment: { armor: 0, engine: 0, flares: 0, ecm: 0, damageControl: 0, magnet: 0, radar: 0 },
    progress: {},
    livery: perPlane((): LiveryId => 'standard'),
    minigames: {},
    ladder: null,
    record: emptyRecord(),
    look: null,
    challenge: freshChallenge(),
    sorties: [],
    rookie: false,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function num(v: unknown, lo: number, hi: number, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(hi, Math.max(lo, v));
}

const int = (v: unknown, lo: number, hi: number, fallback: number): number => Math.floor(num(v, lo, hi, fallback));

function ids<T extends string>(v: unknown, valid: readonly T[]): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    const id = valid.find((x) => x === item);
    if (id !== undefined && !out.includes(id)) out.push(id);
  }
  return out;
}

function parseLoadout(v: unknown, plane: PlaneId, owned: readonly SecondaryId[]): Loadout {
  const slots = emptyLoadout(plane);
  if (!Array.isArray(v)) return slots;
  return slots.map((_, i) => {
    const id = owned.find((x) => x === v[i]);
    return id !== undefined && secondaryAllowedOn(id, plane) ? id : null;
  });
}

function parseEntry(e: Record<string, unknown>): ProgressEntry {
  const out: ProgressEntry = { stars: int(e.stars, 0, 3, 1) };
  if (typeof e.at === 'number' && Number.isFinite(e.at) && e.at > 0) out.at = e.at;
  const plane = PLANE_IDS.find((p) => p === e.plane);
  if (plane) out.plane = plane;
  const livery = LIVERY_IDS.find((l) => l === e.livery);
  if (livery) out.livery = livery;
  if (typeof e.score === 'number' && Number.isFinite(e.score) && e.score > 0) out.score = Math.min(1000, Math.round(e.score));
  return out;
}

function parseProgress(v: unknown): Record<string, ProgressEntry> {
  const out: Record<string, ProgressEntry> = {};
  if (!isRecord(v)) return out;
  for (const m of ALL_MISSIONS) {
    const entry = v[m.id];
    if (isRecord(entry)) out[m.id] = parseEntry(entry);
  }
  // A photo's paint job must have been earned by the parsed progress (doc 09).
  for (const e of Object.values(out)) if (e.livery && !isLiveryUnlocked(out, e.livery)) e.livery = 'standard';
  return out;
}

/** Marks above Mk I only for owned weapons (doc 43). */
function parseMarks(v: unknown, owned: readonly SecondaryId[]): Record<SecondaryId, number> {
  const out = freshMarks();
  if (!isRecord(v)) return out;
  for (const id of owned) out[id] = int(v[id], 1, MAX_MARK, 1);
  return out;
}

function parseEquipment(v: unknown): Record<EquipmentId, number> {
  const out = defaultSave().equipment;
  if (!isRecord(v)) return out;
  for (const id of EQUIPMENT_IDS) out[id] = int(v[id], 0, maxEquipmentLevel(id), 0);
  return out;
}

/** Validates an untrusted JSON value into a SaveData. Returns null when it is not a v1 save at all. */
export function parseSave(raw: unknown): SaveData | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const ownedPlanes = ids(raw.ownedPlanes, PLANE_IDS);
  if (!ownedPlanes.includes('f16')) ownedPlanes.unshift('f16');
  const selected = ownedPlanes.find((p) => p === raw.selectedPlane) ?? 'f16';
  const ownedSecondaries = ids(raw.ownedSecondaries, SECONDARY_IDS);
  const rawLoadout = isRecord(raw.loadout) ? raw.loadout : {};
  const progress = parseProgress(raw.progress);
  return {
    version: 1,
    money: int(raw.money, 0, 1e9, START_MONEY),
    ownedPlanes,
    selectedPlane: selected,
    gunLevel: int(raw.gunLevel, 1, MAX_GUN_LEVEL, 1) as GunLevel,
    gun2Level: int(raw.gun2Level, 0, MAX_GUN2_LEVEL, 0),
    ownedSecondaries,
    twinSecondaries: ids(raw.twinSecondaries, SECONDARY_IDS).filter((id) => ownedSecondaries.includes(id)),
    ammoLevel: int(raw.ammoLevel, 0, MAX_AMMO_LEVEL, 0),
    incendiaryLevel: int(raw.incendiaryLevel, 0, MAX_INCENDIARY_LEVEL, 0),
    ammoType: AMMO_TYPES.find((a) => a === raw.ammoType) ?? 'uranium',
    heLevel: int(raw.heLevel, 0, MAX_HE_LEVEL, 0),
    weaponLevels: parseMarks(raw.weaponLevels, ownedSecondaries),
    loadout: perPlane((p) => parseLoadout(rawLoadout[p], p, ownedSecondaries)),
    equipment: parseEquipment(raw.equipment),
    progress,
    livery: parseLiveries(raw.livery, progress),
    minigames: parseMinigames(raw.minigames),
    ladder: parseLadderLink(raw.ladder),
    record: parseRecord(raw.record),
    look: isRecord(raw.look) ? parseLook(raw.look) : null,
    challenge: parseChallenge(raw.challenge),
    sorties: parseSorties(raw.sorties),
    rookie: raw.rookie === true,
  };
}

/** A save worth "continuing": any cleared mission or purchase. */
export function hasProgress(save: SaveData): boolean {
  return Object.keys(save.progress).length > 0 || save.ownedPlanes.length > 1
    || save.ownedSecondaries.length > 0 || save.gunLevel > 1 || save.money !== START_MONEY;
}
