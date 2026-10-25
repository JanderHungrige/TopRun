---
id: 23-piano-bar
title: Piano Bar - Rhythm Game on the Officers' Club Upright, Original Boogie-Woogie Tune
edition: TopRun
depends_on: [10-minigames-core, 17-people-kit, 20-retro-look]
relates: [10-minigames-core, 12-pushup-challenge, 17-people-kit, 20-retro-look]
source_files:
  - src/data/piano-song.ts
  - src/game/minigames/piano-chart.ts
  - src/game/minigames/piano.ts
  - src/core/piano.ts
  - src/core/piano-band.ts
  - src/scenes/minigames/piano.ts
  - src/scenes/minigames/piano-audio.ts
  - src/scenes/minigames/piano-banter.ts
  - src/scenes/minigames/piano-fx.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/piano-room.ts
  - src/render/minigames/piano-upright.ts
  - src/render/minigames/piano-pilot.ts
  - src/render/minigames/piano-looks.ts
  - src/render/minigames/piano-crowd.ts
  - src/render/minigames/piano-highway.ts
  - src/render/minigames/piano-hud.ts
  - src/render/minigames/piano-banter.ts
  - src/render/minigames/piano-icon.ts
  - src/i18n/minigames/piano.ts
routes: []
models: []
test_files:
  - tests/unit/piano.test.ts
  - tests/unit/piano-pilots.test.ts
  - tests/unit/piano-bots.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, piano-bar, rhythm-game, boogie-woogie, original-music, combo, crowd, band-layers]
path: Game/Minigames/PianoBar
initiative: off-duty-minigames
wave: off-duty-minigames-wave-4
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "PIANO is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawSideFigure / drawFrontFigure (src/render/people/index.ts, doc 17)"
    when: "the pilot sits at the piano as a side figure; the squadron crowd are three-quarter front figures"
satisfies_contracts: []
known_issues:
  - "The tune's sound was checked by an offline render (levels, no clipping) and by the scheduling logic, not by ear in a live session: the dev browser pane was hidden (no rAF). Worth a human listen for mix balance and the feel of the swing."
  - "Audio follows the game's tick clock (re-anchored on > 0.1 s drift); after a long stall the accompaniment skips ahead rather than catching up, and a late glissando is compressed."
  - "Bluetooth / high-latency outputs: only ctx.outputLatency (≤ 80 ms) is compensated; there is no manual calibration offset."
  - "F, Space / J, E and R / K also play lanes (they carry the gamepad face-button actions)."
  - "Touch: only the highway half (x ≥ 760) takes taps; on a phone all four lanes sit under the right thumb."
security_read_sites: []
sister_projects: []
---

# 23 — Piano Bar

## Purpose

Minigame 8 of the off-duty initiative (unlocks after mission 18, doc 10). Saturday night at the officers'
club: the pilot sits down at the battered upright, the squadron gathers round with their glasses up. A
**rhythm game**: notes fall down four lanes onto a row of keys in time with an **original** boogie-woogie
tune, "Ready Room Boogie"; hit them on the beat. The crowd grows and cheers with the combo, groans at
misses, and the band drops out when the playing falls apart and comes back when it recovers. For fun only
(best score and medal per pilot, doc 10).

## Copyright (public site)

The tune is an original composition for this game: an original right-hand part over the stock 12-bar
blues changes and the stock rolling boogie left hand (both centuries-old idioms, not a song). No existing
melody is quoted (in particular nothing from film songs or 1950s hits), nobody sings, and all banter lines
are original. All sound is synthesized in code (no samples).

## Architecture

