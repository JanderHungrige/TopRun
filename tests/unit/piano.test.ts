import { describe, it, expect } from 'vitest';
import { PIANO_SONG, VOICING, type ChordName } from '../../src/data/piano-song';
import { beatAt, compileSong, pianoChart, sectionAt, tokenLanes, type Chart } from '../../src/game/minigames/piano-chart';
import {
  bandLevel, createPiano, crowdSize, judge, maxScore, multiplier, PIANO_RULES as R, songEnd, stepPiano, verdict,
  type Lanes, type PianoState,
} from '../../src/game/minigames/piano';
import { placeholders } from '../../src/i18n/i18n';
import { PIANO_TEXT } from '../../src/i18n/minigames/piano';

const DT = 1 / 60;
const NONE: Lanes = [false, false, false, false];
const lane = (i: number): Lanes => [i === 0, i === 1, i === 2, i === 3];
const chart = pianoChart();

/** Runs idle ticks until the song clock reaches `t` (the tick that crosses it is the last). */
function until(c: Chart, s: PianoState, t: number): PianoState {
  let out = s;
  while (out.time + DT <= t + 1e-9) out = stepPiano(c, out, NONE, DT);
  return out;
}

/** A tiny two-section chart for rule tests: four quarter notes on lane 0 at 120 BPM, then lane 3. */
const tiny = compileSong([
  { id: 'intro', bpm: 120, chords: ['C7'], rh: ['0.0.0.0.'], lh: ['stride'], band: 'none' },
  { id: 'chorus1', bpm: 120, chords: ['C7'], rh: ['3.3.3.3.'], lh: ['boogie'], band: 'groove' },
]);

