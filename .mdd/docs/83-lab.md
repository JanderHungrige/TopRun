---
id: 83-lab
title: Lab - Dr. Moreau Invents the Mech Weapons and Their Marks, One Project at a Time, Research per Sortie
edition: TopRun
depends_on: [82-ground-base, 79-mech-kit]
relates: [82-ground-base, 79-mech-kit, 86-jungle-looks]
source_files:
  - src/data/research.ts
  - src/game/lab.ts
  - src/game/kit.ts
  - src/scenes/lab.ts
  - src/scenes/lab-view.ts
  - src/assets/outpost/lab.png
routes: []
models:
  - "Outpost.project / progress / research / done (doc 82)"
test_files:
  - tests/unit/lab.test.ts
data_flow: writes-existing
last_synced: 2026-11-08
status: in_progress
phase: all
mdd_version: 11
tags: [lab, research, invent, weapons, marks, seeker, mortar, plasma, rail, map-6]
path: Game/Jungle/Lab
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 83 — Lab

## Purpose

Owner, 2026-11-08: *"Also new weapons have to be invented not just bought."* The LAB is the other new area of the jungle
base's hut (the door with the green window, doc 86); Dr. Ada "Flask" Moreau runs it.

## How inventing works

- One project at a time. After every sortie on map 6 the lab's research points (doc 82: 25 / 50 / 80 by its level, at
  the grid's power share, half on a lost sortie) go into the running project; when it has its cost the weapon or mark
  is **invented** — Dr. Moreau announces it in the debrief — and what is left over is kept.
- Points made while nothing runs are kept and go into the next project the moment it starts; switching projects gives
  the old one's points back, so nothing is lost.
- A weapon is owned once invented (the MECH BAY lists it, doc 79); its marks are inventions too.

| project | cost | lab | needs |
|---|---|---|---|
| Seeker Missiles | 60 | 1 | — |
| Mortar | 90 | 1 | — |
| Plasma Lance | 160 | 2 | — |
| Rail Cannon | 260 | 3 | Plasma Lance |
| Rocket Pod Mk II / Mk III | 70 / 150 | 1 / 2 | the mark before |
| Seeker Missiles Mk II / Mk III | 90 / 180 | 1 / 2 | the weapon / the mark before |
| Mortar Mk II / Mk III | 100 / 200 | 1 / 2 | the weapon / the mark before |
| Plasma Lance Mk II / Mk III | 160 / 260 | 2 / 3 | the weapon / the mark before |
| Rail Cannon Mk II / Mk III | 220 / 320 | 3 | the weapon / the mark before |

## The screen

The generated lab (`src/assets/outpost/lab.png`: flasks, a microscope, a half-built energy gun on the bench, a frog in a
terrarium) behind a list of the projects — not invented first — with each one's cost and state (running with its
progress bar, ready, needing a better lab or an earlier invention, invented), and the picked project's panel with the
weapon's picture, what it does and START. Dr. Moreau talks at the top left. Without a lab building the list shows but
nothing can start ("ask the Major").
