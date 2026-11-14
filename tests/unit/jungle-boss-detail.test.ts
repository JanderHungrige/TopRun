import { describe, expect, it } from 'vitest';
import { BOSSES_6 } from '../../src/data/bosses-6';
import { BOSS_BOX_6, JUNGLE_6, liveOf, PALS_6 } from '../../src/render/bosses-6';
import { HULLS_6 } from '../../src/render/bosses-6c';
import { CUSTOM_MOUNTS } from '../../src/render/bosses-later';

// The jungle planet's bosses in detail (doc 118): the cached hull covers every hitbox and part; their parts get the
// world's own mounts; the moving parts go one colour while the boss flashes.

const IDS = Object.keys(BOSSES_6) as (keyof typeof BOSSES_6)[];

describe('Jungle boss detail (doc 118)', () => {
  it('paints each hull in a box that covers all its hitboxes and parts', () => {
    expect(Object.keys(BOSS_BOX_6).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      const [bx, by] = BOSS_BOX_6[id];
      for (const h of [...BOSSES_6[id].hitboxes, ...BOSSES_6[id].parts]) {
        expect(Math.abs(h.dx) + h.r, `${id} x`).toBeLessThanOrEqual(bx);
        expect(Math.abs(h.dy) + h.r, `${id} y`).toBeLessThanOrEqual(by);
      }
    }
  });

  it('has a hull for every boss and draws their parts with the jungle\'s own mounts', () => {
    for (const id of IDS) {
      expect(HULLS_6[id], id).toBeTypeOf('function');
      expect(CUSTOM_MOUNTS[id], id).toBeTypeOf('function');
    }
  });

  it('gives the moving parts the boss colours, or one colour while it flashes', () => {
    for (const id of IDS) {
      expect(liveOf(id, PALS_6[id])).toBe(JUNGLE_6[id]);
      expect(JUNGLE_6[id].body, id).toBe(PALS_6[id].body);
      const flash = liveOf(id, { ...PALS_6[id], body: '#ffffff', mono: true });
      expect(flash.mono, id).toBe(true);
      expect(new Set(Object.entries(flash).filter(([k]) => k !== 'mono').map(([, v]) => v)), id).toEqual(new Set(['#ffffff']));
    }
  });
});
