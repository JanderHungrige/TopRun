import { parseStore, type Profile } from './profiles';

// The pilot code (doc 08): a whole pilot as one line of text, so a save survives a cleared browser, a new
// device or a new site address without accounts. `TOPGUN1:<base64url(deflate-raw(JSON))>.<FNV-1a hex>`.
// Decoding is tolerant (whitespace and surrounding text are ignored) and never throws; the profile goes through
// the same validation as localStorage.

export const CODE_PREFIX = 'TOPGUN1:';
/** Longest text searched for a code, and the most the payload may inflate to (a full save is ~4 KB). */
const MAX_TEXT = 20_000;
const MAX_JSON = 256 * 1024;
const CODE = /TOPGUN1:([A-Za-z0-9_-]+)\.([0-9a-f]{8})/;

export type DecodeResult = { ok: true; profile: Profile } | { ok: false; reason: 'no-code' | 'checksum' | 'corrupt' | 'invalid' };

/** FNV-1a (32 bit) of the payload as 8 hex digits: catches a code cut short or mistyped. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array | null {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Inflates at most `MAX_JSON` bytes (a crafted code cannot blow up memory); null on bad data. */
async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const reader = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_JSON) {
        await reader.cancel();
        return null;
      }
      parts.push(value);
    }
    const out = new Uint8Array(size);
    let at = 0;
    for (const p of parts) {
      out.set(p, at);
      at += p.length;
    }
    return out;
  } catch {
    return null;
  }
}

export async function encodePilotCode(p: Profile): Promise<string> {
  const json = JSON.stringify({ v: 1, profile: p });
  const payload = toBase64Url(await deflate(new TextEncoder().encode(json)));
  return `${CODE_PREFIX}${payload}.${checksum(payload)}`;
}

function parsePayload(json: string): Profile | null {
  try {
    const raw: unknown = JSON.parse(json);
    if (typeof raw !== 'object' || raw === null || !('profile' in raw)) return null;
    return parseStore({ version: 1, profiles: [raw.profile] })?.profiles[0] ?? null;
  } catch {
    return null;
  }
}

/** Finds a pilot code anywhere in the text (line breaks and spaces inside it are fine) and reads it. */
export async function decodePilotCode(text: string): Promise<DecodeResult> {
  const compact = text.replace(/\s+/g, '');
  const m = compact.length <= MAX_TEXT ? CODE.exec(compact) : null;
  const payload = m?.[1];
  if (!m || payload === undefined) return { ok: false, reason: 'no-code' };
  if (checksum(payload) !== m[2]) return { ok: false, reason: 'checksum' };
  const bytes = fromBase64Url(payload);
  const json = bytes && (await inflate(bytes));
  if (!json) return { ok: false, reason: 'corrupt' };
  const profile = parsePayload(new TextDecoder().decode(json));
  return profile ? { ok: true, profile } : { ok: false, reason: 'invalid' };
}

