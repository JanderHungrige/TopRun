---
id: 08-pilot-profiles
title: Pilot Profiles - Callsign, Avatar, Per-Pilot Saves
edition: TopRun
depends_on: [01-game-core, 07-i18n]
relates: [01-game-core, 06-talking-characters, 29-avatar-builder]
source_files:
  - src/game/profiles.ts
  - src/game/callsign.ts
  - src/scenes/pilots.ts
  - src/scenes/new-pilot.ts
  - src/scenes/pilot-code.ts
  - src/game/pilot-code.ts
  - src/core/persist.ts
  - src/game/pilot-card.ts
  - src/render/pilot-card.ts
  - src/scenes/pilot-card-data.ts
  - src/ui/file-io.ts
  - src/ui/text-field.ts
  - src/ui/text-area.ts
  - src/game/settings.ts
  - src/render/avatars/index.ts
  - src/render/avatars/kit.ts
  - src/render/avatars/pilot1.ts
  - src/render/avatars/pilot2.ts
  - src/render/avatars/pilot3.ts
routes: []
models:
  - localStorage:toprun.profiles.v1
  - localStorage:topgun.save.v1 (legacy, read once for migration)
test_files:
  - tests/unit/profiles.test.ts
  - tests/unit/pilot-code.test.ts
  - tests/unit/pilot-card.test.ts
  - tests/unit/settings.test.ts
  - tests/unit/pixel-cast.test.ts
data_flow: writes-existing
last_synced: 2026-10-26
status: complete
phase: all
mdd_version: 11
tags: [profiles, callsign, avatar, save-game, migration, title-menu]
path: Game/Pilots
integration_contracts:
  - function: "GameContext.save / setSave(save)"
    when: "always the ACTIVE pilot's progress; scenes keep using it unchanged"
  - function: "GameContext.settings / setSettings(settings)"
    when: "device-wide settings (music, sfx, sfxOn, musicOn, autofire, lang, joystick, minigameOffers) — not per pilot"
satisfies_contracts:
  - from: 01-game-core
    function: "persistSave(save)"
    when: "replaced by persistStore(store): one write of the whole profile store"
    status: done
    verified_at: "src/main.ts:58 (Game.commit → persistStore)"
known_issues: []
security_read_sites:
  - src/game/profiles.ts (localStorage read → parseStore runtime validation)
sister_projects: []
---

# 08 — Pilot Profiles

## Purpose

Several people can play on one device. A new player types a **callsign** and picks one of
three **pilot avatars**; their progress (money, jets, weapons, stars) is saved in their own
profile. On the start menu, CONTINUE shows the list of pilots to choose from.

> **Pixel look (2026-10-25, doc 20):** the three avatars are pixel art drawn through the same bust pipeline as
> the portraits (`src/render/pixel/bust.ts`); `drawAvatar` keeps its API. Skies are banded gradients with
> dithered seams and a banded sun glow, clouds drift as pixel sprites, mouths/blinks use the portrait frames,
> and `selected` is a pulsing gold pixel border with a dithered inner glow and a twinkling corner star.
> Checked on the new-pilot cards (240×288), the pilot list (160×198) and the map header (50×60).

