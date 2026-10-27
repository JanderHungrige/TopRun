---
id: 39-mission-score
title: Mission Score - A 0–1000 Score per Mission That Counts into the Pilot Rating
edition: TopRun
depends_on: [05-mission-combat, 26-pilot-rating, 27-online-ladder, 38-challenge-level]
relates: [26-pilot-rating, 27-online-ladder, 28-ladder-screen, 38-challenge-level, 05-mission-combat]
source_files:
  - src/game/score.ts
  - src/game/rating.ts
  - src/game/ladder.ts
  - src/game/ladder-stats.ts
  - src/game/economy.ts
  - src/game/save.ts
  - src/game/challenge.ts
  - src/data/types.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/pickups.ts
  - src/scenes/debrief.ts
routes: []
models:
  - "SaveData.progress[id].score: best mission score (0–1000)"
  - "MissionResult.perf: { shots, hits, damage, drops, taken }"
  - "RatingStats.score: sum of the best mission scores (0–60,000), optional on the ladder"
test_files:
  - tests/unit/score.test.ts
  - tests/unit/rating.test.ts
data_flow: writes-existing
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [score, rating, ladder, debrief, accuracy, fair-challenge]
path: Game/Campaign/Mission Score
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Missions flown before this release have no score until they are flown again (owner: 'for current players it starts now')."
security_read_sites:
  - src/game/ladder.ts (score posted by the browser, clamped like every stat)
sister_projects: []
---

# 39 — Mission Score

## Purpose

Fair Challenge wave 3 (owner, 2026-10-27): "The points could also be linked to more details — % of kills during the
mission, reverse damage taken, shots fired, power-ups …". Owner answer: the score **counts into the pilot rating** "to
make it more distinct. Most players just started, so just roll it out to all. For current players it starts now."
Stars stay as they are (doc 38: no bonus or relief for the challenge level).

## The score (0–1000, won missions only)

| part | points | measure |
|---|---|---|
| Kills | 300 | enemies destroyed ÷ enemies spawned |
| Damage avoided | 300 | 1 − damage taken ÷ maximum hull (repairs don't wash it out) |
| Accuracy | 200 | gun rounds that hit ÷ rounds fired **while an enemy is on screen** (gun, second gun, GAU-8), full marks from 30 % — so autofire and touch play are not punished for firing through empty stretches |
| Launch | 100 | perfect 100, good 60, early / late 20, skipped 0 |
| Pickups | 100 | pickups collected ÷ pickups dropped (full marks when none dropped) |

`missionScore(result)` (pure) returns the total and the parts. A failed or aborted mission scores 0 and stores
nothing. Missing measurements (older results) count as full marks for accuracy and pickups, zero damage.

## Where it shows and counts

- **Debrief:** a SCORE row in the debrief panel — "734 (best 812)", gold when it is a new best.
- **Save:** `progress[id].score` keeps the best score per mission; the sortie log (doc 38) records each sortie's score.
- **Pilot rating (doc 26):** + sum of the best mission scores ÷ 10 — at most 60 missions × 100 = 6,000 points, so
  the maximum rating grows from 28,000 to **34,000**. Rank thresholds stay. Today's ratings do not drop; they
  grow as missions are flown again.
- **Ladder (doc 27):** `stats.score` is posted with the other stats and clamped (0–60,000); a post without it counts
  0, so an older browser still posts.

## Business Rules

- Only won missions score; the best score per mission counts.
- The challenge level does not change the score (no bonus).

## Balance

Bot runs (2026-10-27, the bot holds fire the whole mission, like autofire):

| mission | jet | kills | damage taken | accuracy | score |
|---|---|---|---|---|---|
| m05 | F-16 | 70/70 | 0.14 hull | 21 % (8 % counting every round) | 855 |
| m20 | F-14 | 200/200 | 0.46 | 37 % | 818 |
| m36 | A-10 | 95/109 | 1.02 | 44 % | 614 |

- **Accuracy fix:** counting every round, constant fire scored 8 % on a quiet mission — touch play fires whenever the
  finger is on the playfield, so that punished the device, not the pilot. Rounds now count only while an enemy is
  on screen, and full marks come at 30 % (the spread guns scatter by design).
- Good runs land around 800–900, a hard-fought win around 600: distinct enough to rank pilots with the same stars.
