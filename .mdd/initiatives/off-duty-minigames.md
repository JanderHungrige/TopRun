---
id: off-duty-minigames
title: Off-Duty Minigames
status: active
version: 1
hash: 6f3dd670
created: 2026-10-25
---

# Off-Duty Minigames

## Overview
Ten optional, Top-Gun-flavoured minigames that break up the campaign. They are **for fun only**:
personal bests and medals per pilot, no effect on money, gear or progress. Two ways in (owner
decision "both"): a game is **offered after certain missions** (PLAY / SKIP), and every unlocked game
can be **replayed from a BASE hub** on the campaign map.

| # | Game | Kind | Unlocks after mission |
|---|------|------|-----------------------|
| 1 | Push-up Challenge | off duty | 1 |
| 2 | Tower Flyby | flying | 3 |
| 3 | Formation Flying (AI lead; co-op later) | flying | 5 |
| 4 | Beach Volleyball | off duty | 6 |
| 5 | Air Refuelling | flying | 9 |
| 6 | Motorbike vs. Jet | off duty | 12 |
| 7 | Missile Evasion (flares + manoeuvres) | flying | 15 |
| 8 | Piano Bar (rhythm game, original tune) | off duty | 18 |
| 9 | Carrier Landing (cockpit view, night) | flying | 21 |
| 10 | Dogfight Tactics (briefing-room whiteboard) | flying | 24 |

Shared rules (built in wave 1, used by every game):
- Unlocks are derived from campaign progress (mission N cleared), like paint jobs (doc 09).
- Offers: after a successful debrief, CONTINUE shows an "OFF DUTY" card if this mission unlocked a
  game ("NEW"), otherwise after every 3rd mission number a seeded random unlocked game. The hub has
  a toggle "Offers after missions: ON/OFF" (device setting).
- Every game: rules card (what, controls) → 3-2-1 → play → result card (score, personal best,
  bronze/silver/gold medal) → RETRY / BACK. Keyboard, mouse/touch and gamepad/joystick (via the
  existing input actions).
- Per pilot `SaveData.minigames: Record<MinigameId, { best: number; plays: number }>`.
- Code layout: pure scoring/rules `src/game/minigames/<id>.ts` + Vitest; scene
  `src/scenes/minigames/<id>.ts`; art `src/render/minigames/<id>…`; strings in
  `src/i18n/minigames/<id>.ts` (EN + DE tables with identical keys).
- Characters: the wingman hosts the hub and comments; the chief/admiral can appear where it fits.
- Public site: all music original (the piano tune is an original rock'n'roll piece), no film songs,
  quotes, character names or actor likenesses.

## Open Product Questions
- [x] Rewards → for fun only (owner): bests + medals, no economy effect.
- [x] Placement → both (owner): offered after missions + replayable from the BASE hub.
- [x] Which games → all ten (owner).
- [x] Co-op formation flying → later, together with the LAN co-op backlog item; wave 2 builds it with an AI lead.
- [x] Piano music → original composition (copyright; public site).
- [x] Can offers be turned off → yes, hub toggle (device setting), default ON.

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/off-duty-minigames-wave-1.md | From the map open BASE, play Push-ups and Tower Flyby with medals and personal bests; after mission 1 the debrief offers Push-ups. | complete |
| Wave 2 | waves/off-duty-minigames-wave-2.md | Formation Flying, Air Refuelling and Missile Evasion are playable from BASE and offered after their unlock missions. | complete |
| Wave 3 | waves/off-duty-minigames-wave-3.md | Carrier Landing (cockpit view) and Dogfight Tactics are playable. | complete |
| Wave 4 | waves/off-duty-minigames-wave-4.md | Beach Volleyball, Motorbike vs. Jet and Piano Bar are playable; all ten games done. | planned |
