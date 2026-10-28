---
id: 44-new-adversaries
title: New Adversaries - Six New Enemy Types and Three Mini-Bosses from the Gulf On
edition: TopRun
depends_on: [05-mission-combat, 35-second-map, 43-deep-arsenal]
relates: [05-mission-combat, 43-deep-arsenal, 03-campaign-map]
source_files:
  - src/data/types.ts
  - src/data/enemies.ts
  - src/data/reinforcements.ts
  - src/game/waves.ts
  - src/game/combat.ts
  - src/game/cockpit.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/mission-scene.ts
  - src/game/adversaries.ts
  - src/render/draw-enemies.ts
  - src/render/enemies/air-units.ts
  - src/render/enemies/mig25.ts
  - src/render/enemies/su57.ts
  - src/render/enemies/il22.ts
  - src/render/enemies/tu22m.ts
  - src/render/enemies/ground-2.ts
  - src/render/cockpit/radar.ts
  - src/render/cockpit/index.ts
  - src/render/cockpit/types.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/cockpit-view.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-en-arsenal.ts
  - src/i18n/ui-de-arsenal.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/mission/radio.ts
  - src/data/equipment.ts
routes: []
models: []
test_files:
  - tests/unit/adversaries.test.ts
  - tests/unit/waves.test.ts
  - tests/unit/dialogue.test.ts
data_flow: writes-existing
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [enemies, mini-boss, stealth, jammer, bunker, frigate, interceptor, waves, balance, adversaries]
path: Game/Mission/New Adversaries
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 44 — New Adversaries

## Purpose

Wave 2 of Arsenal and Adversaries (owner, 2026-10-28: "Can you think of more enemy types, to keep the
surprises/changes coming more often? Maybe at later levels add mini bosses in there. Stealth fighters, a base with
anti-air … just to keep it interesting"). Every theater from the Gulf on brings something new, and from the Arctic
on most missions have a mini-boss halfway through. Each new type asks for a different answer, so the deeper arsenal
of doc 43 is needed: stealth fighters need the gun or the radar, bunkers need bombs or uranium ammo, jammers must
be shot first.

## New enemy types

| kind | name | layer | HP · speed · radius · bounty | weapons | what it asks for | from |
|---|---|---|---|---|---|---|
| `shilka` | ZSU-23-4 Shilka | ground, moves | 75 · 30 · 16 · 50 | aimed 1.4 s, flak 3.8 s | rockets, bombs | Gulf m08 |
| `bunker` | Hardened Bunker | ground | 160 · 0 · 20 · 70 | spread 2.4 s | bombs, Maverick, uranium ammo: concrete takes **half the gun's damage** (armour 0.5; the A-10's GAU-8 ignores it) | Gulf m09 |
| `foxbat` | MiG-25 Foxbat | air | 90 · 400 · 22 · 80 | missile 2.6 s | AIM-9, flares: comes as a fast pair straight down the screen | Gulf m10 |
| `jammer` | Il-22 Jammer | air | 260 · 60 · 30 · 160 | none | shoot it first: while one is on screen the radar shows **static** and the player's missiles turn at **half rate** | Arctic m13 |
| `frigate` | Missile Frigate | sea | 300 · 25 · 34 · 180 | missile 3.6 s, flak 2.2 s | Maverick, bombs (one per wave, like the destroyer) | Arctic m14 |
| `felon` | Su-57 Felon | air | 150 · 210 · 22 · 120 | missile 3.4 s, aimed 1.8 s | **stealth**: a faint shimmer, no shadow, **no radar contact and no missile lock** until it fires (then 1.5 s visible) or comes within 150 px; Early-Warning Radar level 2 shows it on the scope; the gun hits it any time | Canyon m19 |

Big or rare aircraft (Felon, Jammer, like the Bear and the Flanker) come alone, two from difficulty 20 on (the Jammer
always alone).

## Mini-bosses

A mini-boss is one big enemy, not a boss. It spawns at a fixed point in the mission, a WARNING banner with the siren
names it ("Tu-22M Backfire ahead"; the wingman calls it too), a thin red health bar sits over it, and it can be left behind: the mission does
not wait for it. Downed, it pays its bounty and always drops a repair kit and a power-up.

| kind | name | layer | HP · bounty | weapons | behaviour |
|---|---|---|---|---|---|
| `backfire` | Tu-22M Backfire | air | 2,000 · 900 | spread 1.8 s, missile 3.5 s | **loiter**: eases down to the top of the screen, drifts gently across it for 20 s (nose down), launches a drone every 6 s, then leaves |
| `fortress` | AA Fortress | ground (land) | 2,200 · 1,000 | flak 1.6 s, missile 3.4 s | a walled base with four flak towers, a SAM launcher and a radar; while it is in the upper 60 % of the screen the scroll slows to 20 % |
| `cruiser` | Missile Cruiser | sea | 2,300 · 1,100 | missile 3.2 s, flak 1.7 s | two twin turrets, SAM racks; slows the scroll like the fortress |

HP scales with the threat curve (doc 43): the Backfire has ≈ 4,300 HP at m13, ≈ 10,500 at m30 and ≈ 30,000 at m60,
about 10–15 s of a matching pilot's fire (ground mini-boss HP counts double against the gun, which does half damage on
the ground without uranium ammo).

