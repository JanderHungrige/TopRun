---
id: 64-world-celebrations
title: World Celebrations - A Pixel-Art Sequence From Generated Key Frames After Each World's Finale
edition: TopRun
depends_on: [25-medal-ceremony, 35-second-map, 48-third-map, 58-map-four-campaign]
relates: [25-medal-ceremony, 63-hangar-tv, 62-world-medals]
source_files:
  - src/game/celebration.ts
  - src/game/state.ts
  - src/data/celebrations.ts
  - src/render/celebration.ts
  - src/scenes/celebration.ts
  - src/scenes/debrief.ts
  - src/scenes/routes.ts
  - src/assets/finales/
  - src/i18n/ui-en-hangar.ts
  - src/i18n/ui-de-hangar.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - dev/finale-plates.py
routes: []
models: []
test_files:
  - tests/unit/celebration.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [celebration, cutscene, finale, worlds, pixel-art, key-frames, comfyui]
path: Game/Campaign/Celebration
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 64 — World Celebrations

## Purpose

Owner, 2026-11-07: *"I would like to have a video sequence after each world to celebrate finishing the world."*
Question round: **pixel art from key frames**, like the medal ceremony (doc 25). Each of the four worlds gets its own
sequence of three generated pixel-art key frames, animated in code.

## Key frames (generated, `src/assets/finales/`)

ComfyUI workflow "Top Gun pixel scene 16:9" (FLUX.2 klein 4B, 4 steps, seed 7) on the M1, one prompt per shot plus the
shared style sentence (early-1990s point-and-click adventure background, flat colour areas, bold outlines; no text,
logos, insignia, flags or alcohol; empty sky at the top for the code's fireworks and fly-bys). Local pipeline
`dev/finale-plates.py`: the raw 1280 × 720 renders, box-downscaled to the 320 × 180 art grid, one shared 48-colour
palette per world (median cut, no dither), saved as indexed PNGs `w<world><shot>.png`.

| world | shot a | shot b | shot c |
|---|---|---|---|
| 1 — Theater of Operations | the carrier steaming home at sunset with escorts | the flight-deck party: crew in coloured vests cheering, caps in the air | the squadron saluting in a row before parked jets at dusk |
| 2 — Second Front | the carrier at anchor in a night harbour below the city lights | the hangar-bay party under coloured bulbs, a crate-stage band | the carrier sailing out of the storm under a rainbow at dawn |
| 3 — Low Level | a mountain forward base at sunrise, helicopters on the pad, crew waving | four helicopters in formation low over a fjord | the campfire at the forward base at dusk, a guitar |
| 4 — Deep Space | inside the orbital station, the crew floating with confetti before the planet window | a starfighter past a ringed giant at sunrise | the night side of the planet from orbit, a station in front |

- Made 2026-11-07 on the M1 (~4.5 min a frame); w3c was re-rendered (seed 11, "only grown-up soldiers in olive
  flight suits, no children, no cups") after the first render drew a child and civilians at the campfire. The twelve
  plates are 6–24 KB each, 150 KB together.

## The sequence (`src/scenes/celebration.ts`, ~22 s)

| time | what |
|---|---|
| 0–7 s | shot a, fading in from black; the player's own craft (jet, helicopter or spacecraft in its paint job) flies across the sky; fireworks start |
| 7–14 s | shot b (cross-fade); confetti falls; the admiral's line for the world in the speech box |
| 14–22 s | shot c (cross-fade); fireworks; the title card WORLD n COMPLETE with the world's name, its stars (x / 90) and its medals earned (x / 7) |
| end | fade to black, then `then` (the medal ceremony or the map; from the TV the tape shelf) |

- Pixel look: plates at 4 logical px per art px; fireworks and confetti in whole art pixels; the craft pixelated
  to the same grid.
- ENTER / ESC / tap skips to the title card, again leaves. The victory music plays.
- The pure timeline (`src/game/celebration.ts`): `celebrationBeat(t)` → shot index, its fade, which overlays run,
  whether the card shows; `worldSummary(save, world)` → stars and medals of the world; `afterDebrief(…)` → the route
  after a finale debrief: celebration → ceremony (if medals) → next.

## When it plays

- After a world's **finale** debrief (doc 35's rule: the map's last mission won with the whole map cleared): the
  debrief's buttons lead to `{ to: 'celebration', world, then: <ceremony or next> }`.
- Again any time from the hangar TV's tape shelf (doc 63).
- Only for a world whose key frames exist (`CELEBRATED`, worlds 1–4; world 5's come with Deep Water's wave 3): another
  world's finale goes straight to the medal ceremony or the map.

## Business Rules

- Route `{ to: 'celebration'; world: CampaignId; then: Route }`.
- Strings: `celebration.*` (`ui-en-hangar.ts` / `ui-de-hangar.ts`), admiral lines `adm.celebrate1–4`.
- Generated illustrations of nobody real; generic ships, aircraft and uniforms, no insignia.