> **Avatar builder + reworked faces (2026-10-25, doc 29):** the three presets got faces closer to the owner's
> reference photos (eyes, brows, mouths, freckles, cheeks, hair; pilot 3's head is tilted) with the same outfits.
> NEW PILOT has a fourth card, CREATE YOUR OWN, which opens the pixel avatar builder (route `avatarBuilder`); the
> pilot list gets EDIT LOOK (and E). A built look is stored per pilot as `SaveData.look` (null = the preset
> `profile.avatar`), only via `setSave`. Every player bust goes through `drawPilotAvatar(ctx, pilotFace(profile), …)`.
> **Style v2 (same day, owner feedback):** all avatars now have realistic head proportions and painterly VGA-portrait
> shading (eyes at mid-head, a real jaw, a neck and shoulders that fit) — doc 29 "Art style v2", rules in doc 20.

> **Image portraits (2026-10-26, doc 33):** pilot1–3 are now the owner's generated pixel-art portraits
> (`src/assets/portraits/pilot1–3.png`, ComfyUI "Top Gun pixel pilot portrait"; a fourth, grown-up preset `pilot4`
> drawn after the owner joined on 2026-10-26 — NEW PILOT shows five 240 × 288 cards 1:1 with 10 px gaps); the builder picks a generated
> portrait by age, skin, hair colour and hair length (`SaveData.look` = that pick; old looks migrate on load).
> `drawPilotAvatar` keeps its API; the procedural avatars are retired.

> **Second row of presets (2026-10-27, owner):** "more pilots on the start page — from now on simply a second row
> under the first 4 + own avatar". Five more presets `pilot5`–`pilot9` (photos the owner supplied, same workflow as
> pilot4). NEW PILOT lays its cards out in rows of five (`NEW_PILOT_COLS`): row 1 = pilot1–4 + CREATE YOUR OWN
> (unchanged), row 2 = pilot5–9; later presets append to row 2 and then open a new row (`cardOrder`, pure,
> `src/game/pilot-cards.ts`). Two rows need smaller cards: 180 × 216 (¾ of 240 × 288) with 10 px gaps, the callsign
> field moves up. ←/→ walk all cards (wrapping), ↑/↓ change row in the same column (clamped to the last card).
> ↓ no longer opens the builder (it moves down a row): ↑ on CREATE YOUR OWN (top row, where ↑ has nothing else to
> do), ENTER on it before a look exists, a tap, or gamepad Y do. E cannot: the callsign field is focused and takes it.

> **Four rows, nineteen cards (2026-10-27, owner):** nine more presets `pilot10`–`pilot18` and a new photo for
> `pilot5` (photos the owner supplied; "alle sind einverstanden": everyone shown agreed). The order is the owner's and
> fixed in `CARD_ORDER` (`src/game/pilot-cards.ts`, pure): row 1 = pilot1–4, pilot10; row 2 = pilot5–9; row 3 =
> pilot12, pilot13, pilot15, pilot14, pilot11; row 4 = pilot16, pilot17, pilot18, CREATE YOUR OWN (owner, same day:
> "CREATE YOUR OWN at the very end, the others move up"). Four rows of five
> do not fit under the callsign field, so NEW PILOT splits in two: a left column with the title, the callsign field, a
> large preview of the selected card and START / BACK / PILOT CODE; the card grid (135 × 162, 8 px gaps) fills the
> right. CREATE YOUR OWN is the last card now, so ↑ on it moves up a row like on any card; ↓ on it opens the builder
> (no card sits below it), as do ENTER before a look exists, a tap and gamepad Y.

## Architecture

```
game/callsign.ts       normalizeCallsign(), validateCallsign() (pure)
game/profiles.ts       ProfileStore: emptyStore, parseStore, migrateLegacy, createProfile,
                       selectProfile, deleteProfile, updateActiveSave, updateSettings,
                       profileSummary, loadStore/persistStore (localStorage IO)
scenes/pilots.ts       CONTINUE screen: profile cards (avatar, callsign, progress), select, EDIT LOOK (doc 29), delete (confirm)
game/pilot-cards.ts    NEW PILOT card order + grid moves: CARD_ORDER, cardCell(), moveCard() (pure)
scenes/new-pilot.ts    NEW PILOT screen: left column (callsign, preview, START) + card grid of fives incl. CREATE YOUR OWN (doc 29)
ui/text-field.ts       a real DOM <input> laid over the canvas (mobile keyboards, IME, a11y); value setter, ↑/↓ hook
render/avatars/        drawPilotAvatar(ctx, face, box, { t, mouth, mood, selected }), pilotFace, pilotAccent;
                       drawAvatar(ctx, id, …) stays as an alias
```

## Data Model

