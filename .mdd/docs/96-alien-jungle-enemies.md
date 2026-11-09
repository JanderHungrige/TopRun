---
id: 96-alien-jungle-enemies
title: Alien Jungle Enemies - Twelve Alien Creatures and Plants for the Jungle Planet, the Spore Ring, the Death Burst
edition: TopRun
depends_on: [81-jungle-world, 78-sixth-map]
relates: [81-jungle-world]
source_files:
  - src/data/types.ts
  - src/data/enemies.ts
  - src/data/missions-6.ts
  - src/game/waves.ts
  - src/game/spores.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/projectiles.ts
  - src/render/draw-enemies.ts
  - src/render/enemies/alien-ground.ts
  - src/render/enemies/alien-air.ts
  - src/i18n/content-de.ts
test_files:
  - tests/unit/alien-enemies.test.ts
  - tests/unit/missions-6.test.ts
routes: []
models: []
data_flow: reads-existing
last_synced: 2026-11-09
status: complete
phase: all
mdd_version: 11
tags: [jungle, enemies, creatures, alien, weapons, waves, art, map-6]
path: Game/Mission/Jungle World
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 96 — Alien Jungle Enemies

## Purpose

Owner, 2026-11-08: *"How about the jungle enemies? We are on an alien planet. Draw lots of them, busily."* Map 6 has ten
enemies (doc 81), half of them machines. This adds **twelve alien creatures and plants**, drawn in code like every other
enemy (animated, with the hit flash, the shadow and the wreck), each tied to the theater it lives in, so the jungle planet
feels alien.

## The twelve

`layer` as in doc 81: 'ground' is the rooted and the heavy (the GROUND key's mortar), 'air' anything that flies or runs
freely (the AIR key's seekers).

| kind | name (DE) | layer | hp | speed | weapon (period) | behaviour | lives in |
|---|---|---|---|---|---|---|---|
| sporepod | Spore Pod (Sporenkapsel) | ground | 60 | 0 | ring 3.2 | rooted, pulses, bursts a ring of 8 spores | clearing, canopy, hive |
| lasher | Lasher Vine (Peitschenranke) | ground | 90 | 0 | aimed 1.6, spread3 4.0 | rooted tentacle plant flinging thorns | canopy |
| rhino | Rhino Crawler (Panzernashorn) | ground | 200, armour 0.5 | 90 | aimed 2.4 | charges down the screen | clearing, ruins |
| toad | Acid Toad (Säurekröte) | ground | 80 | 20 | flak 2.2 | hops; its acid bursts where you were | swamp |
| spire | Brood Spire (Brutturm) | ground | 150 | 0 | missile 5.5, aimed 2.6 | its larvae home in like missiles | hive |
| totem | Crystal Totem (Kristalltotem) | ground | 130, armour 0.7 | 0 | ring 1.4 | its ring turns with time: a spiral | ruins |
| lurker | Swamp Lurker (Sumpflauerer) | ground | 100 | 10 | spread3 2.8 | eyes over the water, rises to fire | swamp |
| glider | Glider Ray (Gleitrochen) | air | 50 | 120 | aimed 2.2 | sine, swoop | canopy, ruins |
| leatherwing | Leatherwing (Lederschwinge) | air | 35 | 230 | none | dive, kamikaze | clearing, canopy, ruins |
| dragonfly | Giant Dragonfly (Riesenlibelle) | air | 26 | 260 | aimed 1.4 | swoop, sine | clearing, swamp |
| balloon | Spore Balloon (Sporenballon) | air | 45 | 50 | single 1.8 | drifts down alone; bursts 10 spores when killed | canopy, hive |
| skyjelly | Sky Jelly (Himmelsqualle) | air | 70 | 60 | none | drifts alone on a sine; stings on contact | swamp, hive |

Radius and bounty follow the existing jungle enemies of the same size (the doc's table in `src/data/enemies.ts`).

## Mechanics

- **`ring`** — a new enemy weapon: 8 spores evenly round the source, slower and weaker than a bullet (speed 150, damage
  6). Their headings are turned by the source's age (`ringHeadings(n, turn)`, pure, `src/game/spores.ts`), so a rooted
  ring-shooter firing again and again draws a spiral — the totem's pattern.
- **Death burst** — `EnemyDef.burst`: a creature that bursts when killed throws that many spores round itself (the
  balloon: 10). Not after the nuke (it clears the screen, a burst after it would be unfair).
- Everything else reuses what is there: the rhino charges by its speed (ground units drift down at scroll + 0.4 × speed),
  the leatherwing dives and rams, the jelly and the balloon are big and slow and come alone (`SOLO_AIR` in the waves).

## Waves

The new kinds join the map-6 mission pools of their theaters (`src/data/missions-6.ts`): the landing zone the rhino, the
dragonfly, the leatherwing and the spore pod; the canopy the lasher, the glider, the balloon; the swamp the toad, the
lurker, the sky jelly; the ruins the totem, the glider, the rhino; the hive the brood spire, the balloon, the spore pod and
the sky jelly. Strike objectives stay as they are. No other map uses them. (Doc 78's pool test now accepts them
alongside the ten machines and creatures of doc 81.)

## Art

In code, heads down (+y), drawn by `src/render/enemies/alien-ground.ts` and `alien-air.ts` with their own palettes:
glossy chitin, pulsing sacs, glowing eyes, wet skin — more detail than doc 81's creatures, every one animated (the pod
breathing, the vine lashing, the rhino's legs, the toad's throat, the spire's vents, the totem's crystal, the lurker's
eyes, the ray's wings, the leatherwing's flaps, the dragonfly's four wings, the balloon's sacs, the jelly's tentacles).
Flash and shadow keep the outline (`p.mono`). Wrecks as for every ground unit (burnt) and air unit (scorch). In the
game they draw at the size of their radius, like doc 81's beetle and wasp; `dev/art-enemies.html` shows them big.

## Names

EN in `ENEMIES` (singular) and `ENEMIES_EN_PLURAL`, DE in `ENEMIES_DE` (singular, plural).

## Known Issues

(none)
