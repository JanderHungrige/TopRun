import type { MusicMood } from './music';

export type Inst = 'kick' | 'snare' | 'hat' | 'ohat' | 'crash' | 'bass' | 'pad' | 'arp' | 'lead';
/** One note: instrument, MIDI pitches, length in 16th steps, velocity. */
export interface NoteEvent { i: Inst; m: number[]; d: number; v: number }
/** bars[bar][16th step] → notes starting on that step. `bright` scales synth filter cutoffs. */
export interface CompiledSong { bpm: number; loop: boolean; bright: number; bars: NoteEvent[][][] }

interface Drums { k: string; s: string; h: string }
/**
 * Grids are 16 sixteenth-steps per bar: '-' holds the previous note, '.' rests. Per-bar arrays cycle.
 * chords: one per bar ('Dm' minor, 'F' major, 'F/G' = two halves); its length is the song length.
 * bass: r root, t third, f fifth, s flat 7th, o octave.  pad: x power chord (X accent).
 * arp: digit = chord tone (root, 3rd, 5th, oct, oct+3rd, oct+5th), '' = silent bar.
 * lead: 4, 8 or 16 space-separated tokens per bar ('A4', 'Bb5', '-', '.'), '' = silent bar.
 * drums: k kick, s snare (X accent, g ghost), h hat (x closed, o open, c crash).
 */
interface Song {
  bpm: number; loop: boolean; bright?: number;
  chords: string[]; bass: string[]; pad: string[]; arp: string[]; lead: string[]; drums: Drums[];
}

const rep = (n: number, ...bars: string[]): string[] => Array.from({ length: n }, () => bars).flat();
const dr = (k: string, s: string, h: string): Drums => ({ k, s, h });

const BACKBEAT = '....x.......x...';
const EIGHTHS = 'x.x.x.x.x.x.x.x.';
const SIXTEENTHS = 'xxxxxxxxxxxxxxxx';

const MENU: Song = {
  bpm: 112,
  loop: true,
  chords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'F', 'C', 'Gm', 'Bb', 'C', 'A'],
  bass: ['r-r-r-r-r-r-o-r-', 'r-r-r-r-o-r-f-r-'],
  pad: [...rep(8, 'x-------x-------'), ...rep(8, 'x-----------x---')],
  arp: [...rep(8, ''), ...rep(8, '0234023402340234')],
  lead: [
    'A4 - - D5 - - E5 -', 'F5 - - - - - E5 D5', 'C5 - - A4 - - C5 -', 'E5 - - - D5 - C5 -',
    'A4 - - D5 - - E5 -', 'F5 - - - D5 - F5 -', 'G5 - - - - - F5 -', 'E5 - - - - - - .',
    'D5 - - - F5 - A5 -', 'Bb5 - - - A5 - F5 -', 'A5 - - - - - G5 F5', 'G5 - - - E5 - C5 -',
    'D5 - - Bb4 - - D5 -', 'F5 - - - - - D5 F5', 'G5 - - - E5 - G5 -', 'A5 - - - - - - .',
  ],
  drums: [
    dr('x.......x.......', BACKBEAT, 'c.x.x.x.x.x.x.x.'),
    dr('x.......x.......', BACKBEAT, EIGHTHS),
    dr('x.....x.x.......', BACKBEAT, 'x.x.x.x.x.x.x.o.'),
    dr('x.......x.......', '....x.......XgXX', 'x.x.x.x.x.x.....'),
  ],
};

