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
status: complete
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

## Balance (bot playtest, 2026-11-08)

`dev/playtest-mech.ts` builds the base and the kit a pilot owns at each mission (money down a building order, the lab
down a project order, alloy into the magazine and down a mech shopping list) and walks the invulnerable bot of
`dev/playtest.ts` through the mission (hulls of damage per minute / kill share / boss time, two runs each):

| | kit | first numbers | after the changes below |
|---|---|---|---|
| m151 | Strider, gun 1, pods | 0 / 1.00 | 0–0.09 / 1.00 |
| m156 RAVAGER | Strider, gun 4, pods, armour 2 | 0 / 1.00 / 10–12 s | 0.1–0.3 / 1.00 / 14–21 s |
| m160 | Ranger, gun 4, seekers, pods | 2.0 / 0.72–0.86 | — |
| m162 MANTIS | Ranger, gun 6, seekers, pods | 1.9–3.1 / 0.85–0.88 / 11 s | 2.4–2.5 / 0.80 / 18–20 s |
| m166 | Ranger, gun 7, mortar, seekers, pods | 2.9–3.0 / 0.66–0.70 | — |
| m168 BASILISK | Titan, gun 7, plasma, mortar, seekers, pods | 0.4–0.8 / 0.42–0.81 / 16–20 s | (core 3,800 → 4,600) |
| m174 SENTINEL | Titan, gun 10, plasma, mortar, seekers, pods | 1.5 / 0.18–0.23 / 21 s | (core 4,400 → 5,000) |
| m175 | Titan, gun 10, plasma, mortar, seekers, pods | 0.9–1.2 / 0.78–0.83 | — |
| m180 HIVE QUEEN | Titan, gun 10, rail, plasma, mortar, seekers | 2.5–2.7 / 0.33–0.43 / 27–29 s | 2.1–2.6 / 0.30–0.32 / 30–32 s |

- The changes: the gun drones aim (they fired straight down); the landing zone's patrols and the RAVAGER's escort
  bring hover tanks; the RAVAGER has 3,000 core (from 1,800) with a spread for its core gun and tougher, faster parts;
  the MANTIS 4,200 (from 3,200) with tougher parts, the BASILISK 4,600, the SENTINEL 5,000, the HIVE QUEEN 5,600, so
  each boss is tougher than the last and every fight lasts 15–30 s, the finale the longest.
- The Landing Zone stays the gentle start on purpose (the owner's *learn how your mech moves*): the bot shreds it with
  the rocket pods; from the canopy on, map 6 sits in the band of the other maps (1–3 hulls/min, bosses 20–30 s).
- The buying pilot's base: generator, refinery, factory and lab 1 by m155, the mech bay 2 and the Ranger by m160, every
  building at level 3 and the Titan by m168–m169; the lab invents the seekers by m160, the mortar by m163, the plasma lance
  by m169, the rail cannon by m178. Alloy runs short until the base is built and piles up only after m175.
