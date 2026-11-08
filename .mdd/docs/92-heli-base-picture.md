---
id: 92-heli-base-picture
title: Heli Base Picture - Map 3's Home Base as a Cozy Hangar Corner, the Helicopter Outside the Gate, the Map Table, Day, Evening and Night, Walk-Behind
edition: TopRun
depends_on: [91-carrier-picture, 73-home-docks, 76-world-looks, 48-third-map]
relates: [91-carrier-picture, 73-home-docks, 76-world-looks, 49-helicopter-kit]
source_files:
  - src/game/base-light.ts
  - src/data/base-areas.ts
  - src/data/base-docks.ts
  - src/render/base/dock.ts
  - src/render/base/dock-carrier.ts
  - src/render/base/dock-front.ts
  - src/game/base-hangar.ts
  - src/render/base/cast.ts
  - src/scenes/hangar-base.ts
  - dev/heli-plates.py
  - src/assets/docks/heli-day.png
  - src/assets/docks/heli-evening.png
  - src/assets/docks/heli-night.png
  - src/assets/docks/heli-front.png
routes: []
models: []
test_files:
  - tests/unit/base-light.test.ts
  - tests/unit/base-docks.test.ts
  - tests/unit/base-hangar.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, helicopters, day-night, depth, walk-behind, backdrops, ambient, comfyui, map-3]
path: Game/Base/Heli Base Picture
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 92 — Heli Base Picture

## Purpose

Owner, 2026-11-08, after the carrier lounge (doc 91): *"Can you bring up the helicopter base for me? Having day,
evening, night here would be great."* A first round (the carrier lounge rebuilt in wood) was turned down — *"I would like
a different setting, not the same in green. E.g. a common room in a hangar that has been set up a bit cozily, with a map
table (map) and a big gate to the outside where a helicopter can be seen (loadout). At night it is lit (floodlight).
Again use the workflow to freeze a picture and only adjust the colour tones."* Of three examples the owner took **K2**,
*"but the helicopter outside seems to have two tails. In K1 I like the outside best"*, and asked how the pilot and the map
table in the foreground go together.

## The pictures

- **The room** (the "Top Gun pixel scene 16:9" workflow, K2, rendered on the M1): a corner of a corrugated-metal hangar the
  crew made their own — fairy lights along the trusses, the pink arcade between the olive lockers on the left, the
  scoreboard over the chalkboard, cork boards with photos, the couch and a coffee table on a rug, the big map table with its
  green lamp in the right foreground, the huge open gate. Widening the chalkboard with the frozen edit failed (it grew tall
  and swallowed the scoreboard), so world 1's chalkboard is laid wider than the picture's, over it and the first cork
  board; the second cork board is the picture wall.
- **Outside the gate** is K1's view — the helicopter on the lit helipad, mountains, moon and stars — cut out of K1 and
  pasted into K2's gate (K2's own helicopter had two tails). Evening and day are that view relit with the frozen edit, so
  the helicopter and the mountains stay.
- **Evening and day** of the room: the frozen edit of the night room (denoise 0.75), the outside pasted in per light. On
  the M1 the frozen edit runs at 640 × 360 (half size; the art grid is 320 × 180 anyway): at 1280 × 720 it swapped for
  over 45 minutes, at half size it takes about 7.
- `dev/heli-plates.py` samples the renders on the 320 × 180 art grid, pastes the outside, quantizes to 48 colours and writes
  `src/assets/docks/heli-day.png`, `-evening.png`, `-night.png`, plus `heli-front.png`, the map table's walk-behind mask.

## In the game

- Map 3's base is now the look `heli` (`baseLookOf(3)`), drawn like the other picture looks (doc 73): world 1's flip board
  and chalkboard over the picture's, the TV cart and the joystick neon in code, the brackets, no name plates.
- **Areas:** FUN MISSIONS the arcade, TV the cart, LOCKER the lockers, PICTURE WALL the cork board, LOADOUT the open gate
  with the helicopter, LADDER the scoreboard, CHALKBOARD the chalkboard, **EXIT · MAP the map table**.
- **Walk-behind:** the map table stands in front of the pilot's walk line. Its pixels (the mask `heli-front.png`, white =
  in front) are drawn again over the pilot (`dock-front.ts`), so the pilot walks behind the table and, at the map, stands
  behind it as if studying the map — legs and hips hidden, chest and head above the table top.
- **The pilot to scale** with the lockers and the arcade.
- **Ambient:** dust motes, the fairy lights twinkling, the hanging lamps glowing in the evening and at night, stars at
  night over the mountains.
- **Day, evening, night:** `GameContext.baseLight` (doc 91) is now drawn anew after every played mission of maps 1–3.

## Depth (owner: *"Can the person's size change while walking — smaller at the back by the sofa / locker?"* — first for the helicopter base, where the size differences are the largest)

- An area may stand deeper in the room: `standY` (the feet's floor line) and `via` (the free lane up from the front line).
  The pilot walks the front line (PILOT_FLOOR_Y 640) to the lane, up it into the room (at half pace), then sideways to the
  spot; leaving, the same way back (`walkTo`, `walkToArea`, the walker's `path` and `lane`; pure, tested).
- The look's `horizon` (417 on the helicopter base, from the lockers and the gate) scales the pilot with the feet's line:
  `scaleAt(L, y) = pilot × (y − horizon) / (640 − horizon)` — 0.91 on the front line, about 0.39 in the gate. The TV cart
  takes the scale of where it stands.
- On the helicopter base the lane runs between the coffee table and the map table (x 750): up it lie the TV and the
  picture wall (by the back wall) and the gate (in the gate's opening, small beside the helicopter); the arcade and the
  lockers are a step back from the front line; the map is the front line behind the table.
- Spots on one row deeper in the room share free floor: from one to the other the pilot walks straight across (on the
  row already, standing or walking), without going back to the front line.

### The other bases (owner, 2026-11-08: *"OK, except for the jungle world. We need to work on that again."*)

- **Carrier lounge** (maps 1–2): horizon 270, pilot 1 on the front line. The arcade and the lockers a step back (y 560,
  straight across between them); the hangar door up the lane right of the coffee table (x 790, in the door's left side at
  y 495 — about 0.6, the jet's nose stays in view); the opening onto the flight deck on its threshold (y 580).
- **Sea dock** (map 4): now the lounge D41 with its own depth (doc 93: horizon 240, pilot 1.05).
- **Space dock** (map 5): horizon 220, pilot 0.94 (was 0.86, for the same reason). The arcade alcove and the lockers a step
  back (y 545). The shelf with the photos stays on the front line: the TV cart stands in front of it.
- No look needs a walk-behind mask besides the helicopter base's map table: the lanes and spots keep clear of the couches,
  the tables and the TV cart (the cast is drawn over the picture and the cart).
- The **jungle base** keeps the front line (no `standY`, no `horizon`) until it is reworked.
