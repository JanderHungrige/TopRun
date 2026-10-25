---
id: 24-medals-core
title: Medals Core - Service Record, Medal Catalogue, Awards and Ceremony Trigger
edition: TopRun
depends_on: [02-hangar-economy, 03-campaign-map, 10-minigames-core, 07-i18n]
relates: [25-medal-ceremony, 03-campaign-map, 10-minigames-core]
source_files:
  - src/data/medals.ts
  - src/game/medals.ts
  - src/game/service-record.ts
  - src/i18n/medals-de.ts
routes: []
models:
  - "SaveData.record: ServiceRecord (per pilot)"
  - "SaveData.progress[id]: { stars, at?, plane?, livery? } (photo data for the picture wall, doc 27)"
test_files:
  - tests/unit/medals.test.ts
data_flow: writes-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [medals, honours, service-record, awards, ceremony]
path: Game/Honours/Medals
initiative: home-base-honours
wave: home-base-honours-wave-1
wave_status: active
integration_contracts:
  - function: "Route { to: 'ceremony', medals, then }"
    when: "the debrief and the minigame shell go to the ceremony before their next screen when new medals were earned"
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.record and progress photo fields parsed from the untrusted profile store)
sister_projects: []
---

# 24 — Medals Core

## Purpose

What medals exist, what earns them, the per-pilot service record that feeds them, and when the
ceremony (doc 25) plays. Honours only — no effect on money, gear or difficulty.

## Service record (`SaveData.record`)

| Field | Counts |
|-------|--------|
| sorties | missions flown to the end (success or failure; aborted ones don't count) |
| wins | successful missions |
| kills | enemies destroyed (all kinds) |
| bossKills | bosses destroyed |
| flawless | successful missions finished at 100 % hull |
| gunOnly | successful missions without firing a single missile, rocket or bomb |
| launchStreak / bestLaunchStreak | consecutive PERFECT carrier launches (any other rating, incl. skipped, resets) |
| planesFlown | jets that flew at least one sortie |

`recordMission(record, result, plane)` is pure. `MissionResult` gains optional `usedSecondaries`
(the mission scene sets it; missing = true, so old fixtures never count as gun-only).

## Medal catalogue (18; generic names, original designs)

| Group | id | Name (EN) | Earned when |
|-------|----|-----------|-------------|
| campaign | pacific / gulf / arctic / canyon / leviathan | {Theater} Campaign Ribbon | that theater's boss mission cleared |
| campaign | victory | Victory Medal | mission 30 cleared |
| campaign | allstars | Golden Star | 3 stars on all 30 missions |
| combat | ace | Ace Wings | 50 kills |
| combat | topace | Top Ace | 250 kills |
| combat | giant | Giant Slayer | 3 bosses destroyed |
| combat | untouchable | Untouchable | a mission finished at 100 % hull |
| combat | gunslinger | Gunslinger | a mission won without missiles, rockets or bombs |
| combat | catapult | Catapult Star | 5 perfect launches in a row |
| offduty | offduty5 | Off-Duty Star | gold in 5 different minigames |
| offduty | offduty10 | Base Legend | gold in all ten minigames |
| dedication | sorties25 | Sortie Pin | 25 sorties |
| dedication | sorties100 | Iron Pilot | 100 sorties |
| dedication | triple | Triple Threat | sorties flown in all three jets |

Each medal has a short citation (EN in `data/medals.ts`, DE in `i18n/medals-de.ts`) and a look
(ribbon colours + medal shape) used by the ceremony and the locker art.

## Business Rules

- `earnedMedals(save, minigameGolds)` derives the earned set (in catalogue order) from progress, the
  service record and the minigame golds count (the scene layer counts golds through the registry).
  Never stored — always consistent with the save; old pilots get their medals retroactively (the
  record starts empty, so record-based medals start counting from this version).
- `newMedals(before, after)` = earned after − earned before.
- **Ceremony trigger**: the debrief compares the save before/after the mission; the minigame shell
  compares before/after recording a round. With new medals, the next navigation (debrief CONTINUE /
  FLY AGAIN / HANGAR / offer; minigame BACK / RETRY / QUIT) goes to `{ to: 'ceremony', medals, then }`
  first and the ceremony continues to `then`.
- **Photo data**: when a mission is cleared with stars ≥ its previous best, its progress entry stores
  `at` (time), `plane` and `livery` — the picture wall (doc 27) draws the photo from them.
- Save parsing: unknown / malformed record fields fall back to 0 / []; photo fields are validated
  (finite time, known plane, unlocked livery) or dropped.

## Data Flow

Writes-existing: extends `SaveData` (record, progress entries) and `MissionResult`.

## Dependencies

02 (save, liveries), 03 (missions, debrief), 10 (minigame bests/medals), 07 (texts).

## Security

The record and photo fields come from the untrusted profile store: parsed and clamped.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
