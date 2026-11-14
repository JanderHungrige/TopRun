import { describe, expect, it } from 'vitest';
import { BOSSES_7 } from '../../src/data/bosses-7';
import { BOSS_BOX_7 } from '../../src/render/bosses-7';
import { CUSTOM_MOUNTS } from '../../src/render/bosses-later';

// The alien steppe's bosses in detail (doc 116): the cached hull covers every hitbox and part; their parts get alien mounts.

const IDS = Object.keys(BOSSES_7) as (keyof typeof BOSSES_7)[];

describe('Steppe boss detail (doc 116)', () => {
  it('paints each hull in a box that covers all its hitboxes and parts', () => {
    expect(Object.keys(BOSS_BOX_7).sort()).toEqual([...IDS].sort());
    for (const id of IDS) {
      const [bx, by] = BOSS_BOX_7[id];
      for (const h of [...BOSSES_7[id].hitboxes, ...BOSSES_7[id].parts]) {
        expect(Math.abs(h.dx) + h.r, `${id} x`).toBeLessThanOrEqual(bx);
        expect(Math.abs(h.dy) + h.r, `${id} y`).toBeLessThanOrEqual(by);
      }
    }
  });

  it('draws the steppe bosses\' parts with their own mounts', () => {
    for (const id of IDS) expect(CUSTOM_MOUNTS[id], id).toBeTypeOf('function');
  });
});
