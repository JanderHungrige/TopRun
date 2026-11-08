import { describe, expect, it } from 'vitest';
import { BASE_LIGHTS, lightAfterMission, randomLight } from '../../src/game/base-light';

// The carrier base's light (doc 91): day, evening or night, drawn at random after every mission of maps 1–2.

describe('Carrier base light (doc 91)', () => {
  it('spreads the random draw evenly over day, evening and night', () => {
    expect(BASE_LIGHTS).toEqual(['day', 'evening', 'night']);
    expect([0, 0.2, 0.34, 0.5, 0.67, 0.99].map(randomLight)).toEqual(['day', 'day', 'evening', 'evening', 'night', 'night']);
    expect(randomLight(1)).toBe('night');
    expect(randomLight(-0.1)).toBe('day');
  });

  it('draws a new light after a mission of maps 1–3 (the carrier lounge, the helicopter base, doc 92)', () => {
    expect(lightAfterMission(1, 'night', 0.1)).toBe('day');
    expect(lightAfterMission(2, 'day', 0.5)).toBe('evening');
    expect(lightAfterMission(2, 'night', 0.9)).toBe('night');
    expect(lightAfterMission(3, 'night', 0.1)).toBe('day');
  });

  it('keeps the light after a mission of any other map', () => {
    for (const c of [4, 5, 6] as const) expect(lightAfterMission(c, 'evening', 0.95)).toBe('evening');
  });
});
