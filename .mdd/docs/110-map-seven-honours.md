---
id: 110-map-seven-honours
title: Map Seven Honours - Seven Medals, the Steppe Ceremony in Steppe Camouflage, the Celebration, the Tape, the Top Rank
edition: TopRun
depends_on: [85-map-six-honours, 98-ceremony-looks, 62-world-medals, 64-world-celebrations, 63-hangar-tv, 26-pilot-rating]
relates: [102-seventh-map, 111-steppe-looks]
source_files:
  - src/data/medals.ts
  - src/game/medals.ts
  - src/render/medals/designs.ts
  - src/render/medals/emblems.ts
  - src/render/medals/emblems-5.ts
  - src/i18n/medals-de.ts
  - src/game/rating.ts
  - src/data/ranks.ts
  - src/render/ranks.ts
  - src/game/ceremony-stage.ts
  - src/render/ceremony-stage.ts
  - src/data/ceremony-sets.ts
  - src/game/celebration.ts
  - src/render/celebration.ts
  - src/scenes/celebration.ts
  - src/game/tapes.ts
  - src/scenes/tapes.ts
  - src/game/intro.ts
  - src/render/intro.ts
  - src/scenes/intro.ts
  - src/i18n/lines-intro-en.ts
  - src/i18n/lines-intro-de.ts
routes: []
models: []
test_files:
  - tests/unit/world-medals.test.ts
  - tests/unit/rating.test.ts
  - tests/unit/medals.test.ts
  - tests/unit/ladder.test.ts
  - tests/unit/uniform-layout.test.ts
  - tests/unit/ceremony-sets.test.ts
  - tests/unit/ceremony-looks.test.ts
  - tests/unit/intro.test.ts
  - tests/unit/tapes.test.ts
  - tests/unit/celebration.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [medals, ribbons, ceremony, uniforms, celebration, tapes, rating, ranks, map-7, steppe, comfyui]
path: Game/Honours/Map Seven
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-5
wave_status: complete
---

# 110 — Map Seven Honours

Map 7 is the seventh row of docs 62 (world medals), 64 (celebrations), 63 (the TV), 75 / 98 (world ceremonies) and 26
(the rating). Owner, 2026-11-14: *"Mit allem drum und drann. Intro, medallien, uniform, …"*

## The medals

| theater ribbons (boss) | victory medal | golden star |
|---|---|---|
| Sea of Grass (HARVESTER), Salt Flats (LONGSHANKS), Red Badlands (JUGGERNAUT), Barrow Fields (DREADNOUGHT), the Crater (MOTHERSHIP) | **Steppe Medal** — a gold disc with a tank | **Golden Star, Alien Steppe** |

- Ids `grass`, `saltflats`, `badlands`, `barrows`, `impact`, `victory7`, `allstars7`; bronze, bronze, silver, silver,
  gold. Inserted after `allstars6` (a world's seven medals stay together for `worldMedalIds`).
- Emblems (`emblems-5.ts`): a tuft of grass, a salt crystal, a butte (`butte`; `mesa` is the canyon's), a standing
  stone, a crater with a ring; a tank for the victory medal.
- **Locker:** 35 campaign ribbons in seven rows of five.
- **Rating:** 630 stars, 60 medals, 210 missions' scores; top rating 104,500. **Steppe Marshal** from 84,000.

## The ceremony

The steppe camp at golden hour (stage `steppe`, the art of doc 111's pipeline): canvas tents, sand camouflage nets, a tank
and a buggy, a row of ten soldiers in varied tan steppe camouflage, the big moon. The admiral and the pilot wear **steppe
camouflage** (`stageOutfit('steppe')` = `steppe`: the cut-outs' clothes recoloured to a clean, slightly dusty sand / khaki /
brown / olive camouflage, `-steppe` variants beside the others).

## The celebration and the tape

Three key frames (`w7a`–`w7c`): the steppe at sunrise with native grazers returning and the broken mothership in the
distant crater; the victory party in the camp at night round a campfire; tanks and buggies at dusk with soldiers waving
and a lander lifting off. The player's vehicle **drives** across the bottom of each shot. The tape on the TV's shelf is
dusty gold; the shelf holds seven tapes in one column, rows closer (70 px apart, 62 px tall) so the last ends above the
floor.

## The intro

World 7 joins doc 97's welcome films: four key frames (`i7a`–`i7d`: the lander over the endless grass; the field camp
with tanks; the invasion's columns; the mothership rising from the crater) and Duke's four lines in his steppe kit, the
card WELCOME TO — KHARSA — WORLD 7 · ALIEN STEPPE; dust drifting over the pan.

## The stage as rendered

The steppe camp plate (seed 7) has six soldiers in the row, not ten, and no buggy; five of the six salute in the overlay
(seed 11). Seed 23 had nine but a tank–buggy hybrid and helmets in its salute edit, so the cleaner take was kept
(raws in the art scratchpad). The admiral and pilot cut-outs come in `-steppe` blotchy desert camouflage, the same size
as the dress ones (`dev/ceremony-uniforms.py`, outfit `steppe`).

## Verification

Unit: the seven medals in catalogue order with German texts, map 7's ribbons and stars, 35 ribbons in seven rows, the
rating caps (630 stars, 60 medals, 210,000 score: top 104,500), Steppe Marshal from 84,000, the ladder's server-side
rating, the steppe stage and outfit, world 7's intro (four key frames, Duke's lines), seven tapes, the celebration.
