---
id: 03-campaign-map
title: Campaign Map - 30 Missions, Theaters, Briefing, Debrief
edition: TopRun
depends_on: [01-game-core, 02-hangar-economy]
relates: [05-mission-combat, 06-talking-characters, 07-i18n]
source_files:
  - src/data/theaters.ts
  - src/data/missions.ts
  - src/game/progress.ts
  - src/scenes/map.ts
  - src/scenes/map-render.ts
  - src/scenes/debrief.ts
routes: []
models:
  - localStorage:topgun.save.v1 (progress)
test_files:
  - tests/unit/missions-data.test.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [campaign, world-map, missions, theaters, briefing, debrief, progression, stars]
path: Game/Campaign
integration_contracts:
  - function: "MISSIONS[i] (MissionDef)"
    when: "takeoff and mission scenes receive the MissionDef chosen on the map"
satisfies_contracts:
  - from: 02-hangar-economy
    function: "computePayout(mission, result, firstClear)"
    when: "debrief applies money"
    status: done
    verified_at: "src/scenes/debrief.ts:26 (applyResult → src/game/economy.ts:128)"
  - from: 01-game-core
    function: "persistSave(save)"
    when: "debrief writes money + progress"
    status: done
    verified_at: "src/scenes/debrief.ts:27 (GameContext.setSave → src/main.ts:30)"
known_issues: []
security_read_sites: []
sister_projects: []
---

# 03 — Campaign Map

> **2026-10-25 update (paint jobs, doc 09):** the debrief computes the liveries this mission unlocked
> (`newlyUnlocked(before, after)`); the admiral announces each one after the pay line and a gold banner
> "NEW PAINT JOB: {livery}" is shown.

## Purpose

> **Map 2 (2026-10-27, doc 35):** missions 31–60 on a second map behind the globe in the top bar, opened by
> clearing mission 30. Everything below describes map 1, which stays unchanged.

The strategic layer: a stylised world map with **30 missions** in **5 theaters**. The player
picks an unlocked mission, reads its briefing, visits the hangar or launches. After the mission
the debrief shows results, stars and the payout, then returns to the map.

## Architecture

```
data/theaters.ts   5 theaters: palette (sea, land, accent), map region polygon, label
data/missions.ts   30 MissionDef: id, number, name, theater, briefing, objective,
                   difficulty 1–30, reward, length (s), enemy pool, boss?, map position
game/progress.ts   isUnlocked / nextMission / totalStars / campaignComplete
scenes/map.ts      selection + briefing panel + buttons (Hangar / Launch / Title)
scenes/map-render.ts  draws ocean, theater regions, route line, mission nodes
scenes/debrief.ts  result table, stars, payout breakdown, Continue
```

Flow: Map → (Hangar ↔ Map) → Takeoff (04) → Mission (05) → Debrief → Map.

## Data Model

`MissionDef`:

```ts
{ id: 'm01'…'m30', number: 1–30, name, theater: TheaterId, briefing: string,
  objective: { type: 'patrol' } | { type: 'intercept', count } |
             { type: 'strike', target: EnemyKind, count } | { type: 'boss', boss: BossId },
  difficulty: 1–30, reward: dollars, length: seconds, pool: EnemyKind[], map: {x, y} }
```

### Theaters and missions

| # | Theater | Missions | Boss (last mission) |
|---|---------|----------|---------------------|
| 1 | Pacific Training Range | 1–6 | Ironclad (battleship) |
| 2 | Persian Gulf | 7–12 | Sandstorm (coastal fortress) |
| 3 | Arctic Shield | 13–18 | Blackjack (strategic bomber) |
| 4 | Red Canyon | 19–24 | Typhoon (flying wing) |
| 5 | Operation Leviathan | 25–30 | Leviathan (enemy supercarrier) |

Mission list (objective in brackets):
1 First Sortie [patrol] · 2 Bandits at Angels 12 [intercept 12] · 3 Island Radar [strike 3 radar] ·
4 Picket Line [intercept 18] · 5 Convoy Breaker [strike 4 boat] · 6 Ironclad [boss] ·
7 Desert Dawn [patrol] · 8 SAM Alley [strike 4 sam] · 9 Oil Depot Raid [strike 3 depot] ·
10 Fulcrum Fury [intercept 24] · 11 Tank Column [strike 6 tank] · 12 Sandstorm [boss] ·
13 Northern Watch [patrol] · 14 Ice Breaker [strike 2 destroyer] · 15 Radar Blackout [strike 4 radar] ·
16 Bear Hunt [strike 5 bear] · 17 Whiteout [intercept 30] · 18 Blackjack [boss] ·
19 Red Canyon Run [patrol] · 20 Hornet's Nest [strike 5 sam] · 21 Gunship Graveyard [strike 8 hind] ·
22 Supply Line [strike 5 depot] · 23 Flanker Ace [intercept 34] · 24 Typhoon [boss] ·
25 Storm Front [patrol] · 26 Picket Destroyers [strike 3 destroyer] · 27 Drone Swarm [intercept 45] ·
28 Shore Batteries [strike 6 sam] · 29 Eye of the Storm [intercept 40] · 30 Leviathan [boss]

Rewards: `round100(1200 + (n−1) × 380)`, boss missions × 1.5. Lengths 70 s → 130 s.

## API Endpoints

None.

## Business Rules

- Mission n is **unlocked** if n = 1 or mission n−1 is cleared. Cleared missions are replayable
  (half base reward — see 02). Locked nodes can be inspected but not launched.
- Map selection: mouse/touch click on a node, or arrows/stick step through unlocked nodes;
  default selection is the highest unlocked mission.
- Briefing panel shows: number + name, theater, objective text with count, threat level
  (difficulty as 1–5 chevrons), reward (with "replay ×0.5" when cleared), best stars,
  expected enemy types, current plane + loadout summary.
- Buttons: HANGAR, LAUNCH (disabled when locked), TITLE. Keyboard: Enter = Launch,
  H = Hangar, Esc = Title.
- Debrief: SUCCESS/FAILED banner, objective result, kills / spawned, hull %, takeoff rating,
  payout lines (base, takeoff bonus, hull bonus, collected or salvage), stars earned
  (best kept), new money total. Updates `progress[id].stars = max(old, new)` on success.
- After clearing mission 30: debrief shows "CAMPAIGN COMPLETE" and the map shows a medal.

- **Talking character (06):** admiral (debrief speech while the pay counts up). All visible text goes through i18n (07).

## Data Flow

Greenfield. `MISSIONS` (static) + `save.progress` → map UI. Selected `MissionDef` is passed into
Takeoff → Mission → `MissionResult` → Debrief → `computePayout` → `save.money/progress` →
`persistSave`.

## Dependencies

- 01-game-core (scenes, input, save), 02-hangar-economy (payout, stars, hangar scene).

## Security

None (static data, local state).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)

## Challenge level on the mission panel (doc 38)

Under YOUR JET the panel shows "CHALLENGE +3" (gold) when the pilot's challenge level is above 0, or "ROOKIE" (green).
The reward line is clipped to the panel (German "(Wiederholung)" used to run past its edge).
