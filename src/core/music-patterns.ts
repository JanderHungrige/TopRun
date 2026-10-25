import type { MusicMood } from './music';
import { SONGS } from './music-songs';

export type Inst =
  | 'kick' | 'snare' | 'hat' | 'ohat' | 'crash' | 'tom' | 'gong' | 'swell'
  | 'bass' | 'drone' | 'brass' | 'stab' | 'power' | 'chug' | 'arp' | 'lead';
/** Pitch slide into a note: start pitch (MIDI) and slide time (s). */
export interface Bend { from: number; time: number }
/** One note: instrument, MIDI pitches, length in 16th steps, velocity, optional slide-in. */
export interface NoteEvent { i: Inst; m: number[]; d: number; v: number; bend?: Bend }
/** bars[bar][16th step] → notes starting there. A looping song restarts at bar `loopFrom`. */
export interface CompiledSong { bpm: number; loop: boolean; loopFrom: number; bright: number; bars: NoteEvent[][][] }

export type Track = 'bass' | 'drone' | 'brass' | 'stab' | 'gtr' | 'arp' | 'lead' | 'k' | 's' | 'h' | 't' | 'fx';
/**
 * A run of bars. `chords` has one entry per bar (so its length is the section length): 1, 2 or 4
 * space-separated symbols splitting the bar evenly — 'D', 'F#m', 'Asus A', 'G/B', 'E5', 'Dsus2'.
 * Each track is a list of bars cycling over the section. A bar is a 16-char grid (one char per 16th)
 * or 1/2/4/8/16 space-separated tokens. '-' holds (also across bar lines), '.' rests, '' = silent bar.
 *   bass, drone: r root, t third, f fifth, o octave, s flat 7th — or a note such as 'E1'.
 *   brass, stab: x chord voiced around middle C (X accent).  arp: digit = chord tone 0–5.
 *   gtr: x power chord (X accent), m palm-muted chug — or a note: 'E2' power chord, '_E2' muted.
 *   lead: notes; '^A4' bends up a whole step into A4, '~A4' glides from the previous note.
 *   k: x kick (X accent).  s: x snare (X accent, g ghost).  h: x hat, o open hat, c crash (C accent).
 *   t: tom 1 (high) … 4 (floor).  fx: w cymbal swell (its length = holds), g gong (G big).
 * `mix` scales the velocity of whole tracks within the section.
 */
export type Section = Partial<Record<Track, string[]>> & { chords: string[]; mix?: Partial<Record<Track, number>> };
export interface Song { bpm: number; loop: boolean; loopFrom?: number; bright?: number; sections: Section[] }

/** Chord as pitch classes: root, intervals above it, bass note (slash chords). */
interface Chord { root: number; tones: number[]; bass: number }
type Hit = Omit<NoteEvent, 'd'>;

