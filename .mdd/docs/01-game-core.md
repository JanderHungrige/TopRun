---
id: 01-game-core
title: Game Core - Engine, Input, Scenes, Audio, Save, Branding
edition: TopRun
depends_on: []
relates: [02-hangar-economy, 07-i18n, 06-talking-characters]
source_files:
  - index.html
  - src/main.ts
  - src/style.css
  - src/core/canvas.ts
  - src/core/loop.ts
  - src/core/input.ts
  - src/core/gamepad.ts
  - src/core/scene.ts
  - src/core/math.ts
  - src/core/rng.ts
  - src/core/audio.ts
  - src/core/music.ts
  - src/core/music-patterns.ts
  - src/core/audio-nodes.ts
  - src/core/sfx-voice.ts
  - src/core/music-songs.ts
  - src/core/music-synth.ts
  - src/core/music-drums.ts
  - src/core/music-voices.ts
  - src/core/music-rig.ts
  - src/core/sfx-recipes.ts
  - src/game/save.ts
  - src/render/logo.ts
  - src/game/state.ts
  - src/render/text.ts
  - src/render/shapes.ts
  - src/render/particles.ts
  - src/render/backdrop.ts
  - src/ui/widgets.ts
  - src/scenes/title.ts
routes: []
models:
  - localStorage:topgun.save.v1
test_files:
  - tests/unit/core.test.ts
  - tests/unit/save.test.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [canvas, game-loop, input, gamepad, touch, webaudio, save-game, scenes]
path: Game/Engine
integration_contracts:
  - function: "loadSave()/persistSave(save)"
    when: "every scene that changes money, ownership, loadout or progress must persist through persistSave — never write localStorage directly"
  - function: "SceneManager.go(scene)"
    when: "all scene transitions go through the manager so fades and input resets happen"
satisfies_contracts: []
known_issues:
  - "Phones held upright letterbox the 16:9 frame heavily; landscape is recommended (no portrait layout yet)"
  - "Synthesized SFX/music mix has not been tuned by ear yet"
  - "Docker image verified on 2026-10-25 with substitute base images (node:22-alpine, nginx:alpine) because Docker Desktop could not pull the pinned node:24.19.0-alpine / nginx-unprivileged:1.30.6-alpine locally; the first build on the server pulls the pinned images"
security_read_sites:
  - src/game/save.ts (localStorage read → parseSave runtime validation)
sister_projects: []
---

# 01 — Game Core

> **2026-10-25 update:** the game is renamed **TopRun** (was "TopGun"). The title shows an
> original winged TopRun badge (chrome lettering, gold wings, star, "CARRIER STRIKE" ribbon) —
> deliberately not the film's logo, which is a third-party trademark and the site is public.
> Music is replaced by original 80s aviation-anthem style tracks (menu anthem, driving mission
> rock, boss, fanfares) — style only, no quoted melodies. New SFX `voice`, `radioVoice`,
> `radioClick` drive the talking characters (06). The start menu gains a language button (07).
> The save key stays `topgun.save.v1` so existing progress survives the rename.

## Purpose

The engine every other feature runs on: a fixed-timestep loop drawing to one
letterboxed canvas, a unified input layer (keyboard, mouse/touch, gamepad), a
scene manager with fade transitions, synthesized audio, and a validated
localStorage save. No game-engine dependency — plain TypeScript + Canvas 2D.

## Architecture

```
index.html ─ <canvas id="game">
src/main.ts
  ├─ core/canvas.ts   viewport: logical 1280×720, scaled to window, DPR-sharp, letterboxed
  ├─ core/input.ts    Input: actions (held / pressed this frame), pointer in logical coords
  ├─ core/loop.ts     fixed 60 Hz update with accumulator, render every rAF
  ├─ core/scene.ts    Scene interface + SceneManager (go(), fade in/out)
  ├─ core/audio.ts    WebAudio SFX synthesized on the fly (no asset files)
  ├─ core/music.ts    procedural synth-rock loop per mood (menu / mission / boss)
  ├─ game/save.ts     SaveData type, defaults, parseSave (runtime validation), persist
  ├─ game/state.ts    GameContext passed to scenes: save, input, audio, manager
  └─ scenes/title.ts  title screen: New Game / Continue / Controls / Sound
```

