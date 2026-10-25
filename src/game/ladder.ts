import type { RankId } from '../data/ranks.ts';
import { normalizeCallsign, validateCallsign } from './callsign.ts';
import { clampStats, pilotRating, rankFor, type RatingStats } from './rating.ts';

// Online ladder rules (doc 27): validate submissions, upsert, rank, prune. Pure; shared by the
// ladder service (server/ladder) and the tests, so imports carry their `.ts` extension.

export const MAX_ENTRIES = 1000;
/** Everyone: the ladder shows names only, so the whole table is public (owner, doc 28). */
export const PUBLIC_TOP = MAX_ENTRIES;
/** Largest accepted request body in bytes. */
export const MAX_BODY = 2048;
export const WRITES_PER_MIN = 30;

const ID = /^[A-Za-z0-9_-]{22,40}$/;
const SECRET = /^[A-Za-z0-9_-]{32,64}$/;
const STAT_KEYS = ['stars', 'medals', 'kills', 'golds', 'silvers', 'bronzes'] as const;

export interface Submission {
  id: string;
  secret: string;
  callsign: string;
  stats: RatingStats;
}

export interface LadderEntry {
  id: string;
  secretHash: string;
  callsign: string;
  stats: RatingStats;
  rating: number;
  /** When the current rating was first reached (earlier wins a tie). */
  ratedAt: number;
  updatedAt: number;
}

export interface LadderTable {
  version: 1;
  pilots: LadderEntry[];
}

export interface PublicPilot {
  callsign: string;
  rating: number;
  rank: RankId;
  updatedAt: number;
}

export type SubmitResult =
  | { ok: true; table: LadderTable; entry: LadderEntry; place: number }
  | { ok: false; status: 403; reason: 'secret' };

export const emptyTable = (): LadderTable => ({ version: 1, pilots: [] });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function parseStats(v: unknown): RatingStats | null {
  if (!isRecord(v)) return null;
  const out: RatingStats = { stars: 0, medals: 0, kills: 0, golds: 0, silvers: 0, bronzes: 0 };
  for (const k of STAT_KEYS) {
    const n = v[k];
    if (typeof n !== 'number' || !Number.isFinite(n)) return null;
    out[k] = n;
  }
  return out;
}

function parseCallsign(v: unknown): string | null {
  if (typeof v !== 'string' || validateCallsign(v, []) !== 'ok') return null;
  return normalizeCallsign(v);
}

/** `{ id, secret }` of a request (a delete needs nothing else), or null. */
export function parseIdentity(v: unknown): { id: string; secret: string } | null {
  if (!isRecord(v)) return null;
  const { id, secret } = v;
  if (typeof id !== 'string' || !ID.test(id) || typeof secret !== 'string' || !SECRET.test(secret)) return null;
  return { id, secret };
}

/** Untrusted request body → submission, or null when anything is off. */
export function parseSubmission(v: unknown): Submission | null {
  const who = parseIdentity(v);
  if (!who || !isRecord(v)) return null;
  const callsign = parseCallsign(v.callsign);
  const stats = parseStats(v.stats);
  if (callsign === null || stats === null) return null;
  return { ...who, callsign, stats };
}

/** Compares two hashes without an early exit, so timing reveals nothing. */
export function sameHash(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const byRank = (a: LadderEntry, b: LadderEntry): number =>
  b.rating - a.rating || a.ratedAt - b.ratedAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Over the limit, the lowest-rated and then stalest entries go first; `keep` is never dropped. */
function prune(pilots: LadderEntry[], keep: string): LadderEntry[] {
  const out = [...pilots];
  while (out.length > MAX_ENTRIES) {
    let victim = -1;
    out.forEach((p, i) => {
      const v = out[victim];
      if (p.id !== keep && (!v || p.rating < v.rating || (p.rating === v.rating && p.updatedAt < v.updatedAt))) victim = i;
    });
    if (victim < 0) break;
    out.splice(victim, 1);
  }
  return out;
}

/** Creates or updates the pilot's entry. The rating is computed here, never taken from the client. */
export function applySubmission(table: LadderTable, sub: Submission, secretHash: string, now: number): SubmitResult {
  const prev = table.pilots.find((p) => p.id === sub.id);
  if (prev && !sameHash(prev.secretHash, secretHash)) return { ok: false, status: 403, reason: 'secret' };
  const stats = clampStats(sub.stats);
  const rating = pilotRating(stats);
  const entry: LadderEntry = {
    id: sub.id, secretHash, callsign: sub.callsign, stats, rating,
    ratedAt: prev && prev.rating === rating ? prev.ratedAt : now,
    updatedAt: now,
  };
  const pilots = prune([...table.pilots.filter((p) => p.id !== sub.id), entry], sub.id).sort(byRank);
  return { ok: true, table: { version: 1, pilots }, entry, place: pilots.indexOf(entry) + 1 };
}

/** The top of the ladder without ids or secrets. */
export function publicLadder(table: LadderTable): PublicPilot[] {
  return [...table.pilots].sort(byRank).slice(0, PUBLIC_TOP).map((p) => ({
    callsign: p.callsign, rating: p.rating, rank: rankFor(p.rating), updatedAt: p.updatedAt,
  }));
}

/** One-minute sliding window of a pilot's writes: may this one go through? */
export function takeWrite(times: readonly number[], now: number): { ok: boolean; times: number[] } {
  const recent = times.filter((t) => now - t < 60_000);
  if (recent.length >= WRITES_PER_MIN) return { ok: false, times: recent };
  return { ok: true, times: [...recent, now] };
}

/** Opt-out: drops the entry only when the secret matches. */
export function removeEntry(table: LadderTable, id: string, secretHash: string): LadderTable {
  const pilots = table.pilots.filter((p) => p.id !== id || !sameHash(p.secretHash, secretHash));
  return { version: 1, pilots };
}

function parseEntry(v: unknown): LadderEntry | null {
  if (!isRecord(v)) return null;
  const { id, secretHash, ratedAt, updatedAt } = v;
  const callsign = parseCallsign(v.callsign);
  const stats = parseStats(v.stats);
  if (typeof id !== 'string' || !ID.test(id) || typeof secretHash !== 'string' || secretHash.length === 0) return null;
  if (callsign === null || stats === null || !isTime(ratedAt) || !isTime(updatedAt)) return null;
  const clamped = clampStats(stats);
  return { id, secretHash, callsign, stats: clamped, rating: pilotRating(clamped), ratedAt, updatedAt };
}

/** Stored ladder.json → table; malformed and duplicate entries are dropped. */
export function parseTable(v: unknown): LadderTable {
  if (!isRecord(v) || !Array.isArray(v.pilots)) return emptyTable();
  const pilots: LadderEntry[] = [];
  for (const raw of v.pilots) {
    const e = parseEntry(raw);
    if (e && !pilots.some((p) => p.id === e.id)) pilots.push(e);
  }
  return { version: 1, pilots: pilots.sort(byRank) };
}
