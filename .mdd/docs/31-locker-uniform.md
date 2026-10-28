---
id: 31-locker-uniform
title: Locker - Dress-Whites Uniform with Every Earned Medal and Ribbon
edition: TopRun
depends_on: [24-medals-core, 25-medal-ceremony, 26-pilot-rating, 20-retro-look, 07-i18n]
relates: [24-medals-core, 25-medal-ceremony, 26-pilot-rating, 32-picture-wall]
source_files:
  - src/game/uniform-layout.ts
  - src/scenes/locker.ts
  - src/render/locker/plate.ts
  - src/assets/locker/locker.png
  - dev/locker-plate.py
  - src/render/locker/insignia.ts
  - src/render/locker/rack.ts
  - src/render/locker/card.ts
  - src/render/locker/ambient.ts
  - src/render/rooms-chrome.ts
  - src/render/rooms-pixel.ts
  - src/i18n/ui-en-rooms.ts
  - src/i18n/ui-de-rooms.ts
routes: []
models: []
test_files:
  - tests/unit/uniform-layout.test.ts
data_flow: reads-existing
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [locker, medals, ribbons, dress-whites, uniform, ranks, pixel-art, honours]
path: Game/Honours/Locker
initiative: home-base-honours
wave: home-base-honours-wave-2
wave_status: active
integration_contracts:
  - function: "Route { to: 'locker' } → LockerScene; BACK → { to: 'base' }"
    when: "the hangar base (doc 30) opens the locker room; leaving returns to the base"
satisfies_contracts: []
known_issues:
  - "The rating on the card uses formatPoints (en-US digit grouping) in German too, like the ladder screen."
  - "Full medal rows close their gaps: where wide wings meet, neighbouring medals overlap by a few pixels (court mounting, by design)."
security_read_sites: []
sister_projects: []
---

# 31 — Locker (Dress-Whites Uniform)

## Purpose

A room of the hangar base (route `locker`, doc 30): an animated pixel-art close-up of the pilot's open hangar
locker. The pilot's **dress whites** hang inside on a hanger, large, with every earned medal (doc 24) on them like
a real full-dress uniform, the **rank shoulder boards** (doc 26), the **wings badge** and a **name plate** with the
callsign. Select any medal or ribbon to see it big with its name and citation. Honours only — nothing here
changes the save.

## What the screen shows (logical 1280 × 720)

> Since 2026-10-28 the locker and the tunic are the generated locker picture (next section); the description of the
> code-drawn locker and jacket below is kept for history (that version: git tag `locker-procedural`).

- **Right column**: "LOCKER" (display font, gold) and the counter "7 / 18 MEDALS"; the card; the input hint and a
  pixel **BACK** button at the bottom.
