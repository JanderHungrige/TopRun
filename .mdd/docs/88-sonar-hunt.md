---
id: 88-sonar-hunt
title: Sonar Hunt - Find a Hidden Sub With Sonar Echo Rings and Sink It With a Torpedo
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub]
relates: [88-sonar-hunt, 89-station-docking, 90-firing-range]
source_files:
  - src/game/minigames/sonar.ts
  - src/scenes/minigames/sonar.ts
  - src/render/minigames/sonar.ts
  - src/i18n/minigames/sonar.ts
  - src/data/minigames.ts
  - src/scenes/minigames/registry.ts
  - src/game/minigames/core.ts
  - src/scenes/base-hub-render.ts
routes: []
models: []
test_files:
  - tests/unit/minigames.test.ts
  - tests/unit/sonar-hunt.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, sea, rec-room]
path: Game/Minigames/Sonar Hunt
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 88 — Sonar Hunt

## Purpose

Owner, 2026-11-08: *"We also need new mini games. Actually for all new worlds. At least for the underwater, space and
now jungle world."* One game per late world, unlocked on its own map — mission numbers run through every map, so
`unlockAfter` reads all missions (m01–m180), not only map 1's.

## Rules

SONAR HUNT (under the sea, after m93): an enemy sub hides on a 10 × 7 grid of dark sea. A ping from a cell sends out an echo ring exactly as far as the sub is; where the rings cross, it hides. A torpedo on its cell sinks it (and costs no torpedo); a miss costs one. Five subs, eight torpedoes; from the third sub on the sub slips one cell away after every third ping ("IT SLIPPED AWAY!", the rings clear). Each sub scores 120, less 10 per extra ping and 25 per miss, at least 20. Medals bronze 260, silver 400, gold 500. Arrows move the cursor, SPACE pings, F (or X) fires; a tap picks a cell, the PING and TORPEDO buttons act.

The rec room holds 23 cards now, six a row in four rows.
