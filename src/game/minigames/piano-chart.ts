import {
  BLUE_LANE, FILL_BEAT, GROOVE_BAR, LAST_HIT, LEFT_HAND, PIANO_SONG, ROOT, VOICING,
  type BandHit, type BandInst, type BanterCue, type ChordName, type SectionId, type SongSection,
} from '../../data/piano-song';

// Piano Bar (doc 23): compiles the tune data into the chart (the right-hand notes the player hits) and the
// accompaniment (left hand, kit, upright bass, claps), each event on its band layer. Pure.

/** 0 = the left hand (always), 1 = kit, 2 = upright bass, 3 = crowd claps. */
export type Layer = 0 | 1 | 2 | 3;

export interface ChartNote {
  /** Song time, s (0 = the first note). */
  t: number;
  lane: number;
  /** MIDI notes the hit sounds. */
  pitches: readonly number[];
  /** Blue-note crush: grace note a semitone below, or null. */
  grace: number | null;
  /** A white-key glissando into the note (scores double). */
  gliss: boolean;
  /** Sounding length, s. */
  dur: number;
  /** Index into Chart.sections. */
  section: number;
}

export interface BandEvent { t: number; inst: 'piano' | BandInst; notes: readonly number[]; v: number; dur: number; layer: Layer }
export interface Beat { t: number; bar: boolean }
export interface SectionSpan { id: SectionId; start: number; end: number; bpm: number; band: boolean; banter: BanterCue | null }

export interface Chart {
  notes: readonly ChartNote[];
  band: readonly BandEvent[];
  beats: readonly Beat[];
  sections: readonly SectionSpan[];
  /** Time of the last note (the final chord). */
  last: number;
}

const PAIRS: Readonly<Record<string, readonly number[]>> = { a: [0, 3], b: [1, 2], c: [0, 2], d: [1, 3], e: [2, 3], f: [0, 1] };
const GLISS: Readonly<Record<string, number>> = { w: 0, x: 1, y: 2, z: 3 };
const GRIDS: readonly number[] = [8, 12, 16];
const TRIPLETS = 12;

export const LAYER_OF: Readonly<Record<BandInst, Layer>> = { kick: 1, snare: 1, ride: 1, crash: 1, bass: 2, clap: 3 };

/** The lanes a grid character plays ('.' and '-' play none); throws on an unknown character. */
export function tokenLanes(ch: string): readonly number[] {
  if (ch === '.' || ch === '-') return [];
  if (/^[0-3]$/.test(ch)) return [Number(ch)];
  const pair = PAIRS[ch];
  if (pair) return pair;
  const g = GLISS[ch];
  if (g !== undefined) return [g];
  throw new Error(`piano chart: unknown token "${ch}"`);
}

interface Bar { section: number; s: SongSection; chord: ChordName; start: number; dur: number; index: number }

function note(bar: Bar, lane: number, t: number, dur: number, gliss: boolean): ChartNote {
  const pitches = VOICING[bar.chord][lane] ?? [];
  const blue = bar.s.crush === true && lane === BLUE_LANE[bar.chord];
  return { t, lane, pitches, grace: blue ? Math.max(...pitches) - 1 : null, gliss, dur, section: bar.section };
}

function rightHand(out: ChartNote[], bar: Bar): void {
  const grid = bar.s.rh[bar.index] ?? '';
  if (grid === '') return;
  if (!GRIDS.includes(grid.length)) throw new Error(`piano chart: grid of ${grid.length} in ${bar.s.id}`);
  const step = bar.dur / grid.length;
  for (let i = 0; i < grid.length; i++) {
    const ch = grid.charAt(i);
    const lanes = tokenLanes(ch);
    let hold = 0;
    while (grid.charAt(i + 1 + hold) === '-') hold++;
    for (const lane of lanes) out.push(note(bar, lane, bar.start + i * step, (1 + hold) * step + 0.08, ch in GLISS));
  }
}

