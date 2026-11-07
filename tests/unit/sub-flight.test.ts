import { describe, it, expect } from 'vitest';
import { PLANES } from '../../src/data/planes';
import { HELI_FLIGHT, heliVelocity } from '../../src/game/heli-flight';
import { specialRules } from '../../src/game/jets';
import { DRIFT, fleetVelocity, flightScroll, SONAR, sonarHits, sonarRadius, SUB_FLIGHT } from '../../src/game/sub-flight';

// Sub flight (doc 67): a slower world, a heavier glide, and the Type 212's sonar burst.

describe('Sub flight (doc 67)', () => {
  it('scrolls the seabed slower than the helicopters fly, the jets and the ship at full speed', () => {
    expect([1, 2, 3, 4, 5].map((c) => flightScroll(c as 1 | 2 | 3 | 4 | 5))).toEqual([1, 1, HELI_FLIGHT.scroll, 1, SUB_FLIGHT.scroll]);
    expect(SUB_FLIGHT.scroll).toBeLessThan(HELI_FLIGHT.scroll);
  });

  it('glides: the sub closes on the stick more slowly than a helicopter, and the helicopter flies as before', () => {
    const stick = { x: 1, y: 0 };
    const sub = fleetVelocity({ x: 0, y: 0 }, stick, 200, DRIFT.sub, 0.1);
    const heli = fleetVelocity({ x: 0, y: 0 }, stick, 200, DRIFT.heli, 0.1);
    expect(sub.x).toBeGreaterThan(0);
    expect(sub.x).toBeLessThan(heli.x);
    expect(heli).toEqual(heliVelocity({ x: 0, y: 0 }, stick, 200, 0.1));
    let v = { x: 200, y: 0 };
    for (let i = 0; i < 10; i++) v = fleetVelocity(v, { x: 0, y: 0 }, 200, DRIFT.sub, 1 / 60);
    expect(v.x).toBeGreaterThan(100); // still gliding a sixth of a second after letting go
  });

  it('sends the sonar ring out to its reach in its time and hits each target once, as the ring crosses it', () => {
    expect(sonarRadius(0)).toBe(0);
    expect(sonarRadius(SONAR.time / 2)).toBeCloseTo(SONAR.reach / 2, 6);
    expect(sonarRadius(5)).toBe(SONAR.reach);
    const from = { x: 0, y: 0 };
    const near = { x: 50, y: 0 };
    const far = { x: 0, y: 250 };
    const out = { x: 400, y: 0 };
    expect(sonarHits([near, far, out], from, 0, 100)).toEqual([near]);
    expect(sonarHits([near, far, out], from, 100, 300)).toEqual([far]);
    expect(sonarHits([near, far, out], from, 300, 300)).toEqual([]);
  });

  it('gives the Type 212 its sonar burst: no shield, no stealth', () => {
    expect(PLANES.u212).toMatchObject({ kind: 'sub', special: 'sonar', specialCooldown: 12 });
    expect(specialRules('sonar')).toEqual({ invulnerable: false, stealth: false });
  });
});