const MISSION_A = dr('x.....x.x.......', BACKBEAT, EIGHTHS);
const MISSION_B = dr('x.......x.x.....', '....x.......x..g', 'x.x.x.x.x.x.x.o.');
const MISSION: Song = {
  bpm: 132,
  loop: true,
  chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B', 'C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B'],
  bass: ['r.r.r.r.r.r.r.o.', 'r.r.r.r.o.r.f.o.'],
  pad: [...rep(8, 'x-----x-----x---'), ...rep(8, 'x-------x-------')],
  arp: [...rep(8, '0232023202320232'), ...rep(8, '')],
  lead: [
    ...rep(8, ''),
    'G5 - - - E5 - G5 -', 'A5 - - - F#5 - D5 -', 'B5 - - - - - A5 G5', 'G5 - E5 - - - B4 -',
    'C6 - - - B5 - G5 -', 'A5 - - - F#5 - A5 -', 'B5 - - - F#5 - D#5 -', 'F#5 - - - - - - .',
  ],
  drums: [
    dr('x.....x.x.......', BACKBEAT, 'c.x.x.x.x.x.x.x.'), MISSION_A, MISSION_B, MISSION_A,
    MISSION_A, MISSION_B, MISSION_A, dr('x.....x.x.......', '....x...g.x.XXXX', 'x.x.x.x.x.x.....'),
  ],
};

const BOSS_A = dr('x.x...x.x.x...x.', BACKBEAT, SIXTEENTHS);
const BOSS_B = dr('x.x...x.x.x.x.x.', '....x.......x..g', SIXTEENTHS);
const BOSS: Song = {
  bpm: 150,
  loop: true,
  bright: 0.7,
  chords: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Db', 'G', 'Cm', 'Cm', 'Ab', 'Bb', 'Fm', 'Ab', 'Db', 'G'],
  bass: ['r-rrr-rrr-rrr-rr', 'r-rrr-rrr-rro-o-'],
  pad: [...rep(8, 'x---------------'), ...rep(8, 'x-----x-----x---')],
  arp: [...rep(8, '0123012301230123'), ...rep(8, '0.3.1.3.0.3.2.3.')],
  lead: [
    ...rep(8, ''),
    'C5 - - - - - Eb5 -', 'D5 - - - C5 - G4 -', 'Ab4 - - - C5 - Eb5 -', 'F5 - - - D5 - Bb4 -',
    'F5 - - - Ab5 - G5 F5', 'Eb5 - - - C5 - Eb5 -', 'Db5 - - - F5 - Ab5 -', 'G5 - - - - - B4 D5',
  ],
  drums: [
    dr('x.x...x.x.x...x.', BACKBEAT, 'c.xxxxxxxxxxxxxx'), BOSS_A, BOSS_B, BOSS_A,
    BOSS_A, BOSS_B, BOSS_A, dr('x.x...x.x.......', '....x...g.g.XXXX', 'xxxxxxxxxxxx....'),
  ],
};

const VICTORY: Song = {
  bpm: 140,
  loop: false,
  bright: 1.2,
  chords: ['F/G', 'A'],
  bass: ['r-r-r-r-r-r-r-r-', 'r-----------....'],
  pad: ['x-------x-------', 'X-----------....'],
  arp: ['0234023402340234', '012345------....'],
  lead: ['A4 . A4 C5 F5 - - - B4 . B4 D5 G5 - - -', 'C#5 - E5 - A5 - - - - - - - . . . .'],
  drums: [
    dr('x...x...x...x...', '........x.x.XXXX', 'c.x.x.x.x.x.x.x.'),
    dr('x...............', 'X...............', 'c...............'),
  ],
};

const DEFEAT: Song = {
  bpm: 120,
  loop: false,
  bright: 0.6,
  chords: ['Dm/Bb', 'Gm/Dm'],
  bass: ['r-------r-------', 'r-------r-----..'],
  pad: ['x-------x-------', 'x-------x-----..'],
  arp: [''],
  lead: ['A4 - - - - - G4 F4', 'E4 - - - D4 - - .'],
  drums: [dr('x.......x.......', '', '')],
};

const SONGS: Record<MusicMood, Song> = { menu: MENU, mission: MISSION, boss: BOSS, victory: VICTORY, defeat: DEFEAT };

interface Chord { root: number /* pitch class */; minor: boolean }
type Add = (step: number, i: Inst, m: number[], d?: number, v?: number) => void;

const LETTER: Partial<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BASS_OFFSET: Partial<Record<string, number>> = { r: 0, f: 7, s: 10, o: 12 };

