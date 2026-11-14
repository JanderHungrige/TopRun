import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CEREMONY_LAYERS } from '../../src/data/ceremony-layers';
import { CEREMONY_SETS } from '../../src/data/ceremony-sets';
import { stageOutfit, type CeremonySet } from '../../src/game/ceremony-stage';

// Ceremony looks (docs 98, 110): the jungle and steppe camps and the battle-station hangar, the officers in each world's uniform.

/** A PNG's width and height from its header. */
function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const OFFICERS = Object.values(CEREMONY_LAYERS).map((box) => box.file).filter((f) => f.startsWith('admiral') || f.startsWith('pilot'));

describe('Ceremony looks (doc 98)', () => {
  it('dresses the officers by the stage: dress uniforms on the deck and the pier, space and jungle kit elsewhere', () => {
    const sets: CeremonySet[] = ['deck', 'pier', 'hangar', 'camp', 'steppe'];
    expect(sets.map(stageOutfit)).toEqual(['dress', 'dress', 'space', 'jungle', 'steppe']);
  });

  it('has every admiral and pilot cut-out in the space, jungle and steppe uniform, the same size as the dress one', () => {
    expect(OFFICERS.length).toBeGreaterThanOrEqual(11);
    for (const f of OFFICERS) {
      const base = pngSize(`src/assets/ceremony/${f}.png`);
      for (const outfit of ['space', 'jungle', 'steppe']) {
        const path = `src/assets/ceremony/${f}-${outfit}.png`;
        expect(existsSync(path), path).toBe(true);
        expect(pngSize(path), path).toEqual(base);
      }
    }
  });

  it('replaces the jungle clearing with the camp', () => {
    expect(Object.keys(CEREMONY_SETS)).not.toContain('clearing');
    expect(existsSync('src/assets/ceremony/clearing.png')).toBe(false);
    expect(CEREMONY_SETS.camp.crew).not.toBeNull();
  });
});
