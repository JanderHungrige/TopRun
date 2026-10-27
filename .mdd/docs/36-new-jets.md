---
id: 36-new-jets
title: New Jets - A-10 Warthog, F-35 Lightning II and Tornado with Their E Abilities
edition: TopRun
depends_on: [02-hangar-economy, 05-mission-combat, 35-second-map]
relates: [02-hangar-economy, 05-mission-combat, 09-paint-jobs, 04-carrier-takeoff, 35-second-map, 37-double-firepower]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/game/jets.ts
  - src/game/combat.ts
  - src/game/economy.ts
  - src/scenes/hangar-items.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/boss.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/mission-render.ts
  - src/core/sfx-recipes.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/livery-art.ts
  - src/render/planes/a10-top.ts
  - src/render/planes/a10-side.ts
  - src/render/planes/f35-top.ts
  - src/render/planes/f35-side.ts
  - src/render/planes/tornado-top.ts
  - src/render/planes/tornado-side.ts
  - src/i18n/content-de.ts
routes: []
models:
  - "SaveData.ownedPlanes / selectedPlane / loadout / livery: plane ids a10, f35, tornado"
test_files:
  - tests/unit/new-jets.test.ts
  - tests/unit/economy.test.ts
data_flow: writes-existing
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [planes, jets, a-10, f-35, tornado, special, stealth, nuke, cannon, hangar, second-front]
path: Game/Hangar/New Jets
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 36 — New Jets

## Purpose

