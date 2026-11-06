---
id: 50-helicopter-flight
title: Helicopter Flight - The Apache in the Mission, Rotor Art, Drift, Longbow Salvo
edition: TopRun
depends_on: [49-helicopter-kit, 05-mission-combat, 36-new-jets]
relates: [49-helicopter-kit, 48-third-map]
source_files:
  - src/game/jets.ts
  - src/game/heli-flight.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/cockpit-view.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/helis/ah64-top.ts
  - src/render/helis/ah64-side.ts
  - src/render/helis/rotor.ts
routes: []
models: []
test_files:
  - tests/unit/heli-flight.test.ts
data_flow: reads-existing
last_synced: 2026-11-06
status: in_progress
phase: all
mdd_version: 11
tags: [helicopters, apache, flight-model, rotor, longbow, hellfire, mission, cockpit]
path: Game/Mission/Helicopter Flight
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 50 — Helicopter Flight

## Purpose

Wave 2 of New Frontiers: the Apache must feel like a helicopter in the top-down mission, not a slow jet.

## Flying

- **Slower world:** on map 3 the ground scrolls at 75 % of the jets' speed (`HELI_FLIGHT.scroll`), the war is fought
  low and slow.
- **Drift:** a helicopter accelerates and stops with inertia instead of moving at once: its velocity eases toward the
  stick at `HELI_FLIGHT.accel` per second (`heliVelocity`, pure). Sideways it is as quick as a jet; it banks into the
  turn (the rotor disc tilts) and noses down when it speeds up.
- Same playfield, hit radius and hull rules as the jets.

## Weapons

- The M230 chain gun fires from the chin turret with the helicopter's gun table (doc 49) and hits ground and sea
  targets at full damage.
- Hydra pods and Hellfires use the shared rocket-fan and homing-missile behaviours (doc 05).
- **E — Longbow Salvo** (cooldown 14 s): the Longbow radar locks up to **four** ground or sea targets on screen —
  nearest first — and a Hellfire leaves the rails for each, without using the Hellfires on the stations (the mark of
  mounted Hellfires counts, else Mk I). No targets: the `denied` sound, and the special stays charged.

## Look and sound

- Top-down art in code (`src/render/helis/`): the Apache's narrow fuselage, stub wings with the stations, tail boom
  and tail rotor, and the main rotor as a translucent spinning disc with four blurred blades; banking tilts the disc.
  A side view for the debrief, from the real dimensions (doc 04 style: 17.7 m long, rotor 14.6 m).
- **Cockpit:** the plane name and E name are the helicopter's; the silhouette is the Apache's (without the rotor).
- Until the deck liftoff (wave 4) a map-3 LAUNCH goes straight into the mission (`createScene`, takeoff `skipped`).

## Business Rules

- Pure: `heliVelocity` and `HELI_FLIGHT` (`src/game/heli-flight.ts`), `longbowTargets` (nearest ground/sea targets,
  up to four), `specialRules('longbow')` (`src/game/jets.ts`).
