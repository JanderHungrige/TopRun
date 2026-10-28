---
id: 42-high-five
title: High Five - Up High, Down Low with Duke on the Flight Deck
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub, 17-people-kit, 21-beach-volleyball, 07-i18n]
relates: [10-minigames-core, 21-beach-volleyball]
source_files:
  - src/game/minigames/highfive.ts
  - src/scenes/minigames/highfive.ts
  - src/render/minigames/highfive-deck.ts
  - src/render/minigames/highfive-poses.ts
  - src/render/minigames/highfive-hud.ts
  - src/i18n/minigames/highfive.ts
routes: []
models: []
test_files:
  - tests/unit/high-five.test.ts
data_flow: greenfield
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [minigames, high-five, rhythm, timing, duke, flight-deck, people-kit]
path: Game/Minigames/HighFive
initiative: off-duty-minigames-2
wave: off-duty-minigames-2-wave-1
wave_status: active
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts), PLAYABLE (registry.ts)"
    when: "the rec room plays `highfive` once mission 4 is cleared; the shell runs rules card, 3-2-1, the round, the result"
satisfies_contracts: []
known_issues:
  - "Reading of the owner's 'top, then 180 degree below': the arms swing a half circle from the high slap down to the low one (up high, down low); if the owner meant a body spin, only the poses change."
security_read_sites: []
sister_projects: []
---

# 42 — High Five

## Purpose

Owner (2026-10-28): *"doing the topgun high five (top, then 180 degree below)"*. The pilot and Duke celebrate on
the flight deck at sunset: they run at each other, **jump and slap hands up high**, the arms swing **a half circle
(180°) down** and they **slap down low** as they land, then run on past each other — eight times, faster each time.
A one-button timing game. Unlocks after mission 4. The gesture only — no film scene, music or lines.

## Rules (`src/game/minigames/highfive.ts`, pure)

- **8 reps**; rep *r* (0 … 7) lasts `d = 2.6 − 0.14 r` s (2.6 → 1.62 s). In each rep three **beats** at fixed
  fractions of `d`: **JUMP** 0.42 (take-off marks), **UP HIGH** 0.57 (the apex), **DOWN LOW** 0.80 (just after
  landing at 0.72). Even reps run left → right, odd reps back.
- **One button** — CONFIRM / SPACE, pad A, a click or a tap anywhere — is judged against the next unjudged beat:
  |Δt| ≤ 0.06 s **PERFECT** (100), ≤ 0.14 s **GOOD** (60); a press 0.14 … 0.30 s early, or the beat passing by more
  than 0.14 s, is a **MISS** (0); a press more than 0.30 s before the next beat is ignored (no punishment for a
  nervous tap between reps). One press judges at most one beat.
- Score = sum, 0 … 2400 (24 beats), higher is better. Medals: **bronze 1200, silver 1700, gold 2100**.
- What a miss looks like: "MISS" pops up red and the hands meet without a clap or star burst (the routine itself
  plays on, so the next beat is always readable). Duke never misses.

## Screen (logical 1280 × 720)

Side view of the carrier's flight deck at sunset (pixel-art layers): sky bands, low sun, the sea, a parked jet and
the island as silhouettes, the deck (y 600) with a yellow line and the two take-off marks. The figures are
people-kit side figures (doc 17) at the volleyball scale: the player in their own look (preset or builder look,
flight suit) and Duke (the push-up duel's Duke). Poses are key frames: run cycle, crouch, rise, the slap up high
(near arm straight up), the half-circle swing, landing crouch, the slap down low (arm low forward), run on.

**Beat cue**: a target ring where the hands will meet (at the deck marks for JUMP, up high for UP HIGH, down low for
DOWN LOW) and an outer ring shrinking onto it over 0.6 s — it touches the target ring exactly on the beat. The
verdict pops at the meeting point ("PERFECT!" gold, "GOOD" cyan, "MISS" red); a clap shows a pixel star burst and
plays a clap sound. A row of 24 small pips under the top bar fills with the beats' colours. The shell's top bar
shows the live score.

## Text

`src/i18n/minigames/highfive.ts` (`gameText`, EN + DE): rules, controls, score format, beat names (JUMP / UP HIGH /
DOWN LOW — DE: SPRUNG / OBEN / UNTEN), verdicts (PERFECT! / GOOD / MISS — DE: PERFEKT! / GUT / DANEBEN), rep counter.

## Business Rules

- Timing is judged in fixed 1/60 s ticks from the round's own clock (the shell pauses it), never wall time.
- The same presses at the same ticks always give the same score (pure state + step function).

## Verification (2026-10-28)

Vitest `high-five.test.ts` (7): eight reps getting faster with three ordered beats, rep lookup, all-perfect
2400, no presses all-miss 0, late / early / far-too-early presses, one beat per press, points and medals. Dev
server: rules card → runs on the deck at sunset, the cue ring at the take-off mark / up high / down low, MISS
pop-ups, the round ending in the result card; key frames checked on a contact sheet (run, crouch, rise, up high,
swing, down low) with the preset pilot 4 and Duke.

## Dependencies

10 (shell, medals, bests), 11 (rec-room card), 17 (people kit), 21 (side-figure pose helpers and looks), 07.

## Security

None (local scores).

## Known Issues

- Reading of the owner's "top, then 180 degree below": the arms swing a half circle from the high slap down to the
  low one; if the owner meant a body spin, only the poses change.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
