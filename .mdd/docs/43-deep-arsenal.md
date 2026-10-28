---
id: 43-deep-arsenal
title: Deep Arsenal - Gun Levels to 10, Uranium Ammo, Mk II/III Weapons, More Equipment Levels, Stronger Enemies
edition: TopRun
depends_on: [02-hangar-economy, 05-mission-combat, 35-second-map, 37-double-firepower, 38-challenge-level]
relates: [02-hangar-economy, 05-mission-combat, 37-double-firepower, 38-challenge-level]
source_files:
  - src/core/input.ts
  - src/data/arsenal.ts
  - src/data/equipment.ts
  - src/data/types.ts
  - src/data/weapons.ts
  - src/game/arsenal.ts
  - src/game/challenge.ts
  - src/game/cockpit.ts
  - src/game/combat.ts
  - src/game/economy.ts
  - src/game/firepower.ts
  - src/game/loadout.ts
  - src/game/save.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-de-arsenal.ts
  - src/i18n/ui-de.ts
  - src/i18n/ui-en-arsenal.ts
  - src/i18n/ui-en.ts
  - src/render/cockpit/gauges.ts
  - src/render/icons.ts
  - src/scenes/hangar-chief.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/hangar.ts
  - src/scenes/mission/cockpit-view.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/pickups.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/world.ts
routes: []
models:
  - "SaveData.gunLevel 1–10 (was 1–8), gun2Level 0–7 (was 0–5), ammoLevel 0–3 (new), weaponLevels: Record<SecondaryId, 1–3> (new), equipment levels up to the new caps"
test_files:
  - tests/unit/arsenal.test.ts
  - tests/unit/firepower.test.ts
  - tests/unit/economy.test.ts
  - tests/unit/combat.test.ts
