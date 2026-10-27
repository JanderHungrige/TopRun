import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Replies and request bodies of the ladder service (docs 27, 34). Bodies are untrusted and never logged.

export interface Reply {
  status: number;
  body: unknown;
}

export const reply = (status: number, body: unknown): Reply => ({ status, body });
export const fail = (status: number, error: string): Reply => reply(status, { error });

export const hashSecret = (secret: string): string => createHash('sha256').update(secret).digest('hex');

export type Body = { ok: true; value: unknown } | { ok: false; reply: Reply };

/** The JSON body of a request, at most `limit` bytes. */
export async function readJson(req: IncomingMessage, limit: number): Promise<Body> {
  if (!/^application\/json\b/i.test(req.headers['content-type'] ?? '')) return { ok: false, reply: fail(415, 'json-only') };
  if (Number(req.headers['content-length'] ?? 0) > limit) return { ok: false, reply: fail(413, 'too-large') };
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) return { ok: false, reply: fail(413, 'too-large') };
    chunks.push(chunk);
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString('utf8')) };
  } catch {
    return { ok: false, reply: fail(400, 'bad-json') };
  }
}

export function send(res: ServerResponse, r: Reply, head: boolean): void {
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
