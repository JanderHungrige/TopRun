import { describe, expect, it } from 'vitest';
import { BOSSES_5 } from '../../src/data/bosses-5';
import { ENEMIES } from '../../src/data/enemies';
import { BOSS_BOX_5, PALS_5, SEA_5 } from '../../src/render/bosses-5';
import { CUSTOM_MOUNTS } from '../../src/render/bosses-later';
import { rgb, SEA_BOX, SEA_PAL, seaMono, type SeaKind } from '../../src/render/enemies/sea-pal';

// Under the sea in detail (doc 120): the cached bodies' sizes against the hit radii, the one-colour palette, the bosses'
// cached hulls covering every hitbox and part, and their own mounts.

const KINDS: readonly SeaKind[] = ['minisub', 'seadrone', 'seamine', 'seaturret', 'jelly', 'eel', 'hunter', 'torpboat', 'squid', 'crab', 'sealab', 'angler', 'boomer'];
const IDS = Object.keys(BOSSES_5) as (keyof typeof BOSSES_5)[];

describe('Sea enemy detail (doc 120)', () => {
  it('gives each of the 13 kinds a cached body box sized to its hit radius', () => {
    expect(Object.keys(SEA_BOX).sort()).toEqual([...KINDS].sort());
    for (const k of KINDS) {
      const r = ENEMIES[k].radius;
      const [bx, by] = SEA_BOX[k];
      expect(Math.max(bx, by), k).toBeGreaterThanOrEqual(r * 0.6);
      expect(Math.max(bx, by), k).toBeLessThanOrEqual(r * 1.7);
    }
  });

  it('paints a silhouette in one colour: every colour of the mono palette the same', () => {
    const m = seaMono('#ffffff');
    expect(m.mono).toBe(true);
    const colours = Object.entries(m).filter(([key]) => key !== 'mono').map(([, v]) => v);
    expect(new Set(colours)).toEqual(new Set(['#ffffff']));
  });

  it('keeps each kind its own live colours (none mono, every paint a hex colour)', () => {
    for (const k of KINDS) {
      const p = SEA_PAL[k];
      expect(p.mono, k).toBe(false);
      for (const c of [p.hull, p.dark, p.light, p.trim, p.metal, p.glass, p.glow]) expect(c, k).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('reads a colour as r,g,b for glows', () => {
    expect(rgb('#ff5a4a')).toBe('255,90,74');
    expect(rgb('#000000')).toBe('0,0,0');
  });
});

describe('Sea boss detail (doc 120)', () => {
  it('paints each hull in a box that covers all its hitboxes and parts', () => {
    expect(Object.keys(BOSS_BOX_5).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      const [bx, by] = BOSS_BOX_5[id];
      for (const h of [...BOSSES_5[id].hitboxes, ...BOSSES_5[id].parts]) {
        expect(Math.abs(h.dx) + h.r, `${id} x`).toBeLessThanOrEqual(bx);
        expect(Math.abs(h.dy) + h.r, `${id} y`).toBeLessThanOrEqual(by);
      }
    }
  });

  it('derives each hull palette from its boss colours', () => {
    for (const id of IDS) {
      expect(SEA_5[id].hull, id).toBe(PALS_5[id].body);
      expect(SEA_5[id].mono, id).toBe(false);
    }
  });

  it('draws every sea boss\'s parts with the sea\'s own mounts', () => {
    for (const id of IDS) expect(CUSTOM_MOUNTS[id], id).toBeTypeOf('function');
  });
});
