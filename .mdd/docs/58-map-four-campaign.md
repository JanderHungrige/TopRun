---
id: 58-map-four-campaign
title: Map Four Campaign - m97–m120 in Four More Theaters, Four Bosses Ending With the ARK, New Space Enemies, Ranks for Four Maps
edition: TopRun
depends_on: [56-fourth-map, 57-space-arsenal, 26-pilot-rating, 44-new-adversaries]
relates: [56-fourth-map, 48-third-map, 27-online-ladder]
source_files:
  - src/data/types.ts
  - src/data/missions-4.ts
  - src/data/theaters.ts
  - src/data/theaters-4.ts
  - src/data/bosses-4.ts
  - src/data/enemies.ts
  - src/data/reinforcements.ts
  - src/data/ranks.ts
  - src/data/photo-looks.ts
  - src/game/rating.ts
  - src/game/waves.ts
  - src/render/enemies/space.ts
  - src/render/draw-enemies.ts
  - src/render/bosses-4.ts
  - src/render/terrain-art.ts
  - src/render/draw-terrain.ts
  - src/render/carrier/sky-sea.ts
  - src/render/minigames/evasion-world.ts
  - src/render/photos/props.ts
  - src/render/ranks.ts
  - src/scenes/map-render.ts
  - src/i18n/missions-4-de.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-en.ts
  - src/i18n/ui-de.ts
routes: []
models: []
test_files:
  - tests/unit/missions-4.test.ts
  - tests/unit/rating.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [map-4, space, campaign, theaters, bosses, enemies, mini-boss, ranks, rating, finale]
path: Game/Campaign/FourthMap
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "The spacecraft has no flares or other missile defence, so map 4's missiles (interceptors, batteries, corvettes, bosses) always land; the Lunar Front sits above the Ring Giant in the bot sweep. Wave 7's balance pass decides (a point-defence module or flares)."
security_read_sites: []
sister_projects: []
---

# 58 — Map Four Campaign

## Purpose

Wave 6 of New Frontiers: map 4 grows from Low Orbit (doc 56) to the full 30 missions, m91–m120, like every other map
— five theaters of six, a boss closing each, the finale at m120.

## Theaters

| # | theater | missions | backdrop | boss |
|---|---|---|---|---|
| 1 | Low Orbit — *Above the blue* | m91–m96 | star field (doc 56) | HALO, ring battle station |
| 2 | Asteroid Belt — *Rocks with guns* | m97–m102 | star field thick with drifting asteroids (`belt`) | QUARRY, asteroid fortress |
| 3 | Lunar Front — *Dust and craters* | m103–m108 | grey regolith with craters (`lunar`) | CRATER, lunar citadel |
| 4 | Ring Giant — *Ice in the rings* | m109–m114 | icy ring chunks over a dark field (`belt`, icy palette) | TRIDENT, three-hulled dreadnought |
| 5 | Deep Space — *Past the last star* | m115–m120 | star field in a red nebula | ARK, the mothership (finale) |

Threat, length and reward keep doc 56's formulas: threat `2 + (n − 91) × 1.35` (m120: 41, map 3's m90 is 42), pay
×8 rising 3 % a mission.

## Missions

| # | name | objective | pool |
|---|---|---|---|
| m97 | Rock Field | patrol | raider, interceptor, satgun |
| m98 | Prospectors | 4 gunships | gunship, raider, satgun |
| m99 | Interceptor Nest | 30 kills | interceptor, raider, drone |
| m100 | Ore Convoy | 4 corvettes | corvette, gunship, raider |
| m101 | Hollow Rocks | patrol | satgun, gunship, interceptor, raider |
| m102 | Quarry | boss QUARRY | raider, interceptor |
| m103 | Dust Line | patrol | battery, raider, interceptor |
| m104 | Crater Guns | 8 lunar batteries | battery, raider, drone |
| m105 | Moonrise | 32 kills | interceptor, raider, drone |
| m106 | Supply Line | 5 gunships | gunship, battery, interceptor |
| m107 | Far Side | patrol | battery, gunship, interceptor, raider |
| m108 | Crater | boss CRATER | battery, interceptor |
| m109 | Ice Rings | patrol | interceptor, raider, satgun |
| m110 | Ring Stations | 10 gun satellites | satgun, gunship, interceptor |
| m111 | Storm Band | 36 kills | interceptor, raider, drone |
| m112 | Heavy Escort | 6 corvettes | corvette, gunship, interceptor |
| m113 | Ring Shadow | patrol | gunship, corvette, interceptor, satgun |
| m114 | Trident | boss TRIDENT | interceptor, raider |
| m115 | Past the Last Light | patrol | interceptor, raider, gunship |
| m116 | Picket Line | 7 corvettes | corvette, interceptor, satgun |
| m117 | Dark Swarm | 40 kills | interceptor, raider, drone |
| m118 | Fleet Yards | 8 gunships | gunship, corvette, interceptor |
| m119 | Final Approach | patrol | gunship, corvette, interceptor, raider, satgun |
| m120 | Ark | boss ARK | interceptor, raider |

German names and briefings in `src/i18n/missions-4-de.ts`.

## New enemies

