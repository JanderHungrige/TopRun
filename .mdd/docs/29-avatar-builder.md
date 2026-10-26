---
id: 29-avatar-builder
title: Avatar Builder - Own Pixel Avatar from Parts, Reworked Preset Faces
edition: TopRun
depends_on: [08-pilot-profiles, 20-retro-look, 07-i18n]
relates: [08-pilot-profiles, 20-retro-look, 17-people-kit, 25-medal-ceremony]
source_files:
  - src/game/avatar-look.ts
  - src/scenes/avatar-builder.ts
  - src/scenes/avatar-builder-render.ts
  - src/render/avatars/custom.ts
  - src/render/avatars/hair.ts
  - src/render/avatars/hair-more.ts
  - src/render/avatars/extras.ts
  - src/render/avatars/person.ts
  - src/render/avatars/skies.ts
  - src/render/avatars/head.ts
  - src/render/avatars/face.ts
  - src/render/avatars/light.ts
  - src/render/avatars/suit.ts
  - src/render/avatars/hair-kit.ts
  - src/i18n/ui-en-avatar.ts
  - src/i18n/ui-de-avatar.ts
routes: []
models:
  - "SaveData.look: AvatarLook | null (per pilot, in the profile store toprun.profiles.v1)"
test_files:
  - tests/unit/avatar-look.test.ts
  - tests/unit/avatar-art.test.ts
  - tests/unit/avatar-style.test.ts
  - tests/unit/save.test.ts
data_flow: writes-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [avatar, avatar-builder, character-creator, pixel-art, profiles, customisation, head-tilt]
path: Game/Pilots/Builder
integration_contracts:
  - function: "GameContext.setSave(save)"
    when: "the builder stores an existing pilot's look as save.look (NEW PILOT stores it right after createProfile); nothing else persists it"
  - function: "drawBust(ctx, box, art, state) (doc 20)"
    when: "a custom look is composed into a BustArt and drawn through the same cached bust pipeline as the presets"
satisfies_contracts: []
known_issues:
  - "The online ladder (doc 28) still shows the preset colour of profile.avatar; a custom look is not sent to the server."
  - "The player has no talking dialogue portrait (SpeechBox speakers are the four NPCs), so a custom look shows on the NEW PILOT cards, the pilot list, the map header, the builder and the full-body scenes."
security_read_sites:
  - src/game/save.ts (parseSave → parseLook: untrusted localStorage value)
sister_projects: []
---

# 29 — Avatar Builder

> **Superseded in part (2026-10-26, doc 33):** the procedural avatars (art v1 / v2 below) are retired. Presets draw
> the owner's generated portraits `pilot1–3.png`; the builder now picks a generated portrait by **age, gender, skin,
> hair colour, hair length** (`AvatarLook` v3, `custom/<age>-<gender>-<skin>-<hair>-<length>.png`, exact match or a
> silhouette) with
> RANDOM / CANCEL / DONE / ORIGINAL as before. `SaveData.look` stores the pick; v1/v2 looks migrate on load
> (`parseLook`). Routes, New Pilot's fourth card, EDIT LOOK, `setSave`-only persistence and `playerPerson` stay.
> The sections below describe the retired v1/v2 art and are kept for history.

## Purpose

Owner requests (2026-10-25):

1. **Better preset faces.** The three pilot avatars (doc 08) are drawn after the owner's family photos. Make them
   "as close as pixel art allows": face shape and proportions, eye shape/size/spacing and colour, brows, nose,
   mouth and typical expression, freckles, cheek colour, hair silhouette/parting/fringe/length/texture/colours and
   head tilt — same outfits, same style as the other portraits. The photos are reference only: nothing derived
   from their pixels is stored anywhere (public repo and site); the faces are hand-placed pixel art in the path
   system (doc 20), with nothing that identifies the children beyond a cartoon appearance (no names, no places).