function leftHand(out: BandEvent[], bar: Bar): void {
  const pattern = LEFT_HAND[bar.s.lh[bar.index % bar.s.lh.length] ?? 'boogie'];
  const step = bar.dur / TRIPLETS;
  const root = ROOT[bar.chord];
  for (const h of pattern) {
    out.push({ t: bar.start + h.step * step, inst: 'piano', notes: h.notes.map((n) => root + n), v: h.v, dur: h.len * step, layer: 0 });
  }
}

function bandHits(bar: Bar): readonly BandHit[] {
  const s = bar.s;
  const first = bar.index === 0;
  const crash: BandHit[] = s.crash && first ? [{ step: 0, inst: 'crash', v: 1 }] : [];
  switch (s.band) {
    case 'none': return [];
    case 'last': return [...LAST_HIT, ...crash];
    case 'groove': {
      const fill = s.fill === true && bar.index === s.chords.length - 1;
      const kept = fill ? GROOVE_BAR.filter((h) => h.step < 9 || (h.inst !== 'snare' && h.inst !== 'ride')) : GROOVE_BAR;
      return [...kept, ...(fill ? FILL_BEAT : []), ...crash];
    }
    default: throw new Error(`unhandled: ${s.band satisfies never}`);
  }
}

function band(out: BandEvent[], bar: Bar): void {
  const step = bar.dur / TRIPLETS;
  const root = ROOT[bar.chord];
  for (const h of bandHits(bar)) {
    const bass = h.inst === 'bass';
    out.push({
      t: bar.start + h.step * step, inst: h.inst, notes: bass ? [root - 12 + (h.semi ?? 0)] : [], v: h.v,
      dur: bass ? step * 5 : step, layer: LAYER_OF[h.inst],
    });
  }
}

/** The whole tune: chart notes sorted by time then lane, accompaniment by time, the beat grid and sections. */
export function compileSong(song: readonly SongSection[]): Chart {
  const notes: ChartNote[] = [];
  const events: BandEvent[] = [];
  const beats: Beat[] = [];
  const sections: SectionSpan[] = [];
  let t = 0;
  song.forEach((s, section) => {
    if (s.rh.length !== s.chords.length) throw new Error(`piano chart: ${s.id} has ${s.rh.length} grids for ${s.chords.length} bars`);
    const start = t;
    const dur = 240 / s.bpm;
    s.chords.forEach((chord, index) => {
      const bar: Bar = { section, s, chord, start: t, dur, index };
      rightHand(notes, bar);
      leftHand(events, bar);
      band(events, bar);
      for (let k = 0; k < 4; k++) beats.push({ t: t + (k * dur) / 4, bar: k === 0 });
      t += dur;
    });
    sections.push({ id: s.id, start, end: t, bpm: s.bpm, band: s.band !== 'none', banter: s.banter ?? null });
  });
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  events.sort((a, b) => a.t - b.t);
  return { notes, band: events, beats, sections, last: notes.reduce((m, n) => Math.max(m, n.t), 0) };
}

/** Index of the section playing at `time` (the first before the song, the last after it). */
export function sectionAt(chart: Chart, time: number): number {
  const i = chart.sections.findIndex((s) => time < s.end);
  return i < 0 ? chart.sections.length - 1 : i;
}

/** The beat at `time`: its index and how far through it we are (0 … 1); before the song −1 / 0. */
export function beatAt(chart: Chart, time: number, hint = 0): { index: number; phase: number } {
  const b = chart.beats;
  if (b.length === 0 || time < (b[0]?.t ?? 0)) return { index: -1, phase: 0 };
  let i = Math.max(0, Math.min(hint, b.length - 1));
  while (i > 0 && (b[i]?.t ?? 0) > time) i--;
  while (i + 1 < b.length && (b[i + 1]?.t ?? Infinity) <= time) i++;
  const t0 = b[i]?.t ?? 0;
  const t1 = b[i + 1]?.t ?? t0 + 0.4;
  return { index: i, phase: Math.min(1, (time - t0) / (t1 - t0)) };
}

let cached: Chart | null = null;

/** "Ready Room Boogie", compiled once. */
export function pianoChart(): Chart {
  cached ??= compileSong(PIANO_SONG);
  return cached;
}
