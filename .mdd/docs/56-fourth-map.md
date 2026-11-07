---
id: 56-fourth-map
title: Fourth Map - Space, Flown With the Spacecraft; Low Orbit (m91–m96), Three Space Enemies and the HALO Station
edition: TopRun
depends_on: [48-third-map, 54-spacecraft, 55-shipyard, 03-campaign-map, 05-mission-combat]
relates: [48-third-map, 54-spacecraft, 55-shipyard, 47-admin-pilot]
source_files:
  - src/data/types.ts
  - src/data/missions.ts
  - src/data/missions-4.ts
  - src/data/theaters.ts
  - src/data/theaters-4.ts
  - src/data/bosses.ts
  - src/data/bosses-4.ts
  - src/data/enemies.ts
  - src/game/map-three.ts
  - src/game/progress.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/routes.ts
  - src/scenes/map.ts
  - src/scenes/map-globe.ts
  - src/scenes/debrief.ts
  - src/render/enemies/space.ts
  - src/render/bosses-4.ts
  - src/render/bosses-later.ts
  - src/render/terrain-art.ts
  - src/render/draw-terrain.ts
  - src/render/carrier/sky-sea.ts
  - src/i18n/missions-4-de.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - dev/playtest.ts
routes: []
models: []
test_files:
  - tests/unit/missions-4.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [map-4, space, campaign, theaters, bosses, halo, balance, spacecraft]
path: Game/Campaign/FourthMap
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Wave 5 ships only Low Orbit (m91–m96); m97–m120, four more theaters and bosses, the rating's map-4 ranks and the rocket launch follow in waves 6–7."
  - "Resolved in wave 6: m97–m120, the four theaters and bosses and the map-4 rank (doc 58); the rocket launch stays for wave 7."
security_read_sites: []
sister_projects: []
---

# 56 — Fourth Map

## Purpose

Wave 5 of New Frontiers. Owner, 2026-11-06: *"Maybe lets go to space for the forth one?"* — fresh kit (the spacecraft,
doc 54), new weapon types, the wallet carries.

## Opening map 4

- Map 4 opens once m90 is cleared (`mapOpen(save, 4)`, doc 48's rule one map on); its missions unlock one by one as
  on every map. The admin pilot (doc 47) has it at once.
- The map picker (doc 48) gets a fourth chip.
- **Launch:** until the rocket launch (wave 7) a map-4 sortie goes **straight into the mission** — the takeoff rating
  is `skipped` (no takeoff bonus, no penalty).
- The hangar on map 4 is the shipyard (doc 55).

## Low Orbit — m91–m96 (wave 5)

| # | name | objective | pool |
|---|---|---|---|
| m91 | First Light | patrol | raider, drone, satgun |
| m92 | Gun Satellites | destroy 6 gun satellites | satgun, raider, drone |
| m93 | Raider Swarm | 26 kills | raider, drone, satgun |
| m94 | Corvette Screen | destroy 3 corvettes | corvette, raider, satgun |
| m95 | Dark Orbit | patrol | raider, corvette, satgun, drone |
| m96 | Halo | boss: HALO | raider, satgun |

- **Threat:** `2 + (n − 91) × 1.35` — one step below map 3's climb (the ship is a bigger target than a helicopter):
  m91 2 … m96 9. Length 100 + 1.2 per mission, the boss 40 + (n − 90).
- **Reward:** the map-1 formula from 1,200, times **map 4's pay: ×8, +3 % per mission** after m91
  (`MAP_FOUR` in `src/game/map-three.ts`, read by `payScale`).
- **Space enemies** (in space the ground layer is anything big and slow): Raider Fighter (air, 50 HP, fast, aimed
  shots), Gun Satellite (ground layer, 70 HP, flak), Corvette (ground layer, 380 HP, aimed shots and missiles) — drawn in
  `src/render/enemies/space.ts`.
- **HALO** — a ring battle station: core 3,200 HP (spread3), four pods of 220 (aimed, missile, two flak), escorted by a
  raider every 6 s.
- **Backdrop:** terrain `space` — a star field (many faint points, a few bright ones) with a faint nebula band.
- **A map ends only at a multiple of 30:** the admiral's finale and the debrief's campaign-complete only come at m30,
  m60, m90, m120 — clearing m96, the last mission so far, is a theater end, not a finale.

## Business Rules

- `CampaignId` 1–4; `kitOf(4)` = `'ship'` (doc 49).
- Missions in `src/data/missions-4.ts` (built by `buildCampaign`), theater in `theaters-4.ts`, boss in `bosses-4.ts`.
- `routes.ts`: campaign 4 → `MissionScene(…, 'skipped')`; the `hangar` route → `ShipyardScene` while the kit is the ship.

## Balance (bot playtest, 2026-11-07)

Bot: `dev/playtest.ts` `flyShip` — the ship bought from map-4 income only (no carried money), down `SHIP_ORDER`, placed
by `autoPlace`. Hulls lost per minute (lower = easier); calibration on jets: m11 1.7, m30 1.8, m60 4.8; map 3's opening:
m61 0.7, m66 1.8, m70 1.9.

| run | m91 | m93 | m96 (HALO) |
|---|---|---|---|
| bare core (hull 60, one barrel, full prices) | 7–8 | 7–8 | 5.5–6.5, HALO 29 s |
| starter ship, hull 80 core, halved prices, threat from 3 | 1.8–2.1 | 1.4–1.8 | 1.8–2.0, HALO 18 s |
| threat from 2 | 1.3–1.9 | 1.3–1.7 | 0.9–1.5, HALO 16.6 s |
| HALO core 2,400 → 3,200 | — | — | 1.4–1.9, HALO 21.5 s |

- The bare core could not survive the opening, so the ship now starts with two lasers and an engine (doc 54), the core
  has 80 hull and module prices were halved (doc 55).
- The bot earns ~72,000 by m93 and ~260,000 by m96 — enough for laser power 3, a plate and the capsule.
- The bot won every run and never crashed.