2. **An own avatar** (owner's choice: a **pixel builder**). A new pilot can pick one of the three presets or
   CREATE YOUR OWN from parts; an existing pilot can change the look later (EDIT LOOK on the pilot card) or go
   back to the hand-drawn preset (ORIGINAL).

## Art style v2 — realistic proportions (owner feedback 2026-10-25, after the first deploy)

> "The proportions look off. Way too long heads. How about using normal faces but pixel style. This is more … anime
> like. They all look cute. But TopGun is a cool genre. Yes they are kids, and that can show, but less Pippi
> Langstrumpf, more Monkey Island 1 (not literally that pixelated)."

Rules (style section of doc 20; style inspiration only — every pixel is original, nothing from any game is reproduced):

- **One shared head** for presets and custom looks (`head.ts`, frame units, k = 1 ≈ 1 art px): `KID_HEAD` = skull
  top 17.5, temples ±14.4, cheekbones ±15.2 at y 45, jaw angle ±12.4 at y 56.8, chin ±5.8 at y 65.8, ears at y
  ≈ 43–52; features: brows ≈ 38.5, **eyes ≈ 43.5** (between the middle and 0.6 of hair-top … chin), nose tip ≈ 52,
  mouth ≈ 58.5. Head with hair ≈ 0.6–1 wide:tall (3:4 typical). Neck half-width 8 (`suit.ts`), shoulders to ±50
  (≥ 2.4× the face with ears, ≥ 1.8× even the fullest hair). Each preset varies the `HeadSpec` (pilot 1 a narrower
  chin, pilot 2 longer with a pointed chin, pilot 3 rounder). `drawFace(p, rig, FaceArt)` draws ears, the jaw's cast
  shadow on the neck, the lit face, cheek warmth, freckles, form (sockets, brow-ridge / cheekbone / chin lights),
  eyes, brows, nose and mouth; hair and glasses go on top.
- **Features** (`face.ts`): eyes ≈ 6.6 × 2.5 units (lid line, whites shaded at the corners and under the lid, a 2–3 px
  iris with a pupil, a crease and lower lid; no catch-light; the shadow-side eye's whites are darker), brows 1–2 px
  rising from a slightly lowered inner end, nose with shadow-side bridge, broken highlight, tip, wings, nostrils and
  cast shadow, lips as a line + darker upper lip + lit lower lip + the shadow below; talking frames drop the jaw and
  open a dark mouth with a row of teeth; moods (kit.ts) move brows, lids and mouth corners — neutral is a steady gaze
  (lids slightly lowered) with a half-smile, happy a closed-lip smile, stern lowered brows, worried raised ones.
- **Shading** (`light.ts`): `litFill` shades a mask as a lit ellipsoid (`Dome`, optional flattened front) with the
  key light from the upper left in up to five ramp tones (`FIVE` / `FOUR`) joined by ordered-dither seams (long on
  hair and cloth, almost none on skin); `litPiece` adds a dark seam where parts overlap; `glaze` is a sparse
  dither; after the figure is drawn `rimLight` lightens the silhouette pixels facing the sky's sun or moon by 1–2
  steps of their own ramp (`palette.lighter`; `Sky.rim`: dawn and night from the left, day and sunset from the right,
  day and night also from above). Cheek warmth (`warmth`) is a sparse dither of a slightly warmer skin tone on the
  mid-tone pixels only — never a circle. `Pix.frame` (inverse of `Pix.at`) lets the lighting follow a tilted head.
- **Hair** (`hair-kit.ts`): every hair mass is one lit volume (`HAIR_DOME`) with dark partings between clumps, light
  strands and a dithered sheen band; the presets' bob / long / mop and the builder's crop / buzz / side part /
  ponytail / bun / curls / braids are re-fitted to `KID_HEAD`. Glasses sit on the new eye line; scarf, pendant,
  bandana and dog tags on the new neck and collar; the suit (`suit.ts`) is lit with seams, armpit folds, a lit collar.
- Blink, breathing, moods, glances, the talking mouth, the head tilt and all caching are unchanged.

### Presets v2 (same outfits, likeness kept, rendered realistically)

| Avatar | Face and hair now |
|--------|-------------------|
| pilot1 | Round kid face with a slightly narrow chin; wide-set dark eyes (`irisDark`), lids fully open, a hint of shadow under them; faint thin blond brows; small nose; small serious mouth with full pink lips; faint warmth. Full golden bob parted on the left, heavy fringe swept over the right brow and the right eye's outer corner, ends flicking out below the jaw, sheen on the crown. Orange suit, fang on a cord + thin gold chain, dawn rim light from the left. |
| pilot2 | Longer face with a slightly pointed chin; blue-grey eyes narrowed by a confident half-smile (raised lower lids, right corner up); subtle freckles; faint warmth. Long sun-bleached blond hair parted just left of centre, close round the face, wavy ends past the shoulders. Navy suit, guitar patch, helmet in hand (lit), day rim light from the upper right. |
| pilot3 | Round face with full cheeks and a dithered rosy warmth; relaxed, slightly hooded hazel-brown eyes; small nose; a cheeky smirk lifting the right corner. Thick tousled honey-copper hair (`hairStrawberry`, darkened) with a heavy fringe over the brows swept right, cowlick and flyaways (lower crown than v1), left ear lobe showing; head tilted ≈ 11°. Sage suit, striped scarf, sunset rim light from the right. |

Verified by `tests/unit/avatar-style.test.ts` (proportions of all presets and every hair style, shoulder ratio, face
outline, lighting direction, rim light, `lighter`, `Pix.frame`, moods at the map-header size). Before/after renders
of the presets were compared side by side in the browser.

## Preset rework v1 (superseded by v2 above; kept for history)

| Avatar | What changed |
|--------|--------------|
| pilot1 | Bigger, wider-set, near-black eyes (`irisDark`, bigger iris via `Eyes.irisW`, a 2-px catch-light, upper lids fully open) with a soft shadow line under them; faint, thin blond brows set higher; smaller nose; small closed mouth with full pink lips (serious look kept); a slightly narrower chin. Hair: fuller golden bob parted on the left, a heavy fringe swept across to the right over the right brow and the eye's outer corner, wavy ends flicking out below the jaw, a sun-bleached crown. Pendant: the fang on its dark cord plus a thin gold chain close round the neck. |
| pilot2 | Longer face with a slightly pointed chin; a dense band of freckles over nose and cheeks in two tones (`freckles()`); smiling eyes (raised lower lids, relaxed upper lids); a wide closed-lip smile with a pink lower lip (`Mouth.lower`); a rounder nose; rosier cheeks. Hair: long, parted just left of centre, close round the face, sun-bleached crown, darker under-layers, wavy ends past the shoulders. |
| pilot3 | Round face with full, very rosy cheeks; hazel-brown, relaxed, slightly hooded eyes (`irisHazel`); a small upturned nose; a smirk lifting the right corner and a reddish lower lip. Hair: thick, tousled honey-copper (`hairStrawberry`) with a heavy fringe swept to the right over both brows, flyaway strands and the cowlick on the crown, the left ear lobe peeking out. The whole head is **tilted** ≈ 11° towards the viewer's left. |

`moods(smile, { squint, hood })` (kit.ts) sets each preset's resting lids. Skies moved to `skies.ts` (shared with
custom looks: `SKIES.dawn | day | sunset | night`); pilot1–3 export their hair as `HairArt` (`BOB`, `LONG`, `MOP`) in
any colour, plus `pendant`, `helmet`, `scarf` for the builder's accessories.

**Head tilt** (new in the pixel pipeline, doc 20): `Pix.rot` + `pivotX/pivotY` turn every shape, oval, stroke and
line of the head about the top of the neck (`Pix.at(x, y)`), while hand-placed features (eyes, brows, mouth, nose,
freckles) are laid out upright and moved whole to their turned anchor (`Pix.nudge`); mouth columns follow the slope
and a tilted head draws each brow along its own line. With `rot = 0` the mapping is exactly the old one (verified:
every portrait frame hashed identical before/after). `AvatarArt.tilt` sets it per avatar.

## Look model (`src/game/avatar-look.ts`, pure)

```ts
interface AvatarLook {
  hair: HairStyle;        // bob · long · mop (the three presets' styles) · crop · buzz · sidePart · ponytail · bun · curly · braids
  hairColor: HairColor;   // black · darkBrown · brown · chestnut · auburn · strawberry · ginger · golden · blond · platinum · silver · blue · pink
  skin: SkinTone;         // pale · light · ruddy · tan · olive · brown · deep · ebony
  eyes: EyeColor;         // dark · brown · hazel · green · blue · grey
  freckles: Freckles;     // none · some · many
  cheeks: Cheeks;         // none · soft · rosy
  glasses: Glasses;       // none · aviators · clear
  accessory: Accessory;   // none · scarf · pendant · bandana · dogtags · helmet
  suit: SuitColor;        // orange · navy · sage (the presets' suits) · olive · grey · khaki · red · blue
  sky: SkyId;             // dawn · day · sunset · night (carrier deck background)
}
```

- `LOOK_PARTS` (builder row order), `lookOptions(part)`, `DEFAULT_LOOK`.
- `parseLook(raw: unknown): AvatarLook` — never throws; a non-object → `DEFAULT_LOOK`; any unknown or wrongly typed
  part → that part's default; extra keys dropped.
- `cycleLook(look, part, dir)` — next/previous option of one part, wrapping.
- `randomLook(seed)` — deterministic (mulberry32); fun hair colours (blue, pink) ≈ 12 %, glasses ≈ 40 %.
- `lookKey(look)` — one base-36 option index per part (10 chars): the cache key of the rendered bust; `sameLook`.
- `PRESET_LOOKS[avatarId]` — the parts closest to each preset (where a preset pilot's builder starts);
  `lookPreset(look)` — the preset with the same suit colour (else pilot1), stored as `profile.avatar` of a pilot
  created with a custom look, so places without custom art (ladder colour) stay sensible.

## Storage

`SaveData.look: AvatarLook | null` (save.ts), default `null` = "use the preset `profile.avatar`". `parseSave`: an
object → `parseLook`, anything else (missing, string, array) → `null`, so old saves without `look` load unchanged.
Written only through `GameContext.setSave({ ...save, look })` for the **active** pilot: NEW PILOT right after
`createProfile` (which makes the new pilot active); the builder after `selectProfile(id)`.

## Rendering (`src/render/avatars/`)

- `drawPilotAvatar(ctx, face, box, state)` (index.ts) — the single entry point for the player's bust; `face` is a
  preset id or an `AvatarLook`; `pilotFace(profile)` = `profile.save.look ?? profile.avatar`; `pilotAccent(face)` =
  the preset colour, or the light tone of the custom suit. Used by NEW PILOT, the pilot list, the map header and the
  builder. `drawAvatar(ctx, id, …)` stays as a thin alias (dev page).
- `custom.ts` composes an `AvatarArt` from the look: sky (`skies.ts`), flight suit in the suit ramp with a star patch,
  hair `behind`/`back`/`front` layers per style (`hair.ts`: crop, buzz, side part, ponytail on a shared `cap()`;
  `hair-more.ts`: bun, curls, braids; bob/long/mop are the presets' own), the face (`drawFace`, head.ts + face.ts:
  `KID_HEAD`, warmth tone per skin, freckles, eyes, brows, nose, mouth — style v2), glasses, accessory (`extras.ts`;
  helmet = front layer). Same moods, blink, breathing, glance and talking mouth as the presets.
- Built arts are memoised by `lookKey` (LRU 32); the bust id is `look:<key>` and the background is shared per sky
  (`BustArt.backgroundId = sky:<id>`, new in bust.ts), so each animation frame is rasterised once and cached by the
  bust pipeline like the presets.
- New palette ramps (palette.ts): `skinBrown/Deep/Ebony`, `hairDarkBrown/Auburn/Strawberry/Platinum/Blue/Pink`,
  `irisDark/Hazel`, `khaki`, `seaNight` (appended, existing indices unchanged).
- Full-body scenes (push-up duel, volleyball, motorbike, piano bar, medal ceremony — people kit, doc 17):
  `playerPerson(faceOf(profile))` (`person.ts`) gives the preset's `PLAYER_LOOKS` entry or a look derived from the
  custom look (skin/hair/eye/suit colours from the same ramps, nearest kit hair style); scene variants go through
  `restyle(base, tag, make)` (beach shorts, dress whites, T-shirt) so object identity — the kit's pixel-cache key —
  stays stable. `PILOT_LOOKS` stays exported (ceremony-looks.ts) for compatibility; `pilotInWhites(face)` is new.

## Builder screen (`src/scenes/avatar-builder.ts` + `avatar-builder-render.ts`, route `avatarBuilder`)

```ts
interface NewPilotDraft { callsign: string; look: AvatarLook | null; pick: number }
type BuilderTarget = { kind: 'new'; draft: NewPilotDraft; start: AvatarLook } | { kind: 'pilot'; profileId: string };
| { to: 'newPilot'; draft?: NewPilotDraft }
| { to: 'avatarBuilder'; target: BuilderTarget }
```

- Left: the live preview (400×480 = the full 100×120 art grid at 4×) in the retro portrait frame, the callsign on a
  gold name plate. Right: one row per part (label, option name, n/N, ◀ ▶ pixel arrows); below: RANDOM, (ORIGINAL),
  CANCEL, DONE. A change makes the preview grin and chatter for a moment.
- Keyboard / gamepad: ↑/↓ rows and the button bar (wrapping), ←/→ change the option (or move along the bar),
  ENTER/A = DONE (on the bar: the focused button), ESC/B = CANCEL, R / E / pad Y = RANDOM.
  Mouse: hover focuses rows and buttons; click ◀/▶, a row (= next option) or a button. Touch: tap the same.
- From NEW PILOT: DONE returns with the look on card 4 (selected) and the typed callsign restored into the field
  (the `<input>` is unmounted while the builder is open, `TextField.value` refills it); CANCEL returns the draft
  unchanged. From the pilot list: DONE selects the pilot and stores the look via `setSave` (a preset pilot who
  changed nothing keeps the hand-drawn face); ORIGINAL stores `look = null`; CANCEL changes nothing.

## NEW PILOT (`src/scenes/new-pilot.ts`, doc 08)

- Four 240×288 cards: pilot1–3 and **CREATE YOUR OWN** — a random look changing every 2.4 s under a banner until a
  look is built, then the built look ("YOUR OWN LOOK · ↓ / TAP: EDIT").
- ↓ in the callsign field (`TextField.onUpDown`), pad ↓, E/Y, or tapping card 4 opens the builder (starting from the
  teaser look shown). ENTER/START on card 4 without a look opens the builder; with a look it creates the pilot with
  `avatar = lookPreset(look)` and then `setSave({ ...save, look })`.

## Pilot list (`src/scenes/pilots.ts`, doc 08)

- Each card: FLY, **EDIT LOOK** (92 px) and DELETE (80 px); E (`special`, pad Y) on the focused card opens the
  builder. Card border and portrait use `pilotAccent` / `drawPilotAvatar`.

## Business Rules

- `look === null` → the preset art exactly as before; a custom look never changes progress or stats.
- The builder never writes anything before DONE / ORIGINAL; CANCEL leaves the pilot (and the NEW PILOT draft) unchanged.
- Every part and option name is localised (EN + DE) in `ui-en-avatar.ts` / `ui-de-avatar.ts` (`optionLabel`).

## Verification (2026-10-25)

- Vitest: look model (options, parse, cycle, random determinism/variety, keys, presets), save parsing (default,
  old save without `look`, round trip, junk), every option of every part renders and changes the picture, moods /
  blink / mouth frames at k 0.5–1, the head tilt mapping, stable full-body looks. `tsc --noEmit`, production build.
- Browser (dev, 1280×720, EN + DE): NEW PILOT with the reworked presets and the custom card; builder by keyboard,
  mouse clicks and back (draft restored); a custom pilot created → map header and pilot card show it; EDIT LOOK,
  ORIGINAL, untouched DONE; an old store without `look` still loads; the medal ceremony shows the custom colours.
- Frame cost (dev build, hidden tab): cached 400×480 bust 0.03 ms, NEW PILOT frame ≈ 0.43 ms, pilot list ≈ 0.3 ms;
  a new look's figure renders once in ≈ 3–10 ms (curls the most; the presets measure 4.5–5.7 ms in the same setup).
- Style v2 (same day): proportion / lighting tests above; presets compared before/after side by side in the page;
  NEW PILOT, the builder (k = 1 preview) and ~10 random looks at card size and at the map-header size (k = 0.5)
  checked. Figure renders ≈ 4–10 ms once per frame state (presets 5.5–6.7 ms, braids/curls ≈ 10 ms); NEW PILOT
  ≈ 0.63 ms per frame including the rotating teaser on card 4.

## Dependencies

08 (profiles, NEW PILOT, pilot list), 20 (pixel bust pipeline, palette), 07 (texts), 17 (people kit looks).

## Security

`SaveData.look` comes from user-editable localStorage: `parseLook` only ever returns whitelisted option ids, so the
renderer never sees unknown values. No look data leaves the device.

## Known Issues

- The online ladder (doc 28) still shows the preset colour of `profile.avatar`; a custom look is not sent to the server.
- The player has no talking dialogue portrait (SpeechBox speakers are the four NPCs), so there is no dialogue
  place for the custom look to appear.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