describe('Piano Bar', () => {
  describe('the tune (chart)', () => {
    it('compiles to 210 notes sorted by time, lanes 0–3, 10 glissandi', () => {
      expect(chart.notes.length).toBe(210);
      expect(chart.notes.filter((n) => n.gliss).length).toBe(10);
      for (let i = 1; i < chart.notes.length; i++) {
        const a = chart.notes[i - 1];
        const b = chart.notes[i];
        expect(a && b && (a.t < b.t || (a.t === b.t && a.lane < b.lane))).toBe(true);
      }
      for (const n of chart.notes) expect([0, 1, 2, 3]).toContain(n.lane);
    });

    it('lasts 45–60 s from the first note to the final chord', () => {
      const first = chart.notes[0]?.t ?? 0;
      expect(first).toBe(0);
      expect(chart.last - first).toBeGreaterThan(45);
      expect(chart.last - first).toBeLessThan(60);
    });

    it('never puts two notes of one lane closer than 0.23 s (judgement windows never overlap)', () => {
      const last = [-9, -9, -9, -9];
      for (const n of chart.notes) {
        expect(n.t - (last[n.lane] ?? -9), `lane ${n.lane} at ${n.t.toFixed(3)}`).toBeGreaterThanOrEqual(0.23);
        last[n.lane] = n.t;
      }
    });

    it('starts slow and ends fast: intro < chorus < finale in tempo and note density', () => {
      const bpm = (id: string) => PIANO_SONG.find((s) => s.id === id)?.bpm ?? 0;
      expect(bpm('intro')).toBeLessThan(bpm('chorus1'));
      expect(bpm('chorus1')).toBeLessThan(bpm('finale'));
      const density = (id: string): number => {
        const k = chart.sections.findIndex((s) => s.id === id);
        const sec = chart.sections[k];
        return sec ? chart.notes.filter((n) => n.section === k).length / (sec.end - sec.start) : 0;
      };
      expect(density('intro')).toBeLessThan(2);
      expect(density('chorus1')).toBeGreaterThan(density('intro'));
      expect(density('finale')).toBeGreaterThan(density('chorus2'));
      const intro = [...new Set(chart.notes.filter((n) => n.section === 0).map((n) => n.t))];
      for (let i = 1; i < intro.length; i++) expect((intro[i] ?? 0) - (intro[i - 1] ?? 0)).toBeGreaterThan(0.5);
    });

    it('voices every lane in the chord, the top note rising with the lane', () => {
      for (const ch of Object.keys(VOICING) as ChordName[]) {
        const tops = VOICING[ch].map((v) => Math.max(...v));
        expect(tops.length).toBe(4);
        for (let i = 1; i < 4; i++) expect(tops[i] ?? 0).toBeGreaterThan(tops[i - 1] ?? 0);
      }
      for (const n of chart.notes) {
        for (const p of n.pitches) {
          expect(p).toBeGreaterThanOrEqual(60);
          expect(p).toBeLessThanOrEqual(96);
        }
      }
    });

    it('finds the section and the beat (with its phase) at a time', () => {
      expect(chart.sections[sectionAt(chart, -1)]?.id).toBe('intro');
      expect(chart.sections[sectionAt(chart, 9.5)]?.id).toBe('bandIn');
      expect(chart.sections[sectionAt(chart, 999)]?.id).toBe('final');
      expect(beatAt(chart, -0.5)).toEqual({ index: -1, phase: 0 });
      const beat = 60 / 108;
      const b = beatAt(chart, beat * 2.25, 40);
      expect(b.index).toBe(2);
      expect(b.phase).toBeCloseTo(0.25, 6);
    });

    it('decodes grid tokens: lanes, two-lane chords, glissandi; rejects unknown ones', () => {
      expect(tokenLanes('2')).toEqual([2]);
      expect(tokenLanes('a')).toEqual([0, 3]);
      expect(tokenLanes('b')).toEqual([1, 2]);
      expect(tokenLanes('z')).toEqual([3]);
      expect(tokenLanes('.')).toEqual([]);
      expect(tokenLanes('-')).toEqual([]);
      expect(() => tokenLanes('q')).toThrow();
      expect(() => compileSong([{ id: 'intro', bpm: 120, chords: ['C7'], rh: ['0123456'], lh: ['stride'], band: 'none' }])).toThrow();
    });

    it('crushes the blue note only in crush sections and marks glissandi in the finale', () => {
      const sec = (id: string) => chart.sections.findIndex((s) => s.id === id);
      const graced = chart.notes.filter((n) => n.grace !== null);
      expect(graced.length).toBeGreaterThan(10);
      for (const n of graced) {
        expect([sec('chorus2'), sec('finale'), sec('ending'), sec('final')]).toContain(n.section);
        expect(n.grace).toBe(Math.max(...n.pitches) - 1);
      }
      expect(chart.notes.some((n) => n.gliss && n.section === sec('finale'))).toBe(true);
    });

    it('plays the left hand in every bar and the band only in band sections, on layers 1–3', () => {
      const lh = chart.band.filter((e) => e.inst === 'piano');
      for (const s of chart.sections) {
        expect(lh.some((e) => e.t >= s.start - 1e-9 && e.t < s.end), s.id).toBe(true);
        const band = chart.band.filter((e) => e.inst !== 'piano' && e.t >= s.start - 1e-9 && e.t < s.end - 1e-9);
        expect(band.length > 0, s.id).toBe(s.band);
      }
      for (const e of chart.band) expect(e.layer).toBe(e.inst === 'piano' ? 0 : e.inst === 'bass' ? 2 : e.inst === 'clap' ? 3 : 1);
      expect(chart.beats.filter((b) => b.bar).length).toBe(PIANO_SONG.reduce((n, s) => n + s.chords.length, 0));
    });
  });

  describe('judgement', () => {
    it('PERFECT within 50 ms, GOOD within 110 ms, nothing beyond', () => {
      expect(judge(0)).toBe('perfect');
      expect(judge(-0.05)).toBe('perfect');
      expect(judge(0.05)).toBe('perfect');
      expect(judge(0.051)).toBe('good');
      expect(judge(-0.11)).toBe('good');
      expect(judge(0.111)).toBeNull();
    });

    it('multiplier 1 + ⌊combo / 10⌋, capped at ×4', () => {
      expect([0, 9, 10, 19, 20, 29, 30, 99].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    });
  });

  describe('a round', () => {
    it('starts in the pre-roll with the groove at 0.6 and nothing judged', () => {
      const s = createPiano(chart);
      expect(s.time).toBeCloseTo(-R.leadIn, 9);
      expect(s.results.every((r) => r === null)).toBe(true);
      expect([s.score, s.combo, s.miss]).toEqual([0, 0, 0]);
      expect(s.groove).toBe(R.grooveStart);
    });

    it('scores a press on the note PERFECT, a late one GOOD', () => {
      let s = until(tiny, createPiano(tiny), 0);
      s = stepPiano(tiny, s, lane(0), DT);
      expect(s.events[0]).toMatchObject({ kind: 'hit', note: 0, grade: 'perfect', points: 100, combo: 1 });
      s = until(tiny, s, 0.5 + 0.08);
      s = stepPiano(tiny, s, lane(0), DT);
      expect(s.events[0]).toMatchObject({ kind: 'hit', note: 1, grade: 'good', points: 50 });
      expect([s.score, s.combo, s.perfect, s.good]).toEqual([150, 2, 1, 1]);
    });

    it('a press in the wrong lane is a WRONG KEY: −50 points (never below 0), the combo breaks', () => {
      let s = until(tiny, createPiano(tiny), -DT);
      s = stepPiano(tiny, s, lane(0), DT);
      s = until(tiny, s, 0.5 - DT);
      s = stepPiano(tiny, s, lane(2), DT);
      expect(s.events).toEqual([{ kind: 'wrong', lane: 2, broke: 1 }]);
      expect([s.combo, s.wrong, s.score]).toEqual([0, 1, 100 - R.wrongCost]);
      expect(s.groove).toBeCloseTo(R.grooveStart + R.groove.perfect + R.groove.wrong, 9);
      for (let i = 0; i < 3; i++) s = stepPiano(tiny, s, lane(1), DT);
      expect(s.score).toBe(0);
    });

    it('an unplayed note becomes a MISS 110 ms after its time', () => {
      let s = until(tiny, createPiano(tiny), 0.1);
      expect(s.results[0]).toBeNull();
      s = until(tiny, s, 0.13);
      expect(s.results[0]).toBe('miss');
      expect(s.miss).toBe(1);
      expect(s.groove).toBeCloseTo(R.grooveStart + R.groove.miss, 9);
    });

    it('matches a press to the open note of its lane inside the window', () => {
      let s = until(tiny, createPiano(tiny), 0.5 - 0.1);
      s = stepPiano(tiny, s, lane(0), DT);
      expect(s.results.slice(0, 3)).toEqual(['miss', 'good', null]);
    });

    it('doubles the points from the 11th hit in a row, double again for a glissando', () => {
      const c = compileSong([
        { id: 'chorus1', bpm: 120, chords: ['C7', 'C7'], rh: ['01230123', '0123012z'], lh: ['boogie'], band: 'groove' },
      ]);
      let s = createPiano(c);
      const pts: number[] = [];
      for (const n of c.notes) {
        s = until(c, s, n.t - DT);
        s = stepPiano(c, s, lane(n.lane), DT);
        for (const e of s.events) if (e.kind === 'hit') pts.push(e.points);
      }
      expect(pts).toEqual([...Array<number>(10).fill(100), 200, 200, 200, 200, 200, 400]);
      expect(s.maxCombo).toBe(16);
    });

    it('is over after the final chord rings out; an all-perfect round scores the maximum', () => {
      let s = createPiano(chart);
      for (const [i, n] of chart.notes.entries()) {
        if (s.results[i] !== null) continue;
        s = until(chart, s, n.t - DT);
        const lanes = [0, 1, 2, 3].map((l) => chart.notes.some((m, j) => s.results[j] === null && m.lane === l && Math.abs(m.t - (s.time + DT)) < 0.02));
        s = stepPiano(chart, s, [lanes[0] ?? false, lanes[1] ?? false, lanes[2] ?? false, lanes[3] ?? false], DT);
      }
      expect(s.perfect).toBe(chart.notes.length);
      expect(s.score).toBe(maxScore(chart));
      expect(maxScore(chart)).toBe(82000);
      expect(s.over).toBe(false);
      s = until(chart, s, songEnd(chart) + DT);
      expect(s.over).toBe(true);
      expect(stepPiano(chart, s, lane(1), DT).wrong).toBe(s.wrong);
      expect(verdict(chart, s)).toBe('encore');
    });
  });

  describe('groove, band and crowd', () => {
    it('drops band layers as the groove falls: drums < 0.2, bass < 0.4, claps < 0.7', () => {
      expect([0, 0.19, 0.2, 0.39, 0.4, 0.69, 0.7, 1].map(bandLevel)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    });

    it('keeps the groove within 0 … 1', () => {
      let s = createPiano(tiny);
      for (let i = 0; i < 400; i++) s = stepPiano(tiny, s, [true, true, true, true], DT);
      expect(s.groove).toBe(0);
    });

    it('grows the crowd with the combo; only a falling groove sends them away', () => {
      const base = createPiano(chart);
      expect(crowdSize({ ...base, combo: 0, groove: 0.6 })).toBe(4);
      expect(crowdSize({ ...base, combo: 35, groove: 0.6 })).toBe(5);
      expect(crowdSize({ ...base, combo: 60, groove: 1 })).toBe(7);
      expect(crowdSize({ ...base, combo: 0, groove: 0.05 })).toBe(2);
      expect(crowdSize({ ...base, combo: 0, groove: 0 })).toBe(2);
    });

    it('rates the set by the share of notes hit', () => {
      const s = createPiano(chart);
      const n = chart.notes.length;
      expect(verdict(chart, { ...s, perfect: Math.ceil(n * 0.95) })).toBe('encore');
      expect(verdict(chart, { ...s, perfect: Math.ceil(n * 0.5), good: Math.ceil(n * 0.25) })).toBe('nice');
      expect(verdict(chart, { ...s, good: Math.floor(n * 0.74) })).toBe('tough');
    });
  });

  describe('texts', () => {
    it('English and German have the same keys and placeholders', () => {
      expect(Object.keys(PIANO_TEXT.de).sort()).toEqual(Object.keys(PIANO_TEXT.en).sort());
      for (const k of Object.keys(PIANO_TEXT.en) as (keyof typeof PIANO_TEXT.en)[]) {
        expect(placeholders(PIANO_TEXT.de[k]), k).toEqual(placeholders(PIANO_TEXT.en[k]));
        expect(PIANO_TEXT.de[k].trim().length, k).toBeGreaterThan(0);
      }
    });
  });
});
