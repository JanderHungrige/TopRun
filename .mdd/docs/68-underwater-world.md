---
id: 68-underwater-world
title: Underwater World - The Reef Backdrop With Light Rays, Fish and Bubbles; Six Sea Enemies and the BARRACUDA
edition: TopRun
depends_on: [65-fifth-map, 05-mission-combat, 56-fourth-map]
relates: [65-fifth-map, 67-sub-flight, 56-fourth-map]
source_files:
  - src/data/types.ts
  - src/data/enemies.ts
  - src/data/theaters.ts
  - src/render/draw-terrain.ts
  - src/render/terrain-art.ts
  - src/render/sea-floor.ts
  - src/render/particles.ts
  - src/render/draw-enemies.ts
  - src/render/enemies/sea.ts
  - src/render/enemies/creatures.ts
  - src/render/bosses-5.ts
  - src/render/bosses-later.ts
  - src/render/carrier/sky-sea.ts
  - src/render/minigames/evasion-world.ts
  - src/render/photos/props.ts
  - src/scenes/mission/world.ts
  - src/i18n/content-de.ts
routes: []
models: []
test_files:
  - tests/unit/missions-5.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [underwater, reef, bubbles, light-rays, fish, coral, sea-enemies, creatures, barracuda, art]
path: Game/Mission/Underwater World
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Wave 1 draws the reef only; the kelp forest, wreck field, trench and abyss looks and their enemies come in wave 2."
security_read_sites: []
sister_projects: []
---

# 68 — Underwater World

## Purpose

Wave 1 of Deep Water. Owner: *"With bubbles and appropriate weapons and enemies."* Question round: **military plus
sea monsters.** The water must read as water at a glance: light from above, things floating, bubbles everywhere.

## The reef backdrop (terrain `reef`)

Drawn in code like the other terrains, scrolling with the mission:

- **Water:** a vertical blue-green gradient that darkens toward the bottom of the screen.
- **Seabed** (the ground layer, scrolling): pale sand with ripples, coral heads in pinks, oranges and purples, brain
  coral domes, fan corals, dark rock outcrops, sea grass tufts and kelp strands that sway; patches of deeper blue
  where the reef drops away.
- **Light rays:** four or five broad, slanted, faint beams from the top that slowly sway and breathe.
- **Caustics:** a faint moving net of brighter lines over the sand.
- **Coral density:** up to two coral clusters, a rock and a kelp patch per 80 px row, and now and then a deep drop-off.
- **Fish:** small schools of bright reef fish cross the screen now and then, turning together (scenery, not
  targets).
- **Bubbles:** strings of small bubbles rise from vents in the seabed and wobble upward (up the screen, against the
  scroll).
- **The water over the seabed:** a turquoise-to-deep-blue wash over the sand (stronger toward the bottom of the
  screen), so the floor reads as seen through water, not as a beach; over everything only a faint tint and a dark
  vignette at the edges, so the craft and enemies stay crisp.

## Smoke becomes bubbles

On map 5 explosions, trails and damage smoke are bubbles: the particle system's smoke is drawn as hollow circles
with a highlight that rise and wobble instead of grey puffs; fire is shorter and cooler (`underwater` flag on the
particle world, set from the terrain). The enemy `missile` is drawn as a torpedo with a bubble trail.

## Sea enemies (`'air'` = in the water, `'ground'` = on the seabed)

| kind | name | layer | HP | speed | weapon | behaviour | look |
|---|---|---|---|---|---|---|---|
| minisub | Midget Sub | air | 60 | 150 | aimed (dart), 1.8 s | sine, swoop | stubby dark sub, small sail, glowing bow light |
| seadrone | Sea Drone | air | 12 | 130 | — | kamikaze, sine | yellow torpedo-shaped drone with a little screw |
| seamine | Sea Mine | air | 32 | 40 | — (contact) | straight | black ball with spikes on a broken chain, a red blink |
| seaturret | Seabed Turret | ground | 70 | 0 | flak (depth burst), 2.4 s | ground | armoured dome on a rock base, twin barrels |
| jelly | Jellyfish | air | 30 | 50 | — (contact sting) | sine | translucent pink bell pulsing, trailing tentacles |
| eel | Electric Eel | air | 45 | 210 | single (spark), 2.0 s | sine, swoop | long green-brown body that wriggles, crackling blue at the head |

- Bounties as their map-4 counterparts (raider 50, drone 15, satgun 50); jelly 25, eel 40, mine 20.
- The drone and the mine were softened by the playtest (doc 65): 14 → 12 HP and 160 → 130 px/s, 40 → 32 HP.
- Creatures do not explode: they burst into bubbles and a puff of ink / sparks.

## BARRACUDA (boss of the Coral Reef)

A long, sleek hunter-killer sub seen from above — dark blue-black hull, pointed bow, sail with hydroplanes, a cross
of stern planes, a glowing screw wash and a trail of bubbles. Parts: two bow torpedo tubes (enemy missiles), the sail
gun (spread3), the stern mine rack (flak); the core is the hull. Numbers in doc 65.

## Business Rules

- `TerrainStyle` gains `'reef'`; `EnemyKind` gains `minisub`, `seadrone`, `seamine`, `seaturret`, `jelly`, `eel`;
  `BossId` gains `barracuda`.
- Art: `src/render/enemies/sea.ts` (the machines), `src/render/enemies/creatures.ts` (jelly, eel),
  `src/render/bosses-5.ts` (BARRACUDA), the seabed and water in `src/render/sea-floor.ts`.
- Enemy names in the German content table (`content-de.ts`): Kleinst-U-Boot, Seedrohne, Seemine, Meeresboden-Geschütz,
  Qualle, Zitteraal.
