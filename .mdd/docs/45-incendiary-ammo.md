---
id: 45-incendiary-ammo
title: Incendiary Ammo - A Second Ammo Type That Sets Planes on Fire, One Type Loaded per Sortie
edition: TopRun
depends_on: [43-deep-arsenal, 05-mission-combat, 02-hangar-economy]
relates: [43-deep-arsenal, 46-bofors-he-gun, 44-new-adversaries, 38-challenge-level]
source_files:
  - src/data/arsenal.ts
  - src/game/arsenal.ts
  - src/game/ammo.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/game/save.ts
  - src/game/challenge.ts
  - src/game/adversaries.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/burn.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-render.ts
  - src/i18n/ui-en-arsenal.ts
  - src/i18n/ui-de-arsenal.ts
routes: []
models:
  - "SaveData.incendiaryLevel 0–6 (new, missing = 0)"
  - "SaveData.ammoType 'uranium' | 'incendiary' (new, missing = 'uranium')"
test_files:
  - tests/unit/ammo.test.ts
  - tests/unit/arsenal.test.ts
data_flow: writes-existing
last_synced: 2026-10-30
status: complete
phase: all
mdd_version: 11
tags: [incendiary-ammo, ammo, gun, burn, uranium-ammo, hangar, arsenal, balance, stealth]
path: Game/Hangar/Incendiary Ammo
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (incendiaryLevel and ammoType parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 45 — Incendiary Ammo

## Purpose

Wave 3 of Arsenal and Adversaries. Owner, 2026-10-30: *"And a new ammunition type, incendiary ammo. What do you think
about it in terms of balance?"* Answer: as an **alternative** to uranium, not on top of it, so it is a real choice per
mission instead of more damage. The owner chose "load one per sortie".

- **Uranium** (doc 43): armour-piercing. More damage against everything and full damage on ground and sea targets.
  The choice for strike missions, bunkers, ships and ground bosses.
- **Incendiary**: the same extra punch as uranium, but **against planes only**, and hits set planes on fire, which
  deals more damage over the next 1.5 s. Nothing extra against ground targets. The choice for intercepts and
  dogfights.

## The item

**Incendiary Ammo**, WEAPONS tab, right after the uranium ammo. Six levels, priced like uranium:

| level | gun damage on planes | burn on planes | price | sold |
|---|---|---|---|---|
| 1 | +15 % | +20 % of each hit | 18,000 | map 1 |
| 2 | +30 % | +30 % | 40,000 | map 1 |
| 3 | +45 % | +40 % | 120,000 | map 2 |
| 4 | +60 % | +50 % | 150,000 | map 2 |
| 5 | +75 % | +60 % | 185,000 | map 2 |
| 6 | +90 % | +70 % | 225,000 | map 2 |

The gun-damage column is uranium's at the same level.

## Loading

The pilot owns levels of both types but **loads one** (`SaveData.ammoType`). The ammo item's detail panel shows
**LOAD** (ENTER) on a type that is owned and not loaded; the loaded type's list row says **LOADED**. Buying the first
level of a type loads it when the other type has no level yet; otherwise buying never switches. Ordinary rounds fly
when the loaded type has no level.

## In the mission

With incendiary loaded, the main gun, the second gun and the A-10's GAU-8 burst fire incendiary rounds:

- **Against planes** (and air bosses) the gun does uranium's extra damage; **against ground and sea targets** it does
  the plain half damage, with no bonus. (The A-10's GAU-8 burst keeps its full damage on the ground and takes the
  bonus everywhere, as with uranium.)
- **Burn:** each hit on an **air** target (planes, helicopters, the Backfire mini-boss) adds the level's share of that
  hit's damage to the target's burn, dealt evenly over the next **1.5 s**. Each new hit adds to the burn and restarts
  the 1.5 s. A target that dies before its burn is over wastes the rest (overkill), which is why the burn numbers are
  higher than uranium's flat bonus.
- Ground and sea targets don't burn. **Bosses don't burn** (too big to set alight; they take the plain hit).
- Burn damage kills like any hit: bounty, kill count, drops. It plays no hit sound of its own.
- A burning plane **trails fire and smoke**. A burning stealth fighter (doc 44) can be seen, locked and shown on the
  radar while it burns: incendiary rounds are an answer to stealth.
- **Tracers:** a hot orange core inside a red-orange glow that flickers round by round (uranium's are green).

## Business Rules

- Levels 1–2 on map 1, 3–6 once map 2 is open (`locked` otherwise, forged clicks included); one level at a time.
- Loading needs at least level 1 of that type; loading is free and can be changed before every sortie.
- The kit score (doc 38) counts both ammo types' levels × 10.
- Pure logic in `src/game/ammo.ts`: what is on sale, prices, buying, loading, and the gun's ammo numbers
  (`loadedRounds`: damage multiplier, ground factor, burn share).

## Save

`incendiaryLevel` 0–6 (missing = 0) and `ammoType` (`'uranium'` | `'incendiary'`, anything else → `'uranium'`). Older
builds ignore both fields and fly uranium: the usual one-way upgrade.

## Balance

First version (burn only, +30 … +140 %, no flat bonus), for the record: on a stationary Backfire it out-damaged
uranium by 21 % once the burn had built up, but it lost against everything small — fighters died before their burn
was dealt, and the drones the Backfire launches soaked up the slower rounds — so the bot downed a focused Backfire in
13–17 s against 11–13 s with uranium, and the cruiser escaped. Not the intercept choice it was meant to be. Hence the
flat bonus against planes and a smaller burn.

Bot playtest with the final numbers (m35 kit, level 3 of either type, four runs focused on the mini-bosses; m33, an
all-air intercept, three runs each):

| | uranium 3 | incendiary 3 |
|---|---|---|
| m35 Backfire (a plane), focused | 12–17 s | 11–13 s |
| m35 missile cruiser (a ship), focused | 9–12 s | escaped 3 of 4 |
| m33 intercept: damage taken, planes shot down | 2.68 hulls/min, 71 % | 2.50, 76 % |

Incendiary is the better pick when the mission is planes; uranium when anything on the ground or the sea matters.
