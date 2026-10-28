import { parseBoardReply, type BoardReply } from '../game/chalkboard-codec';
import type { Op } from '../game/chalkboard-ops';

// The shared chalkboard on the ladder service (doc 40), on the game's own origin. A failure is a result, never a throw:
// status 0 = offline / no answer / a reply that does not parse.

const TIMEOUT_MS = 6000;
const endpoint = (path: string): string => new URL(path, document.baseURI).href;

export type BoardResult = { ok: true; reply: BoardReply } | { ok: false; status: number; reason: string | null };

export interface BoardPost {
  id?: string;
  secret?: string;
  since: number;
  ops: readonly Op[];
}

const reasonOf = (v: unknown): string | null =>
  typeof v === 'object' && v !== null && 'error' in v && typeof v.error === 'string' ? v.error : null;

async function call(method: 'GET' | 'POST', path: string, body?: BoardPost): Promise<BoardResult> {
  try {
    const res = await fetch(endpoint(path), {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) return { ok: false, status: res.status, reason: reasonOf(json) };
    const reply = parseBoardReply(json);
    return reply ? { ok: true, reply } : { ok: false, status: 0, reason: 'invalid' };
  } catch {
    return { ok: false, status: 0, reason: null };
  }
}

/** What changed after `since` (null: the whole board). */
export const fetchBoard = (since: number | null): Promise<BoardResult> =>
  call('GET', since === null ? 'api/ladder/board' : `api/ladder/board?since=${since}`);

export const postBoard = (post: BoardPost): Promise<BoardResult> => call('POST', 'api/ladder/board', post);
