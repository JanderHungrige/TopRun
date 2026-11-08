---
id: 81-jungle-world
title: Jungle World - The Jungle Floor, the Canopy, Ten Jungle Enemies and Five Bosses
edition: TopRun
depends_on: [78-sixth-map, 68-underwater-world]
relates: [80-mech-walk, 70-map-five-campaign]
source_files:
  - src/data/theaters.ts
  - src/data/theaters-6.ts
  - src/data/enemies.ts
  - src/data/bosses-6.ts
  - src/render/jungle-floor.ts
  - src/render/draw-terrain.ts
  - src/render/terrain-art.ts
  - src/render/enemies/jungle.ts
  - src/render/enemies/jungle-creatures.ts
  - src/render/bosses-6.ts
  - src/render/draw-enemies.ts
  - src/render/draw-bosses.ts
routes: []
models: []
test_files:
  - tests/unit/missions-6.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [jungle, terrain, canopy, enemies, creatures, walkers, bosses, art, map-6]
path: Game/Mission/Jungle World
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 81 — Jungle World

## The floor

Five terrains (`TerrainStyle`): `clearing` (Landing Zone: red earth, grass, mud, tyre tracks, crates), `rainforest`
(Canopy: dark moss, tree trunks seen from above, ferns, roots, a creek), `swamp` (Mangrove Swamp: black water with
lily pads and mangrove roots, mud banks), `ruins` (Temple Ruins: grass over flagstones, broken pillars, a stone road,
idol heads), `hive` (the Hive: purple-brown chitin floor, egg pods, glowing pools). A base tile per terrain and features
per row like the other worlds (`src/render/jungle-floor.ts`).

Overhead, the **canopy**: big leaf crowns drift past faster than the floor (parallax), half-transparent so the fight
stays readable, with mist and fireflies; rain on the swamp.

## Enemies

'air' is anything that runs or flies freely (the AIR key's seekers find it), 'ground' the heavy and the rooted (the
GROUND key's mortar):

| kind | name | layer | hp | notes |
|---|---|---|---|---|
| walker | Enemy Walker | ground | 90 | two-legged, aimed shots |
| hovertank | Hover Tank | ground | 110 | fast, three-shot spread |
| artillery | Artillery Gun | ground | 120 | flak and the odd missile |
| gundrone | Gun Drone | air | 28 | weaves and swoops, fires aimed shots |
| dropship | Dropship | air | 260 | slow, aimed fire and missiles |
| raptor | Raptor | air | 40 | runs at you |
| beetle | Armoured Beetle | ground | 170 | the gun does 60 % |
| spitter | Spitter Plant | ground | 70 | rooted, spits a spread |
| wasp | Giant Wasp | air | 22 | swarms at you |
| brute | Brute Walker | ground | 2,300 | map 6's mini-boss |

## Bosses

RAVAGER (an assault walker with two arm cannons and a missile rack), MANTIS (a tree-tall bio-machine with scythe arms),
BASILISK (an armoured swamp beast with spines and a tail), SENTINEL (a stone temple guardian with a glowing eye) and the
HIVE QUEEN (wings, egg sacs and a crowned head). Art in code (`src/render/bosses-6.ts`).