```
data/piano-song.ts              the tune as data: sections (tempo, chords, right-hand grid per bar, left-hand
                                pattern, band, banter cue), lane voicings per chord, left-hand / drum patterns
game/minigames/piano-chart.ts   compileSong → Chart: playable notes (time, lane, pitches, grace, gliss),
                                accompaniment events (left hand, drums, bass, claps with their band layer),
                                beat grid, section timeline — pure, tested
game/minigames/piano.ts         round rules: createPiano / stepPiano (judgement windows, combo, multiplier,
                                score, groove, band level, crowd size, verdict), PIANO_MEDALS — pure, tested
core/piano.ts                   the upright piano voice (two detuned strings, hammer, damper) + glissando
core/piano-band.ts              brush kit (kick, snare, ride, crash), upright bass, hand claps, crowd voices
scenes/minigames/piano-audio.ts PianoDeck: schedules the accompaniment on the audio clock against the game's
                                song clock, band layer gains, right-hand notes on hits, wrong notes, crowd
scenes/minigames/piano-banter.ts banter queue: section lines, reaction lines, end line; typing + voice blips
scenes/minigames/piano-fx.ts    animation state from the rules' events: key flashes, judgement pop, sparks,
                                the right hand, crowd presence / cheer / toast / wince, band toasts
scenes/minigames/piano.ts       PIANO: MinigameModule; PianoRound maps input → lanes, drives effects and art
render/minigames/piano-room     officers' club backdrop (panelling, neon sign, bar shelf, lights, floor)
render/minigames/piano-upright  the upright piano in three-quarter view (case, keys, end panel, stool)
render/minigames/piano-pilot    the pilot seated at the keys (people-kit side figure, hands follow the play)
render/minigames/piano-looks    looks: the player (avatar colours, off-duty T-shirt) and the squadron crowd
render/minigames/piano-crowd    up to seven squadmates (people-kit front figures) with raised glasses
render/minigames/piano-highway  the note highway: lanes, beat lines, notes, chords, glissandi, the key row
render/minigames/piano-hud      combo + multiplier, groove meter, judgement pops, section plate, banner
render/minigames/piano-banter   retro RPG text box with the speaker's pixel portrait (doc 20)
render/minigames/piano-icon     hub / offer card icon
i18n/minigames/piano.ts         EN + DE: rules, controls, HUD, sections, banner, banter lines
```

The song clock is the game's: `stepPiano` advances `time` by the fixed tick (1/60 s), so `step(n)` stays
deterministic. The audio deck follows that clock (it re-anchors when the audio clock drifts more than
0.1 s, e.g. after a hidden tab, and nudges smaller drift by 2 % per tick); it never decides an outcome.

## The tune — "Ready Room Boogie" (original)

Key **C**, 12-bar blues changes with the quick change to F in bar 2 (C7 F7 C7 C7 | F7 F7 C7 C7 | G7 F7
C7 G7), swing feel (triplet grid: eighth pairs land on triplets 1 and 3 of each beat).

| # | Section | Bars | Tempo | Right hand (the chart) | Left hand | Band |
|---|---------|------|-------|------------------------|-----------|------|
| 1 | Intro | 4 (C7 F7 C7 G7) | 108 | slow quarter-note arpeggios up and down, one double stop | stride: octave on 1 and 3, 3rd + 7th on 2 and 4 | — |
| 2 | Band in | 1 (C7) | 160 | — (banter: Duke) | rolling boogie (r 3 5 6 ♭7 6 5 3) | drums, snare-triplet fill |
| 3 | Chorus 1 | 12 | 160 | the hook: top-C double stop on 1 and 2, swung ♭7 → 3rd → root; swing walk-ups; quarter-note arpeggios down; a quarter-triplet turnaround | rolling boogie | full groove, crash in |
| 4 | Break | 2 (C7) | 160 | — (banter: Chief) | rolling boogie | groove |
| 5 | Chorus 2 | 12 | 160 | hotter: swung top-C / ♭7 rocking, triplet trills, triplet arpeggio rolls, octave chords; blue-note crushes (♭3 → 3) | boogie in pounding octaves | groove, crash in |
| 6 | Stop-time | 1 (C7) | 172 | — (banter: Admiral) | octave hits on 1 and 3 | tacet |
| 7 | Finale | 4 (C7 F7 C7 G7) | 172 | glissandi into the top C, a full-bar rolling triplet arpeggio across all four lanes | octaves | groove, crash in |
| 8 | Ending | 1 + 1 (C7) | 172 | four rising glissandi, one per beat, then the final chord | octaves, then a low C triple octave | crash, last hit |

Length: about 58 s from the first note to the final chord, plus 2 s of pre-roll (notes falling in) and
the ring-out. The data is a grid per bar (`src/data/piano-song.ts`): length 8 = eighths, 12 = triplet
eighths; `0`–`3` a lane, `a`–`f` two lanes at once (a 0+3, b 1+2, c 0+2, d 1+3, e 2+3, f 0+1), `w`–`z` a
glissando into lane 0–3, `-` holds, `.` rests.

**Lanes are pitches** (left = low, right = high), voiced per chord so any rhythm on the lanes is in the
harmony: C7 = C5, E5, B♭5, G5+C6 · F7 = C5, E♭5, A5, F5+C6 · G7 = B4, D5, F5, G5+B5 (the top C stays as a
pedal over C7 and F7, as boogie players do). In crush sections the blue note slides in from a semitone
below (E♭→E over C7, A♭→A over F7, B♭→B over G7). A glissando is a white-key sweep up an octave into
the lane's note.

The chart has **210 notes** (two-lane chords count twice; 10 glissandi). Same-lane notes are never closer
than 0.23 s, so the judgement windows of neighbours never overlap. Sections: intro 0 – 8.9 s, band in
8.9 – 10.4, chorus 1 10.4 – 28.4, break 28.4 – 31.4, chorus 2 31.4 – 49.4, stop-time 49.4 – 50.8, finale
50.8 – 56.4, ending 56.4 – 57.8, final chord at 57.77 s.

