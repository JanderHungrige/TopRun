import { maxEquipmentLevel } from '../data/equipment';
import { MISSIONS } from '../data/missions';
import { PLANES } from '../data/planes';
import {
  EQUIPMENT_IDS, PLANE_IDS, SECONDARY_IDS,
  type EquipmentId, type GunLevel, type PlaneId, type SecondaryId,
} from '../data/types';
import { secondaryAllowedOn } from '../data/weapons';

export const SAVE_KEY = 'topgun.save.v1';
export const START_MONEY = 2000;

export type Loadout = Array<SecondaryId | null>;

export interface Settings {
  music: number;
  sfx: number;
  autofire: boolean;
  muted: boolean;
}

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
  settings: Settings;
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
    equipment: { armor: 0, engine: 0, flares: 0, ecm: 0, damageControl: 0, magnet: 0 },
    progress: {},
    settings: { music: 0.6, sfx: 0.8, autofire: false, muted: false },
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

function parseSettings(v: unknown): Settings {
  const d = defaultSave().settings;
  if (!isRecord(v)) return d;
  return {
    music: num(v.music, 0, 1, d.music),
    sfx: num(v.sfx, 0, 1, d.sfx),
    autofire: typeof v.autofire === 'boolean' ? v.autofire : d.autofire,
    muted: typeof v.muted === 'boolean' ? v.muted : d.muted,
  };
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
    progress: parseProgress(raw.progress),
    settings: parseSettings(raw.settings),
  };
}

type ReadStore = Pick<Storage, 'getItem'>;
type WriteStore = Pick<Storage, 'setItem'>;

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadSave(storage: ReadStore | null = browserStorage()): SaveData {
  try {
    const text = storage?.getItem(SAVE_KEY);
    if (!text) return defaultSave();
    const parsed = parseSave(JSON.parse(text));
    if (!parsed) console.warn('TopGun: save data unreadable, starting fresh');
    return parsed ?? defaultSave();
  } catch {
    console.warn('TopGun: save data corrupt, starting fresh');
    return defaultSave();
  }
}

export function persistSave(save: SaveData, storage: WriteStore | null = browserStorage()): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save));
    return storage !== null;
  } catch {
    return false;
  }
}

/** A save worth "continuing": any cleared mission or purchase. */
export function hasProgress(save: SaveData): boolean {
  return Object.keys(save.progress).length > 0 || save.ownedPlanes.length > 1
    || save.ownedSecondaries.length > 0 || save.gunLevel > 1 || save.money !== START_MONEY;
}
