---
id: new-frontiers-wave-2
title: "Wave 2: Map 3 opens with the Apache"
initiative: new-frontiers
initiative_version: 1
status: complete
depends_on: new-frontiers-wave-1
demo_state: "After m60 the map picker opens map 3 (m61–m90, five theaters, five bosses); its hangar starts from zero with the Apache free, the jets stay on maps 1–2, and the Apache flies map 3 with its own gun, rockets and Hellfires."
created: 2026-11-06
hash: 9b00acea
---

# Wave 2: Map 3 opens with the Apache

## Demo-State
After m60 the map picker opens map 3 (m61–m90, five theaters, five bosses); its hangar starts from zero with the
Apache free, the jets stay on maps 1–2, and the Apache flies map 3 with its own gun, rockets and Hellfires.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | third-map (campaign 3: m61–m90, five theaters and bosses, the map picker, unlocks, debrief lines, rating cap and a new rank) | 48-third-map | complete | — |
| 2 | helicopter-kit (helicopters as a kind of plane, the kit view that swaps in the helicopter kit, chain gun, Hydra, Hellfire, helicopter equipment, the HELICOPTERS hangar) | 49-helicopter-kit | complete | third-map |
| 3 | helicopter-flight (the Apache in the mission: top-down art with a spinning rotor, slower scroll and drift, gun at full damage on the ground, E: Longbow salvo, cockpit; no takeoff yet) | 50-helicopter-flight | complete | helicopter-kit |
| 4 | map-3-balance (map-3 threat and pay for a fresh kit: shop ≈ 1.5 × income, bot playtest) | 48-third-map | complete | helicopter-flight |

## Open Research
- Map 3 cannot simply continue the threat curve: at m61 it would give enemies ~32 × base HP against a level-1
  chain gun. Map 3 gets its own difficulty by mission (a fresh climb, steeper than map 1) and its own pay; the
  map-2 factors stop at m60. Numbers from a bot playtest at m61 / m70 / m80 / m90.
- Wave 3 adds three helicopters and the Stinger, so the map-3 shop is only partly there in this wave; the
  1.5 × target is set for the whole map-3 shop and checked again in wave 3.