| kind | name | layer | HP | speed | weapons |
|---|---|---|---|---|---|
| interceptor | Interceptor | air | 90 | 300 | missiles every 4.5 s, aimed shots every 1.6 s; dives and strafes |
| gunship | Gunship | ground | 240 | 30 | three-way spread every 2.2 s, flak every 3 s |
| battery | Lunar Battery | ground | 140 | 0 | aimed shots every 2.2 s, missiles every 5.5 s |
| warden | Battlecruiser (mini-boss) | ground | 2,200 | 20 | three-way spread every 1.8 s, missiles every 3.2 s |

- **Mini-boss:** from the Asteroid Belt on (m97), one battlecruiser per mission at 55 % of the way, none in boss
  missions (doc 44's rule, map 4's kind).
- **Reinforcements** (doc 44): the interceptor joins the pools from m99, the gunship from m109.

## Bosses

| boss | theater | core HP | parts | bounty | escort |
|---|---|---|---|---|---|
| HALO | Low Orbit | 3,200 | 4 | 3,000 | raider / 6 s |
| QUARRY | Asteroid Belt | 3,800 | 5 (gun pits in the rock) | 4,000 | interceptor / 7 s |
| CRATER | Lunar Front | 4,400 | 5 (dome turrets, a missile silo) | 5,000 | raider / 8 s |
| TRIDENT | Ring Giant | 5,000 | 6 (bow guns, flank racks, stern flak) | 6,000 | raider / 6 s |
| ARK | Deep Space | 6,200 | 7 (broadside batteries, launch bays, the prow cannon) | 8,000 | interceptor / 5 s |

Generic names, original shapes drawn in code (`src/render/bosses-4.ts`).

## The finale

Clearing m120 with map 4 complete gives the admiral's `adm.finale4`, the debrief's `debrief.finale4` banner and
`map.campaign4Complete` on the map (all in place since wave 5; doc 56's rule: a map ends only at a multiple of 30).

## Pilot rating and ranks (doc 26 update)

- `RATING.maxStars` 270 → **360** and `maxScore` 90,000 → **120,000** (four maps): the top rating grows from 46,000
  to **58,000**.
- One new rank above Ace of Aces: `staradm` **Star Admiral / Sternenadmiral** from **48,000** (rank board: four wide
  stripes — every rank board carries its star). Earlier thresholds stay. The ladder service runs this code and rolls
  out with it.

## Business Rules

- `TheaterId` += belt, moon, rings, deep; `BossId` += quarry, crater, trident, ark; `EnemyKind` += interceptor,
  gunship, battery, warden; `TerrainStyle` += belt, lunar. Every table keyed by them gets its rows (the compiler
  checks).
- `miniBosses(m)`: campaign 4 from m97 (`MAP4_MINI_BOSS_FROM`) → `[{ at: 0.55, kind: 'warden' }]`.
- Backdrops: `belt` is the star field with asteroids drifting through (rocks 10–34 px in 35 % of rows, big ones
  40–70 px in 8 %); `lunar` is grey regolith with craters (`crater` feature: a bright rim around a shadowed bowl).
- The campaign map: map 4's routes snake from the bottom left (Low Orbit) to the top (Deep Space); theater labels in
  `src/scenes/map-render.ts`.

## Balance (bot sweep, 2026-11-07)

Bot as in doc 56, buying down `SHIP_ORDER` with torpedo bays and marks (doc 57) from map-4 income only. Hulls lost per
minute, two or three runs each; map 3 at the same place in brackets (doc 48).

| mission | first sweep | after tuning | map 3 |
|---|---|---|---|
| m99 | 2.6–2.7 | — | (m69 ≈ 1.9) |
| m102 QUARRY | 2.3, boss 18–19 s | — | |
| m103 | — | 3.2–3.4 | |
| m104 | — | 3.5–4.1 | |
| m105 | 3.2–3.4 | 3.0–3.2 | (m75 2.8) |
| m108 CRATER | 4.5–4.6, boss 19–20 s | 3.1–4.0, boss 17–20 s | (m78 2.5) |
| m111 | 2.6–3.0 | — | (m81 ≈ 2.6) |
| m114 TRIDENT | 4.3–4.6, boss 19–21 s | 3.5–3.6, boss 21 s | (m84 2.6) |
| m117 | 4.8–5.3 | 4.4–5.3 | (m87 ≈ 4.9) |
| m120 ARK | 4.5–4.7, boss 29–30 s | — | (m90 5.2) |

- Tuning from the first sweep: CRATER's guns slower (core 2.4 → 2.8 s, turrets 1.5 → 1.8 s and 2.3 → 2.7 s, escort
  every 6 → 8 s); TRIDENT's guns slower (core and flank guns 1.4 → 1.7 s, bow 1.7 → 1.9 s) and raiders instead of
  interceptors as escort; the interceptor's missiles every 3 → 4.5 s; the lunar battery fires aimed shots every 2.2 s
  instead of flak every 2 s (flak bursts catch a big ship too easily) and missiles every 5.5 s; m104 trades its gun
  satellites for drones.
- The bot won every run and never crashed. It earns ≈ 10.4 M on map 4 (m91–m120); the shipyard's whole list (laser
  power to 10, every mark to Mk V, ~20 modules) costs ≈ 12–13 M.

