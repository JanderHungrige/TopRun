---
id: 90-firing-range
title: Firing Range - Shoot the Walker Boards, Spare the Monkeys, One Minute at the Mech Gunnery Range
edition: TopRun
depends_on: [10-minigames-core, 11-base-hub]
relates: [88-sonar-hunt, 89-station-docking, 90-firing-range]
source_files:
  - src/game/minigames/range.ts
  - src/scenes/minigames/range.ts
  - src/render/minigames/range.ts
  - src/i18n/minigames/range.ts
  - src/data/minigames.ts
  - src/scenes/minigames/registry.ts
  - src/game/minigames/core.ts
  - src/scenes/base-hub-render.ts
routes: []
models: []
test_files:
  - tests/unit/minigames.test.ts
  - tests/unit/firing-range.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, jungle, rec-room]
path: Game/Minigames/Firing Range
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 90 — Firing Range

## Purpose

Owner, 2026-11-08: *"We also need new mini games. Actually for all new worlds. At least for the underwater, space and
now jungle world."* One game per late world, unlocked on its own map — mission numbers run through every map, so
`unlockAfter` reads all missions (m01–m180), not only map 1's.

## Rules

FIRING RANGE (on the jungle planet, after m153): wooden boards pop up behind two berms of sandbags — four far, three near — red ones with an enemy walker, now and then (one in five) a green one with a monkey. A board stays up 1.9 s, down to 1.0 s at the end of the minute; a new one every 0.95 s, down to 0.5 s. A walker scores 100 + up to 60 for a quick hit + 10 per board of the streak (up to 10); a monkey costs 150 and the streak; a miss breaks it. Arrows (or the mouse) aim, SPACE fires; a tap aims and fires. Medals bronze 5,000, silver 8,500, gold 12,000 (a sharp bot scores 15,100, a slow one hitting six in ten 5,400).

The rec room holds 23 cards now, six a row in four rows.
