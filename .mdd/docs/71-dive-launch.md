---
id: 71-dive-launch
title: Dive Launch - Out of the Carrier's Well Deck and Down Through the Gap Under the Anti-Sub Net
edition: TopRun
depends_on: [65-fifth-map, 59-rocket-launch, 04-takeoff]
relates: [59-rocket-launch, 53-deck-liftoff, 65-fifth-map]
source_files:
  - src/game/dive-launch.ts
  - src/scenes/dive-launch.ts
  - src/render/dive.ts
  - src/scenes/routes.ts
  - src/i18n/ui-en-deep.ts
  - src/i18n/ui-de-deep.ts
routes: []
models: []
test_files:
  - tests/unit/dive-launch.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [launch, submarines, dive, well-deck, minigame, takeoff-rating, map-5]
path: Game/Takeoff/Dive Launch
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 71 — Dive Launch

## Purpose

Wave 3 of Deep Water. The initiative's plan: *"Map-5 sorties start with a dive from the carrier's well deck."* Until now
a map-5 sortie went straight into the mission (`skipped`, doc 65). Like the catapult (doc 04), the deck liftoff (doc 53)
and the rocket launch (doc 59), the dive is a short skill moment graded for a bonus.

## The dive (side view)

The carrier's stern is drawn cut open: the flooded well deck inside, the stern gate lowered as a ramp, the sea beyond.
Out in the water a line of buoys holds the carrier's **anti-sub net**, hanging down to **9 m**; under it the **reef**
rises to **21 m**. The sub has to dive through the gap.

1. **Flood** — 2 s: the well deck floods, the sub floats free ("FLOODING THE DECK").
2. **Out and down** — the sub moves out over the ramp on its own (9 m/s). **Hold SPACE** (↓, A on a gamepad, the
   joystick's fire, or hold the screen on touch) to flood the ballast tanks: the sub sinks, nose down. **Let go** to
   blow ballast: it rises. Depth has momentum (up to 5 m/s, 4 m/s² either way), so the pilot lets go about 3 m before
   the depth they want; holding all the way down overshoots into the reef. Inside the dock the deck floor
   stops it at 4.5 m.
3. **The net** — passing the buoy line 78 m out, the sub's depth is graded. A green band on the depth gauge marks the
   middle of the gap (15 m).
4. **Clear** — past the net the sub levels out; 1.2 s later the mission starts.

## Rating (like the catapult)

Graded by the depth at the net, as a share of the half-gap (6 m) from the middle (15 m):

| depth at the net | grade |
|---|---|
| within 15 % of the middle (14.1–15.9 m) | perfect |
| within 45 % (12.3–17.7 m) | good |
| shallower | early — blew ballast too soon; above 9 m the sail snags the net |
| deeper | late — flooded too long; below 21 m the keel scrapes the reef |

A snag or a scrape plays a clang and shakes the screen; the sub still gets through. The bonus is the catapult's:
perfect +15 %, good +5 % of the mission reward. **S / SKIP** skips the dive (`skipped`, no bonus); **ESC** goes back
to the map.

## Business Rules

- Pure state machine in `src/game/dive-launch.ts`: `createDive`, `stepDive(state, input, dt)`, `gradeDive(depth)`;
  constants `DIVE`. The rating is the existing `TakeoffRating`.
- `routes.ts`: campaign 5 → `DiveLaunchScene`, which goes to the mission with the rating when done.
- Drawing in code: the cut-away stern, the sea, the net, the reef and the sub (its side view, doc 67) in
  `src/render/dive.ts`; the depth gauge and the prompt in the scene.
- Strings `dive.*` in `ui-en-deep.ts` / `ui-de-deep.ts`.
