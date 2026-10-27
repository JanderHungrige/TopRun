import { parseCloudSave, parsePilotMatches } from '../game/cloud-pilot';
import type { Submission } from '../game/ladder';
import type { PilotMatch } from '../game/ladder-cloud';
import { parseLadderView, parsePostReply, type LadderView, type PostReply } from '../game/ladder-stats';
import type { SaveData } from '../game/save';

// The online ladder service (docs 27, 34) on the game's own origin. Every failure is null / false:
// the game never waits for or breaks on the ladder.

const TIMEOUT_MS = 6000;
const endpoint = (path: string): string => new URL(path, document.baseURI).href;

async function call(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  try {
    const res = await fetch(endpoint(path), {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export const fetchLadder = async (): Promise<LadderView | null> => parseLadderView(await call('GET', 'api/ladder'));

export const postPilot = async (sub: Submission): Promise<PostReply | null> => parsePostReply(await call('POST', 'api/ladder', sub));

export async function deletePilot(id: string, secret: string): Promise<boolean> {
  const r = await call('DELETE', 'api/ladder', { id, secret });
  return typeof r === 'object' && r !== null && 'removed' in r && r.removed === true;
}

/** Keeps the pilot's whole save next to its ladder entry (doc 34). */
export async function putSave(id: string, secret: string, save: SaveData): Promise<boolean> {
  const r = await call('PUT', 'api/ladder/save', { id, secret, save });
  return typeof r === 'object' && r !== null && 'savedAt' in r;
}

/** The pilots with exactly this callsign that have a cloud save. */
export const findCloudPilots = async (callsign: string): Promise<PilotMatch[] | null> =>
  parsePilotMatches(await call('GET', `api/ladder/pilots?callsign=${encodeURIComponent(callsign)}`));

/** A pilot's cloud save, checked to belong to `ref`; null when there is none or the service is slow. */
export const fetchCloudSave = async (ref: string, timeoutMs = TIMEOUT_MS): Promise<SaveData | null> =>
  parseCloudSave(await call('GET', `api/ladder/save?ref=${encodeURIComponent(ref)}`, undefined, timeoutMs), ref);
