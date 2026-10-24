---
id: 02-hangar-economy
title: Hangar & Economy - Planes, Weapons, Equipment, Shop, Payouts
edition: TopGun
depends_on: [01-game-core]
relates: [01-game-core, 05-mission-combat]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/data/equipment.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/render/draw-planes.ts
  - src/render/icons.ts
routes: []
models:
  - localStorage:topgun.save.v1 (money, ownedPlanes, gunLevel, ownedSecondaries, loadout, equipment)
test_files:
  - tests/unit/economy.test.ts
  - tests/unit/loadout.test.ts
data_flow: greenfield
last_synced: 2026-10-24
status: complete
phase: all
mdd_version: 11
tags: [shop, economy, planes, weapons, equipment, loadout, f-14, f-16, sr-71]
path: Game/Hangar
integration_contracts:
  - function: "derivePlayerStats(save)"
    when: "the mission scene builds the player from this — never reads plane/equipment data directly"
  - function: "computePayout(mission, result, firstClear)"
    when: "the debrief applies money only through this result"
satisfies_contracts:
  - from: 01-game-core
    function: "persistSave(save)"
    when: "after every purchase, mount or plane selection"
    status: done
    verified_at: "src/scenes/hangar.ts:105 (GameContext.setSave → src/main.ts:30)"
known_issues: []
security_read_sites: []
sister_projects: []
---

# 02 — Hangar & Economy

## Purpose

Between missions the player spends mission money in the hangar: buy planes, upgrade the gun,
unlock secondary weapons and mount them on hardpoints, and buy equipment. All shop rules and
payout maths are pure functions over `SaveData` so they are fully unit-tested.

## Architecture

```
data/planes.ts     PLANES: f16 | f14 | sr71 (stats, price, special ability)
data/weapons.ts    GUN_LEVELS[1..5], SECONDARIES: aim9 | rockets | mk82 | agm65 | aim54
data/equipment.ts  EQUIPMENT: armor | engine | flares | ecm | damageControl | magnet
game/economy.ts    canBuy / buy / mount / unmount / selectPlane / computePayout / computeStars
game/loadout.ts    derivePlayerStats(save) → PlayerStats used by the mission
scenes/hangar.ts   UI: tabs PLANES / WEAPONS / EQUIPMENT, item list, detail panel, buy/mount
render/draw-planes.ts  vector art (top-down + side view) for all three planes
```

## Data Model

### Planes

| id | Name | Price | Hull | Speed px/s | Hardpoints | Gun dmg × | Special (cooldown) |
|----|------|------:|-----:|-----------:|-----------:|----------:|--------------------|
| f16 | F-16 Fighting Falcon | starter | 100 | 330 | 2 | 1.0 | Barrel Roll — 0.7 s invulnerable dodge + side dash (5 s) |
| f14 | F-14 Tomcat | 22,000 | 160 | 290 | 4 | 1.2 | Wingman — AI Tomcat flies alongside firing for 8 s (25 s) |
| sr71 | SR-71 Blackbird | 65,000 | 130 | 400 | 3 | 1.4 | Mach 3 Dash — 3 s invulnerable ram, 3× scroll (20 s) |

### Gun (M61 Vulcan, global upgrade)

| Lvl | Price | Pattern | Shots/s | Dmg |
|----:|------:|---------|--------:|----:|
| 1 | — | 1 stream | 9 | 10 |
| 2 | 2,500 | 2 parallel | 10 | 10 |
| 3 | 6,000 | 2 parallel | 13 | 11 |
| 4 | 12,000 | 3 (centre + ±6°) | 13 | 11 |
| 5 | 20,000 | 4 (2 centre + ±9°) | 15 | 12 |

Guns deal **50 % damage to ground/sea targets**.

### Secondary weapons (unlock once, ammo refilled every mission)

| id | Name | Price | Ammo / mounted slot | Damage | Hits | Behaviour |
|----|------|------:|------:|------:|------|-----------|
| aim9 | AIM-9 Sidewinder | 3,000 | 6 | 60 | air | homing, turn 3.5 rad/s |
| rockets | Zuni Rocket Pod | 4,500 | 5 volleys | 5×25 | air + ground | 5-rocket fan, straight |
| mk82 | Mk-82 Bombs | 5,000 | 6 | 140, radius 70 | ground | falls 0.6 s, area blast |
| agm65 | AGM-65 Maverick | 9,000 | 4 | 160 | ground | homing on ground targets |
| aim54 | AIM-54 Phoenix | 15,000 | 2 | 320 | air + boss | long-range homing — **F-14 only** |

### Equipment (global, tiered)

| id | Name | Prices per level | Effect per level |
|----|------|------------------|------------------|
| armor | Armor Plating | 3,000 / 7,000 / 14,000 | +20 % / +40 % / +60 % hull |
| engine | Engine Tuning | 3,000 / 7,000 / 14,000 | +8 % / +16 % / +24 % speed |
| flares | Flare Dispenser | 2,000 / 4,000 / 8,000 | 2 / 4 / 6 flares per mission |
| ecm | ECM Pod | 12,000 | enemy bullet dmg −25 %, enemy missile turn −30 % |
| damageControl | Damage Control | 15,000 | once per mission at hull < 25 %: restore 40 % |
| magnet | Cargo Magnet | 6,000 | pickups drift to you from 160 px |

## API Endpoints

None.

## Business Rules

- `canBuy` fails with a reason: `insufficient-funds`, `already-owned`, `max-level`, `unknown-item`.
  `buy` returns a **new** SaveData (never mutates input) with money deducted.
- Buying a plane does **not** auto-select it; the detail panel offers SELECT for owned planes.
- `mount(save, plane, secondary, slot)`: secondary must be owned; slot < plane hardpoints;
  aim54 only on f14 (`restricted-plane`). Same weapon may occupy several slots (more ammo).
  `unmount` empties a slot. Loadout arrays are dense: `(SecondaryId | null)[]` of length = hardpoints.
- `derivePlayerStats(save)` → `{ plane, maxHull, speed, gunLevel, gunDamageMul,
  secondaries: [{id, ammo}] (in slot order, merged by id), flares, ecm, damageControl, magnet }`.
- **Payout** (`computePayout(mission, result, firstClear)`):
  - success: `base = mission.reward × (firstClear ? 1 : 0.5)`;
    `takeoffBonus = base × {perfect: 0.15, good: 0.05, early|late|skipped: 0}`;
    `hullBonus = hullRatio ≥ 0.7 ? base × 0.10 : 0`; `total = base + bonuses + collected`.
  - failure: `total = floor(collected × 0.5)` ("salvage"), no base, no bonuses.
  - all amounts rounded to whole dollars.
- **Stars**: 0 on failure; else 1 + (hullRatio ≥ 0.7) + (killRatio ≥ 0.8). Progress keeps the best.
- Starting money 2,000; economy is tuned so the whole shop (~250k) costs about one full
  campaign plus some replays.

## Data Flow

Greenfield. Hangar reads `GameContext.save` → shows prices/ownership → `buy()/mount()` produce a
new save → `ctx.save = next; persistSave(next)`. Mission reads only `derivePlayerStats(save)`.
Debrief writes `computePayout` total into `save.money`.

## Dependencies

- 01-game-core: SaveData, persistSave, input, widgets, scene manager.

## Security

None beyond 01 (no network, local single-player state).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
