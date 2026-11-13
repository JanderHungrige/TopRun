import { describe, it, expect } from 'vitest';
import { GATLING_SPIN_DOWN } from '../../src/data/heli-arms';
import {
  doorTarget, inWave, laserTarget, paintedDamage, rechargeStep, spinRate, spinStep, splashTargets, turretAim,
} from '../../src/game/heli-combat';

// The heli arsenal's combat math (doc 99): the Gatling's spin, the turret's swivel, the door guns' arcs, the sonic wave,
// painting, the HEDP burst and the energy weapons' recharge. Angles: 0 = straight up the screen, positive = right.

const deg = (d: number): number => (d * Math.PI) / 180;

describe('Gatling spin (doc 99)', () => {
  it('spins up over the spin-up time while firing and coasts down over 1.5 s', () => {
    let spin = 0;
    for (let i = 0; i < 30; i++) spin = spinStep(spin, true, 0.6, 0.01);
    expect(spin).toBeCloseTo(0.5, 5);
    for (let i = 0; i < 40; i++) spin = spinStep(spin, true, 0.6, 0.01);
    expect(spin).toBe(1);
    spin = spinStep(spin, false, 0.6, GATLING_SPIN_DOWN / 2);
    expect(spin).toBeCloseTo(0.5, 5);
    expect(spinStep(0.1, false, 0.6, 1)).toBe(0);
  });

  it('fires faster with the spin up to the level\'s factor', () => {
    expect(spinRate(0, 1.6)).toBe(1);
    expect(spinRate(0.5, 1.6)).toBeCloseTo(1.3, 5);
    expect(spinRate(1, 1.45)).toBeCloseTo(1.45, 5);
  });
});

describe('Turret link (doc 99)', () => {
  const from = { x: 300, y: 600 };

  it('swivels to the nearest target ahead within its cone, clamped to the swivel', () => {
    const near = { x: 300 + Math.tan(deg(6)) * 200, y: 400 };
    expect(turretAim(from, [near, { x: 300, y: 100 }], deg(14))).toBeCloseTo(deg(6), 3);
    const wide = { x: 300 + Math.tan(deg(20)) * 200, y: 400 };
    expect(turretAim(from, [wide], deg(14))).toBeCloseTo(deg(14), 5);
  });

  it('ignores targets behind, too far, or beyond swivel + 12°', () => {
    expect(turretAim(from, [{ x: 340, y: 650 }], deg(20))).toBe(0);
    expect(turretAim(from, [{ x: 300, y: 600 - 600 }], deg(20))).toBe(0);
    const outside = { x: 300 + Math.tan(deg(30)) * 200, y: 400 };
    expect(turretAim(from, [outside], deg(14))).toBe(0);
    expect(turretAim(from, [{ x: 330, y: 400 }], 0)).toBe(0);
  });
});

describe('Door guns (doc 99)', () => {
  const from = { x: 300, y: 600 };
  const right = { x: 400, y: 600, id: 1 };
  const left = { x: 220, y: 560, id: 2 };
  const ahead = { x: 305, y: 450, id: 3 };

  it('each gun picks the nearest enemy on its side within range', () => {
    expect(doorTarget(from, [right, left, ahead], 1, 200)).toBe(right);
    expect(doorTarget(from, [right, left, ahead], -1, 200)).toBe(left);
  });

  it('leaves what is ahead, far, or on the other side alone', () => {
    expect(doorTarget(from, [ahead], 1, 300)).toBeNull();
    expect(doorTarget(from, [{ x: 600, y: 600, id: 4 }], 1, 200)).toBeNull();
    expect(doorTarget(from, [left], 1, 200)).toBeNull();
    expect(doorTarget(from, [{ x: 380, y: 680, id: 5 }], 1, 200)).not.toBeNull();
  });
});

describe('Pulse laser and sonic wave (doc 99)', () => {
  const from = { x: 300, y: 600 };

  it('the laser aims at the nearest target in its cone and range', () => {
    const a = { x: 300, y: 300 };
    const b = { x: 360, y: 450 };
    const side = { x: 500, y: 590 };
    expect(laserTarget(from, [a, b, side], deg(30), 460)).toBe(b);
    expect(laserTarget(from, [side], deg(30), 460)).toBeNull();
    expect(laserTarget(from, [{ x: 300, y: 100 }], deg(30), 460)).toBeNull();
  });

  it('the wave front hits what lies in its arc between the last and the new radius', () => {
    expect(inWave(from, deg(40), 80, 120, { x: 300, y: 500 })).toBe(true);
    expect(inWave(from, deg(40), 120, 160, { x: 300, y: 500 })).toBe(false);
    expect(inWave(from, deg(40), 80, 120, { x: 400, y: 600 })).toBe(false);
    expect(inWave(from, deg(40), 80, 120, { x: 300, y: 470 }, 15)).toBe(true);
  });
});

describe('Painting, HEDP and energy (doc 99)', () => {
  it('a painted target takes the tracer bonus, an unpainted one the plain hit', () => {
    expect(paintedDamage(100, 2, 0.2)).toBeCloseTo(120, 5);
    expect(paintedDamage(100, 0, 0.2)).toBe(100);
  });

  it('the HEDP burst reaches the other enemies inside its radius', () => {
    const hit = { x: 100, y: 100, radius: 10, id: 1 };
    const close = { x: 125, y: 100, radius: 8, id: 2 };
    const far = { x: 200, y: 100, radius: 8, id: 3 };
    expect(splashTargets(hit, [hit, close, far], 24)).toEqual([close]);
  });

  it('recharges one charge per recharge time up to the full charge', () => {
    expect(rechargeStep(2, 0.5, 5, 4, 1)).toEqual({ ammo: 2, charge: 0.75 });
    expect(rechargeStep(2, 0.9, 5, 4, 1)).toEqual({ ammo: 3, charge: 0 });
    expect(rechargeStep(5, 0, 5, 4, 1)).toEqual({ ammo: 5, charge: 0 });
    expect(rechargeStep(3, 0.2, 5, 0, 1)).toEqual({ ammo: 3, charge: 0.2 });
  });
});
