---
id: 108-tank-arsenal
title: Tank Arsenal - The Turret Cannon's Upgrades and Ammo, the Five Invented Tank Weapons in the Mission
edition: TopRun
depends_on: [103-tank-kit, 107-steppe-lab, 99-heli-arsenal, 101-sub-arsenal]
relates: [103-tank-kit, 104-tank-drive, 107-steppe-lab]
source_files:
  - src/data/tank-arms.ts
  - src/game/tank-arms.ts
  - src/game/gear.ts
  - src/game/loadout.ts
  - src/game/challenge.ts
  - src/data/types.ts
  - src/data/weapons.ts
  - src/data/weapons-fleet.ts
  - src/scenes/mission/tank-weapons.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/tank-mission.ts
  - src/scenes/mission/world.ts
  - src/render/tanks/tank-fx.ts
  - src/scenes/hangar-gear.ts
  - src/scenes/hangar-mech.ts
  - src/scenes/hangar-items.ts
  - src/render/icons.ts
  - src/render/items.ts
  - src/i18n/content-de-steppe.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
routes: []
models:
  - "SaveData.tankArms: { autoloader, stabiliser, coaxmg, apds, hefrag, thermite, loaded } — the tanks' gear (new, missing = fresh)"
test_files:
  - tests/unit/tank-arsenal.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [tanks, arsenal, autoloader, stabiliser, coax, apds, he-frag, thermite, aa-rockets, atgm, mines, flamethrower, tesla, motor-pool, map-7]
path: Game/Hangar/Tank Arsenal
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (the tanks' gear parsed from the untrusted profile store / cloud save)
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-3
wave_status: complete
---

# 108 — Tank Arsenal

## Purpose

The owner asked for an **arsenal** in the new world (2026-11-14). Like the helicopters' and the subs' (docs 99, 101), the
MOTOR POOL sells the turret cannon's **upgrades** and **ammo types** for money; the **weapons** are the steppe lab's
inventions (doc 107) and arrive in the motor pool when invented.

## Gun upgrades (money, `gear.ts` kit `tank`)

| upgrade | id | levels | effect | prices |
|---|---|---|---|---|
| Autoloader | `autoloader` | 3 | the cannon fires × 1.15 / 1.3 / 1.45 (the Gatling Drive's mechanics, spin-up 0.2 s) | $250,000 / $550,000 / $950,000 |
| Gun Stabiliser | `stabiliser` | 3 | the rounds turn up to 12° / 20° / 28° more toward the nearest target ahead (a buggy gets a swivel, a tank's turret reaches further) | $180,000 / $400,000 / $700,000 |
| Coax MG | `coaxmg` | 3 | a coaxial machine gun fires at the nearest enemy within 220 / 270 / 320 px for 6 / 10 / 14 (the door guns' mechanics) | $160,000 / $360,000 / $620,000 |

## Ammo types (money; one loaded per sortie, LOAD on E — doc 45's rule)

| ammo | id | levels | effect | look |
|---|---|---|---|---|
| APDS | `apds` | 3 | a round passes through 1 / 2 / 3 more enemies, keeping half its hit each time | the cavitation tracer |
| HE-Frag | `hefrag` | 3 | 30 / 40 / 50 % of a hit bursts onto others within 36 / 42 / 48 px | the HEDP tracer |
| Thermite | `thermite` | 3 | 25 / 35 / 45 % of a hit burns on — on the ground too | the incendiary tracer |

Each level $150,000 / $400,000 / $750,000.

## The invented weapons

| weapon | id | key | rack | does |
|---|---|---|---|---|
| Grenade Launcher | `grenade` | GROUND | 6 | (doc 103) lobs a grenade ahead, 90 over 60 px |
| AA Rockets | `aarocket` | AIR | 4 | a homing rocket at anything flying, 70 |
| ATGM | `atgm` | GROUND | 3 | a guided missile at the nearest ground target, 220 |
| Mine Layer | `mines` | GROUND | 4 | drops a mine where the vehicle is; it lies on the ground and blows when a ground unit comes within 30 px: 140 over 60 px (lay them on a defence's lanes) |
| Flamethrower | `flamer` | GROUND | 3 (energy, 3 s) | a cone of fire ahead, 140 px long and 50° wide: 60 to everything in it and a burn |
| Tesla Coil | `tesla` | AIR | 3 (energy, 4 s) | a bolt at the nearest enemy ahead jumping to 3 more within 80 px: 70 each |

- Marks Mk II / III from the lab (+25 % damage and +1 a rack each, doc 43's rule); none on sale.
- New weapon behaviours: `mine`, `flame`, `chain`; their hangar lines say how they work.

## Business Rules

- Pure: `freshTankArms`, `parseTankArms`, `tankArmsStats(id, arms)` (`src/game/tank-arms.ts`), the tables in
  `src/data/tank-arms.ts`; the gear layer knows a third kit (`gearKit` 'tank', map 7).
- The kit score (doc 38) counts the tanks' gear as it counts the others'.
