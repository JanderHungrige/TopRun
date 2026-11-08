---
id: 79-mech-kit
title: Mech Kit - Four Walking Mechs as the Third Fleet Kit, Alloy as Its Currency, the MECH BAY, the Mech Weapons and the Base's Magazine
edition: TopRun
depends_on: [66-sub-kit, 49-helicopter-kit, 78-sixth-map]
relates: [80-mech-walk, 82-ground-base, 83-lab, 87-mech-camo, 47-admin-pilot]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/data/mech-kit.ts
  - src/data/fleet.ts
  - src/game/kit.ts
  - src/game/save.ts
  - src/game/outpost.ts
  - src/game/firepower.ts
  - src/game/loadout.ts
  - src/game/economy.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
routes: []
models:
  - "SaveData.mech: { selectedPlane, gunLevel, equipment } — the mech kit (new, missing = fresh)"
  - "SaveData.outpost: the ground base (doc 82): buildings, alloy, research, magazine"
  - "SaveData.kit: … | 'mech' (runtime only)"
test_files:
  - tests/unit/mech-kit.test.ts
  - tests/unit/outpost.test.ts
data_flow: writes-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [mechs, strider, ranger, hornet, titan, kit, mech-bay, alloy, autocannon, rocket-pod, magazine, map-6]
path: Game/Hangar/Mech Kit
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (mech kit and outpost parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 79 — Mech Kit

## Purpose

Owner, 2026-11-08: *"We have mechwarriors as machines … This earns us resources to build mechs. To build extensions and
upgrades. For some weapons like rockets, we have to build them to have x ammo. Also new weapons have to be invented not
just bought."*

## The third fleet kit

The mechs are a fleet kit like the helicopters and the subs (doc 66): four craft, one gun table, their own weapons, the
seven equipment items — `FLEET.mech` (kit `mech`, map 6, the Strider free). Mechs are `PlaneId`s of kind `mech`; jet-only
places read a mech as the F-16 (`asJet`).

| | hull | speed | hardpoints | gun × | E | alloy | mech bay |
|---|---|---|---|---|---|---|---|
| Strider | 160 | 205 | 2 | 1.0 | Jump Jets (doc 80) | free | 1 |
| Ranger | 210 | 190 | 3 | 1.15 | Missile Barrage: a seeker missile at each ground target in sight | ◆900 | 2 |
| Hornet | 145 | 245 | 2 | 1.25 | Camo Field: the enemy holds fire | ◆1,400 | 2 |
| Titan | 320 | 160 | 4 | 1.2 | Bulwark: nothing gets through | ◆2,400 | 3 |

## Alloy, not money

Nothing in the mech kit is bought with money. **Alloy (◆)** is the mech kit's currency: the kit view of the save shows
the base's alloy in place of the money (`kitView`), and writes it back (`fromKitView`), so the hangar's buy code works
unchanged; the hangar says BUILD instead of BUY and shows ◆ instead of $. Prices are the jets' × `MECH_PRICE` 0.008
(gun level 2 ◆20 … level 10 ◆1,840; armour level 1 ◆24 …).

- The **mech bay's level** (doc 82) gates what it can build: mechs (Strider 1, Ranger and Hornet 2, Titan 3), the gun
  (levels to 4 / 7 / 10) and equipment (to level 2 / 3 / 4, the map-1 caps).
- Alloy comes from the refinery and from salvage (doc 82).

## The autocannon and the mech weapons

- **Autocannon**, levels 1–10 (`MECH_GUN_LEVELS`): heavy rounds, the chain gun's rate and damage; hits the ground fully.
- Weapons (mechs only; `planes: MECH_IDS`):

| id | weapon | key | ammo | rack | damage | known |
|---|---|---|---|---|---|---|
| `pod` | Rocket Pod: a fan of unguided rockets | GROUND | rockets | 8 | 30 | from the start |
| `seeker` | Seeker Missiles: homing, anything that moves | AIR | missiles | 4 | 130 | researched (doc 83) |
| `mortar` | Mortar: lobbed shells bursting on the ground | GROUND | shells | 5 | 150, radius 85 | researched |
| `plasma` | Plasma Lance: a slow green bolt that burns through everything in its path | AIR | energy | 6 | 90 | researched |
| `rail` | Rail Cannon: an instant beam the whole height of the screen | GROUND | energy | 4 | 260 | researched |

- **Built ammo:** the pod, the seeker and the mortar fire rounds of the base's **magazine** (rockets, missiles, shells),
  which the munitions factory fills (doc 82). A sortie loads `min(rack × mounted, magazine)` rounds; what is fired is
  taken from the magazine in the debrief. With an empty magazine the weapon is mounted but has no rounds.
- **Energy weapons** (plasma, rail) need no rounds: each charge is recharged by the base's generator for every sortie.
- A weapon is owned once it is known: the pod from the start, the others when the lab has invented them; their marks
  (Mk II / Mk III) are inventions too (doc 83). The hangar shows a weapon not yet invented as *invented in the lab*.