data_flow: writes-existing
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [weapons, gun, upgrades, uranium-ammo, mk-ii, equipment, hangar, economy, balance, difficulty, arsenal]
path: Game/Hangar/Deep Arsenal
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (ammoLevel and weaponLevels parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 43 — Deep Arsenal

## Purpose

Wave 1 of Arsenal and Adversaries (owner, 2026-10-28: "everything is already maxed out … two more minigun levels and
uranium ammo … increase the cost for the higher levels … stronger enemies and more levels per weapon/equipment, to
make the player fail more often but with better weapons to progress"). The shop grows deeper and dearer at the top,
so each map's kit costs about what the map pays out; enemies get tougher faster, so the new levels matter.

## What is on sale where

Map-1 goods are on sale from the start; map-2 goods once map 2 is open (`mapTwoOpen`, doc 35), as in doc 37. Nothing
already owned changes price or level.

### Gun (M61 Vulcan): levels 1–10

| level | shots/s | damage | barrels | DPS | price | sold |
|---|---|---|---|---|---|---|
| 1 | 9 | 10 | 1 | 90 | — | map 1 |
| 2 | 10 | 10 | 2 | 200 | 2,500 | map 1 |
| 3 | 13 | 11 | 2 | 286 | 6,000 | map 1 |
| 4 | 13 | 11 | 3 | 429 | 14,000 (was 12,000) | map 1 |
| 5 | 15 | 12 | 4 | 720 | 26,000 (was 20,000) | map 1 |
| 6 | 17 | 13 | 4 | 884 | 45,000 | map 1 (new) |
| 7 | 16 | 14 | 5 | 1,120 | 70,000 | map 1 (new) |
| 8 | 20 | 15 | 5 | 1,500 | 110,000 | map 2 |
| 9 | 22 | 17 | 5 | 1,870 | 160,000 | map 2 (new) |
| 10 | 22 | 17 | 6 | 2,244 | 230,000 | map 2 (new) |

- Levels 6–8 keep their old numbers (6 and 8 unchanged). Level 7 is trimmed from 1,260 to 1,120 DPS so that the
  steps stay even; it was only reachable on map 2 before.
- **New jets** (A-10, F-35, Tornado): the main gun counts up to **7** (was 5) and the **second gun** goes to **7**
  (was 5): levels 1–7 cost 15,000 · 8,000 · 15,000 · 25,000 · 40,000 · 60,000 · 90,000. Two level-7 guns
  (2,240 DPS) match one level-10 gun on an old jet (2,244), as doc 37's rule says.
- **Power-ups** lift the gun one level for 12 s up to the top of the table (10 for an old jet, 7 for a new jet's main
  gun and its second gun). A map-1 pilot at level 7 gets a 12 s taste of level 8.
- The cockpit's cannon panel keeps five lamps: levels 1–5 green, levels 6–10 light one to five lamps cyan over the
  green row. The second gun's row of small lamps does the same for its levels 6–7.

### Uranium ammo (new, WEAPONS tab, right after the gun)

Depleted-uranium armour-piercing rounds for the cannon. Each level raises all gun damage: the main gun, the
second gun and the A-10's GAU-8 burst. Against ground and sea targets the gun does more than today's 50 %.

| level | gun damage | gun vs ground | price | sold |
|---|---|---|---|---|
| 1 | +15 % | 65 % | 18,000 | map 1 |
| 2 | +30 % | 80 % | 40,000 | map 1 |
| 3 | +45 % | 100 % | 120,000 | map 2 |

The GAU-8 burst already does full damage on the ground. It only gains the damage bonus. Tracers turn a hot
white-green from level 1, so the ammo is visible.

### Mk II / Mk III for every missile, rocket pod and bomb

Every secondary has marks 1–3 (`weaponLevels`), bought one after another from the weapon's detail panel (**UPGRADE**
button, key **U**) once the weapon is owned. A mark applies to every hardpoint and every jet carrying the weapon.

| mark | damage | ammo per hardpoint | flight | price | sold |
|---|---|---|---|---|---|
| Mk I | as today | as today | as today | (the weapon) | — |
| Mk II | +25 % | +1 | as today | 1.5 × the weapon's price | map 1 (AIM-120 / JDAM: map 2) |
| Mk III | +50 % | +2 | homing turn +20 %, speed +10 %; bomb blast +20 % radius | 4 × the weapon's price | map 2 |

For rockets the extra ammo is extra volleys. Twin pods (doc 37) double the ammo of whatever mark is fitted.

### Equipment: more levels

| item | levels on map 1 | added with map 2 |
|---|---|---|
| Armor Plating | +20 / +40 / +60 / **+80 %** hull — 3,000 · 7,000 · 14,000 · **28,000** | **+100 / +125 / +150 %** — 50,000 · 90,000 · 150,000 |
| Engine Tuning | +8 / +16 / +24 / **+30 %** speed — 3,000 · 7,000 · 14,000 · **24,000** | **+36 %** — 50,000 |
| Flare Dispenser | 2 / 4 / 6 / **8** flares — 2,000 · 4,000 · 8,000 · **12,000** | **10 / 12 / 14** — 20,000 · 35,000 · 55,000 |
| ECM Pod | −25 % bullet damage, missiles turn 30 % slower — 12,000; **−35 % / 40 %** — **28,000** | **−45 % / 50 %** — 70,000 |
| Damage Control | below 25 % hull restore 40 % once — 15,000; **restore 60 %** — **32,000** | **twice per mission** — 80,000 |
| Cargo Magnet | pickups drift in from 160 px — 6,000; **280 px** — **14,000** | — |
| Early-Warning Radar | bandits 4 s earlier — 8,000; **7 s earlier, range 1,400 px** — **18,000** | — |

(Armour level 4 moves from map 2 to map 1, and armour and flares at levels 4–5 cost a bit more than in doc 37. A
pilot who owns them keeps them.) Wave 2 adds stealth fighters, which only Early-Warning Radar level 2 shows on the
scope.

## Cost of each map's shop

| | today | new |
|---|---|---|
| map 1: jets 87,000 + gun + ammo + weapons + marks + equipment | 267,000 | ≈ 660,000 |
| map 2: jets 305,000 + gun 8–10 or second gun + ammo 3 + Mk III + two heavy weapons + twin pods + equipment | ≈ 1,050,000 | ≈ 2,100,000 (old-jet path) / 1,860,000 (new-jet path) |

Map 1 pays ≈ 574,000 and map 2 ≈ 2,060,000 (80 % kills, first clears, perfect take-offs). A pilot who buys as the
money comes in finishes map 1 without one of the jets, or with most of the kit, and map 2 with one firepower path
maxed. The first theater's prices are unchanged except gun level 4 (+2,000), so the son's start is the same.

## Stronger enemies (threat curve)

`scaleEnemy` / `scaleBossHp` / `hitScale` (`THREAT` in `game/combat.ts`, doc 05) bend upwards with difficulty
(d = mission difficulty including the challenge level, `x = d − 1`). The Pacific stays within a few percent of today:

| | formula | m06 | m12 | m18 | m24 | m30 | m45 | m60 |
|---|---|---|---|---|---|---|---|---|
| enemy HP | × (1 + 0.06 x + 0.003 x²) | +6 % | +22 % | +43 % | +67 % | +92 % | +160 % | +230 % |
| boss HP | × (1 + 0.05 x + 0.002 x²) | +4 % | +16 % | +31 % | +49 % | +69 % | +121 % | +176 % |
| enemy hits | × (1 + 0.02 x) | × 1.10 | × 1.22 | × 1.34 | × 1.46 | × 1.58 | × 1.88 | × 2.18 |

(HP and boss HP as a change against today's linear scaling; hits as a factor, where today they do the same damage on
every mission.) All enemy hits go through the mission scene's `playerHit`, so bullets, flak, missiles and collisions
all scale. Fire rate, bullet speed, bounty and formation sizes keep today's formulas. A first try with gentler factors
(HP 0.002 x², hits 0.012 x) left map 1 as easy as today for a pilot who keeps buying (see Balance), so the curve was
steepened.

## Save

`gunLevel` 1–10, `gun2Level` 0–7, `ammoLevel` 0–3 (missing = 0), `weaponLevels` per weapon 1–3 (missing = 1, above 1
only for owned weapons), equipment levels up to the new maximum. Older builds clamp a newer save back to their caps:
the usual one-way upgrade (docs 08, 35, 37).

## Business Rules

- Map-1 goods: gun 1–7, uranium ammo 1–2, Mk II of the five map-1 weapons, equipment up to the map-1 column.
  Everything else needs map 2 open (`locked` otherwise, forged clicks included).
- Upgrades go one level at a time, cost the listed price, and never change what is already owned.
- Uranium ammo multiplies gun damage (main gun, second gun, GAU-8 burst) and sets the gun's ground factor.
- A weapon's mark sets its damage, ammo per hardpoint and flight for every jet.
- Kit score (doc 38) also counts the ammo level × 10 and every mark above Mk I × 4.

## Balance

Bot playtest (2026-10-28, doc 35 method: invulnerable bot that always fires, follows the boss or the nearest target,
sidesteps bullets close in front, fires missiles and bombs at matching targets, E when charged; damage taken in hulls
of the jet's own maximum per minute, three runs each, mean). **The pilot of each run owns what a pilot who buys as the
money comes in owns at that mission**: income from `generateTimeline` (65 % of the bounties, first clears, good
take-offs), spent in a fixed sensible order (gun, AIM-9, rockets, armour, F-14, …; map-2 goods from m31), today's
prices and caps on today's build, the new ones on this one. F-14 from m06, the F-16 before.

| mission | today: kit | today: hulls/min, boss | new: kit | new: hulls/min, boss |
|---|---|---|---|---|
| m05 | gun 3 | 0.26 | gun 3 | 0.33 |
| m11 | gun 4 | 0.30 | gun 4 | 0.54 |
| m17 | gun 5, armour 3 | 0.05 | gun 5, uranium 1 | 0.09 |
| m18 BLACKJACK | gun 5 | 0.54, 18–38 s | gun 5, uranium 1 | 1.41, 32–52 s |
| m23 | everything on map 1 | 0.50 | gun 6, Mk II AIM-9 | 0.70 |
| m24 TYPHOON | everything | 1.61, 27 s | gun 6, armour 4 | 1.84, 25 s |
| m29 | everything | 1.33 | gun 6, uranium 2, three Mk II | 1.66 |
| m30 LEVIATHAN | everything | 1.56 | same | 1.97 |
| m35 | gun 8, armour 5 (bought at once) | 0.62 | gun 7, armour 4 | 2.84 |
| m42 CONDOR | gun 8 | 1.30, 21 s | gun 8, uranium 3 | 2.46, 18–35 s |
| m47 | gun 8 | 1.95 | gun 9, Mk III | 2.72 |
| m53 | gun 8 | 1.86 | gun 10 | 2.49 |
| m60 COLOSSUS | gun 8 | 1.86, 28 s | gun 10, armour 7, Mk III | 4.04, 30–33 s |

The owner's own case, today's build with the whole map-1 shop bought by the Arctic: m12 0.43 (SANDSTORM 22 s), m17
0.03, m18 0.34 (BLACKJACK 18–39 s).

- **Today a pilot who keeps buying owns the whole map-1 shop by m23** and banks the rest (264,000 unspent at m30,
  enough to buy gun 8 and armour 5 the moment map 2 opens). Hence the owner's "everything is already maxed out".
  With the new prices the same pilot is still buying at m60, and at no checkpoint owns everything.
- **The Pacific plays as today** (m05 0.26 → 0.33, within the bot's noise of 0.1–0.7). From the Gulf to the Arctic
  the same pilot takes 1.5–2.6 × today's damage, and BLACKJACK lasts about twice as long. The later map-1 theaters
  are 1.2–1.4 × harder, even though the pilot now flies gun 6 with uranium ammo instead of gun 5.
- **Map 2 is 1.3–2 × harder**, and its opening is 4.6 × harder (m35). That part comes from the economy, not the
  curve: nobody arrives with a quarter of a million banked any more, so gun 8 comes around m41 instead of at m31.
  The final mission is the hardest of all (4 hulls/min for the bot; a person dodges far better), and the new jets'
  double firepower (doc 37) is the way through.
- Strike objectives that the bot missed (m47, m53) were missed on today's build too (targets not focused).
- **Existing pilots** keep everything they own. A pilot sitting on a high challenge level (doc 38) feels the steeper
  curve at once. That is intended: the level steps down after seven failures with an upgrade in between, and they
  now have new things to buy.
- First try (gentler: HP 0.002 x², boss 0.0015 x², hits 0.012 x), for the record: m11 0.52, m18 0.69, m23 0.49,
  m24 1.58, m29 0.89, m30 1.70, m35 1.44, m42 1.87, m47 2.24, m53 1.97, m60 2.28. Map 1 came out as easy as today, so
  the curve was steepened to the factors above.
