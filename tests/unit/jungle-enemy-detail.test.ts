import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/data/enemies';
import { variantFor } from '../../src/render/enemies/jungle-kit';
import { JUNGLE_BOX, JUNGLE_PAL, jungleMono, type JungleKind } from '../../src/render/enemies/jungle-pal';

// The jungle planet's enemies in detail (doc 117): the static sprites' sizes against the hit radii, the one-colour
// palettes, and the variant a moving part is drawn in.

const KINDS: readonly JungleKind[] = [
  'walker', 'brute', 'hovertank', 'artillery', 'gundrone', 'dropship', 'raptor', 'beetle', 'spitter', 'wasp',
  'sporepod', 'lasher', 'rhino', 'toad', 'spire', 'totem', 'lurker', 'glider', 'leatherwing', 'dragonfly', 'balloon', 'skyjelly',
];

describe('Jungle enemy detail (doc 117)', () => {
  it('gives every one of the 22 kinds a static box sized to its hit radius', () => {
    expect(Object.keys(JUNGLE_BOX).sort()).toEqual([...KINDS].sort());
    for (const k of KINDS) {
      const r = ENEMIES[k].radius;
      const [bx, by] = JUNGLE_BOX[k];
      expect(Math.max(bx, by), k).toBeGreaterThanOrEqual(r * 0.6);
      expect(Math.max(bx, by), k).toBeLessThanOrEqual(r * 1.7);
    }
  });

  it('paints a silhouette in one colour: every colour of the mono palette the same', () => {
    const m = jungleMono('#ffffff');
    expect(m.mono).toBe(true);
    const colours = Object.entries(m).filter(([key]) => key !== 'mono').map(([, v]) => v);
    expect(new Set(colours)).toEqual(new Set(['#ffffff']));
  });

  it('keeps each kind in its own colours, none mono', () => {
    expect(Object.keys(JUNGLE_PAL).sort()).toEqual([...KINDS].sort());
    for (const k of KINDS) {
      const p = JUNGLE_PAL[k];
      expect(p.mono, k).toBe(false);
      expect(p.body, k).toMatch(/^#[0-9a-f]{6}$/);
      expect(p.glow, k).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('draws a cached moving part live, flashed or as a shadow in one colour, sooted on a wreck', () => {
    expect(variantFor(JUNGLE_PAL.walker)).toEqual({ kind: 'live' });
    expect(variantFor(jungleMono('#ffffff'))).toEqual({ kind: 'mono', colour: '#ffffff' });
    expect(variantFor(jungleMono('#000000'))).toEqual({ kind: 'mono', colour: '#000000' });
    expect(variantFor(jungleMono('#2a2420'))).toEqual({ kind: 'burnt' }); // detailUnit's wreck colour
  });
});
