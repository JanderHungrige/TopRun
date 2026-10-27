---
id: 37-double-firepower
title: Double Firepower - Second Gun and Twin Pods for the New Jets, More Levels and Two Heavy Weapons
edition: TopRun
depends_on: [02-hangar-economy, 05-mission-combat, 35-second-map, 36-new-jets]
relates: [02-hangar-economy, 05-mission-combat, 36-new-jets, 08-pilot-profiles]
source_files:
  - src/data/types.ts
  - src/data/weapons.ts
  - src/data/equipment.ts
  - src/game/firepower.ts
  - src/game/economy.ts
  - src/game/save.ts
  - src/game/loadout.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/weapons-fire.ts
  - src/render/cockpit/gauges.ts
  - src/render/icons.ts
  - src/i18n/content-de.ts
  - src/scenes/map.ts
  - src/scenes/mission/cockpit-view.ts
routes: []
models:
  - "SaveData.gunLevel 1–8 (was 1–5), gun2Level 0–5, twinSecondaries: SecondaryId[]; equipment levels up to the map-2 caps"
test_files:
  - tests/unit/firepower.test.ts
data_flow: writes-existing
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [weapons, gun, upgrades, hangar, economy, second-front, twin-pods, amraam, jdam]
path: Game/Hangar/Double Firepower
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 37 — Double Firepower

## Purpose

Wave 3 of the Second Front initiative (owner, 2026-10-27): on map 2 "weapons can be bought twice — next to the
level-3 minigun a second minigun can be mounted that levels up on its own, twin rocket pods etc., massive firepower.
This double firepower is for the three new jets. For the old three, more levels per weapon become buyable, and
maybe a stronger air-to-air and air-to-ground weapon. All of it only shows in the hangar once map 2 is reached."

## Gate

Everything here appears in the hangar only once map 2 is open (`mapTwoOpen`, doc 35) and cannot be bought before
(`locked`, a forged click included). Map 1 and a pilot who has not reached map 2 see today's hangar.

## New jets (A-10, F-35, Tornado): everything twice

- **Second gun** (`gun2Level` 0–5, 0 = none): its own item in the WEAPONS tab, bought and levelled on its own
  (level 1 10,000 · 2 5,000 · 3 10,000 · 4 18,000 · 5 30,000). It uses the same level table as the gun and fires
  together with it from the wing roots, the barrels alternating left and right. Power-ups lift both guns.
  The main gun of a new jet counts at most level 5 — levels 6–8 are the old jets' path.
- **Twin pods:** every missile, rocket pod and bomb can be bought a second time (same price again,
  `twinSecondaries`). On a new jet a weapon with twin pods carries double ammo and every trigger fires both pods —
  two missiles side by side, two rocket fans, a pair of bombs. On the old jets twin pods do nothing (the hangar
  says so). Bought from the weapon's detail panel: **TWIN PODS** button, key **E**.

## Old jets (F-16, F-14, SR-71): more levels

- **Gun levels 6–8** (the new jets' main gun stays at 5):

  | level | shots/s | damage | barrels | price | DPS |
  |---|---|---|---|---|---|
  | 5 (today) | 15 | 12 | 4 | 20,000 | 720 |
  | 6 | 17 | 13 | 4 | 30,000 | 884 |
  | 7 | 18 | 14 | 5 | 45,000 | 1,260 |
  | 8 | 20 | 15 | 5 | 65,000 | 1,500 |

  Two level-5 guns on a new jet give 1,440 DPS, so level 8 on an old jet matches double firepower. A power-up
  lifts levels 6–7 by one like today; at level 5 it still stops at 5 (map 1 unchanged).
- **Equipment beyond today's caps** (shared by all jets, like all equipment): Armor Plating levels 4–5 (+80 % /
  +100 % hull, 25,000 / 40,000), Flare Dispenser levels 4–5 (8 / 10 flares, 12,000 / 18,000).
- **Two heavy weapons** (any jet, map 2):
  - **AIM-120 AMRAAM** (air): 24,000, 4 per hardpoint, 180 damage, fast (640) and agile (turn 4.2), 0.3 s between
    launches.
  - **GBU-31 JDAM** (ground): 28,000, 2 per hardpoint, a 2,000 lb bomb — 520 damage in a 130 px blast.

## Cockpit

The cannon panel keeps its five lamps: levels 6–8 light the first one to three lamps cyan over the green row. A
second gun shows as a row of five small lamps under them.

## Save

`gunLevel` 1–8 (parsed with the new cap), `gun2Level` 0–5 (missing = 0), `twinSecondaries` (only ids also in
`ownedSecondaries`), equipment levels up to the new maximum. Older builds clamp a newer save back to their caps — the
usual one-way upgrade (docs 08, 35).

## Business Rules

- Nothing from this doc is visible or buyable before map 2 is open.
- Second gun and twin pods only act on the A-10, F-35 and Tornado; gun levels 6–8 only on the F-16, F-14 and SR-71.
- Twin pods double ammo and launch both pods per trigger.

## Balance

Bot playtest (2026-10-27, doc 35 method: invulnerable runs, damage taken in hulls of the jet's own maximum per
minute and raw per minute, E used whenever charged). Full map-2 kit: armor 5, flares 5, all other equipment; the
F-14 at gun level 8 with AIM-54 / AIM-120 / JDAM / AGM-65, the new jets at gun 5 + second gun 5 with twin pods on
AIM-120 / JDAM / AGM-65. In brackets: the same jet in wave 2 (map-1 kit, doc 36).

| mission | F-14 (gun 8) | A-10 | F-35 | Tornado |
|---|---|---|---|---|
| m45 intercept | 2.31 · 738 raw (3.19) | 1.21 · 533 raw (2.00) | — | — |
| m56 destroyers | 8/4 sunk, 2.18 (2/4 – 4/4) | 8/4 sunk, 1.22 (6/4) | — | 8/4 sunk, 1.81 (2/4) |
| m60 COLOSSUS | 2.36, boss 26 s (4.07, 51 s) | 1.35, boss 18 s (2.64, 33 s) | 1.05, boss 23 s (2.41, 49 s) | — |

- Double firepower is what makes late map 2 comfortable: the new jets take about half the damage of a fully
  levelled old jet and kill the final boss in 18–23 s. A fully levelled old jet lands about where the A-10 was in
  wave 2, so levels 6–8 are worth buying without catching up with the new jets.
- m56's destroyers stop being a wall for every jet (8 of 4).
- The whole kit costs about 740,000 — more than map 2 pays out — so pilots choose what to build. No retune.
