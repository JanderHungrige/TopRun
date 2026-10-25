---
id: 25-medal-ceremony
title: Medal Ceremony - Pixel-Art Award Cut-Scene, Medal and Ribbon-Bar Art
edition: TopRun
depends_on: [24-medals-core, 20-retro-look, 17-people-kit, 06-talking-characters]
relates: [24-medals-core, 20-retro-look, 17-people-kit, 06-talking-characters]
source_files:
  - src/game/ceremony.ts
  - src/scenes/ceremony.ts
  - src/render/ceremony-set.ts
  - src/render/ceremony-ambient.ts
  - src/render/ceremony-looks.ts
  - src/render/ceremony-cast.ts
  - src/render/ceremony-card.ts
  - src/render/medals/index.ts
  - src/render/medals/palette.ts
  - src/render/medals/designs.ts
  - src/render/medals/metal.ts
  - src/render/medals/ribbon.ts
  - src/render/medals/pendants.ts
  - src/render/medals/emblems.ts
  - src/render/people/uniform.ts
  - src/render/people/front-figure.ts
  - src/render/people/pixel.ts
  - src/game/dialogue-scripts.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/i18n/ui-en-honours.ts
  - src/i18n/ui-de-honours.ts
  - src/ui/speech.ts
routes: []
models: []
test_files:
  - tests/unit/ceremony.test.ts
  - tests/unit/medal-art.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [medals, ceremony, cut-scene, pixel-art, ribbon-bar, dress-whites, honours, admiral]
path: Game/Honours/Ceremony
initiative: home-base-honours
wave: home-base-honours-wave-1
wave_status: active
integration_contracts:
  - function: "Route { to: 'ceremony', medals, then } (doc 24)"
    when: "the debrief and the minigame shell route here with the new medals before their next screen"
satisfies_contracts:
  - from: 24-medals-core
    function: "new CeremonyScene(game, medals, then)"
    when: "a route { to: 'ceremony' } plays the cut-scene for each new medal, then game.go(then)"
    status: done
    verified_at: "src/main.ts:117"
known_issues:
  - "People-kit faces are ~14 art px wide at the ceremony's figure size: expressions (the pilot's grin after the pin) barely read."
  - "Figures stand and glide (bob) rather than step: the front figure has no leg animation."
security_read_sites: []
sister_projects: []
---

# 25 — Medal Ceremony

## Purpose

When a pilot earns medals (doc 24), a short **pixel-art cut-scene** plays before the next screen: the
squadron stands at attention on the carrier's flight deck at golden hour, the admiral walks up and pins
the medal on the pilot's dress whites, everyone salutes while the victory fanfare plays, then the medal is
shown big with its name and typed citation while the admiral says a line in the retro RPG text box.
Further medals of the same ceremony get a quick pin and their own close-up ("and one more…").
Skippable; English and German. Honours only — nothing here changes the game.

The medal art (`drawMedal`, `drawRibbonBar`) is a reusable module: the locker (wave 2) shows the same
medals and ribbon bars on the dress-whites uniform.

## Medal art API (`src/render/medals/`)

```ts
import { drawMedal, drawRibbonBar, medalBottom, MEDAL_ASPECT, MEDAL_H } from '../render/medals';

// The medal hanging from its striped ribbon. (x, y) = top centre of the brooch bar (where it is pinned);
// `size` = frame height in logical units (width = size · MEDAL_ASPECT, 64 × 96 frame).
drawMedal(ctx, 'ace', x, y, size, { px?: number; shine?: number });

// The ribbon bar for a uniform's chest rows; (x, y) = top-left, w × h logical units.
drawRibbonBar(ctx, 'ace', x, y, w, h, { px?: number });

// Where the art ends inside the 96-unit frame (wings 72 … long campaign ribbons 92): centre a medal by
// its art with  top = cy − size · medalBottom(id) / MEDAL_H / 2.
medalBottom('ace');
```

- `px` — logical units per art pixel. Default: `drawMedal` max(2, size / 96) (a big medal is ~96 art px
  tall, small ones stay chunky); `drawRibbonBar` h / 9 (a ~9-row bar). Pass the surrounding art's pixel
  size to sit on its grid (the ceremony passes its 3-px grid). Always whole device pixels; the art scale is
  quantised to 1/32 so sizes share cache entries.
- `shine` — 0…1 position of a diagonal light sweep over the metal (12 frames); omit for none.
- Both draw in the current transform, snap to device pixels, smoothing off; sprites are cached (LRU 220)
  per medal × art scale × shine frame and per bar size, so steady state is one `drawImage`.
- `paintMedal(p, id)` / `paintRibbonBar(p, id)` paint into a `Pix` at any `k` (tests, compositing);
  `paintMedal` returns the metal mask.
- Locker sizing that looks right: medals 60–130 logical with default `px`; ribbon bars ≥ 24 × 7 (stripes
  need ~2 device px each), ~38 × 11 per bar in rows of three.

### Technique

