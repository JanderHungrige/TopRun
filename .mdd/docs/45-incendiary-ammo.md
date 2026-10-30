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
status: in_progress
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
  The choice for strike missions, bunkers, ships and bosses.
- **Incendiary**: hits set planes on fire, which deals extra damage over the next 1.5 s. No help against ground
  targets. The choice for intercepts and dogfights.

## The item

**Incendiary Ammo**, WEAPONS tab, right after the uranium ammo. Six levels, priced like uranium:

| level | burn damage on planes | price | sold |
|---|---|---|---|
| 1 | +30 % of each hit | 18,000 | map 1 |
| 2 | +55 % | 40,000 | map 1 |
| 3 | +80 % | 120,000 | map 2 |
| 4 | +100 % | 150,000 | map 2 |
| 5 | +120 % | 185,000 | map 2 |
| 6 | +140 % | 225,000 | map 2 |

## Loading

The pilot owns levels of both types but **loads one** (`SaveData.ammoType`). The ammo item's detail panel shows
**LOAD** (ENTER) on a type that is owned and not loaded; the loaded type's list row says **LOADED**. Buying the first
level of a type loads it when the other type has no level yet; otherwise buying never switches. Ordinary rounds fly
when the loaded type has no level.

## In the mission

With incendiary loaded, the main gun, the second gun and the A-10's GAU-8 burst fire incendiary rounds:

- **No uranium bonus:** gun damage × 1 and the plain ground factor 0.5.
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

Against fighters at the same level the burn is worth about 1.6–1.8 × uranium's bonus on paper and about 1.3–1.5 ×
after overkill; against ground targets, ships and bosses incendiary is plainly worse. Bot playtest: see doc 43,
Balance (wave 3).
