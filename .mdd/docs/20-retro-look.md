---
id: 20-retro-look
title: Retro Look - Pixel-Art Characters, Typewriter Text, RPG Text Boxes
edition: TopRun
depends_on: [06-talking-characters, 08-pilot-profiles, 17-people-kit, 07-i18n]
relates: [06-talking-characters, 08-pilot-profiles, 17-people-kit, 03-campaign-map, 29-avatar-builder]
source_files:
  - src/render/pixel/palette.ts
  - src/render/pixel/path.ts
  - src/render/pixel/raster.ts
  - src/render/pixel/fx.ts
  - src/render/pixel/post.ts
  - src/render/pixel/blit.ts
  - src/render/pixel/bust.ts
  - src/render/pixel/frame.ts
  - src/render/pixel/quantize.ts
  - src/render/pixel/capture.ts
  - src/render/portraits/index.ts
  - src/render/portraits/types.ts
  - src/render/portraits/parts.ts
  - src/render/portraits/features.ts
  - src/render/portraits/hands.ts
  - src/render/portraits/admiral.ts
  - src/render/portraits/chief.ts
  - src/render/portraits/shooter.ts
  - src/render/portraits/wingman.ts
  - src/render/avatars/index.ts
  - src/render/avatars/kit.ts
  - src/render/avatars/pilot1.ts
  - src/render/avatars/pilot2.ts
  - src/render/avatars/pilot3.ts
  - src/render/people/pixel.ts
  - src/render/carrier/crew.ts
  - src/render/minigames/flyby-controller.ts
  - src/render/minigames/formation-radio.ts
  - src/render/text.ts
  - src/render/typed-text.ts
  - src/ui/speech.ts
  - src/scenes/map.ts
  - src/scenes/debrief.ts
  - src/scenes/minigames/shell-render.ts
routes: []
models: []
test_files:
  - tests/unit/pixel.test.ts
  - tests/unit/pixel-cast.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [art-style, pixel-art, typewriter, rpg-text-box, retro, portraits, avatars, people]
path: Game/Look/Retro
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 20 — Retro Look

> **Update 2026-10-26 (doc 33, image portraits):** the character portraits (admiral, shooter, chief, later the
> wingman) and all pilot avatars are now the owner's generated pixel-art images (ComfyUI "Top Gun pixel pilot
> portrait" / "Top Gun pixel crew portrait", FLUX.2 klein, 720 × 864 → area 240 × 288, 64 colours; generated
> illustrations, never photos) drawn nearest-neighbour — or from a reduced copy snapped back to the image's own
> colours when the box is smaller than the image — with the radio feed and the selection frame on top. The
> procedural portrait / avatar art below (and the "Avatar style rule") is retired except the wingman until
> `wingman.png` exists; the pixel pipeline itself (palette, raster, bust sprites, fx, frames, capture) stays for
> the people kit, ceremony, locker, picture wall and hangar base.

> **Update 2026-10-25 (doc 29, avatar builder):** the pipeline gained a **head tilt** — `Pix.rot` with a pivot turns
> shapes, ovals, strokes and lines (`Pix.at`), hand-placed features move whole to their turned anchor (`Pix.nudge`;
> eyes, nose, mouth with its slope, each brow on its own line); `rot = 0` keeps the exact old mapping (all portrait
> frames hash-identical). Features gained `Eyes.irisW` (bigger iris + 2-px catch-light) and `Mouth.lower` (tinted
> lower lip); `BustArt.backgroundId` lets several arts share one cached background. New ramps (appended):
> `skinBrown/Deep/Ebony`, `hairDarkBrown/Auburn/Strawberry/Platinum/Blue/Pink`, `irisDark/Hazel`, `khaki`, `seaNight`.
> The three pilot avatars were redrawn closer to the reference photos (pilot 3 tilted); the avatar skies live in
> `src/render/avatars/skies.ts`; custom looks are composed in `src/render/avatars/custom.ts` (doc 29).

> **Avatar style rule (owner feedback 2026-10-25, applies to the pilot avatars — presets and builder, doc 29):**
> "The proportions look off. Way too long heads … more anime-like … They all look cute. But TopGun is a cool genre.
> They are kids, and that can show, but less Pippi Langstrumpf, more Monkey Island 1 (not literally that pixelated)."
> The avatars are therefore drawn as **normal faces in pixel style**, like the close-up character portraits of
> early-90s VGA adventure games — style inspiration only, all art original:
>
> - **Proportions:** realistic heads, ≈ 3:4 width:height including hair volume; eyes at about the vertical middle of
>   the head; a real forehead, cheekbones, a defined (softer, rounder for kids) jaw and chin; a visible neck and
>   shoulders that fit the head (shoulders ≈ 2.4× the head width — no bobble-heads). Kids read as kids through softer
>   features and a slightly larger cranium, not through big eyes.
> - **Faces:** small realistic eyes (whites, iris, pupil, a dark upper lid line, a lower lid and a crease — no
>   sparkle catch-lights), brows with a little attitude, a modelled nose (bridge highlight, shadow side, nostril hint,
>   cast shadow), natural lips, cheek colour only as a faint dithered warmth, subtle freckles.
> - **Rendering:** one key light from the upper left, every material shaded in 3–5 tones of its ramp as volumes
>   (`src/render/avatars/light.ts`: lit ellipsoids with ordered-dither seams between bands), a rim light from the
>   background's sun/moon side, dark outlines only on the silhouette (post.ts) and where forms overlap.
> - **Mood:** cool and confident — steady gaze, half-smile, slight brow attitude — not cute.
> - Same hi-res art grid (≈ 100 × 120 art px at k = 1); the NPC portraits and people-kit figures are unchanged.

