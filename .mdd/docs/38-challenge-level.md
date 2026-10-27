---
id: 38-challenge-level
title: Challenge Level - Sortie Log, an Adaptive Challenge Above Today's Game, and Rookie
edition: TopRun
depends_on: [02-hangar-economy, 03-campaign-map, 05-mission-combat, 08-pilot-profiles, 37-double-firepower]
relates: [05-mission-combat, 03-campaign-map, 08-pilot-profiles, 26-pilot-rating, 39-mission-score]
source_files:
  - src/game/challenge.ts
  - src/game/save.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/game/profiles.ts
  - src/game/state.ts
  - src/main.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/boss.ts
  - src/scenes/map.ts
  - src/scenes/debrief.ts
  - src/scenes/pilots.ts
  - src/game/dialogue-scripts.ts
routes: []
models:
  - "SaveData.challenge: { level 0–10, wins, fails, failKit }"
  - "SaveData.sorties: SortieEntry[] (last 20)"
  - "SaveData.rookie: boolean"
test_files:
  - tests/unit/challenge.test.ts
data_flow: writes-existing
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [difficulty, adaptive, challenge, rookie, sortie-log, balance, fair-challenge]
path: Game/Campaign/Challenge Level
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (challenge, sorties and rookie parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 38 — Challenge Level

## Purpose

Fair Challenge wave 2 (owner, 2026-10-27): "I am a senior gamer, the game became too easy for me — I flew from mission
one to the Arctic without dying once, without upgrading beyond some gun levels and rockets. My young son has a hard
time in mission one. Measure damage taken, deaths per mission, whether weapons were upgraded … and decide whether
missions should get harder or easier — today's setting as the lowest baseline. Reduce only after an increase and a
long struggle. It must not feel too strong — no constant shifting up and down. Increase, and only reduce after e.g.
7 deaths in a row **with** improved weapons in between. If you don't upgrade and die … your problem. But if upgrading
doesn't work out (or the gun is maxed), decrease. Fun is key." Owner answers: show the level small on the briefing;
stars keep today's rules; a separate **Rookie** option per pilot for the son.

## Sortie log

Every finished sortie (won, shot down or aborted) adds a `SortieEntry` to `SaveData.sorties` (last 20 kept):
mission id, outcome (`win` / `down` / `abort`), hull left (0–1), kill share (kills ÷ spawned), the **kit score** at
take-off, the challenge level flown and the time. It travels with the cloud save (doc 34), so the owner can look at
real play data. Wave 3 (doc 39) adds accuracy and power-ups to it.

**Kit score** (pure, `kitScore(save)`): gun level × 10, second gun level × 10, the sum of equipment levels × 5, owned
weapons × 4, twin pods × 4, the selected jet's price ÷ 10,000. Anything bought raises it.

## Challenge level

`SaveData.challenge.level` 0–10 per pilot, 0 = today's game (the floor — never easier). A mission is flown at
`difficulty + 2 · level` through the existing scaling (doc 05/35: enemy HP, fire rate, bullet speed, boss HP,
formation size, wave gap), so level 10 on map 1 feels like map 2's opening. Rewards, stars and the rating are
computed exactly as at level 0 (owner: no bonus, no relief).

- **Up:** a **convincing win** = won with ≥ 70 % hull left and ≥ 60 % of the spawned enemies killed. Three in a row
  → +1 (max 10). A plain win, an abort or being shot down resets the streak.
- **Down (only above 0):** being shot down counts as a failure; **7 failures in a row** (wins reset the count, aborts
  neither count nor reset) **and** the kit score went up since the first of them **or** the gun is at its top level
  (`gunCap`, doc 37) → −1, and the count starts again. Shot down seven times without upgrading changes nothing.
- One step = +2 difficulty: enemy HP +12 %, fire rate +6 %, bullets +3 % faster per step at the same mission — small
  enough to feel like a tougher day, not a different game.
- **Shown** small on the map's mission panel: "+3" in gold after the threat triangles. When the level goes up the
  admiral says so in the debrief (`adm.challengeUp`); going down is silent.

## Rookie

A per-pilot switch (`SaveData.rookie`), shown as a **ROOKIE** chip on the pilot's card (CONTINUE screen, key F). A
rookie flies with 1.5 × hull, enemy bullets at 80 % speed and enemies firing 20 % less often, and the challenge
level stays at 0 (the adaptive rules are off). The briefing shows "ROOKIE". Stars, money and rating are unchanged
(owner: clearly labelled, outside the adaptive rules). `GameContext.setRookie(profileId, on)` writes it through the
profile store like `setSave` (doc 08), without making that pilot active.

## Business Rules

- Today's game is the floor: the level never goes below 0 and Rookie is a separate, visible choice.
- Up needs three convincing wins in a row; down needs seven failures in a row plus an upgrade (or a maxed gun).
- No reward changes with the level.

## Balance

Bot playtest (2026-10-27, doc 35 method: invulnerable runs, damage in hulls of the jet's maximum per minute). The
owner's kit from the request — F-16, gun level 3, AIM-9 + rockets, no equipment — and the son's starter F-16:

| mission | level 0 | level 5 | level 10 |
|---|---|---|---|
| m05 | 0.53 · 69/70 killed | 1.57 · 84/105 | 4.43 · 77/190 |
| m15 | 3.18 · 59/114 | 7.18 · 54/194 | 8.43 · 43/262 |
| m01, starter jet | 0.27 (Rookie: **0.14**, raw −26 %) | | |

- A step is noticeable (≈ a quarter more damage per level early in the campaign) but only comes after three
  convincing wins in a row, and the rise **limits itself**: once the hull no longer stays above 70 %, wins stop
  counting as convincing and the level stops — it settles where missions turn demanding, not impossible. Level 10
  with a gun-3 F-16 is a wall (as it should be for a pilot who stopped upgrading); the down rule needs upgrades.
- Rookie halves the relative damage on mission 1 (more hull, fewer and slower bullets — slower bullets help a
  person dodging more than the bot). No retune.
