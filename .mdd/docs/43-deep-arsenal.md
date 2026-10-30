---
id: 43-deep-arsenal
title: Deep Arsenal - Gun Levels to 20, Uranium Ammo, Mk II–VI Weapons, Doubled Equipment Levels, Stronger Enemies
edition: TopRun
depends_on: [02-hangar-economy, 05-mission-combat, 35-second-map, 37-double-firepower, 38-challenge-level]
relates: [02-hangar-economy, 05-mission-combat, 37-double-firepower, 38-challenge-level, 45-incendiary-ammo, 46-bofors-he-gun]
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
  - src/render/items.ts
  - dev/item-pictures.py
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
  - "SaveData.gunLevel 1–20 (wave 1: 1–10), gun2Level 0–14, ammoLevel 0–6, weaponLevels: Record<SecondaryId, 1–6>, equipment levels up to the doubled caps"
test_files:
  - tests/unit/arsenal.test.ts
  - tests/unit/firepower.test.ts
  - tests/unit/economy.test.ts
  - tests/unit/combat.test.ts
  - tests/unit/map-two-ladders.test.ts
data_flow: writes-existing
last_synced: 2026-10-30
status: in_progress
phase: all
mdd_version: 11
tags: [weapons, gun, upgrades, uranium-ammo, mk-ii, mk-vi, equipment, hangar, economy, balance, difficulty, arsenal, map-2, pay]
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

The GAU-8 burst already does full damage on the ground. It only gains the damage bonus. From level 1 the tracers
turn a hot white-green inside a light green glow that flickers round by round (owner: "a light green shimmering
colour"), so the ammo is visible. The shop shows a generated pixel picture (three 30 mm rounds with dark penetrator
tips and a green ring, doc 02).

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

## Map 2 doubled (wave 3, 2026-10-30)

Owner: *"In world two, there are almost no weapons etc to buy as everything is already maxed out. But the enemies get
harder. I suggest that every item gets the same improvement levels to buy on top as they have now."* Answer: **every
ladder gets as many new levels again, all on map 2**; the shop is about 1.5 × what map 2 pays; map-2 enemies get
tougher to match. Map 1 does not change. Two new items join the ladders: incendiary ammo (doc 45) and the Bofors
40 mm HE gun (doc 46).

### Gun levels 11–20 (old jets: F-16, F-14, SR-71)

| level | shots/s | damage | barrels | DPS | price |
|---|---|---|---|---|---|
| 11 | 23 | 18 | 6 | 2,484 | 250,000 |
| 12 | 23 | 20 | 6 | 2,760 | 265,000 |
| 13 | 24 | 21 | 6 | 3,024 | 280,000 |
| 14 | 24 | 23 | 6 | 3,312 | 300,000 |
| 15 | 25 | 24 | 6 | 3,600 | 320,000 |
| 16 | 25 | 22 | 7 | 3,850 | 340,000 |
| 17 | 26 | 23 | 7 | 4,186 | 360,000 |
| 18 | 26 | 25 | 7 | 4,550 | 385,000 |
| 19 | 27 | 26 | 7 | 4,914 | 410,000 |
| 20 | 27 | 28 | 7 | 5,292 | 435,000 |

About +8–11 % a level; level 20 is 2.4 × level 10. The seventh barrel (levels 16–20) fires straight ahead from the
nose.

### New jets (A-10, F-35, Tornado): main gun and second gun 8–14

The pilot's gun level is one ladder (levels 1–20). A new jet's main gun follows it up to **14** (was 7), and the
**second gun** goes to **14** (was 7). Levels 8–14 of a new jet's guns come from their own table, each gun about half
an old jet's gun at the same point of the ladder, so two level-14 guns (5,250 DPS) match one level-20 gun (5,292),
doc 37's rule:

| level | shots/s | damage | barrels | DPS | second gun price |
|---|---|---|---|---|---|
| 8 | 17 | 15 | 5 | 1,275 | 120,000 |
| 9 | 18 | 16 | 5 | 1,440 | 150,000 |
| 10 | 18 | 18 | 5 | 1,620 | 185,000 |
| 11 | 20 | 18 | 5 | 1,800 | 225,000 |
| 12 | 20 | 21 | 5 | 2,100 | 270,000 |
| 13 | 21 | 22 | 5 | 2,310 | 320,000 |
| 14 | 21 | 25 | 5 | 2,625 | 375,000 |

