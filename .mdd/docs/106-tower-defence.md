---
id: 106-tower-defence
title: Tower Defence - Holding the Outpost on Map 7 with Towers on Build Pads, Supply and Waves
edition: TopRun
depends_on: [102-seventh-map, 103-tank-kit, 104-tank-drive, 105-steppe-world, 05-mission-combat]
relates: [102-seventh-map, 105-steppe-world, 107-steppe-lab]
source_files:
  - src/data/towers.ts
  - src/game/defence.ts
  - src/game/defence-layout.ts
  - src/game/steppe-lab.ts
  - src/game/objectives.ts
  - src/scenes/mission/defence-mission.ts
  - src/scenes/mission/tower-fire.ts
  - src/scenes/mission/defence-input.ts
  - src/scenes/mission/outpost-radio.ts
  - src/scenes/mission/radio.ts
  - src/scenes/mission/player-hit.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/boss.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/specials.ts
  - src/render/defence-field.ts
  - src/render/defence-hud.ts
  - src/render/tower-art.ts
  - src/core/input.ts
  - src/game/joystick.ts
  - src/render/portraits/types.ts
  - src/render/portraits/index.ts
  - src/ui/speech.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
  - src/i18n/lines-steppe-en.ts
  - src/i18n/lines-steppe-de.ts
  - src/game/dialogue-scripts.ts
  - dev/playtest-tank.ts
routes: []
models:
  - "MissionDef.defend?: number — the waves a defence holds (doc 102)"
  - "MissionTally.wavesHeld / outpostLost"
test_files:
  - tests/unit/defence.test.ts
  - tests/unit/towers.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [tower-defence, outpost, lanes, build-pads, towers, supply, waves, countdown, map-7, steppe, ortega, bot]
path: Game/Mission/Tower Defence
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-2
wave_status: complete
---

# 106 — Tower Defence

## Purpose

Owner, 2026-11-14: *"Machen wir einen mix aus arcade und tower defence."* — question round: the missions **alternate**,
drives as before and **defences** (doc 102: the 2nd, 4th and 6th mission of each theater). In a defence the pilot holds
an outpost at the bottom of the screen against the invasion army's columns: towers on build pads beside the lanes the
aliens march down, paid with **supply**, and the vehicle fighting among them.

## The field

- **No scroll:** the steppe stands still (`scrollMul` 0); the theater's floor, features and wind as in a drive.
- **The outpost** fills the bottom of the playfield (y ≥ 628): a sandbag wall with a gate per lane, tents, a radio mast,
  crates. It has **100 health**, a bar over it. It falls at 0: the sortie is lost (`tally.outpostLost`).
- **Lanes** (1–3, `defenceLayout(mission)`, pure): dirt paths from the top edge to a gate, winding in S-curves (ten
  points, x within 70–570, straightening toward the gate). 1 lane on m182 (the first defence), 2 up to the Red Badlands'
  end (m198), 3 on the last two theaters' defences. Seeded by the mission number, so a mission always has the same field.
- **Build pads** (`buildPads`, pure): 8 on one lane, 10 on two, 12 on three — round concrete pads 50–80 px off a lane,
  never on one, not overlapping (90 px apart), y 120–580, x 40–600.
- The vehicle drives anywhere above the outpost (y 70–600); it can't be hit by the outpost's own wall.

## Waves (`defenceWaves(mission)`, pure)

- `mission.defend` waves (5–10). Wave *k* (1 … N) has a **budget** of `24 × (1 + 0.45 (k − 1)) × (1 + 0.05 × difficulty)`
  points; units cost `max(2, round(hp / 15))` points (a crawler 2, a trooper 3, a rider 7, a tripod 17); the budget is
  spent on the mission's pool (ground kinds weighted 3, air kinds 1), in groups of 2–6 of a kind, each group on a lane
  (round robin), the kinds in a group 0.6 s apart, the groups 2 s apart. The last wave of a theater's 4th mission and
  every wave from the Salt Flats on that ends a mission brings the **WAR TRIPOD** (from m188) as its last group.
- **The countdown:** 15 s before wave 1 (time to build), 7 s after each wave is cleared (every unit dead or through the
  gate). **N** (pad: RT) calls the next wave early: **+3 supply** for every second left.
- A wave is **held** when its last unit is dead or through; `tally.wavesHeld` counts them. The defence is won when all
  N are held — on a boss mission the boss then comes (`BOSSES` as in a drive), but marches on to y 330, into the
  towers' reach, and must be killed; while it fights it shells the outpost: **1.5 health/s**.
- The waves never send what stands still (landing pods, plasma cannons): those stay in the drives.

## The army in a defence

- Ground units **march down their lane** at `0.35 × speed + 22` px/s (a crawler 46, a rider 64, a siege crawler 28),
  turning with it; they fire at the vehicle as in a drive.
- Air units fly their usual patterns; one that passes the bottom of the field over the outpost hits it.
- A unit that reaches the gate is gone and the outpost takes `leak = max(3, round(hp / 15))` (a crawler 3, a tripod
  17, the war tripod 173).
- A tripod's heat ray aims at the tower nearest the outpost within 260 px half of the time (`Defence.rayTarget`); a
  tower its bolts (`Bullet.heat`) hit **overheats**: it stops firing for 3 s (shown red, steaming).
