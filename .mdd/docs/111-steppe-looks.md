---
id: 111-steppe-looks
title: Steppe Looks - The Steppe Camp's Home Base, the Motor Pool and Lab Pictures, Crew Outfits, New Faces, Item Pictures, the Map
edition: TopRun
depends_on: [86-jungle-looks, 95-jungle-camp-picture, 76-world-looks, 77-map-pictures, 33-image-portraits, 02-hangar-economy]
relates: [102-seventh-map, 110-map-seven-honours, 107-steppe-lab]
source_files:
  - src/data/base-docks.ts
  - src/data/base-areas.ts
  - src/render/base/dock.ts
  - src/render/base/dock-steppe.ts
  - src/scenes/hangar-base.ts
  - src/assets/docks/steppe.png
  - src/assets/docks/steppe-front.png
  - src/assets/loadout/tank.png
  - src/assets/outpost/lab-steppe.png
  - src/assets/maps/map7.png
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
  - tests/unit/crew-looks.test.ts
  - tests/unit/item-pictures.test.ts
  - tests/unit/map-pictures.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, steppe, loadout, lab, portraits, crew, items, map-picture, comfyui, map-7]
path: Game/Base/Steppe Looks
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-5
wave_status: complete
---

# 111 — Steppe Looks

Owner, 2026-11-14: *"Mit allem drum und drann."* The usual pictures for a new world, all generated on the owner's PC
(GTX 1080) with the TopGun pixel-scene and crew-portrait workflows: no text, logos, insignia or flags; nobody real;
grown-ups only.

- **The steppe camp** (home base look `steppe`, `src/assets/docks/steppe.png` + `steppe-front.png`): the cosy command tent
  of the steppe outpost — canvas, wooden poles, rugs, string lights; the map table (the map), the lockers, the rec room's
  arcade corner, the scoreboard and the chalkboard, the cork board, a container lab's door with a violet window (the
  steppe lab, doc 107) and the tent flap open onto the motor pool with a tank's front (the MOTOR POOL).
- **Motor pool background** (`loadout/tank.png`): a dusty garage tent with a tank under a gantry and a buggy.
- **Steppe lab** (`outpost/lab-steppe.png`): a converted container with a glowing alien artifact under glass.
- **Crew outfits** (`*-steppe` portraits): the chief in a sand coverall with goggles and scarf, Shooter as the launch
  controller in tan field kit with a headset, Duke in tan steppe fatigues with goggles.
- **New faces:** Captain Rosa "Bastion" Ortega (outpost command, doc 106) and Dr. Ilya "Sparks" Novak (the lab, doc 107),
  with talk / half / blink frames.
- **Item pictures:** the turret cannon, the six tank weapons, the six arsenal items and the six towers (doc 02's
  pipeline).
- **Map picture** (`maps/map7.png`, doc 77's way): the map's own layout repainted — golden grass, white salt, red
  badlands, olive barrows, the black crater.

## The tent as laid out

`STEPPE_AREAS` / `STEPPE_LAYOUT` (`base-docks.ts`) place the areas on the picture's own objects: the arcade (fun), the
lockers and their cork board (photos), the scoreboard (ladder; the flip board over it, three rows) over the chalkboard
(the slate from x 290, where the lockers stop covering it), the lab container's door (lab → Dr. Novak's STEPPE LAB),
the tent flap with the tank (jet → the MOTOR POOL), the TV on its crates (the TV's picture on its screen) and the map
table (exit). The joystick neon sits on the pink-lit canvas over the arcade. Depth (doc 92): horizon 300, pilot 0.92 on
the front line; the left corner is reached up the lane by the sofa (x 292) and stood at y 560, the lab door and the flap
up the lane by the TV (x 935), y 474 and 500. The front mask puts the map table, the TV stack and the sofa in front of
the pilot. Ambient (`dock-steppe.ts`): string lights and the lantern twinkling, the lab window's violet and the map
lamp breathing, dust blowing past the tank, motes. Hints: "The motor pool …", "Dr. Novak's lab …" (`hbase.hint.tank`,
`hbase.hint.steppeLab`).

## Renders kept

Seeds and run ids in the art scratchpad's `prompts.json`. Doubtful but kept: the grenade launcher has a shoulder stock,
the AA rockets show three tubes, the APDS dart's fins sit near the tip; i7b's camouflage nets are olive, not sand; the
chief's steppe portrait shows two moons and a sand shirt rather than a coverall; w7b has a plain cup on the table (no
bottles).

## The map picture

`maps/map7.png` (doc 77's way): map 7's layout (`staticLayer(7)` cropped to the map panel) repainted on the PC with
FLUX.2 klein, seed 7. The maps 1–6 prompt painted half of the Crater's shape as barrow fields (seed 11 lost the
outline), so the kept prompt names the violet shape's extent and asks for one terrain per shape from edge to edge: black
volcanic glass with violet cracks, green barrow fields with mounds and stone rings, rust mesas and gullies, cracked salt,
tall golden grass, on tan steppe with faint tracks. Checked in the game: every mission node sits on its theater's
terrain. A few pixels of mesa shading run past the badlands' right edge.
