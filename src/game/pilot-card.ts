// The pilot ID card (doc 08): the pilot code rides inside the card's PNG as a tEXt chunk (keyword
// `TopGunPilotCode`, inserted right before IEND), so opening the card restores the pilot. Pure byte work on
// Uint8Arrays; reading never throws and only accepts a chunk whose CRC-32 is intact.

export const CARD_KEYWORD = 'TopGunPilotCode';
const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const;

const CRC_TABLE: readonly number[] = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** CRC-32 as PNG uses it (ISO 3309). */
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** The card's download name: `topgun-<callsign>.png` (umlauts spelt out, anything else a dash). */
export function cardFileName(callsign: string): string {
  const slug = callsign.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `topgun-${slug || 'pilot'}.png`;
}

export const isPng = (bytes: Uint8Array): boolean => bytes.length >= 8 && SIGNATURE.every((v, i) => bytes[i] === v);

const latin1 = (s: string): Uint8Array => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);
const fromLatin1 = (b: Uint8Array): string => Array.from(b, (c) => String.fromCharCode(c)).join('');

interface Chunk { at: number; type: string; data: Uint8Array; crcOk: boolean }

/** The chunks of a PNG in order (stops at the first one that runs past the end). */
function chunks(png: Uint8Array): Chunk[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const out: Chunk[] = [];
  for (let at = 8; at + 12 <= png.length;) {
    const len = view.getUint32(at);
    if (at + 12 + len > png.length) break;
    const typeAndData = png.subarray(at + 4, at + 8 + len);
    out.push({
      at, type: fromLatin1(png.subarray(at + 4, at + 8)), data: png.subarray(at + 8, at + 8 + len),
      crcOk: view.getUint32(at + 8 + len) === crc32(typeAndData),
    });
    at += 12 + len;
  }
  return out;
}

function textChunk(keyword: string, text: string): Uint8Array {
  const body = latin1(`${keyword}\0${text}`);
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  out.set(latin1('tEXt'), 4);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

/** The PNG with the pilot code added right before IEND; null when it is not a PNG with an IEND chunk. */
export function embedPilotCode(png: Uint8Array, code: string): Uint8Array | null {
  if (!isPng(png)) return null;
  const end = chunks(png).find((c) => c.type === 'IEND');
  if (!end) return null;
  const chunk = textChunk(CARD_KEYWORD, code);
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, end.at), 0);
  out.set(chunk, end.at);
  out.set(png.subarray(end.at), end.at + chunk.length);
  return out;
}

/** The pilot code inside a card, or null (not a PNG, no such chunk, or a damaged one). */
export function readPilotCode(png: Uint8Array): string | null {
  if (!isPng(png)) return null;
  for (const c of chunks(png)) {
    if (c.type !== 'tEXt' || !c.crcOk) continue;
    const text = fromLatin1(c.data);
    const sep = text.indexOf('\0');
    if (sep >= 0 && text.slice(0, sep) === CARD_KEYWORD) return text.slice(sep + 1);
  }
  return null;
}