Designed in a 64 × 96 unit frame (origin top centre, y down) and rasterised with `src/render/pixel/`
(`Pix`, `path`, masks, ordered dither) at k art px per unit. Colours use a **local medal palette**
(`medals/palette.ts`): every ribbon / enamel hex from the data keeps its exact value and gets a generated
hue-shifted ramp (ink, two shadows, base, two lights — shadows lean violet, lights warm, like the master
palette); gold, silver and bronze are hand-tuned 7-step metal ramps. Metal is faceted (stars, rays) or
bevelled (discs, crosses, wings, badges: light from the upper left) with rim pixels and a specular glint;
enamel fields are recessed (shadow upper left, light lower right). A 1-art-px selective outline in each
ramp's ink closes the silhouette. Below ~3 art px emblem radius the emblem is dropped; feather lines and
rivets need k ≥ 0.45, so tiny medals stay clean.

### Designs (all original; generic award shapes, no real decoration's design, no national insignia)

| Medal | Shape · metal | Design |
|-------|---------------|--------|
| Pacific / Gulf / Arctic / Canyon / Leviathan campaign | long ribbon · bronze / bronze / silver / silver / gold | long striped ribbon with swallowtail ends, a riveted clasp bar, a round seal with the theater emblem: waves + sun, desert sun over dunes, snowflake, mesa against the sun, trident |
| Victory Medal | 5-point star · gold | faceted star with long glory rays between the points, red enamel centre, white star |
| Golden Star | 8-point radiant star · gold | alternating long / short faceted rays, navy centre, three gold stars |
| Ace Wings | wings · silver | spread wings with a feathered trailing edge on a stem, navy boss, white star |
| Top Ace | wings · gold | larger wings with an extra covert line, red boss, gold star, a gold star on top |
| Giant Slayer | cross · gold | flared ball-tipped cross in purple enamel, faceted diagonal rays, white medallion with a sword |
| Untouchable | disc · silver | bevelled disc, sky-blue field, white shield with a chevron |
| Gunslinger | cross · bronze | flared ball-tipped cross in brown enamel, rays, cream medallion with a red crosshair |
| Catapult Star | 4-point star · silver | long-pointed compass star with minor diagonal points, green centre, jet launching up |
| Off-Duty Star | 6-point star · bronze | faceted star, orange centre, palm on an island against a low sun |
| Base Legend | disc · gold | purple field, laurel ring, orange star |
| Sortie Pin | badge · bronze | shield badge on an eyelet, jet and chevron |
| Iron Pilot | disc · silver | dark iron field, riveted rim, flight helmet |
| Triple Threat | badge · silver | triangle badge on an eyelet, three jets in formation (lead in red) |

Ribbon bars: the stripes mirrored from the outside in (outer stripe widest), each stripe's ink as a 1-px
border, a light top row and a shaded bottom row (bars ≥ 5 rows); bars ≥ 7 rows carry a metal star device
(star medals) or a small wing device (wings medals).

## Ceremony (`src/scenes/ceremony.ts`)

### Setting (pixel art, logical 1280 × 720, art pixel = whole device px ≈ 3 logical px)

- Letterbox bars (cut-scene look): "AWARD CEREMONY" and "MEDAL n OF m" on top, "ESC: SKIP" and a blinking
  "SPACE / TAP: CONTINUE ▶" below.
- `ceremony-set.ts` (one cached layer): golden-hour sky (dusk ramp, dithered bands), a low sun with a banded
  halo, lit cloud streaks, the sea with the sun path and a distant escort, the carrier island on the right with
  lit bridge windows, mast, radar and halyard, the flight deck with sheen, edge stanchions, a yellow line,
  dashed centre line and tie-down rows, a parked jet between the admiral and the right-hand crew.
- `ceremony-ambient.ts`: drifting clouds, shimmering sun path, three gulls, flapping signal pennants (generic
  colours, no flags of any nation), catapult steam — composed with the backdrop at art resolution, one blit.
- `ceremony-cast.ts` + `ceremony-looks.ts`: people-kit front figures (doc 17) with long dithered shadows —
  six deck crew in coloured jerseys (flight-suit torso) with cranial helmets and two officers in whites
  (scale 0.62, drawn on the same 3-px grid via `units: 3 / scale`); the pilot (avatar skin, hair, eyes) in dress
  whites; the admiral in dress whites with gold boards, his swept hair and gold aviators, and his own ribbon rack.
  Earlier medals show as ribbon bars on the pilot's chest (rows of three); new ones hang below once pinned.
  Arm moves and turns snap to 4 key poses (retro frames, few cache entries).

### Timeline (pure, `src/game/ceremony.ts`)

First medal (`scene` stage, 8 s):

