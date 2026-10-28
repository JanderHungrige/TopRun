import { afterEach, describe, expect, it } from 'vitest';
import {
  AUTO_NEXT, beatAt, CLOSEUP_GUARD, cuesBetween, FIRST, GUARD, MORE, sceneLength, startCeremony, stepCeremony,
  type CeremonyInput, type CeremonyState, type CueId,
} from '../../src/game/ceremony';
import { medalLine } from '../../src/game/dialogue-scripts';
import { setLang } from '../../src/i18n/i18n';

afterEach(() => setLang('en'));

const DT = 1 / 60;
const idle: CeremonyInput = { confirm: false, back: false, typed: false };

/** Runs frames until `until` holds (or a frame cap), collecting every cue. */
function run(s: CeremonyState, inp: CeremonyInput, until: (s: CeremonyState) => boolean, cap = 2000): { s: CeremonyState; cues: CueId[] } {
  const cues: CueId[] = [];
  for (let i = 0; i < cap && !until(s); i++) {
    const step = stepCeremony(s, DT, inp);
    cues.push(...step.cues);
    s = step.state;
  }
  return { s, cues };
}

describe('Medal ceremony timeline', () => {
  it('starts on the first medal, or is done straight away without medals', () => {
    expect(startCeremony(3)).toMatchObject({ count: 3, index: 0, stage: 'scene', t: 0 });
    expect(startCeremony(0).stage).toBe('done');
  });

  it('walks the admiral in, pins, salutes, the crew salutes after them, all back to attention (first medal, ~9 s)', () => {
    expect(sceneLength(0)).toBe(8.9);
    expect(beatAt(0, 0)).toMatchObject({ walk: 0, reach: 0, pinned: false, salute: 0 });
    expect(beatAt(0, 1.5).walking).toBe(true);
    expect(beatAt(0, 2.8)).toMatchObject({ walk: 1, walking: false, back: 0 });
    expect(beatAt(0, 3.4).reach).toBeGreaterThan(0.5);
    expect(beatAt(0, FIRST.pin - 0.01).pinned).toBe(false);
    expect(beatAt(0, FIRST.pin).pinned).toBe(true);
    expect(beatAt(0, 4.5).reach).toBe(0);
    expect(beatAt(0, 5.5)).toMatchObject({ salute: 1, back: 1, crew: 0 });
    expect(beatAt(0, 7.5)).toMatchObject({ salute: 0, crew: 1, pinned: true, back: 1 });
    expect(beatAt(0, 8.6)).toMatchObject({ salute: 0, crew: 0 });
  });

  it('gives further medals a quick pin without the walk or the salute', () => {
    expect(sceneLength(1)).toBe(MORE.end);
    expect(sceneLength(1)).toBeLessThan(sceneLength(0) / 2);
    expect(beatAt(1, 0)).toMatchObject({ walk: 1, back: 1, reach: 0, pinned: false });
    expect(beatAt(1, 0.4).back).toBe(0);
    expect(beatAt(1, MORE.pin).pinned).toBe(true);
    expect(beatAt(1, 2.2)).toMatchObject({ back: 1, salute: 0 });
  });

  it('fires pin, fanfare, salute and the close-up once each, in order', () => {
    const { s, cues } = run(startCeremony(2), idle, (st) => st.stage === 'closeup');
    expect(cues).toEqual(['pin', 'fanfare', 'salute', 'closeup']);
    expect(s).toMatchObject({ index: 0, t: 0 });
    expect(cuesBetween(1, 0, 3)).toEqual(['pin']);
    expect(cuesBetween(0, FIRST.pin, 10)).toEqual(['salute']);
  });

  it('ignores CONFIRM and BACK during the guard, then CONFIRM skips to the close-up with the pending cues', () => {
    let s = startCeremony(1);
    const early = stepCeremony(s, DT, { ...idle, confirm: true, back: true });
    expect(early.state.stage).toBe('scene');
    s = run(s, idle, (st) => st.age >= GUARD).s;
    const skip = stepCeremony(s, DT, { ...idle, confirm: true });
    expect(skip.state.stage).toBe('closeup');
    expect(skip.cues).toEqual(['pin', 'fanfare', 'salute', 'closeup']);
  });

  it('CONFIRM in a close-up first finishes the text, then moves to the next medal, then ends', () => {
    let s = run(startCeremony(2), idle, (st) => st.stage === 'closeup').s;
    const tooSoon = stepCeremony(s, DT, { ...idle, confirm: true });
    expect(tooSoon.finishText).toBe(false);
    s = run(s, idle, (st) => st.t >= CLOSEUP_GUARD).s;
    const finish = stepCeremony(s, DT, { ...idle, confirm: true, typed: false });
    expect(finish).toMatchObject({ finishText: true, state: { stage: 'closeup', index: 0 } });
    const next = stepCeremony(finish.state, DT, { ...idle, confirm: true, typed: true });
    expect(next.state).toMatchObject({ stage: 'scene', index: 1, t: 0 });
    s = run(next.state, idle, (st) => st.stage === 'closeup').s;
    s = run(s, idle, (st) => st.t >= CLOSEUP_GUARD).s;
    expect(stepCeremony(s, DT, { ...idle, confirm: true, typed: true }).state.stage).toBe('done');
  });

  it('moves on by itself once a close-up has been fully shown for a while', () => {
    let s = run(startCeremony(2), idle, (st) => st.stage === 'closeup').s;
    s = run(s, idle, () => false, Math.ceil((AUTO_NEXT + 2) / DT)).s;
    expect(s).toMatchObject({ stage: 'closeup', index: 0 });
    const typed = { ...idle, typed: true };
    s = run(s, typed, (st) => st.stage !== 'closeup').s;
    expect(s).toMatchObject({ stage: 'scene', index: 1 });
  });

  it('BACK skips the rest of the ceremony', () => {
    const s = run(startCeremony(3), idle, (st) => st.age >= GUARD).s;
    expect(stepCeremony(s, DT, { ...idle, back: true }).state.stage).toBe('done');
    const done = stepCeremony({ ...s, stage: 'done' }, DT, { ...idle, confirm: true });
    expect(done.cues).toEqual([]);
    expect(done.state.stage).toBe('done');
  });

  it('the admiral presents the first medal and calls each further one "one more", in the player\'s language', () => {
    expect(medalLine(0, 'pacific')).toMatchObject({ speaker: 'admiral', key: 'adm.medal', params: { medal: 'Pacific Campaign Ribbon' } });
    expect(medalLine(2, 'ace')).toMatchObject({ key: 'adm.medalMore', params: { medal: 'Ace Wings' } });
    setLang('de');
    expect(medalLine(0, 'pacific').params).toEqual({ medal: 'Pazifik-Feldzugsband' });
  });
});
