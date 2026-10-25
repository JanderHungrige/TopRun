// "Ready Room Boogie" (doc 23): an original boogie-woogie tune for the Piano Bar, written as data. The right
// hand is the chart the player plays; the left hand, drums, bass and claps are the accompaniment.
// Original right-hand part over the stock 12-bar blues changes and the stock rolling boogie left hand.

export type ChordName = 'C7' | 'F7' | 'G7';
export type LeftHand = 'stride' | 'boogie' | 'octaves' | 'stop' | 'last';
/** 'groove' = swing kit + upright bass + claps (each on its band layer), 'last' = one final hit. */
export type BandPart = 'none' | 'groove' | 'last';
export type SectionId = 'intro' | 'bandIn' | 'chorus1' | 'break' | 'chorus2' | 'stopTime' | 'finale' | 'ending' | 'final';
export type BanterCue = 'bandIn' | 'break' | 'stopTime';
export type BandInst = 'kick' | 'snare' | 'ride' | 'crash' | 'bass' | 'clap';

export interface SongSection {
  id: SectionId;
  bpm: number;
  /** One chord per bar. */
  chords: readonly ChordName[];
  /**
   * Right hand, one grid per bar (length 8 = eighths, 12 = triplet eighths, 16 = sixteenths; '' = no notes).
   * '0'–'3' a lane, 'a'–'f' two lanes at once, 'w'–'z' a glissando into lane 0–3, '-' holds, '.' rests.
   */
  rh: readonly string[];
  /** Left-hand pattern per bar, cycling. */
  lh: readonly LeftHand[];
  band: BandPart;
  /** Crash cymbal on the first downbeat. */
  crash?: boolean;
  /** Snare-triplet fill on the last beat of the last bar. */
  fill?: boolean;
  /** Blue-note crushes: the chord's blue lane slides in from a semitone below. */
  crush?: boolean;
  banter?: BanterCue;
}

const HOOK = '3..3.21..0..';
const WALK_UP = '0.01.12.23..';
const DOWN = '3..2..1..0..';
const ROCK = '3.23.23.21..';
const TRILL = '3232321..0..';
const ROLL = '012012012a..';
const GLISS = 'z..3.2z..3.2';
const BLUES: readonly ChordName[] = ['C7', 'F7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7'];

export const PIANO_SONG: readonly SongSection[] = [
  {
    id: 'intro', bpm: 108, chords: ['C7', 'F7', 'C7', 'G7'], lh: ['stride'], band: 'none',
    rh: ['0-1-2-3-', '3-2-1-0-', '0-1-b---', '3-2-1-0-'],
  },
  { id: 'bandIn', bpm: 160, chords: ['C7'], rh: [''], lh: ['boogie'], band: 'groove', fill: true, banter: 'bandIn' },
  {
    id: 'chorus1', bpm: 160, chords: BLUES, lh: ['boogie'], band: 'groove', crash: true,
    rh: [HOOK, HOOK, HOOK, WALK_UP, HOOK, '2.21.10.0...', HOOK, '1.21.21.2a..', DOWN, DOWN, WALK_UP, '3.....3.2.1.'],
  },
  { id: 'break', bpm: 160, chords: ['C7', 'C7'], rh: ['', ''], lh: ['boogie'], band: 'groove', fill: true, banter: 'break' },
  {
    id: 'chorus2', bpm: 160, chords: BLUES, lh: ['octaves'], band: 'groove', crash: true, crush: true,
    rh: [ROCK, ROCK, ROCK, 'a..a..a..b..', TRILL, TRILL, ROLL, '3210..a.....', ROCK, ROCK, ROLL, DOWN],
  },
  { id: 'stopTime', bpm: 172, chords: ['C7'], rh: [''], lh: ['stop'], band: 'none', banter: 'stopTime' },
  {
    id: 'finale', bpm: 172, chords: ['C7', 'F7', 'C7', 'G7'], lh: ['octaves'], band: 'groove', crash: true, crush: true,
    rh: [GLISS, GLISS, '012301230120', 'z..3.2z.0123'],
  },
  { id: 'ending', bpm: 172, chords: ['C7'], rh: ['w..x..y..z..'], lh: ['octaves'], band: 'groove' },
  { id: 'final', bpm: 172, chords: ['C7'], rh: ['a...........'], lh: ['last'], band: 'last', crash: true },
];

