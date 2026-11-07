---
id: 57-space-arsenal
title: Space Arsenal - Torpedo Bay, Rocket Wings on the AIR Key, Mk II–V Marks for the Ship's Modules
edition: TopRun
depends_on: [54-spacecraft, 55-shipyard, 43-deep-arsenal]
relates: [54-spacecraft, 55-shipyard, 58-map-four-campaign]
source_files:
  - src/data/ship-modules.ts
  - src/data/weapons.ts
  - src/data/types.ts
  - src/game/ship.ts
  - src/game/ship-shop.ts
  - src/game/ship-loadout.ts
  - src/scenes/shipyard.ts
  - src/scenes/shipyard-view.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/weapons-fire.ts
  - src/render/ship.ts
  - src/render/icons.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/mission-render.ts
  - dev/playtest.ts
routes: []
models:
  - "SaveData.ship.marks: Record<'plate'|'engine'|'shield'|'rockets'|'torpedo', 1–5> (new; missing = all Mk I)"
test_files:
  - tests/unit/ship.test.ts
  - tests/unit/space-arsenal.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [spacecraft, torpedo, rockets, marks, upgrades, shipyard, map-4, space-weapons]
path: Game/Hangar/SpaceArsenal
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/ship.ts (the ship's marks parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 57 — Space Arsenal

## Purpose

Wave 6 of New Frontiers. Owner: map 4 should *"change the weapon types"*; the initiative gives map 4 its own weapons
with upgrade ladders. Wave 5 shipped the lasers (laser power 1–10) and the rocket wing; wave 6 adds a heavy weapon for
the big targets and a mark ladder for the modules.

## Torpedo Bay — a new module

| module | mass | power | hull | placement | price |
|---|---|---|---|---|---|
| Torpedo Bay | 3 | −1 | +8 | nothing in front of it (the tube fires ahead) | $70,000 |

- Each bay carries **2 plasma torpedoes** on the **GROUND** key: slow homing bolts (speed 340, turn 1.2 rad/s) for
  ground-layer targets — in space that is anything big and slow: satellites, warships, stations, bosses. 300 damage.
- Torpedoes refill every sortie; they are never sold on their own.

## Rocket wings move to the AIR key

The space rockets (homing, they hit anything) now fire on the **AIR** key, so a ship with wings and bays has one
weapon on each key. Same numbers as before: 6 per wing, 70 damage.

## Marks — Mk II to Mk V

The shipyard sells a **mark** per module family; it upgrades **every** copy of that module, placed or in stock:

| family | what a mark adds (Mk I → Mk V) |
|---|---|
| Armour Plate | hull per plate 25 → 31 → 38 → 44 → 50 |
| Engine | thrust per engine 3 → 3.75 → 4.5 → 5.25 → 6 |
| Shield Generator | points per generator 25 → 31 → 38 → 44 → 50, regrowth 6 → 12 /s in step |
| Rocket Wing | the deep-arsenal marks (doc 43): damage ×1.25 … ×2, +1 … +4 rockets per wing, faster and sharper |
| Torpedo Bay | the same: damage ×1.25 … ×2, +1 … +4 torpedoes per bay |

- The gain is the deep arsenal's damage factor (`MARKS[mark].damageMul`: 1, 1.25, 1.5, 1.75, 2), rounded where a
  whole number is shown (hull, shield points).
- **Price** of the next mark = the module's first-copy price × the deep arsenal's price factor (Mk II 1.5, Mk III 4,
  Mk IV 6, Mk V 9). Plate marks cost $45,000 / $120,000 / $180,000 / $270,000.
- A mark can be bought before owning the module (it waits for the first copy).
- Capsule, reactor and laser have no marks (the laser's ladder is laser power).

## Shipyard

- The list gains **Torpedo Bay** (after Rocket Wing); a module with marks shows its mark in the row ("Mk II · 2 in
  stock · 1 on the ship").
- The detail panel gets an **UPGRADE Mk III $120,000** button above BUY (key **U**, as in the jets' loadout, doc 43),
  MAX at Mk V, and a line with the family's value now and at the next mark (e.g. "per plate: 31 → 38 hull").

## Business Rules

- Data: `torpedo` in `MODULES`; `SHIP_MARK_FAMILIES`, `MAX_SHIP_MARK` = 5 in `src/data/ship-modules.ts`; the
  `torpedo` secondary in `src/data/weapons.ts` (role `ground`), `spacerocket` role → `air`.
- Pure: `shipStats(ship)` reads the marks (hull, thrust, shield points and regrowth); `shipPlayerStats` builds one
  station per weapon (`spacerocket`, `torpedo`) with ammo = per-slot ammo at the mark × copies; `markPrice`,
  `canBuyShipMark`, `buyShipMark` in `src/game/ship-shop.ts` (needs map 4 open; `max` at Mk V).
- `parseShip` clamps marks to 1–5 (missing → 1).