## Purpose

Owner feedback (2026-10-25): the arcade parts (jets, missions, carrier, HUD) are good; the
**characters and text feel too comic-like**. Make them read like a retro game:

- **All characters in pixel art**, *modern hi-res* pixel-art style (owner choice): portraits about
  128×128 art pixels shown scaled up with hard pixel edges, a limited palette, deliberate shading
  clusters and a dark outline — not blurred vector art.
- **Typewriter text** for dialogue and briefings (owner choice): character speech, mission
  briefings (map panel), debrief lines and minigame offer/rules lines. Menus and the in-flight HUD
  keep the bold arcade display font.
- **Retro RPG text box** instead of comic speech bubbles (owner choice): a dark box with a pixel
  border, the pixel portrait beside it in a frame, a name plate, text typed out letter by letter with
  a blinking block cursor and typewriter clicks.

## Scope

| What | Where | Becomes |
|------|-------|---------|
| Talking portraits: admiral, chief, catapult officer, Duke — all moods, gestures, talking/blinking | `src/render/portraits/`, doc 06 | pixel-art portraits (same API, same moods/gestures/mouth animation) |
| Pilot avatars pilot1–3 (new-pilot screen, pilot list, profile cards, debrief, cockpit plate if any) | `src/render/avatars/`, doc 08 | pixel-art avatars |
| People kit figures (push-up duel and crowd; later volleyball, motorbike, piano, tactics instructor) | `src/render/people/`, doc 17 | pixel-art figures; the kit API stays so callers don't change |
| Small crew figures on the carrier deck | `src/render/carrier/crew.ts` | pixel-art style to match (they are tiny; a pixel pass is enough) |
| Speech boxes (`SpeechBox`, styles `comic` / `radio`) | `src/ui/speech.ts` | `comic` → retro RPG text box; `radio` (in-flight wingman) keeps a radio feel but uses the pixel portrait + typewriter text |
| Dialogue / briefing text | `src/render/text.ts` + callers | typewriter font (`FONT_TYPE`) |

Out of scope: jets, enemies, bosses, carrier hull, terrain, HUD, cockpit consoles, menus' display font.

## Technique

`src/render/pixel/` provides the pixel pipeline: draw art into a small offscreen buffer at the art
resolution with pixel-snapped shapes, then post-process (hard alpha, palette quantisation with
optional ordered dithering, 1-art-pixel dark outline) and blit with `imageSmoothingEnabled = false`.
Results are cached per state (character × mood × gesture × mouth/blink frame; figure pose frames
where practical). Faces get hand-placed pixel features (eyes, brows, mouths) so expressions read
at 128 px. Palettes are curated per character group so the cast looks like one game.

Typewriter font stack (no font files — the project ships no assets):
`"American Typewriter", "Courier Prime", "Courier New", Courier, monospace`.

## Implementation (2026-10-25)

### Pipeline API (`src/render/pixel/`)

