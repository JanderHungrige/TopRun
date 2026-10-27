import type { IncomingMessage, RequestListener } from 'node:http';
import {
  applySubmission, MAX_BODY, parseIdentity, parseSubmission, publicLadder, removeEntry, takeWrite, type LadderTable,
} from '../../src/game/ladder.ts';
import { pruneSaves, type SaveTable } from '../../src/game/ladder-cloud.ts';
import { rankFor } from '../../src/game/rating.ts';
import { cloudRoute } from './cloud-http.ts';
import { log } from './log.ts';
import { fail, hashSecret, readJson, reply, send, type Reply } from './reply.ts';
import type { Store } from './store.ts';

// HTTP surface of the ladder service (docs 27, 34). Request bodies are untrusted and never logged.

export const LADDER_PATH = '/api/ladder';
export const HEALTH_PATH = '/api/ladder/health';
export { hashSecret };

export interface Stores {
  ladder: Store<LadderTable>;
  saves: Store<SaveTable>;
}

const lastUpdate = (t: LadderTable): number => t.pilots.reduce((at, p) => Math.max(at, p.updatedAt), 0);

/** The request handler; `now` is injectable for tests. */
export function ladderHandler(stores: Stores, now: () => number = Date.now): RequestListener {
  const { ladder, saves } = stores;
  const writes = new Map<string, number[]>();
  const allow = (id: string): boolean => {
    const t = now();
    if (writes.size > 5000) for (const [k, v] of writes) if (v.every((at) => t - at >= 60_000)) writes.delete(k);
    const r = takeWrite(writes.get(id) ?? [], t);
    writes.set(id, r.times);
    return r.ok;
  };
  /** A new ladder table, and the cloud saves of pilots it no longer holds dropped with it. */
  const setLadder = (table: LadderTable): void => {
    ladder.set(table);
    const kept = pruneSaves(table, saves.get());
    if (kept !== saves.get()) saves.set(kept);
  };

  async function submit(req: IncomingMessage): Promise<Reply> {
    const body = await readJson(req, MAX_BODY);
    if (!body.ok) return body.reply;
    const sub = parseSubmission(body.value);
    if (!sub) return fail(400, 'invalid');
    if (!allow(sub.id)) return fail(429, 'slow-down');
    const r = applySubmission(ladder.get(), sub, hashSecret(sub.secret), now());
    if (!r.ok) return fail(r.status, r.reason);
    setLadder(r.table);
    return reply(200, { place: r.place, rating: r.entry.rating, rank: rankFor(r.entry.rating) });
  }

  async function remove(req: IncomingMessage): Promise<Reply> {
    const body = await readJson(req, MAX_BODY);
    if (!body.ok) return body.reply;
    const who = parseIdentity(body.value);
    if (!who) return fail(400, 'invalid');
    if (!allow(who.id)) return fail(429, 'slow-down');
    const before = ladder.get();
    const after = removeEntry(before, who.id, hashSecret(who.secret));
    if (after.pilots.length !== before.pilots.length) setLadder(after);
    return reply(200, { removed: after.pilots.length !== before.pilots.length });
  }

  async function route(req: IncomingMessage): Promise<Reply> {
    const url = new URL(req.url ?? '/', 'http://ladder');
    const read = req.method === 'GET' || req.method === 'HEAD';
    if (url.pathname === HEALTH_PATH) return read ? reply(200, 'ok') : fail(405, 'method');
    const cloud = cloudRoute(req, url, { ladder, saves, allow, now });
    if (cloud) return cloud;
    if (url.pathname !== LADDER_PATH) return fail(404, 'not-found');
    if (read) return reply(200, { pilots: publicLadder(ladder.get()), updatedAt: lastUpdate(ladder.get()) });
    if (req.method === 'POST') return submit(req);
    if (req.method === 'DELETE') return remove(req);
    return fail(405, 'method');
  }

  return (req, res) => {
    route(req).then(
      (r) => send(res, r, req.method === 'HEAD'),
      (err: unknown) => {
        log('error', 'request failed', { err: err instanceof Error ? err.message : 'unknown' });
        if (!res.headersSent) send(res, fail(500, 'internal'), false);
      },
    );
  };
}
