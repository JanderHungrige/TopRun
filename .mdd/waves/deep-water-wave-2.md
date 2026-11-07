---
id: deep-water-wave-2
title: "Wave 2: The sub fleet and the deep"
initiative: deep-water
initiative_version: 1
status: complete
depends_on: deep-water-wave-1
demo_state: "The sub pen sells three more subs with their own specials and the Shkval rockets; the other four theaters (m127–m150) with their bosses, torpedo boats and the big creatures (giant squid, sea serpent) are in, balanced by bot playtest."
created: 2026-11-07
hash: 2be33b39
---

# Wave 2: The sub fleet and the deep

## Demo-State
The sub pen sells three more subs with their own specials and the Shkval rockets; the other four theaters
(m127–m150) with their bosses, torpedo boats and the big creatures (giant squid, sea serpent) are in, balanced by bot
playtest.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | sub-fleet (Seawolf, Virginia, Akula: data, E abilities, top and side art; the Shkval rocket fan; six tubes in the SUB PEN) | 69-sub-fleet | complete | — |
| 2 | map-five-campaign (m127–m150: Kelp Forest, Wreck Field, the Trench, the Abyss; their backdrops, six new sea enemies and the missile-sub mini-boss, the bosses MEDUSA, BASTION, GOLIATH and JORMUNGAND; the finale at m150) | 70-map-five-campaign | complete | — |
| 3 | map-5-balance (the four theaters by bot sweep; the sub shop ≈ 1.5 × map 5's pay; the four subs roughly even) | 69-sub-fleet, 70-map-five-campaign | complete | sub-fleet, map-five-campaign |

## Open Research
- Map 5 is the first map the rating and the medals do not know yet: world 5's key frames, medals and the rating's fifth
  map are wave 3. Until then the finale plays without a celebration (the debrief's banner and the admiral's line
  only): `CELEBRATED` in `src/game/celebration.ts` lists the worlds whose celebration exists (1–4).
- Found on the way: from wave 1, m121–m125 fell through to map 1's mini-boss rule (a jet bomber or an AA fortress on
  the reef); map 5 now has its own rule (doc 70).
