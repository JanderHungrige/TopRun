---
id: 26-pilot-rating
title: Pilot Rating and Naval Ranks
edition: TopRun
depends_on: [03-campaign-map, 10-minigames-core]
relates: [24-medals-core, 27-online-ladder, 28-ladder-screen]
source_files:
  - src/game/rating.ts
  - src/data/ranks.ts
routes: []
models: []
test_files:
  - tests/unit/rating.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [ladder, rating, ranks, leaderboard]
path: Game/Ladder/Rating
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 26 — Pilot Rating and Naval Ranks

## Purpose

One number per pilot for the online ladder (owner: "max points of all registered pilots"), and a
naval rank derived from it (owner choice). Pure and deterministic, so the browser and the ladder
service compute the same value.

## Rating (owner choice: one combined pilot rating)

| Ingredient | Points | Cap |
|------------|--------|-----|
| campaign star | 100 | 180 stars (both maps, doc 35; was 90) → 18 000 |
| medal (doc 24) | 250 | 18 medals → 4 500 |
| kill | 2 | 2 000 kills → 4 000 (grinding replays can't dominate) |
| minigame gold / silver / bronze (best per game) | 150 / 80 / 40 | 10 games → 1 500 |

`rating = 100·stars + 250·medals + 2·min(kills, 2000) + Σ minigame medal points` — max **28 000** (19 000 before
map 2, doc 35).
Inputs are clamped to their caps and to non-negative integers.

## Naval ranks (owner choice)

| Rank | From rating |
|------|-------------|
| Ensign | 0 |
| Lieutenant (junior grade) | 800 |
| Lieutenant | 2 000 |
| Lieutenant Commander | 4 000 |
| Commander | 6 500 |
| Captain | 9 500 |
| Rear Admiral | 13 000 |
| Admiral | 16 500 |
| Fleet Admiral (doc 35) | 20 000 |
| Top Gun Legend (doc 35) | 25 000 |

Names are generic naval ranks (EN/DE in the UI tables); shown on the ladder, the pilot list and
later the locker uniform's shoulder boards (doc 29+).

## Business Rules

- `pilotRating(stats)` and `rankFor(rating)` are pure; `RatingStats` = { stars, medals, kills,
  golds, silvers, bronzes }.
- `maxRating()` = 19 000 is what the ladder service accepts at most (doc 27).

## Data Flow

Reads the save (stars, record kills, minigame bests) and the earned medals; writes nothing.

## Dependencies

03 (stars), 10 (minigame medals), 24 (medals and the service record's kills).

## Security

None (pure).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
