import { describe, expect, it } from 'vitest';
import { ENEMIES_7 } from '../../src/data/enemies-7';
import type { EnemyKind } from '../../src/data/types';
import { alienMono, STEPPE_BOX, STEPPE_PAL } from '../../src/render/enemies/steppe-pal';

// The alien steppe's army in detail (doc 115): the static sprites' sizes against the hit radii, the one-colour palettes.

const KINDS = Object.keys(ENEMIES_7) as (keyof typeof ENEMIES_7)[];

describe('Steppe enemy detail (doc 115)', () => {
  it('gives every kind of the army a static box sized to its hit radius', () => {
    expect(Object.keys(STEPPE_BOX).sort()).toEqual([...KINDS].sort());
    for (const k of KINDS) {
      const r = ENEMIES_7[k].radius;
      const [bx, by] = STEPPE_BOX[k];
      expect(Math.max(bx, by), k).toBeGreaterThanOrEqual(r * 0.6);
      expect(Math.max(bx, by), k).toBeLessThanOrEqual(r * 1.7);
    }
  });

  it('paints a silhouette in one colour: every colour of the mono palette the same', () => {
    const m = alienMono('#ffffff');
    expect(m.mono).toBe(true);
    const colours = Object.entries(m).filter(([key]) => key !== 'mono').map(([, v]) => v);
    expect(new Set(colours)).toEqual(new Set(['#ffffff']));
  });

  it('keeps one faction look: every kind has its colours, none mono', () => {
    for (const k of KINDS) {
      const p = STEPPE_PAL[k as EnemyKind & keyof typeof STEPPE_PAL];
      expect(p.mono, k).toBe(false);
      expect(p.shell, k).toMatch(/^#/);
      expect(p.glow, k).toMatch(/^#/);
    }
  });
});