| Module | What it does |
|--------|--------------|
| `palette.ts` | The master palette: ~50 hue-shifted ramps (≈320 colours) as `PAL.<ramp>[slot]` indices; slot 0 is the ramp's ink (selective outline), then deep shadow, shadow, **base**, light, highlight. `RGBA` / `RADIO_RGBA` (green phosphor remap) / `INK` lookup tables. |
| `path.ts` | `path().move/line/quad/cubic/ellipse/rect/pair/close` — curves flattened to polygons in frame units. |
| `raster.ts` | `Pix` — an indexed (16-bit) art buffer with the frame mapping art = o + frame·k. `shape(path)` (nonzero fill sampled at pixel centres → hard edges), `oval`, `thick` (round-capped polylines; < 1 px becomes a Bresenham line), `lineMask`, `paint(mask, colour, clip?, pattern?)`, `border`, `seam` (edge where a part overlaps earlier paint), `mirror(col)`; mask helpers `and/minus/union/shifted`; `bayer(level)` ordered dither, `checker`. |
| `fx.ts` | `vgrad` (flat bands joined by short ordered-dither seams), `shiftRamp` (relight along a ramp), `glow` (banded light discs), `rays`, `rect`. |
| `post.ts` | `outline(pix)` — 1-px selective outline in the neighbour's ramp ink; `toCanvas(pix, radio)`. |
| `blit.ts` | `SpriteCache` (LRU), `fitBox` (art grid for a box: whole device pixels per art pixel `D`, art scale `k` quantised to 1/32, even width), `blitBox` (centred, bottom-aligned, clipped, device-pixel snapped, smoothing off), `scratch` compose canvases. |
| `bust.ts` | `drawBust(ctx, box, art, state)` — busts (portraits, avatars) in the 100×120 frame: cached background layer per box size, cached outlined figure per animation key, live ambient sprites (`puff`, `sprite`), optional overlay (radio feed, selection frame), composed at art resolution and blitted once. |
| `frame.ts` | Crisp UI chrome: `pixelFrame` (notched outline, light/dark bevel, inner line, fill; `hollow` for portrait frames), `frameAround`, `pixelRect`, `moreArrow`; styles `RPG_BOX`, `NAME_PLATE`, `PORTRAIT_FRAME`, `RADIO_BOX`. |
| `quantize.ts` / `capture.ts` | `drawPixelated(ctx, key, bounds, draw, { units, minD })` — vector drawings that animate continuously (people kit, tower controller) are rendered at ~3 units per art pixel, cleaned up (hard alpha, 18 dominant flat colours, nearest-colour snap, darkened-neighbour outline), cached per key (LRU 700) and blitted in the caller's transform (mirroring works). |

### Art grid

The art resolution follows the box: `fitBox` wants k ≈ 1 (100×120 art px, "hi-res") for boxes ≥ 1.5 logical px
per frame unit (debrief, new-pilot cards, pilot list), ≈ 0.7 for the speech-box portraits and 0.5 for the
radio strip and the map header avatar, then snaps so every art pixel is a whole number of device pixels and
the frame still fills the box (k lands between ~0.45 and 1.1 depending on window size and DPR). Features are
laid out parametrically from each character's measurements, so they stay deliberate at every k.

### Animation frames

Mouth 3 frames (closed / half / open), blink 3 frames, glance ±1 px, a 2-frame idle phase (Duke's mask,
pilot 1's fang, pilot 3's scarf), breathing = 1-px drop of the figure, mood nod = whole-pixel head drop; the
animated head roll is dropped (no rotation in pixel art) — a fixed pose tilt is laid out in the geometry instead
(`Pix.rot`, pilot 3, doc 29). Backgrounds are static layers; clouds, steam and the canopy bow
are ambient sprites moving in whole art pixels.

### Text

`FONT_TYPE` + `type: true` on `text()` / `paragraph()` / `wrap()` / `measure()`. Typewriter text is used for
all dialogue (SpeechBox, Formation radio strip), the map briefing, the debrief report rows and the minigame
rules lines. `typedLines()` (`render/typed-text.ts`) wraps the full line first, reveals it character by
character and draws a blinking block cursor (3.4 Hz) after the last typed character, also while waiting.

### Screens checked (1280×720, DPR 1 and offscreen DPR 2 / 2.25, EN + DE)

New pilot, pilot list, map header + briefing, hangar (chief), takeoff (shooter + deck crew), mission radio
(Duke), debrief (admiral, success + failure), base hub, minigame offer, rules card, push-up duel (pilots,
crowd, icon), tower flyby (controller), formation radio. German lines fit the boxes at their configured
sizes (worst-case 12-letter callsign checked for every line pool).

### Performance (dev build, DPR 1)

Cached portrait draw ≈ 0.05–0.08 ms, avatar with selection frame ≈ 0.2 ms, a new animation frame ≈ 1–2 ms
once; hangar scene ≈ 0.8 ms per frame (update + render). Push-up figures: ≈ 0.9 ms per frame while new poses
are cached, ≈ 0.01 ms per figure once cached.

## Business Rules

- Every place that showed a character still shows it, same size and position; only the style changes.
- Character APIs (portraits, avatars, people kit) stay source-compatible.
- Dialogue still types out letter by letter at the current speed; the voice blips stay; a blinking
  block cursor shows while typing and when a line waits.
- Performance: portraits and figures are cached; steady-state frame cost must not grow noticeably.

## Dependencies

06 (characters, SpeechBox), 08 (avatars), 17 (people kit), 07 (texts unchanged).

## Security

None.

## Known Issues

- Art resolution depends on the device scale (whole device pixels per art pixel), so the same portrait has a
  little more or less detail on different screens; at DPR 1 the smallest boxes (radio strip, map avatar) show
  art pixels 1:1.
- People-kit figures are pixelated vector captures (quantised, outlined) rather than hand-placed pixels;
  their faces are a few pixels wide in the push-up duel.
- Coffee drops in Tower Flyby and the push-up dizzy stars stay vector particles.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
