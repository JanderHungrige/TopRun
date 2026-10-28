---
id: off-duty-minigames-2
title: Off-Duty Minigames II
status: active
version: 2
hash: d2aeacab
created: 2026-10-28
---

# Off-Duty Minigames II

## Overview
Owner (2026-10-28): *"let's do some more minigames. A full new row. Playing pool from top view, air dog fight from
the cockpit view (bigger one actually), doing the topgun high five (top, then 180 degree below). Bombing ground
targets from targeting view, flying through a canyon, quiz on military navy and army ranks (real ones), …"*;
answers: **two new rows** — the owner's six plus four of mine; the rank quiz covers **US and German** forces;
the new games **unlock along map 1**, between the first ten.

Ten more games for the rec room (doc 11), built on the same shell and rules as the first ten (doc 10): rules card →
3-2-1 → play → result card with personal best and bronze / silver / gold, RETRY / BACK; per-pilot bests in
`SaveData.minigames`; offered after missions (a new unlock first, else every 3rd mission a seeded pick); for fun only,
no effect on money, gear or progress. Keyboard, mouse / touch and gamepad / joystick.

| # | Game | id | Kind | View | Unlocks after mission |
|---|------|----|------|------|-----------------------|
| 11 | Darts (the rec room's board) — *mine* | `darts` | off duty | front, swaying aim | 2 |
| 12 | High Five (jump, slap up top, spin 180°, slap down low) | `highfive` | off duty | side, timing | 4 |
| 13 | Target Pod (bomb ground targets from the targeting view) | `targetpod` | flying | targeting pod, grey-scale | 7 |
| 14 | Pool (ready-room table) | `pool` | off duty | top view | 8 |
| 15 | Rank Quiz (US and German navy and army ranks) | `ranks` | off duty | quiz cards | 10 |
| 16 | Parachute (eject and land on the cross) — *mine* | `parachute` | flying | side view, wind | 11 |
| 17 | Air Show (fly the judges' aerobatic sequence) — *mine* | `airshow` | flying | side view | 14 |
| 18 | Deck Handler (park jets on a crowded deck to clear the catapult) — *mine* | `deck` | off duty | top view, puzzle | 16 |
| 19 | Canyon Run (thread the canyon) | `canyon` | flying | chase view, pseudo-3D | 20 |
| 20 | Cockpit Dogfight (the big one) | `dogfight` | flying | cockpit view, pseudo-3D | 27 |

Shared changes (wave 1): the rec room grows from two rows of five to **four rows of five** (compact cards: icon
left, name, best and medal right) — the first ten keep their rows; `MinigameId`, `MINIGAMES` and the shell registry
grow by ten; the offers, medals (doc 24) and service record take the new ids like the old ones.

Rules for content (public site): original art, music and text only — no film scenes, quotes, character names,
real unit insignia, logos or flags. The rank quiz is **text only** (names, order, pay grade / NATO code,
equivalents); no insignia drawings (owner rule: no real insignia). The high five is a celebration between the
pilot and Duke on the flight deck; it borrows nothing beyond the gesture.

## Open Product Questions
- [x] Size → two new rows: the owner's six + four ideas of mine (owner).
- [x] Rank quiz forces → US (Navy, Army) and German (Marine, Heer), text only (owner; insignia rule).
- [x] Unlocks → along map 1, between the first ten (owner).
- [x] The four extra games → Darts, Parachute, Air Show, Deck Handler (my picks within the owner's "6 + 4 more";
      the owner may swap any before its wave — a swap changes that wave and its card only).
- [x] Pool → a 9-ball frame against Duke (AI), medal by margin; revisable when wave 2 is planned.
- [x] Cockpit Dogfight scope → rounds of bandits with guns and missiles from the cockpit; details fixed when wave 5
      is planned (it does not affect the shared code).

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/off-duty-minigames-2-wave-1.md | The rec room shows four rows (twenty cards, ten new locked until their mission); Rank Quiz and High Five are playable with bests and medals and are offered after missions 4 and 10. | planned |
| Wave 2 | waves/off-duty-minigames-2-wave-2.md | Pool and Darts are playable from the rec room. | planned |
| Wave 3 | waves/off-duty-minigames-2-wave-3.md | Target Pod, Parachute and Canyon Run are playable. | planned |
| Wave 4 | waves/off-duty-minigames-2-wave-4.md | Air Show and Deck Handler are playable. | planned |
| Wave 5 | waves/off-duty-minigames-2-wave-5.md | Cockpit Dogfight is playable; all twenty games done. | planned |