/**
 * Right-hand voicing per chord: the MIDI notes each lane plays, low lane → high lane (the top note rises
 * with the lane). The top C stays as a pedal over C7 and F7.
 */
export const VOICING: Readonly<Record<ChordName, readonly (readonly number[])[]>> = {
  C7: [[72], [76], [82], [79, 84]],
  F7: [[72], [75], [81], [77, 84]],
  G7: [[71], [74], [77], [79, 83]],
};

/** The lane holding the chord's third (crushed from a semitone below in crush sections). */
export const BLUE_LANE: Readonly<Record<ChordName, number>> = { C7: 1, F7: 2, G7: 0 };

/** Left-hand roots: C2, F2, G2. */
export const ROOT: Readonly<Record<ChordName, number>> = { C7: 36, F7: 41, G7: 43 };

/** A left-hand note group on the 12-step triplet grid: semitones above the root, velocity, length in steps. */
export interface LhHit { step: number; notes: readonly number[]; v: number; len: number }

/** Swung eighths on the triplet grid, and the rolling boogie line r 3 5 6 ♭7 6 5 3. */
const SWING = [0, 2, 3, 5, 6, 8, 9, 11] as const;
const LINE = [0, 4, 7, 9, 10, 9, 7, 4] as const;
const rolling = (octave: boolean): LhHit[] => SWING.map((step, i) => {
  const n = LINE[i] ?? 0;
  const off = i % 2 === 1;
  return { step, notes: octave ? [n, n + 12] : [n], v: (off ? 0.72 : 0.95) * (octave ? 1.05 : 1), len: off ? 1 : 2 };
});

export const LEFT_HAND: Readonly<Record<LeftHand, readonly LhHit[]>> = {
  stride: [
    { step: 0, notes: [0, 12], v: 0.78, len: 6 },
    { step: 3, notes: [16, 22], v: 0.42, len: 3 },
    { step: 6, notes: [7, 19], v: 0.66, len: 6 },
    { step: 9, notes: [16, 22], v: 0.42, len: 3 },
  ],
  boogie: rolling(false),
  octaves: rolling(true),
  stop: [{ step: 0, notes: [0, 12], v: 1, len: 3 }, { step: 6, notes: [0, 12], v: 0.95, len: 3 }],
  last: [{ step: 0, notes: [-12, 0, 12], v: 1.1, len: 12 }],
};

/** A band hit on the triplet grid; `semi` is the upright bass note above the root (an octave down). */
export interface BandHit { step: number; inst: BandInst; v: number; semi?: number }

/** One bar of swing: kick on 1 and 3, snare on 2 and 4, a swung ride, two-feel bass, claps on 2 and 4. */
export const GROOVE_BAR: readonly BandHit[] = [
  { step: 0, inst: 'kick', v: 0.8 }, { step: 6, inst: 'kick', v: 0.7 },
  { step: 3, inst: 'snare', v: 0.7 }, { step: 9, inst: 'snare', v: 0.75 },
  { step: 0, inst: 'ride', v: 0.6 }, { step: 3, inst: 'ride', v: 0.5 }, { step: 5, inst: 'ride', v: 0.35 },
  { step: 6, inst: 'ride', v: 0.6 }, { step: 9, inst: 'ride', v: 0.5 }, { step: 11, inst: 'ride', v: 0.35 },
  { step: 0, inst: 'bass', v: 0.9, semi: 0 }, { step: 6, inst: 'bass', v: 0.8, semi: 7 },
  { step: 3, inst: 'clap', v: 0.8 }, { step: 9, inst: 'clap', v: 0.85 },
];

/** Replaces the snare and ride on beat 4 of a fill bar. */
export const FILL_BEAT: readonly BandHit[] = [
  { step: 9, inst: 'snare', v: 0.5 }, { step: 10, inst: 'snare', v: 0.65 }, { step: 11, inst: 'snare', v: 0.85 },
];

export const LAST_HIT: readonly BandHit[] = [
  { step: 0, inst: 'kick', v: 1 }, { step: 0, inst: 'bass', v: 1, semi: 0 }, { step: 0, inst: 'clap', v: 1 },
];
