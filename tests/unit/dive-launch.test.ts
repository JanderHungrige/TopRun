import { describe, it, expect } from 'vitest';
import { createDive, DIVE, gradeDive, outsideGap, stepDive, type DiveState } from '../../src/game/dive-launch';

// The dive launch (doc 71): out of the well deck and down through the gap between the anti-sub net and the reef.

const run = (s: DiveState, flood: (s: DiveState) => boolean, secs: number): DiveState => {
  let x = s;
  for (let k = 0; k < secs * 60 && x.phase !== 'done'; k++) x = stepDive(x, { flood: flood(x), skip: false }, 1 / 60);
  return x;
};

describe('Dive launch (doc 71)', () => {
  it('grades the depth at the net by its distance from the gap middle (15 m of 9–21 m)', () => {
    expect(gradeDive(15)).toBe('perfect');
    expect(gradeDive(15.8)).toBe('perfect');
    expect(gradeDive(13)).toBe('good');
    expect(gradeDive(17.5)).toBe('good');
    expect(gradeDive(11)).toBe('early');
    expect(gradeDive(19.5)).toBe('late');
    expect(outsideGap(8)).toBe(true);
    expect(outsideGap(22)).toBe(true);
    expect(outsideGap(15)).toBe(false);
  });

  it('floods the deck first, then the sub moves out; the deck floor holds it until the ramp ends', () => {
    let s = createDive();
    s = run(s, () => true, DIVE.flood - 0.05);
    expect(s.phase).toBe('flood');
    expect(s.depth).toBe(DIVE.start);
    s = run(s, () => true, 0.1);
    expect(s.phase).toBe('dive');
    s = run(s, () => true, 2);
    expect(s.x).toBeLessThan(DIVE.deckEnd);
    expect(s.depth).toBeLessThanOrEqual(DIVE.deckFloor);
  });

  it('rates a sub that never floods its tanks early (it snags the net), one that floods all the way late', () => {
    const shallow = run(createDive(), () => false, 20);
    expect(shallow).toMatchObject({ phase: 'done', rating: 'early', scraped: true });
    const deep = run(createDive(), () => true, 20);
    expect(deep).toMatchObject({ phase: 'done', rating: 'late', scraped: true });
  });

  it('gives a perfect dive to a pilot who floods past the ramp and holds the middle of the gap', () => {
    const pilot = (s: DiveState): boolean => s.x > DIVE.deckEnd && s.depth + s.vz * 0.6 < 15;
    const s = run(createDive(), pilot, 20);
    expect(s.rating).toBe('perfect');
    expect(s.scraped).toBe(false);
  });

  it('skips on S: no bonus', () => {
    expect(stepDive(createDive(), { flood: false, skip: true }, 1 / 60)).toMatchObject({ phase: 'done', rating: 'skipped' });
  });
});