`localStorage["toprun.profiles.v1"]`:

```ts
interface ProfileStore {
  version: 1;
  settings: Settings;            // { music, sfx, autofire, sfxOn, musicOn, lang, joystick, minigameOffers }
                                 // — device-wide; joystick: JoyProfile | null (doc 01)
                                 // sfxOn/musicOn replaced `muted` (2026-10-25): legacy muted: true → both off
  activeId: string | null;
  profiles: Profile[];           // max 6
}
interface Profile { id: string; callsign: string; avatar: AvatarId; createdAt: number; playedAt: number; save: SaveData }
type AvatarId = 'pilot1' | 'pilot2' | 'pilot3';
// SaveData.look: AvatarLook | null — the pilot's own look from the builder (doc 29); null = the preset `avatar`
```

`SaveData` (01) no longer carries settings. Avatars are original cartoons *inspired by* three
family photos (hair, eyes, freckles, clothing motifs) — the photos themselves are never shipped,
because the site and repository are public.

| Avatar | Look |
|--------|------|
| pilot1 | full shaggy golden bob parted left, heavy fringe over the right brow, big wide-set near-black eyes, faint brows, small serious pink-lipped mouth; orange suit, fang pendant on a cord + thin gold chain |
| pilot2 | long sun-bleached blond hair parted near the centre, dense freckles, smiling narrowed blue-grey eyes, wide closed-lip smile; navy suit with a guitar patch, helmet in hand |
| pilot3 | thick tousled honey-copper hair, heavy fringe swept right, very rosy round cheeks, relaxed hazel eyes, cheeky smirk, head tilted; olive suit, striped aviator scarf |

A pilot can also have their **own look** from the avatar builder (doc 29), stored as `SaveData.look`.

## API Endpoints

None.

## Business Rules

- **Callsign**: trimmed, inner whitespace collapsed, upper-cased; allowed `A–Z 0–9 Ä Ö Ü space -`;
  length 2–12; unique among profiles (case-insensitive). `validateCallsign` returns
  `ok | too-short | too-long | invalid-chars | taken`.
- **Create**: needs a valid callsign and an avatar; the new pilot gets `defaultSave()` and becomes
  active. More than 6 profiles → `full` (NEW PILOT is disabled with a hint). With CREATE YOUR OWN
  (doc 29) the avatar is `lookPreset(look)` and the look is stored right after via `setSave`.
- **Select** sets `activeId` and `playedAt`; the pilot list is sorted by `playedAt` (newest first).
- **Delete** asks for confirmation; deleting the active pilot clears `activeId`.
- **Migration**: when no profile store exists but the legacy `topgun.save.v1` does, it becomes a
  pilot with callsign `PILOT` and avatar `pilot1`; its settings become the device settings. The
  legacy key is left untouched (harmless; the store wins from then on).
- **Validation**: `parseStore(raw: unknown)` validates every profile through `parseSave` (01),
  drops malformed profiles, unknown avatars → `pilot1`, duplicate ids/callsigns → first wins,
  dangling `activeId` → null. Corrupt JSON → empty store, never a crash.
- **Title menu**: CONTINUE (only if profiles exist) → pilot list · NEW PILOT · CONTROLS · JOYSTICK ·
  SOUND · MUSIC · AUTOFIRE · LANGUAGE (SOUND and MUSIC are independent switches, doc 01 Audio). The old "NEW GAME / start over" confirm is gone — deleting a pilot replaces it.
- **Callsign in dialogue** (06): every spoken line may use `{callsign}`; SpeechBox injects it.
- The map top bar shows the active pilot's avatar and callsign; the mission HUD shows the callsign.

## Keeping saves: persistent storage and the pilot code (owner, 2026-10-26)

Saves live only in this browser's localStorage, per site address. They vanish in private windows, with
"clear site data on exit", after Safari's 7 days without a visit, and when the game moves to another address
(toprun → topgun). Two lightweight answers, no accounts and no server:

