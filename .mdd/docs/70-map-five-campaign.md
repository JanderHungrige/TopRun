---
id: 70-map-five-campaign
title: Map Five Campaign - Kelp Forest, Wreck Field, the Trench and the Abyss (m127–m150), Their Enemies and Bosses
edition: TopRun
depends_on: [65-fifth-map, 68-underwater-world, 58-map-four-campaign, 44-new-adversaries]
relates: [65-fifth-map, 68-underwater-world, 69-sub-fleet, 58-map-four-campaign, 74-world-order]
source_files:
  - src/data/types.ts
  - src/data/missions-5.ts
  - src/data/theaters-5.ts
  - src/data/theaters.ts
  - src/data/bosses-5.ts
  - src/data/enemies.ts
  - src/data/reinforcements.ts
  - src/data/photo-looks.ts
  - src/render/sea-floor.ts
  - src/render/water.ts
  - src/render/draw-terrain.ts
  - src/render/enemies/sea.ts
  - src/render/enemies/sea-2.ts
  - src/render/enemies/creatures.ts
  - src/render/draw-enemies.ts
  - src/render/bosses-5.ts
  - src/render/bosses-5b.ts
  - src/render/photos/props.ts
  - src/scenes/map-render.ts
  - src/i18n/missions-5-de.ts
  - src/i18n/content-de.ts
  - dev/playtest.ts
routes: []
models: []
test_files:
  - tests/unit/missions-5.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [map-5, underwater, campaign, theaters, bosses, enemies, mini-boss, creatures, finale]
path: Game/Campaign/FifthMap
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "The finale at m150 plays the debrief's banner and the admiral's line; world 5's celebration, medals and the rating's fifth map come in wave 3."
security_read_sites: []
sister_projects: []
---

# 70 — Map Five Campaign

> **World order (doc 74, 2026-11-07):** under the sea is now **map 4, m91–m120**; space is map 5, the last world. Mission numbers, map numbers and thresholds in this doc are from before the swap: take 30 off its mission numbers (m121 → m91), read map 5 as map 4. The world's own numbers (formulas from its first mission, pay ×10, prices) are unchanged.

## Purpose

Wave 2 of Deep Water: map 5 grows from the Coral Reef (doc 65) to the full 30 missions, m121–m150, like every other
map — five theaters of six, a boss closing each, the finale at m150. Owner's mix: **military plus sea monsters**.

## Theaters

| # | theater | missions | backdrop | boss |
|---|---|---|---|---|
| 1 | Coral Reef — *Bright water, sharp teeth* | m121–m126 | turquoise reef (doc 68) | BARRACUDA, hunter-killer sub |
| 2 | Kelp Forest — *Lost in the green* | m127–m132 | green water, tall kelp stands swaying, mossy rocks | MEDUSA, jellyfish queen |
| 3 | Wreck Field — *Ghost ships* | m133–m138 | grey sand, sunken ship hulls, anchors and chains | BASTION, seabed fortress |
| 4 | The Trench — *Into the dark* | m139–m144 | dark rock walls closing in on both sides, deep blue, few rays | GOLIATH, giant squid |
| 5 | The Abyss — *Where the light ends* | m145–m150 | near-black water, glowing specks, black smokers | JORMUNGAND, sea serpent (finale) |

Threat, length and reward keep doc 65's formulas: threat `2 + (n − 121) × 1.35` (m150: 41), pay ×10 rising 3 % a
mission. The light fades the deeper the map goes: rays on the reef and in the kelp, few in the wrecks, none in the
trench and the abyss; the water darkens theater by theater.

## Missions

