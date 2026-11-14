import { describe, expect, it } from 'vitest';
import { mix, shade } from '../../src/render/detail/color';
import { scaleBucket, spriteKey, variantOf } from '../../src/render/detail/sprite';

// The detail kit (doc 113): colour maths, the scale a sprite is painted at, and which variant a palette asks for.

describe('Detail kit — colours (doc 113)', () => {
  it('mixes toward white for k > 0 and toward black for k < 0', () => {
    expect(shade('#808080', 0)).toBe('#808080');
    expect(shade('#808080', 1)).toBe('#ffffff');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#204060', 0.5)).toBe('#90a0b0');
    expect(shade('#204060', -0.5)).toBe('#102030');
  });

  it('clamps k and reads short hex', () => {
    expect(shade('#fff', 2)).toBe('#ffffff');
    expect(shade('#abc', -3)).toBe('#000000');
  });

  it('mixes two colours linearly', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000');
    expect(mix('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });
});

describe('Detail kit — sprites (doc 113)', () => {
  it('paints at the transform\'s scale in half steps, never below 1', () => {
    expect(scaleBucket(1, 0, 0, 1)).toBe(1);
    expect(scaleBucket(0.5, 0, 0, 0.5)).toBe(1);
    expect(scaleBucket(1.3, 0, 0, 1.3)).toBe(1.5);
    expect(scaleBucket(2, 0, 0, 2)).toBe(2);
    expect(scaleBucket(0, 3, -3, 0)).toBe(3); // rotated by 90°
    expect(scaleBucket(2.1, 0, 0, 1)).toBe(2.5);
  });

  it('picks the variant from mono and live', () => {
    expect(variantOf({ mono: true, live: true, body: '#ffffff' })).toEqual({ kind: 'mono', colour: '#ffffff' });
    expect(variantOf({ mono: true, live: false, body: '#000000' })).toEqual({ kind: 'mono', colour: '#000000' });
    expect(variantOf({ mono: false, live: false, body: '#2e2a26' })).toEqual({ kind: 'burnt' });
    expect(variantOf({ mono: false, live: true, body: '#5d6838' })).toEqual({ kind: 'live' });
  });

  it('keys a sprite by art, variant (mono colours apart) and scale', () => {
    const keys = [
      spriteKey('crawler', { kind: 'live' }, 1),
      spriteKey('crawler', { kind: 'live' }, 2),
      spriteKey('crawler', { kind: 'burnt' }, 1),
      spriteKey('crawler', { kind: 'mono', colour: '#ffffff' }, 1),
      spriteKey('crawler', { kind: 'mono', colour: '#000000' }, 1),
      spriteKey('trooper', { kind: 'live' }, 1),
    ];
    expect(new Set(keys).size).toBe(keys.length);
    expect(spriteKey('crawler', { kind: 'live' }, 1)).toBe(spriteKey('crawler', { kind: 'live' }, 1));
  });
});
