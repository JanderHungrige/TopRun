---
id: 19-dogfight-tactics
title: Dogfight Tactics - Turn-Based BFM Puzzles on the Briefing-Room Whiteboard
edition: TopRun
depends_on: [10-minigames-core, 17-people-kit]
relates: [10-minigames-core, 17-people-kit]
source_files:
  - src/game/minigames/tactics-moves.ts
  - src/game/minigames/tactics.ts
  - src/scenes/minigames/tactics.ts
  - src/scenes/minigames/tactics-view.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/tactics-room.ts
  - src/render/minigames/tactics-marker.ts
  - src/render/minigames/tactics-paths.ts
  - src/render/minigames/tactics-board.ts
  - src/render/minigames/tactics-cards.ts
  - src/render/minigames/tactics-instructor.ts
  - src/render/minigames/tactics-icon.ts
  - src/i18n/minigames/tactics.ts
  - src/i18n/minigames/tactics-lines.ts
routes: []
models: []
test_files:
  - tests/unit/tactics.test.ts
  - tests/unit/tactics-round.test.ts
  - tests/unit/tactics-pilots.test.ts
  - tests/unit/tactics-bots.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, dogfight-tactics, bfm, whiteboard, turn-based, puzzle, instructor, energy]
path: Game/Minigames/DogfightTactics
initiative: off-duty-minigames
wave: off-duty-minigames-wave-3
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "TACTICS is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawFrontFigure (src/render/people/index.ts, doc 17)"
    when: "the instructor stands beside the whiteboard as a three-quarter people-kit figure"
satisfies_contracts: []
known_issues:
  - "A round is long for a minigame: about 34 turns (3 – 5 minutes with reading)."
  - "Engagement 8 (on your six, bandit faster, ACE) is rarely won: even the lookahead player separates in about half the rounds, a best-card player is shot down in ~20 %."
  - "Lead pursuit up close with a one-point energy edge is a deliberate trap (q +3, but −3 overshoot against a break); a player who only reads the q table falls for it, the card hint warns."
  - "The instructor gestures with a raised marker rather than an outstretched pointing arm: the people kit's front figure only raises arms."
  - "Handwriting uses the system font stack (Marker Felt / Chalkboard SE / Segoe Print / Comic Sans MS / cursive), so it looks different per OS."
  - "Continuing quickly replaces a half-written instructor line with the next one."
security_read_sites: []
sister_projects: []
---

# 19 — Dogfight Tactics

## Purpose

