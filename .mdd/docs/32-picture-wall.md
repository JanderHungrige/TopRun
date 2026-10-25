---
id: 32-picture-wall
title: Picture Wall - One Generated Photo per Cleared Mission
edition: TopRun
depends_on: [24-medals-core, 03-campaign-map, 09-paint-jobs, 20-retro-look, 31-locker-uniform, 07-i18n]
relates: [24-medals-core, 03-campaign-map, 09-paint-jobs, 31-locker-uniform]
source_files:
  - src/game/photos.ts
  - src/game/photo-date.ts
  - src/data/photo-looks.ts
  - src/scenes/photo-wall.ts
  - src/render/photos/art.ts
  - src/render/photos/sky.ts
  - src/render/photos/ground.ts
  - src/render/photos/props.ts
  - src/render/photos/jet.ts
  - src/render/photos/wall.ts
  - src/render/photos/polaroid.ts
  - src/render/photos/enlarged.ts
routes: []
models: []
test_files:
  - tests/unit/photos.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [picture-wall, photos, polaroid, campaign, paint-jobs, pixel-art, honours]
path: Game/Honours/PictureWall
initiative: home-base-honours
wave: home-base-honours-wave-2
wave_status: active
integration_contracts:
  - function: "Route { to: 'photoWall' } → PhotoWallScene; BACK → { to: 'base' }"
    when: "the hangar base (doc 30) opens the picture wall; leaving returns to the base"
  - function: "SaveData.progress[id] { stars, at?, plane?, livery? } (doc 24)"
    when: "the best run of each cleared mission is what its photo shows"
satisfies_contracts: []
known_issues:
  - "Photo art is 200 × 132 art px shown at 1 (wall) and 3 (enlarged) logical px per art px: crisp at whole-number device scales, slightly uneven pixel widths at fractional ones (DPR 1.25 / 1.5)."
  - "Building a photo costs ~6–9 ms; the wall builds at most one per frame, so the first visit to a full page develops over ~12 frames."
  - "The near ground of ocean theaters is fairly plain: the mode-7 plane shows the mission's own top-down sea tile, which has few features."
security_read_sites: []
sister_projects: []
---

# 32 — Picture Wall

## Purpose

A room of the hangar base (route `photoWall`, doc 30): a corkboard on the hangar wall with one framed
**polaroid** per cleared mission. Each photo is **generated** from the mission data — no storage cost (owner): the
pilot's jet on the best run, in the paint job it wore, flying over that mission's theater at the mission's time
of day, with the boss going down in the background on boss missions. A typewriter caption names the mission, the
stars and the date. Select a photo to see it enlarged with all its details.

## What the screen shows (logical 1280 × 720)