const TRACKS: readonly Track[] = ['bass', 'drone', 'brass', 'stab', 'gtr', 'arp', 'lead', 'k', 's', 'h', 't', 'fx'];
const HOLD = '-';
const REST = '.';
const LETTER: Partial<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const QUALITY: Partial<Record<string, number[]>> = { '': [0, 4, 7], m: [0, 3, 7], sus: [0, 5, 7], sus2: [0, 2, 7], 5: [0, 7] };
const CHORD = /^([A-G][#b]?)(m|sus2|sus|5)?(?:\/([A-G][#b]?))?$/;
const NOTE = /^([_^~]?)([A-G][#b]?)(\d)$/;
const BASS_STEP: Partial<Record<string, number>> = { r: 0, f: 7, o: 12, s: 10 };
const BEND = 0.15;
const GLIDE = 0.09;

type DrumTrack = 'k' | 's' | 'h' | 't' | 'fx';
type PitchTrack = Exclude<Track, DrumTrack>;
const hit = (i: Inst, v = 1, m: number[] = []): Hit => ({ i, m, v });
const DRUMS: Record<DrumTrack, Partial<Record<string, Hit>>> = {
  k: { x: hit('kick'), X: hit('kick', 1.25) },
  s: { x: hit('snare'), X: hit('snare', 1.3), g: hit('snare', 0.35) },
  h: { x: hit('hat'), o: hit('ohat'), c: hit('crash'), C: hit('crash', 1.3) },
  t: { 1: hit('tom', 1, [57]), 2: hit('tom', 1, [52]), 3: hit('tom', 1, [47]), 4: hit('tom', 1, [42]) },
  fx: { w: hit('swell'), g: hit('gong', 0.6), G: hit('gong') },
};
const isDrum = (t: Track): t is DrumTrack => t in DRUMS;

function pitchClass(name: string): number | null {
  const base = LETTER[name.charAt(0)];
  if (base === undefined) return null;
  const acc = name.charAt(1) === '#' ? 1 : name.charAt(1) === 'b' ? -1 : 0;
  return (base + acc + 12) % 12;
}

function parseChord(sym: string): Chord {
  const r = CHORD.exec(sym);
  const root = r ? pitchClass(r[1] ?? '') : null;
  const tones = QUALITY[r?.[2] ?? ''];
  if (!r || root === null || !tones) throw new Error(`bad chord: ${sym}`);
  return { root, tones, bass: pitchClass(r[3] ?? '') ?? root };
}

function parseNote(token: string): { mark: string; m: number } | null {
  const r = NOTE.exec(token);
  const pc = r ? pitchClass(r[2] ?? '') : null;
  return r && pc !== null ? { mark: r[1] ?? '', m: 12 * (Number(r[3]) + 1) + pc } : null;
}

/** Lowest MIDI note >= `low` with pitch class `pc`. */
const reg = (pc: number, low: number): number => low + ((((pc - low) % 12) + 12) % 12);
const bassRoot = (c: Chord): number => reg(c.bass, 28); // E1..D#2
const gtrRoot = (c: Chord): number => reg(c.root, 40); // E2..D#3
const power = (root: number): number[] => [root, root + 7, root + 12];
/** Chord tones packed into G3..F#4 (smooth voice leading for free) plus the root on top. */
const voicing = (c: Chord): number[] =>
  [...c.tones.map((i) => reg((c.root + i) % 12, 55)).sort((a, b) => a - b), reg(c.root, 55) + 12];

function bar16(bar: string): string[] {
  if (bar === '') return Array<string>(16).fill(REST);
  if (!bar.includes(' ') && bar.length === 16) return [...bar];
  const tokens = bar.split(' ').filter((t) => t !== '');
  const span = 16 / tokens.length;
  if (!Number.isInteger(span)) throw new Error(`bad bar: ${bar}`);
  return tokens.flatMap((t) => [t, ...Array<string>(span - 1).fill(t === REST ? REST : HOLD)]);
}

function trackCells(song: Song, track: Track): string[] {
  return song.sections.flatMap((sec) => sec.chords.flatMap((_, b) => {
    const bars = sec[track] ?? [];
    return bar16(bars.length > 0 ? (bars[b % bars.length] ?? '') : '');
  }));
}

function chordCells(song: Song): Chord[] {
  return song.sections.flatMap((sec) => sec.chords.flatMap((bar) => {
    const syms = bar.split(' ').filter((t) => t !== '');
    const span = 16 / syms.length;
    if (!Number.isInteger(span)) throw new Error(`bad chord bar: ${bar}`);
    return syms.flatMap((sym) => Array<Chord>(span).fill(parseChord(sym)));
  }));
}

/** Calls `fn` for every note start with its length in steps (1 + following holds). */
function scan(cells: string[], fn: (token: string, pos: number, len: number) => void): void {
  cells.forEach((cell, pos) => {
    if (cell === HOLD || cell === REST) return;
    let len = 1;
    while (cells[pos + len] === HOLD) len++;
    fn(cell, pos, len);
  });
}

const accent = (token: string): number => (token === 'X' ? 1.3 : 1);
const isChord = (token: string): boolean => token === 'x' || token === 'X';

/** Chord-relative token ('r', 'x', 'm', '3', …) → hit, or null if the token means nothing on this track. */
function relative(track: PitchTrack, token: string, c: Chord): Hit | null {
  switch (track) {
    case 'bass': case 'drone': {
      const off = token === 't' ? (c.tones[1] ?? 7) : BASS_STEP[token];
      return off === undefined ? null : hit(track, 1, [bassRoot(c) + off]);
    }
    case 'brass': case 'stab': return isChord(token) ? hit(track, accent(token), voicing(c)) : null;
    case 'gtr':
      if (token === 'm') return hit('chug', 1, power(gtrRoot(c)));
      return isChord(token) ? hit('power', accent(token), power(gtrRoot(c))) : null;
    case 'arp': {
      const t3 = c.tones[1] ?? 7;
      const off = [0, t3, 7, 12, 12 + t3, 19][Number(token)];
      return off === undefined ? null : hit('arp', 1, [gtrRoot(c) + 24 + off]);
    }
    case 'lead': return null;
    default: throw new Error(`unhandled: ${track satisfies never}`);
  }
}

/** Absolute note token ('E2', '_E2', '^A4', '~A4') → hit. */
function absolute(track: PitchTrack, n: { mark: string; m: number }, prev: number | null): Hit {
  if (track === 'gtr') return hit(n.mark === '_' ? 'chug' : 'power', 1, power(n.m));
  if (track !== 'lead') return hit(track, 1, [n.m]);
  const h = hit('lead', 1, [n.m]);
  if (n.mark === '^') h.bend = { from: n.m - 2, time: BEND };
  if (n.mark === '~' && prev !== null) h.bend = { from: prev, time: GLIDE };
  return h;
}

function toHit(track: Track, token: string, c: Chord, prev: number | null): Hit {
  let h: Hit | null | undefined;
  if (isDrum(track)) h = DRUMS[track][token];
  else {
    const n = parseNote(token);
    h = n ? absolute(track, n, prev) : relative(track, token, c);
  }
  if (!h) throw new Error(`bad ${track} token: ${token}`);
  return h;
}

const cache = new Map<MusicMood, CompiledSong>();

/** Expands a mood's song into per-step note lists (cached; throws on malformed pattern data). */
export function compileSong(mood: MusicMood): CompiledSong {
  const cached = cache.get(mood);
  if (cached) return cached;
  const song = SONGS[mood];
  const chords = chordCells(song);
  const mixes = song.sections.flatMap((sec) => sec.chords.map(() => sec.mix ?? {}));
  const bars: NoteEvent[][][] = mixes.map(() => Array.from({ length: 16 }, () => []));
  for (const track of TRACKS) {
    let prev: number | null = null;
    scan(trackCells(song, track), (token, pos, len) => {
      const chord = chords[pos];
      if (!chord) throw new Error(`no chord at step ${pos}`);
      const h = toHit(track, token, chord, prev);
      if (track === 'lead') prev = h.m[0] ?? prev;
      const bar = Math.floor(pos / 16);
      bars[bar]?.[pos % 16]?.push({ ...h, d: len, v: h.v * (mixes[bar]?.[track] ?? 1) });
    });
  }
  const compiled = { bpm: song.bpm, loop: song.loop, loopFrom: song.loopFrom ?? 0, bright: song.bright ?? 1, bars };
  cache.set(mood, compiled);
  return compiled;
}