Logical resolution is **1280×720**. All game code draws in logical units;
`canvas.ts` applies `scale = min(w/1280, h/720)` plus centering offset and the
device pixel ratio. Pointer coordinates are mapped back into logical space.

Loop: `update(1/60)` runs 0–5 times per frame from an accumulator (spiral-of-death
guard drops excess time), `render()` once per animation frame. When the tab is
hidden the loop pauses and the accumulator resets.

## Data Model

Per-pilot progress (`SaveData`), stored inside the profile store `toprun.profiles.v1` (doc 08).
The pre-profiles single save `localStorage["topgun.save.v1"]` is only read once for migration:

| Field | Type | Rule |
|-------|------|------|
| version | `1` | other versions → reset to defaults |
| money | integer ≥ 0 | clamped |
| ownedPlanes | PlaneId[] | always contains `f16`; unknown ids dropped |
| selectedPlane | PlaneId | must be owned, else `f16` |
| gunLevel | 1–5 | clamped |
| ownedSecondaries | SecondaryId[] | unknown ids dropped |
| loadout | Record<PlaneId, SecondaryId[]> | only owned secondaries, length ≤ plane hardpoints, plane restrictions honoured |
| equipment | {armor,engine,flares: 0–3, ecm,damageControl,magnet: 0–1} | clamped |
| progress | Record<missionId, {stars: 0–3}> | presence = cleared; unknown ids dropped |
| ~~settings~~ | moved | since 2026-10-25 settings are device-wide in the profile store (doc 08, `src/game/settings.ts`) |

Defaults: money 2,000, F-16 owned and selected, gun level 1, nothing else.

## API Endpoints

None — the game is fully client-side. (Online leaderboard/cloud save would be a new feature.)

## Business Rules

- **Input actions**: `up, down, left, right, fire, secondary, switchWeapon, flare, special, confirm, back, pause, mute, skip, hangar`.
  - Keyboard: arrows/WASD move; Space/J fire (Space is also confirm); Shift/K secondary; Q/L switch; F flare;
    E special; Enter confirm; Esc/Backspace back (Esc also pauses); P pause; M mute; S skip launch (also down);
    H hangar.
  - Gamepad (standard mapping): left stick/d-pad move; A fire+confirm; B secondary+back; X flare; Y special; LB/RB switch; Start pause.
  - Touch: drag anywhere in the playfield moves the plane relatively; autofire on while touching;
    on-screen buttons for secondary / switch / flare / special / pause (rendered by the mission HUD).
  - `pressed(action)` is true only on the first update tick after the key goes down.
- **Audio** starts only after the first user gesture (browser autoplay policy). Mute state and
  volumes persist in `settings`.
- **Save**: every read from localStorage passes through `parseSave(raw: unknown)`, which never
  trusts the JSON shape. Corrupt / unparseable data → defaults + console warning, never a crash.
  `persistSave` swallows quota/privacy-mode errors (game keeps running with in-memory state).
- **Scene transitions** fade to black over 0.25 s, swap scene, fade in; input pressed-state is
  cleared on swap so a key press can't leak into the next scene.
- **Pause**: losing window focus or tab visibility pauses gameplay scenes.
- Title menu: CONTINUE (→ pilot list) · NEW PILOT · CONTROLS · SOUND · AUTOFIRE · LANGUAGE (07, 08).
- Title screen: "Continue" only shown when a save with progress or purchases exists; "New Game"
  with an existing save asks for confirmation before overwriting.

- **Dev test hook**: in `npm run dev` only, `window.__toprun` exposes `step(frames)`, `go(route)`,
  `scene()` and `game` so the game can be driven from the browser console or automation while the tab is
  in the background. `import.meta.env.DEV` strips it from production builds.

## Data Flow

Greenfield. Save flows: localStorage → `parseSave` → `GameContext.save` (in memory) → scenes
mutate via pure functions (feature 02) → `persistSave` → localStorage.

## Dependencies

None (root feature).

## Security

Untrusted input: the localStorage blob (user-editable via devtools; may be corrupted by other
versions). `parseSave` validates every field type, clamps numbers, drops unknown ids, and never
uses `eval`/`Function`. Cheating via devtools is accepted (single-player, no server). No network
calls, no cookies, no third-party scripts.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
