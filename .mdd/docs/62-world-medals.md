---
id: 62-world-medals
title: World Medals - Campaign Ribbons, Victory Medals and Golden Stars for Maps 2–4
edition: TopRun
depends_on: [24-medals-core, 25-medal-ceremony, 31-locker-uniform, 26-pilot-rating]
relates: [24-medals-core, 25-medal-ceremony, 31-locker-uniform, 26-pilot-rating, 27-online-ladder]
source_files:
  - src/data/medals.ts
  - src/game/medals.ts
  - src/game/rating.ts
  - src/game/uniform-layout.ts
  - src/i18n/medals-de.ts
  - src/render/medals/designs.ts
  - src/render/medals/emblems.ts
  - src/render/medals/emblems-2.ts
  - src/render/medals/emblem-kit.ts
routes: []
models: []
test_files:
  - tests/unit/world-medals.test.ts
  - tests/unit/rating.test.ts
  - tests/unit/ladder.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [medals, ribbons, campaign, map-2, map-3, map-4, ceremony, locker, rating]
path: Game/Honours/Medals
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 62 — World Medals

## Purpose

Owner, 2026-11-07: *"the new worlds need new medals."* Question round: **like map 1, for maps 2–4** — per map a
campaign ribbon for each theater's boss, a victory medal for the map and a golden star for three stars on every
mission. 21 new medals; nothing else about medals changes (doc 24).

## The medals

| map | theater ribbons (boss) | victory medal | golden star |
|---|---|---|---|
| 2 — Second Front | North Sea (KRAKEN), Roof of the World (CONDOR), Green Hell (PYTHON), Desert Night (SCORPION), Thunderhead (COLOSSUS) | **Second Front Medal** — gold cross | **Golden Star, Second Front** |
| 3 — Low Level | Fjord Country (GLACIER), Highland Passes (CITADEL), River Delta (CAIMAN), Mesa Country (MAMMOTH), Ash Island (BEHEMOTH) | **Low Level Medal** — gold disc with a rotor | **Golden Star, Low Level** |
| 4 — Deep Space | Low Orbit (HALO), Asteroid Belt (QUARRY), Lunar Front (CRATER), Ring Giant (TRIDENT), Deep Space (ARK) | **Deep Space Medal** — gold star with a rocket | **Golden Star, Deep Space** |

- Ids: the theater ribbons use the theater id (`northsea` … `deep`); `victory2–4`, `allstars2–4`.
- Ribbons are campaign ribbons (shape `ribbon`): bronze for the first two theaters of a map, silver for the next
  two, gold for the last (as on map 1). Each has its own ribbon stripes in the theater's colours and an emblem on its
  close-up disc: rig, peak, palm, crescent moon, lightning (map 2); wave, peak, palm, mesa, volcano (map 3); orbit,
  asteroid, crescent moon, ringed planet, star burst (map 4).
- New emblems (drawn in code like the others, `src/render/medals/emblems-2.ts`): `rig`, `peak`, `moon`, `bolt`,
  `volcano`, `orbit`, `rock`, `planet`, `rotor`, `rocket`.
- Generic names and original designs (doc 24): no real decoration, no insignia.

## Earning them (derived from the save, doc 24)

- A theater ribbon: that theater's boss mission cleared.
- A victory medal: the map's last mission (m60, m90, m120) cleared.
- A golden star: three stars on every mission of the map.
- They are awarded in the medal ceremony after the debrief like every medal (doc 25), in catalogue order: map 1's
  campaign medals, then map 2's, 3's and 4's, then the combat, off-duty and dedication medals.

## Locker (doc 31)

The campaign ribbons stand as ribbon bars on the right breast: three a row up to 15 ribbons, **four a row** above
(20 ribbons in five rows still clear the collar). The hanging medals tuck closer as before.

## Rating (doc 26)

`RATING.maxMedals` 18 → **39**: every medal counts (250 points); the top rating grows by 5,250 to **63,250**. Ranks
keep their thresholds. The ladder service runs this code and rolls out with it.

## Business Rules

- `MEDAL_IDS` order is the catalogue order; `earnedMedals` (`src/game/medals.ts`) finds bosses over all maps
  (`ALL_MISSIONS`) and a map's missions through `campaignMissions(c)`.
- Every `Record<MedalId, …>` table (`MEDALS`, `DESIGNS`, `MEDALS_DE`) gets the 21 rows — the compiler checks.
