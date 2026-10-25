---
id: 12-pushup-challenge
title: Push-up Challenge - Rhythm Push-up Duel Against the Wingman
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core, 11-base-hub]
source_files:
  - src/game/minigames/pushups.ts
  - src/scenes/minigames/pushups.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/pushups-pilot.ts
  - src/render/minigames/pushups-head.ts
  - src/render/minigames/pushups-looks.ts
  - src/render/minigames/pushups-set.ts
  - src/render/minigames/pushups-crowd.ts
  - src/render/minigames/pushups-board.ts
  - src/render/minigames/pushups-hud.ts
  - src/render/minigames/pushups-icon.ts
  - src/i18n/minigames/pushups.ts
routes: []
models: []
test_files:
  - tests/unit/pushups.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, pushups, rhythm, stamina, rival, wingman]
path: Game/Minigames/Pushups
initiative: off-duty-minigames
wave: off-duty-minigames-wave-1
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "PUSHUPS is listed in PLAYABLE; the shell runs rules → 3-2-1 → round → result and saves the best"
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 12 — Push-up Challenge

## Purpose

The first off-duty minigame (unlocks after mission 1): a 30-second push-up duel, side view, the
player's pilot on the left and the wingman Lt. "Duke" Carter on the right. It is a **rhythm** game,
not a button masher: alternate LEFT (down) and RIGHT (up), keep each rep inside the tempo zone, and
manage a stamina bar. For fun only (doc 10): the score is a personal best with a medal.

## Architecture

```
game/minigames/pushups.ts       PushupState + stepPushups (pure, seeded): strokes, reps, tempo rating,
                                stamina, burnout, rival schedule, end of round, winner; PUSHUP_MEDALS
scenes/minigames/pushups.ts     PUSHUPS: MinigameModule; PushupRound maps input → strokes, animates
                                the bodies, plays sounds, holds the result banner, returns the score
render/minigames/pushups-set   gym and beach-at-sunset backdrops, mats / towels, scoreboard posts
render/minigames/pushups-crowd three cheering spectators (coach with whistle, two crew members)
render/minigames/pushups-pilot side-view push-up figure (T-shirt, flight-suit trousers, sneakers):
                               pose from depth 0..1 and collapse 0..1, two-bone arm IK
render/minigames/pushups-head  profile head, hair styles crew / bob / long / messy, strain + dizzy face
render/minigames/pushups-looks colours per player avatar (pilot1-3) and for Duke
render/minigames/pushups-board wall scoreboard: both counters around the round clock
render/minigames/pushups-hud   tempo meter, stamina bar, DOWN / UP key hints, pop-ups, banners
render/minigames/pushups-icon  hub / offer card icon (animated pilot + stopwatch)
i18n/minigames/pushups.ts       EN/DE table (gameText): rules, controls, HUD labels, banners, score
```

The pure step gets one input per fixed tick, `{ left, right }` = "pressed this tick". The scene maps
keys (←/→, A/D), gamepad (d-pad / stick left / right — the existing `left` / `right` actions) and
taps / clicks (`input.taps`: x < 640 → left, else right) onto it. The scene diffs consecutive states
for effects (rep made → pop-up + sound, burnout started → collapse sound).

## Business Rules

