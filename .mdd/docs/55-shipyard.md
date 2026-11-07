---
id: 55-shipyard
title: Shipyard - Map 4's Hangar; Buy Modules Into Stock, Place Them on the Ship's Grid, Laser Power 1–10
edition: TopRun
depends_on: [54-spacecraft, 02-hangar-economy, 49-helicopter-kit]
relates: [54-spacecraft, 56-fourth-map, 02-hangar-economy]
source_files:
  - src/game/ship-shop.ts
  - src/game/ship-loadout.ts
  - src/data/ship-modules.ts
  - src/data/weapons.ts
  - src/scenes/shipyard.ts
  - src/scenes/shipyard-view.ts
  - src/scenes/routes.ts
  - src/scenes/map.ts
  - src/render/ship.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
routes: []
models: []
test_files:
  - tests/unit/ship.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [shipyard, hangar, modules, grid, builder, laser-power, space-rockets, map-4, economy]
path: Game/Hangar/Shipyard
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 55 — Shipyard

## Purpose

Wave 5 of New Frontiers: the hangar of map 4. The owner wants one spacecraft that grows, its modules placed by the
pilot on a grid (doc 54). When the active kit is the ship (`kitOf(4)`, doc 49), the `hangar` route opens the
**ShipyardScene** instead of the hangar.

## The screen

- **Left:** the 7 × 9 grid (54 px cells) with the ship drawn on it from its modules; in grid mode a gold cursor, and
  every cell where the picked module (in stock) may go is shaded green.
- **Middle:** the list — **Laser Power** first, then the seven placeable modules, each with its icon, price (or MAX)
  and "N in stock · N on the ship".
- **Right:** the picked row's name, description and stats (hull, shield, speed, power left, mass, laser barrels, rocket
  wings — the whole ship's) and the **BUY** button. MAP and BASE buttons top right.

## Controls

- **List:** ↑/↓ pick a row, ENTER buys, E (or →) goes to the grid with the picked module, ESC back to the map.
- **Grid:** arrows move the cursor, ENTER places the picked module, X / Delete takes the module under the cursor off
  (back into stock), E / ESC back to the list.
- **Tap / click:** a row picks it, BUY buys, a grid cell places the picked module there — or, on a placed module, takes
  it off.
- Notes under the list say why something failed: no money, maxed, not in stock, breaks a rule, other modules hang on it.

## Prices

| module | first copy | |
|---|---|---|
| Front Capsule | $60,000 | one only |
| Armour Plate | $30,000 | |
| Engine | $45,000 | |
| Laser Cannon | $55,000 | |
| Rocket Wing | $40,000 | |
| Shield Generator | $75,000 | |
| Reactor | $65,000 | |

- **Each further copy costs a quarter more** (`COPY_STEP` 0.25 × copies owned — placed plus stock, the starter ship's
  modules included), rounded to $1,000. Halved from the first draft after the bot playtest (doc 56): on the old prices
  the ship bought almost nothing in Low Orbit.
- **Laser Power** levels every barrel at once (the core's and each laser module's):

| level | price | shots/s | damage |
|---|---|---|---|
| 1 | — | 5 | 12 |
| 2 | $20,000 | 5.5 | 14 |
| 3 | $48,000 | 6 | 16 |
| 4 | $110,000 | 6.5 | 18 |
| 5 | $200,000 | 7 | 21 |
| 6 | $340,000 | 7.5 | 24 |
| 7 | $520,000 | 8 | 27 |
| 8 | $800,000 | 8.5 | 30 |
| 9 | $1,150,000 | 9 | 33 |
| 10 | $1,600,000 | 9.5 | 37 |

- **Space rockets:** every rocket wing carries 6 homing rockets (70 damage, hit anything) on the GROUND key, refilled
  every sortie; they are never sold on their own.
- Nothing is on sale before map 4 is open (`mapOpen(save, 4)`); the wallet is the one all kits share (doc 49).

## Business Rules

- Pure in `src/game/ship-shop.ts`: `owned`, `modulePrice` (`null` for the core and a maxed module), `canBuyModule` /
  `buyModule` (`locked` / `max` / `insufficient-funds`), `laserPrice`, `canBuyLaser` / `buyLaser`.
- The mission's stats come from `shipPlayerStats` (`src/game/ship-loadout.ts`): hull, speed, the barrels as the gun
  pattern at the laser level (`shipGun`), the rocket station, the capsule's radar as early warning.
- The map's mission panel shows "YOUR SHIP: N modules · hull · laser LV" on map 4.
