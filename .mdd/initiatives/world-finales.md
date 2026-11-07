---
id: world-finales
title: World Finales
status: active
version: 1
hash: 9138c553
created: 2026-11-07
---

# World Finales

## Overview
Owner (2026-11-07): *"the new worlds need new medals. And I would like to have a video sequence after each world to
celebrate finishing the world."* Only map 1 has campaign medals today; maps 2–4 end with a debrief line and nothing
else. This initiative gives every world its medals and a celebration, and puts an **old TV with a video recorder** in
the hangar base so a finished world's celebration can be watched again.

Decided with the owner (one question round, 2026-11-07):
- **Medals like map 1, for maps 2–4:** per map a campaign ribbon for each theater's boss, a victory medal for the
  map and a golden star for three stars on every mission — 21 new medals with their own ribbons and emblems. They
  count for the rating (the medal cap grows), the ceremony and the locker show them.
- **Celebrations as pixel art from key frames:** like the medal ceremony (doc 25) — generated pixel-art key frames
  per world (ComfyUI, the "Top Gun pixel scene 16:9" look), layered and animated in code (pans, the player's own
  craft flying past, fireworks, the admiral's line, WORLD COMPLETE), skippable.
- **Replay from an old TV / video recorder in the hangar** (owner: *"put a old tv/video recorder in the hangar. Show
  me the image first"*): drawn in the hangar base's pixel style; the owner sees the picture before it is wired up.

## Open Product Questions
- [x] Which medals → like map 1, maps 2–4 (owner).
- [x] Celebration technique → pixel art from generated key frames (owner).
- [x] Replay → a TV / VCR in the hangar base, image approved first (owner).
- [ ] The TV's look and place in the hangar → owner's pick from the preview (wave 2).

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/world-finales-wave-1.md | Clearing a theater boss on maps 2–4 awards its campaign ribbon, finishing a map its victory medal, three stars everywhere its golden star — shown in the ceremony and on the locker's dress whites; the rating counts them. | complete |
| Wave 2 | waves/world-finales-wave-2.md | After a world's finale a pixel-art celebration plays (four worlds, each with its own key frames, the player's craft and fireworks), skippable; the hangar base has an old TV with a video recorder that replays any finished world's celebration. | planned |
