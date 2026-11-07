---
id: 65-fifth-map
title: Fifth Map - Under the Sea, Flown With Attack Subs; the Coral Reef (m121–m126) and the BARRACUDA
edition: TopRun
depends_on: [56-fourth-map, 58-map-four-campaign, 48-third-map, 03-campaign-map, 05-mission-combat]
relates: [56-fourth-map, 66-sub-kit, 67-sub-flight, 68-underwater-world, 47-admin-pilot, 74-world-order]
source_files:
  - src/data/types.ts
  - src/data/missions.ts
  - src/data/missions-5.ts
  - src/data/theaters.ts
  - src/data/theaters-5.ts
  - src/data/bosses.ts
  - src/data/bosses-5.ts
  - src/data/photo-looks.ts
  - src/data/reinforcements.ts
  - src/game/map-three.ts
  - src/game/progress.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/routes.ts
  - src/scenes/map.ts
  - src/scenes/map-globe.ts
  - src/scenes/map-render.ts
  - src/scenes/debrief.ts
  - src/scenes/celebration.ts
  - src/scenes/tapes.ts
  - src/render/celebration.ts
  - src/i18n/missions-5-de.ts
  - src/i18n/missions-de.ts
  - src/i18n/ui-en-deep.ts
  - src/i18n/ui-de-deep.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
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
tags: [map-5, underwater, campaign, theaters, bosses, barracuda, balance, submarines]
path: Game/Campaign/FifthMap
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Found in wave 2 (live since wave 1): m121–m125 fell through to map 1's mini-boss rule, so a Backfire bomber or an AA fortress turned up halfway through the reef; fixed by map 5's own rule (doc 70: no mini-boss on the reef, the missile sub from m127)."
  - "Wave 1 ships only the Coral Reef (m121–m126); m127–m150, four more theaters and bosses follow in wave 2, the dive launch, medals, celebration and the rating's fifth map in wave 3."
security_read_sites: []
sister_projects: []
---

# 65 — Fifth Map

> **World order (doc 74, 2026-11-07):** under the sea is now **map 4, m91–m120**; space is map 5, the last world. Mission numbers, map numbers and thresholds in this doc are from before the swap: take 30 off its mission numbers (m121 → m91), read map 5 as map 4. The world's own numbers (formulas from its first mission, pay ×10, prices) are unchanged.

## Purpose

Wave 1 of Deep Water. Owner, 2026-11-07: *"I want another world. An underwater world. With bubbles and appropriate
weapons and enemies."* Like maps 3 and 4: a fresh kit (a fleet of attack subs, doc 66), new weapons, the wallet
carries.

## Opening map 5

- Map 5 opens once m120 is cleared (`mapOpen(save, 5)`, one map on as always); its missions unlock one by one. The
  admin pilot (doc 47) has it at once.
- The map picker (doc 48) gets a fifth chip; the closed chip's note reads "Opens after mission 120".
- **Launch:** until the dive launch (wave 3) a map-5 sortie goes **straight into the mission** — the takeoff rating
  is `skipped` (no takeoff bonus, no penalty), as map 4 did before its rocket launch.
- The hangar on map 5 is the SUB PEN (doc 66); the map briefing's "YOUR JET" line reads "YOUR SUB".
- After m120's debrief the admiral points at the sea: `adm.deepWater` ("The war has gone under the sea…").
- The campaign map: a dark sea chart; each theater is a reef / seabed shape like the islands of the other maps.

## Coral Reef — m121–m126 (wave 1)

| # | name | objective | pool |
|---|---|---|---|
| m121 | Shallow Water | patrol | minisub, seadrone, seaturret |
| m122 | Reef Guns | destroy 5 seabed turrets | seaturret, minisub, jelly |
| m123 | Minefield | 24 kills | seamine, seadrone, minisub |
| m124 | Eel Grounds | destroy 6 eels | eel, minisub, seaturret |
| m125 | Night Reef | patrol | minisub, eel, jelly, seamine |
| m126 | Barracuda | boss: BARRACUDA | minisub, seadrone |

