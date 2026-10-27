import type { IncomingMessage } from 'node:http';
import { isLadderId, type LadderTable } from '../../src/game/ladder.ts';
import {
  applyUpload, findPilots, MAX_SAVE_BODY, MAX_SAVE_BYTES, parseUpload, type SaveTable,
} from '../../src/game/ladder-cloud.ts';
import { fail, hashSecret, readJson, reply, type Reply } from './reply.ts';
import type { Store } from './store.ts';

// Cloud pilots on the ladder service (doc 34): keep a pilot's save next to its ladder entry, find pilots by callsign.

export const SAVE_PATH = '/api/ladder/save';
export const PILOTS_PATH = '/api/ladder/pilots';

export interface CloudDeps {
  ladder: Store<LadderTable>;
  saves: Store<SaveTable>;
  /** The per-pilot write limit of the ladder (doc 27). */
  allow(id: string): boolean;
  now(): number;
}

const tooBig = (v: unknown): boolean =>
  typeof v === 'object' && v !== null && 'save' in v && JSON.stringify(v.save).length > MAX_SAVE_BYTES;

async function upload(req: IncomingMessage, d: CloudDeps): Promise<Reply> {
  const body = await readJson(req, MAX_SAVE_BODY);
  if (!body.ok) return body.reply;
  if (tooBig(body.value)) return fail(413, 'too-large');
  const up = parseUpload(body.value);
  if (!up) return fail(400, 'invalid');
  if (!d.allow(up.id)) return fail(429, 'slow-down');
  const r = applyUpload(d.ladder.get(), d.saves.get(), up, hashSecret(up.secret), d.now());
  if (!r.ok) return fail(r.status, r.status === 403 ? 'secret' : 'no-pilot');
  d.saves.set(r.saves);
  return reply(200, { savedAt: r.savedAt });
}

function download(url: URL, d: CloudDeps): Reply {
  const ref = url.searchParams.get('ref');
  if (!isLadderId(ref)) return fail(400, 'invalid');
  const kept = d.saves.get().saves[ref];
  return kept ? reply(200, { save: kept.save, savedAt: kept.savedAt }) : fail(404, 'no-save');
}

/** The reply for a cloud path, or null when the path is not one of them. */
export function cloudRoute(req: IncomingMessage, url: URL, d: CloudDeps): Promise<Reply> | Reply | null {
  const read = req.method === 'GET' || req.method === 'HEAD';
  if (url.pathname === PILOTS_PATH) {
    return read ? reply(200, { pilots: findPilots(d.ladder.get(), d.saves.get(), url.searchParams.get('callsign') ?? '') }) : fail(405, 'method');
  }
  if (url.pathname !== SAVE_PATH) return null;
  if (read) return download(url, d);
  return req.method === 'PUT' ? upload(req, d) : fail(405, 'method');
}
