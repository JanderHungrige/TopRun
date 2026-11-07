---
id: 54-spacecraft
title: Spacecraft - One Ship Built From Modules on a Grid; Shape Is the Hitbox, Lasers Fire From Where They Sit
edition: TopRun
depends_on: [49-helicopter-kit, 05-mission-combat, 02-hangar-economy]
relates: [55-shipyard, 56-fourth-map, 49-helicopter-kit]
source_files:
  - src/data/ship-modules.ts
  - src/game/ship.ts
  - src/game/kit.ts
  - src/game/save.ts
  - src/game/loadout.ts
  - src/data/types.ts
  - src/data/planes.ts
  - src/game/ship-loadout.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/mission-render.ts
  - src/render/ship.ts
test_files:
  - tests/unit/ship.test.ts
routes: []
models:
  - "SaveData.ship: { modules: Placed[], stock: Record<ModuleId, number>, laserLevel } — the spacecraft (new, missing = the starter ship)"
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [spacecraft, modules, grid, builder, hitbox, lasers, shields, map-4, space]
path: Game/Hangar/Spacecraft
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (the ship's layout parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 54 — Spacecraft

## Purpose

Wave 5 of New Frontiers. Owner, 2026-11-06: *"Maybe lets go to space for the forth one? This resets all aircraft
loadouts for this stage, change the weapon types. just have one spacecraft, which can be expanded by modules and
thereby also changes the form. Add a new front capsule for example. Add a wing for rockets,... so just one that
evolves. Let the user attach elemets himselve. Use a Grid thing where he can place it on the spacecraft."* — and in the
question round: **the shape is the hitbox**, mass slows the ship.

## The grid

The ship is a grid of **7 columns × 9 rows**, nose up. The **core** (cockpit and a small reactor) sits fixed at column
3, row 5 (counting from 0, top-left). A new ship comes with the **starter layout**: a laser on each side of the core
and an engine behind it (three barrels, 98 hull, speed 290) — the bare core alone was far too weak for map 4's first
sortie (bot playtest, see doc 56). Further modules are bought into **stock** (doc 55) and placed or taken off freely in
the shipyard; a placed module — the starter's too — returns to stock when taken off.

## The modules

| module | mass | power | hull | what it does | placement |
|---|---|---|---|---|---|
| Core | 4 | +4 | 80 | cockpit, thrust 2, one built-in laser | fixed |
| Capsule | 3 | 0 | +40 | armoured nose: +40 hull, the radar (doc 02's early warning) | at most one; nothing in front of it |
| Armour plate | 3 | 0 | +25 | hull | anywhere |
| Engine | 2 | −1 | +6 | thrust 3 | nothing behind it (the exhaust needs room) |
| Laser | 2 | −1 | +6 | one more barrel, firing from its cell | nothing in front of it |
| Rocket wing | 2 | 0 | +6 | a station with 6 space rockets (homing, any target) | an open side (left or right) |
| Shield | 2 | −2 | +6 | +25 shield points (soak damage first, regrow 6 /s after 2 s without a hit) | anywhere |
| Reactor | 3 | +4 | +10 | power for more modules | anywhere |

- **Connected:** every module must touch the core through a chain of side-by-side modules.
- **Power:** the modules' draw may not exceed the supply (core 4 + 4 per reactor).
- The shipyard only lets valid layouts be made (doc 55); a stored layout that breaks a rule (a forged save) is
  trimmed back to its valid part on load.

## What the layout makes

- **Hull** = the sum of the modules' hull; **shield** = 25 per shield module.
- **Speed** = 160 + 260 × thrust ÷ mass, at most 420 (core alone and the starter ship: 290; heavy ships are slow).
- **Hitbox** = the occupied cells: 13 px each in the mission (the core's centre at the ship's position). A bullet hits
  if it touches any cell — a bigger ship is a bigger target (owner's choice).
- **Guns:** every laser (the core's own included) is a barrel at its cell's x, all firing together at the laser
  level's rate and damage (`laserLevel` 1–10, bought in the shipyard).
- **Stations:** every rocket wing is one secondary station (space rockets, doc 55).

## The kit

The ship is the third kit (doc 49): `kitOf(4)` = `'ship'`, a `PlaneId` `starship` of kind `ship` (one ship, never
bought), its own `SaveData.ship`; the jets' and helicopters' kits stay untouched, the wallet is shared.

## Business Rules

- Pure in `src/game/ship.ts`: `STARTER`, `freshShip`, `canPlace` (`no-stock` / `occupied` / `invalid`), `place`,
  `remove` (refused when the rest would fall apart), `shipStats`, `isValidLayout`, `trimLayout`, `powerBalance`,
  `parseShip`; module table, grid, shield and laser-level tables in `src/data/ship-modules.ts`.
- In the mission (`src/scenes/mission/player.ts`, `src/game/ship-loadout.ts`): the player's `touches()` tests the
  cells, `damage()` soaks the shield first, the shield regrows after `SHIELD.delay` quiet seconds; every barrel fires a
  laser bolt (`Bullet.laser`) at the laser level's rate and damage. Drawn from its modules by `src/render/ship.ts`.

## Save

`SaveData.ship` — parsed by `parseShip`: unknown modules dropped, the layout trimmed to its valid part in stored order,
stock clamped 0–40, `laserLevel` 1–10; a save without it gets the starter ship. The admin pilot's view (doc 47) never
changes it.
