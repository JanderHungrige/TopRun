import { describe, expect, it } from 'vitest';
import { createDrop, DROP, gradeDrop, stepDrop, type DropState } from '../../src/game/drop-launch';

// The mech's drop (doc 84): fall, fire the retros, land softly; the touchdown speed rates it.

const DT = 1 / 60;

function run(burnBelow: number, cap = 4000): DropState {
  let s = createDrop();
  for (let i = 0; i < cap && s.phase !== 'done'; i++) s = stepDrop(s, { burn: s.alt < burnBelow, skip: false }, DT);
  return s;
}

describe('drop launch (doc 84)', () => {
  it('opens the bay, then falls faster and faster up to terminal speed', () => {
    let s = createDrop();
    for (let i = 0; i < 60; i++) s = stepDrop(s, { burn: false, skip: false }, DT);
    expect(s.phase).toBe('bay');
    for (let i = 0; i < 120; i++) s = stepDrop(s, { burn: false, skip: false }, DT);
    expect(s.phase).toBe('fall');
    expect(s.v).toBeGreaterThan(0);
    expect(s.alt).toBeLessThan(DROP.start);
  });

  it('crashes in late without the retros, and drops early when they are fired from the top', () => {
    expect(run(-1).rating).toBe('late');
    expect(run(1000).rating).toBe('early');
  });

  it('lands softly when the retros are lit at the right height, holding a soft descent', () => {
    expect([24, 26, 28, 30].map((h) => run(h).rating)).toEqual(['perfect', 'perfect', 'perfect', 'perfect']);
    expect(run(22).rating).toBe('good');
    expect(run(10).rating).toBe('late');
    expect(run(60).rating).toBe('early');
    expect(run(28).impact).toBeLessThanOrEqual(DROP.perfect);
  });

  it('grades the touchdown speed, early or late by the fuel left', () => {
    expect(gradeDrop(1, 1)).toBe('perfect');
    expect(gradeDrop(4, 1)).toBe('good');
    expect(gradeDrop(12, 0)).toBe('early');
    expect(gradeDrop(12, 1)).toBe('late');
  });

  it('skips to the mission', () => {
    expect(stepDrop(createDrop(), { burn: false, skip: true }, DT)).toMatchObject({ phase: 'done', rating: 'skipped' });
  });
});
