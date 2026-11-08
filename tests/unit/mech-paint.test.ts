import { describe, expect, it } from 'vitest';
import { brush, cellAt, defaultPaint, fill, PAINT_CELLS, PAINT_SIZE, parsePaints, randomPaint, stripes } from '../../src/game/mech-paint';
import { defaultSave, parseSave } from '../../src/game/save';

// The mechs' camo (doc 87): a 16 × 16 tile of eight jungle colours, painted by hand.

const flat = (c: number): string => String(c).repeat(PAINT_CELLS);

describe('mech camo (doc 87)', () => {
  it('gives every mech its own default camo of several colours', () => {
    const p = defaultPaint('strider');
    expect(p).toHaveLength(PAINT_CELLS);
    expect(new Set(p.split('')).size).toBeGreaterThanOrEqual(3);
    expect(defaultPaint('titan')).not.toBe(p);
  });

  it('paints a round brush that wraps round the tile', () => {
    const p = brush(flat(1), 0, 0, 5, 2);
    expect(cellAt(p, 0, 0)).toBe(5);
    expect(cellAt(p, PAINT_SIZE - 1, 0)).toBe(5);
    expect(cellAt(p, 0, PAINT_SIZE - 1)).toBe(5);
    expect(cellAt(p, 3, 3)).toBe(1);
    expect(brush(flat(1), 4, 4, 2, 1).split('').filter((c) => c === '2')).toHaveLength(1);
  });

  it('fills the area of one colour only', () => {
    // A wall of colour 3 down column 8 splits the tile in two.
    const wall = Array.from({ length: PAINT_SIZE }).reduce<string>((acc, _, y) => brush(acc, 8, y, 3, 1), flat(0));
    const f = fill(wall, 2, 2, 6);
    expect(cellAt(f, 2, 2)).toBe(6);
    expect(cellAt(f, 0, 15)).toBe(6);
    expect(cellAt(f, 12, 2)).toBe(0);
    expect(cellAt(f, 8, 5)).toBe(3);
  });

  it('stamps stripes and random camo', () => {
    expect(new Set(stripes(0, 4).split(''))).toEqual(new Set(['0', '4']));
    expect(randomPaint(3)).toHaveLength(PAINT_CELLS);
    expect(randomPaint(3)).toBe(randomPaint(3));
  });

  it('reads back only well-formed paints of mechs', () => {
    const good = flat(2);
    expect(parsePaints({ strider: good, f16: good, titan: 'xyz', hornet: '9'.repeat(PAINT_CELLS) })).toEqual({ strider: good });
    expect(parsePaints(null)).toEqual({});
    expect(parseSave({ ...defaultSave(), mechPaint: { ranger: good } })?.mechPaint).toEqual({ ranger: good });
  });
});