- **Header**: "PICTURE WALL" top left; "12 / 30 PHOTOS" top right.
- **The wall** (one cached pixel-art layer on the rooms' ≈ 2-logical-px grid, doc 31): corrugated navy hangar
  wall, a strip light, a big corkboard in a wooden frame with dithered cork grain; a slow light shaft from a hangar
  window drifts over the board with dust in it.
- **Polaroids** in a 4 × 3 grid per page (12 per page → 3 pages for 30): drop shadow, white frame, the photo
  (200 × 132 logical, 1 art px = 1 logical px), a coloured push pin, a small hand-pinned offset per mission (no
  rotation — pixel art stays on its grid), the typewriter caption "06 · IRONCLAD", the stars (gold / hollow) and
  the date. A photo that was just built **develops** (fades in over 1.1 s from the grey-teal of an undeveloped
  polaroid). The selected polaroid lifts 2 px with a deeper shadow and gold corner brackets.
- Only cleared missions have photos, in mission order (uncleared ones are absent); with none, a pinned note says
  "NO PHOTOS YET" and how to get the first one.
- **Enlarged view** (CONFIRM / click / tap on a photo): the wall dims, the polaroid shows at 3× (600 × 396
  logical, the same art at 3 logical px per art px) with its caption, "6 / 12" under it, and a card beside it:
  "MISSION 6", the mission name, the stars, theater, date ("UNDATED" without one), jet and paint job.
- **Footer**: input hints (only "ESC BACK" while the wall is empty), ◀ "PAGE 1 / 3" ▶ (only with more than one page; in the enlarged view ◀ ▶ flip photos)
  and the pixel BACK button.

## The photo (render, `src/render/photos/`)

An air-to-air shot in side view, rendered once per photo key into a 200 × 132 canvas and cached (40 photos):

| Layer | How |
|-------|-----|
| Sky (`sky.ts`) | dithered bands of the time of day's master-palette ramp (`sky` day, `dawn`, `dusk`, `night`, `wall` greys for storm), the sun (low and big at dawn / dusk) or the moon and stars with banded glow, cloud streaks, rain in a storm |
| Ground (`ground.ts`) | a **mode-7 plane** built from the mission's own top-down terrain — `new Terrain(theater, seed).renderGround` (base tile, islands, dunes, floes, mesas, the canyon) drawn at half size and sampled one texture row per photo row in perspective, then lit for the time of day and hazed towards the horizon colour with 4 × 4 ordered dithering; sun / moon glints on the water at dawn, dusk and night on sea theaters |
| Background (`props.ts`) | boss missions: the boss going down on the side the jet's tail points to — Ironclad (battleship) or Leviathan (supercarrier) on the horizon and Sandstorm (fortress) on the coast with fire and a puffy smoke column, Blackjack (bomber) and Typhoon (flying wing) falling out of the sky with a smoke trail — as distant silhouettes in the time of day's far colours; even missions on sea theaters: our carrier on the horizon with its wake |
| Jets (`jet.ts`) | `drawPlaneSide(plane, { livery })`, gear up, afterburner lit, ≈ 96 px long, tinted for the time of day, cleaned into pixel art (`quantize.ts`: dominant colours, hard alpha, 1-px outline); odd missions add a smaller wingman F-16 in standard paint behind and above |
| Finish | dithered vignette and a faint warm print cast |

The **time of day** per mission is a static table (`data/photo-looks.ts`, e.g. "Desert Dawn" at dawn, the
Leviathan's storm missions in a storm, Blackjack at night). The composition (horizon height, jet height, slight
climb or dive, facing left / right) cycles through four variants by mission number, so a photo never changes
unless its inputs do.

## Pure parts (`src/game/photos.ts`, `src/game/photo-date.ts`)

- `photoList(save)` → one `PhotoSpec` per cleared mission in mission order: `mission`, `number`, `theater`,
  `stars`, `at` (or null), `plane` / `livery` and `fallback` (true when the entry had no plane: then the currently
  selected jet and its paint job; a plane without a livery uses that jet's current paint job), `time`
  (`photoTime`), `scene` (`boss`; sea theaters: even → `carrier`, odd → `wingman`; land theaters: odd →
  `wingman`, even → `solo`) and `boss`.
- `photoKey(spec)` — the cache key: everything the art shows (not the caption's stars or date).
- Paging: `PER_PAGE = 12`, `COLS = 4`, `ROWS = 3`; `pageCount(n)`, `pageOf(index)`, `pageItems(list, page)`;
  `wallSlot(slot, missionNumber)` — the polaroid's box on the corkboard (`BOARD`, `POLAROID`), whole logical px,
  never overlapping.
- `gridMove(index, dir, total)` — LEFT / RIGHT step through the list (crossing pages), UP / DOWN move a row within
  the page (DOWN clamps to the page's last photo when the row below is short).
- Dates: `localDate(at, tzOffsetMin)` → `{ y, m, d }`; `formatPhotoDate(at, format, tzOffsetMin)` with the
  language's pattern and month names from the UI tables (`photo.datePattern`, `photo.months`): EN "OCT 25, 2026",
  DE "25. OKT 2026"; no time → no date. The scene passes the browser's offset for that date.

## Input

- Arrows / d-pad / stick: move the selection (LEFT / RIGHT across the page edge flips the page).
- Mouse: moving over a photo selects it, click opens it; the page arrows and BACK are buttons.
- Touch: tap a photo to open it, tap the page arrows to flip.
- CONFIRM / Space: enlarged view. In it: LEFT / RIGHT or the on-screen arrows flip; BACK / CONFIRM / a tap
  elsewhere close it.
- BACK on the wall (Esc / Backspace / pad B), the `base` key or the BACK button → `{ to: 'base' }` (once).

## Text

UI keys in `ui-en-rooms.ts` / `ui-de-rooms.ts` (doc 31): `wall.count`, `wall.page`, `wall.empty`, `wall.emptyHint`,
`wall.mission`, `wall.theater`, `wall.stars`, `wall.date`, `wall.noDate`, `wall.jet`, `wall.paint`, `wall.hint`,
`wall.hintEmpty`, `wall.hintOpen`, `photo.datePattern`, `photo.months`; existing `rooms.photoWall`, `rooms.back`. Mission / theater /
paint-job names via `missionName`, `theaterName`, `liveryName`; jets by their type name (`PLANES[id].name`).
Captions and dates are computed once when the room opens.

## Business Rules

- One photo per cleared mission (`progress[id]` exists), in mission order; never stored, always from the save.
- The photo shows the best run: `progress[id].plane` / `.livery` (written by the debrief when stars ≥ the
  previous best, doc 24); old entries without them fall back to the current jet and paint job.
- A paint job in the photo is always one the save has unlocked (the save parser enforces it, doc 24).
- The date is the best run's date in the player's local time; entries without `at` show no date.

## Verification (2026-10-25)

Vitest 50 files / 563 tests green (new `photos.test.ts`: list order, fallbacks, scenes and bosses, time table,
cache key, paging, wall slots, grid navigation, dates in EN / DE and time zones); `npm run typecheck` clean;
production build OK. Dev server at 1280 × 720, EN and DE, with 0, 1, 12 and 30 cleared missions: all 30 photos on
a contact sheet (every theater and time of day, all five bosses, carrier, wingman, liveries incl. tail art),
pages 1–3, keys, mouse hover / click, touch taps (photo, page arrows, outside to close, BACK), ESC closes the
enlarged view then leaves to the base; detail checked magnified. Frame cost (dev build, update + render,
offscreen 2560 × 1440 at DPR 2): ~0.25 ms average with 12 photos (median 0.2 ms), ~0.4–0.5 ms with the enlarged
view; one photo build ~6–9 ms (at most one per frame); wall layer build ~3–6 ms once per grid size.

## Dependencies

24 (photo fields), 03 (missions, theaters, stars), 09 (liveries and their names), 20 (pixel pipeline, typewriter
text, pixel frames), 31 (rooms chrome and pixel helpers), 05 (terrain), 30 (the hub that opens the room), 07.

## Security

None (reads the active profile only; the photo fields are validated by the save parser).

## Known Issues

- Photo art is 200 × 132 art px shown at 1 (wall) and 3 (enlarged) logical px per art px: crisp at whole-number
  device scales, slightly uneven pixel widths at fractional ones (DPR 1.25 / 1.5).
- Building a photo costs ~6–9 ms; the wall builds at most one per frame, so the first visit to a full page
  develops over ~12 frames.
- The near ground of ocean theaters is fairly plain: the mode-7 plane shows the mission's own top-down sea tile,
  which has few features.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
