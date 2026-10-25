import { RANK_IDS, type RankId } from '../data/ranks';
import { validateCallsign } from './callsign';
import { LADDER_AVATARS, type LadderAvatar, type PublicPilot } from './ladder';
import type { Medal } from './minigames/core';
import type { RatingStats } from './rating';
import type { SaveData } from './save';

// The browser's half of the online ladder (doc 28): what a pilot reports, and their ladder identity. Pure.

/** A pilot's entry on the online ladder; kept in the save. `share` = show this pilot on the ladder. */
export interface LadderLink {
  id: string;
  secret: string;
  share: boolean;
}

/** Stats for the pilot rating. `tiers` = medal tier of each built minigame's personal best. */
export function ladderStats(save: SaveData, tiers: readonly (Medal | null)[], medals: number, kills: number): RatingStats {
  const count = (m: Medal): number => tiers.filter((t) => t === m).length;
  const stars = Object.values(save.progress).reduce((sum, p) => sum + p.stars, 0);
  return { stars, medals, kills, golds: count('gold'), silvers: count('silver'), bronzes: count('bronze') };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url without padding. */
function b64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let c = 0; c < chars; c++) out += B64[(n >> (18 - 6 * c)) & 63];
  }
  return out;
}

/** A ladder id (public key of the entry) and secret, from 48 random bytes. */
export function ladderIdentity(random: Uint8Array): { id: string; secret: string } {
  if (random.length < 48) throw new Error('ladderIdentity needs 48 random bytes');
  return { id: `p_${b64url(random.slice(0, 16))}`, secret: b64url(random.slice(16, 48)) };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Untrusted save JSON → link, or null (the pilot gets a new one on the next save). */
export function parseLadderLink(v: unknown): LadderLink | null {
  if (!isRecord(v)) return null;
  const { id, secret, share } = v;
  if (typeof id !== 'string' || !/^p_[A-Za-z0-9_-]{22}$/.test(id)) return null;
  if (typeof secret !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(secret) || typeof share !== 'boolean') return null;
  return { id, secret, share };
}

/** The save with a ladder link; `random` is only called when the pilot has none yet. */
export function withLadderLink(save: SaveData, random: () => Uint8Array): SaveData {
  if (save.ladder) return save;
  return { ...save, ladder: { ...ladderIdentity(random()), share: true } };
}

export interface LadderView {
  pilots: PublicPilot[];
  updatedAt: number;
}

export interface PostReply {
  place: number;
  rating: number;
  rank: RankId;
}

const isRank = (v: unknown): v is RankId => RANK_IDS.some((r) => r === v);
const isAvatar = (v: unknown): v is LadderAvatar => LADDER_AVATARS.some((a) => a === v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

function parsePilot(v: unknown): PublicPilot | null {
  if (!isRecord(v)) return null;
  const { callsign, avatar, rating, rank, updatedAt } = v;
  if (typeof callsign !== 'string' || validateCallsign(callsign, []) !== 'ok' || !isAvatar(avatar)) return null;
  if (!isCount(rating) || !isRank(rank) || !isCount(updatedAt)) return null;
  return { callsign, avatar, rating, rank, updatedAt };
}

/** The service's GET answer (untrusted network JSON) → view; bad rows are dropped, a bad answer is null. */
export function parseLadderView(v: unknown): LadderView | null {
  if (!isRecord(v) || !Array.isArray(v.pilots) || !isCount(v.updatedAt)) return null;
  const pilots = v.pilots.slice(0, 200).map(parsePilot).filter((p): p is PublicPilot => p !== null);
  return { pilots, updatedAt: v.updatedAt };
}

export function parsePostReply(v: unknown): PostReply | null {
  if (!isRecord(v)) return null;
  const { place, rating, rank } = v;
  return isCount(place) && place > 0 && isCount(rating) && isRank(rank) ? { place, rating, rank } : null;
}
