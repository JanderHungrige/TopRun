import { describe, it, expect } from 'vitest';
import { createLaunch, gradeSeparation, LAUNCH, rateLaunch, stepLaunch, type LaunchInput, type LaunchState } from '../../src/game/rocket-launch';

// The rocket launch (doc 59): countdown, two stage burns, separate each spent stage on time; rated like the catapult.

const DT = 1 / 60;
const idle: LaunchInput = { action: false, skip: false };
const press: LaunchInput = { action: true, skip: false };

/** Runs until the phase changes away from `phase` (or a time limit), pressing nothing. */
function until(s: LaunchState, phase: LaunchState['phase'], limit = 20): LaunchState {
  let x = s;
  for (let t = 0; t < limit && x.phase === phase; t += DT) x = stepLaunch(x, idle, DT);
  return x;
}

/** Waits `secs` in the current phase, then presses E once. */
function waitAndPress(s: LaunchState, secs: number): LaunchState {
  let x = s;
  for (let t = 0; t < secs - DT / 2; t += DT) x = stepLaunch(x, idle, DT);
  return stepLaunch(x, press, DT);
}

describe('Rocket launch (doc 59)', () => {
  it('counts down, burns stage 1 to empty and waits for the separation', () => {
    let s = until(createLaunch(), 'countdown');
    expect(s.phase).toBe('burn');
    expect(s.stage).toBe(1);
    s = until(s, 'burn');
    expect(s).toMatchObject({ phase: 'spent', stage: 1, fuel: 0 });
    expect(s.alt).toBeGreaterThan(5);
  });

  it('rates a quick separation of both stages perfect', () => {
    let s = until(until(createLaunch(), 'countdown'), 'burn');
    s = waitAndPress(s, 0.2);
    expect(s).toMatchObject({ phase: 'burn', stage: 2, fuel: 1, grades: ['perfect'] });
    s = waitAndPress(until(s, 'burn'), 0.1);
    expect(s).toMatchObject({ phase: 'orbit', grades: ['perfect', 'perfect'], rating: 'perfect' });
    s = until(s, 'orbit');
    expect(s.phase).toBe('done');
    expect(s.rating).toBe('perfect');
  });

  it('takes the worse separation: a slow second stage makes it good', () => {
    let s = until(until(createLaunch(), 'countdown'), 'burn');
    s = waitAndPress(s, 0.1);
    s = waitAndPress(until(s, 'burn'), 0.6);
    expect(s.grades).toEqual(['perfect', 'good']);
    expect(s.rating).toBe('good');
  });

  it('counts a press while the stage still burns as early, and a stage left to drop as late', () => {
    let s = until(createLaunch(), 'countdown');
    s = waitAndPress(s, 1);
    expect(s).toMatchObject({ stage: 2, grades: ['early'] });
    s = until(until(s, 'burn'), 'spent');
    expect(s).toMatchObject({ phase: 'orbit', grades: ['early', 'late'], rating: 'early' });
    expect(rateLaunch(['perfect', 'late'])).toBe('late');
  });

  it('grades by the time since burnout and can be skipped', () => {
    expect([0, LAUNCH.perfect, 0.5, LAUNCH.good, 1.5].map(gradeSeparation)).toEqual(['perfect', 'perfect', 'good', 'good', 'late']);
    const s = stepLaunch(createLaunch(), { action: false, skip: true }, DT);
    expect(s).toMatchObject({ phase: 'done', rating: 'skipped' });
  });
});
