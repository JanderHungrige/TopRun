---
id: 72-map-five-honours
title: Map Five Honours - Seven Medals, World 5's Celebration, the Fifth Tape, the Rating's Fifth Map and a New Top Rank
edition: TopRun
depends_on: [62-world-medals, 64-world-celebrations, 63-hangar-tv, 26-pilot-rating, 70-map-five-campaign]
relates: [62-world-medals, 64-world-celebrations, 63-hangar-tv, 58-map-four-campaign]
source_files:
  - src/data/medals.ts
  - src/data/ranks.ts
  - src/game/medals.ts
  - src/game/rating.ts
  - src/game/celebration.ts
  - src/game/tapes.ts
  - src/game/uniform-layout.ts
  - src/i18n/medals-de.ts
  - src/i18n/ui-en-deep.ts
  - src/i18n/ui-de-deep.ts
  - src/render/medals/designs.ts
  - src/render/medals/emblems-3.ts
  - src/render/ranks.ts
  - src/render/celebration.ts
  - src/scenes/tapes.ts
  - src/assets/finales/
routes: []
models: []
test_files:
  - tests/unit/world-medals.test.ts
  - tests/unit/rating.test.ts
  - tests/unit/celebration.test.ts
  - tests/unit/tapes.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [medals, ribbons, celebration, tapes, rating, ranks, map-5, key-frames, comfyui]
path: Game/Honours/Deep Water
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 72 — Map Five Honours

## Purpose

Wave 3 of Deep Water. The question round set it: **a full map** like the others — its medals and its celebration.
Everything follows docs 62 (world medals), 64 (celebrations), 63 (the TV) and 26 (the rating); map 5 is the fifth row.

## The medals (doc 62's pattern)

| theater ribbons (boss) | victory medal | golden star |
|---|---|---|
| Coral Reef (BARRACUDA), Kelp Forest (MEDUSA), Wreck Field (BASTION), the Trench (GOLIATH), the Abyss (JORMUNGAND) | **Deep Water Medal** — a gold disc with a submarine | **Golden Star, Deep Water** |

- Ids: the theater ids (`reef`, `kelp`, `wrecks`, `trench`, `abyss`), `victory5`, `allstars5`.
- Ribbons bronze, bronze, silver, silver, gold, stripes in each theater's colours; emblems on the close-up disc:
  coral, kelp, anchor, a downward chevron (the trench), a glowing lure (the abyss); the victory medal's submarine.
- New emblems in `src/render/medals/emblems-3.ts`: `coral`, `kelp`, `anchor`, `chevron`, `lure`, `sub`.
- Earned and awarded as in doc 62: a ribbon for the theater's boss cleared, the medal for m150, the star for three
  stars on all thirty.
- **Locker:** 25 campaign ribbons now — the rack takes as many a row as keeps it at five rows (five a row at 25), and
  never grows wider than three full bars: four or five a row are smaller bars (≥ 24 × 7), so the rack stays on the
  breast between the sleeve seam and the buttons (owner: *"Ribbons … are quite over the uniform borders"*).

## The celebration (doc 64's pattern)

Three generated key frames (`w5a`–`w5c`, the M1, seed 7, doc 64's pipeline and style sentence):

| shot a | shot b | shot c |
|---|---|---|
| under the sunlit sea over a reef, a whale and dolphins, sun shafts from the surface | the underwater base's mess-hall party under a big round window, grown-up sailors cheering, an accordion, a cake | dusk at sea: the carrier at anchor, the sub surfaced beside it, sailors waving on its deck |

- The player's sub crosses each shot (its side view) as the craft did on the other maps.
- Under the sea the fireworks are **bubble bursts** — rings of bubbles rising and wobbling — and the shot over the sea
  at dusk keeps real fireworks.
- `CELEBRATED` (doc 64) now includes world 5: the finale at m150 plays it.

## The TV (doc 63)

The tape shelf holds **five** tapes: WORLD 5 · DEEP WATER in a teal sleeve. The tapes stand a little closer so five fit.

## Rating (doc 26)

- `RATING.maxStars` 360 → **450**, `maxMedals` 39 → **46**, `maxScore` 120,000 → **150,000** (five maps of best scores);
  the top rating grows to **77,000**.
- A new top rank above Star Admiral: **Admiral of the Deep** (`deepadm`) from **60,000** — five wide stripes.
- The ladder service runs this code and rolls out with it.

## Business Rules

- `MEDAL_IDS` order is the catalogue order: map 5's seven after map 4's.
- Every `Record<MedalId, …>` table (`MEDALS`, `DESIGNS`, `MEDALS_DE`) and `Record<RankId, …>` table gets its rows —
  the compiler checks.
