---
id: 109-ramp-start
title: Ramp Start - Rev the Engine Through the Countdown Lights and Roll Off the Lander onto the Steppe
edition: TopRun
depends_on: [04-carrier-takeoff, 84-drop-launch, 103-tank-kit]
relates: [84-drop-launch, 104-tank-drive]
source_files:
  - src/game/ramp-start.ts
  - src/render/ramp.ts
  - src/scenes/ramp-start.ts
  - src/scenes/routes.ts
  - src/game/dialogue-scripts.ts
  - src/i18n/lines-steppe-en.ts
  - src/i18n/lines-steppe-de.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
routes: []
models: []
test_files:
  - tests/unit/ramp-start.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [launch, ramp, lander, countdown, revs, drag-start, takeoff-rating, map-7, minigame]
path: Game/Launch/Ramp Start
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-5
wave_status: complete
---

# 109 — Ramp Start

## Purpose

Every world has its launch (the catapult, the liftoff, the dive, the rocket, the drop). On the steppe the vehicles come
down in a lander: its ramp drops, the countdown lights run, and the pilot holds the revs in the green band to roll off
on green — a drag start. Rated like the catapult (doc 04): perfect, good, early, late, skipped; the launch bonus and the
medals that count launches work unchanged.

## Rules (`stepRamp`, pure, `src/game/ramp-start.ts`)

- 1.4 s with the ramp coming down, then three red lights 0.8 s apart and the green 0.8 s after the third (green at 3.8 s).
- Holding the throttle (SPACE, ↑, or holding the screen) raises the revs by 0.75 / s; let go they fall by 0.95 / s (0 … 1).
  Held from the start they are at the top long before green: the pilot feathers the throttle.
- On green the brake lets go and the revs at that moment rate the start: **perfect** in the band 0.70–0.85, **good**
  0.55–0.95, **early** above 0.95 (wheelspin), **late** below 0.55 (bogged down). No throttle at all: **skipped**.
- The gauge shows the perfect band in green and the good band in yellow; the needle shakes near the top.

## The scene

Side view, drawn in code: the golden steppe at dawn under a pale sky with the big moon, the lander standing on its legs
with the ramp lowering, the vehicle (`drawPlaneSide`, its paint) inside; the light tree on a pole by the ramp. On green
the vehicle rolls down the ramp and away — fast on a perfect start, with spinning wheels and a dust cloud on an early one,
slow and sputtering on a late one — and the camera follows it a little. Shooter (the launch controller in steppe kit,
doc 111) calls the ramp, the lights and the grade (`sh.ramp*`). S or SKIP LAUNCH skips (rated skipped), ESC goes back
to the map. The lander's bay light is red until green, then green.

## Business Rules

- `createRamp`, `stepRamp(state, input, dt)`, `gradeRamp(revs)` pure; `RAMP` the numbers.
- Map 7's takeoff route opens `RampStartScene` (doc 102's stand-in, the mission straight away, goes).

## Verification

Unit: `ramp-start.test.ts` (timing, grades, skipped without throttle). Browser (dev server on the branch): m181's
takeoff opens the ramp start; the ramp swings down, the lights count, throttle held from 1.3 s into the lights gives
84 % on green — PERFECT START, the bay light turns green and the buggy rolls nose-down off the ramp; without throttle
"BOGGED DOWN" (rated skipped); then the mission starts.
