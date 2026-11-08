---
id: 89-station-docking
title: Station Docking - Fly a Shuttle Into a Space Station's Port With Thrusters and Inertia
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub]
relates: [88-sonar-hunt, 89-station-docking, 90-firing-range]
source_files:
  - src/game/minigames/docking.ts
  - src/scenes/minigames/docking.ts
  - src/render/minigames/docking.ts
  - src/i18n/minigames/docking.ts
  - src/data/minigames.ts
  - src/scenes/minigames/registry.ts
  - src/game/minigames/core.ts
  - src/scenes/base-hub-render.ts
routes: []
models: []
test_files:
  - tests/unit/minigames.test.ts
  - tests/unit/docking.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, space, rec-room]
path: Game/Minigames/Station Docking
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 89 — Station Docking

## Purpose

Owner, 2026-11-08: *"We also need new mini games. Actually for all new worlds. At least for the underwater, space and
now jungle world."* One game per late world, unlocked on its own map — mission numbers run through every map, so
`unlockAfter` reads all missions (m01–m180), not only map 1's.

## Rules

STATION DOCKING (in space, after m123): the shuttle drifts with nothing to slow it; the arrows fire thrusters (46 px/s², fuel for 9 s of burning). Touching the station's face inside the port (±22 px) slower than 44 px/s docks; anything else is a bump that ends the try; 50 s a try. Three dockings, the port drifting with the turning station from the second on. A docking scores 350 + up to 450 for slowness (+100 under 16 px/s) + 6 per px of centring + 5 per s under 30 + 2 per fuel unit. Medals (set by a careful bot, 2,380): bronze 1,000, silver 1,700, gold 2,300. On touch, holding beside the shuttle pushes it away from that side.

The rec room holds 23 cards now, six a row in four rows.
