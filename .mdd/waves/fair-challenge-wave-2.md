---
id: fair-challenge-wave-2
title: "Wave 2: Adaptive challenge level"
initiative: fair-challenge
initiative_version: 1
status: complete
depends_on: fair-challenge-wave-1
demo_state: "A pilot who wins three missions in a row with most of the hull left flies the next one at challenge level 1; seven deaths in a row after an upgrade bring it back down; level 0 is today's game."
created: 2026-10-27
hash: db24df17
---

# Wave 2: Adaptive challenge level

## Demo-State
A pilot who wins three missions in a row with most of the hull left flies the next one at challenge level 1; seven deaths in a row after an upgrade bring it back down; level 0 is today's game.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | sortie-log | 38-challenge-level | complete | — |
| 2 | challenge-level | 38-challenge-level | complete | sortie-log |

## Open Research
- Thresholds (convincing win, streak lengths, step size) by bot playtest per level; kit score definition; cloud-save field for the owner's review.