- **Threat:** `2 + (n − 121) × 1.35`, map 4's climb restarted: m121 2 … m126 9 (set by the playtest below).
  Length 100 + 1.2 per mission, the boss 40 + (n − 120).
- **Reward:** the map-1 formula from 1,200, times **map 5's pay: ×10, +3 % per mission** after m121
  (`MAP_FIVE` in `src/game/map-three.ts`, read by `payScale`).
- **BARRACUDA** — a hunter-killer submarine: core 1,700 HP (aimed), four parts — two bow tubes of 180 (torpedoes,
  the enemy `missile`), a sail gun of 220 (spread3), a stern mine rack of 180 (flak) — escorted by a midget sub every
  6 s; it sways a little (60 px). It runs deep — on the seabed layer like map 4's bosses — so the torpedoes, the gun
  and the sonar all reach it.
- The sea enemies and the backdrop are doc 68.
- **A map ends only at a multiple of 30:** clearing m126 is a theater end, not a finale.

## Business Rules

- `CampaignId` 1–5; `kitOf(5)` = `'sub'` (doc 66).
- Missions in `src/data/missions-5.ts` (built by `buildCampaign`), the theater in `theaters-5.ts` (`reef`, terrain
  `reef`), the boss in `bosses-5.ts`; German texts in `src/i18n/missions-5-de.ts`.
- `routes.ts`: campaign 5 → `MissionScene(…, 'skipped')`; the `hangar` route opens the hangar on the sub kit.
- Tables keyed by `CampaignId` (map titles, threat colours, the TV's tapes, the celebration's world names) get a
  fifth entry; the TV keeps four tapes and the rating its four maps until wave 3.

## Balance (bot playtest)

Bot: `dev/playtest.ts` `flySub` — the starter sub bought from map-5 income only (no carried money), down
`SUB_ORDER`. Target as on maps 3 and 4: about 1.5–2 hulls lost per minute in the opening, a boss fight of about 20 s,
the shop ≈ 1.5 × the map's pay (checked in wave 2, when the shop is complete). Hulls lost per minute (2026-11-07):

| run | m121 | m123 | m125 | m126 (BARRACUDA) |
|---|---|---|---|---|
| first numbers (drone 14 HP / 160 px/s, mine 40 HP, BARRACUDA 3,000 in the water layer, sway 110) | 1.5–2.3 | 2.4–3.2 | — | 1.1–1.2, boss 36–51 s |
| drones 12 HP / 130 px/s; BARRACUDA on the seabed layer | — | 1.7–2.6 | — | 0.8–1.1, boss 33–44 s |
| mines 32 HP, BARRACUDA core 2,200 | — | 1.7–2.5 | 1.2–1.6 | 0.6–1.3, boss 30–37 s |
| sway 60 | — | — | — | 0.9–1.2, boss 36–38 s |
| core 1,700, parts 180 / 220 | — | — | — | 0.7–1.2, boss 29–34 s |
| **the MK48 fires** (it was missing from the homing list: every run above flew without torpedoes) | — | 1.7–2.0 | 1.4–1.8 | 0.9–1.3, boss 28–30 s |

- The boss time counts from its first pixel: the long hull glides in for 7 s from above the screen, the fight itself
  takes 18 s, the sinking 3 s (measured run, core 1,700).
- The last row is the balance that ships: every mission in the band, the boss fight about 19 s.
- The mines were the problem in the Minefield: the drones' contact hits came too fast for a gliding sub; slower,
  softer drones and softer mines brought it down to the band.
- The bot earns ~82,000 by m123 and ~276,000 by m126 — enough for harpoon gun 3, the MK48, depth mines and one armour.
- The bot won every run and never died (it cannot, by design); depth mines cannot reach a boss that holds the top of
  the screen, as jet bombs never could.
