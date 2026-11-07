---
id: 52-canyon-runs
title: Canyon Runs - A Winding Gorge in a Third of the Map-3 Missions; Touching a Wall Crashes the Helicopter
edition: TopRun
depends_on: [48-third-map, 50-helicopter-flight, 05-mission-combat]
relates: [48-third-map, 50-helicopter-flight]
source_files:
  - src/game/canyon.ts
  - src/scenes/mission/canyon-run.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-overlay.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/enemy-ai.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
test_files:
  - tests/unit/canyon.test.ts
routes: []
models: []
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [canyon, obstacle-course, hindernisparcours, walls, crash, helicopters, map-3, mission]
path: Game/Mission/Canyon Runs
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 52 — Canyon Runs

## Purpose

Wave 4 of New Frontiers. Owner, 2026-11-06: *"create also 'hindernissparcour' where we have gebirgeschluchten durch
die man fahren muss (once in a while, not always), while fightig enemies. If you hit the wall you crash."* Some map-3
missions lead through a mountain gorge: the rock walls close in and wind left and right, the enemies keep coming,
and a helicopter that touches a wall is lost.

## Which missions

Ten of the thirty map-3 missions — about one in three, never the first two and never a boss mission:
**m63, m65, m68, m70, m74, m76, m80, m82, m86, m88** (`CANYON_MISSIONS`, `src/game/canyon.ts`). The run starts at
35 % of the mission and lasts `24 + (n − 61) × 0.4` seconds (m63 ≈ 25 s … m88 ≈ 35 s).

## The run

- **Warning:** four seconds before the gorge, a banner — "CANYON AHEAD · DON'T TOUCH THE WALLS" — and the siren.
- **The gorge:** two rock walls (the theater's dark rock, a light edge) come down the screen. Over the first
  300 px they close from the playfield's edges to the channel; the channel's half-width then breathes between
  about 105 and 150 px, and its centre winds left and right (two sines, more swing later in the run), never closer
  than 30 px to the playfield's edge. Over the last 300 px it opens again.
- **Walls crash:** if the helicopter's body (`PLAYER_RADIUS + 4` from its centre) touches either wall inside the run,
  it explodes: the sortie is lost like being shot down; the debrief says "Crashed into the canyon wall". Rolls,
  dashes and invulnerability do not save it — rock is rock (Flying Tank included).
- **Enemies keep coming:** whatever spawns while the gorge is on screen spawns inside the channel (its x clamped to
  the channel at the top of the screen, 20 px inside the walls); shots and missiles fly over the walls as before.
- The gorge is measured in scrolled distance, so a mini-boss holding the scroll holds the gorge too.

## Business Rules

- Pure: `canyonPlan(mission)` (when and how long, or null), `channel(d, total)` (centre and half-width `d` px into a
  run of `total` px), `hitsWall(x, r, channel)`, `clampToChannel(x, channel)` in `src/game/canyon.ts`.
- `World` keeps the plan, the scrolled distance where the run began and whether the player crashed;
  `src/scenes/mission/canyon-run.ts` ticks it (warning, start, crash) and draws the walls.

## Balance

Bot playtest (2026-11-07, `dev/playtest.ts`, doc 48 method; the bot now also keeps 55 px inside the walls of its row
and the row 60 px ahead):

| mission | the Apache's kit | hulls / min, kill share | crashes |
|---|---|---|---|
| m63 | gun 2, Hydra | 0.58 / 0.94 | 0 of 3 |
| m70 | gun 4, Hydra, Hellfire, armour 2 | 1.87 / 0.93 | 0 of 3 |
| m80 | gun 7, + Stinger, armour 4 | 2.90 / 0.62 | 0 of 3 |
| m88 | gun 9 | 5.44 / 0.62 | 0 of 3 |

- A pilot who keeps about a helicopter's width clear of the walls gets through; the helicopter's drift is what makes
  it tense. With only 30 px of margin the bot crashed every run (it hugged the wall the channel was drifting
  toward) — the walls punish carelessness, not bad luck.
- The gorge barely changes the damage taken (m70 1.9 with or without, m88 5.4 against 4.8–5.1): enemies come
  down the same channel, so there is less room to dodge but more to hit.