- **The locker** (left ~800 px, one cached pixel-art layer on the rooms' ≈ 2-logical-px grid): the navy hangar
  wall with olive steel lockers; the middle one is open — its door swung out to the left (vent slits, a small
  mirror, a round sticker with a plain jet silhouette), inside a top shelf (white peaked cap with gold chin strap,
  no badge; a flight helmet with a yellow stripe and smoked visor), a small tube light under the shelf whose light
  cone falls on the uniform, a chrome rod with the hanger hook; a wooden locker-room bench in front.
- **The jacket** (≈ 400 × 510 logical, one cached sprite): white high-collared dress jacket on its hanger —
  standing collar, sloped shoulders, sleeves with two gold cuff stripes, six gold buttons, breast and lower pocket
  flaps with buttons, folds, dithered light from the tube above. On it:
  - **Shoulder boards** for `pilotStanding(save).rank`: the ladder's `drawRankBoard` art captured once at 48 × 48,
    colour-cleaned, turned a quarter (stripes at the shoulder end, star at the collar end), foreshortened to
    ≈ 100 × 18 logical and stepped down the shoulder slope.
  - **Left breast** (viewer's right), standing on the pocket flap and filling up: the **hanging medals** — every
    earned medal whose shape is not a ribbon (13 possible) — in rows of up to 5, `drawMedal` at 64 logical on the
    room's grid; the gold **wings badge** above the top row.
  - **Right breast** (viewer's left): the **name plate** with the callsign above the pocket, and above it the
    **ribbon bars** of the earned campaign ribbons (shape `ribbon`, 5 possible), rows of 3, `drawRibbonBar` 40 × 13.
    This follows real full dress, where awards worn without a medal sit on the right breast (decision while
    building: with the ribbons above the medals on the left breast the rack did not fit under the shoulder boards
    at a readable medal size).
  - Unearned medals are not shown (no spoilers); with none, the chest shows the wings only.
- **The card** (right panel, RPG pixel frame): the selected medal close up (`drawMedal` 172 logical, shine sweep,
  four twinkles), its name (display font, shrinks to fit — `LEVIATHAN-FELDZUGSBAND` fits), its group
  (`cer.group.*`), its ribbon bar and the citation typed out with a block cursor; below, the rank board, the rank
  name (`RANK_KEY`) and "RATING 7,700". With no medals: "NO MEDALS YET" and a hint how to earn them.

## The locker picture (owner, 2026-10-28)

Owner: *"Can you create the uniform in the locker with couch [the ComfyUI tool] as a pixelart? That might improve the
look."* After four takes and a more pixelated round (*"more Lucas arts"*) the owner picked **locker v4 flat**: the
generated close-up of the open locker (cap and helmet on the shelf, the tube light, one bare dress-white tunic with a
stand-up collar on its hanger, closed lockers in shadow on the right; ComfyUI "Top Gun pixel scene 16:9", run 5) put on
the **320 × 180 grid with 32 flat colours** — the same chunky look as the ceremony (doc 25).

- `dev/locker-plate.py` moves the picture 172 logical px (43 art px) left, so the tunic's centre (x 440) stays left
  of the card panel, fills the uncovered right edge with the shadow lockers' dark, downscales by area and quantises:
  `src/assets/locker/locker.png` (9 KB). `src/render/locker/plate.ts` draws it at exactly 4 logical px per art px
  with hard edges and holds the geometry measured on it.
- **Measured on the picture** (logical): the tunic's centre line (buttons) x 448, the collar x 388 … 508; the shoulder
  seams from beside the collar (x 504, top edge y 188 on the right; mirrored on the left) down to the sleeves
  (x ≈ 600, y ≈ 228) — measured column by column on the right shoulder (the tube light sits behind the left one); breast pockets x 320 … 400 (viewer's left) and 480 … 600 (viewer's right), flaps from
  y ≈ 330; tube light x 192 … 400 at y 188; the lit inside x 40 … 780.
- **Shoulder boards** (owner: *"the shoulder insignia are not on the shoulder but hovering"*, *"still not perfectly
  aligned"*, then *"starting just slightly in the collar … shift them a mini bit up"*): they start one art px clear of
  the collar (centre 448 ± 60) with their top edge at y 184 and run 92 px out to the sleeve along the seam's straight
  slope (dropping 38 px), 16 px deep, on the picture's 4-px grid. Before,
  they hung at the old jacket's y 162; the first fix assumed centre 440 and started on the collar itself.
- The code-drawn locker set, props and jacket (`set.ts`, `props.ts`, `jacket.ts`) and the jacket's sway are gone; the
  tube flicker and the dust motes stay, placed on the picture.

## Layout (pure, `src/game/uniform-layout.ts`)

`uniformLayout(medals, chest = LOCKER_CHEST)` → `{ slots, wings, top }`:

- Input: the earned medals in catalogue order (`earnedMedals(save, goldCount(save))`) and the chest frame
  (`LOCKER_CHEST`, measured on the locker picture: left breast x 464 … 584, medals standing at 346 — just over the
  pocket flap — with the collar limit at 226; medals 48 logical; right breast centre 360 with the ribbon bars standing
  at 300 on the name plate). The picture's chest is shorter than the old jacket's (≈ 120 px from shoulder to pocket):
  two rows of medals still stand clear, a full rack (3 + 5 + 5) is court-mounted under the collar. **Chest height** (owner,
  2026-10-26: "the nametag is a bit too low, it is not on chest height"): the breast pockets, name plate, ribbon
  bars and medal rack sit about a third of the way down the tunic (shoulders ≈ 176, hem 632), no longer at its
  middle (pocket top 420 before).
- Shape `ribbon` → `kind: 'ribbon'` slots, the rest `kind: 'medal'`; `slots` stay in catalogue order.
- Rows like a real rack: the **top row of each block holds the remainder and is centred** (`rackRows`), all rows
  below are full. Precedence reads like text (first medal at the top row's viewer-left).
- Medals stand on the pocket and fill upward (row height = tallest art in the row + gap), the wings above them.
  When the rows would reach past the collar limit (a full rack of 3 + 5 + 5), the upper rows tuck behind the
  lower ones by the same step, like a court-mounted rack, so the wings stay at or below the limit.
- **Court-mounted always** (owner, 2026-10-28: *"move them closer together on both axes. They are allowed to overlap
  (they do on real uniforms). If the top row overlaps a bit the second row, and the second the third row, it should
  look nice"*): every upper row hangs over the one below by `rowOverlap` (30 %) of its height, the breast is narrowed
  to x 464 … 584 (inside the pocket, off the sleeve — the rack had reached onto the arm), so the medals of a row
  overlap; the rack is drawn back to front from the last slot, so upper rows and the senior medal of a row are in front,
  and the hit test takes the frontmost (earliest) slot.
  Each medal's width comes from its shape's painted art (`MEDAL_ART`, checked against `paintMedal` in the test);
  a row wider than the breast closes its gaps (slight overlap) and is centred.
- Each slot: `id`, `kind`, `row` (within its block), the draw anchor (`x`, `y` — medal: top centre of the brooch;
  ribbon: top-left), `size` and the selection rect `box`.
- `moveSlot(layout, index, dir)`: LEFT / RIGHT step through the catalogue order (clamped; crosses rows and from
  the ribbons to the medals); UP / DOWN go to the nearest slot above / below (rows compared by their tops,
  straight-up preferred).
- `slotAt(layout, point, selected)`: the slot under a point, the selected one first (it is drawn on top).

## Animation

- **Light flicker**: now and then (deterministic, every few seconds) the picture's tube light drops out for 1–3
  frames at 15 Hz — the inside of the locker dims and the tube greys.
- **Dust** motes drift through the light cone in whole art pixels (hidden while the light is out).
- **Selection**: blinking gold corner brackets, a shine sweep on the selected medal; the card's medal sweeps and
  twinkles; the citation types out again on every new selection (CONFIRM finishes it).

## Input

- LEFT / RIGHT (keys, d-pad, stick): previous / next medal; UP / DOWN: the slot above / below.
- Mouse: moving the pointer over a medal or ribbon selects it; BACK highlights on hover; click works like a tap.
- Touch: tapping a medal or ribbon selects it.
- BACK (Esc / Backspace / pad B), the `base` key (B) or the BACK button → `{ to: 'base' }` (once).

## Shared rooms code (also used by doc 32)

- `src/render/rooms-chrome.ts`: the rooms' art grid (`roomGrid`: D = round(2 · device scale) device px per art px)
  and full-screen `blitLayer`, the header, pixel buttons (`pixelButton`, `backButton`, `BACK_BTN`) and the hint line.
- `src/render/rooms-pixel.ts`: bbox-limited painters (`rect`, `rectEdge`, `fill`, `oval`, `thick`, `paintIn`) for
  the full-screen layers — `Pix.paint` walks the whole 640 × 360 buffer per part, which made the first locker
  frame take ~160 ms; with these the backdrop builds in ~11–16 ms.

## Text

UI keys in `ui-en-rooms.ts` / `ui-de-rooms.ts`: `locker.count`, `locker.none`, `locker.noneHint`, `locker.rating`,
`locker.hint`, `locker.hintTouch`; existing `rooms.locker`, `rooms.back`, `cer.group.*`, `rank.*`. Medal names /
citations via `medalName` / `medalCitation` (citations wrapped once per language and medal).

## Business Rules

- The earned set is always derived from the save (doc 24); nothing is stored.
- Every earned medal appears exactly once on the uniform: campaign ribbons as ribbon bars, all others as medals.
- The first selection is the first earned medal in catalogue order.
- Rank and rating come from `pilotStanding(save)` (docs 26 / 28) — the same numbers as the ladder.

## Verification (2026-10-25)

Vitest 50 files / 563 tests green (new `uniform-layout.test.ts`: rows, catalogue order, both blocks inside their
breast and under the boards for all 18, rows centred and not overlapping, `MEDAL_ART` vs the painted medals,
navigation, hit testing); `npm run typecheck` clean; production build OK. Dev server at 1280 × 720, EN and DE, with
0, 6, 7, 11 and 18 medals: keys (←/→ through the order, ↑/↓ between rows), mouse hover, touch taps on medals and
BACK, ESC → base; the longest German name fits; detail checked magnified (boards, wings, rack, name plate).
Frame cost (dev build, update + render, offscreen 2560 × 1440 at DPR 2): ~0.17 ms average, median 0.1 ms with
18 medals; DPR 1 ~0.22 ms. Building the layers at a new grid size: backdrop ~11–16 ms, jacket ~5 ms, once.

## Verification (2026-10-28, locker picture)

`npm run typecheck` clean; Vitest 77 files / 742 tests green (`uniform-layout.test.ts` with the picture's tunic:
chest height, two clean rows, a tucked full rack, rows centred on the breast, hit tests); production build OK.
Browser (dev build, DE): the locker with 15 medals (two rows of five, wings, three ribbon bars, name plate) and with
all 18 (court-mounted 3 + 5 + 5); the boards lie on both shoulders from the collar down the slope; flicker and dust;
selection brackets, card and BACK unchanged.

## Dependencies

24 (catalogue, earned set), 25 (medal art), 26 (ranks, rank boards), 20 (pixel pipeline, typewriter text, pixel
frames), 30 (the hub that opens the room), 07 (texts).

## Security

None (reads the active profile only).

## Known Issues

- The rating on the card uses formatPoints (en-US digit grouping) in German too, like the ladder screen.
- Full medal rows close their gaps: where wide wings meet, neighbouring medals overlap by a few pixels (court
  mounting, by design).

## Bugs

(none yet — populated by /mdd bug when issues are reported)
