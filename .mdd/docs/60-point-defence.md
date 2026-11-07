---
id: 60-point-defence
title: Point Defence - A Ship Module That Shoots Down Incoming Missiles
edition: TopRun
depends_on: [54-spacecraft, 55-shipyard, 57-space-arsenal]
relates: [57-space-arsenal, 58-map-four-campaign]
source_files:
  - src/data/ship-modules.ts
  - src/game/ship.ts
  - src/game/point-defence.ts
  - src/scenes/mission/point-defence.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/player.ts
  - src/scenes/shipyard-view.ts
  - src/render/ship.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
  - dev/playtest.ts
routes: []
models: []
test_files:
  - tests/unit/space-arsenal.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [spacecraft, point-defence, missiles, countermeasures, modules, map-4]
path: Game/Hangar/PointDefence
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 60 — Point Defence

## Purpose

Wave 7 of New Frontiers. The jets and helicopters carry flares; the spacecraft had nothing against missiles, so every
missile in map 4 landed (doc 58's known issue). Point defence is the ship's answer, in the spirit of the modules: a
part you place that does its job by itself.

## The module

| module | mass | power | hull | placement | price |
|---|---|---|---|---|---|
| Point Defence | 2 | −1 | +6 | anywhere | $50,000 |

- A small twin-barrel turret. Whenever an **enemy missile** comes within **150 px** of the ship and a turret is ready,
  it shoots the missile down: a short tracer, a flash, the missile gone.
- Each turret is ready again **2.5 s** after it fires; with n turrets the ship can stop one missile every 2.5 ÷ n s.
- It does not touch bullets, flak or rockets of the player's own.

## Business Rules

- `pointdef` in `MODULES` (`src/data/ship-modules.ts`), `POINT_DEFENCE = { range: 150, cooldown: 2.5 }`.
- `shipStats().pointDefence` = the number of turrets; the player keeps one shared timer: after a shot it waits
  `cooldown ÷ turrets`.
- Pure: `pointDefenceTarget(missiles, x, y)` — the nearest live enemy missile within range, or none — and
  `pointDefenceInterval(turrets)` in `src/game/point-defence.ts` (tested); the mission's `updatePointDefence`
  (`src/scenes/mission/point-defence.ts`, run with the other projectiles) keeps `Player.pdTimer`, kills the missile and
  draws a line of sparks to it.
- The shipyard's list rows are 54 px high so ten rows fit (doc 55).
- The shipyard lists it after the Shield Generator; its stats show POINT DEFENCE.
