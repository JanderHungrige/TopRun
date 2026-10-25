import type { Submission } from '../game/ladder';
import { parseLadderView, parsePostReply, type LadderView, type PostReply } from '../game/ladder-stats';

// The online ladder service (doc 27) on the game's own origin. Every failure is null / false:
// the game never waits for or breaks on the ladder.

const TIMEOUT_MS = 6000;
const endpoint = (): string => new URL('api/ladder', document.baseURI).href;

async function call(method: 'GET' | 'POST' | 'DELETE', body?: unknown): Promise<unknown> {
  try {
    const res = await fetch(endpoint(), {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'omit',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export const fetchLadder = async (): Promise<LadderView | null> => parseLadderView(await call('GET'));

export const postPilot = async (sub: Submission): Promise<PostReply | null> => parsePostReply(await call('POST', sub));

export async function deletePilot(id: string, secret: string): Promise<boolean> {
  const r = await call('DELETE', { id, secret });
  return typeof r === 'object' && r !== null && 'removed' in r && r.removed === true;
}
