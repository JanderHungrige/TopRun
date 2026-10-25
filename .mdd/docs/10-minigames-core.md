---
id: 10-minigames-core
title: Minigames Core - Registry, Unlocks, Offers, Bests and the Game Shell
edition: TopRun
depends_on: [01-game-core, 03-campaign-map, 07-i18n, 08-pilot-profiles]
relates: [11-base-hub, 12-pushup-challenge, 13-tower-flyby]
source_files:
  - src/data/minigames.ts
  - src/game/minigames/core.ts
  - src/i18n/minigame-text.ts
  - src/i18n/minigames/names.ts
  - src/scenes/minigames/contract.ts
  - src/scenes/minigames/registry.ts
  - src/scenes/minigames/shell.ts
  - src/scenes/minigames/shell-render.ts
routes: []
models:
  - "SaveData.minigames: Partial<Record<MinigameId, { best: number; plays: number }>> (per pilot)"
  - "Settings.minigameOffers: boolean (device, default true)"
test_files:
  - tests/unit/minigames.test.ts
data_flow: writes-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, unlocks, personal-best, medals, game-shell]
path: Game/Minigames/Core
initiative: off-duty-minigames
wave: off-duty-minigames-wave-1
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "every minigame exports one module and is listed in registry.ts; the shell does rules, countdown, pause, result, saving"
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.minigames parsed from the untrusted profile store)
sister_projects: []
---

# 10 — Minigames Core

## Purpose

The shared machinery for the ten off-duty minigames (initiative `off-duty-minigames`): which games
exist and when they unlock, when one is offered after a mission, personal bests and medals per
pilot, and the **shell** every game runs in, so each game only implements its own play.

## Architecture

```
data/minigames.ts              MINIGAME_IDS, MINIGAMES (unlockAfter mission number, kind)
game/minigames/core.ts         unlocked / newlyUnlocked / offerAfterMission / medalFor /
                               recordScore / parseMinigames — pure, tested
i18n/minigame-text.ts          gameText(en, de) + mt(table, key, params): per-game string tables
i18n/minigames/names.ts        the ten game names (EN/DE) — the hub lists locked games too
scenes/minigames/contract.ts   MinigameModule / MinigameRound — what a game implements
scenes/minigames/registry.ts   PLAYABLE: the games that are built (only these appear anywhere)
scenes/minigames/shell.ts      MinigameScene: rules → 3-2-1 → play → (pause) → result
scenes/minigames/shell-render  rules card, top bar, pause overlay, result card
```

Routes: `{ to: 'minigame', id, from: 'base' | 'offer' }` (leaving goes back to the hub or the map).

### Game contract

```ts
interface MinigameRound {
  update(dt: number, input: Input): number | null; // fixed 1/60 tick; final score ends the round
  render(ctx): void;                                // the whole 1280×720 field; shell top bar on top (y < 56)
  liveScore(): string;                              // formatted, for the top bar
  dispose?(): void;                                 // stop sounds
}
interface MinigameModule {
  id: MinigameId; medals: { bronze; silver; gold }; higherIsBetter: boolean;
  formatScore(score: number): string;               // localized, e.g. "42 push-ups"
  rules(): { lines: readonly string[]; controls: readonly string[] };   // localized
  drawIcon(ctx, t): void;                           // hub card icon around (0, 0), ±40 px
  create(game: GameContext): MinigameRound;
}
```

## Data Model

| Game | id | kind | Unlocks after mission |
|------|----|------|----|
| Push-up Challenge | pushups | offduty | 1 |
| Tower Flyby | flyby | flying | 3 |
| Formation Flying | formation | flying | 5 |
| Beach Volleyball | volleyball | offduty | 6 |
| Air Refuelling | refuel | flying | 9 |
| Motorbike vs. Jet | motorbike | offduty | 12 |
| Missile Evasion | evasion | flying | 15 |
| Piano Bar | piano | offduty | 18 |
| Carrier Landing | landing | flying | 21 |
| Dogfight Tactics | tactics | flying | 24 |

`SaveData.minigames[id] = { best, plays }` — `best` is the best score so far (higher or lower is better
per game), `plays` counts finished rounds. Missing entry = never played.

## Business Rules

- **Playable** = listed in `registry.ts`. Unbuilt games never appear in offers and show as
  "COMING SOON" in the hub.
- **Unlocked** = playable and mission `unlockAfter` cleared (in `progress`). Derived, never stored.
- **Offer after a mission** (successful debrief only, only if `settings.minigameOffers`):
  1. a game that this mission newly unlocked (the first one in data order), else
  2. if the mission number is a multiple of 3: one unlocked game picked by `missionNumber` (seeded,
     deterministic), else no offer.
- **Medals**: `higherIsBetter` → score ≥ gold → gold, ≥ silver → silver, ≥ bronze → bronze; otherwise
  (times) score ≤ gold → gold … Below bronze: no medal.
- **Recording**: every finished round increments `plays`; `best` updates when the score beats it
  (or there was none). Aborted rounds (quit from pause) record nothing. For fun only: no money,
  gear or progress changes.
- **Shell**: rules card (game name, rules lines, controls, personal best, START / BACK) → 3-2-1
  countdown (beeps) → play (top bar: name, live score; P / Esc pauses: RESUME / QUIT) → result
  card (score, medal, personal best, "NEW BEST!", RETRY / BACK). BACK returns to the hub (`from:
  'base'`) or the map (`from: 'offer'`).
- **Strings**: shell texts in `ui-en/ui-de` (`mg.*`); each game's own texts in
  `src/i18n/minigames/<id>.ts` built with `gameText(en, de)` (identical keys and placeholders).
- **Save parsing**: unknown ids dropped; `best` must be a finite number, `plays` an integer ≥ 0,
  otherwise the entry is dropped.

## Data Flow

Writes-existing: extends `SaveData` (02/08) and `Settings` (08); reads `progress` (03).

## Dependencies

01 (scenes, input, audio), 03 (progress, debrief), 07 (i18n), 08 (profiles, settings).

## Security

`SaveData.minigames` is parsed from the untrusted profile store (see rules).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
