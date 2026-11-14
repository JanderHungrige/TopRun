import { describe, expect, it } from 'vitest';
import { createRamp, gradeRamp, lightsLit, RAMP, stepRamp, type RampInput, type RampState } from '../../src/game/ramp-start';

// The ramp start (doc 109): revs held in the band through the countdown, rated on green like the catapult.

const run = (s: RampState, input: (s: RampState) => RampInput, seconds: number, dt = 1 / 60): RampState => {
  let x = s;
  for (let k = 0; k < seconds / dt && x.phase !== 'done'; k++) x = stepRamp(x, input(x), dt);
  return x;
};

describe('Ramp start (doc 109)', () => {
  it('lowers the ramp, lights three reds and the green', () => {
    expect([0, 0.79, 0.8, 1.6, 2.39, 2.4].map(lightsLit)).toEqual([1, 1, 2, 3, 3, 4]);
    const s = run(createRamp(), () => ({ throttle: false, skip: false }), RAMP.ramp + 0.02);
    expect(s.phase).toBe('lights');
  });

  it('grades the revs on green: perfect in the band, good near it, early over, late under', () => {
    expect([0.7, 0.8, 0.85, 0.6, 0.9, 0.97, 0.3].map(gradeRamp)).toEqual(['perfect', 'perfect', 'perfect', 'good', 'good', 'early', 'late']);
  });

  it('rates a feathered throttle perfect, a floored one early, a late one late, none at all skipped', () => {
    const feather = (s: RampState): RampInput => ({ throttle: s.revs < 0.78, skip: false });
    expect(run(createRamp(), feather, 6).rating).toBe('perfect');
    expect(run(createRamp(), () => ({ throttle: true, skip: false }), 6).rating).toBe('early');
    const lateStart = (s: RampState): RampInput => ({ throttle: s.phase === 'lights' && s.t > 1.9, skip: false });
    expect(run(createRamp(), lateStart, 6).rating).toBe('late');
    expect(run(createRamp(), () => ({ throttle: false, skip: false }), 6).rating).toBe('skipped');
  });

  it('skips on S, and rolls off after green before it is done', () => {
    expect(stepRamp(createRamp(), { throttle: false, skip: true }, 0.016)).toMatchObject({ phase: 'done', rating: 'skipped' });
    const s = run(createRamp(), (x) => ({ throttle: x.revs < 0.78, skip: false }), RAMP.ramp + RAMP.green + 0.1);
    expect(s.phase).toBe('go');
    expect(run(s, () => ({ throttle: false, skip: false }), RAMP.rollOff + 0.1).phase).toBe('done');
  });
});
