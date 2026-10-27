---
id: 35-second-map
title: Second Map - Missions 31–60 in Five New Theaters, the Globe, New Top Ranks
edition: TopRun
depends_on: [03-campaign-map, 05-mission-combat, 26-pilot-rating]
relates: [03-campaign-map, 05-mission-combat, 26-pilot-rating, 27-online-ladder, 28-ladder-screen, 09-paint-jobs, 24-medals-core]
source_files:
  - src/data/types.ts
  - src/data/theaters.ts
  - src/data/theaters-2.ts
  - src/data/missions.ts
  - src/data/missions-2.ts
  - src/data/bosses.ts
  - src/data/bosses-2.ts
  - src/data/ranks.ts
  - src/game/progress.ts
  - src/game/waves.ts
  - src/game/rating.ts
  - src/game/save.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/map.ts
  - src/scenes/map-render.ts
  - src/scenes/map-globe.ts
  - src/scenes/debrief.ts
  - src/render/draw-bosses.ts
  - src/render/bosses-2.ts
  - src/render/ranks.ts
  - src/i18n/missions-2-de.ts
  - src/i18n/content-de.ts
routes: []
models:
  - "SaveData.progress: map-2 mission ids m31–m60 next to m01–m30"
test_files:
  - tests/unit/missions-2.test.ts
  - tests/unit/progress.test.ts
  - tests/unit/rating.test.ts
  - tests/unit/waves.test.ts
  - tests/unit/i18n.test.ts
data_flow: mixed
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [campaign, map, missions, bosses, difficulty, ranks, globe]
path: Game/Campaign/Second Map
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 35 — Second Map

## Purpose

Wave 1 of the Second Front initiative (owner, 2026-10-27): the first campaign is played through too fast. A second
map with another 30 missions, clearly harder, in a new region of the world with five new theaters and five new
bosses, reached through a small globe on the campaign map. Map 1 stays exactly as it is. Map-2 stars count for the
pilot rating, which gets two new top ranks.

## Opening map 2 — the globe

- The campaign map's top bar shows a small **globe** (between the progress line and the pilot, ≈ x 745, y 36).
  On map 1 it carries a **padlock** until mission 30 is cleared (`mapTwoOpen(save)` = m30 cleared); tapping it
  then plays `denied` and shows "Opens after mission 30" for two seconds. Once open, tap or **G** switches to map 2;
  on map 2 the globe (with a "1") switches back.
