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
  - src/game/joystick.ts
  - src/game/joystick-setup.ts
  - src/scenes/joystick-setup.ts
  - src/render/joystick-panel.ts
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
  - tests/unit/joystick.test.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [canvas, game-loop, input, gamepad, joystick, hotas, flight-stick, touch, webaudio, save-game, scenes]
path: Game/Engine
integration_contracts:
  - function: "loadSave()/persistSave(save)"
    when: "every scene that changes money, ownership, loadout or progress must persist through persistSave — never write localStorage directly"
  - function: "SceneManager.go(scene)"
    when: "all scene transitions go through the manager so fades and input resets happen"
satisfies_contracts: []
known_issues:
  - "Joystick support verified with unit tests and a simulated controller (navigator.getGamepads stub) only; not yet tried with a physical flight stick / HOTAS"
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
  ├─ core/gamepad.ts  reads controllers (raw frames) and applies padInputs() per controller
  ├─ game/joystick.ts         JoyProfile, parseJoyProfile, padInputs (mapping rules, pure)
  ├─ game/joystick-setup.ts   setup step machine: detect axes/buttons from raw frames (pure)
  ├─ scenes/joystick-setup.ts JOYSTICK setup screen; render/joystick-panel.ts draws it
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
  - Joystick / HOTAS: see **Joystick** below.
  - Touch: drag anywhere in the playfield moves the plane relatively; autofire on while touching;
    on-screen buttons for secondary / switch / flare / special / pause (rendered by the mission HUD).
  - `pressed(action)` is true only on the first update tick after the key goes down.
- **Joystick / HOTAS** (USB flight sticks via the Gamepad API, 2026-10-25):
  - Every connected controller is read each tick. Which mapping applies to it:
    1. the saved **joystick profile** if any of its bindings names this device (`pad.id`);
    2. else the **standard gamepad** mapping above when the browser reports `mapping: 'standard'`;
    3. else the **default joystick** mapping: axis 0 = left/right, axis 1 = forward/back, button 0
       (trigger) = fire, 1 = missile, 2 = flare, 3 = special, 4 = switch, 5 = pause, no throttle.
  - Joystick actions → game actions: **fire** → fire + confirm, **missile** → secondary + back,
    **flare**, **special** (E: lock & launch on the carrier), **switch** → switchWeapon, **pause**.
    The stick also drives menu up/down/left/right (digital threshold 0.55 like the gamepad stick).
  - Stick axes use a 0.12 dead zone (flight sticks centre precisely; the gamepad keeps 0.3).
    Forward = up the screen, back = down.
  - **Throttle axis** (optional): normalised to 0 = idle … 1 = full. It only matters on the carrier
    (doc 04). A controller with a joystick mapping sets the input device to `joystick` (hint texts).
  - **Profile**: one per browser, stored in the device settings (`settings.joystick`, doc 08). Each
    binding records its device id and index (`{pad, index, invert?}`), so split HOTAS sets whose
    throttle is a separate USB device work. `null` = no profile. Parsing never trusts the shape:
    ids ≤ 200 chars, indices 0–63, a broken binding drops the whole profile (back to defaults).
  - **JOYSTICK setup** (start menu item → setup screen). The browser only reveals a controller after
    one of its buttons is pressed, so the screen first asks for that. Then step by step, reading the raw
    controllers (game actions from controllers are suspended while the screen is open):
    1. "Push the stick fully RIGHT" → the axis that moved most (≥ 0.3 from where it was when the step
       started) is X, calibrated to that rest point; it is inverted if it moved negative.
    2. "Pull the stick fully BACK" → same for Y (X excluded); back must read positive.
    3. "Pull the TRIGGER" → the first button that goes down is fire.
    4. "Throttle: move it end to end, leave it at FULL, pull the trigger" → on the trigger, the
       non-stick axis with the largest travel (≥ 0.8) during the step is the throttle; the end it rests
       at is full. No such axis → "no throttle movement detected", step stays.
    5–9. "Press the button for MISSILE / FLARE / SPECIAL / SWITCH / PAUSE".
    A button already used in this setup is refused ("already used for …"). **S / SKIP** skips a step
    (stick axes keep the default, throttle and buttons stay unbound), **Esc / CANCEL** leaves without
    saving, **Del / CLEAR** deletes the saved profile. After PAUSE the profile is saved and the screen
    shows a summary for 2 s, then returns to the title.
  - The live panel on the setup screen shows every controller's axes and buttons so the player can
    see the stick is detected.
  - **Axis calibration** (bug fix 2026-10-25: a stick whose axes report 0…1 resting at 0.5 was never
    detected — a full push only moved 0.5 < 0.6 — and in game "left" read as 0 = no movement):
    stick axes are normalised as `clamp((raw − center) / span, −1, 1)` (inverted if needed) before the
    dead zone. The setup records `center` = the axis value at rest when the step started and
    `span = max(0.2, 1 − |center|)`, and accepts a stick move of **≥ 0.3** (was 0.6). A controller
    without a saved profile and without the standard mapping takes the first values it reports
    (the stick at rest when it wakes up) as the centre of axes 0/1. Saved profiles may carry
    `center` (−1…1) and `span` (0.2…2) per axis; missing = 0 / 1 (old profiles keep working).
- **Audio** starts only after the first user gesture (browser autoplay policy). Mute state and
  volumes persist in `settings`.
- **Save**: every read from localStorage passes through `parseSave(raw: unknown)`, which never
  trusts the JSON shape. Corrupt / unparseable data → defaults + console warning, never a crash.
  `persistSave` swallows quota/privacy-mode errors (game keeps running with in-memory state).
- **Scene transitions** fade to black over 0.25 s, swap scene, fade in; input pressed-state is
  cleared on swap so a key press can't leak into the next scene.
- **Pause**: losing window focus or tab visibility pauses gameplay scenes.
- Title menu: CONTINUE (→ pilot list) · NEW PILOT · CONTROLS · JOYSTICK · SOUND · AUTOFIRE · LANGUAGE (07, 08).
  The CONTROLS sheet gets a joystick line (stick moves, trigger fires, set buttons under JOYSTICK).
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
