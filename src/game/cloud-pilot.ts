import { RANK_IDS, type RankId } from '../data/ranks';
import { lookPreset } from './avatar-look';
import { validateCallsign } from './callsign';
import { isLadderId, parseAvatar, parseCountry } from './ladder';
import type { PilotMatch } from './ladder-cloud';
import { ladderFace } from './ladder-stats';
import type { AvatarId, Profile } from './profiles';
import { parseSave, type SaveData } from './save';

// Cloud pilots in the browser (doc 34): read the callsign lookup and a downloaded save defensively, turn them into
// a profile, and decide whether another device is further. Pure.

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isRank = (v: unknown): v is RankId => RANK_IDS.some((r) => r === v);

function parseMatch(v: unknown): PilotMatch | null {
  if (!isRecord(v)) return null;
  const { ref, callsign, rank, rating, savedAt } = v;
  if (!isLadderId(ref) || typeof callsign !== 'string' || validateCallsign(callsign, []) !== 'ok') return null;
  if (!isRank(rank) || !isCount(rating) || !isCount(savedAt)) return null;
  return { ref, callsign, avatar: parseAvatar(v.avatar), country: parseCountry(v.country), rank, rating, savedAt };
}

/** The service's lookup answer (untrusted) → matches; bad rows are dropped, a bad answer is null. */
export function parsePilotMatches(v: unknown): PilotMatch[] | null {
  if (!isRecord(v) || !Array.isArray(v.pilots)) return null;
  return v.pilots.slice(0, 10).map(parseMatch).filter((m): m is PilotMatch => m !== null);
}

/** A downloaded save (untrusted) → save, only when it parses and belongs to the chosen ladder entry. */
export function parseCloudSave(v: unknown, ref: string): SaveData | null {
  if (!isRecord(v)) return null;
  const save = parseSave(v.save);
  return save && save.ladder?.id === ref ? save : null;
}

/** The preset a pilot is filed under: the ladder's preset id, or the built look's preset (doc 29). */
function presetOf(avatar: string | null, save: SaveData): AvatarId {
  const face = ladderFace(avatar);
  if (typeof face === 'string') return face;
  return save.look ? lookPreset(save.look) : 'pilot1';
}

/** The loaded pilot: replaces the one on this device with the same ladder entry, else joins under `newId`. */
export function cloudProfile(match: PilotMatch, save: SaveData, profiles: readonly Profile[], newId: string, now: number): Profile {
  const mine = profiles.find((p) => p.save.ladder?.id === match.ref);
  return { id: mine?.id ?? newId, callsign: match.callsign, avatar: presetOf(match.avatar, save), createdAt: mine?.createdAt ?? now, playedAt: now, save };
}

/** Is the cloud copy further than this device (doc 26 rating)? Then the pilot pick offers it. */
export const cloudIsAhead = (local: SaveData, cloud: SaveData, rating: (s: SaveData) => number): boolean => rating(cloud) > rating(local);
