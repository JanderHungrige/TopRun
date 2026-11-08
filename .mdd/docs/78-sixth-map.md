---
id: 78-sixth-map
title: Sixth Map - The Jungle Planet, m151–m180, Five Theaters After Space
edition: TopRun
depends_on: [74-world-order, 65-fifth-map, 56-fourth-map, 03-campaign-map]
relates: [79-mech-kit, 80-mech-walk, 81-jungle-world, 82-ground-base, 83-lab]
source_files:
  - src/data/types.ts
  - src/data/theaters-6.ts
  - src/data/missions-6.ts
  - src/data/bosses-6.ts
  - src/data/reinforcements.ts
  - src/game/map-three.ts
  - src/game/progress.ts
  - src/i18n/missions-6-de.ts
  - src/scenes/map.ts
  - src/scenes/map-render.ts
  - src/scenes/map-globe.ts
routes: []
models: []
test_files:
  - tests/unit/missions-6.test.ts
data_flow: writes-existing
last_synced: 2026-11-08
status: in_progress
phase: all
mdd_version: 11
tags: [map-6, jungle, campaign, theaters, bosses, mechs, balance]
path: Game/Campaign/Sixth Map
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 78 — Sixth Map: the Jungle Planet

## Purpose

Owner, 2026-11-08: *"Now for the next world, we land on a jungle planet. We have mechwarriors as machines. Walking
around."* After the space world's finale (ARK, m150) the fleet lands on a jungle planet. Map 6 is a full map like the
others: 30 missions in five theaters, a boss each, a mini-boss, a launch game (the drop, doc 84), seven medals and a
celebration (doc 85).

## The map

| theater | missions | tagline | boss |
|---|---|---|---|
| Landing Zone | m151–m156 | Boots on the ground | RAVAGER, assault walker |
| Rainforest Canopy | m157–m162 | Under the green roof | MANTIS, bio-machine |
| Mangrove Swamp | m163–m168 | Mud to the knees | BASILISK, swamp beast |
| Temple Ruins | m169–m174 | Stones that shoot back | SENTINEL, temple guardian |
| The Hive | m175–m180 | Into the nest | HIVE QUEEN, hive mother (finale) |

- Map 6 opens once m150 is cleared (`PREVIOUS[6] = 5`) and stays open once any of its missions is cleared (doc 74).
- The map picker gets a sixth chip; the map's sea is the jungle's dark green, its land the theaters' colours.
- The threat climbs afresh (the kit is new, like maps 3–5): difficulty `2 + (n − 151) × 1.35`; mission length as
  map 5's; reward from the map-1 formula, × the map's pay `MAP_SIX` (pay 10, ramp 3 %) — the money buys the ground
  base's buildings (doc 82).
- The BRUTE heavy walker is map 6's mini-boss (from the canopy on), the reinforcements add walkers and dropships late
  in each theater.
- The admiral opens the map (`adm.jungle`) and closes it (`adm.finale6`); the debrief's finale line, the globe's lock
  text and the campaign-complete banner have map-6 versions.
