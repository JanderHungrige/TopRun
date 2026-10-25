import type { MusicMood } from './music';
import type { Section, Song } from './music-patterns';

/*
 * Original compositions in an '80s action-movie style (gated drums, power guitar, synth brass).
 * Notation: see Section in music-patterns.ts.
 */

const rep = (n: number, ...bars: string[]): string[] => Array.from({ length: n }, () => bars).flat();
/** Shifts every note name in token bars by `n` octaves. */
const octave = (bars: string[], n: number): string[] =>
  bars.map((b) => b.replace(/([A-G][#b]?)(\d)/g, (_, p: string, o: string) => `${p}${Number(o) + n}`));
/** A bass line doubling a guitar riff one octave down (palm mutes dropped). */
const bassOf = (riff: string[]): string[] => octave(riff.map((b) => b.replaceAll('_', '')), -1);
/** One chord/note token on the downbeat held for the whole bar, or one per half bar. */
const whole = (c: string): string => c + '-'.repeat(15);
const halves = (c: string): string => `${c}-------${c}-------`;
/** A single hit on the downbeat, rest of the bar silent. */
const one = (c: string): string => c + '.'.repeat(15);

const HOLD_BAR = '----------------';
const BACKBEAT = '....x.......x...';
const BIG_BACKBEAT = '....X.......X...';
const EIGHTHS = 'x.x.x.x.x.x.x.x.';
const CRASH_8 = 'c.x.x.x.x.x.x.x.';
const SIXTEENTHS = 'xxxxxxxxxxxxxxxx';
const TOM_FILL = '........11223344';

// ── menu: "Flight Deck Anthem", D major, 96 BPM ─────────────────────────────────────────────
// Gong swell over a drone, a quiet statement of the theme an octave down, then the full band.
const ANTHEM_CHORDS = ['D', 'F#m', 'G', 'Asus A', 'Bm', 'G'];
const THEME = [
  '^F#5 - - - - - E5 F#5', '~A5 - - - - - - -', 'B5 - - A5 - - G5 -', 'E5 - - - - - D5 C#5',
  'B4 - - D5 - - F#5 -', '^A5 - - - G5 - F#5 -',
];
const padBars = (c: string): string[] => rep(2, whole(c), whole(c), whole(c), halves(c));

const MENU_INTRO: Section = {
  chords: ['D', 'D'],
  drone: [whole('r'), HOLD_BAR],
  fx: [whole('w'), HOLD_BAR],
};
const MENU_QUIET: Section = {
  chords: [...ANTHEM_CHORDS, 'Em', 'Asus A'],
  mix: { lead: 0.7, brass: 0.6, bass: 0.5, k: 0.6, t: 0.75 },
  lead: octave([...THEME, 'G5 - - - - - F#5 E5', 'E5 - - - - - - .'], -1),
  drone: [whole('r'), ...rep(3, HOLD_BAR), ...rep(4, '')],
  brass: padBars('x'),
  bass: padBars('r'),
  k: [...rep(6, one('x')), ...rep(2, 'x.......x.......')],
  t: [...rep(7, ''), TOM_FILL],
  fx: [one('g'), ...rep(7, '')],
};
const MENU_FULL: Section = {
  chords: [...ANTHEM_CHORDS, 'Bb', 'C'],
  mix: { gtr: 0.85, h: 0.75 },
  lead: [...THEME, 'F5 - - - - - D5 F5', '~G5 - - - - - - -'],
  brass: padBars('X'),
  bass: rep(8, 'r-r-r-r-r-r-r-r-'),
  gtr: [...rep(7, 'X-------x-------'), 'X-------x.x.x.x.'],
  k: rep(8, 'x.......x.......'),
  s: [...rep(7, BIG_BACKBEAT), '....X...........'],
  h: rep(2, CRASH_8, EIGHTHS, EIGHTHS, EIGHTHS),
  t: [...rep(7, ''), TOM_FILL],
  fx: [one('G'), ...rep(7, '')],
};
const MENU: Song = { bpm: 96, loop: true, loopFrom: 2, sections: [MENU_INTRO, MENU_QUIET, MENU_FULL] };

// ── mission: "Afterburner Run", E minor, 140 BPM ─────────────────────────────────────────────
// Palm-muted 3+3+2 riff with offbeat brass stabs, then a chorus with the lead hook.
const RIFF_A = '_E2 _E2 G2 _E2 _E2 A2 - _E2';
const RIFF_B = '_E2 _E2 G2 _E2 _E2 D3 - C3';
const RIFF_TURN = '_C3 _C3 _C3 _C3 D3 - B2 -';
const MISSION_RIFF = [RIFF_A, RIFF_B, RIFF_A, RIFF_TURN];
const ROCK_KICK = 'x.....x.x.......';
const HOOK = [
  'E5 G5 ^A5 - - - G5 E5', 'F#5 - - D5 - - A4 -', 'B4 - E5 - G5 - ^B5 -', '- - - - - - . .',
  'E5 G5 ^A5 - - - G5 E5', 'F#5 - A5 - D6 - - C6', '^B5 - - - - - A5 F#5', 'D#5 - - - - - - .',
];

const MISSION_INTRO: Section = {
  chords: ['Em', 'Em'],
  mix: { h: 0.7 },
  gtr: [RIFF_A, RIFF_B],
  h: [EIGHTHS, EIGHTHS],
  k: ['', 'x.......x.......'],
  s: ['', '........x.x.xxXX'],
};
const MISSION_VERSE: Section = {
  chords: rep(2, 'Em', 'Em', 'Em', 'C C D B'),
  mix: { stab: 0.9 },
  gtr: MISSION_RIFF,
  bass: bassOf(MISSION_RIFF),
  stab: ['......x.......x.', '......x.........', '......x.......x.', ''],
  k: [ROCK_KICK, ROCK_KICK, ROCK_KICK, 'x.....x.x.x.....'],
  s: [...rep(3, BACKBEAT), '....x.......x.x.', ...rep(3, BACKBEAT), '....x...x.x.XXXX'],
  h: [CRASH_8, EIGHTHS, EIGHTHS, EIGHTHS],
};
const MISSION_CHORUS: Section = {
  chords: ['C', 'D', 'Em', 'G', 'C', 'D', 'B', 'B'],
  mix: { brass: 0.7 },
  lead: HOOK,
  gtr: [...rep(7, 'X-m.m.m.x-m.m.m.'), whole('X')],
  brass: rep(8, whole('x')),
  bass: [...rep(7, 'r.r.r.r.r.r.o.r.'), 'r.r.r.r.r.......'],
  k: [...rep(7, ROCK_KICK), 'x.......x.......'],
  s: [...rep(7, BACKBEAT), '....x...........'],
  h: [CRASH_8, EIGHTHS, EIGHTHS, EIGHTHS, CRASH_8, EIGHTHS, EIGHTHS, 'x.x.x.x.........'],
  t: [...rep(7, ''), TOM_FILL],
};
const MISSION: Song = { bpm: 140, loop: true, loopFrom: 2, sections: [MISSION_INTRO, MISSION_VERSE, MISSION_CHORUS] };

// ── boss: "Bogey Inbound", E phrygian, 150 BPM ───────────────────────────────────────────────
// Galloping chugs with half-step and tritone stabs, then a chorus over a bII–V turnaround.
const GALLOP_A = '_E2 - _E2 _E2 _E2 - _E2 _E2 F2 - - _E2 _E2 - _E2 _E2';
const GALLOP_B = '_E2 - _E2 _E2 _E2 - _E2 _E2 Bb2 - - - A2 - - -';
const GALLOP_TURN = 'G2 - - - F#2 - - - F2 - - - _E2 _E2 _E2 _E2';
const BOSS_RIFF = [GALLOP_A, GALLOP_B, GALLOP_A, GALLOP_TURN];
const BOSS_KICK = 'x.x...x.x.x...x.';
const BOSS_LEAD = [
  'B4 - C5 - B4 - ^E5 -', '- - - - G5 - F#5 E5', 'F5 - - - A5 - C6 -', '^B5 - - - A5 - F#5 D#5',
  'E5 - - - B4 - C5 -', 'E5 - G5 - - - ^A5 -', 'A5 - - - F5 - C5 -', 'D#5 - - - - - - .',
];

const BOSS_INTRO: Section = {
  chords: ['Em', 'Em'],
  gtr: [GALLOP_A, GALLOP_B],
  k: ['', BOSS_KICK],
  s: ['', '............xxXX'],
  t: ['', '........44332211'],
  fx: [one('g'), ''],
};
const BOSS_VERSE: Section = {
  chords: rep(8, 'Em'),
  mix: { h: 0.65, arp: 1.2, gtr: 1.15 },
  gtr: BOSS_RIFF,
  bass: bassOf(BOSS_RIFF),
  arp: [...rep(4, ''), ...rep(4, '0.3.1.3.0.3.2.3.')],
  k: [BOSS_KICK, BOSS_KICK, BOSS_KICK, 'x.x...x.x.x.x.x.'],
  s: [...rep(3, BACKBEAT), '....x.......x..g', ...rep(3, BACKBEAT), '....x...x.x.XXXX'],
  h: ['c.xxxxxxxxxxxxxx', SIXTEENTHS, SIXTEENTHS, SIXTEENTHS],
};
const BOSS_CHORUS: Section = {
  chords: rep(2, 'Em', 'C', 'F', 'B'),
  mix: { brass: 0.75, arp: 0.9, h: 0.65, gtr: 1.15, lead: 1.1 },
  lead: BOSS_LEAD,
  gtr: [...rep(7, 'X-mmX-mmX-mmX-mm'), 'X-mmX-mmX-------'],
  brass: rep(8, whole('x')),
  bass: [...rep(7, 'r-rrr-rrr-rrr-rr'), 'r-rrr-rrr.......'],
  arp: rep(8, '0123012301230123'),
  k: [...rep(7, BOSS_KICK), 'x.x...x.x.......'],
  s: [...rep(7, BACKBEAT), '....x...........'],
  h: ['c.xxxxxxxxxxxxxx', ...rep(3, SIXTEENTHS), 'c.xxxxxxxxxxxxxx', SIXTEENTHS, SIXTEENTHS, 'xxxxxxxx........'],
  t: [...rep(7, ''), TOM_FILL],
};
const BOSS: Song = { bpm: 150, loop: true, loopFrom: 2, bright: 0.75, sections: [BOSS_INTRO, BOSS_VERSE, BOSS_CHORUS] };

// ── stingers ───────────────────────────────────────────────────────────────────────────────
// victory: rising dotted fanfare over bVI–bVII, landing on a big D major chord with gong (~4.5 s).
const VICTORY: Song = {
  bpm: 120,
  loop: false,
  bright: 1.15,
  sections: [{
    chords: ['Bb C', 'D'],
    mix: { stab: 0.7, brass: 0.7, s: 0.55, k: 0.8, lead: 0.85, gtr: 0.8, h: 0.8, fx: 0.8 },
    lead: ['F5 - - D5 F5 - Bb5 - G5 - - E5 G5 - C6 -', '^D6'],
    stab: ['X..xX.x.X..xX.x.', ''],
    brass: [halves('x'), whole('X')],
    gtr: [halves('x'), whole('X')],
    bass: ['r.r.r.r.r.r.r.r.', whole('r')],
    k: ['x...x...x...x...', one('X')],
    s: ['X..xX.x.X..xX.x.', one('X')],
    h: ['c...............', one('C')],
    fx: ['', one('G')],
  }],
};

// defeat: soft gong and floor tom, a sighing line that slides down to the tonic (~4.6 s).
const DEFEAT: Song = {
  bpm: 104,
  loop: false,
  bright: 0.6,
  sections: [{
    chords: ['Dm Bb', 'Gm Dm'],
    mix: { lead: 0.7, brass: 0.95, bass: 1.2, t: 0.8 },
    lead: ['A4 - - - - - Bb4 A4', 'G4 - - F4 ~D4 - - .'],
    brass: [halves('x'), 'x-------x-----..'],
    bass: [halves('r'), 'r-------r-----..'],
    drone: [whole('r'), '------------....'],
    t: [one('4'), '........4.......'],
    fx: [one('g'), ''],
  }],
};

export const SONGS: Record<MusicMood, Song> = { menu: MENU, mission: MISSION, boss: BOSS, victory: VICTORY, defeat: DEFEAT };
