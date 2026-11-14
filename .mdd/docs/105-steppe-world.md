---
id: 105-steppe-world
title: Steppe World - The Floors of Kharsa, the Invasion Army, the Five Bosses
edition: TopRun
depends_on: [102-seventh-map, 81-jungle-world, 96-alien-jungle-enemies]
relates: [102-seventh-map, 104-tank-drive, 106-tower-defence]
source_files:
  - src/data/enemies-7.ts
  - src/data/enemies.ts
  - src/data/bosses-7.ts
  - src/data/bosses.ts
  - src/data/theaters.ts
  - src/game/steppe-army.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/weapons-fire.ts
  - src/render/enemies/steppe-army.ts
  - src/render/enemies/steppe-machines.ts
  - src/render/enemies/steppe-air.ts
  - src/render/draw-enemies.ts
  - src/render/bosses-7.ts
  - src/render/bosses-later.ts
  - src/render/steppe-floor.ts
  - src/render/steppe-features.ts
  - src/render/steppe-wind.ts
  - src/render/terrain-art.ts
  - src/render/draw-terrain.ts
  - src/render/carrier/sky-sea.ts
  - src/render/photos/props.ts
  - dev/art-steppe.ts
routes: []
models: []
test_files:
  - tests/unit/steppe-world.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [steppe, terrain, grass, salt, badlands, barrows, crater, aliens, invasion, enemies, tripod, bosses, art, map-7]
path: Game/Mission/Steppe World
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-1
wave_status: complete
---

# 105 — Steppe World

## Purpose

*"Die neue welt ist eine steppenwelt mit aliens."* The owner chose an **invasion army** (question round): columns of
alien soldiers and war beasts marching over the steppe, tripods with heat rays, flying discs; colossi and motherships
as bosses. Everything is drawn in code like every other enemy (animated, the hit flash, the shadow, the wreck).

## The floors

One terrain per theater (`TerrainKind`), drawn in code over the theater's palette:

| theater | terrain | the floor |
|---|---|---|
| Sea of Grass | `grass` | golden grass in long wind waves (bands of light and shade rolling across), darker tussocks, grey rocks, a dirt track, the bleached bones of a giant beast now and then, black alien scorch marks |
| Salt Flats | `salt` | a white crust cracked into polygons, pale blue pools, heat shimmer bands |
| Red Badlands | `badlands` | red earth, flat-topped mesas with shadowed cliffs, dry gullies, scrub |
| Barrow Fields | `barrows` | short olive grass, round burial mounds, rings of standing stones, drifting dust |
| The Crater | `impact` | black glassy ground, glowing violet conduits, alien pylons, wreck plates |

Wave 1 builds the Sea of Grass; the others draw as grass until wave 4. Dust drifts over every steppe floor.

## The invasion army

`layer` as on the jungle: 'ground' is everything that marches, crawls or stands (the GROUND key's grenades), 'air'
what flies. Bounty and radius follow the jungle enemies of the same size.

| kind | name (DE) | layer | hp | speed | weapon (period) | behaviour | wave |
|---|---|---|---|---|---|---|---|
| crawler | Crawler (Krabbler) | ground | 30 | 70 | none | six-legged soldier-bug; comes in columns; rams | 1 |
| trooper | Alien Trooper (Alien-Soldat) | ground | 45 | 40 | aimed 2.2 | a tall biped with a plasma rifle | 1 |
| rider | Beast Rider (Bestienreiter) | ground | 110 | 120 | aimed 2.6 | an alien on a six-legged steppe beast; charges | 1 |
| landingpod | Landing Pod (Landekapsel) | ground | 160 | 0 | — | a pod stuck in the ground; lets out a trooper every 6 s | 1 |
| scoutdisc | Scout Disc (Späherscheibe) | air | 24 | 200 | single 2.0 | a small saucer, sine and swoop | 1 |
| discfighter | Disc Fighter (Diskusjäger) | air | 60 | 190 | aimed 1.8 | a saucer fighter, swoop and strafe | 1 |
| tripod | Tripod (Dreibein) | ground | 260, armour 0.7 | 30 | ray 2.6 | a tall walker; its heat ray is a stream of six bolts | 4 |
| siegebug | Siege Crawler (Belagerungskäfer) | ground | 300, armour 0.5 | 18 | flak 4.2 | an armoured beetle with a lobbing tube | 4 |
| shieldbearer | Shield Bearer (Schildträger) | ground | 150 | 35 | aimed 2.8 | its shield halves the damage to others within 90 px | 4 |
| broodcarrier | Brood Carrier (Brutträger) | ground | 220 | 25 | single 3.0 | lets 4 crawlers loose when killed | 4 |
| plasmagun | Plasma Cannon (Plasmageschütz) | ground | 120 | 0 | aimed 2.6, spread3 6.0 | a dug-in gun | 4 |
| manta | Bomber Manta (Bombenrochen) | air | 120 | 70 | flak 3.2 | a bio-machine ray; drops bombs, comes alone | 4 |
| wartripod | War Tripod (Kriegsdreibein) | ground | 2,600 | 15 | ray 2.0, missile 4.0 | map 7's mini-boss | 4 |

The disc fighter, siege crawler, plasma cannon and manta were softened after the first map-7 playtest: the Red Badlands'
drives cost a buggy 7 hulls a minute (doc 102, Balance).

- **`ray`** — a new enemy weapon: six fast thin bolts, one every 0.07 s, aimed where the target was when it began.
- **Spawners** — `EnemyDef.spawn`: an enemy that lets out others (`{ kind, every }` while alive, the landing pod; or
  `{ kind, count }` when it dies, the brood carrier). Not after the nuke.
- **Shield** — `EnemyDef.shield`: others within its reach take half the damage while it lives.

## The bosses

| boss | theater | title | core | parts | escort |
|---|---|---|---|---|---|
| HARVESTER | Sea of Grass | Reaper Machine | 3,000 | two reaper drums (spread3), the chimney (missile), the dome (aimed) | crawlers |
| LONGSHANKS | Salt Flats | Giant Tripod | 4,200 | two heat rays (ray), the pod (missile), the eye (spread3) | troopers |
| JUGGERNAUT | Red Badlands | Siege Beast | 4,600 | the tusks (spread3), the howdah gun (flak), two riders (aimed), the tail (missile) | riders |
| DREADNOUGHT | Barrow Fields | Siege Ship | 5,000 | two turrets (aimed), the bomb bay (flak), the rack (missile) | disc fighters |
| MOTHERSHIP | the Crater | Invasion Heart | 5,600 | four emitters round the rim (ray, aimed), the core beam (spread3), the hangar (missile) | scout discs |

Wave 1 builds the HARVESTER: a wide reaping machine on six squat legs, two spinning drums of blades at its front
mowing the grass into a cloud of chaff, a smoking chimney and a glass dome with a pilot's shape inside.

## Business Rules

- `EnemyKind` gains the thirteen kinds; `ENEMIES_7` in `src/data/enemies-7.ts`; art in `src/render/enemies-7*.ts`.
- `BossId` gains `harvester`, `longshanks`, `juggernaut`, `dreadnought`, `mothership`; `BOSSES_7` in
  `src/data/bosses-7.ts`; art in `src/render/bosses-7*.ts`.
- `TerrainKind` gains `grass`, `salt`, `badlands`, `barrows`, `impact`.