| # | name | objective | pool |
|---|---|---|---|
| m127 | Green Gloom | patrol | minisub, eel, jelly |
| m128 | Kelp Hunters | 4 hunter subs | hunter, minisub, seaturret |
| m129 | Swarm Season | 28 kills | jelly, seadrone, eel |
| m130 | Crab Walk | 6 giant crabs | crab, seaturret, minisub |
| m131 | Deep Green | patrol | hunter, eel, crab, jelly |
| m132 | Medusa | boss MEDUSA | jelly, eel |
| m133 | Ghost Fleet | patrol | hunter, seamine, crab |
| m134 | Surface Raiders | 5 torpedo boats | torpboat, minisub, seaturret |
| m135 | Salvage Guns | 8 seabed turrets | seaturret, crab, hunter |
| m136 | Wolf Pack | 32 kills | hunter, minisub, seadrone |
| m137 | Rust and Bones | patrol | torpboat, hunter, crab, seamine |
| m138 | Bastion | boss BASTION | minisub, hunter |
| m139 | The Drop | patrol | squid, hunter, sealab |
| m140 | Sea Labs | 5 sea labs | sealab, seaturret, squid |
| m141 | Ink Storm | 36 kills | squid, eel, seadrone |
| m142 | Convoy Overhead | 6 torpedo boats | torpboat, hunter, squid |
| m143 | Wall Guns | patrol | sealab, crab, squid, hunter |
| m144 | Goliath | boss GOLIATH | squid, eel |
| m145 | Where the Light Ends | patrol | angler, squid, hunter |
| m146 | Black Smokers | 7 sea labs | sealab, crab, angler |
| m147 | Glow in the Dark | 40 kills | angler, jelly, squid |
| m148 | Last Wolf Pack | 8 hunter subs | hunter, torpboat, angler |
| m149 | The Bottom | patrol | hunter, sealab, angler, squid, crab |
| m150 | Jormungand | boss JORMUNGAND | angler, squid |

German names and briefings in `src/i18n/missions-5-de.ts`.

## New enemies

| kind | name | layer | HP | speed | weapons | behaviour | look |
|---|---|---|---|---|---|---|---|
| hunter | Hunter Sub | air | 90 | 120 | aimed 2.2 s, torpedoes 10 s | strafe | a bigger dark sub with a tall sail and twin screws |
| torpboat | Torpedo Boat | air | 100 | 60 | aimed 3 s | straight | on the surface, seen from below: a dark hull against the bright surface, foam at the bow, the props churning |
| squid | Squid | air | 70 | 240 | ink dart (aimed) 2.2 s | dive, swoop | a pale torpedo body, fins, tentacles trailing |
| crab | Giant Crab | ground | 160 | 25 | aimed 2.6 s | ground | a red-brown shell, legs stepping, two big claws |
| sealab | Sea Lab | ground | 260 | 0 | torpedoes 7.5 s, flak 4.2 s | ground | a domed habitat on legs, lit portholes, a pipe out |
| angler | Anglerfish | air | 80 | 90 | single 1.6 s | hover | a dark gaping fish with needle teeth and a glowing lure |
| boomer | Missile Sub (mini-boss) | ground | 2,200 | 20 | spread3 1.8 s, torpedoes 4.5 s | ground | a long missile sub with a hump of missile hatches |

- **Mini-boss:** from the Kelp Forest on (m127), one missile sub per mission at 55 % of the way, none in boss
  missions (doc 44's rule, map 5's kind).
- **Reinforcements** (doc 44): the hunter sub joins the pools from m133, the squid from m145.

## Bosses

| boss | theater | look | parts | escort |
|---|---|---|---|---|
| MEDUSA | Kelp Forest | a huge pulsing jellyfish bell, frilled rim, tentacles streaming up behind | four tentacle clusters (aimed, aimed, spread3, spread3) | a jellyfish every 4 s |
| BASTION | Wreck Field | a domed fortress on a rock shelf among the wrecks, gun domes and a missile silo | four gun domes (aimed, flak), a missile silo | a midget sub every 6 s |
| GOLIATH | the Trench | a giant squid seen from above, mantle and fins, eight arms writhing toward the sub | two big eyes (aimed), four arms (spread3, flak) | a squid every 5 s |
| JORMUNGAND | the Abyss | a vast sea serpent coiled in an S, scaled back, a horned head with glowing eyes, fins along the coils | the head (spread3), three coils (aimed, torpedoes, flak) | an anglerfish every 5 s |

