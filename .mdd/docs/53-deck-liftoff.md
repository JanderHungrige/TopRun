---
id: 53-deck-liftoff
title: Deck Liftoff - The Helicopters' Take-off, Lifting Off the Deck in Gusting Wind, Rated Like the Catapult
edition: TopRun
depends_on: [04-carrier-takeoff, 49-helicopter-kit, 48-third-map]
relates: [04-carrier-takeoff, 50-helicopter-flight]
source_files:
  - src/game/liftoff.ts
  - src/scenes/liftoff.ts
  - src/scenes/liftoff-hud.ts
  - src/main.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
test_files:
  - tests/unit/liftoff.test.ts
routes: []
models: []
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [takeoff, liftoff, helicopters, carrier, gusts, rating, map-3, minigame]
path: Game/Takeoff/Deck Liftoff
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 53 — Deck Liftoff

## Purpose

Wave 4 of New Frontiers (owner's choice: "new launch games"). A helicopter doesn't need the catapult: map-3 sorties
start on the carrier's deck, and the pilot lifts off in gusting wind, keeping the helicopter level, then noses over
and goes. Rated like the catapult (doc 04), with the same take-off bonus (perfect +15 %, good +5 %).

## How it plays

Side view of the carrier as in the catapult launch, the pilot's helicopter on a deck spot.

1. **Spool:** the rotor spins up by itself (2.2 s) — "ROTORS SPINNING UP…". The collective does nothing yet.
2. **Lift:** hold SPACE / J / ↑ (touch: hold) and the helicopter climbs 3.4 m/s; let go and it sinks back to the
   deck (2.2 m/s). Off the deck, gusts pitch the nose up and down (three slow sines, a third as strong on the deck,
   full strength at hover height); ← (nose up) / → (nose down) — on touch, sliding left / right from where the finger
   came down — holds it level. The PITCH gauge shows the needle against a green (perfect, ±0.15 rad) and an amber
   (good, ±0.3 rad) band; the HEIGHT bar fills to the hover mark (12 m).
3. **Hover:** at 12 m — "HOVER HEIGHT — E: NOSE OVER AND GO!" (the GO button on touch).
4. **Away:** the helicopter noses over and flies off; the mission starts.

## Rating

| | when |
|---|---|
| perfect | worst pitch off the deck ≤ 0.15 rad and E within 1 s of reaching hover height |
| good | worst pitch ≤ 0.3 rad and E within 2.5 s |
| early | E before hover height (nosed over too early) |
| late | anything else — wobbly, slow, or no E for 4 s (it goes anyway) |
| skipped | SKIP LAUNCH (S) |

Hands off the stick, the gusts push the nose past 0.3 rad: `late`. Countering them keeps it in the green
(`tests/unit/liftoff.test.ts`: a steady hand flies perfect, a looser one good).

## Business Rules

- Pure state machine `stepLiftoff` / `rateLiftoff` / `gust` and `LIFTOFF` (`src/game/liftoff.ts`); the scene
  (`src/scenes/liftoff.ts`) and HUD (`src/scenes/liftoff-hud.ts`) only draw and read input.
- Every map-3 take-off route goes to the liftoff (`createScene`, `src/main.ts`); maps 1–2 keep the catapult.
- ESC returns to the map, as on the catapult.
