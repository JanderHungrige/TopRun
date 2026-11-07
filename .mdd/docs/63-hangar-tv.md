---
id: 63-hangar-tv
title: Hangar TV - An Old CRT on a Video Recorder in the Hangar Base; the Tape Shelf Replays Finished Worlds
edition: TopRun
depends_on: [30-hangar-base, 64-world-celebrations]
relates: [30-hangar-base, 64-world-celebrations]
source_files:
  - src/data/base-areas.ts
  - src/game/base-hangar.ts
  - src/game/state.ts
  - src/game/tapes.ts
  - src/render/base/layout.ts
  - src/render/base/props.ts
  - src/render/base/ambient.ts
  - src/scenes/tapes.ts
  - src/scenes/routes.ts
  - src/i18n/ui-en-hangar.ts
  - src/i18n/ui-de-hangar.ts
routes: []
models: []
test_files:
  - tests/unit/tapes.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, tv, vcr, replay, celebrations, worlds]
path: Game/Honours/Base
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 63 — Hangar TV

## Purpose

Owner, 2026-11-07: *"put a old tv/video recorder in the hangar. Show me the image first."* — then on the preview:
*"Love the style, but please don't replace the toolbox, place it to the left in front of the recreational room."*
The TV replays the celebration of every finished world (doc 64).

## The prop (hangar base, doc 30)

- A rolling steel AV cart **in front of the rec room's doorway, on the left** (the red tool cart by the jet stays):
  two shelves and castors, VHS tapes on the lower shelf; on top a video recorder (black, tape slot, buttons, a clock
  window) and on it a chunky wood-grain CRT with a bulging screen, two dials, a speaker grille and rabbit-ear
  antennas. Drawn in code in the hangar's pixel style (static props layer, no text in the art).
- Alive (ambient, every frame): the screen glows dim blue with a slowly rolling bright band and now and then a burst
  of snow; the recorder's clock blinks its four digits like every unset recorder ever.

## The area

- New base area **TV** (`tv`, floor row) between FUN MISSIONS and the LOCKER; ← / → order: fun, tv, locker, photos,
  jet, ladder, chalk, exit. Name plate "TV" / "TV"; hint "Watch your finished worlds again" / "Sieh dir deine
  geschafften Welten noch einmal an".
- The TV stands in front of the rec room, so where the two hotspots overlap the TV wins (`areaAt` tests the TV
  first, `HIT_ORDER` in `src/game/base-hangar.ts`).
- The first preview replaced the red tool cart by the jet's tail; the owner kept the toolbox, so the TV got its own
  cart in front of the rec room.
- Opening it: the pilot walks there, the route is `{ to: 'tapes' }`.

## The tape shelf (`src/scenes/tapes.ts`)

- An old TV on the left, four VHS tapes stacked on the right, one per world, labelled with the world's name (WORLD 1 ·
  THEATER OF OPERATIONS … WORLD 4 · DEEP SPACE) on a sleeve in the world's colour; an unfinished world's tape is a
  blank grey one ("not recorded yet"). The TV shows the picked world's first key frame, snow for a blank tape; the
  picked tape slides out a little under a gold frame.
- ← / → (or tap) pick a tape, ENTER / tap plays it: `{ to: 'celebration', world, then: { to: 'tapes' } }`; ESC or
  the BACK button (bottom right, the rooms' button — touch had no way back, owner's bug report 2026-11-07) back to the
  base.
- Pure (`src/game/tapes.ts`): `tapeShelf(save)` → the four worlds with `finished` (`campaignComplete`, all thirty
  missions of the map cleared).

## Business Rules

- Nothing is stored; the shelf reads the progress.
- Strings: `hbase.tv`, `hbase.hint.tv`, `tapes.*` in `ui-en-hangar.ts` / `ui-de-hangar.ts`.
