---
id: 94-space-lounge-picture
title: Space Lounge Picture - Map 5's Home Base as a Roomier Cozy Hull Lounge, the Big Square Window with Planet and Starfighter, the Holo Map Table, the Flat-Screen TV, Depth
edition: TopRun
depends_on: [93-sea-lounge-picture, 92-heli-base-picture, 73-home-docks, 76-world-looks]
relates: [93-sea-lounge-picture, 92-heli-base-picture, 76-world-looks]
source_files:
  - src/data/base-docks.ts
  - src/render/base/dock-ambient.ts
  - src/assets/docks/space.png
  - src/assets/docks/space-front.png
  - dev/dock-plates.py
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, space, depth, walk-behind, backdrops, ambient, comfyui, inpainting, map-5]
path: Game/Base/Space Lounge Picture
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 94 — Space Lounge Picture

## Purpose

Owner, 2026-11-08, after the sea lounge (doc 93): *"Then let's tackle space again too. Cozy, modern (70s astronaut style
maybe?), with a holo map and a more modern TV. Give me a few options. Important: the chalkboard must always fit in size."*
The 1970s space-age round (E, F, G) was turned down — *"Take the old style, use a larger square window. Give everything a
bit more room. This all looks too toy and plastic. The old one was cozy in a night-feeling way. But make it not too much
night."* Of the second round (H: the window on the right, I: in the middle) the owner took **H81**, *"but can you just
change the window? A large planet with just a partially visible spacecraft"* — and of three new views **W1**.

## The picture

- **H81** ("Top Gun pixel scene 16:9" on the PC, seed 81): the cozy crew lounge inside the hull of doc 76's picture G, with
  more room and in soft evening light — riveted ribs and cables, fairy lights, hanging lamps; the pink rec room with the
  arcade through a doorway on the left, the lockers, the scoreboard over a big chalkboard, the cork board, the couch on its
  rug with the floor lamp, a flat-screen TV with a media player on a battered metal cabinet, the big square window on the
  right and the glowing holographic map table in the right foreground.
- **W1**: the window's view repainted with the Couch inpaint workflow (v3, the raw loaded straight from the PC's output
  folder, only the window's glass masked): a huge Earth-like planet filling the window, the docked starfighter in front of
  it. Everything outside the glass stayed as it was.
- `dev/dock-plates.py src/assets/docks space=<raw>` — 320 × 180, 48 colours; `space-front.png` the map table's walk-behind
  mask (its top, its column and its foot).

## In the game

- **Areas:** FUN MISSIONS the rec room's doorway, TV the flat screen, LOCKER the lockers, PICTURE WALL the cork board,
  LOADOUT the window with the starfighter, LADDER the scoreboard, CHALKBOARD the chalkboard, **EXIT · MAP the holo map
  table**.
- World 1's flip board (three rows) over the scoreboard, world 1's chalkboard over the big chalkboard, the joystick neon
  inside the rec room's doorway; the TV is the picture's own (`picturedTv`, doc 93: the game's picture on its screen, the
  media player's clock blinking).
- **Depth:** horizon 190, the pilot 1.05 on the front line (about 0.8 by the lockers, as tall as they are). The rec room's
  doorway and the lockers on one row a step back (y 548); the window behind the map table (x 1000, y 495, the table hiding
  the pilot's legs); the map on the front line behind the table, as if studying it; the TV, the cork board, the scoreboard
  and the chalkboard on the front line.
- **Walk-behind** (doc 92): the map table stands in front of the front line; its pixels are drawn over the pilot.
- **Ambient:** stars twinkling where the window's sky is dark, the fairy lights and the lamps glowing, light running over
  the map table's top and specks rising from it, the arcade flickering pink in the rec room, dust motes.
