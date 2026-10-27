import { maxEquipmentLevel } from '../data/equipment';
import { LIVERY_IDS, type LiveryId } from '../data/liveries';
import { ALL_MISSIONS } from '../data/missions';
import { perPlane, PLANES } from '../data/planes';
import {
  EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS,
  type EquipmentId, type GunLevel, type PlaneId, type SecondaryId,
} from '../data/types';
import { MAX_GUN2_LEVEL, MAX_GUN_LEVEL, secondaryAllowedOn } from '../data/weapons';
import { parseLook, type AvatarLook } from './avatar-look';
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
}

/** A cleared mission; `at` / `plane` / `livery` describe the best run for its photo (docs 24, 27). */
export interface ProgressEntry {
  stars: number;
  at?: number;
  plane?: PlaneId;
  livery?: LiveryId;
}

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
    loadout: perPlane(emptyLoadout),
    equipment: { armor: 0, engine: 0, flares: 0, ecm: 0, damageControl: 0, magnet: 0, radar: 0 },
    progress: {},
    livery: perPlane((): LiveryId => 'standard'),
    minigames: {},
    ladder: null,
    record: emptyRecord(),
    look: null,
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
    loadout: perPlane((p) => parseLoadout(rawLoadout[p], p, ownedSecondaries)),
    equipment: parseEquipment(raw.equipment),
    progress,
    livery: parseLiveries(raw.livery, progress),
    minigames: parseMinigames(raw.minigames),
    ladder: parseLadderLink(raw.ladder),
    record: parseRecord(raw.record),
    look: isRecord(raw.look) ? parseLook(raw.look) : null,
  };
}

/** A save worth "continuing": any cleared mission or purchase. */
export function hasProgress(save: SaveData): boolean {
  return Object.keys(save.progress).length > 0 || save.ownedPlanes.length > 1
    || save.ownedSecondaries.length > 0 || save.gunLevel > 1 || save.money !== START_MONEY;
}