Wave 2 of the Second Front initiative (owner, 2026-10-27): once map 2 is open (doc 35) the hangar sells three new
jets, each with its own **E** ability — the A-10 Warthog ("a mega minigun with a very high rate of fire, with the
iconic A-10 cannon sound"), the F-35 ("invisible: enemies do not attack meanwhile") and the Tornado ("a challenge for
hardcore pilots: so old it slowly loses hull during every mission; E: a nuclear missile"). Double firepower for these
jets is wave 3 (doc 37); new camos are wave 4 (doc 09).

## Availability

- The JETS tab lists the A-10, F-35 and Tornado only once map 2 is open (`mapTwoOpen`, doc 35: m30 cleared);
  before that the hangar looks exactly as it does today. `PlaneDef.campaign` = 2 marks them; `jetOnSale(save, id)`
  decides. Buying a map-2 jet before then fails with `locked` (economy), so a forged click cannot buy one either.
- Once bought they fly everywhere, map-1 replays included (initiative decision). Map 1's missions, rewards and
  difficulty do not change.
- Old saves: the new ids join `PLANE_IDS`; `parseSave` keeps them like any plane; loadout and livery records get
  empty / factory entries for them.
- Pointing them out: the admiral's M30 finale adds "the hangar has three new birds for the second front"
  (`adm.newJets`, after `adm.globe`), and while map 2 is open but none of its jets is owned the crew chief greets
  with them (`chief.helloNewJets`, `newJetsWaiting`) — pilots who cleared M30 before this wave learn it there.

## The jets

| id | Name | Price | Hull | Speed | Hardpoints | Gun × | E ability (duration, cooldown) |
|----|------|-------|------|-------|------------|-------|--------------------------------|
| `a10` | A-10 Warthog | 90,000 | 220 | 270 | 4 | 1.5 | **GAU-8 Burst** — 3 s, 16 s |
| `f35` | F-35 Lightning II | 140,000 | 170 | 360 | 4 | 1.3 | **Stealth** — 8 s, 18 s |
| `tornado` | Tornado | 75,000 | 190 | 350 | 4 | 1.3 | **Nuclear Strike** — one missile, 55 s; hull drain |

All secondaries mount on all three (the AIM-54 stays F-14 only). Prices sit at 6–10 map-2 mission rewards.

### A-10 — GAU-8 Burst (`cannon`)

- E fires the 30 mm cannon on its own for 3 s, whether or not the gun key is held: 50 rounds/s straight ahead with a
  ±1.5° jitter, 16 damage per round × the jet's gun factor (1.5 → 24). Cannon rounds hit **ground targets at full
  damage** (the normal gun does half, doc 05) — damage source `cannon`. ≈ 1,200 DPS on air and ground, about three
  times the F-14's level-5 gun on ground targets.
- Sound: the synthesized "BRRRT" — a very fast buzz (≈ 65 Hz, the gun's 3,900 rounds/min) with a growl and
  distortion, held for the burst, then the rolling echo; synthesized like every sound (no recordings). Small recoil
  shake.
- Toughest airframe (hull 220) and the slowest jet (270).

### F-35 — Stealth (`stealth`)

- For 8 s the jet is invisible to the enemy: enemies and boss parts **hold fire**, enemy missiles already in flight
  lose lock and fly on straight, kamikaze drones stop homing. Bullets already in the air still hit — stealth does not
  make the jet invulnerable. Ramming still damages both.
- The jet and its shadow are drawn see-through (45 % / 30 %) with a pulsing cyan outline, so the pilot still finds
  it on a busy screen; the special button shows the 8 s running down.

### Tornado — age and the Nuclear Strike (`nuke`)

- **Age:** while alive in a mission the Tornado loses **0.15 % of its maximum hull per second** (≈ 20 % over a full
  mission). The drain alone never takes it below 10 % hull — the enemy has to finish it. Repairs (pickups) work as
  usual; damage control (doc 02) is not triggered by the drain.
- **E — Nuclear Strike:** a missile climbs straight ahead for 1.2 s and detonates: a white flash over the playfield
  and a shock ring. Every enemy on screen (air, ground, sea, including destroyers) is destroyed and counts as a kill
  (objectives included); every enemy bullet and missile is cleared; the boss core loses 20 % of its maximum HP and
  each boss part half of its own. Big shake, the deepest explosion sound. One missile per 55 s.

## Specials in code

- `src/game/jets.ts` holds the pure rules: `jetOnSale`, `specialRules(special)` → `{ invulnerable, stealth }`
  (roll and dash invulnerable as today; cannon, stealth, nuke and wingman not), `ageDrain(hull, maxHull, dt)`,
  `nukeBossDamage(maxHp)`, `cannonDamage(gunMul)`, constants.
- `scenes/mission/specials.ts` activates and ticks every special (moved out of `mission-scene.ts`): roll dash,
  wingman, SR-71 dash, the cannon stream, the nuke missile and its detonation, the Tornado drain.
- Enemy AI, boss parts and enemy missiles ask `player.stealthed` before firing / homing.

## Art

- Each jet is code-drawn in the existing plane kit (`render/planes/`), top view (mission, hangar) and side view
  (carrier launch, hangar, minigames), with real proportions like the others:
  - A-10: straight thick wing, twin engine pods on the rear fuselage, twin fins on a high tailplane, the GAU-8
    muzzle at the nose (length ≈ 1.0 × span).
  - F-35: diamond wing and tailplanes, canted twin fins, single nozzle, chined nose (length ≈ 1.45 × span).
  - Tornado: variable-sweep wing (shown at mid sweep), big single fin, twin nozzles, long nose
    (length ≈ 1.3 × span at mid sweep).
- Factory schemes (doc 09 STANDARD): A-10 two-tone grey; F-35 dark radar grey with lighter edge panels; Tornado a
  Bundeswehr-style grey-green splinter camo. **No national insignia, unit marks or text** (public repo). All
  existing paint jobs fit the new airframes; new camos are wave 4.
- Minigames that show the player's jet (formation, flyby, motorbike) and the picture wall get each jet's metrics.

## Business Rules

- Map-2 jets are hidden and cannot be bought until map 2 is open; owned jets fly on both maps.
- A-10 cannon rounds do full damage to ground targets; the regular gun keeps doing half.
- Stealth stops attacks but not damage from what is already flying.
- The Tornado's age drain never takes the hull below 10 %.
- The nuke kills every enemy on screen and takes 20 % of a boss's maximum HP per hit.

## Balance

Bot playtest (2026-10-27, same invulnerable bot as doc 35: damage taken in hulls of the jet's own maximum per minute,
the bot fires E whenever it is charged, so stealth and the nuke are spent less cleverly than a pilot would). Full
map-1 kit otherwise (gun level 5, all equipment); new jets carry AIM-9 / AGM-65 / Mk-82, the F-14 its AIM-54.

| mission | F-14 | A-10 | F-35 (6 s / 22 s, hull 150) | F-35 (8 s / 18 s, hull 170) | Tornado |
|---|---|---|---|---|---|
| m36 KRAKEN | 2.33, boss 38 s | 1.51, boss 24 s | 1.78, boss 41 s | 1.33, boss 38 s | 1.63, boss 32 s |
| m45 intercept | 3.19 (3 runs) | 2.00 | 3.21 (3 runs) | 2.42 (2 runs) | 2.76 |
| m50 SAMs | 3.85 (2 runs) | — | 3.26 (2 runs) | 1.97 (2 runs) | — |
| m56 destroyers | 4/4 and 2/4 sunk | 6/4 sunk, 2.61 | — | — | 2/4 sunk (3 runs), 3.2 |
| m60 COLOSSUS | 4.07, boss 51 s | 2.64, boss 33 s | — | 2.41, boss 49 s | 3.15, boss 39 s |

- Runs scatter by about ±20 %. The A-10 is the toughest and the tank killer (destroyer missions, bosses fall
  fastest); the Tornado sits between the F-14 and the A-10 and pays for its nuke with age (≈ 0.09 hulls/min more).
- **Retune:** with 6 s of stealth every 22 s and hull 150 the F-35 — the most expensive jet — was no better than the
  F-14 (3.21 vs 3.19 on m45). Stealth now runs **8 s every 18 s** and the hull is **170**: 25–50 % less damage than
  the F-14, on par with the A-10, which buys its strength with speed (270 vs 360).
- m56 "sink 4 destroyers" stays borderline for every jet without the cannon (doc 35: late map 2 counts on the
  new firepower); wave 3's double weapons re-check it.
