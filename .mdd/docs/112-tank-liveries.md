---
id: 112-tank-liveries
title: Tank Liveries - Paint Jobs for the Tanks and Buggies, Earned Like the Jets', Worn Everywhere
edition: TopRun
depends_on: [100-fleet-liveries, 09-paint-jobs, 103-tank-kit]
relates: [100-fleet-liveries, 104-tank-drive]
source_files:
  - src/data/liveries.ts
  - src/render/fleet-looks.ts
  - src/render/tank-looks.ts
  - src/scenes/hangar-items.ts
  - src/i18n/liveries-de.ts
routes: []
models:
  - "SaveData.livery — unchanged: one LiveryId per PlaneId; the four tanks and buggies now get theirs"
test_files:
  - tests/unit/fleet-liveries.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [paint-jobs, liveries, camouflage, tanks, buggies, motor-pool, unlocks, map-7]
path: Game/Hangar/Tank Liveries
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.livery parsed from the untrusted profile store; the new ids must stay earned and fit the vehicle)
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-6
wave_status: complete
---

# 112 — Tank Liveries

Owner, 2026-11-14: *"… skin …"* The tanks and buggies get paint jobs like the helicopters, the subs and the spacecraft
(doc 100): earned by clearing map-7 missions, picked in the MOTOR POOL's PAINT tab, worn in the mission, the motor pool,
the ramp start and the celebration (`paintFleet` covers hull and turret / chassis).

## The paint jobs

Two per theater of map 7, for the tanks and buggies only (`liveryKit` = `tank`), ten in all:

| theater | region (theater opens) | 3★ reward |
|---|---|---|
| grass | Steppe Gold (tan with gold and olive blobs) | Grass Fire (black with orange and red flames, orange trim) |
| saltflats | Salt Crust (off-white with pale grey splinter) | Mirage (pale sky blue with white blobs, white trim) |
| badlands | Red Dust (rust and tan blobs) | Mesa Raider (dark brown with rust splinter, sand trim) |
| barrows | Barrow Moss (olive with dark green and brown blobs) | Rune Stone (stone grey with dark splinter, glowing green trim) |
| impact | Crater Ash (charcoal with violet-grey blobs) | Starfall (black-violet with magenta splinter, violet trim) |

Generic schemes, no insignia, no text. German names in `liveries-de.ts`.

## Where they show

- The MOTOR POOL gets the PAINT tab the helicopters and subs have (VEHICLES · WEAPONS · EQUIPMENT · PAINT); the mech bay
  keeps its hand-painted camo (doc 87) and no PAINT tab.
- The tank art already lays a look over hull and turret / chassis with `paintFleet` (top and side view), so a paint job
  shows in the mission, the motor pool, the ramp start (doc 109) and the celebration (doc 110) without more drawing.
- The looks live in `src/render/tank-looks.ts` (fleet-looks.ts would pass 100 lines and grows per world).

## Business Rules

- `liveryKit(id)` is `tank` for these (map 7's kit), so `liveriesFor('tank')` lists standard + ten, `liveryFits` keeps
  them off every other craft and theirs off the tanks, `parseLiveries` drops a tank paint job that is not earned.
- Unlocks: region = the theater has opened (`regionOpen`; Sea of Grass opens with map 7), stars = 3★ on all its missions.
- Debrief: "new paint" for these as for the others.

## Verification

Unit: `fleet-liveries.test.ts` (ten for the tanks, a region camo and a 3★ reward per theater, fit only the tanks, the
MOTOR POOL's PAINT tab). Browser: the PAINT tab in the motor pool with Steppe Gold applied to the Jackal; the Lynx in
Grass Fire in a drive mission.
