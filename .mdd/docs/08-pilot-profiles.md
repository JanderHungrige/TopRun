---
id: 08-pilot-profiles
title: Pilot Profiles - Callsign, Avatar, Per-Pilot Saves
edition: TopRun
depends_on: [01-game-core, 07-i18n]
relates: [01-game-core, 06-talking-characters]
source_files:
  - src/game/profiles.ts
  - src/game/callsign.ts
  - src/scenes/pilots.ts
  - src/scenes/new-pilot.ts
  - src/ui/text-field.ts
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
data_flow: writes-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [profiles, callsign, avatar, save-game, migration, title-menu]
path: Game/Pilots
integration_contracts:
  - function: "GameContext.save / setSave(save)"
    when: "always the ACTIVE pilot's progress; scenes keep using it unchanged"
  - function: "GameContext.settings / setSettings(settings)"
    when: "device-wide settings (music, sfx, muted, autofire, lang, joystick) — not per pilot"
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

## Architecture

```
game/callsign.ts       normalizeCallsign(), validateCallsign() (pure)
game/profiles.ts       ProfileStore: emptyStore, parseStore, migrateLegacy, createProfile,
                       selectProfile, deleteProfile, updateActiveSave, updateSettings,
                       profileSummary, loadStore/persistStore (localStorage IO)
scenes/pilots.ts       CONTINUE screen: profile cards (avatar, callsign, progress), select, delete (confirm)
scenes/new-pilot.ts    NEW PILOT screen: callsign field + 3 avatars + START
ui/text-field.ts       a real DOM <input> laid over the canvas (mobile keyboards, IME, a11y)
render/avatars/        drawAvatar(ctx, id, box, { t, mouth, mood })
```

## Data Model

`localStorage["toprun.profiles.v1"]`:

```ts
interface ProfileStore {
  version: 1;
  settings: Settings;            // { music, sfx, autofire, muted, lang, joystick } — device-wide
                                 // joystick: JoyProfile | null (doc 01)
  activeId: string | null;
  profiles: Profile[];           // max 6
}
interface Profile { id: string; callsign: string; avatar: AvatarId; createdAt: number; playedAt: number; save: SaveData }
type AvatarId = 'pilot1' | 'pilot2' | 'pilot3';
```

`SaveData` (01) no longer carries settings. Avatars are original cartoons *inspired by* three
family photos (hair, eyes, freckles, clothing motifs) — the photos themselves are never shipped,
because the site and repository are public.

| Avatar | Look |
|--------|------|
| pilot1 | shaggy golden bob with side fringe, big dark eyes, serious look, tooth pendant on a cord |
| pilot2 | long straight blond hair, freckles, friendly smile, navy flight suit with a guitar patch |
| pilot3 | messy strawberry-blond fringe, head tilted, cheeky smirk, striped aviator scarf |

## API Endpoints

None.

## Business Rules

- **Callsign**: trimmed, inner whitespace collapsed, upper-cased; allowed `A–Z 0–9 Ä Ö Ü space -`;
  length 2–12; unique among profiles (case-insensitive). `validateCallsign` returns
  `ok | too-short | too-long | invalid-chars | taken`.
- **Create**: needs a valid callsign and an avatar; the new pilot gets `defaultSave()` and becomes
  active. More than 6 profiles → `full` (NEW PILOT is disabled with a hint).
- **Select** sets `activeId` and `playedAt`; the pilot list is sorted by `playedAt` (newest first).
- **Delete** asks for confirmation; deleting the active pilot clears `activeId`.
- **Migration**: when no profile store exists but the legacy `topgun.save.v1` does, it becomes a
  pilot with callsign `PILOT` and avatar `pilot1`; its settings become the device settings. The
  legacy key is left untouched (harmless; the store wins from then on).
- **Validation**: `parseStore(raw: unknown)` validates every profile through `parseSave` (01),
  drops malformed profiles, unknown avatars → `pilot1`, duplicate ids/callsigns → first wins,
  dangling `activeId` → null. Corrupt JSON → empty store, never a crash.
- **Title menu**: CONTINUE (only if profiles exist) → pilot list · NEW PILOT · CONTROLS · SOUND ·
  AUTOFIRE · LANGUAGE. The old "NEW GAME / start over" confirm is gone — deleting a pilot replaces it.
- **Callsign in dialogue** (06): every spoken line may use `{callsign}`; SpeechBox injects it.
- The map top bar shows the active pilot's avatar and callsign; the mission HUD shows the callsign.

## Data Flow

Title → pilots/new-pilot → `GameContext.selectProfile/createProfile` → store → `persistStore`.
All scenes keep reading `GameContext.save`; `setSave` writes into the active profile.

## Dependencies

01 (SaveData, parseSave, title), 07 (all texts).

## Security

Untrusted input: the localStorage store (user-editable) and the typed callsign. Callsigns are
filtered to a small character whitelist and only ever drawn with `fillText` on the canvas (never
inserted as HTML). The text field is a plain `<input>` with `maxlength`, no autocomplete.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