## Business Rules

### Lanes and input
- Four lanes. Keyboard **← ↓ ↑ →** (or **A S W D**); gamepad **d-pad** (left / down / up / right) or the
  face buttons **X / A / Y / B** (the existing `flare` / `fire` / `special` / `secondary` actions, so F,
  Space / J, E and R / K also play lanes 0 / 1 / 2 / 3). Touch / mouse: tap a lane (x ≥ 760, the lane under
  the finger; taps on the bar scene do nothing).
- Every press is judged against the earliest unjudged note in its lane. The press time is the song clock of
  the tick that sees it (1/60 s resolution).

### Judgement
- |offset| ≤ **0.050 s** → **PERFECT** (100 points), ≤ **0.110 s** → **GOOD** (50 points). Glissando notes
  score double.
- A note nobody hit within 0.110 s after its time is a **MISS**.
- A press with no note in its lane within ±0.110 s is a **WRONG KEY**: it costs **50 points** (the score
  never drops below 0), breaks the combo and plays a soft clunker. (Without the cost a masher hammering all
  four keys every 8 ticks out-scored a novice: 17 400 vs ~12 000.)
- **Combo** = hits in a row; a miss or a wrong note resets it. **Multiplier** = 1 + ⌊combo / 10⌋, at most
  **×4**, taken from the combo before the hit (hits 1–10 ×1, 11–20 ×2, 21–30 ×3, 31+ ×4).
- **Score** = Σ points × multiplier (`higherIsBetter: true`), formatted "{n} points". All perfect = **82 000**.

### Groove and the band
- **Groove** 0 … 1 starts at **0.6**: perfect **+0.03**, good **+0.015**, miss **−0.08**, wrong note
  **−0.05**.
- **Band level** from the groove: < 0.2 → the left hand alone; ≥ 0.2 drums; ≥ 0.4 + upright bass; ≥ 0.7
  + the crowd claps on 2 and 4. Sections without band (intro, stop-time) stay piano only. Layers fade in /
  out over ~0.3 s, with a toast ("DRUMS OUT!", "BASS BACK!").
- The right hand sounds only for notes you hit (early hits are placed on the beat, late ones sound at
  once); a missed note is silent.

### Crowd
- Squadmates around the piano: **max(2 + ⌊combo / 10⌋, round(groove × 7))**, between 2 and 7 (Duke and
  Shooter always stay), so one miss does not scatter them but a lot of misses do. They walk in / out, bob on the beat, raise their glasses
  with the combo (a toast at every 10 in a row), cheer ("woo!") at combo 10, 20, 30 … and groan when a
  combo of 8 or more breaks.

### Round
- Pre-roll **2 s** (notes fall in), the tune (~58 s), ring-out **1.5 s** → over; the scene holds a banner
  for **3 s**: **ENCORE!** (≥ 95 % of the notes hit), **NICE SET!** (≥ 75 %), **TOUGH CROWD…**
  (below), with the stats (perfect / good / miss, best combo) and the end banter line, then returns the
  score.

### Medals
- **Bronze 20 000, silver 44 000, gold 66 000** points (of 82 000). Gold ≈ a full combo (or one or two
  breaks) with mostly perfects; a single combo break costs roughly 6 000 points (the multiplier rebuilds over
  30 notes).

## Balance playtest (2026-10-25)

Simulated players on the pure rules (`tests/unit/piano-bots.ts`): each note pressed at its time plus a
Gaussian error, quantised to the 1/60 s tick, sometimes skipped (`lapse`), more often when it follows the
previous note by less than 0.14 s (`rush`). 200 seeds:

| Player | σ | lapse / rush | p10 | p50 | p90 | none / bronze / silver / gold |
|--------|---|--------------|-----|-----|-----|-------------------------------|
| Perfect | 0 | 0 / 0 | 82 000 | 82 000 | 82 000 | 0 / 0 / 0 / 200 |
| Expert | 22 ms | 0.2 % / 1 % | 64 850 | 74 300 | 81 000 | 0 / 0 / 21 / 179 |
| Skilled | 35 ms | 0.8 % / 4 % | 42 300 | 50 750 | 62 400 | 0 / 29 / 163 / 8 |
| Average | 50 ms | 2.5 % / 10 % | 20 250 | 24 350 | 31 200 | 17 / 183 / 0 / 0 |
| Novice | 75 ms | 7 % / 25 % | 10 200 | 11 300 | 12 600 | 200 / 0 / 0 / 0 |
| Masher (all keys every 2 / 4 / 8 / 15 ticks) | | | 0 | 0 | 0 | none |
| Guesser (right times, random lanes) | | | | ≈ 500 | | none |

