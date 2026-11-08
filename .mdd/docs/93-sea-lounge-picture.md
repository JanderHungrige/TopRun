---
id: 93-sea-lounge-picture
title: Sea Lounge Picture - Map 4's Home Base as a Bigger Underwater Lounge, the Submarine's Bow in the Window, the Painted Globe and TV, Depth
edition: TopRun
depends_on: [92-heli-base-picture, 73-home-docks, 76-world-looks]
relates: [92-heli-base-picture, 91-carrier-picture, 76-world-looks, 63-hangar-tv]
source_files:
  - src/data/base-docks.ts
  - src/render/base/dock.ts
  - src/render/base/dock-sea.ts
  - src/render/base/dock-ambient.ts
  - src/render/base/ambient.ts
  - dev/dock-plates.py
  - dev/inpaint-plate.py
  - src/assets/docks/sea.png
routes: []
models: []
test_files:
  - tests/unit/base-docks.test.ts
  - tests/unit/base-hangar.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, underwater, depth, backdrops, ambient, comfyui, inpainting, map-4]
path: Game/Base/Sea Lounge Picture
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 93 — Sea Lounge Picture

## Purpose

Owner, 2026-11-08, on the underwater base (map 4, doc 76's picture C): the code-drawn globe *"fits very badly
visually"* — first an inpainting workflow was to work it into the picture's bottom-right corner; then: *"Honestly the
chalkboard is too small, isn't it? Can you create a bigger room? Straight away with the globe and everything we need."*
On the first new rooms: *"Cool, but maybe arrange it differently, otherwise it is too much like the others. The submarine
is too far away too. Rather just a section of it, bigger in the window. The window maybe a bit bigger too."* And: *"Can you
build in the TV with the video recorder straight away? Then it is more in the same design."* Of six examples (C: a round
porthole in the middle of the back wall, D: the whole left wall one window) the owner took **D41**.

## The picture

- **D41** ("Top Gun pixel scene 16:9" workflow on the PC, seed 41): a spacious teal lounge on the sea floor. The whole left
  wall is one big window with a riveted frame; the submarine is docked right outside, its bow with a round hatch and its
  conning tower filling the glass. In front of the window stands a large antique floor globe. On the back wall a wide
  scoreboard with amber lamps over a big chalkboard, the floor lamp on a side table, a leather couch, the old CRT TV with
  its video recorder and cassettes on a cabinet, a cork board with photos; on the right a doorway glowing pink into the rec
  room with the arcade, and the lockers along the right wall; brass pipes, fairy lights, a rug.
- `dev/dock-plates.py src/assets/docks sea=<raw>` samples the render on the 320 × 180 art grid, 48 colours.

## In the game

- **Areas:** FUN MISSIONS the rec room's doorway, TV the painted TV, LOCKER the lockers, PICTURE WALL the cork board,
  LOADOUT the window with the submarine, LADDER the scoreboard, CHALKBOARD the chalkboard, **EXIT · MAP the globe**.
- World 1's flip board (three rows) over the scoreboard and world 1's chalkboard over the picture's, the joystick neon over
  the rec room's doorway, the brackets; no name plates.
- **The TV is the picture's own** (`DockLayout.tv` null, `picturedTv`): no cart is drawn; the game plays the TV's picture
  on its screen (the dim blue, the rolling band, the bursts of snow) and blinks the recorder's clock (`tvScreen`,
  `vcrClock`, split out of the cart's `tvSet`). The other looks keep the cart.
- **The globe is the picture's own** (`globe` null); the code-drawn globe stays the jungle base's (doc 86).
- **Depth** (doc 92): horizon 240, the pilot 1.05 on the front line (about 0.8 at the back wall, as tall as the couch and
  the doorway say). The front line runs right of the globe, so the pilot never passes behind it. Up their lanes: the window
  (x 400, y 585), the TV (beside it, 735/572), the cork board (928/555) and the rec room's doorway (1005/555) on one row —
  straight across between them — and the lockers (1150/605); the scoreboard, the chalkboard and the globe on the front line.
- **Ambient** (`dock-sea.ts`): the view through the window bobs a pixel in the swell, light ripples under the surface,
  bubbles rise and small fish pass — all clipped to the window minus the globe, so the globe stays still; the fairy lights
  twinkle, the floor lamp and the ceiling light glow, the arcade flickers pink in the rec room, dust motes.

## The inpainting workflow (for later pictures)

The globe round produced Couch workflow **"Top Gun pixel scene – inpaint 16:9"** (v2, the PC): klein edits the whole frame
from an empty latent with the plate as reference, then only the masked region (a black-and-white mask PNG, grown and
blurred) is pasted into the plate. `dev/inpaint-plate.py` puts the masked part of the pixel output back into a dock plate,
keeping the plate's colours, and can write a walk-behind mask. v1 (a masked latent at a denoise) only reworks what is
there — too weak to add an object. Planned next use: a hologram map in the space dock's left corner.
