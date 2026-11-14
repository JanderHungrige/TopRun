---
id: 107-steppe-lab
title: Steppe Lab - Dr. Novak Invents the Tank Weapons, the Towers and Their Marks, One Project at a Time
edition: TopRun
depends_on: [83-lab, 103-tank-kit, 106-tower-defence]
relates: [103-tank-kit, 106-tower-defence, 108-tank-arsenal]
source_files:
  - src/data/steppe-research.ts
  - src/game/steppe-lab.ts
  - src/game/save.ts
  - src/game/kit.ts
  - src/game/firepower.ts
  - src/game/economy.ts
  - src/game/admin.ts
  - src/main.ts
  - src/scenes/steppe-lab.ts
  - src/scenes/steppe-lab-view.ts
  - src/scenes/routes.ts
  - src/scenes/debrief.ts
  - src/scenes/debrief-base.ts
  - src/game/dialogue-scripts.ts
  - src/render/items.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
  - src/i18n/lines-steppe-en.ts
  - src/i18n/lines-steppe-de.ts
routes: []
models:
  - "SaveData.steppeLab: { level, project, progress, research, done } — the steppe lab (new, missing = fresh)"
test_files:
  - tests/unit/steppe-lab.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [lab, research, steppe, novak, inventions, towers, marks, tank-weapons, map-7]
path: Game/Base/Steppe Lab
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (the steppe lab parsed from the untrusted profile store / cloud save)
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-3
wave_status: complete
---

# 107 — Steppe Lab

## Purpose

Question round, 2026-11-14: research **like the jungle lab** (doc 83) — research points per sortie, one project at a
time; everything else costs money. Dr. Ilya "Sparks" Novak runs a lab in a converted container at the steppe base. It
invents the tank weapons, the towers the defences don't know from the start, and every mark.

## The lab

- **Its level** is bought with money in the lab: level 1 $150,000, level 2 $500,000, level 3 $1,200,000 (the steppe has
  no ground base; the lab is the only building). Without one nothing is researched.
- **Research per sortie** (map 7, not aborted): 40 / 80 / 130 by level on a won sortie, half on a lost one (set by the
  playtest, wave 4: at 30 / 60 / 100 the buying pilot had invented 10 of the 23 projects by m210).
- One project at a time; points go into the running one after every sortie; when it has its cost it is **invented**
  (Dr. Novak says so in the debrief) and what is left over is kept; points made while nothing runs are kept for the next;
  switching gives the old one's points back — the jungle lab's rules (doc 83).

## Projects

| project | id | cost | lab | needs |
|---|---|---|---|---|
| AA Rockets | `aarocket` | 50 | 1 | — |
| ATGM | `atgm` | 80 | 1 | — |
| Mine Layer | `mines` | 110 | 1 | — |
| Flamethrower | `flamer` | 140 | 2 | — |
| Tesla Coil | `tesla` | 180 | 2 | — |
| Mortar Pit (tower) | `t-mortarpit` | 70 | 1 | — |
| Jammer (tower) | `t-jammer` | 90 | 1 | — |
| Tesla Tower (tower) | `t-tesla` | 150 | 2 | — |
| Rocket Battery (tower) | `t-rockets` | 220 | 3 | Mortar Pit |
| Grenade Launcher Mk II / III | `grenade2`, `grenade3` | 60 / 140 | 1 / 2 | the mark before |
| AA Rockets Mk II / III | `aarocket2`, `aarocket3` | 70 / 150 | 1 / 2 | the weapon / the mark before |
| ATGM Mk II / III | `atgm2`, `atgm3` | 90 / 180 | 1 / 2 | the weapon / the mark before |
| Mine Layer Mk II / III | `mines2`, `mines3` | 90 / 170 | 1 / 2 | the weapon / the mark before |
| Flamethrower Mk II / III | `flamer2`, `flamer3` | 140 / 240 | 2 / 3 | the weapon / the mark before |
| Tesla Coil Mk II / III | `tesla2`, `tesla3` | 160 / 260 | 2 / 3 | the weapon / the mark before |
| Towers Mk II / III (every tower) | `towers2`, `towers3` | 160 / 260 | 2 / 3 | — / Towers Mk II |

- 3,260 points in all: more than a pilot makes on the map (about 2,400 with the lab built early) — a choice, like the
  shops.
- A weapon is owned once invented (the MOTOR POOL lists it, doc 103); its mark is the highest invented. A tower is known
  in the defences once invented (doc 106); the towers' mark is `towers2` / `towers3`.

## The screen (`steppeLab` route)

The lab picture (`src/assets/outpost/lab-steppe.png`, doc 111; a dark panel until it exists) behind: the lab's level
with BUY / UPGRADE and its price, research per sortie and the points kept; the list of projects (not invented first,
scrolling with the pick, 12 rows at a time) with each one's cost and state; the picked project's panel with its picture,
what it does and START. Dr. Novak talks at the top left. ↑/↓ or a click picks, ENTER starts, U buys the next lab level,
ESC or BACK returns to the base. Until the steppe base exists (doc 111) map 7's base reaches it through the jungle camp's
lab door.

## The debrief

On map 7 the debrief shows the lab's line — `+60 research` — and in gold anything invented, like the jungle's base line.

## Business Rules

- Pure (`src/game/steppe-lab.ts`): `freshSteppeLab`, `parseSteppeLab`, `tankKnownWeapons`, `tankMark`, `knownTowers`,
  `towerMark`, `steppeProjectState`, `steppeLabList`, `addSteppeResearch`, `startSteppeProject`, `labLevelPrice`,
  `buySteppeLab`, `steppeDay`; projects in `src/data/steppe-research.ts`.
- The admin pilot (doc 47) sees the lab at level 3 with everything invented. The admin's view is now applied before the
  kit view (`main.ts`), so the kits see the labs' inventions — the mech bay's admin view had the same gap.
- The lab's tower pictures are item pictures of their own (`TowerPicture`: mgnest, flaktower, mortarpit, teslatower,
  jammer, rocketbattery — the ids differ where a weapon has the same name); without one the tower is drawn in code.