- Like the BARRACUDA they run on the seabed layer, so torpedoes, the gun, the Shkval and the sonar all reach them.
- Core HP rises along the map: BARRACUDA 1,700, MEDUSA 3,200, BASTION 3,800, GOLIATH 4,400, JORMUNGAND 4,800 (set by
  the balance sweep below).
- The finale at m150 (a map ends at a multiple of 30): the admiral's `adm.finale5` and the debrief's DEEP WATER WON;
  the celebration comes in wave 3.

## Balance (bot sweep, 2026-11-07)

Bot as in doc 65, the Type 212 buying down `SUB_ORDER` (harpoon gun, MK48, depth mines, the Shkval, marks and
equipment) from map-5 income only. Hulls lost per minute, two runs each; map 4 at the same depth in brackets (doc 58).

| mission | first sweep | shipped | map 4 |
|---|---|---|---|
| m128 | 2.9–3.4 | 1.7–2.1 | (m98) |
| m131 | 1.8–1.9 | 1.1–1.3 | |
| m132 MEDUSA | 0.6, boss 13–14 s | 0.9–1.0, boss 22 s | (m102 QUARRY 1.9–2.2, 19 s) |
| m134 | — | 3.4–3.6 | |
| m137 | 4.8–5.8 | 2.6–2.8 | (m107) |
| m138 BASTION | 4.0–4.4, boss 14–15 s | 2.5–3.0, boss 16–19 s | (m108 CRATER 3.1–3.8) |
| m140 | — | 4.3 | |
| m141 | 4.0–4.3 | 2.1–2.5 | (m111 2.6–3.0) |
| m142 | — | 3.8–3.9 | |
| m143 | 5.0 | 3.6–4.9 | |
| m144 GOLIATH | 3.2–3.6, boss 13–14 s | 2.4–2.5, boss 16–17 s | (m114 TRIDENT 3.5) |
| m146 | — | 4.2–4.6 | |
| m147 | 5.7–6.2 | 4.0–4.2 | (m117 4.4–5.3) |
| m149 | 5.9–6.3 | 4.8–5.0 | |
| m150 JORMUNGAND | 4.8–5.3, boss 23–25 s | 4.5–4.8, boss 25–26 s | (m120 ARK 4.5–4.7, 29–30 s) |

Tuning, in order, each step re-swept:
- Bosses were too quick: core HP MEDUSA 2,200 → 3,200, BASTION 2,700 → 3,800, GOLIATH 3,200 → 4,400,
  JORMUNGAND 4,000 → 4,800.
- The hunter sub (150 HP, torpedoes every 4.5 s) and the torpedo boat (180 HP) were far tougher than map 4's
  interceptor: hunter 90 HP, aimed shots every 2.2 s, torpedoes every 6.5 → 8 → 10 s; torpedo boat 120 → 100 HP.
- Instrumented runs showed where the hull went: in m137 and m142 two thirds of it to enemy torpedoes (and the fire
  rate grows with the threat). The torpedo boat — a surface boat — lost its homing torpedoes and fires aimed shots
  every 3 s instead of depth-charge flak (flak bursts caught the sub as the boats passed over it); the missile sub's
  torpedoes every 3.2 → 4.5 s.
- In the trench up to 17 sea labs stood on screen at once: the seabed scrolls at 65 %, so static ground units stay
  longer than on maps 1–4. Sea lab 260 → 180 HP, torpedoes every 5 → 9 s, flak every 3 → 4.2 s; the giant crab fires
  one aimed shot every 2.6 s instead of a three-way spread; the anglerfish 110 → 80 HP.
- The sea-lab missions (m140, m143, m146) stay the hardest of their theaters (≈ 4–4.6); the bot never dodges a
  torpedo, a pilot does. The bot won every run.
- Income: map 5 pays ≈ 15.3 M (m121–m150); the bot earns ≈ 14.1 M by the finale.
