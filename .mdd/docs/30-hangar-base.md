---
id: 30-hangar-base
title: Hangar Base - Animated Pixel-Art Home Base with Areas
edition: TopRun
depends_on: [11-base-hub, 20-retro-look, 17-people-kit, 09-paint-jobs, 06-talking-characters, 07-i18n]
relates: [11-base-hub, 25-medal-ceremony, 28-ladder-screen, 20-retro-look]
source_files:
  - src/data/base-areas.ts
  - src/game/base-hangar.ts
  - src/scenes/hangar-base.ts
  - src/render/base/index.ts
  - src/render/base/layout.ts
  - src/render/base/paint.ts
  - src/render/base/glyphs.ts
  - src/render/base/shell.ts
  - src/render/base/doors.ts
  - src/render/base/rooms.ts
  - src/render/base/props.ts
  - src/render/base/board.ts
  - src/render/base/jet.ts
  - src/render/base/ambient.ts
  - src/render/base/sprites.ts
  - src/render/base/cast.ts
  - src/render/base/labels.ts
  - src/i18n/ui-en-hangar.ts
  - src/i18n/ui-de-hangar.ts
routes: []
models: []
test_files:
  - tests/unit/base-hangar.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [base, hangar, home-base, pixel-art, hub, areas, navigation, animation, ladder, locker, picture-wall, rec-room]
path: Game/Honours/Base
initiative: home-base-honours
wave: home-base-honours-wave-2
wave_status: active
integration_contracts:
  - function: "Route { to: 'recRoom' } (doc 11)"
    when: "the FUN MISSIONS area opens the minigame list; its BACK / ESC returns to { to: 'base' }"
  - function: "Routes { to: 'ladder' }, { to: 'locker' }, { to: 'photoWall' } (docs 28, 31, 32)"
    when: "the LADDER, LOCKER and PICTURE WALL areas open them; they come back with { to: 'base' } and the pilot stands at the area last opened"
satisfies_contracts: []
known_issues:
  - "The ladder screen (doc 28) still returns to the title screen, not to the base: its owner switches its BACK to { to: 'base' }."
  - "Figures are people-kit pixel captures (doc 20): at the hangar's figure size the pilot's face is a few art pixels."
security_read_sites: []
sister_projects: []
---

# 30 — Hangar Base

## Purpose

Owner request (2026-10-25): *"draw the base as an airplane hangar with several areas: image wall, uniform,
ladder, fun missions, … Make it animated pixel art."* BASE (route `{ to: 'base' }`, the map's BASE button / key
**B**) becomes one 1280 × 720 animated pixel-art interior of an aircraft hangar at dusk. The player's selected jet
stands inside in its paint job; crew and props idle; clearly readable **areas** open the home base's rooms. The
minigame list from doc 11 moves behind the FUN MISSIONS area as the **rec room** (`{ to: 'recRoom' }`).

## Layout (logical 1280 × 720, left → right)

