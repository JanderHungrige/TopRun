---
id: 82-ground-base
title: Ground Base - Buildings Bought With Money, a Power Grid, Alloy and Research per Sortie, the Munitions Factory and the Magazine
edition: TopRun
depends_on: [79-mech-kit, 78-sixth-map, 30-hangar-base]
relates: [83-lab, 79-mech-kit, 86-jungle-looks, 47-admin-pilot]
source_files:
  - src/data/outpost.ts
  - src/game/outpost.ts
  - src/game/outpost-day.ts
  - src/game/economy.ts
  - src/game/admin.ts
  - src/scenes/outpost.ts
  - src/scenes/outpost-view.ts
  - src/render/outpost-buildings.ts
  - src/scenes/debrief.ts
  - src/i18n/ui-en-outpost.ts
  - src/i18n/ui-de-outpost.ts
  - src/assets/outpost/base.png
routes: []
models:
  - "SaveData.outpost: { buildings, alloy, research, project, progress, done, magazine, days }"
test_files:
  - tests/unit/outpost.test.ts
data_flow: writes-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [ground-base, base-building, generator, power, refinery, alloy, factory, magazine, rounds, mech-bay, map-6, economy]
path: Game/Jungle/Ground Base
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (the outpost parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 82 — Ground Base

## Purpose

Owner, 2026-11-08: *"But now we have to build up energy generator, weapon production, … This earns us resources to build
mechs. To build extensions and upgrades. For some weapons like rockets, we have to build them to have x ammo."* The
GROUND BASE is a new area of the jungle base's crew hut (the window onto the compound, doc 86).

## The screen

The generated clearing (`src/assets/outpost/base.png`, a jungle clearing with a waterfall and two moons) with five plots
on its red earth; each building is drawn in code at its level and comes alive (the generator's core glowing, the
refinery's drill pumping, the factory smoking, the lab's dish turning, the mech bay's crane). Top bar: money, alloy (◆),
power (⚡ supply / demand), research; Major "Dozer" Brennan talks at the top left; the picked building's panel at the
right with BUILD / UPGRADE and, for the factory, an order button per kind of round. ←/→ (or a click) picks a building,
ENTER builds, 1 / 2 / 3 order rockets, missiles, shells; ESC or BACK returns to the hut.

## Buildings (money)

| building | level 1 | level 2 | level 3 | draws (power) | gives |
|---|---|---|---|---|---|
| Generator | $30,000 | $120,000 | $350,000 | — | power 8 / 16 / 26 |
| Refinery | $40,000 | $150,000 | $400,000 | 3 / 5 / 7 | alloy 60 / 120 / 200 per sortie |
| Munitions Factory | $30,000 | $120,000 | $350,000 | 2 / 3 / 5 | magazine 48 / 96 / 160 rounds of each kind (24 before it exists) |
| Lab | $50,000 | $180,000 | $450,000 | 3 / 5 / 7 | research 25 / 50 / 80 per sortie (doc 83) |
| Mech Bay | standing (level 1) | $150,000 | $400,000 | 2 / 3 / 4 | builds mechs, gun to level 4 / 7 / 10, equipment to level 2 / 3 / 4 |

- **Power** is a grid: the generator's output against what the built buildings draw. Short of power, the refinery and
  the lab run at `supply / demand` (Major Brennan says so).
- **A day at the base** (`runDay`): every map-6 sortie that is not aborted runs the refinery and the lab — fully on a
  won sortie, half on a lost one — and brings **salvage**: 3 alloy per kill (half on a lost sortie) and 80 for a boss.
  The rounds fired come out of the magazine. The debrief shows what the base made.
- **Rounds (alloy):** the factory builds 10 rounds an order (rockets ◆2, missiles ◆6, shells ◆4 each), no more than
  the magazine holds or the alloy pays for. The mechs landed with ◆150 and 24 rockets.
- The admin pilot (doc 47) sees a finished base: everything at level 3, everything invented, alloy without end.
