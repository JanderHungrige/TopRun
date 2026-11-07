---
id: 67-sub-flight
title: Sub Flight - The Type 212 in the Mission; Water Drift, the Sonar Burst, Harpoon Bolts and the Brass Cockpit
edition: TopRun
depends_on: [66-sub-kit, 50-helicopter-flight, 61-cockpit-skins, 05-mission-combat]
relates: [50-helicopter-flight, 66-sub-kit, 68-underwater-world, 61-cockpit-skins, 74-world-order]
source_files:
  - src/game/heli-flight.ts
  - src/game/sub-flight.ts
  - src/game/jets.ts
  - src/game/cockpit.ts
  - src/data/types.ts
  - src/data/planes.ts
  - src/core/sfx-recipes.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/weapons-fire.ts
  - src/render/shots.ts
  - src/render/subs/u212.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/livery-art.ts
  - src/render/cockpit/skin.ts
  - src/render/cockpit/backplate.ts
routes: []
models: []
test_files:
  - tests/unit/sub-flight.test.ts
  - tests/unit/cockpit-skins.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [submarines, flight, drift, sonar, harpoon, torpedo, depth-mine, cockpit-skin, art]
path: Game/Mission/Sub Flight
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 67 — Sub Flight

> **World order (doc 74, 2026-11-07):** under the sea is now **map 4, m91–m120**; space is map 5, the last world. Mission numbers, map numbers and thresholds in this doc are from before the swap: take 30 off its mission numbers (m121 → m91), read map 5 as map 4. The world's own numbers (formulas from its first mission, pay ×10, prices) are unchanged.

## Purpose

Wave 1 of Deep Water: the Type 212 must feel like a sub in the top-down mission — heavy in the water, not a jet.

## Moving

- **Slower world:** on map 5 the seabed scrolls at 65 % of the jets' speed (`SUB_FLIGHT.scroll`).
- **Water drift:** the sub eases toward the stick more slowly than a helicopter (`SUB_FLIGHT.accel` 3.5 against the
  helicopter's 6) — it glides on after the stick lets go. `fleetVelocity(v, stick, speed, accel, dt)` (pure, `DRIFT`
  per fleet kit) serves both; `heliVelocity` stays as the helicopter's call.
- **Bubble wake:** bubbles stream back from the screw, thicker when the sub pushes forward.
- Same playfield, hit radius and hull rules as the other craft.

## Weapons

- **Harpoon gun:** bolts from the bow with the sub's gun table (doc 66), at full damage on the seabed; drawn as short
  steel darts with a barbed head and a thin line of bubbles behind (`harpoon` bullets, `src/render/shots.ts`).
- **MK48:** the shared homing behaviour (missile kind `mk48`), slow (300 px/s), drawn as a dark torpedo with a gold
  band and a ducted screw, a bubble trail behind; hits anything in the water. Under the sea the enemy's missiles are
  drawn as torpedoes too (red nose).
- **Depth mine:** the shared bomb behaviour — a round mine with spikes sinking and shrinking for a moment, then a
  burst on the seabed (ring of bubbles and sand).
- **E — Sonar Burst** (cooldown 12 s): a ring of sound runs out from the sub to 300 px in 0.6 s; every enemy shot it
  passes is wiped out, and every enemy (and boss part) it reaches takes 60 damage, once. A "ping" and a deep echo.
  Pure: `sonarRadius(t)` and `sonarHits(targets, from, r0, r1)` → the targets the ring crossed this frame
  (`src/game/sub-flight.ts`); the special id is `sonar` (`specialRules('sonar')`: neither invulnerable nor stealth).
  The boss takes the hit when the ring crosses its aim point.

## Look and sound

- Top-down art in code (`src/render/subs/u212.ts`), arcade proportions — about a helicopter's size, the beam drawn
  1.35 × wider than true so it reads at a glance: the Type 212's long rounded teardrop hull in dark grey-blue with a
  lighter deck line, the sail (fin) a little forward of the middle, the bow planes, the X-shaped rudders at
  the stern, and the screw as a small spinning blur; a wake of bubbles streams from the screw, more when it moves. A
  slight roll into turns (the hull narrows and a darker flank shows), as the helicopter banks.
- A side view for the debrief (doc 04 style), from the real shape: 56 m long, sail amidships, X-rudder.
- **Cockpit skin `sub` (doc 61):** **brass and teal** — dark teal enamel with soft bands of rippled light, as seen
  through water, brass bezels around the dials and screens, brass rivet rows, a brass name plate and teal sonar-green
  screens. Same elements at the same places; the lit colours keep their meaning.
- Underwater, the mission's smoke turns into bubbles (doc 68).

## Business Rules

- `SUB_FLIGHT = { scroll: 0.65, accel: 3.5 }`, `SONAR = { reach: 300, time: 0.6, damage: 60 }`
  (`src/game/sub-flight.ts`).
- The world's scroll factor by map: `flightScroll(campaign)` (1 on maps 1, 2 and 4; `HELI_FLIGHT.scroll` on map 3;
  `SUB_FLIGHT.scroll` on map 5).
- `cockpitSkin(kind)` maps `'sub'` → `'sub'`.