### Round
- Round length **30 s** (`ROUND_TIME`). The round starts at GO (after the shell's 3-2-1).
- When time is up the state is `over`; the scene keeps the field for **2.4 s** with a banner —
  "YOU WIN" (more reps than the rival), "DUKE WINS" (fewer) or "DEAD HEAT" (equal) — then returns
  the score. The banner never changes the score.
- **Score = completed push-ups** (`higherIsBetter: true`), formatted "{n} push-ups".

### Strokes and reps
- The pilot starts **up** (arms straight). LEFT while up → goes **down**; RIGHT while down → comes
  **up** and completes **one rep**. Any other press is ignored (LEFT while down, RIGHT while up).
- At most one stroke per tick: if both are pressed in one tick only the one that fits the current
  position counts (from up: down).
- The body follows smoothly (render only, exponential approach); the rep counts on the press.

### Tempo zone
- A rep's **interval** = time since the previous completed rep. The first rep after GO has no
  interval and is always clean. After a burnout the tempo restarts the moment the pilot is back up
  (the next rep is rated from then — mashing straight after a burnout burns out again).
- Interval **0.60 s – 0.90 s** (inclusive) → **clean**; under 0.60 s → **too fast**; over 0.90 s →
  **too slow**. The tempo meter shows a needle that sweeps 0 → 1.5 s since the last rep over a
  red (fast) / green (zone) / amber (slow) scale; the rating pops up after each rep.

### Stamina and burnout
- Stamina **0 – 100**, starts full.
- Each rep costs: clean **3**; slow **2**; too fast **3 + 100 × (0.60 − interval)** (e.g. an
  interval of 0.50 s costs 13, 0.30 s costs 33).
- Recovery outside burnout: **1.5 / s** always; **18 / s** once no stroke was made for **0.6 s**
  (pausing). Capped at 100.
- Stamina reaches **0 → burnout**: the pilot collapses on the mat for **1.5 s**, input is ignored,
  then stamina is **25**, the pilot is up again and the tempo restarts from that moment.
  The rep that emptied the bar still counts. Below 20 % stamina the HUD blinks "PAUSE TO RECOVER".
- Consequence (bot playtests below): a steady rhythm inside the zone lasts the whole round (at
  0.66 s it ends with ~6–9 stamina left); mashing burns out within seconds and keeps burning out.

### Rival — Lt. "Duke" Carter (the squadron's wingman, original character)
- Seeded schedule made at round start: **36–40 reps** (uniform), per-rep interval jitter **±7 %**, a
  **12 %** slow-down from the first to the last rep (he tires), the last rep lands at **29.0–29.8 s**.
- His counter is live on the scoreboard; his body animates down / up within each scheduled rep.

### Medals (tuned by bot playtest, see below)
- **Bronze 25, silver 35, gold 45** push-ups.
- Beating Duke (36–40) needs a steady rhythm around 0.70–0.75 s (silver); gold needs a near-perfect
  0.66 s rhythm for all 30 s — rushing the fast edge of the zone burns out and loses gold.

### Presentation
- Setting per round from the seed (even = gym, odd = beach): base gym (cinder-block wall with the
  squadron stripe and an original patch, dumbbell rack, punching bag, hanging lamps, wooden floor,
  blue mats) or the beach at sunset (sun on the sea, palms, gulls, striped towels, the scoreboard
  on posts). Three spectators cheer on the player's clean reps, in the last 5 s and on a win.
- Scoreboard: callsign and Duke's counter in amber LED digits around a round clock (red wedge =
  time left, pulsing red in the last 5 s). The loser of the duel flops onto the mat at the end.
- HUD: tempo meter + stamina bar bottom left, DOWN / UP key caps bottom right (the next expected
  stroke glows; both dim during a burnout and after time is up); "+1" and the rating pop up over
  the player's head; "BURNOUT!" over the collapsed pilot with dizzy stars.
- Low stamina (< 50) shows on the player: flushed cheek, squint, gritted teeth, sweat drops and a
  sweat patch; Duke tires visibly over the round.
- The player's figure uses the colours of the active pilot's avatar (hair, skin, flight-suit
  trousers); the scoreboard shows the pilot's callsign ("YOU" / "DU" without a profile). All art is
  original vector drawing.
- Sounds (existing SFX only, panned to each side): clean rep `uiMove` (pitch rises with the clean
  streak), slow rep low `uiMove`, fast rep `hit`, burnout `playerHit`, Duke's reps a quiet low
  `uiMove`, last-5-seconds ticks high `uiMove`, end `powerup` (win) / `denied` (loss / tie).

## Balance playtest (2026-10-25)

Bot playtests of the pure rules at 60 ticks / s (the first five rows are asserted in
`tests/unit/pushups.test.ts` over 20 seeds; the jitter rows over 40 seeds, Gaussian jitter per stroke):

| Strategy | Reps | Medal |
|----------|------|-------|
| Masher, a press every 0.10 s (≈ 19 burnouts) | 21 | none |
| Semi-masher, a rep every 0.50 s (9 burnouts) | 33 | bronze |
| Steady 0.75 s (≈ Duke's pace) | 40 | silver |
| Steady 0.66 s, exact | 45 | gold |
| Human-like 0.68 s ± 25 ms per stroke | 43 – 44 | silver, beats Duke on every seed |
| Slow and steady, 1.0 s | 29 – 30 | bronze |
| 0.80 s ± 50 ms | 36 – 38 | silver |
| 0.66 s ± 30 ms | 43 – 45 | gold in 28 / 40 |
| Rushing the zone edge, 0.60 s ± 30–45 ms | 34 – 44 (4–5 burnouts) | silver, no gold |

In-browser (dev server, real-time loop, `setTimeout` key presses): a stroke every 335 ms with
± 25 ms jitter scored **45 (gold), 43 clean, 0 burnouts, 6 stamina left** against Duke's 40.
Conclusion: medal limits stay at the planned 25 / 35 / 45 — gold is hard (a sustained, precise
rhythm at the fast end of the zone) but possible.

## Data Flow

Reads-existing: `game.profile` (callsign, avatar) for the label and colours; writes nothing itself
(the shell records the best, doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 01 (input actions, audio).

## Security

None — no persisted data of its own.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