function pitchClass(name: string): number | null {
  const base = LETTER[name.charAt(0)];
  if (base === undefined) return null;
  const acc = name.charAt(1) === '#' ? 1 : name.charAt(1) === 'b' ? -1 : 0;
  return (base + acc + 12) % 12;
}

function midi(token: string): number | null {
  const m = /^([A-G][#b]?)(\d)$/.exec(token);
  const pc = m ? pitchClass(token) : null;
  return m && pc !== null ? 12 * (Number(m[2]) + 1) + pc : null;
}

const chord = (token: string): Chord => ({ root: pitchClass(token) ?? 9, minor: token.endsWith('m') });
const third = (c: Chord): number => (c.minor ? 3 : 4);
const cycle = (bars: string[], b: number): string => bars[b % bars.length] ?? '';

/** Calls `fn` for every note start in a 16-step grid with its length (1 + following '-'). */
function hits(grid: string, fn: (ch: string, step: number, len: number) => void): void {
  for (let i = 0; i < Math.min(16, grid.length); i++) {
    const ch = grid.charAt(i);
    if (ch === '.' || ch === '-') continue;
    let len = 1;
    while (grid.charAt(i + len) === '-') len++;
    fn(ch, i, len);
  }
}

function leadBar(bar: string, add: Add): void {
  const tokens = bar.split(' ').filter((t) => t !== '');
  const len = 16 / Math.max(1, tokens.length);
  tokens.forEach((token, i) => {
    const m = midi(token);
    if (m === null) return;
    let n = 1;
    while (tokens[i + n] === '-') n++;
    add(Math.floor(i * len), 'lead', [m], n * len);
  });
}

function drumBar(d: Drums | undefined, add: Add): void {
  if (!d) return;
  hits(d.k, (_, s) => add(s, 'kick', []));
  hits(d.s, (ch, s) => add(s, 'snare', [], 1, ch === 'X' ? 1.3 : ch === 'g' ? 0.35 : 1));
  hits(d.h, (ch, s) => add(s, ch === 'c' ? 'crash' : ch === 'o' ? 'ohat' : 'hat', []));
}

function compileBar(song: Song, b: number): NoteEvent[][] {
  const steps: NoteEvent[][] = Array.from({ length: 16 }, () => []);
  const add: Add = (step, i, m, d = 1, v = 1) => { steps[step]?.push({ i, m, d, v }); };
  const halves = (song.chords[b] ?? '').split('/').map(chord);
  const at = (s: number): Chord => halves[s < 8 ? 0 : halves.length - 1] ?? { root: 9, minor: true };
  const root = (s: number): number => 40 + ((at(s).root + 8) % 12); // E2..D#3
  hits(cycle(song.bass, b), (ch, s, d) => {
    const off = ch === 't' ? third(at(s)) : BASS_OFFSET[ch];
    if (off !== undefined) add(s, 'bass', [root(s) + off], d);
  });
  hits(cycle(song.pad, b), (ch, s, d) => add(s, 'pad', [12, 19, 24].map((o) => root(s) + o), d, ch === 'X' ? 1.3 : 1));
  hits(cycle(song.arp, b), (ch, s, d) => {
    const tone = [0, third(at(s)), 7, 12, 12 + third(at(s)), 19][Number(ch)];
    if (tone !== undefined) add(s, 'arp', [root(s) + 24 + tone], d);
  });
  leadBar(cycle(song.lead, b), add);
  drumBar(song.drums[b % song.drums.length], add);
  return steps;
}

const cache = new Map<MusicMood, CompiledSong>();

export function compileSong(mood: MusicMood): CompiledSong {
  const hit = cache.get(mood);
  if (hit) return hit;
  const song = SONGS[mood];
  const bars = song.chords.map((_, b) => compileBar(song, b));
  const compiled: CompiledSong = { bpm: song.bpm, loop: song.loop, bright: song.bright ?? 1, bars };
  cache.set(mood, compiled);
  return compiled;
}
