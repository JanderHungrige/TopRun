import { createHash } from 'node:crypto';
import type { IncomingMessage, RequestListener, ServerResponse } from 'node:http';
import {
  applySubmission, MAX_BODY, parseIdentity, parseSubmission, publicLadder, removeEntry, takeWrite, type LadderTable,
} from '../../src/game/ladder.ts';
import { rankFor } from '../../src/game/rating.ts';
import { log } from './log.ts';
import type { Store } from './store.ts';

// HTTP surface of the ladder service (doc 27). Request bodies are untrusted and never logged.

export const LADDER_PATH = '/api/ladder';
export const HEALTH_PATH = '/api/ladder/health';

export const hashSecret = (secret: string): string => createHash('sha256').update(secret).digest('hex');

interface Reply {
  status: number;
  body: unknown;
}
const reply = (status: number, body: unknown): Reply => ({ status, body });
const fail = (status: number, error: string): Reply => reply(status, { error });

type Body = { ok: true; value: unknown } | { ok: false; reply: Reply };

async function readJson(req: IncomingMessage): Promise<Body> {
  if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) return { ok: false, reply: fail(415, 'json-only') };
  if (Number(req.headers['content-length'] ?? 0) > MAX_BODY) return { ok: false, reply: fail(413, 'too-large') };
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY) return { ok: false, reply: fail(413, 'too-large') };
    chunks.push(chunk);
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch {
    return { ok: false, reply: fail(400, 'bad-json') };
  }
}

const lastUpdate = (t: LadderTable): number => t.pilots.reduce((at, p) => Math.max(at, p.updatedAt), 0);

function send(res: ServerResponse, r: Reply, head: boolean): void {
  const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
  res.writeHead(r.status, {
    'Content-Type': typeof r.body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(r.status >= 400 ? { Connection: 'close' } : {}),
  });
  res.end(head ? undefined : text);
}

/** The request handler; `now` is injectable for tests. */
export function ladderHandler(store: Store, now: () => number = Date.now): RequestListener {
  const writes = new Map<string, number[]>();
  const allow = (id: string): boolean => {
    const t = now();
    if (writes.size > 5000) for (const [k, v] of writes) if (v.every((at) => t - at >= 60_000)) writes.delete(k);
    const r = takeWrite(writes.get(id) ?? [], t);
    writes.set(id, r.times);
    return r.ok;
  };

  async function submit(req: IncomingMessage): Promise<Reply> {
    const body = await readJson(req);
    if (!body.ok) return body.reply;
    const sub = parseSubmission(body.value);
    if (!sub) return fail(400, 'invalid');
    if (!allow(sub.id)) return fail(429, 'slow-down');
    const r = applySubmission(store.get(), sub, hashSecret(sub.secret), now());
    if (!r.ok) return fail(r.status, r.reason);
    store.set(r.table);
    return reply(200, { place: r.place, rating: r.entry.rating, rank: rankFor(r.entry.rating) });
  }

  async function remove(req: IncomingMessage): Promise<Reply> {
    const body = await readJson(req);
    if (!body.ok) return body.reply;
    const who = parseIdentity(body.value);
    if (!who) return fail(400, 'invalid');
    if (!allow(who.id)) return fail(429, 'slow-down');
    const before = store.get();
    const after = removeEntry(before, who.id, hashSecret(who.secret));
    if (after.pilots.length !== before.pilots.length) store.set(after);
    return reply(200, { removed: after.pilots.length !== before.pilots.length });
  }

  async function route(req: IncomingMessage): Promise<Reply> {
    const path = (req.url ?? '').split('?')[0];
    const read = req.method === 'GET' || req.method === 'HEAD';
    if (path === HEALTH_PATH) return read ? reply(200, 'ok') : fail(405, 'method');
    if (path !== LADDER_PATH) return fail(404, 'not-found');
    if (read) return reply(200, { pilots: publicLadder(store.get()), updatedAt: lastUpdate(store.get()) });
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