- Spawners (doc 105) let their brood out on their lane.

## Supply

- **Start** 120 supply, +20 per wave of the mission (a 5-wave defence starts with 220).
- A **kill** pays `max(2, round(bounty / 6))` (a crawler 3, a trooper 5, a rider 12), shown as a small "+n" in green-gold.
- A **held wave** pays `40 + 10 × k`.
- The money of a drive is paid as usual on top (bounties, the reward).

## Towers (`TOWERS`, `src/data/towers.ts`)

| tower | id | build | upgrades | range | fires | targets |
|---|---|---|---|---|---|---|
| MG Nest | `mgnest` | 60 | 50 / 80 | 150 / 165 / 180 | 5 / 6.5 / 8 rounds/s of 8 / 10 / 12 | ground and air |
| Flak Tower | `flak` | 80 | 60 / 90 | 220 / 240 / 260 | a flak burst every 1.2 / 1.0 / 0.8 s, 30 / 40 / 55 over 40 px | air only |
| Mortar Pit | `mortarpit` | 100 | 70 / 100 | 300 (not within 60) | a shell every 2.4 / 2.1 / 1.8 s, 60 / 85 / 115 over 55 px | ground only |
| Tesla Tower | `tesla` | 120 | 80 / 120 | 130 | a zap every 1.0 s, 30 / 40 / 52, jumping to 3 / 4 / 5 | ground and air |
| Jammer | `jammer` | 70 | 50 / 80 | 140 / 160 / 180 | slows by 35 / 45 / 55 % | ground and air |
| Rocket Battery | `rockets` | 140 | 90 / 130 | 260 | 2 / 3 / 4 homing rockets of 45 every 2.5 s | ground and air |

- Built on a free pad, upgraded twice on it, **sold** for 60 % of what went into it.
- Wave 2 knows the **MG nest and the flak tower** from the start; the steppe lab (doc 107) invents the other four and the
  **marks** of all six: Mk II +25 % damage and +10 % range, Mk III +50 % and +20 % (`towerStats(id, level, mark)`).
- Towers fire at the target **furthest along its lane** within range (the first in line); flak only at air, mortar
  only at ground.
- Drawn in code in the steppe's sand and steel with the level as stripes; the barrel turns to the target.

## Controls

- **On a free pad** the build menu shows the known towers with their cost, the picked one marked: **1–6** pick
  (keyboard), **X** (pad: the weapon-switch button) cycles; **B** (pad: LT) builds the picked one.
- **On a tower:** B upgrades, **Delete** sells; its range ring shows.
- **N** (pad: RT) calls the next wave during a countdown.
- **Mouse / touch:** tap a pad: a ring of buttons round it (the towers to build, or UPGRADE and SELL); tap one.
- The HUD over the playfield: WAVE k / N, the countdown and the call bonus, SUPPLY; the picked tower and its cost.

## People

**Captain Rosa "Bastion" Ortega** commands the outposts and talks on the radio in a defence (her own speech box, her
portrait from doc 111 or a stand-in): the start, each wave coming, the last wave, the outpost under fire (below 50 and
25), a held defence; lines `ort.*`.

## The bot (dev/playtest-tank.ts)

Builds in a fixed order — an MG nest, a flak tower if the pool has fliers, then whatever it knows, on the free pad
nearest the outpost on each lane in turn, upgrades once everything is built — and drives along the lanes' middle
firing as the drive bot does; calls a wave early when it has nothing to buy. Lost when it builds nothing (a defence
needs its towers).

## In the mission scene

- `mission-scene.ts` was at the line limit: the player's hit moved to `player-hit.ts`. A defence sets `world.defence`,
  gives the radio to Captain Ortega (`OutpostRadio`, both implement `Radio`), holds the scroll at 0, feeds the defence's
  events to her (the boss's arrival to the usual WARNING), ends by `isDefenceOver` and names a fallen outpost
  (`mission.outpostLost`).
- New input actions: `build` (B, pad LT), `nextWave` (N, pad RT), `pick1`–`pick6` (1–6).

## Playtest (wave 2, 2026-11-14)

`dev/playtest-tank.ts`, the buying pilot's kit, one run each: m181 drive 0.73 hulls/min, kill share 0.75; m182 held 5/5,
the outpost untouched, 1.6 min; m184 held 6/6, untouched, 2.7 min; m186 held 6/6, HARVESTER down in 26 s, the outpost at
78. The first theater is gentle on purpose (learning the towers); the whole map's balance is wave 4's.

## Business Rules

- Pure: `defenceLayout`, `buildPads`, `defenceWaves`, `waveBudget`, `unitCost`, `leakDamage`, `startSupply`, `killSupply`,
  `waveSupply`, `callBonus`, `towerStats`, `sellValue`, `canBuild`, `towerTarget` (`src/game/defence*.ts`).
- `isDefenceOver(tally, waves, bossMission, playerDead)`: lost when the player died or the outpost fell; won when the
  waves are held (and the boss killed on a boss mission).
- `MissionDef.defend` set ⇒ the World gets no timeline (`timeline` empty) and a `Defence`; nothing changes for drives.
