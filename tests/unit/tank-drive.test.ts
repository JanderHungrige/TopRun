import { describe, expect, it } from 'vitest';
import { PLANES } from '../../src/data/planes';
import { cockpitSkin } from '../../src/game/cockpit';
import { specialRules } from '../../src/game/jets';
import { flightScroll } from '../../src/game/sub-flight';
import {
  bounce, driveAccel, hullYaw, MAIN_GUN, markDue, markOffsets, NITRO, SENTRY, TANK_DRIVE, vehicleOf,
} from '../../src/game/tank-drive';

// How the tanks and buggies drive (doc 104): the driving scroll, a buggy quick and a tank slow on the stick, the hull
// leaning into its course, the marks in the grass, the four specials.

describe('Tank drive (doc 104)', () => {
  it('drives map 7 a touch faster than the mechs walk map 6', () => {
    expect(flightScroll(7)).toBe(TANK_DRIVE.scroll);
    expect(flightScroll(7)).toBeGreaterThan(flightScroll(6));
    expect(flightScroll(7)).toBeLessThan(flightScroll(1));
  });

  it('closes on the stick quickly in a buggy and slowly in a tank', () => {
    expect(vehicleOf('jackal')).toBe('buggy');
    expect(vehicleOf('bison')).toBe('tank');
    expect(driveAccel('viper')).toBe(6);
    expect(driveAccel('lynx')).toBe(3.2);
  });

  it('leans the hull toward its course, never more than 22°, straight when standing', () => {
    expect(hullYaw(0, 0)).toBe(0);
    expect(hullYaw(5, 3)).toBe(0);
    expect(hullYaw(0, -200)).toBe(0);
    expect(hullYaw(200, -50)).toBeCloseTo(TANK_DRIVE.maxYaw, 6);
    expect(hullYaw(-200, -50)).toBeCloseTo(-TANK_DRIVE.maxYaw, 6);
    const slight = hullYaw(40, -200);
    expect(slight).toBeGreaterThan(0);
    expect(slight).toBeLessThan(TANK_DRIVE.maxYaw);
  });

  it('bounces a buggy harder than a tank and neither while standing', () => {
    const peak = (kind: 'buggy' | 'tank'): number => Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(bounce(kind, i * 0.7, 120))));
    expect(peak('buggy')).toBeGreaterThan(peak('tank'));
    expect(bounce('buggy', 30, 0)).toBe(0);
  });

  it('leaves a set of marks every 10 px: two tracks or four tyres', () => {
    expect(markDue(9, 10)).toBe(true);
    expect(markDue(10, 19.9)).toBe(false);
    expect(markOffsets('tank')).toHaveLength(2);
    expect(markOffsets('buggy')).toHaveLength(4);
  });

  it('gives the four vehicles their specials: the nitro cannot be hit, the others can', () => {
    expect(['jackal', 'lynx', 'viper', 'bison'].map((id) => PLANES[id as 'jackal'].special)).toEqual(['nitro', 'sentry', 'longbow', 'maingun']);
    expect(specialRules('nitro')).toEqual({ invulnerable: true, stealth: false });
    expect(specialRules('sentry').invulnerable).toBe(false);
    expect(specialRules('maingun').invulnerable).toBe(false);
    expect(NITRO.speed).toBe(2);
    expect(MAIN_GUN.damage).toBeGreaterThan(MAIN_GUN.splash);
    expect(SENTRY.life).toBe(PLANES.lynx.specialDuration);
    expect(cockpitSkin('tank')).toBe('tank');
  });
});
