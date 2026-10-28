import type { IncomingMessage } from 'node:http';
import { MAX_BOARD_BODY, parseOps } from '../../src/game/chalkboard-codec.ts';
import type { BoardRoom, BoardTable } from '../../src/game/chalkboard-room.ts';
import { parseIdentity, sameHash, type LadderTable } from '../../src/game/ladder.ts';
import { fail, hashSecret, readJson, reply, type Reply } from './reply.ts';
import type { Store } from './store.ts';

// The shared chalkboard on the ladder service (doc 40): GET what changed since a rev, POST strokes. Chalk needs a
// ladder pilot's id + secret; a wipe may come without one (everyone may wipe).

export const BOARD_PATH = '/api/ladder/board';
/** Posts per minute per pilot, and for all anonymous wipers together. */
export const BOARD_POSTS_PER_MIN = 40;
export const ANON_POSTS_PER_MIN = 120;

export interface BoardDeps {
  ladder: Store<LadderTable>;
  board: Store<BoardTable>;
  room: BoardRoom;
  now(): number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** An untrusted rev → a whole number, or null (then the reply carries the whole board). */
function parseSince(v: unknown): number | null {
  const n = typeof v === 'string' && /^\d{1,15}$/.test(v) ? Number(v) : v;
  return Number.isInteger(n) && (n as number) >= 0 ? (n as number) : null;
}

type Who = { ok: true; by: string | null } | { ok: false; reply: Reply };

/** Who posts: nobody (no id / secret), or a ladder pilot whose secret matches. */
function identify(v: Record<string, unknown>, ladder: LadderTable): Who {
  if (v.id === undefined && v.secret === undefined) return { ok: true, by: null };
  const who = parseIdentity({ id: v.id, secret: v.secret });
  if (!who) return { ok: false, reply: fail(400, 'invalid') };
  const entry = ladder.pilots.find((p) => p.id === who.id);
  if (!entry) return { ok: false, reply: fail(403, 'ladder-only') };
  if (!sameHash(entry.secretHash, hashSecret(who.secret))) return { ok: false, reply: fail(403, 'secret') };
  return { ok: true, by: who.id };
}

/** A sliding one-minute window per key. */
function limiter(now: () => number): (key: string, max: number) => boolean {
  const posts = new Map<string, number[]>();
  return (key, max) => {
    const t = now();
    if (posts.size > 5000) for (const [k, v] of posts) if (v.every((at) => t - at >= 60_000)) posts.delete(k);
    const recent = (posts.get(key) ?? []).filter((at) => t - at < 60_000);
    const ok = recent.length < max;
    if (ok) recent.push(t);
    posts.set(key, recent);
    return ok;
  };
}

async function post(req: IncomingMessage, d: BoardDeps, allow: (key: string, max: number) => boolean): Promise<Reply> {
  const body = await readJson(req, MAX_BOARD_BODY);
  if (!body.ok) return body.reply;
  if (!isRecord(body.value)) return fail(400, 'invalid');
  const ops = parseOps(body.value.ops);
  if (!ops) return fail(400, 'invalid');
  const who = identify(body.value, d.ladder.get());
  if (!who.ok) return who.reply;
  if (who.by === null && ops.some((op) => op.t === 'c')) return fail(403, 'ladder-only');
  if (!(who.by === null ? allow('~anon', ANON_POSTS_PER_MIN) : allow(who.by, BOARD_POSTS_PER_MIN))) return fail(429, 'slow-down');
  d.room.apply(ops, who.by, d.now());
  d.board.set(d.room.table());
  return reply(200, d.room.since(parseSince(body.value.since)));
}

/** The board's routes: a reply for BOARD_PATH, or null for any other path. */
export function boardRoutes(d: BoardDeps): (req: IncomingMessage, url: URL) => Promise<Reply> | Reply | null {
  const allow = limiter(d.now);
  return (req, url) => {
    if (url.pathname !== BOARD_PATH) return null;
    if (req.method === 'GET' || req.method === 'HEAD') return reply(200, d.room.since(parseSince(url.searchParams.get('since'))));
    return req.method === 'POST' ? post(req, d, allow) : fail(405, 'method');
  };
}