Minigame 10 of the off-duty initiative (unlocks after mission 24, doc 10). The briefing room: an
original instructor, **Commander Hal "Inkwell" Okafor** (a seasoned, grey-haired squadron commander
with a marker — not anyone from a film), sketches eight engagements on a big whiteboard: the
player's jet in blue marker, the bandit in red, speed arrows, range and altitude notes. Each
engagement is a short **turn-based puzzle**: read the situation, play one of four basic-fighter-
manoeuvre (BFM) cards, watch both paths being drawn, hear the debrief. An advantage meter swings
each turn: push it to **GUNS — TRACKING** before the bandit gets a firing solution. For fun only
(best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/tactics-moves.ts  geometry / range / altitude types, the 10 manoeuvres, the four cards per
                                 geometry, their energy / altitude / range effects, quality(move, view) →
                                 { q, note }, the overshoot interaction, the bandit's doctrine — pure
game/minigames/tactics.ts        round state: 8 seeded engagement setups, bandit skill, seeded bandit choice,
                                 resolveTurn (meter, energies, altitude, range, geometry), outcome, points,
                                 next engagement, TACTICS_MEDALS — pure
scenes/minigames/tactics.ts      TACTICS: MinigameModule; TacticsRound: phases (wipe → choose → resolve … →
                                 summary), input, the turn timeline, sounds, instructor mood and voice
scenes/minigames/tactics-view.ts state → board / card view models and localized lines (no outcome logic)
render/minigames/tactics-room       briefing-room wall, whiteboard (frame, smudges, marker tray)
render/minigames/tactics-marker     marker strokes (wobbly polyline, arrowheads, circles), handwriting text
render/minigames/tactics-paths      manoeuvre path shapes (local frame) for the board and the card pictograms
render/minigames/tactics-board      jets, speed arrows, range line, notes column, advantage meter, stamps
render/minigames/tactics-cards      the four manoeuvre cards (title, pictogram, energy / altitude badges, hint)
render/minigames/tactics-instructor the instructor (people kit front figure, glasses, marker) + debrief box
render/minigames/tactics-icon       hub / offer card icon
i18n/minigames/tactics.ts           EN + DE UI strings: rules, controls, card names, hints, board notes, banners
i18n/minigames/tactics-lines.ts     EN + DE instructor lines (one per quality note / interaction / outcome)
```

The pure step is `playCard(state, move)`: it draws the bandit's card from the seed (engagement and
turn), resolves both cards and returns the next state with the turn's `last` result (both cards,
qualities, notes, interaction, meter change, outcome). `resolveTurn(situation, mine, his)` is exported
for tests. The scene only animates `last`; it never decides an outcome.

## Business Rules

### Situation
- **Geometry** (from the player's side): `defensive` (bandit on your six), `offensive` (you on his
  six), `merge` (head-on pass) or `abeam` (side by side, close).
- **Range**: close (guns range) / medium / far.
- **Energy** (speed) per jet **0 – 6**; **altitude** relative: you above (+1) / level (0) / below (−1).
- **Energy edge** `e = your energy − his energy + altitude` (height is stored energy). The board
  writes it as "EDGE: YOU +2 / EVEN / HIM +1". "Clear edge" = 2 or more.
- **Advantage meter** −10 … +10 (half-steps). **+10 → GUNS — TRACKING** (win), **−10 → firing
  solution** (loss). Geometry follows the meter: **≥ +4 offensive, ≤ −4 defensive**, otherwise abeam
  when close, merge when medium / far.

### Cards (four per geometry)

| Geometry | Cards |
|---|---|
| defensive | Break turn, Scissors, Extend, Split-S |
| offensive | Lead pursuit, Lag pursuit, High yo-yo, Low yo-yo |
| merge | Lead turn, Immelmann, Split-S, Extend |
| abeam | Scissors, Extend, Immelmann, Break turn |

Effects of a card on the jet that flies it (printed on the card as badges):

| Card | Energy | Altitude | Range |
|---|---|---|---|
| Break turn | −2 | | |
| Scissors | −1 | | |
| Extend | +2 | | +1 |
| Split-S | +1 | −1 | +1 |
| Lead pursuit | −1 | | −1 |
| Lag pursuit | +1 | | |
| High yo-yo | −1 | +1 | |
| Low yo-yo | +1 | −1 | −1 |
| Lead turn | −1 | | −1 |
| Immelmann | −2 | +1 | |

Range changes of both cards add up (clamped close … far); energy is clamped 0 … 6, altitude −1 … +1.

### Card quality q (the rules table)
**Stall rule first:** a card that costs more energy than the jet has scores **−3** ("stall").
Otherwise, from the flying jet's own view (`e` = its energy edge, `alt` its altitude):

| Geometry | Card | q |
|---|---|---|
| defensive | Break turn | close +2 · medium 0 · far −1 |
| | Scissors | not close −2 · close: e ≤ 0 +2, e > 0 −1 |
| | Extend | close −3 · medium: e ≥ 1 +2, e = 0 0, e < 0 −2 · far: e ≥ 0 +2, e < 0 0 |
| | Split-S | below him −2 · close 0 · medium / far +1 |
| offensive | Lead pursuit | close: e ≥ 2 −2 (overshoot), else +3 (guns) · medium +1 · far −1 |
| | Lag pursuit | close: e ≥ 2 +1, else 0 · medium 0 · far −1 |
| | High yo-yo | close: e ≥ 1 +2, else −1 · medium 0 · far −2 |
| | Low yo-yo | far +2 · medium 0 · close −2 |
| merge | Lead turn | far −1 · e ≥ 2 0 · else +2 |
| | Immelmann | e ≥ 1 +2 · e = 0 0 · e < 0 −2 |
| | Split-S | above +1 · level 0 · below −2 |
| | Extend | e < 0 +1 · else 0 |
| abeam | Scissors | e ≤ 0 +2 · e > 0 −1 |
| | Extend | e ≥ 1 +1 · e = 0 −1 · e < 0 −2 |
| | Immelmann | e ≥ 2 +2 · e = 1 +1 · e ≤ 0 −2 |
| | Break turn | e ≤ 0 +1 · e > 0 0 |

Every branch has its own instructor line (the "note"), e.g. "Never run from guns range!".

### Overshoot (the one interaction)
At **close range**, when the attacker plays **lead pursuit with the energy edge (e ≥ 1)** and the
defender plays **Break turn (+3)** or **Scissors (+2)**, the attacker overshoots: that bonus goes to
the defender. It works both ways (the player can force it, and suffer it when attacking too fast).

### Resolving a turn
- Meter change = `2 × q(yours) − q(his) + 2 × overshoot` (your card counts double: you fly it, the
  bandit's card is resistance), capped at **±8 close, ±6 medium, ±4 far** (things happen slower at
  range).
- Then energies, altitude and range change by both cards' effects; the geometry follows the meter.
- The debrief line is the overshoot line if one happened, otherwise the note of the player's card.

### The bandit
- He sees the mirrored situation (his edge = −yours) and plays from the same table. With probability
  **skill** he plays his best card (highest q; ties by his doctrine: lead pursuit, Immelmann, break,
  high yo-yo, scissors, low yo-yo, lead turn, lag pursuit, split-S, extend — "he goes for the
  throat"); otherwise a random one of his four. Seeded per round, engagement and turn.
- He never thinks about the overshoot — a smart bandit who is close behind you with the energy edge
  goes for the guns, and a break makes him overshoot.
- Skill per engagement: **0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9** (board label ROOKIE, ROOKIE,
  AVERAGE, AVERAGE, SHARP, SHARP, ACE, ACE).

### Round
- **8 engagements** of rising difficulty, each starts from a fixed setup; each energy is moved by ±1
  with a seeded 30 % chance (clamped 1 … 6):

| # | Start | Range | Energy you / him | Altitude | Par |
|---|---|---|---|---|---|
| 1 | offensive | medium | 4 / 3 | level | 2 |
| 2 | merge | medium | 4 / 3 | level | 3 |
| 3 | offensive | close | 5 / 3 | level | 2 |
| 4 | defensive | close | 4 / 4 | level | 4 |
| 5 | merge | far | 3 / 4 | you above | 3 |
| 6 | defensive | medium | 4 / 4 | level | 4 |
| 7 | abeam | close | 3 / 4 | level | 3 |
| 8 | defensive | close | 3 / 5 | you above | 4 |

- Start meter: offensive **+4**, defensive **−4**, merge / abeam **0**. At most **6 turns**: then both
  separate (draw).
- **Points**: kill within par turns (**FAST KILL**) **100**, later kill **70**, separated **30**, shot
  down **0**. **Score = total points** (max 800), `higherIsBetter: true`, formatted "{n} points".
- **Medals: bronze 300, silver 450, gold 560** (balance below).

### Controls
- ←/→ (or ↑/↓, A/D, W/S; gamepad d-pad / stick) select a card, ENTER / Space (gamepad A) plays it.
  Mouse: hovering highlights a card, a click plays it; touch: a tap plays it.
- After the paths are drawn (1.6 s): ENTER / Space / a tap / a click continues (debrief → next turn,
  result stamp → next engagement, summary → result card; the summary also ends by itself after 10 s).
  The same press during the drawing skips to the end of it. P / Esc pauses (shell).

## Presentation
- Briefing room: dark navy wall, ceiling light strip, a wall clock, the whiteboard (aluminium frame,
  ghost smudges, a tray with blue / red / black markers and an eraser) on the left, the four cards on
  the table edge below it, the instructor on the right.
- Whiteboard: a header ("ENGAGEMENT 3 / 8 — TURN 2 / 6 — PAR 2", bandit skill), the advantage meter
  (SHOT DOWN ← DEFENSIVE | NEUTRAL | OFFENSIVE → GUNS, a round magnet that slides, the change "+3"
  next to it), the plan-view sketch (both jets as marker silhouettes, speed arrows whose length is the
  energy, a HIGH tag with an arrow on the higher jet, a dimension line with the range above the jets)
  and the notes column (geometry, range, energy, altitude, circled edge). After a card: the blue path
  (from 0 s), then the red one (from 0.35 s), drawn stroke by stroke with arrowheads, an up / down
  arrow at the apex of vertical manoeuvres; at 1.0 s the bandit's card in red under the notes
  ("BANDIT: LAG PURSUIT") or "OVERSHOOT!" (blue when you forced it, red when you overshot); at 1.1 s
  the magnet slides and the change ("+7", half-steps) is written beside it.
- Engagement end (1.6 s): a circled stamp across the sketch — "GUNS — TRACKING!" (blue), "SHOT DOWN"
  (red), "SEPARATED" (black) with the points ("+100 FAST KILL"); the instructor's line gets the
  outcome line appended. Next engagement: the eraser sweeps the old board away (0.85 s) while the new
  hand fades in, then his intro line ("You're behind him, {callsign}. Don't waste it."). After the 8th:
  the board shows the debrief list of the eight results and the circled total, his final word by medal
  (gold / any medal / none), then the shell's result card.
- Cards: white index cards on the table, title in marker, a pictogram of the path, energy badge
  (bolt, −2 … +2) and altitude arrow, the hint (16 hints: one per geometry and card). The selected card
  lifts and glows cyan; while resolving, the played card glows gold and the others dim. A pill over the
  cards says ENTER / TAP — NEXT when the game waits.
- Instructor (people kit front figure, doc 17, scale 1.52): dark skin, grey crew cut and brows,
  reading glasses, khaki short-sleeve uniform shirt (collar points, buttons, pocket with a pen, blank
  name tag, belt, no insignia), khaki trousers, dark shoes; a marker in the board-side fist. He raises
  the marker and looks at the board while the paths are drawn, otherwise faces the class. Reactions
  at 1.2 s: grin and a nod (q ≥ 2 or an overshoot you forced, and on a kill), wince (strain and a lean)
  for q ≤ −1 or an overshoot you suffered (and when shot down), else calm; back to calm after 2.8 s.
  His line appears in a handwritten box (marker font stack, wobbly hand-drawn border, his name label)
  above his head, typewriter-style (34 characters / s) with low `voice` babble.
- Sounds (existing SFX only): select `uiMove`, play `uiSelect` + a quiet high `flare` swish, the
  bandit's path a second swish, meter up `pickup` / down `denied`, overshoot `special`, kill `gun` +
  `powerup`, shot down `warning` + `playerHit`, separated `radioClick`, eraser `flare` (low pitch),
  summary `powerup` (silver or better) / `radioClick`, instructor `voice` syllables (pitch 0.78).

## Balance playtest (2026-10-25)

Simulated players on the pure rules (`tests/unit/tactics-bots.ts`, 200 seeds; medals 300 / 450 / 560):

| Player | p10 | p50 | p90 | ≥ bronze | ≥ silver | gold | turns / round |
|---|---|---|---|---|---|---|---|
| Random card | 90 | 160 | 230 | 2 % | 0 | 0 | 35 |
| Always the aggressive card (first of the hand) | 150 | 240 | 330 | 31 % | 1 % | 0 | 35 |
| Rule of thumb (reads range, ignores energy) | 220 | 300 | 400 | 53 % | 4 % | 0 | 38 |
| Best card, but 30 % random mistakes | 330 | 430 | 500 | 96 % | 35 % | 1 % | 36 |
| Best card, but 15 % random mistakes | 400 | 490 | 580 | 100 % | 70 % | 18 % | 35 |
| Always the best card for the situation (q table) | 470 | 550 | 640 | 100 % | 96 % | 50 % | 34 |
| Reads the bandit (best card + overshoot) | 470 | 570 | 640 | 100 % | 97 % | 52 % | 33 |
| Lookahead 2 turns, knows the bandit's odds | 540 | 600 | 650 | 100 % | 100 % | 78 % | 33 |
| Lookahead 3 turns | 530 | 600 | 670 | 100 % | 100 % | 79 % | 33 |

Per engagement (best-card player, fast kill / kill / separated / shot down of 200): 1: 69/122/9/0,
2: 101/90/9/0, 3: 123/77/0/0, 4: 55/54/91/0, 5: 15/142/43/0, 6: 19/114/67/0, 7: 120/52/28/0,
8: 6/81/71/42. Gold needs the right card almost every turn plus energy sense; ignoring energy (rule of
thumb) never gets there. `tests/unit/tactics-pilots.test.ts` asserts the key rows over 60 seeds.

**Browser** (dev server, a keyboard pilot sending real `KeyboardEvent`s — arrows to the best card,
ENTER, ENTER to continue): 580 points (gold, new personal best) — 6 kills (2 fast), 1 separation, the
overshoot reversal in engagement 8; a second round 570 (shot down in engagement 8). A mouse click on a
card plays it; the German texts, the eraser wipe, stamps, summary, result card and the hub card checked
on screen at 1280×720.

How the numbers got here (prototype runs, each step re-run against the players above):
- First draft (meter ±6 with ±3 thresholds, symmetric q difference, energy 0 – 5): late engagements
  were unwinnable even for the lookahead player — a far-range defender had no non-losing card and
  the bandit's low yo-yo kept scoring → range caps on the meter change, far-range extend / split-S.
- A full counter cycle (break > lead > extend > lag > break, …) made the hinted best card lose to
  the bandit's equally right card → only the overshoot stays, and only with closure (the attacker's
  energy edge), so the hint "lead pursuit is the kill up close — unless you are faster" holds.
- Fights stalled at zero energy → lag pursuit regains +1, energy 0 – 6, the stall rule.
- Symmetric smart bandits cancelled out the player's good choices (stalemates, mostly draws) →
  the player's card counts double, the meter is shorter (±10 half-steps, ±4 thresholds).
- 5 instead of 6 turns cut the spread at the top (lookahead gold 57 %) → 6 turns.

## Data Flow

Reads `game.profile?.callsign` for the instructor's lines. Writes nothing itself: the shell records
the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 17 (people kit front figure), 06 (`typingTime`,
`syllableIndex`), 01 (input, audio). The callsign falls back to "pilot" / "Pilot" without a profile.

## Security

None (no persisted data of its own).

## Known Issues

See `known_issues` in the frontmatter.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
