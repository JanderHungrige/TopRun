---
id: 75-world-ceremonies
title: World Ceremonies - The Medal Ceremony on a Submarine Pier (Map 4) and in a Space Hangar (Map 5)
edition: TopRun
depends_on: [25-medal-ceremony, 74-world-order]
relates: [25-medal-ceremony, 74-world-order, 73-home-docks, 64-world-celebrations]
source_files:
  - src/game/ceremony-stage.ts
  - src/render/ceremony-stage.ts
  - src/scenes/ceremony.ts
  - src/data/ceremony-sets.ts
  - src/assets/ceremony/
  - dev/ceremony-sets.py
routes: []
models: []
test_files:
  - tests/unit/ceremony-sets.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [ceremony, medals, comfyui, pixel-art, map-4, map-5, underwater, space]
path: Game/Honours/World Ceremonies
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 75 — World Ceremonies

## Purpose

Owner, 2026-11-07: *"we need new medal ceremonies for underwater (on a pier/dock next to a battleship or submarine)
and space. Large space hangar with troops in the…"* (the message ends there). The medal ceremony (doc 25) is set on
the carrier deck at sunset; the two late worlds get their own stage.

## The stages

| world | stage | the picture |
|---|---|---|
| maps 1–3 | `deck` | the carrier deck at sunset (doc 25's key frame, `plate.png`) |
| map 4, under the sea | `pier` | a submarine pier at sunset: ten sailors in navy blue on the left, the attack sub moored on the right, a warship in the bay, gulls |
| map 5, space | `hangar` | a large space-station hangar: ten troopers in grey space suits and white helmets on the left, the starfighter on the right, the Earth through the big window |

- The stage follows the world the pilot is on (`GameContext.home`, the map the map scene shows) — `ceremonySet(world)`,
  pure, `src/game/ceremony-stage.ts`.
- Everything else is doc 25's: the admiral walks in from the right, pins the medal, both salute, then the crew row
  salutes; the same admiral and pilot cut-outs (recoloured to the player's look), the same card and medals. The officers
  stand in the foreground where they stand on the deck, so the new pictures keep the deck's framing: the crew row on the
  left third, its shoes about a third up from the bottom, the foreground floor clear.
- Each new stage has its own crew-salute overlay, made the way doc 25's was: the crew row cropped, enlarged and edited
  to salute (`Top Gun ceremony crew salute (crop edit)`), only the changed pixels kept.
- The deck and the pier have gulls gliding by; the hangar has none — it has the stars in its window, twinkling.

## Making the pictures

- Generated with the owner's ComfyUI scene workflow (`Top Gun pixel scene 16:9`, doc 33's style sentence): 1280 × 720,
  then `dev/ceremony-sets.py` puts each on the 320 × 180 grid with its own 48-colour palette (no dither) and cuts the
  crew salute overlay from the edit; it writes `src/assets/ceremony/<stage>.png`, `<stage>-crew-salute.png` and the
  table `src/data/ceremony-sets.ts` (where the overlay sits, where the window's stars may twinkle).
- No text, letters, logos, insignia, flags or national markings in the pictures; the raw renders stay outside the repo.

## The renders used

Two of each were made (seeds 7 and 11) and the clearer one kept: the pier with the bigger sailors and the modern sub
(seed 11), the hangar with the troopers' faces showing and the whole Earth in the window (seed 11). The crew salute
edits came out ragged at seed 7 (six or seven of ten saluting); at seed 11 eight sailors and nine troopers salute,
the rest stand at attention. The script drops changed islands under 18 px (an edit's stray pixels on the wall or the
floor), so only the arms and heads are laid over the row.

