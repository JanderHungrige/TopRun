---
id: 85-map-six-honours
title: Map Six Honours - Seven Medals, the Jungle Clearing Ceremony, the Celebration, the Tape, Jungle Marshal
edition: TopRun
depends_on: [62-world-medals, 64-world-celebrations, 63-hangar-tv, 75-world-ceremonies, 26-pilot-rating]
relates: [72-map-five-honours, 78-sixth-map, 31-locker-uniform]
source_files:
  - src/data/medals.ts
  - src/game/medals.ts
  - src/i18n/medals-de.ts
  - src/render/medals/designs.ts
  - src/render/medals/emblems-4.ts
  - src/game/uniform-layout.ts
  - src/data/ranks.ts
  - src/render/ranks.ts
  - src/game/rating.ts
  - src/game/ceremony-stage.ts
  - src/render/ceremony-stage.ts
  - src/data/ceremony-sets.ts
  - dev/ceremony-sets.py
  - src/game/celebration.ts
  - src/render/celebration.ts
  - src/scenes/celebration.ts
  - src/scenes/tapes.ts
  - src/assets/ceremony/
  - src/assets/finales/
routes: []
models: []
test_files:
  - tests/unit/world-medals.test.ts
  - tests/unit/rating.test.ts
  - tests/unit/ceremony-sets.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [medals, ribbons, ceremony, celebration, tapes, rating, ranks, map-6, key-frames, comfyui]
path: Game/Honours/Jungle Planet
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 85 — Map Six Honours

Map 6 is the sixth row of docs 62 (world medals), 64 (celebrations), 63 (the TV), 75 (world ceremonies) and 26 (the rating).

## The medals

| theater ribbons (boss) | victory medal | golden star |
|---|---|---|
| Landing Zone (RAVAGER), Rainforest (MANTIS), Mangrove Swamp (BASILISK), Temple Ruins (SENTINEL), the Hive (HIVE QUEEN) | **Jungle Planet Medal** — a gold disc with a walking mech | **Golden Star, Jungle Planet** |

- Ids `landing`, `canopy`, `swamp`, `ruins`, `hive`, `victory6`, `allstars6`; bronze, bronze, silver, silver, gold.
- Emblems (`src/render/medals/emblems-4.ts`): a boot print, a palm tree, a reptile's eye between reeds, a step pyramid,
  a hive's cells, a mech.
- **Locker:** 30 campaign ribbons stand in six rows of five (`ribbonsPerRow` never more than five a row), so the bars stay
  readable and on the breast.
- **Rating:** 540 stars, 53 medals, 180 missions' scores; top rating 90,750. **Jungle Marshal** from 72,000 (six stripes).

## The ceremony

A jungle clearing at golden hour (the M1, seed 7): two big mechs parked on the right, a row of nine soldiers in bush
hats, a volcano, colourful birds; the soldiers' salute is an overlay from the crop edit (seed 11), as on the pier and in
the space hangar (doc 75). Admiral and pilot are the same cut-outs; birds glide by.

## The celebration and the tape

Three key frames (`w6a`–`w6c`): the jungle at sunrise with long-necked grazers by a river and the broken hive overgrown;
the victory party in the mess hut at night with fireflies outside; three mechs at dusk with soldiers waving from their
shoulders and a dropship lifting off. The player's mech **walks** across the bottom of each shot (it doesn't fly). The
tape on the TV's shelf is jungle green.