- Which map the scene opens on: the map of the selected mission (debrief → map keeps the mission's map), else the
  map of `nextMission(save)` — map 2's highest unlocked mission once map 2 is open.
- The top bar on map 2: title "SECOND FRONT" / "ZWEITE FRONT", progress counted on that map only
  ("12/30 MISSIONS · ★ 30/90").

## Missions 31–60

- `MISSIONS` keeps meaning map 1 (m01–m30) everywhere it is used today (finale, medals, photos, liveries, minigame
  unlocks, the pilot card). `MISSIONS_2` holds m31–m60; `ALL_MISSIONS` both; `campaignMissions(c)` one map;
  `missionById` looks in both. `MissionDef.campaign` is `1 | 2`.
- Ids `m31`–`m60`, `number` 31–60 (also the wave RNG seed, so no mission repeats a map-1 timeline), five theaters ×
  six missions, every sixth a boss.
- Unlocks: m31 needs m30 cleared; after that the previous mission of the same map, as on map 1.
- `difficulty` = number (31–60), so every map-1 scaling rule keeps climbing (doc 05): enemy HP ×(1+0.06(d−1)) (×4.54
  at m60), fire rate ×(1+0.03(d−1)), bullet speed ×(1+0.015(d−1)), boss HP ×(1+0.05(d−1)), formations
  `floor(d/10)` larger. The wave gap gets a floor: unchanged up to d 30, then `lerp(1.5, 1.1, (d−30)/30)`
  (the old formula went negative above 30).
- Rewards continue the map-1 formula: `round100(1200 + (n−1)·380)` = 12,600 … 23,600, bosses ×1.5.
  Length: missions `105 + round((n−31)·1.2)` s (105–140), bosses `45 + n` s (81–105).
- Threat on the briefing: five ▲ relative to the map (`ceil(((n−1) mod 30 + 1)/6)`), violet on map 2.
- Briefings, names and objectives: `src/data/missions-2.ts` (English), `src/i18n/missions-2-de.ts` (German).

## Five new theaters (map 2, a new region)

| id | Name (EN / DE) | Look (existing terrain style, new palette) | Boss |
|----|----------------|-------------------------------------------|------|
| `northsea` | North Sea Rigs / Nordsee-Plattformen | storm sea, grey-green, rocky islets | KRAKEN — sea fortress (ground) |
| `himalaya` | Roof of the World / Dach der Welt | ice style on snow and rock, land base | CONDOR — heavy gunship (air) |
| `jungle` | Green Hell / Grüne Hölle | canyon style in jungle greens, land base | PYTHON — armoured train (ground) |
| `nightfall` | Desert Night / Wüstennacht | desert style at night, land base | SCORPION — missile crawler (ground) |
| `thunderhead` | Operation Thunderhead / Operation Gewitterfront | storm, dark red, sea base | COLOSSUS — flying fortress (air, final) |

- Routes on map 2 mirror map 1's left-to-right (`x' = 886 − x`), so map 2 starts bottom right and ends bottom left.
- Generic names only (public repo): no real units, operations or insignia.
- Bosses are data like the five of map 1 (`BossDef`: core, parts with weapons, hitboxes, sway, escort) and drawn
  in code in `render/bosses-2.ts` (hull, palette, warning lights); turrets, launchers and damage use the shared
  boss renderer. Base core HP 3,600–7,000 before the difficulty factor (×2.75 at m36 … ×3.95 at m60).

## Not on map 2 (yet)

- No new medals, photos or paint jobs in this wave: the picture wall stays at map 1's 30 photos, medals keep
  meaning map 1 ("Victory" = m30, "Golden Star" = all 30 at 3★), map-2 theaters have no liveries until wave 4.
- Map-2 debriefs: the admiral's "next theater" line works within map 2; m60 ends with its own finale line
  (`adm.finale2`). Minigame offers stay as they are (every third mission).

## Pilot rating and ranks (doc 26 update)

- `RATING.maxStars` 90 → **180** (both maps), so the maximum rating grows from 19,000 to **28,000**.
- Two new ranks above Admiral (rank boards: wide stripe plus stripes, no insignia):
  `fadm` Fleet Admiral / Flottenadmiral from **20,000**; `legend` Top Gun Legend / Top-Gun-Legende from **25,000**.
  Earlier thresholds stay, so nobody loses a rank. The ladder service runs the same code and rolls out with it.

## Save

- `parseSave` keeps progress for every id in `ALL_MISSIONS` (it used to drop anything outside m01–m30). An older
  build reading a newer save would drop map-2 progress — the usual one-way upgrade.

## Balance

Bot playtest (`window.__toprun`, 2026-10-27) with the best map-1 kit: F-14, gun level 5, AIM-54 / AIM-9 / 2× AGM-65,
all equipment. The bot always fires, follows the boss or the nearest target and sidesteps bullets close in front;
it dodges far worse than a person (it loses m30), so its runs are **invulnerable** and measure what does not depend
on dodging skill: damage taken in hulls per minute (a hull = the jet's full health) and time to kill.

| | damage taken (hulls/min) | boss fight |
|---|---|---|
| map 1, m24–m30 | 0.45 – 2.8 (m26–m29 ≈ 1.7 average) | TYPHOON 23 s, LEVIATHAN 92 s |
| m31 – m36 | 1.6 – 3.4 | KRAKEN 42 s |
| m38 – m48 | 2.0 – 4.0 | CONDOR 29 s, PYTHON 68 s |
| m50 – m60 | 2.6 – 4.6 | SCORPION 94 s, COLOSSUS 55 s |

- m31 continues map 1's curve (no cliff); from there map 2 climbs to about 2.4× the end of map 1, clearly harder,
  as asked. Air bosses fall about twice as fast per hit point as ground bosses on both maps (AIM-54 / AIM-9 and the
  gun at full damage), so COLOSSUS is short but the most dangerous fight (≈ 4 hulls/min).
- Every strike objective on light targets (AA, SAM, tank, radar, depot) is met with a wide margin when the targets
  are focused. **Destroyers were the exception:** at m56 a destroyer has 1,806 HP (gun level 5 on the F-14 ≈ 430
  DPS on ground) for the ~5 s it is in reach; focused, the bot sank 3 of the 8 that spawned (the misses left with
  ~25 % HP), so "sink 5" was out of reach even for a perfect pilot with this kit. m34 met "sink 3" with exactly 3.
- **Retune (map 2 only):** strike missions guarantee `ceil(1.5 · count) + 2` targets instead of map 1's
  `count + 2` (`strikeSpawns`, waves.ts; in practice only the destroyer missions get more), and m56 "Iron Wall"
  asks for 4 destroyers instead of 5. Map-1 timelines are unchanged (checked by hash).
- Late map 2 (m45+) is balanced against the firepower of waves 2–3 (new jets, double weapons, extra levels): with
  the map-1 kit it is meant to be a wall. The wave-3 playtest re-checks m45–m60 with that kit.

## Business Rules

- Map 1 is unchanged: missions, rewards, difficulty, medals, photos, liveries.
- Map 2 opens with m30 cleared; m31–m60 unlock in order.
- Stars from both maps count toward the rating (cap 180).
