import { MISSIONS } from '../data/missions';
import { normalizeCallsign, validateCallsign, type CallsignCheck } from './callsign';
import { defaultSave, parseSave, SAVE_KEY, type SaveData } from './save';
import { defaultSettings, parseSettings, type Settings } from './settings';

// Pilot profiles (doc 08): several pilots per device, each with their own save.

export const STORE_KEY = 'toprun.profiles.v1';
export const MAX_PROFILES = 6;

export type AvatarId = 'pilot1' | 'pilot2' | 'pilot3';
export const AVATAR_IDS: readonly AvatarId[] = Object.freeze(['pilot1', 'pilot2', 'pilot3'] as const);

export interface Profile {
  id: string;
  callsign: string;
  avatar: AvatarId;
  createdAt: number;
  playedAt: number;
  save: SaveData;
}

export interface ProfileStore {
  version: 1;
  settings: Settings;
  activeId: string | null;
  profiles: Profile[];
}

export const emptyStore = (settings: Settings = defaultSettings()): ProfileStore =>
  ({ version: 1, settings, activeId: null, profiles: [] });

export type CreateResult = { ok: true; store: ProfileStore; id: string } | { ok: false; reason: CallsignCheck | 'full' };

export function createProfile(store: ProfileStore, rawCallsign: string, avatar: AvatarId, now: number, id: string): CreateResult {
  if (store.profiles.length >= MAX_PROFILES) return { ok: false, reason: 'full' };
  const check = validateCallsign(rawCallsign, store.profiles.map((p) => p.callsign));
  if (check !== 'ok') return { ok: false, reason: check };
  const profile: Profile = { id, callsign: normalizeCallsign(rawCallsign), avatar, createdAt: now, playedAt: now, save: defaultSave() };
  return { ok: true, id, store: { ...store, activeId: id, profiles: [...store.profiles, profile] } };
}

export function selectProfile(store: ProfileStore, id: string, now: number): ProfileStore {
  if (!store.profiles.some((p) => p.id === id)) return store;
  return { ...store, activeId: id, profiles: store.profiles.map((p) => (p.id === id ? { ...p, playedAt: now } : p)) };
}

export function deleteProfile(store: ProfileStore, id: string): ProfileStore {
  return { ...store, activeId: store.activeId === id ? null : store.activeId, profiles: store.profiles.filter((p) => p.id !== id) };
}

export function activeProfile(store: ProfileStore): Profile | null {
  return store.profiles.find((p) => p.id === store.activeId) ?? null;
}

/** Newest first. */
export function sortedProfiles(store: ProfileStore): Profile[] {
  return [...store.profiles].sort((a, b) => b.playedAt - a.playedAt);
}

export function updateActiveSave(store: ProfileStore, save: SaveData): ProfileStore {
  if (!store.activeId) return store;
  return { ...store, profiles: store.profiles.map((p) => (p.id === store.activeId ? { ...p, save } : p)) };
}

export function updateSettings(store: ProfileStore, settings: Settings): ProfileStore {
  return { ...store, settings };
}

export interface ProfileSummary {
  cleared: number;
  stars: number;
  money: number;
}

export function profileSummary(p: Profile): ProfileSummary {
  const progress = Object.values(p.save.progress);
  return {
    cleared: MISSIONS.filter((m) => m.id in p.save.progress).length,
    stars: progress.reduce((s, x) => s + x.stars, 0),
    money: p.save.money,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isAvatar = (v: unknown): v is AvatarId => AVATAR_IDS.some((a) => a === v);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

interface Seen {
  ids: Set<string>;
  callsigns: string[];
}

function parseProfile(v: unknown, seen: Seen): Profile | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !v.id || typeof v.callsign !== 'string') return null;
  const save = parseSave(v.save);
  if (!save || seen.ids.has(v.id) || validateCallsign(v.callsign, seen.callsigns) !== 'ok') return null;
  const callsign = normalizeCallsign(v.callsign);
  seen.ids.add(v.id);
  seen.callsigns.push(callsign);
  return {
    id: v.id, callsign, avatar: isAvatar(v.avatar) ? v.avatar : 'pilot1',
    createdAt: num(v.createdAt, 0), playedAt: num(v.playedAt, 0), save,
  };
}

/** Validates an untrusted value into a store. Never throws. */
export function parseStore(raw: unknown): ProfileStore | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const seen: Seen = { ids: new Set(), callsigns: [] };
  const list = Array.isArray(raw.profiles) ? raw.profiles : [];
  const profiles = list.map((p) => parseProfile(p, seen)).filter((p): p is Profile => p !== null).slice(0, MAX_PROFILES);
  const activeId = typeof raw.activeId === 'string' && profiles.some((p) => p.id === raw.activeId) ? raw.activeId : null;
  return { version: 1, settings: parseSettings(raw.settings), activeId, profiles };
}

/** A pre-profiles save becomes the pilot PILOT; its settings become the device settings. */
export function migrateLegacy(raw: unknown, now: number): ProfileStore | null {
  const save = parseSave(raw);
  if (!save) return null;
  const settings = parseSettings(isRecord(raw) ? raw.settings : undefined);
  const profile: Profile = { id: 'legacy', callsign: 'PILOT', avatar: 'pilot1', createdAt: now, playedAt: now, save };
  return { version: 1, settings, activeId: null, profiles: [profile] };
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

function readJson(storage: ReadStore | null, key: string): unknown {
  try {
    const text = storage?.getItem(key);
    return text ? JSON.parse(text) : undefined;
  } catch {
    console.warn(`TopRun: ${key} is corrupt, ignoring it`);
    return undefined;
  }
}

export function loadStore(storage: ReadStore | null = browserStorage(), now = Date.now()): ProfileStore {
  const store = parseStore(readJson(storage, STORE_KEY));
  if (store) return store;
  return migrateLegacy(readJson(storage, SAVE_KEY), now) ?? emptyStore();
}

export function persistStore(store: ProfileStore, storage: WriteStore | null = browserStorage()): boolean {
  try {
    storage?.setItem(STORE_KEY, JSON.stringify(store));
    return storage !== null;
  } catch {
    return false;
  }
}

export const newProfileId = (): string => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