(The main gun's levels cost what the shared ladder costs: 110,000 … 300,000 for 8–14.) Power-ups lift the main gun to
20 on an old jet and 14 on a new one.

**Cockpit:** the cannon panel keeps its five lamps: levels 1–5 green, 6–10 cyan, **11–15 violet, 16–20 white**, each
colour lit over the one before. The second gun's small lamps: 1–5 green, 6–10 cyan, 11–14 violet.

### Uranium ammo 4–6

| level | gun damage | gun vs ground | price |
|---|---|---|---|
| 4 | +60 % | 100 % | 150,000 |
| 5 | +75 % | 100 % | 185,000 |
| 6 | +90 % | 100 % | 225,000 |

### Mk IV – Mk VI

| mark | damage | ammo per hardpoint | flight | price |
|---|---|---|---|---|
| Mk IV | +75 % | +3 | homing turn +30 %, speed +15 %; bomb blast +30 % radius | 6 × the weapon's price |
| Mk V | +100 % | +4 | turn +40 %, speed +20 %; blast +40 % | 9 × |
| Mk VI | +125 % | +5 | turn +50 %, speed +25 %; blast +50 % | 13 × |

The hangar names the marks Mk I … Mk VI; the UPGRADE button (key U) buys the next one.

### Equipment, levels added on map 2

| item | new levels | prices |
|---|---|---|
| Armor Plating | +175 / +200 / +225 / +250 / +275 / +300 / +325 % hull | 170,000 · 185,000 · 200,000 · 215,000 · 230,000 · 250,000 · 270,000 |
| Engine Tuning | +40 / +44 / +48 / +52 / +56 % speed | 60,000 · 70,000 · 80,000 · 90,000 · 100,000 |
| Flare Dispenser | 16 / 18 / 20 / 22 / 24 / 26 / 28 flares | 65,000 · 75,000 · 85,000 · 95,000 · 105,000 · 115,000 · 125,000 |
| ECM Pod | −50 / −55 / −60 % bullet damage, missiles turn 55 / 60 / 65 % slower | 90,000 · 115,000 · 145,000 |
| Damage Control | restore 70 % twice · 80 % twice · 80 % three times | 100,000 · 125,000 · 155,000 |
| Cargo Magnet | pickups from 400 px · 520 px, pulled in faster | 25,000 · 40,000 |
| Early-Warning Radar | bandits 10 s earlier, range 1,700 px · 13 s earlier, range 2,000 px, **the scope keeps working while jammed** | 30,000 · 45,000 |

### Map 2 pays more

Doubling every ladder with prices that keep rising costs ≈ 12 M on map 2, six times what map 2 pays today. So map 2
pays more, ramping by **mission number** (not by difficulty: a pilot on a high challenge level must not out-earn the
shop again): on map 2 the mission reward, every enemy's bounty and the boss bounty (and with it the cash pickups)
are multiplied by

`pay = 1 + 0.08 x + 0.004 x²`, `x = mission number − 30` → m31 × 1.08, m35 × 1.5, m40 × 2.2, m45 × 3.1, m50 × 4.2,
m55 × 5.5, m60 × 7.0. Map 1 pays as today.

## Cost of each map's shop

| | today | new |
|---|---|---|
| map 1: jets 87,000 + gun + ammo + weapons + marks + equipment | 267,000 | ≈ 660,000 |
| map 2: jets 305,000 + gun 8–10 or second gun + ammo 3 + Mk III + two heavy weapons + twin pods + equipment | ≈ 1,050,000 | ≈ 2,100,000 (old-jet path) / 1,860,000 (new-jet path) |

Map 1 pays ≈ 574,000 and map 2 ≈ 2,060,000 (80 % kills, first clears, perfect take-offs). A pilot who buys as the
money comes in finishes map 1 without one of the jets, or with most of the kit, and map 2 with one firepower path
maxed. The first theater's prices are unchanged except gun level 4 (+2,000), so the son's start is the same.

**Wave 3:** map 2's shop on one path (gun 8–20 or the new jets' guns 8–14 + second gun 8–14, uranium 3–6, the HE gun,
every equipment level, Mk III–VI of four weapons) costs ≈ 12.2 M (old jets) / 11.7 M (new jets), and map 2 now pays
≈ 8.1 M at 80 % kills: about 1.5 ×. A pilot who buys as the money comes in still has about a third of the shop left at
m60 and chooses what to buy first.

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

`gunLevel` 1–20, `gun2Level` 0–14, `ammoLevel` 0–6 (missing = 0), `weaponLevels` per weapon 1–6 (missing = 1, above 1
only for owned weapons), equipment levels up to the new maximum (wave 3; wave 1 had 10 / 7 / 3 / 3). Older builds clamp a newer save back to their caps:
the usual one-way upgrade (docs 08, 35, 37).

## Business Rules

- Map-1 goods: gun 1–7, uranium ammo 1–2, Mk II of the five map-1 weapons, equipment up to the map-1 column.
  Everything else needs map 2 open (`locked` otherwise, forged clicks included).
- Wave 3: map 2 sells gun 8–20 (a new jet's main gun follows to 14), second gun 1–14, uranium 3–6, Mk III–VI,
  equipment up to the doubled maximum. Map 2 pays more by mission number; map 1 is unchanged.
- Upgrades go one level at a time, cost the listed price, and never change what is already owned.
- Uranium ammo multiplies gun damage (main gun, second gun, GAU-8 burst) and sets the gun's ground factor.
- A weapon's mark sets its damage, ammo per hardpoint and flight for every jet.
- Kit score (doc 38) also counts the ammo level × 10 and every mark above Mk I × 4 (wave 3: both ammo types × 10 and
  the HE gun's level × 10).

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