**When:** in every non-boss mission from the Arctic (m13) on. Map 1 has one mini-boss at 55 % of the mission, map 2
two (at 40 % and 75 %). Kind: alternating by mission number between the Backfire and the theater's own (fortress on
land, cruiser at sea). Boss missions have none.

## Where the new types appear

Pools stay as written in the mission seeds. Each theater adds **reinforcements** (`reinforcements(mission)`, pure,
`data/reinforcements.ts`) to every mission's pool from the given mission on:

| theater | reinforcements |
|---|---|
| Pacific | none — the son's theater stays as it is |
| Gulf | Shilka (m08), bunker (m09), Foxbat (m10) |
| Arctic | Foxbat, Jammer (m13), frigate (m14) |
| Red Canyon | Shilka, bunker, Felon (m19), Jammer (m20), Foxbat (m21) |
| Leviathan | Felon, frigate, Foxbat (m25), Jammer (m26) |
| map 2 | four or five of them per theater from its first mission (no ships on land) |

Every reinforcement shows up **at least once in each mission** (spread over its length), and more come in waves with
low weights (Shilka 0.4, bunker 0.35, Foxbat 0.35, frigate 0.3, Felon 0.25, Jammer 0.15 against 1 for the usual
types), so the new faces are a regular surprise, not the whole show — about 3–15 % of a mission's enemies. They join
the waves only on a layer the mission already has (an all-air intercept stays in the air; there the ground types
come just the once). Timelines of m01–m07 are unchanged.

## Business Rules

- Enemy stats scale with the threat curve of doc 43 like every other enemy.
- Strike and intercept objectives keep their counts; new air types (the Backfire too) count as air kills.
- A cloaked stealth fighter: not drawn (only a shimmer), no shadow, no radar contact below radar level 2, no homing
  lock (a missile that was locked on it searches again). Bullets and bombs hit it.
- Jamming lasts while a jammer is between just above the screen and its bottom edge; enemy missiles are not affected.
- The bunker's armour only acts on the main gun, the second gun and the wingman; missiles, bombs and the GAU-8 do full
  damage.
- The wingman (doc 06) calls the first jammer of a sortie ("my radar's all snow"), the first stealth fighter and every
  mini-boss. Early-Warning Radar level 2 (doc 43) says in the shop that it shows stealth fighters.

## Balance

Bot playtest (2026-10-28, doc 43 method and kits: invulnerable bot, the pilot owns what one who buys as the money
comes in owns, hulls of the jet's own maximum per minute, three runs, mean). "Focused": the same bot goes straight
for a mini-boss while one is on screen and stops dodging, like a pilot who commits to it. Mini-boss times count
from its arrival.

| mission | wave 1 (doc 43) | with the new adversaries | mini-boss: plain bot / focused |
|---|---|---|---|
| m11 | 0.54 | 0.88 | — |
| m17 | 0.09 – 0.14 | 0.83 | cruiser escapes 2 of 3 / sunk in 18 s |
| m18 BLACKJACK | 1.41 | 1.39 | (boss mission) |
| m20 | 2.7 (strike met 3 of 3) | 3.39 (strike met 1 of 3) | Backfire escapes / down in 23–24 s |
| m23 | 0.70 | 1.37 (focused 0.95) | fortress falls in 21–27 s / 13 s |
| m29 | 1.66 | 2.05 | cruiser escapes / sunk in 18–21 s |
| m35 | 2.84 | 3.19 | cruiser and Backfire escape / 17 s and 24 s |
| m42 CONDOR | 2.46 | 2.69 | (boss mission) |
| m53 | 2.49 | 3.13 | fortress and Backfire escape (strike missed in both builds) |
| m60 COLOSSUS | 4.04 | 3.74 | (boss mission) |

- The new types add **10–30 %** to the damage a pilot takes once they are part of the theater (m11 +60 % from the
  Shilkas, bunkers and Foxbats on top of a low base). Boss missions are unchanged within noise: no mini-boss there,
  and their pools change little. The jump at m17 (0.1 → 0.8) is the first mini-boss. A cruiser that is left alone
  shells the pilot for its whole pass.
- **Mini-bosses are a choice.** A pilot who commits sinks or downs every one of them in 13–24 s with the kit they own at
  that point, and at m23 that also cuts the damage taken from 1.4 to 0.95 hulls/min. A pilot who ignores them takes
  their fire for the whole slow pass. Earlier tries were too tough: 4,000–5,000 HP escaped even a focused bot. So were
  2,500–3,000 HP, and a Backfire that swept the whole width of the screen. Hence 2,000 / 2,200 / 2,300 HP, a
  gentler Backfire drift, 20 s of loiter and a 20 % scroll over the upper 60 % of the screen.
- m20 (Hornet's Nest, destroy 5 SAM sites) is the toughest map-1 mission now: the jammer arrives there and halves the
  Mavericks' turn rate. Shooting it first is the intended answer. The bot, which never prioritises, missed the
  strike in two of three runs.
- First try, for the record: wave weights Shilka 0.6, bunker 0.5, Foxbat 0.4, Felon 0.45, Jammer 0.25, and ground
  reinforcements also in all-air missions. That flooded m23 Flanker Ace with 50 ground units and m33 with 18 jammers.
  The final weights and the layer rule keep new faces at 3–15 % of a mission's enemies.