`tests/unit/piano-pilots.test.ts` asserts the key rows over 40 seeds. The first draft had no cost for a
wrong key: the every-8-ticks masher then scored 17 400 (more than the novice), hence the 50-point cost.

**Browser** (dev server, the round driven tick by tick with real `KeyboardEvent`s on the arrow keys, timing
jitter only): perfect 82 000 (gold, ENCORE!), ±22 ms 80 800 (gold, 204 perfect / 6 good), ±35 ms 74 950 (gold,
full combo), ±50 ms 40 850 (bronze, 8 misses, 8 wrong keys); touch taps on the lanes hit (15 / 15 perfect
in the intro); pause stops the deck, resume restarts it in place; German texts checked on screen.

## Presentation

- **Scene (left, x < 770)**: the officers' club at night — dark wood panelling, an "OFFICERS' CLUB" neon
  sign, framed jet silhouettes, a pennant with an original star-and-wings emblem, a bar shelf with bottles,
  warm string lights, a hanging lamp whose cone lights the piano, a plank floor.
- **The piano**: an old upright in three-quarter view (its end panel towards us, the keyboard receding to
  the upper left), music desk with a sheet, a beer and a tip jar on the lid; the keys light up where the
  hands play (right hand per lane, left hand on the eighths); the lamp's cone, the floor spot and the string
  lights glow brighter with the groove (the bulbs pulse on the beat).
- **The pilot** (people-kit side figure, pixel look) on a round red stool: the active pilot's avatar colours,
  off duty in a white T-shirt and flight-suit trousers. The right hand strikes on every hit and moves along
  the keys with the lane, the left hand rolls the boogie in time, the head bobs on the beat, a foot taps.
  Grins from combo 10 (and at the end), winces when a combo of 8 or more breaks.
- **The crowd**: Duke (always there first), Shooter in her deck-yellow T-shirt, the Chief, three squadmates
  and — at a big combo — the Admiral, all original people-kit figures in T-shirts / tank tops with beer
  mugs or tumblers.
- **Highway (right)**: a black-lacquer board with four lanes (red, gold, green, cyan), beat lines (bar lines
  brighter), notes as rounded caps, chords joined by a bar, glissandi as wide gold notes with a sparkle
  trail; a row of four ivory keys at the hit line that depress when pressed, glow in the lane colour on a
  hit, flash red on a wrong note; key labels below (← ↓ ↑ → / A S W D, X A Y B on a pad, "TAP" on touch /
  mouse). Combo ghosted in the middle with the multiplier ring under it (the ring fills towards the next
  ×), one central PERFECT / GOOD / MISS / WRONG KEY / GLISS! pop over the keys (a new one replaces the
  last — per-lane pops overlapped into a mess), sparks on hits, missed notes turn grey and fall through.
  The groove meter is a vertical bar left of the highway with the drum / bass / claps marks; the section
  plate and song progress sit at the top.
- **Banter**: retro RPG text box (doc 20) at the top left with the speaker's pixel portrait and name plate,
  typed out with voice blips: Duke at "band in", the Chief at the break, the Admiral at stop-time; one
  reaction line each when combo 50 is reached (Shooter) and when the drums first drop out (the Chief); the
  end line by verdict (Shooter: encore, Duke: nice set, Chief: tough crowd). Lines stay up 2.6 s after typing
  (the player only glances between notes); queued lines older than 2.5 s are dropped.
- **Scale**: the piano and the seated pilot share one projection at 0.8 (the pilot's seat is derived from the
  piano's geometry); the squadmates behind the piano stand at 0.64 – 0.73, the ones in front at 0.78 – 0.84.
  (A first pass at 0.95 made the seated pilot tower over the standing crowd.)
- **Pixel frames**: the pilot and crowd poses are reduced to two frames per motion (strike / lift, bob, roll,
  foot tap; glass at chest / up / toast, free arm down / pumping, blink open / shut) so the pixel cache
  (doc 20) holds them; the crowd reacts to a toast one after another so no frame re-renders all seven.
  Measured in the dev build: render ≈ 0.4 ms, update ≤ 1.3 ms per frame.

## Data Flow

Reads `game.profile` (avatar colours, callsign for the banter). Writes nothing itself: the shell records the
score (doc 10). The shell's menu music stops when the round is created; the round plays its own deck.

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 17 (people kit), 20 (pixel portraits, RPG box, typed text),
06 (`typewriter` / `typingTime` / `syllableIndex`), 01 (input actions, audio engine, music bus).

## Security

None (no persisted data of its own).

## Known Issues

See `known_issues` in the frontmatter.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
