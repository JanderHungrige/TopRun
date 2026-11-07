---
id: 69-sub-fleet
title: Sub Fleet - Seawolf, Virginia and Akula With Their Own E Abilities; the Shkval Rocket Fan
edition: TopRun
depends_on: [66-sub-kit, 67-sub-flight, 51-heli-fleet]
relates: [66-sub-kit, 67-sub-flight, 51-heli-fleet, 70-map-five-campaign, 74-world-order]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/render/subs/fleet.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/livery-art.ts
  - src/render/icons.ts
  - src/i18n/content-de.ts
  - dev/playtest.ts
routes: []
models: []
test_files:
  - tests/unit/sub-fleet.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [submarines, seawolf, virginia, akula, shkval, specials, sub-pen, map-5]
path: Game/Hangar/Sub Fleet
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 69 — Sub Fleet

> **World order (doc 74, 2026-11-07):** under the sea is now **map 4, m91–m120**; space is map 5, the last world. Mission numbers, map numbers and thresholds in this doc are from before the swap: take 30 off its mission numbers (m121 → m91), read map 5 as map 4. The world's own numbers (formulas from its first mission, pay ×10, prices) are unchanged.

## Purpose

Wave 2 of Deep Water. The owner chose **a fleet of 3–4 subs** — like the helicopters (doc 51): the Type 212 came free
with map 5 (doc 66); three more are bought in the SUB PEN, each with an E ability of its own, so choosing one is a
choice of play style. All four share the sub kit (harpoon gun level, equipment, the weapons and their marks).

## The subs

| | hull | speed | tubes | gun × | E (cooldown / duration) | price |
|---|---|---|---|---|---|---|
| Type 212 | 150 | 230 | 4 | 1.0 | Sonar Burst (12 s): the ring that wipes shots and hurts what it reaches (doc 67) | free |
| Seawolf | 135 | 270 | 4 | 1.2 | **Supercavitation** (18 s / 2.5 s): a burst of speed in a bubble sheath that rams through anything (the SR-71's dash) | 2,600,000 |
| Virginia | 140 | 250 | 4 | 1.0 | **Silent Running** (18 s / 6 s): the F-35's stealth — enemies hold fire, torpedoes lose lock | 4,000,000 |
| Akula | 230 | 205 | 6 | 1.1 | **Double Hull** (16 s / 3 s): nothing gets through (the Hind's Flying Tank) | 6,400,000 |

- Real class names like the jets and the helicopters; no insignia. The Seawolf dark blue-grey and long, the Virginia
  near-black with a rounded sail, the Akula big and broad with its tall sail pod, in a dark green-grey.
- Art in code (`src/render/subs/fleet.ts`), the Type 212's style (doc 67): one routine draws each class from a spec
  (hull, sail, planes, tail, a screw or a shrouded pump-jet) in a top view and a side view. The Seawolf's dash shows
  the jets' speed streaks, the Akula's Double Hull the Hind's amber shell.
- The Akula's six tubes: the loadout row narrows its slots as for the Hind.

## The Shkval

**VA-111 Shkval** (`shkval`): a pod of supercavitating rocket torpedoes fired in a fan, GROUND key (beside the depth
mine; Q picks), five a tube, hits anything, fast and unguided — the subs' Hydra. Mk I–III, sub prices.

## Business Rules

- Subs on sale once map 5 is open, in the SUB PEN only (doc 66); owning one makes it selectable.
- Specials reuse the jets' and helicopters' rules: `dash` (invulnerable, rams), `stealth`, `armour` (invulnerable).
- Prices: map 5 pays ×10 where map 3 paid ×6, so the subs start from the helicopters' prices × 10 / 6 and are set by
  the balance below (shop ≈ 1.5 × the map's pay).

## Balance (2026-11-07)

**Shop ≈ 1.5 × pay.** Map 5 pays ≈ 15.3 M (m121–m150, doc 70). The SUB PEN: harpoon gun 2–10 6.64 M, MK48 / depth
mine / Shkval with Mk II–III 0.81 M, equipment to the map-1 caps 2.59 M, the three subs. With the first prices (the
helicopters' × 10 / 6: 2.0 / 3.0 / 4.6 M) the shop was 19.6 M = 1.28 ×; the subs now cost 2.6 / 4.0 / 6.4 M, the shop
23.0 M = 1.50 ×. The bot never buys a sub, so the sweep (doc 70) is untouched by the prices.

**The four subs** (bot playtest, each flies the same kit — the buying pilot's at m138, harpoon gun 7, MK48, depth
mines, Shkval, armour 4; hulls of its own maximum per minute / kill share / boss time, two runs each):

| | m138 BASTION |
|---|---|
| Type 212 | 3.2–3.3 / 0.58–0.74 / 16–20 s |
| Seawolf | 1.9–3.3 / 0.68–0.87 / 14–17 s |
| Virginia | 2.4–2.9 / 0.69–0.74 / 18–19 s |
| Akula | 1.6–1.8 / 0.71–0.82 / 16–17 s |

- Each has its edge: the Seawolf kills fastest (the gun's × 1.2, the ram), the Virginia takes less than the Type 212
  (silent running), the Akula the least in hulls (230 hull, Double Hull) — the dearest and the slowest. The free
  Type 212 is the all-rounder with the sonar burst. No change to the subs was needed.
