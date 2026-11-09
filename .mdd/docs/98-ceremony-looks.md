---
id: 98-ceremony-looks
title: Ceremony Looks - The Jungle Camp Ceremony, the Battle-Station Hangar, the Officers in Each World's Uniform
edition: TopRun
depends_on: [75-world-ceremonies, 85-map-six-honours, 95-jungle-camp-picture]
relates: [75-world-ceremonies, 85-map-six-honours, 25-medal-ceremony, 97-world-intros]
source_files:
  - src/game/ceremony-stage.ts
  - src/render/ceremony-stage.ts
  - src/data/ceremony-sets.ts
  - src/assets/ceremony/
  - dev/ceremony-sets.py
  - dev/ceremony-uniforms.py
routes: []
models: []
test_files:
  - tests/unit/ceremony-sets.test.ts
  - tests/unit/ceremony-looks.test.ts
data_flow: reads-existing
last_synced: 2026-11-09
status: complete
phase: all
mdd_version: 11
tags: [ceremony, medals, uniforms, comfyui, pixel-art, map-5, map-6, space, jungle]
path: Game/Honours/Ceremony Looks
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 98 — Ceremony Looks

## Purpose

Owner, 2026-11-09: *"Could we change the uniform on the ribbon ceremony for the jungle and space world? Jungle should be a
jungle camo uniform, a bit run-down. And we generally need the jungle ceremony. Use the style of the base camp for the
background. The saluting soldiers in differently styled, run-down jungle camo. For space, everything clean. Orange flight
suits, and a grey uniform for the commanding officer. Large space hangar (battle-station vibes)."*

## The stages

| world | stage | the picture |
|---|---|---|
| maps 1–3 | `deck` | as before (doc 25) |
| map 4 | `pier` | as before (doc 75) |
| map 5 | `hangar` | **new:** a vast, clean battle-station hangar — towering grey metal walls with ribs and rows of light strips, a huge opening onto space with a planet, starfighters parked in rows, a polished floor with guide lines; a row of ten troopers in orange flight suits and white helmets on the left third |
| map 6 | `camp` (was `clearing`) | **new:** the run-down jungle field camp in the base camp's style (doc 95) — torn camouflage nets on poles, giant rainforest trees and lianas, sandbags, rusty sheets, a mech's leg; a row of ten soldiers on the left third, each in differently styled worn jungle camouflage (boonie hats, bandanas, helmets, rolled sleeves, patched trousers) |

- The framing stays doc 75's: the crew row on the left third, its shoes about a third up from the bottom, the foreground
  floor clear for the officers. Each new stage gets its crew salute overlay from the crop edit (doc 75), the hangar its
  twinkling window stars.
- The old jungle clearing picture (`clearing*.png`) is replaced by `camp*.png`.

## The officers' uniforms

The admiral and the pilot keep their cut-outs and poses (doc 25); only their clothes change with the stage
(`stageOutfit(set)`, pure: deck and pier `dress`, hangar `space`, camp `jungle`):

| outfit | the admiral | the pilot |
|---|---|---|
| `dress` | navy dress blues | dress whites |
| `space` | a **grey** uniform (cap and suit) | an **orange flight suit**, a light-grey cap |
| `jungle` | worn **jungle camouflage**, cap included | worn **jungle camouflage**, cap included |

- `dev/ceremony-uniforms.py` writes each cut-out's `-space` and `-jungle` variant beside it (same size, same pixels
  outside the clothes): the clothes are found by colour (the admiral's navy: blue over red, dark; the pilot's whites:
  light, unsaturated) and recoloured by their own shading — onto a grey or orange ramp for space; for the jungle onto a
  blotchy four-colour woodland camouflage (olive, dark green, brown, black-green) that stays put on the figure, with
  faded patches and mud towards the boots for the worn look. Skin, hair, shoes, buttons, sunglasses and badges stay.
- The renderer picks `<file>-<outfit>` for a stage that is not `dress`; the pilot's skin and hair recolouring (doc 25)
  works on the variants unchanged (same pixels). The ribbons and medals the game draws on the chest stay as they are.

## The renders used

- **Camp:** the PC, seed 7 (eight soldiers under the camouflage net, the mech's leg on the right); the crew salute from
  the crop edit at (60, 204) on the 768 × 432 frame, seed 11 — seven of eight salute, the eighth stands half hidden
  behind them.
- **Hangar:** seed 11 (seed 7 drew two planets in the opening); the crew salute at (48, 228), seed 11 — nine of ten
  salute. The opening's dark pixels (122, 46, 100 × 66 art px) twinkle.
- `dev/ceremony-sets.py` now rebuilds only the stages whose renders lie in the edits dir and keeps the table's other
  entries (the pier stayed as it was).
- **Uniform tuning:** the first grey and camouflage came out too dark on the admiral's near-black navy and the orange
  too pale on the pilot's whites; the ramps were lifted (grey #454b54 … #c2c9d1, orange #7a300e … #fa9440) and the
  camouflage drawn brighter (0.8 + 0.45 × shading) at a larger blotch scale.

## Business Rules

- `CeremonySet = 'deck' | 'pier' | 'hangar' | 'camp'`; `ceremonySet(6) === 'camp'`.
- `stageOutfit(set)`: exhaustive over `CeremonySet`.
- No text, letters, logos, insignia, flags or national markings in the pictures; generated, nobody real; grown-ups only.

## Known Issues

(none)
