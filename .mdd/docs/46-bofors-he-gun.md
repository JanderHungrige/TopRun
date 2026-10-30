---
id: 46-bofors-he-gun
title: Bofors HE Gun - An Always-On 40 mm Third Gun Firing Explosive Shells, Levels 1–10 on Map 2
edition: TopRun
depends_on: [43-deep-arsenal, 05-mission-combat, 37-double-firepower]
relates: [43-deep-arsenal, 45-incendiary-ammo, 44-new-adversaries]
source_files:
  - src/data/he-gun.ts
  - src/game/he-gun.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/game/save.ts
  - src/game/challenge.ts
  - src/core/sfx-recipes.ts
  - src/render/icons.ts
  - src/render/cockpit/gauges.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/shells.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-render.ts
  - src/i18n/ui-en-arsenal.ts
  - src/i18n/ui-de-arsenal.ts
routes: []
models:
  - "SaveData.heLevel 0–10 (new, missing = 0)"
test_files:
  - tests/unit/he-gun.test.ts
data_flow: writes-existing
last_synced: 2026-10-30
status: in_progress
phase: all
mdd_version: 11
tags: [he-gun, bofors, cannon, explosive, splash, gun, hangar, arsenal, map-2, balance]
path: Game/Hangar/Bofors HE Gun
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (heLevel parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 46 — Bofors HE Gun

## Purpose

Wave 3 of Arsenal and Adversaries. Owner, 2026-10-30: *"Add a weapon. A small cannon that shoots explosive rounds.
Low frequency."* The owner chose a **third gun, always on**: no hardpoint, unlimited shells, firing with the main gun,
its own upgrade ladder. It fills the gap between the gun (fast, single targets) and the rocket pod (area, limited):
slow and punchy, and every shell bursts.

## The item

**Bofors 40 mm HE Gun**, WEAPONS tab, after the second gun. On sale once map 2 is open; every jet carries it.

| level | shells/s | damage | blast radius | price |
|---|---|---|---|---|
| 1 | 1.0 | 150 | 40 px | 50,000 |
| 2 | 1.0 | 185 | 44 px | 65,000 |
| 3 | 1.1 | 225 | 48 px | 80,000 |
| 4 | 1.1 | 270 | 52 px | 100,000 |
| 5 | 1.2 | 320 | 56 px | 120,000 |
| 6 | 1.2 | 375 | 60 px | 145,000 |
| 7 | 1.3 | 435 | 64 px | 170,000 |
| 8 | 1.3 | 500 | 68 px | 200,000 |
| 9 | 1.4 | 570 | 72 px | 235,000 |
| 10 | 1.5 | 650 | 76 px | 275,000 |

At level 10 that is about 1,000 damage a second on one target (a fifth of a level-20 gun), and as much again on every
enemy standing in the blast.

## In the mission

- While the gun fires (SPACE / trigger held), the Bofors fires too, from under the nose, at its own rate.
- The shell flies straight ahead at 620 px/s. It **bursts** on the first enemy it touches (air, ground or sea) or on
  the boss, or in the air after 1.1 s (about 680 px).
- The burst does the shell's **full damage to every enemy within the blast radius**, air and ground alike: explosive,
  so no ground factor and the bunker's armour (doc 44) doesn't apply. The boss takes it once when the blast reaches
  it.
- Not changed by uranium or incendiary ammo, power-ups or jamming.
- **Look and sound:** an orange shell with a short smoke trail; the burst is a small explosion with a white shock
  ring the size of the blast. Each shot is a deep thump, lower than the gun.
- **Cockpit:** "40 MM" and the level in small type on the cannon panel, lit while the gun fires.

## Business Rules

- Map 2 only (`locked` before, forged clicks included); one level at a time, at the listed price.
- Every jet carries it once bought; it takes no hardpoint and has no ammo count.
- The kit score (doc 38) counts its level × 10.
- Pure logic in `src/game/he-gun.ts` (on sale, price, buying, the shell's numbers, who is in a blast); the table in
  `src/data/he-gun.ts`.

## Save

`heLevel` 0–10 (missing = 0). Older builds ignore it: the usual one-way upgrade.

## Balance

Bot playtest: see doc 43, Balance (wave 3).
