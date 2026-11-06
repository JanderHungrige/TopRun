---
id: 49-helicopter-kit
title: Helicopter Kit - Helicopters as a Kind of Plane, a Fresh Kit for Map 3, the HELICOPTERS Hangar
edition: TopRun
depends_on: [02-hangar-economy, 48-third-map, 43-deep-arsenal, 37-double-firepower]
relates: [48-third-map, 50-helicopter-flight, 47-admin-pilot, 36-new-jets]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/helis.ts
  - src/data/weapons.ts
  - src/data/heli-kit.ts
  - src/game/kit.ts
  - src/game/save.ts
  - src/game/economy.ts
  - src/game/firepower.ts
  - src/game/arsenal.ts
  - src/game/jets.ts
  - src/game/loadout.ts
  - src/main.ts
  - src/game/state.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/map.ts
  - src/i18n/ui-en-hangar.ts
  - src/i18n/ui-de-hangar.ts
  - src/i18n/content-de.ts
routes: []
models:
  - "SaveData.heli: { selectedPlane, gunLevel, equipment } — the helicopter kit (new, missing = fresh)"
  - "SaveData.kit: 'jet' | 'heli' (runtime only: which kit the scenes see; storage always 'jet')"
test_files:
  - tests/unit/heli-kit.test.ts
data_flow: writes-existing
last_synced: 2026-11-06
status: in_progress
phase: all
mdd_version: 11
tags: [helicopters, apache, kit, hangar, chain-gun, hydra, hellfire, equipment, map-3, economy]
path: Game/Hangar/Helicopter Kit
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (heli kit parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 49 — Helicopter Kit

## Purpose

Wave 2 of New Frontiers. Owner, 2026-11-06: *"Third stage go with helicopters instead of airplanes … Remove the
aircrafts. Reset the loadouts."* — and in the question round: one wallet, a fresh kit. On map 3 the pilot flies
helicopters only, with their own gun, weapons and equipment, all starting from zero; the money is the same money.
The jets and everything bought for them stay with maps 1–2, untouched.

## Helicopters are a kind of plane

- `PlaneDef.kind`: `'jet' | 'heli'`; helicopters are `PlaneId`s with `campaign: 3`, so everything that draws, saves
  or flies a plane (loadouts, paint records, progress entries, the mission's player) works for them unchanged.
- This wave: the **AH-64 Apache** (`ah64`), free. Wave 3 adds the Comanche, Tiger and Hind.

| | hull | speed | stations | E |
|---|---|---|---|---|
| AH-64 Apache | 140 | 240 | 4 | Longbow Salvo (doc 50) |

## One wallet, two kits — the kit view

The save keeps the jets' kit where it always was and the helicopters' kit beside it:
`SaveData.heli = { selectedPlane, gunLevel, equipment }` (fresh: Apache, chain gun level 1, no equipment).
Missiles, rockets and their marks need no second copy: the helicopter weapons are their own weapons (`hydra`,
`hellfire`), so owning or upgrading one never touches a jet weapon. The owned helicopters live in `ownedPlanes`
next to the jets.

Which kit the scenes see is the **kit** (`'jet' | 'heli'`, `kitOf(campaign)`: maps 1–2 jets, map 3 helicopters):

- `GameContext` holds the kit: the campaign map sets it for the map on show; takeoff, mission and debrief set it
  from their mission's map; every other scene (base, rec room, minigames, locker, photos, ladder, pilots) sees the
  jets.
- `GameContext.save` hands out `kitView(save, kit)` (pure, `src/game/kit.ts`): for the helicopter kit the jet-kit
  fields are swapped for the helicopter ones (`selectedPlane`, `gunLevel`, `equipment`), the Apache counts as owned,
  and the jet-only goods read as nothing (second gun, uranium and incendiary ammo, HE gun, twin pods all 0 / empty).
  `kit: 'heli'` marks the view.
- `setSave` stores `fromKitView(stored, next)`: what changed in the helicopter fields goes into `heli`, the jet
  fields keep their stored values, everything else (money, progress, records, owned weapons and planes) is taken
  as is. The admin view (doc 47) wraps the kit view.

So the hangar, the shop and the loadout code run unchanged on either kit; only the gates below know the kit.

## The HELICOPTERS hangar (map 3)

Opened from map 3 (LOADOUT), the hangar shows three tabs: **HELICOPTERS · WEAPONS · EQUIPMENT** (no PAINT yet).

- **HELICOPTERS:** the helicopters on sale (map 3 open); the Apache owned from the start.
- **WEAPONS:**
  - **M230 Chain Gun** — the helicopter's gun, levels 1–10 (`HELI_GUN_LEVELS`, `src/data/heli-kit.ts`); fewer, heavier
    rounds than the jet guns, and it hits ground and sea targets at **full** damage (jets: half, doc 43).
  - **Hydra 70 Rocket Pod** (`hydra`): a fan of unguided rockets against air and ground, Mk I–III.
  - **AGM-114 Hellfire** (`hellfire`): homing anti-armour missile against ground and sea targets, Mk I–III.
- **EQUIPMENT:** the same seven items as the jets (armour, engine, flares, ECM, damage control, magnet, radar) with
  their own levels, up to the map-1 caps, at helicopter prices.
- Jet goods never show here and helicopter goods never show in the jets' hangar (`jetOnSale`, `weaponOnSale` read
  the kit); helicopter weapons mount only on helicopters, jet weapons only on jets.
- Prices: the jet table's price for the same step × `HELI_PRICE` (one knob, set by the map-3 balance, doc 48);
  the Hydra and Hellfire marks Mk II–III cost their usual share of the weapon's (helicopter) price.
- The chain gun's hangar picture is `chaingun` (`src/assets/items/`); until it exists the gun icon stands in.
- The crew chief greets the helicopters' hangar with his own lines (`chief.helloHelis`).
- The minigames, photos and the hangar base only ever show jets: their tables are typed by `JetId`, and
  `asJet` reads a helicopter as the F-16 where only a jet makes sense.
- The map briefing's "YOUR JET" line reads "YOUR HELICOPTER" on map 3.

## Business Rules

- Pure: `kitOf`, `kitView`, `fromKitView` (`src/game/kit.ts`); the gates in `jets.ts`, `firepower.ts`, `arsenal.ts`,
  `economy.ts` and `loadout.ts` read `save.kit`; tables in `src/data/heli-kit.ts` and `src/data/helis.ts`.
- `selectedPlane` in storage is always a jet and `heli.selectedPlane` always a helicopter (`parseSave` repairs either).

## Save

`heli` (missing → fresh kit; levels clamped like the jets'; an unknown or jet `selectedPlane` → the Apache).
`kit` is runtime only (`parseSave` reads `'jet'`). `ownedPlanes` may now hold `ah64`. Older builds drop unknown
plane ids and ignore `heli`: the usual one-way upgrade.
