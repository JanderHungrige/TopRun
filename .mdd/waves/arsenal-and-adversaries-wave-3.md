---
id: arsenal-and-adversaries-wave-3
title: "Wave 3: Map 2 doubled, the Bofors HE gun, incendiary ammo"
initiative: arsenal-and-adversaries
initiative_version: 2
status: complete
depends_on: arsenal-and-adversaries-wave-2
demo_state: "On map 2 every ladder has as many new levels again (gun 11–20, Mk IV–VI, uranium 4–6, equipment doubled), an always-on 40 mm HE gun and incendiary ammo are on sale, map 2 pays and hits harder, and a pilot who buys as the money comes in still has about half of the shop left at m60."
created: 2026-10-30
hash: a1131927
---

# Wave 3: Map 2 doubled, the Bofors HE gun, incendiary ammo

## Demo-State
On map 2 every ladder has as many new levels again (gun 11–20, Mk IV–VI, uranium 4–6, equipment doubled), an
always-on 40 mm HE gun and incendiary ammo are on sale, map 2 pays and hits harder, and a pilot who buys as the money
comes in still has about half of the shop left at m60.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | map-2-ladders (gun 11–20 and new-jet guns 8–14, uranium 4–6, Mk IV–VI, equipment levels doubled, prices) | 43-deep-arsenal | complete | — |
| 2 | incendiary-ammo (second ammo type, levels 1–6, one type loaded per sortie, burning planes) | 45-incendiary-ammo | complete | map-2-ladders |
| 3 | he-gun (Bofors 40 mm: always-on third gun, explosive shells, levels 1–10, map 2) | 46-bofors-he-gun | complete | map-2-ladders |
| 4 | map-2-pay-and-threat (map 2 pays and hits harder by mission number; bot playtest) | 43-deep-arsenal | complete | incendiary-ammo, he-gun |

## Open Research
- Doubling every ladder with prices that keep rising costs about 12 M on map 2, six times what map 2 pays today
  (2.06 M at 80 % kills). Keeping the shop at about 1.5 × income means map 2 must pay more, ramping by mission number
  (not by challenge level, so a skilled pilot doesn't out-earn the shop again).
- How much tougher map-2 enemies must get for a pilot who buys as the money comes in: bot playtest at m35 / m42 / m47
  / m53 / m60 against the wave-2 numbers in doc 44.
