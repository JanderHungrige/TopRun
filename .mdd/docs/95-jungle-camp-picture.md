---
id: 95-jungle-camp-picture
title: Jungle Camp Picture - Map 6's Home Base as a Run-Down Field Camp in the Rainforest, the Mech's Leg, the Track to the Build Layer, the Boards on a Slanted Wall
edition: TopRun
depends_on: [94-space-lounge-picture, 93-sea-lounge-picture, 92-heli-base-picture, 86-jungle-looks]
relates: [86-jungle-looks, 92-heli-base-picture, 93-sea-lounge-picture, 94-space-lounge-picture]
source_files:
  - src/data/base-docks.ts
  - src/render/base/dock.ts
  - src/render/base/dock-wall.ts
  - src/render/base/dock-jungle.ts
  - dev/jungle-plates.py
  - src/assets/docks/jungle.png
  - src/assets/docks/jungle-front.png
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, jungle, depth, walk-behind, backdrops, ambient, comfyui, map-6]
path: Game/Base/Jungle Camp Picture
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 95 — Jungle Camp Picture

## Purpose

Owner, 2026-11-08, after the sea and space lounges (docs 93, 94), on the jungle base (doc 86's crew hut): *"Now the jungle
planet base. Rather a cozy open camp, but more military. Camouflage nets. But again our elements that we need: map table,
… game corner (rather board games), TV, way into the jungle (map) and a mech warrior thing in the distance."* On the first
round (J, K): *"Stop, we also need something for building… And I'd like more jungle, that's rather a mixed forest. Put the
mech on the right of the picture, so huge that you only see one leg. The path leads to further buildings, that is the
build layer. And a bit more run-down. The others are in a different style; this is all getting a bit too cute."* Of the
second round (L, M) the owner took **L121** — *"can you use the chalkboard at an angle? Does that work?"*

## The picture

- **L121** ("Top Gun pixel scene 16:9" on the PC, seed 121): a run-down field camp deep in the rainforest under torn
  camouflage nets — buttress roots, lianas, palms and ferns, mud and puddles. On the left a weathered wooden hut with the
  scoreboard over the chalkboard and photos on its wall, the lockers and a cabinet with a glowing green round window, the
  board-game table with the chess board in front; in the middle a muddy track leading to the ground base's buildings and
  radio mast; on the right the giant mech's leg rising out of the picture, the map table under a lamp and an old TV with a
  radio on ammo crates.
- `dev/jungle-plates.py <raw> src/assets/docks` writes the 320 × 180 plate (48 colours) and `jungle-front.png`, the
  walk-behind mask: the board-game table's top and the stool, the sandbags, the map table and the TV stack.

## In the game

- **Areas:** FUN MISSIONS the board-game table, TV the TV on the crates, LOCKER the lockers, PICTURE WALL the photos on the
  hut, LOADOUT the mech's leg, **GROUND BASE the track to the buildings (the build layer)**, LAB the cabinet with the green
  window, LADDER the scoreboard, CHALKBOARD the chalkboard, **EXIT · MAP the map table**. The code-drawn globe is gone.
- **Boards on a slanted wall:** the hut's wall is seen at an angle, so the far edges of its boards are shorter. World 1's
  flip board and chalkboard are drawn flat into a scratch canvas and laid onto the wall column by column, each column a
  little shorter towards the right (`DockLayout.slant`, the fraction of the height at the far edge; `onWall`,
  `dock-wall.ts`). A wall at eye level keeps its vertical edges, so no 3-D is needed. The other looks have no slant.
- **The TV** is the picture's own (`picturedTv`, doc 93).
- **Depth** (doc 92): horizon 370, the pilot 0.95 on the front line, which runs behind the board-game table's corner, the
  map table and the TV (all walk-behind). The hut's spots — the scoreboard, the chalkboard, the photos, the lockers, the
  lab — share one row a step back (y 520), reached up the track's edge (x 520) and walked along; the mech's foot (y 505);
  the track to the ground base far back (y 465, the pilot small on the way to the buildings).
- **Ambient:** the lanterns and string lights twinkling, the lab window's green glow and the map lamp breathing, fireflies
  over the track and the ferns, dust motes.
