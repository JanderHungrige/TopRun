---
id: 86-jungle-looks
title: Jungle Looks - The Crew Hut With the Ground Base and the Lab, the Mech Bay Background, the Crew in Jungle Kit, New Faces, Item Pictures, the Map Picture
edition: TopRun
depends_on: [76-world-looks, 73-home-docks, 77-map-pictures, 33-image-portraits]
relates: [82-ground-base, 83-lab, 79-mech-kit, 84-drop-launch]
source_files:
  - src/data/base-areas.ts
  - src/data/base-docks.ts
  - src/game/base-hangar.ts
  - src/scenes/hangar-base.ts
  - src/render/base/dock.ts
  - src/render/base/dock-jungle.ts
  - src/render/base/dock-globe.ts
  - src/render/base/labels.ts
  - src/game/crew-looks.ts
  - src/render/portraits/index.ts
  - src/render/portraits/types.ts
  - src/ui/speech.ts
  - src/assets/docks/jungle.png
  - src/assets/loadout/mech.png
  - src/assets/portraits/
  - src/assets/items/
  - src/assets/maps/map6.png
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
  - tests/unit/crew-looks.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, jungle, loadout, portraits, crew, items, map-picture, comfyui, map-6]
path: Game/Base/Jungle Looks
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 86 — Jungle Looks

> **Jungle camp (doc 95, 2026-11-08):** the jungle base's crew hut and its code-drawn globe are replaced by the run-down field camp L121 — the map table leads to the map, the track to the ground base's buildings is the build layer, the mech's leg is the craft.

Owner, 2026-11-08: *"We need the usual images for the cosy base, the loadout items, loadout background, new person
images, mech warriors, ribbons, ceremony scenes, etc."* All rendered on the M1 (the PC was offline), seed 7 unless said.

## The crew hut (the jungle base's home base)

Picture **A** of two (B kept on the M1): the cozy crew hut of the jungle field base — planks, bamboo and corrugated
metal, a ceiling fan, fairy lights, a hammock and a couch on a rug, plants. Its areas: the lockers and the pink rec room
with the arcade on the left, the scoreboard (world 1's flip board over it) over the chalkboard, **the lab's door with its
round green window** (LAB, doc 83), the cork board with photos, **the big window onto the compound** — generator, factory
chimney, radio mast (GROUND BASE, doc 82) — and the open gate with a mech's leg and side outside (the MECH BAY). A jungle
planet globe on a tripod, drawn in code, is the way to the map. Its life: the fairy lights twinkling, the lab window and
the ceiling lamp breathing green, fireflies outside the window and the gate, dust motes. Pilot scale 0.9.

- The area tables became per look (`AreaTable`, `areaIds`): every look has the carrier's eight, the jungle base adds
  `base` and `lab`; ←/→ step through the look's own areas, the hint of the craft area there names the mech bay.

## Pictures

- **Mech bay background** (`loadout/mech.png`): a green walking mech in a maintenance gantry under camouflage netting,
  a second one under a tarp, crates and puddles; the paint shop sits on it too.
- **Ground base** (`outpost/base.png`): an empty red-earth clearing with sandbags, a fence, a waterfall and two moons;
  the buildings are drawn in code on it. **Lab** (`outpost/lab.png`): flasks, a microscope, a half-built energy gun, a
  frog in a terrarium.
- **Crew outfits:** the chief in an olive mechanic's coverall with a red bandana in a mech repair bay; Shooter as the drop
  controller in jungle kit and bush hat at a landing zone (edits of the base portraits; talk / half / blink frames
  transplanted as in doc 76).
- **New faces:** Major Tom "Dozer" Brennan (the ground base) and Dr. Ada "Flask" Moreau (the lab), original faces from the
  crew portrait workflow, with talk / half / blink frames.
- **Item pictures:** the autocannon, rocket pod, seeker missile, mortar shell, plasma lance and rail cannon (doc 02's
  pipeline on magenta).
- **Map picture** (doc 77's way): the map's own layout repainted — the canopy, the red clearing, the rainforest with a
  waterfall, the mangrove swamp, the temple ruins with step pyramids, the purple hive.
