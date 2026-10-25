import { maxEquipmentLevel } from '../data/equipment';
import type { LiveryId } from '../data/liveries';
import { MISSIONS } from '../data/missions';
import { PLANES } from '../data/planes';
import {
  EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS,
  type EquipmentId, type GunLevel, type PlaneId, type SecondaryId,
} from '../data/types';
import { secondaryAllowedOn } from '../data/weapons';
import { parseLiveries } from './liveries';
import { parseMinigames, type MinigameRecords } from './minigames/core';

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
  ownedSecondaries: SecondaryId[];
  loadout: Record<PlaneId, Loadout>;
  equipment: Record<EquipmentId, number>;
  progress: Record<string, { stars: number }>;
  /** Paint job per jet (doc 09). */
  livery: Record<PlaneId, LiveryId>;
  /** Off-duty minigame personal bests (doc 10). */
  minigames: MinigameRecords;
}

const emptyLoadout = (plane: PlaneId): Loadout => Array.from({ length: PLANES[plane].hardpoints }, () => null);

export function defaultSave(): SaveData {
  return {
    version: 1,
    money: START_MONEY,
    ownedPlanes: ['f16'],
    selectedPlane: 'f16',
    gunLevel: 1,
    ownedSecondaries: [],
    loadout: { f16: emptyLoadout('f16'), f14: emptyLoadout('f14'), sr71: emptyLoadout('sr71') },
    equipment: { armor: 0, engine: 0, flares: 0, ecm: 0, damageControl: 0, magnet: 0, radar: 0 },
    progress: {},
    livery: { f16: 'standard', f14: 'standard', sr71: 'standard' },
    minigames: {},
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

function parseProgress(v: unknown): Record<string, { stars: number }> {
  const out: Record<string, { stars: number }> = {};
  if (!isRecord(v)) return out;
  for (const m of MISSIONS) {
    const entry = v[m.id];
    if (isRecord(entry)) out[m.id] = { stars: int(entry.stars, 0, 3, 1) };
  }
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
    gunLevel: int(raw.gunLevel, 1, 5, 1) as GunLevel,
    ownedSecondaries,
    loadout: {
      f16: parseLoadout(rawLoadout.f16, 'f16', ownedSecondaries),
      f14: parseLoadout(rawLoadout.f14, 'f14', ownedSecondaries),
      sr71: parseLoadout(rawLoadout.sr71, 'sr71', ownedSecondaries),
    },
    equipment: parseEquipment(raw.equipment),
    progress,
    livery: parseLiveries(raw.livery, progress),
    minigames: parseMinigames(raw.minigames),
  };
}

/** A save worth "continuing": any cleared mission or purchase. */
export function hasProgress(save: SaveData): boolean {
  return Object.keys(save.progress).length > 0 || save.ownedPlanes.length > 1
    || save.ownedSecondaries.length > 0 || save.gunLevel > 1 || save.money !== START_MONEY;
}
