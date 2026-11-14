---
id: 103-tank-kit
title: Tank Kit - Tanks and Buggies as the Fourth Fleet Kit, the MOTOR POOL, the Turret Cannon
edition: TopRun
depends_on: [102-seventh-map, 66-sub-kit, 79-mech-kit, 02-hangar-economy]
relates: [102-seventh-map, 104-tank-drive, 107-steppe-lab, 108-tank-arsenal]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/tank-kit.ts
  - src/data/fleet.ts
  - src/data/weapons-fleet.ts
  - src/data/weapons.ts
  - src/game/kit.ts
  - src/game/save.ts
  - src/game/firepower.ts
  - src/game/arsenal.ts
  - src/game/steppe-lab.ts
  - src/game/tank-arms.ts
  - src/game/loadout.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-mech.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/hangar-chief.ts
  - src/render/items.ts
  - src/render/icons.ts
  - src/i18n/content-de-steppe.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
routes: []
models:
  - "SaveData.tank: { selectedPlane, gunLevel, equipment } — the tank kit (new, missing = fresh)"
  - "SaveData.kit: 'jet' | 'heli' | 'ship' | 'sub' | 'mech' | 'tank' (runtime only)"
test_files:
  - tests/unit/tank-kit.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [tanks, buggies, kit, hangar, motor-pool, turret-cannon, grenade-launcher, equipment, map-7, economy]
path: Game/Hangar/Tank Kit
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (tank kit parsed from the untrusted profile store / cloud save)
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-1
wave_status: complete
---

# 103 — Tank Kit

## Purpose

The owner chose **tracked tanks and combat buggies** for the steppe (question round, 2026-11-14). They are the fourth
fleet kit beside the helicopters, the subs and the mechs (docs 49, 66, 79): a few vehicles to buy, one gun table, their
own weapons, the seven equipment items at their own prices. Like the helicopters and subs — not like the mechs — the
tank kit is bought with **money**; only the weapons and their marks are invented in the steppe lab (doc 107).

## The fourth fleet kit

`FLEET.tank` (kit `tank`, map 7, the Jackal free, price factor `TANK_PRICE` 8 — set by the playtest, doc 102 — the turret cannon). Vehicles are
`PlaneId`s of kind `tank` (`TANK_IDS`); jet-only places read one as the F-16 (`asJet`). `kitOf(7)` = `'tank'`;
`kitView` swaps in `save.tank` exactly as it swaps in `save.sub`; `fromKitView` writes it back.

| | id | kind | hull | speed | stations | gun × | E | price |
|---|---|---|---|---|---|---|---|---|
| Jackal | `jackal` | buggy | 120 | 300 | 2 | 1.0 | **Nitro**: a 1.2 s burst at double speed that rams through what it touches | free |
| Lynx | `lynx` | light tank | 200 | 235 | 3 | 1.15 | **Sentry Drop**: leaves an auto-turret firing for 12 s | $1,600,000 |
| Viper | `viper` | rocket buggy | 140 | 285 | 3 | 1.1 | **Rocket Salvo**: a rocket at each target in sight | $2,600,000 |
| Bison | `bison` | heavy tank | 340 | 170 | 4 | 1.3 | **Main Gun**: one heavy shell that bursts on the first thing it hits | $4,200,000 |

- Descriptions: the Jackal "Open combat buggy with a roll cage and a pintle gun. Fast, light, a nitro burst rams through
  anything small." · the Lynx "Light tank on wide tracks. Its turret follows the target; the sentry drop leaves a gun
  behind." · the Viper "Long-wheelbase buggy with a rocket rack over the rear axle. The salvo finds everything in
  sight." · the Bison "Heavy tank, slow and nearly unstoppable. Its main gun fires one shell that cracks a tripod."
- **Turret:** the tanks (Lynx, Bison) swivel their turret — the turret cannon's rounds turn up to 25° toward the
  nearest target ahead (doc 99's turret aim); the buggies fire straight ahead.

## The MOTOR POOL (map 7)

Opened from map 7 (LOADOUT): the hangar with the tabs **VEHICLES · WEAPONS · EQUIPMENT**; the title reads MOTOR POOL.

- **VEHICLES:** the four on sale once map 7 is open; the Jackal owned from the start.
- **WEAPONS:**
  - **Turret Cannon** — levels 1–10 (`TANK_GUN_LEVELS`, `src/data/tank-kit.ts`): 20 mm rounds at the chain gun's rate
    and damage, prices the jets' × `TANK_PRICE`; hits ground targets at **full** damage (the steppe is all ground).
  - **Grenade Launcher** (`grenade`, GROUND key): lobs a grenade ahead that bursts on the ground; 6 a station, 90
    damage, radius 60. Known from the start (price 0, Mk I); its marks and every other tank weapon are invented in the
    lab (doc 107) — the hangar shows one not yet invented as *invented in the lab*.
- **EQUIPMENT:** the seven items up to the map-1 caps, at tank prices (flares read as smoke dischargers, radar as the
  sensor mast in the text).
- Tank goods never show in the other hangars and other goods never show in the MOTOR POOL; tank weapons mount only on
  tanks and buggies.
- The crew chief greets the MOTOR POOL with his own lines (`chief.helloTanks`).

## Business Rules

- Pure: `kitOf`, `kitView`, `fromKitView`, `freshFleetKit`, `parseFleetKit` (`src/game/kit.ts`) gain the tank kit;
  `FLEET.tank`, `isFleet('tank')`; `TANK_PRICE`, `TANK_GUN_LEVELS`, `tankGunDef` (`src/data/tank-kit.ts`).
- `tank.selectedPlane` is always a tank or buggy (`parseSave` repairs it).

## Save

`tank` (missing → fresh kit: the Jackal, turret cannon level 1, no equipment; levels clamped; an unknown or non-tank
`selectedPlane` → the Jackal). `ownedPlanes` may now hold the four vehicles; `ownedSecondaries` / `weaponLevels` may
hold `grenade`. Older builds drop unknown ids and ignore `tank`: the usual one-way upgrade.
