---
id: 48-third-map
title: Third Map - Missions 61–90 Flown With Helicopters, Five Theaters and Bosses, the Map Picker
edition: TopRun
depends_on: [35-second-map, 03-campaign-map, 05-mission-combat, 26-pilot-rating, 43-deep-arsenal]
relates: [35-second-map, 49-helicopter-kit, 50-helicopter-flight, 47-admin-pilot, 27-online-ladder]
source_files:
  - src/data/types.ts
  - src/data/missions.ts
  - src/data/missions-3.ts
  - src/data/mission-build.ts
  - src/data/theaters.ts
  - src/data/theaters-3.ts
  - src/data/bosses.ts
  - src/data/bosses-3.ts
  - src/data/reinforcements.ts
  - src/data/ranks.ts
  - src/game/progress.ts
  - src/game/map-two.ts
  - src/game/map-three.ts
  - src/game/rating.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/map.ts
  - src/scenes/map-globe.ts
  - src/scenes/map-render.ts
  - src/scenes/debrief.ts
  - src/render/bosses-3.ts
  - src/render/draw-bosses.ts
  - src/render/ranks.ts
  - src/i18n/missions-3-de.ts
  - src/i18n/content-de.ts
  - src/i18n/ui-en.ts
  - src/i18n/ui-de.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
routes: []
models: []
test_files:
  - tests/unit/missions-3.test.ts
data_flow: writes-existing
last_synced: 2026-11-06
status: in_progress
phase: all
mdd_version: 11
tags: [campaign, map, map-3, missions, bosses, helicopters, difficulty, ranks, map-picker, low-level]
path: Game/Campaign/Third Map
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 48 — Third Map

## Purpose

Wave 2 of New Frontiers (owner, 2026-11-06: *"a third stage … with helicopters instead of airplanes"*). Map 3 is
a third campaign of 30 missions, flown only with helicopters and a kit that starts from zero (doc 49). It opens after
map 2, like map 2 opened after map 1 (doc 35). Maps 1 and 2 stay exactly as they are.

## Opening map 3 — the map picker

- The globe in the campaign map's top bar becomes a **map picker**: tap it (or **G**) and a small row of map chips
  drops below it — **1 · 2 · 3** (4 later) — the map on show highlighted, closed maps with a padlock. Pick a chip
  (tap, or ←/→ and ENTER, ESC closes). Picking a closed map plays `denied` and shows "Opens after mission 30" /
  "… 60" for two seconds.
- `mapOpen(save, c)` (pure): map 1 always; map 2 once m30 is cleared (`mapTwoOpen`, unchanged); map 3 once **m60**
  is cleared; the admin (doc 47) has all of them.
- The globe's badge shows the number of the map on show.
- Map 3's title: **"LOW LEVEL"** / **"TIEFFLUG"**; progress counted on that map only.

## Missions 61–90

- `MISSIONS_3` (`src/data/missions-3.ts`), `campaign: 3`, ids `m61`–`m90`, five theaters × six missions, every
  sixth a boss. `ALL_MISSIONS` holds all three maps; `campaignMissions(c)` one.
- Unlocks: m61 needs map 3 open; after that the previous mission of the same map.
- **Difficulty is a fresh climb** (the helicopter kit starts from zero): `difficulty = 12 + (n − 61) × 1.4` rounded
  (m61 12 … m90 53), so the threat curve (doc 05/43) starts about where map 1's second theater is and ends above
  map 1's finale. The map-2 factors (`map-two.ts`) apply to m31–m60 only.
- **Pay** (doc 43 rule "shop ≈ 1.5 × income"): map 3 has its own reward and pay scale, fitted to the helicopter shop
  (doc 49) — numbers in *Balance* below.
- Length: missions `100 + round((n − 61) × 1.2)` s, bosses `40 + (n − 60)` s.
- Briefings, names and objectives: `src/data/missions-3.ts` (English), `src/i18n/missions-3-de.ts` (German).
  Enemy pools lean on the ground (tanks, Shilkas, SAMs, bunkers, boats, enemy Hinds); fewer fast jets — the war is
  fought low.
- Until the deck liftoff (wave 4), map-3 sorties start in the air: LAUNCH goes straight to the mission
  (takeoff rating `skipped`, no takeoff bonus, as for anyone who skips).

## Five theaters (map 3, a new region)

| id | Name (EN / DE) | Look | Base | Boss |
|----|----------------|------|------|------|
| `fjords` | Fjord Country / Fjordland | canyon style: dark water between grey rock walls | sea | GLACIER — armoured icebreaker (ground) |
| `highlands` | Highland Passes / Hochland-Pässe | ice style, snow and dark rock | land | CITADEL — mountain fortress (ground) |
| `delta` | River Delta / Flussdelta | canyon style: brown river, green banks | land | CAIMAN — river monitor (ground) |
| `mesa` | Mesa Country / Tafelberge | desert style, red rock | land | MAMMOTH — super-heavy tank (ground) |
| `ashfall` | Ash Island / Ascheinsel | storm style, ash grey and lava red | sea | BEHEMOTH — twin-rotor gunship (air, final) |

- Routes snake across the whole map: the fjords top left, the highlands top right, the delta down the right side,
  the mesas back across the middle, Ash Island along the bottom.
- Bosses are data like those of maps 1–2 (`BOSSES_3`, `src/data/bosses-3.ts`) and drawn in code in
  `src/render/bosses-3.ts`; turrets, launchers and damage come from the shared boss renderer.
- Generic names only (public repo): no real units, operations or insignia.

## Debrief and the admiral

- m60's finale gets a second line: "A new front: low level, helicopters only. The globe has a third map."
- Within map 3 the admiral's "next theater" line works as on the other maps; m90 ends with `adm.finale3`.

## Pilot rating and ranks (doc 26 update)

- `RATING.maxStars` 180 → **270** and `maxScore` 60,000 → **90,000** (three maps), so the top rating grows from
  34,000 to **46,000**.
- One new rank above Top Gun Legend: `ace` **Ace of Aces / Ass der Asse** from **36,000** (rank board: three wide
  stripes). Earlier thresholds stay. The ladder service runs this code and rolls out with it.

## Not on map 3 (in this initiative)

- No map-3 medals, photos or paint jobs (initiative decision); minigame offers stay as they are.

## Business Rules

- Pure: `mapOpen`, `isUnlocked`, `nextMission(On)`, `campaignComplete` (`src/game/progress.ts`), the map-3 pay and
  threat (`src/game/map-three.ts`), the rating (`src/game/rating.ts`).
- `CampaignId` = `1 | 2 | 3`; every `Record<TheaterId>` / `Record<BossId>` table gets the new rows.

## Balance

(Filled in by the map-3-balance feature with the bot playtest.)
