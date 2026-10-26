import { describe, expect, it } from 'vitest';
import { CARD_KEYWORD, cardFileName, crc32, embedPilotCode, isPng, readPilotCode } from '../../src/game/pilot-card';

// Doc 08: the pilot ID card carries the pilot code inside the PNG as a tEXt chunk.

/** A valid 1 × 1 grey PNG (signature, IHDR, IDAT, IEND). */
const TINY = Uint8Array.from(atob(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNoAAAAggCBd81ytgAAAABJRU5ErkJggg==',
), (c) => c.charCodeAt(0));

const CODE = 'TOPGUN1:ZZNtT9swEID_y302UtKwFvKtq9ZpogK0Tkwdqqprf.0123abcd';

/** The chunk types in order. */
function chunks(png: Uint8Array): string[] {
  const out: string[] = [];
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  for (let at = 8; at + 8 <= png.length;) {
    const len = view.getUint32(at);
    out.push(String.fromCharCode(...png.subarray(at + 4, at + 8)));
    at += 12 + len;
  }
  return out;
}

describe('pilot ID card', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it('recognises a PNG by its signature', () => {
    expect(isPng(TINY)).toBe(true);
    expect(isPng(new TextEncoder().encode('TOPGUN1:abc.12345678'))).toBe(false);
    expect(isPng(new Uint8Array())).toBe(false);
  });

  it('puts the code in a tEXt chunk right before IEND and reads it back', () => {
    const card = embedPilotCode(TINY, CODE);
    expect(card).not.toBeNull();
    if (!card) return;
    expect(chunks(card)).toEqual(['IHDR', 'IDAT', 'tEXt', 'IEND']);
    expect(card.subarray(0, TINY.length - 12)).toEqual(TINY.subarray(0, TINY.length - 12));
    expect(readPilotCode(card)).toBe(CODE);
  });

  it('writes a chunk with a valid CRC over its type and data', () => {
    const card = embedPilotCode(TINY, CODE);
    if (!card) throw new Error('no card');
    const at = TINY.length - 12;
    const view = new DataView(card.buffer, card.byteOffset);
    const len = view.getUint32(at);
    expect(len).toBe(CARD_KEYWORD.length + 1 + CODE.length);
    expect(view.getUint32(at + 8 + len)).toBe(crc32(card.subarray(at + 4, at + 8 + len)));
  });

  it('finds nothing in a plain PNG, a damaged chunk or something that is not a PNG', () => {
    expect(readPilotCode(TINY)).toBeNull();
    expect(readPilotCode(new TextEncoder().encode(CODE))).toBeNull();
    const card = embedPilotCode(TINY, CODE);
    if (!card) throw new Error('no card');
    const broken = card.slice();
    broken[TINY.length - 12 + 10] ^= 0xff;
    expect(readPilotCode(broken)).toBeNull();
    expect(readPilotCode(card.subarray(0, 30))).toBeNull();
  });

  it('names the download after the callsign', () => {
    expect(cardFileName('ICE-MAN 2')).toBe('topgun-ice-man-2.png');
    expect(cardFileName('JÄGER ÖL')).toBe('topgun-jaeger-oel.png');
    expect(cardFileName('--')).toBe('topgun-pilot.png');
  });

  it('refuses to embed into something that is not a PNG', () => {
    expect(embedPilotCode(new TextEncoder().encode('hello'), CODE)).toBeNull();
  });
});
