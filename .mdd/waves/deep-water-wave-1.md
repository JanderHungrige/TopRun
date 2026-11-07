---
id: deep-water-wave-1
title: "Wave 1: Map 5 opens with the Type 212"
initiative: deep-water
initiative_version: 1
status: complete
depends_on: none
demo_state: "After m120 the map picker opens map 5; the free Type 212 sub dives into the Coral Reef (m121–m126): water with bubbles, light rays and fish over a coral seabed; harpoon gun, MK48 torpedoes, depth mines and the E sonar burst; midget subs, sea drones, mines, seabed turrets, jellyfish and eels; the BARRACUDA boss; the sub drifts in the water."
created: 2026-11-07
hash: c1606668
---

# Wave 1: Map 5 opens with the Type 212

## Demo-State
After m120 the map picker opens map 5; the free Type 212 sub dives into the Coral Reef (m121–m126): water with
bubbles, light rays and fish over a coral seabed; harpoon gun, MK48 torpedoes, depth mines and the E sonar burst;
midget subs, sea drones, mines, seabed turrets, jellyfish and eels; the BARRACUDA boss; the sub drifts in the water.
*(This wave is not complete until this can be manually demonstrated.)*

## Features
| # | Feature | Doc | Status | Depends on |
|---|---------|-----|--------|------------|
| 1 | fifth-map (campaign 5: the map picker's fifth chip, opening after m120, the Coral Reef m121–m126, threat and pay, BARRACUDA, the admiral's line) | 65-fifth-map | complete | — |
| 2 | sub-kit (subs as a kind of plane, the sub kit in the save and the kit view, harpoon gun, MK48 torpedo, depth mine, equipment at sub prices, the SUB PEN hangar) | 66-sub-kit | complete | fifth-map |
| 3 | sub-flight (the Type 212 in the mission: top-down art with a turning screw and a bubble wake, water drift and a slower scroll, E: sonar burst, the sub cockpit skin; no launch yet) | 67-sub-flight | complete | sub-kit |
| 4 | underwater-world (the reef backdrop: water, light rays, coral seabed, kelp, fish and bubbles; smoke turns to bubbles; six sea enemies; BARRACUDA's art) | 68-underwater-world | complete | fifth-map |
| 5 | map-5-balance (threat, pay and sub prices for a fresh kit: shop ≈ 1.5 × income; bot playtest) | 65-fifth-map | complete | sub-flight, underwater-world |

## Open Research
- Map 5 restarts the threat climb and the pay like maps 3 and 4 (docs 48, 56): first guesses are map 4's numbers
  (threat from 2, +1.35 a mission; pay × 10, +3 % a mission; sub prices × 10), then a bot playtest at m121 / m123 /
  m126 sets them.
- Wave 2 adds three subs and the Shkval rockets, so the map-5 shop is only partly here; the 1.5 × target is checked
  again in wave 2.
