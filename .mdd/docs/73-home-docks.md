---
id: 73-home-docks
title: Home Docks - The Base Becomes a Space-Station Dock on Map 4 and an Underwater Dock on Map 5
edition: TopRun
depends_on: [30-hangar-base, 63-hangar-tv, 40-chalkboard, 65-fifth-map, 56-fourth-map]
relates: [30-hangar-base, 63-hangar-tv, 64-world-celebrations, 74-world-order]
source_files:
  - src/data/base-areas.ts
  - src/data/base-docks.ts
  - src/game/base-hangar.ts
  - src/game/state.ts
  - src/main.ts
  - src/scenes/map.ts
  - src/scenes/hangar-base.ts
  - src/render/base/dock.ts
  - src/render/base/dock-ambient.ts
  - src/render/base/dock-boards.ts
  - src/render/base/board.ts
  - src/render/base/props.ts
  - src/render/base/ambient.ts
  - src/render/base/cast.ts
  - src/render/base/labels.ts
  - src/render/base/chalk.ts
  - src/assets/docks/
  - dev/dock-plates.py
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, space, underwater, backdrops, ambient, comfyui, map-4, map-5]
path: Game/Honours/Base
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 73 — Home Docks

> **Depth (doc 92, 2026-11-08):** the carrier, helicopter, sea and space docks have depth — some areas stand a step back
> or deeper in the room, reached up free lanes, the pilot smaller there; the jungle base keeps the front line.

> **Carrier picture (doc 91, 2026-11-08):** maps 1–3 now show a generated carrier lounge too — the same dock machinery, in day, evening or night light drawn at random after each mission of maps 1–2; the code-drawn hangar (doc 30) only stands in while a picture loads.

> **World looks (doc 76, 2026-11-07):** the space dock is now picture G (cozy crew quarters; a porthole leads to the map), the sea dock has a globe as its way to the map, and each dock scales the pilot and the TV to its picture.

> **World order (doc 74, 2026-11-07):** under the sea is now map 4 (m91–m120) and space map 5 (m121–m150); what this doc says of map 4 / world 4 applies to space, now map 5, and of map 5 / world 5 to the sea, now map 4 (plates renamed: `w4*` the sea's, `w5*` space's; the sea dock on map 4, the space dock on map 5).

## Purpose

Wave 4 of Deep Water. Owner, 2026-11-07: *"For this world and the space world we also need a new hangar look. Space and
underwater dock."* On four generated examples the owner chose **space dock A**; for the sea, the first examples' sub
was *"so out of proportion"* — it now lies docked outside, seen through the big round window (**underwater dock C**).
And: *"Will it be animated? Like flickering light, dust particles, air bubbles moving outside? Slow and calm
atmosphere."* — yes.

## Which look

The base wears the look of the map the pilot last looked at (`GameContext.home`, set by the campaign map, runtime
only): maps 1–3 the carrier hangar (doc 30), map 4 the space dock, map 5 the sea dock (`baseLookOf`).

## The pictures

Rendered on the M1 with the "Top Gun pixel scene 16:9" workflow (seed 7), box-downscaled to the 320 × 180 art grid and
quantized to 48 colours each (`dev/dock-plates.py` → `src/assets/docks/space.png`, `sea.png`, ~21 KB each).

| | space dock A | sea dock C |
|---|---|---|
| FUN MISSIONS | the rec-room doorway with the arcade, left | the rec-room doorway, left |
| TV | the TV cart, moved in front of the rec room | the same |
| LOCKER | the steel lockers | the lockers by the door |
| PICTURE WALL | the photos pinned beside the chalkboard | the row of photos over the chalkboard |
| LADDER | the scoreboard on the catwalk | the scoreboard high on the wall |
| CHALKBOARD | the big chalkboard | the chalkboard |
| LOADOUT | the starfighter | the sub docked outside the window |
| EXIT · MAP | a steel floor hatch drawn in code by the consoles | a floor hatch drawn in code, right |

- Every area has its own hotspot, name plate and stand point per look (`SPACE_AREAS`, `SEA_AREAS`); ←/→/↑/↓, hover
  and taps work as in the carrier hangar (`neighbour`, `areaAt`, `arrivedAt` take the look's table).
- Drawn over the picture: the TV cart and its screen (doc 63, the carrier's own art moved there), the joystick neon over
  the picture's sign (its letters are made up), the exit hatch, the pilot (no plane captain — there is no jet to
  polish), the strip and the gold brackets.
- **World 1's boards over the picture's** (owner, after the first version with amber LED text and a bare slate: *"I
  liked the coded one from world 1. Can you overlay both on the image … try to fit those elements perfectly over the
  parts in the image"*): the split-flap board covers the picture's scoreboard exactly — its tiles stay square, their
  size follows the board's height and the column count fills its width (space: 3 rows × 23 tiles; sea: 4 rows × 10,
  the fourth blank), flipping as in the hangar; the chalkboard covers the picture's chalkboard with the hangar's wooden
  frame and ledge, the live slate (doc 40) centred inside at its 3 : 1 (`src/render/base/dock-boards.ts`).
- **No name plates in the docks** (owner: *"loose the descriptions in the images as they do not fit. The user will find
  out by himself."*); the strip at the bottom still names the highlighted area.

## Ambient — slow and calm

- **Space dock:** stars drifting slowly past the window (only where the picture is dark — not over the planet), the
  console lights blinking at their own rates, the two ceiling lights breathing, dust motes.
- **Sea dock:** the view through the round window bobbing a pixel up and down in the swell (the docked sub and the
  seabed together), bubbles rising and a few fish passing outside, light rippling under the surface, the ceiling lamp
  glowing and now and then flickering, drips falling from the pipes, dust motes.

## Business Rules

- `BaseLook` = `'carrier' | 'space' | 'sea'`; `baseLookOf(campaign)`, `baseAreas(look)` in `src/data/base-areas.ts`;
  the docks' areas and the places drawn over the pictures (`DockLayout`) in `src/data/base-docks.ts`.
- While a dock's picture loads, the carrier hangar stands in for a frame.