| Area | id | Where | Looks like | Opens |
|------|----|-------|------------|-------|
| FUN MISSIONS | `fun` | far left, floor row | rec-room doorway with warm light, an arcade cabinet with a blinking screen, a dartboard, a flickering neon joystick sign above the door | `{ to: 'recRoom' }` (doc 11 list) |
| LOCKER | `locker` | left, floor row | a row of four steel lockers with vents and a bench; locker 3 stands ajar with the dress whites (gold buttons, ribbons) and a white cap inside, a flight helmet on the bench | `{ to: 'locker' }` |
| PICTURE WALL | `photos` | left-centre, wall row | a framed corkboard with nine small pinned pictures (generic skies, sea, a jet silhouette — placeholders; the real photos are doc 32's) | `{ to: 'photoWall' }` |
| LADDER | `ladder` | centre, high on the back wall above the jet, wall row | a big split-flap scoreboard: row 1 the board name, row 2 the pilot's callsign, row 3 the pilot's local rating; tiles flip through letters every few seconds | `{ to: 'ladder' }` |
| EXIT · MAP | `exit` | right, floor row | the big sliding hangar doors, open onto a dusk airfield (sky, low sun, runway lights), red beacon, a green running-figure exit pictogram | `{ to: 'map' }` |

Between them: steel I-beam pillars, a corrugated back wall, roof trusses with four hanging lamps and their light
cones, a wall exhaust fan, a polished concrete floor with a yellow taxi line from the doors to the jet, a red tool
cart with a steaming coffee mug in front of the jet's tail, and a plane captain in a brown jersey polishing the
jet's nose. No text is painted into the art (every word is drawn with `t()` on top), no insignia, no brand logos.

**The jet**: `save.selectedPlane` in `save.livery[plane]`, drawn with the side-view art (`drawPlaneSide`, doc 09),
fitted into a 540 × 215 box centred at x 800 (its extent is measured once per plane from the drawing; nose towards
the doors, main gear on the floor at y 574), tinted to the hangar's dusk light, pixelated through
`pixel/quantize.ts` at the scene's art grid and given a warm one-pixel rim light along the top of the silhouette
(the lamps overhead — it keeps dark paint jobs like Black & Gold readable against the dark wall). Cached per
plane × livery × grid; yellow wheel chocks at the main gear, a dithered floor shadow under it.

## Navigation (pure, `src/game/base-hangar.ts` + table `src/data/base-areas.ts`)

- Areas are ordered left → right: `fun, locker, photos, ladder, exit`. **← / →** move the highlight one area
  (clamped at the ends, `uiMove`; nothing at an end).
- Every area has a row: `wall` (photos, ladder) or `floor` (fun, locker, exit). **↑** from a floor area goes to the
  wall area nearest in x, **↓** from a wall area to the nearest floor area; ↑ on the wall / ↓ on the floor does
  nothing. (fun ↑ photos, locker ↑ photos, exit ↑ ladder; photos ↓ locker, ladder ↓ exit.)
- **ENTER / A / Space** opens the highlighted area (EXIT included: the pilot walks out through the doors);
  **ESC / Backspace / B** → the map at once (`uiBack`).
- **Mouse**: hovering a hotspot highlights it (any non-touch pointer, only when it moved — a resting mouse never
  steals the keyboard's highlight); **click / tap** a hotspot highlights and opens it. Hotspots are the rectangles
  in `BASE_AREAS`; `areaAt(point)` hit-tests them; the bare floor hits nothing.
- `areaRoute(id)` maps an area to its route (switch with `satisfies never`).

## The pilot (the animated heart)

A people-kit figure (doc 17) of the active pilot — the avatar's skin, hair and eyes from the push-up looks, in a
flight suit in the avatar's suit colour — walks along the floor (feet at y 640) to the highlighted area's stand
point. Pure walker (`stepWalker`): moves towards the target at 300 logical px/s (opening: 900 px/s), faces the way
it walks, counts the distance for the walk cycle (8 key frames per 120 px, side view, mirrored for walking left),
stops exactly on the target. Standing, the pilot turns to the front (three-quarter figure, slight turn towards the
last walking direction) and blinks. Opening an area: the pilot hurries to the stand point and the route is taken
on arrival (at once if already there).

**Entry**: coming back from an area the hangar opened (`lastOpened`, kept in the scene module for the session;
cleared when leaving to the map), the pilot stands at that area and it is highlighted. Otherwise (from the map) the
pilot walks in from the doors to FUN MISSIONS, which is highlighted.

## Labels and UI (logical units, on top of the art)

- A small name plate per area (display font 13 in a dim pixel frame; the highlighted one 15 on the gold
  `NAME_PLATE`); around the highlighted hotspot pulsing gold pixel corner brackets (art layer, clamped to the screen).
- Bottom strip (RPG box, x 300 … 980, y 652 … 710): the highlighted area's name (display font 18, gold) and its
  one-line hint (typewriter 15), the controls line below (12, dim, right-aligned).
- Top right: "HOME BASE" title plate.
- Wingman greeting when entering from the map (not when coming back from an area): `baseLine('base')` in a
  non-persistent SpeechBox at the top left (portrait 20,14 · 84×100, box 116,24 · 500×88) — it types, waits and
  disappears, so it never covers the areas for long.
- The flip-board characters are drawn in the display font into the board's tiles (title `hbase.ladder`, the
  callsign upper-cased, `hbase.points` with `pilotStanding(save).rating`); while a row flips, each tile cycles
  through random letters for 0.25–0.85 s (staggered left to right), then settles. Rows flip every ~7 s in turn.
- Strings: `src/i18n/ui-en-hangar.ts` / `ui-de-hangar.ts` (`hbase.*`, spread into `UI_EN` / `UI_DE`):
  `title`, `fun`, `locker`, `photos`, `ladder`, `exit`, `hint.<id>`, `keys`, `points`, `back`.

## Animation (idle, all in whole art pixels)

| What | How |
|------|-----|
| Roof lamps | bulbs glow; one lamp flickers now and then (hash-timed, 1–3 frames off) |
| Red beacon on the door frame | flashes every 1.2 s with a two-step glow |
| Outside | slow clouds over the dusk sky, an aircraft's anti-collision light crossing far away, a "running rabbit" of approach lights |
| Wall fan | 6-frame blade rotation (cached sprites) |
| Dust motes | ~40 specks drifting and twinkling in the lamp cones and the door's light shaft |
| Coffee mug | three wisps of steam rising and fading |
| Neon joystick sign | mostly on, flickers off for a few frames at random, one tube buzzes dimmer |
| Arcade cabinet | tiny screen animation (4 frames: invaders, ship, shot) |
| Flip board | rows cycle letters and settle |
| Plane captain | polishes the nose: 4-frame rag circle, then a pause; blinks |
| Pilot | walk cycle / standing blink; small floor shadow |
| Highlight | gold corner brackets pulse (2 Hz), one-pixel bounce |

## Technique and performance

- The scene's art grid is the ceremony's (`artGrid`, doc 25): an art pixel = D whole device px ≈ 3 logical px.
- Static layers are painted once per grid with `src/render/pixel/` (`Pix`, master palette ramps, ordered dither)
  plus bounding-box fills (`base/paint.ts`: rects, paths, discs, Bresenham lines and `shade` — a pixel moved along
  its own ramp, used for the light cones, pools, the sun shaft and shadows) and cached: **back** (roof, walls,
  doors + outside, rooms, unlit neon tubes, board frame, prop shadows, pillars, lamps, then the light) and **front**
  (tool cart with mug, safety cones — outlined, drawn after the jet). The jet sprite is its own cached layer.
- Each frame composes back → ambient (lamps, beacon, outside, fan, neon, arcade) → board tiles → figure shadows →
  jet → chocks → front → dust / steam → brackets into one art-resolution scratch canvas and blits it once
  (smoothing off); the figures (people-kit pixel captures cached per pose, on the same grid via `units: 3 / scale`)
  and the UI text go on top.
- Split-flap tiles are cached 7 × 11 px sprites per character × ink × flap; the 5 × 7 pixel font
  (`base/glyphs.ts`) covers the callsign alphabet (A–Z, 0–9, Ä Ö Ü, space, hyphen).

## Business Rules

- Nothing is saved here; the scene only reads the active pilot's save (plane, livery, callsign, rating).
- Every area opens exactly one route; leaving calls `game.go` once.
- The rec room (doc 11) is `{ to: 'recRoom' }`: its MAP button becomes BASE and ESC / B go back to `{ to: 'base' }`;
  minigames started there use `from: 'recRoom'` and return to it (the shell's `from` is `'recRoom' | 'offer'`).
- People kit (doc 17) gains, additive: `drawSideFigure(…, face, opts?: PixelOpts)`.
- Other rooms come back with a plain `{ to: 'base' }`; the scene module remembers the area it opened last
  (`lastOpened`, session only, cleared when the hangar leaves for the map), so no route parameter is needed.

## Dependencies

11 (rec room, wingman line), 20 (pixel pipeline, frames, typewriter), 17 (people kit), 09 (side-view jets,
liveries), 06 (SpeechBox), 07 (strings), 25 (art grid, crew looks), 26 (rating for the board).

## Security

None (reads the active profile's save only; no network — the board shows local data).

## Verification (2026-10-25)

`tsc --noEmit` clean; Vitest 49 files / 550 tests green (new `base-hangar.test.ts`, 11 tests: area table inside
the screen and left → right, hotspots disjoint, routes, hit-testing, ← / → order and ends, ↑ / ↓ rows, every
area reachable, walker speed / facing / exact stop / hurry, walk-cycle frames); `vite build` OK.

Browser (dev build, 1280 × 720 at DPR 1 and 2, driven through `window.__toprun` with keyboard and pointer events in
headless Chromium — the desktop browser pane was at its tab limit): entry from the map (walk-in from the doors,
greeting), ← / → / ↑ / ↓ along the whole graph, every area opens its route — FUN MISSIONS → rec room
(ESC / B → back, pilot at FUN MISSIONS; a minigame started there returns to the rec room), LOCKER and PICTURE
WALL placeholders → back to the hangar at that area, LADDER → ladder screen (its BACK still goes to the title,
known issue), EXIT → walks out → map, ESC → map at once; hover highlights, click opens; EN and DE (all labels,
hints and the board fit); F-16 standard / aggressor, F-14 tiger stripes, SR-71 black & gold; pilot1–3 suit
colours; split-flap rows flipping; 1:1 detail crops of the rec room, lockers, jet, doors.

Frame cost (dev build, DPR 2, software-rastered headless Chromium, update + render incl. a forced canvas flush per
frame): **≈ 3.5 ms** per frame walking or standing (p95 4 ms) — the map scene measures ≈ 14 ms in the same setup.
CPU-side recording alone ≈ 0.2–0.3 ms. The first hangar frame builds the layers and the jet in ≈ 25 ms.

## Known Issues

- The ladder screen (doc 28) still returns to the title screen, not to the base: its owner switches its BACK to
  `{ to: 'base' }`.
- Figures are people-kit pixel captures (doc 20): at the hangar's figure size the pilot's face is a few art pixels.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