- **Persistent storage (A).** After a pilot is created or restored, `requestPersistence()`
  (`src/core/persist.ts`) asks `navigator.storage.persist()` once, if the browser has it and the site isn't
  persistent already, so the browser does not evict the save under storage pressure. Chrome / Edge / Safari
  decide silently; Firefox may show its own permission prompt — that is why it is tied to these two moments
  and never fires at boot. A refusal or a missing API changes nothing.
- **Pilot code (B).** A pilot's whole profile (id, callsign, avatar, dates, save — including the ladder link,
  so the restored pilot keeps their ladder entry) as one line of text:
  `TOPGUN1:<base64url(deflate-raw(JSON))>.<8-hex FNV-1a checksum of the payload>`. A full campaign stays
  around 1–2 KB. `encodePilotCode` / `decodePilotCode` (`src/game/pilot-code.ts`, pure, async because of
  `CompressionStream`) — decoding is tolerant: whitespace, line breaks and surrounding text are ignored (the
  code is found by its `TOPGUN1:` prefix), so a pasted chat message or the saved file both work. A wrong
  checksum, bad data or an invalid profile → a clear error, never a crash; the profile goes through the same
  `parseStore` validation as localStorage.
- **Restoring** (`importProfile(store, profile, now)`, pure): the same pilot id on this device → **replace** it
  after a confirmation that shows both (callsign, missions, stars); otherwise added as a new pilot and made
  active, unless the callsign is taken by another pilot (`taken`) or 6 pilots exist (`full`).
- **Screen** PILOT CODE (route `pilotCode`), reachable from the pilot list (a PILOT CODE button, key **R**)
  and from NEW PILOT (a PILOT CODE button) so a fresh device can restore before any pilot exists; BACK
  returns where it came from. Left, **back up**: ◀ pilot ▶, the code in a read-only text box, COPY CODE (clipboard; if the
  browser refuses, the text is selected for ⌘C / Ctrl+C) and SAVE CARD (the pilot ID card below). Right,
  **restore**: a text box to paste into, LOAD CODE, OPEN FILE (a card `.png` or a `.txt` with a code, picked
  with the browser's file dialog, at most 4 MB). Status line under the panel that caused it.
- **Pilot ID card** (owner, 2026-10-26): SAVE CARD downloads `topgun-<callsign>.png`, a 720 × 432 card that
  looks like a game collectible — header "TOPGUN · CARRIER STRIKE" / PILOT ID, the pixel portrait 1 : 1 in its
  frame, callsign, rank board and name, rating, missions and stars, money, jet, up to nine earned medals (or
  NO MEDALS YET), the issue date and a one-line how-to restore. The **pilot code rides inside the PNG** as a
  `tEXt` chunk (keyword `TopGunPilotCode`, inserted before `IEND`; `src/game/pilot-card.ts`, pure, with CRC-32),
  so OPEN FILE on the card restores the pilot. Apps that recompress shared photos (WhatsApp, some photo
  shares) drop the chunk: the saved message says to share it as a file, not as a photo; COPY CODE stays the
  robust way. The card is drawn by `src/render/pilot-card.ts` after the portrait image has loaded.
- The code (and so the card) is a key to that pilot: anyone with it can play on and post to the ladder as
  them. The screen says so in one line; it holds no personal data beyond the callsign.

## Data Flow

Title → pilots/new-pilot → `GameContext.selectProfile/createProfile` → store → `persistStore`.
All scenes keep reading `GameContext.save`; `setSave` writes into the active profile.

## Dependencies

01 (SaveData, parseSave, title), 07 (all texts).

## Security

Untrusted input: the localStorage store (user-editable), the typed callsign and a pasted / opened pilot
code (decoded with a size cap and the same `parseStore` validation; never evaluated or inserted as HTML). Callsigns are
filtered to a small character whitelist and only ever drawn with `fillText` on the canvas (never
inserted as HTML). The text field is a plain `<input>` with `maxlength`, no autocomplete.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
