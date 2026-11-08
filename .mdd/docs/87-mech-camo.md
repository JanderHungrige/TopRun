---
id: 87-mech-camo
title: Mech Camo - The PAINT SHOP, Each Mech's Jungle Camo Painted by Hand and Worn in the Mission
edition: TopRun
depends_on: [79-mech-kit, 80-mech-walk, 09-paint-jobs]
relates: [80-mech-walk, 79-mech-kit]
source_files:
  - src/game/mech-paint.ts
  - src/render/mechs/mech-camo.ts
  - src/render/mechs/mech-top.ts
  - src/render/mechs/mech-side.ts
  - src/scenes/paint-shop.ts
  - src/scenes/paint-shop-view.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-items.ts
  - src/game/save.ts
routes: []
models:
  - "SaveData.mechPaint: Partial<Record<MechId, string>> — 256 digits 0–7 per painted mech"
test_files:
  - tests/unit/mech-paint.test.ts
data_flow: writes-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [mechs, camo, paint, paint-shop, jungle, pixel-art, map-6]
path: Game/Hangar/Mech Camo
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (paints parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 87 — Mech Camo

## Purpose

Owner, 2026-11-08: *"Enable also painting your mechs jungle camo yourself."*

## The camo

Each mech wears a **16 × 16 tile** of jungle colours repeated over its armour (torso, arms, shoulder pods) in every
view — from above in the mission, from the side in the mech bay, the paint shop and the drop. The palette: dark green,
olive, moss, khaki, brown, black-green, tan, sand. A mech never painted wears its own default camo (blobs of three
colours over a ground, seeded per mech). A paint is stored as 256 digits 0–7 (`SaveData.mechPaint`), only for mechs and
only well-formed ones are read back.

## The PAINT SHOP

In the MECH BAY an owned mech's side button (key E) is **PAINT CAMO**. The paint shop shows the tile big on the left
and the mech wearing it — walking from the side and from above — on the right, updating with every stroke.

- **Tools:** the brush in three sizes (round, wrapping round the tile's edges so the camo stays seamless), fill (the
  colour's area), and three stamps for the whole tile: blobs (a new random camo), tiger stripes, and one colour; undo.
- **Mouse / touch:** pick a colour or a tool, paint by dragging over the tile.
- **Keys:** arrows move the cursor over the tile, SPACE paints, E the next colour, X the brush size, F fills, U undoes,
  ESC saves and returns to the mech bay.
