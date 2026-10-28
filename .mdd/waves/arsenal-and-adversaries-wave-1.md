---
id: arsenal-and-adversaries-wave-1
title: "Wave 1: Deeper arsenal, stronger enemies"
initiative: arsenal-and-adversaries
initiative_version: 1
status: complete
depends_on: none
demo_state: "A map-1 pilot can buy gun levels 6–7, uranium ammo, Mk II weapons and new equipment levels at rising prices; later missions hit harder and need them; the Pacific plays as today."
created: 2026-10-28
hash: a9a6440e
---

# Wave 1: Deeper arsenal, stronger enemies

## Demo-State
A map-1 pilot can buy gun levels 6–7, uranium ammo, Mk II weapons and new equipment levels at rising prices; later
missions hit harder and need them; the Pacific plays as today.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | deep-arsenal (gun 1–10, uranium ammo, Mk II/III, equipment levels, prices) | 43-deep-arsenal | complete | — |
| 2 | threat-curve (enemy HP and hit damage by difficulty) | 43-deep-arsenal, 05-mission-combat | complete | deep-arsenal |

## Open Research
- Prices against income per map (income table by `generateTimeline`); the threat curve against a pilot who buys as
  the money comes in, by bot playtest at checkpoints m06 / m12 / m18 / m24 / m30 / m42 / m60.
