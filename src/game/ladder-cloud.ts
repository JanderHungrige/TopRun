import type { RankId } from '../data/ranks.ts';
import { normalizeCallsign } from './callsign.ts';
import { isLadderId, parseIdentity, sameHash, type LadderTable } from './ladder.ts';
import { rankFor } from './rating.ts';

// Cloud pilots (doc 34): a pilot's whole save kept next to its ladder entry and found by its exact callsign. Pure;
// shared by the ladder service and the tests, so imports carry `.ts`. The service never interprets a save — the
// browser parses every save it downloads.

/** Largest save kept, serialised; the request body may carry a little more (id, secret, braces). */
export const MAX_SAVE_BYTES = 40 * 1024;
export const MAX_SAVE_BODY = 48 * 1024;
/** Most pilots one callsign lookup returns. */
export const MAX_MATCHES = 10;

export type SaveJson = Record<string, unknown>;

export interface CloudSave {
  save: SaveJson;
  savedAt: number;
}

/** Saves by ladder entry id. */
export interface SaveTable {
  version: 1;
  saves: Readonly<Record<string, CloudSave>>;
}

export interface Upload {
  id: string;
  secret: string;
  save: SaveJson;
}

/** A pilot a callsign lookup finds: what the player needs to recognise their own pilot, never a secret. */
export interface PilotMatch {
  ref: string;
  callsign: string;
  avatar: string | null;
  country: string | null;
  rank: RankId;
  rating: number;
  savedAt: number;
}

export type UploadResult = { ok: true; saves: SaveTable; savedAt: number } | { ok: false; status: 403 | 404 };

export const emptySaves = (): SaveTable => ({ version: 1, saves: {} });

const isRecord = (v: unknown): v is SaveJson => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Untrusted `{ id, secret, save }` → upload, or null (bad identity, a save that is no object or too big). */
export function parseUpload(v: unknown): Upload | null {
  const who = parseIdentity(v);
  if (!who || !isRecord(v) || !isRecord(v.save) || JSON.stringify(v.save).length > MAX_SAVE_BYTES) return null;
  return { ...who, save: v.save };
}

/** Keeps the save when the pilot's ladder entry exists and the secret matches. */
export function applyUpload(ladder: LadderTable, saves: SaveTable, up: Upload, secretHash: string, now: number): UploadResult {
  const entry = ladder.pilots.find((p) => p.id === up.id);
  if (!entry) return { ok: false, status: 404 };
  if (!sameHash(entry.secretHash, secretHash)) return { ok: false, status: 403 };
  return { ok: true, saves: { version: 1, saves: { ...saves.saves, [up.id]: { save: up.save, savedAt: now } } }, savedAt: now };
}

/** The pilots with exactly this callsign that have a cloud save, best rating first. */
export function findPilots(ladder: LadderTable, saves: SaveTable, query: unknown): PilotMatch[] {
  if (typeof query !== 'string') return [];
  const want = normalizeCallsign(query);
  return ladder.pilots
    .filter((p) => p.callsign === want && saves.saves[p.id] !== undefined)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, MAX_MATCHES)
    .map((p) => ({
      ref: p.id, callsign: p.callsign, avatar: p.avatar, country: p.country, rank: rankFor(p.rating), rating: p.rating,
      savedAt: saves.saves[p.id]?.savedAt ?? 0,
    }));
}

/** Without the saves whose ladder entry is gone (opt-out, pruning); the same table when nothing goes. */
export function pruneSaves(ladder: LadderTable, saves: SaveTable): SaveTable {
  const live = new Set(ladder.pilots.map((p) => p.id));
  const ids = Object.keys(saves.saves);
  if (ids.every((id) => live.has(id))) return saves;
  return { version: 1, saves: Object.fromEntries(ids.filter((id) => live.has(id)).map((id) => [id, saves.saves[id] as CloudSave])) };
}

/** Stored saves.json → table; malformed entries are dropped. */
export function parseSaves(v: unknown): SaveTable {
  if (!isRecord(v) || !isRecord(v.saves)) return emptySaves();
  const kept: [string, CloudSave][] = [];
  for (const [id, raw] of Object.entries(v.saves)) {
    if (isLadderId(id) && isRecord(raw) && isRecord(raw.save) && isTime(raw.savedAt)) kept.push([id, { save: raw.save, savedAt: raw.savedAt }]);
  }
  return { version: 1, saves: Object.fromEntries(kept) };
}
