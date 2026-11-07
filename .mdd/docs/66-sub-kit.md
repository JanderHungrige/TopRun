---
id: 66-sub-kit
title: Sub Kit - Attack Subs as a Kind of Plane, a Fresh Kit for Map 5, the SUB PEN Hangar
edition: TopRun
depends_on: [49-helicopter-kit, 65-fifth-map, 02-hangar-economy, 43-deep-arsenal]
relates: [49-helicopter-kit, 65-fifth-map, 67-sub-flight, 47-admin-pilot, 74-world-order]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/data/sub-kit.ts
  - src/data/fleet.ts
  - src/game/kit.ts
  - src/game/save.ts
  - src/game/economy.ts
  - src/game/firepower.ts
  - src/game/arsenal.ts
  - src/game/jets.ts
  - src/game/loadout.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/hangar-chief.ts
  - src/scenes/map.ts
  - src/render/items.ts
  - src/render/icons.ts
  - src/i18n/ui-en-deep.ts
  - src/i18n/ui-de-deep.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/i18n/content-de.ts
routes: []
models:
  - "SaveData.sub: { selectedPlane, gunLevel, equipment } — the sub kit (new, missing = fresh)"
  - "SaveData.kit: 'jet' | 'heli' | 'ship' | 'sub' (runtime only; storage always 'jet')"
test_files:
  - tests/unit/sub-kit.test.ts
  - tests/unit/heli-kit.test.ts
  - tests/unit/loadout.test.ts
  - tests/unit/item-pictures.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [submarines, type-212, kit, hangar, sub-pen, harpoon-gun, torpedo, depth-mine, equipment, map-5, economy]
path: Game/Hangar/Sub Kit
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Wave 1 sells the Type 212 only (free); the other three subs and the Shkval rockets come in wave 2."
security_read_sites:
  - src/game/save.ts (sub kit parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 66 — Sub Kit

> **World order (doc 74, 2026-11-07):** under the sea is now **map 4, m91–m120**; space is map 5, the last world. Mission numbers, map numbers and thresholds in this doc are from before the swap: take 30 off its mission numbers (m121 → m91), read map 5 as map 4. The world's own numbers (formulas from its first mission, pay ×10, prices) are unchanged.

## Purpose

Wave 1 of Deep Water. The owner chose **a fleet of 3–4 subs**, like the helicopters (docs 49, 51): on map 5 the pilot
steers attack subs with their own gun, weapons and equipment, all from zero; the money is the same money.

## Two fleet kits

The helicopter kit (doc 49) becomes one of two **fleet kits** — a few craft to buy, one gun table, their own
weapons, the seven equipment items at their own prices:

| | helicopters (map 3) | subs (map 5) |
|---|---|---|
| kit | `heli` | `sub` |
| in the save | `heli` | `sub` |
| free craft | AH-64 Apache | Type 212 |
| gun | M230 chain gun, `HELI_GUN_LEVELS` | harpoon gun, `SUB_GUN_LEVELS` |
| price factor on the jets' table | `HELI_PRICE` 6 | `SUB_PRICE` 10 (set by the playtest) |
| weapons' top mark | Mk III | Mk III |

- One table per fleet kit (`FLEET` in `src/data/fleet.ts`): the kit, its craft, its free craft, its gun table and
  price factor, its map. The gates that knew only `'heli'` read the table: `gunCap`, `gunPrice`, `gunDef`,
  `powerCap`, `equipmentPrice`, `weaponOnSale`, `markCap`, `jetOnSale`, the hangar's tabs, the crew chief's hello,
  the gun hitting the ground at full (`loadout`).
- `kitOf(5)` = `'sub'`; `kitView` swaps in `save.sub` exactly as it swaps in `save.heli`, and the Type 212 counts as
  owned; `fromKitView` writes the sub fields back into `sub`.

## Subs are a kind of plane

- `PlaneDef.kind` gains `'sub'`; subs are `PlaneId`s with `campaign: 5` (`SUB_IDS`), so loadouts, paint records and
  the mission's player work for them unchanged. Jet-only places (minigames, photos, the hangar base) read a sub as the
  F-16 (`asJet`), as they do a helicopter.
- This wave: the **Type 212** (`u212`), free:

| | hull | speed | tubes | E |
|---|---|---|---|---|
| Type 212 | 150 | 230 | 4 | Sonar Burst (doc 67) |

  "Quiet German attack sub with fuel-cell drive. Four tubes, a harpoon gun and an active sonar that clears the water
  around it."

## The SUB PEN (map 5)

Opened from map 5 (LOADOUT): the hangar with three tabs **SUBS · WEAPONS · EQUIPMENT**; the title reads SUB PEN.

- **SUBS:** the subs on sale (map 5 open); the Type 212 owned from the start.
- **WEAPONS:**
  - **Harpoon Gun** — levels 1–10 (`SUB_GUN_LEVELS`, `src/data/sub-kit.ts`): steel bolts, the chain gun's rate and
    damage, prices the jets' × `SUB_PRICE`; hits seabed targets at **full** damage.
  - **MK48 Torpedo** (`mk48`, AIR key): a slow homing torpedo that finds anything in the water — subs, drones,
    mines, creatures, bosses. 3 a tube, 150 damage.
  - **Depth Mine** (`depthmine`, GROUND key): sinks below the sub and bursts on the seabed — a wide blast against
    turrets and anything on the bottom. 4 a tube, 160 damage, radius 80.
  - Both Mk I–III, prices the jets' Sidewinder and Mk-82 × `SUB_PRICE`; the hangar names their targets for the sea
    ("vs anything in the water", "vs the seabed").
- **EQUIPMENT:** the seven items (armour, engine, flares → noise-makers in the text, ECM, damage control, magnet,
  radar → sonar in the text) up to the map-1 caps, at sub prices.
- Sub goods never show in the other hangars and other goods never show in the SUB PEN; sub weapons mount only on subs.
- The gun's hangar picture is `harpoon` (`src/assets/items/`); until it exists the gun icon stands in.
- The crew chief greets the SUB PEN with his own lines (`chief.helloSubs`).

## Business Rules

- Pure: `kitOf`, `kitView`, `fromKitView`, `freshFleetKit`, `parseFleetKit` (`src/game/kit.ts`); `FLEET` and
  `isFleet` (`src/data/fleet.ts`); `SUB_PRICE`, `SUB_GUN_LEVELS`, `subGunDef` (`src/data/sub-kit.ts`).
- `selectedPlane` in storage is always a jet, `heli.selectedPlane` a helicopter, `sub.selectedPlane` a sub
  (`parseSave` repairs each).

## Save

`sub` (missing → fresh kit: Type 212, harpoon gun level 1, no equipment; levels clamped; an unknown or non-sub
`selectedPlane` → the Type 212). `ownedPlanes` may now hold `u212`; `ownedSecondaries` / `weaponLevels` may hold
`mk48` and `depthmine`. Older builds drop unknown ids and ignore `sub`: the usual one-way upgrade.
