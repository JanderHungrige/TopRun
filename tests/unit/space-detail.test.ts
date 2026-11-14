import { describe, expect, it } from 'vitest';
import { BOSSES_4 } from '../../src/data/bosses-4';
import { ENEMIES } from '../../src/data/enemies';
import { BOSS_BOX_4, SHIP_4 } from '../../src/render/bosses-4';
import { CUSTOM_MOUNTS } from '../../src/render/bosses-later';
import { rgbOf } from '../../src/render/enemies/space-kit';
import { shipMono, SPACE_BOX, SPACE_PAL, type SpaceKind } from '../../src/render/enemies/space-pal';

// Space's fleet and bosses in detail (doc 119): the static sprites' sizes against the hit radii, the one-colour palette,
// the bosses' cached hulls covering every hitbox and part, their own mounts.

const KINDS: readonly SpaceKind[] = ['raider', 'satgun', 'corvette', 'interceptor', 'gunship', 'battery', 'warden'];
const BOSS_IDS = Object.keys(BOSSES_4) as (keyof typeof BOSSES_4)[];

describe('Space enemy detail (doc 119)', () => {
  it('gives every kind of the fleet a static box sized to its hit radius', () => {
    expect(Object.keys(SPACE_BOX).sort()).toEqual([...KINDS].sort());
    for (const k of KINDS) {
      const r = ENEMIES[k].radius;
      const [bx, by] = SPACE_BOX[k];
      expect(Math.max(bx, by), k).toBeGreaterThanOrEqual(r * 0.6);
      expect(Math.max(bx, by), k).toBeLessThanOrEqual(r * 1.7);
    }
  });

  it('paints a silhouette in one colour: every colour of the mono palette the same', () => {
    const m = shipMono('#ffffff');
    expect(m.mono).toBe(true);
    const colours = Object.entries(m).filter(([key]) => key !== 'mono').map(([, v]) => v);
    expect(new Set(colours)).toEqual(new Set(['#ffffff']));
  });

  it('keeps each kind its colours, none mono', () => {
    for (const k of KINDS) {
      const p = SPACE_PAL[k];
      expect(p.mono, k).toBe(false);
      for (const c of [p.hull, p.dark, p.light, p.trim, p.metal, p.glass, p.engine]) expect(c, k).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('turns a paint into the "r,g,b" of its glows', () => {
    expect(rgbOf('#78beff')).toBe('120,190,255');
    expect(rgbOf('#000000')).toBe('0,0,0');
  });
});

describe('Space boss detail (doc 119)', () => {
  it('paints each hull in a box that covers all its hitboxes and parts', () => {
    expect(Object.keys(BOSS_BOX_4).sort()).toEqual([...BOSS_IDS].sort());
    for (const id of BOSS_IDS) {
      const [bx, by] = BOSS_BOX_4[id];
      for (const h of [...BOSSES_4[id].hitboxes, ...BOSSES_4[id].parts]) {
        expect(Math.abs(h.dx) + h.r, `${id} x`).toBeLessThanOrEqual(bx);
        expect(Math.abs(h.dy) + h.r, `${id} y`).toBeLessThanOrEqual(by);
      }
    }
  });

  it('gives every space boss its own palette and its own mounts', () => {
    for (const id of BOSS_IDS) {
      expect(SHIP_4[id].mono, id).toBe(false);
      expect(CUSTOM_MOUNTS[id], id).toBeTypeOf('function');
    }
  });
});