| t (s) | Beat |
|-------|------|
| 0 – 0.5 | everyone at attention |
| 0.5 – 2.5 | the admiral walks in from the right and stops in front of the pilot |
| 2.9 – 3.6 | reaches to the pilot's chest |
| 3.6 | **pin** (medal appears, sparkle, `pickup` + soft `hit`) + **fanfare** (`victory` stinger) |
| 3.6 – 4.3 | arm back down |
| 4.3 – 4.7 | steps back and turns to face front |
| 4.7 – 6.9 | **salute**: pilot, admiral and crew (up 0.25 s, held, down 0.3 s) |
| 8.0 | **close-up** |

Each further medal (2.4 s): turn to the pilot and step in (0–0.3), reach (0.3–0.9), **pin** at 0.9, arm down
(0.9–1.5), step back (1.5–1.9), close-up at 2.4.

Close-up (`closeup` stage): the deck dims, a slowly turning pixel sunburst, the medal drops in big (330
logical, 3-px grid) with a flash, twinkles and a shine sweep every ~3.4 s; beside it "AWARDED TO {callsign}",
the group, the medal name (display font, shrinks to fit), its ribbon bar and the citation typed out (typewriter
font, block cursor); the admiral's line in the RPG text box at the bottom (`adm.medal` for the first medal,
`adm.medalMore` for each further one; `{callsign}`, `{medal}`). The card fades in over 0.3 s and out over
0.25 s into the next medal's pin.

### Input

- Input is ignored for the first 0.5 s of the ceremony and the first 0.35 s of each close-up (guards).
- CONFIRM / Space / tap: during the scene → straight to the close-up (pending cues fire: pin, fanfare);
  in a close-up while text is typing → finish typing (citation and the admiral's line); after → next medal,
  or leave after the last one.
- A finished close-up moves on by itself after 9 s.
- BACK (Esc / Backspace): skip the rest of the ceremony.
- Leaving calls `game.go(then)` exactly once.

### Audio

`enter` stops the music (silence on deck); pin → `pickup` + a soft `hit`; first pin → `victory` stinger;
close-up reveal → `buy`; the admiral's voice blips come from `SpeechBox`. Existing sounds only.

### Text

UI keys in `src/i18n/ui-en-honours.ts` / `ui-de-honours.ts` (spread into `UI_EN` / `UI_DE`): `cer.title`,
`cer.awarded`, `cer.count`, `cer.next`, `cer.skip`, `cer.group.campaign|combat|offduty|dedication`.
Spoken lines `adm.medal`, `adm.medalMore` (3 variants each, EN + DE, same placeholders; the German ones avoid
articles before `{medal}` because the names' genders differ) via `medalLine(index, medal)` in
`dialogue-scripts.ts` (no new event tables, so the dialogue event counts are unchanged). Medal names and
citations via `medalName` / `medalCitation` (doc 24). The longest German name (`Leviathan-Feldzugsband`)
fits at full size; the RPG box shrinks the admiral's longest German line with a 12-letter callsign.

## Business Rules

- The ceremony plays every medal in the order given (catalogue order from `newMedals`).
- Nothing is saved here; medals are derived from the save (doc 24).
- Skipping never loses a medal; it only skips the show.
- `SpeechBox` gains (additive, optional): `layout.holdLast` keeps the last line on screen with its
  blinking cursor until something new is said (`say([], true)` clears it); `finishLine()` completes the
  current line's typing; `typing` tells whether a line is still typing or queued.
- People kit (doc 17) gains, all optional / additive: torso wear `dressWhites` and `flightSuit`,
  `FrontPose.reach` (wrist targets), `drawFrontFigure(…, opts)` pixel grid options, `frontChestPoint`.

## Verification (2026-10-25)

`tsc --noEmit` clean, Vitest 40 files / 492 tests green (new: `ceremony.test.ts` — timeline, cues, guards,
skip, auto-advance, `medalLine`; `medal-art.test.ts` — all 18 medals render at k 0.125 … 1.25, pairwise
distinct at locker and close-up size, stay inside their frame, ribbon bars mirrored and distinct).
Dev server at 1280 × 720, DPR 1 and 2, EN and DE, avatars pilot1–3, callsign up to 12 letters: every phase
screenshotted (walk-in, pin with sparkle, salute, close-up typing / typed, second and third medal, card
fade), CONFIRM skipping typing → next medal → close-up, BACK → `then`, last CONFIRM → `then`; all 18 medals
and bars checked in a grid at 34 / 70 / 130 / 330 logical. Frame cost (dev build, DPR 2, update + render):
~0.5 ms average on the first pass (≤ 14 ms on the frame that builds the backdrop), ~0.2 ms once poses and
sprites are cached; one ~11 ms frame when the `victory` stinger starts (music set-up, existing system).

## Dependencies

24 (catalogue, route), 20 (pixel pipeline, typewriter, RPG box), 17 (figures), 06 (SpeechBox, admiral),
07 (texts), 08 (avatar → pilot look).

## Security

None (reads the active profile's avatar, callsign and save only).

## Known Issues

- People-kit faces are ~14 art px wide at the ceremony's figure size: expressions (the pilot's grin after
  the pin) barely read.
- Figures stand and glide (bob) rather than step: the front figure has no leg animation.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
