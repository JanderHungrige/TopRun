---
id: 91-carrier-picture
title: Carrier Picture - The First Base as a Generated Picture, the Hangar Hall Through a Door, Day, Evening and Night
edition: TopRun
depends_on: [73-home-docks, 76-world-looks, 30-hangar-base, 63-hangar-tv]
relates: [73-home-docks, 76-world-looks, 86-jungle-looks, 30-hangar-base]
source_files:
  - src/game/base-light.ts
  - src/game/state.ts
  - src/main.ts
  - src/scenes/debrief.ts
  - src/data/base-areas.ts
  - src/data/base-docks.ts
  - src/scenes/hangar-base.ts
  - src/render/base/index.ts
  - src/render/base/dock.ts
  - src/render/base/dock-carrier.ts
  - dev/carrier-plates.py
  - src/assets/docks/carrier-day.png
  - src/assets/docks/carrier-evening.png
  - src/assets/docks/carrier-night.png
routes: []
models:
  - "GameContext.baseLight: 'day' | 'evening' | 'night' — the carrier base's light (runtime only)"
test_files:
  - tests/unit/base-light.test.ts
  - tests/unit/base-docks.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, carrier, day-night, backdrops, ambient, comfyui, map-1, map-2]
path: Game/Base/Carrier Picture
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 91 — Carrier Picture

> **Heli base (doc 92, 2026-11-08):** map 3 now has its own base, the helicopter base's hangar corner, and the light is drawn anew after missions of maps 1–3; the carrier lounge shows on maps 1–2.
> **Depth (doc 92):** the lounge has depth too — the arcade and the lockers a step back, the hangar door and the opening up lanes, the pilot smaller there (horizon 270).

## Purpose

Owner, 2026-11-08, on the first base (still drawn in code): *"Here we have the same problem with the disproportionate
jet. So at the back wall where the jet is now have a door which is open and you glimpse into a hangar with the jet. The
main hangar gets also a couch and table on a small rug. Cozy night feeling as right now."* From two rounds of examples
the owner picked **D** (a steel crew lounge, the couch on its rug, an open steel door into the hangar, the flight deck at
night through a big opening) — *"just the chalkboard wider at the current place. Just find another place for the picture
wall"* — and asked for the same room *"at night, evening and day"*, made with a Couch workflow that freezes the picture
and changes only light and colour. On the hangar seen through the door: *"should be inside (hall look) … Day: hall in
daylight. Evening: evening light. Night: neon lit."* The owner chose hall **A** of three: *"Take A. Put the character back
in the right proportion. After a played mission of worlds 1 and 2 take day, evening or night at random."*

## The pictures

- **The room** (the "Top Gun pixel scene 16:9" workflow, picture D): a riveted steel lounge deep in the carrier — the pink
  rec room alcove with the arcade and the lockers on the left, the scoreboard over a long horizontal chalkboard on the back
  wall, the couch and the coffee table on a small rug, the open steel door into the hangar, the cork board with photos on
  the right wall (moved there with the frozen edit, the chalkboard widened in its place), the big opening onto the flight
  deck on the right.
- **Evening and day** are the night room relit with the **frozen edit** workflow (Couch "Top Gun pixel scene – frozen edit
  16:9"): the plate is re-sampled from its own latent over the last 75 % of the noise schedule with itself as the
  reference, so the room, the furniture and the framing stay and only light and colour change (day seed 7, evening seed 11).
- **The hangar hall** through the door is a picture of its own (the scene workflow at the door's 720 × 1216): the jet head
  on in a hall with rows of high windows; evening from the same seed and prompt with evening light; **night is the day hall
  frozen and relit** (denoise 0.85), so it is the same hall — dark windows with stars, pink and cyan neon tubes.
- `dev/carrier-plates.py` samples each room render on the 320 × 180 art grid, pastes the hall view into the door
  (art px 192–228 × 60–121), quantizes to 48 colours and writes `src/assets/docks/carrier-day.png`, `-evening.png`,
  `-night.png`.

## In the game

- The carrier look (maps 1–3) is now a dock like the others (doc 73): the picture, world 1's flip board over its scoreboard
  and its framed chalkboard over the picture's, the TV cart and the joystick neon drawn in code, the pulsing brackets, no
  name plates. The code-drawn hangar (doc 30) only stands in while the picture loads.
- **Areas:** FUN MISSIONS the rec room alcove, TV the cart in front of it, LOCKER the lockers, PICTURE WALL the cork board,
  LOADOUT the open door into the hangar, LADDER the scoreboard, CHALKBOARD the chalkboard, EXIT · MAP the opening onto the
  flight deck.
- **The pilot to scale:** the dock's pilot scale makes a grown-up as tall as the lockers and the arcade say; no plane
  captain (the jet is in the hall now).
- **Ambient:** dust motes; the three hanging lamps glow warm in the evening and at night; at night stars twinkle over the
  sea through the opening and the hall's neon hums in the door.

## Day, evening, night

- `GameContext.baseLight` (runtime only) picks the carrier picture. It starts at random; after every played mission of
  **map 1 or 2** (the debrief) it is drawn anew at random, so it may stay the same. Missions of the other maps leave it
  as it is (map 3 still shows the carrier base in its last light).
- `lightAfterMission(campaign, current, r)` and `randomLight(r)` are pure (`src/game/base-light.ts`).
