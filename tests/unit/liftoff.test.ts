import { describe, it, expect } from 'vitest';
import { createLiftoff, LIFTOFF, rateLiftoff, stepLiftoff, type LiftoffInput, type LiftoffState } from '../../src/game/liftoff';

// The helicopters' deck liftoff (doc 53): spool, lift in gusts keeping level, E to go; rated like the catapult.

const DT = 1 / 60;
const idle: LiftoffInput = { collective: false, stick: 0, action: false, skip: false };

type Pilot = (s: LiftoffState) => Partial<LiftoffInput>;
function fly(pilot: Pilot, seconds = 12): LiftoffState {
  let s = createLiftoff();
  for (let i = 0; i < seconds * 60 && s.phase !== 'done'; i++) s = stepLiftoff(s, { ...idle, ...pilot(s) }, DT);
  return s;
}

/** Holds the collective and counters the nose with the stick (→ is nose down). */
const steady = (gain: number): Pilot => (s) => ({ collective: true, stick: Math.max(-1, Math.min(1, s.pitch * gain + s.pitchVel * gain * 0.25)) });

describe('Deck liftoff (doc 53)', () => {
  it('spins the rotor up before the collective does anything', () => {
    let s = createLiftoff();
    for (let i = 0; i < 60; i++) s = stepLiftoff(s, { ...idle, collective: true }, DT);
    expect(s.phase).toBe('spool');
    expect(s.alt).toBe(0);
    for (let i = 0; i < Math.ceil(LIFTOFF.spool * 60); i++) s = stepLiftoff(s, idle, DT);
    expect(s.phase).toBe('lift');
    expect(s.rpm).toBe(1);
  });

  it('lets the gusts tip the nose out of the green when nobody holds it level', () => {
    let s = fly(() => ({ collective: true }), 7);
    expect(s.phase === 'hover' || s.phase === 'away').toBe(true);
    expect(s.maxPitch).toBeGreaterThan(LIFTOFF.goodPitch);
    s = fly((x) => ({ collective: true, action: x.phase === 'hover' }));
    expect(s.rating).toBe('late');
  });

  it('rates a level climb with a quick GO perfect, a sloppier one good', () => {
    expect(fly((s) => ({ ...steady(8)(s), action: s.phase === 'hover' })).rating).toBe('perfect');
    expect(fly((s) => ({ ...steady(2)(s), action: s.phase === 'hover' && s.t > 1.5 })).rating).toBe('good');
  });

  it('is early when E comes before hover height, late when it never comes, skipped on S', () => {
    expect(fly((s) => ({ ...steady(8)(s), action: s.alt > 4 })).rating).toBe('early');
    expect(fly(steady(8)).rating).toBe('late');
    const skipped = stepLiftoff(createLiftoff(), { ...idle, skip: true }, DT);
    expect(skipped).toMatchObject({ phase: 'done', rating: 'skipped' });
    expect(rateLiftoff(0.1, 0.5, false)).toBe('perfect');
    expect(rateLiftoff(0.2, 2, false)).toBe('good');
    expect(rateLiftoff(0.4, 0.5, false)).toBe('late');
  });

  it('sinks back to the deck without the collective and never goes below it', () => {
    let s = fly((x) => ({ collective: x.alt < 3 }), 4);
    for (let i = 0; i < 180; i++) s = stepLiftoff(s, idle, DT);
    expect(s.alt).toBe(0);
    expect(s.pitch).toBe(0);
  });
});
