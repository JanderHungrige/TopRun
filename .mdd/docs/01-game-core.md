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
  - src/core/audio-mix.ts
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
  - tests/unit/audio-mix.test.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [canvas, game-loop, input, gamepad, joystick, hotas, flight-stick, touch, webaudio, sound-toggles, sfx-bass, save-game, scenes]
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
  - "Synthesized SFX/music mix has not been tuned by ear yet — the 2026-10-25 bass pass was measured offline (OfflineAudioContext band energies and peaks), not listened to on real speakers"
  - "Docker image verified on 2026-10-25 with substitute base images (node:22-alpine, nginx:alpine) because Docker Desktop could not pull the pinned node:24.19.0-alpine / nginx-unprivileged:1.30.6-alpine locally; the first build on the server pulls the pinned images"
security_read_sites:
  - src/game/save.ts (localStorage read → parseSave runtime validation)
sister_projects: []
---

# 01 — Game Core

> **Sound and music switches + more bass (2026-10-25, owner):** "Separate sound and music on/off in
> the main menu. More bass to the sound effects." The title menu gets two independent toggles,
> **SOUND** (effects) and **MUSIC**, replacing the single mute flag (`settings.sfxOn` / `settings.musicOn`,
> migration below). Cannon, missile/rocket launches, explosions, hits and other impacts get a pitched-down
> sine "thump" layer and run through a low-shelf impact bus; a soft safety ceiling after the master
> compressor keeps big explosion stacks from clipping. See **Audio** under Business Rules.
>
> **Renamed back to TopGun (2026-10-25, owner):** a fun game for friends; the title, logo lettering,
> page title and finale lines say TopGun again. The badge and music stay original designs. URL, repo,
> container and save keys keep `toprun` so no pilot loses progress.
>
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
  ├─ core/audio.ts    WebAudio SFX synthesized on the fly (no asset files), bus graph
  ├─ core/audio-mix.ts bus gains from the settings, impact shelf, master limiter + ceiling curve (pure)
  ├─ core/sfx-recipes.ts layer table per SFX (tones, filtered noise, bass thumps)
  ├─ core/music.ts    procedural synth-rock loop per mood (menu / mission / boss)
  ├─ game/save.ts     SaveData type, defaults, parseSave (runtime validation), persist
  ├─ game/state.ts    GameContext passed to scenes: save, input, audio, manager
  └─ scenes/title.ts  title screen: Continue / New Pilot / Controls / Joystick / Sound / Music / Autofire / Language
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
| gunLevel | 1–8 (6–8 with map 2, doc 37) | clamped |
| gun2Level | 0–5 (doc 37; missing = 0) | clamped |
| ownedSecondaries | SecondaryId[] | unknown ids dropped |
| twinSecondaries | SecondaryId[] (doc 37) | unknown or not-owned ids dropped |
| loadout | Record<PlaneId, SecondaryId[]> | only owned secondaries, length ≤ plane hardpoints, plane restrictions honoured |
| equipment | {armor,engine,flares: 0–3, ecm,damageControl,magnet: 0–1} | clamped |
| progress | Record<missionId, {stars: 0–3}> | presence = cleared; unknown ids dropped |
| ~~settings~~ | moved | since 2026-10-25 settings are device-wide in the profile store (doc 08, `src/game/settings.ts`) |

Defaults: money 2,000, F-16 owned and selected, gun level 1, nothing else.

## API Endpoints

None — the game is fully client-side. (Online leaderboard/cloud save would be a new feature.)

## Business Rules

- **Input actions**: `up, down, left, right, fire, secondary (air weapon), groundWeapon, weaponSwitch, flare, special, confirm, back, pause, mute, skip, hangar`.
  (2026-10-25, owner: weapon switching was too hectic — two weapon keys instead of fire + switch, doc 05.
  2026-10-27, owner: an optional, clearly shown `weaponSwitch` for the ground weapon on top, doc 05.)
  - Keyboard: arrows/WASD move; Space/J fire (Space is also confirm); R/K air weapon; Q/L ground weapon; X/O switch ground weapon; F flare;
    E special; Enter confirm; Esc/Backspace back (Esc also pauses); P pause; M mute; S skip launch (also down);
    H hangar.
    **No Shift key** (2026-10-25): Windows opens its Sticky Keys prompt ("Einrastfunktion") when Shift
    is pressed five times in a row, and hectic players spam the missile key — a web page cannot
    suppress that system dialog, so the missile moved from Shift to **R** (K stays). Ctrl is not used
    either (Ctrl+W etc. would close the tab).
  - Gamepad (standard mapping): left stick/d-pad move; A fire+confirm; B air weapon+back; X flare; Y special; RB ground weapon; LB switch ground weapon; Start pause.
  - Joystick / HOTAS: see **Joystick** below.
  - Touch: drag anywhere in the playfield moves the plane relatively; autofire on while touching;
    on-screen buttons for air / ground / flare / special / pause (the cockpit consoles, doc 05); a tap on
    the STORES screen switches the ground weapon.
  - `pressed(action)` is true only on the first update tick after the key goes down.
- **Joystick / HOTAS** (USB flight sticks via the Gamepad API, 2026-10-25):
  - Every connected controller is read each tick. Which mapping applies to it:
    1. the saved **joystick profile** if any of its bindings names this device (`pad.id`);
    2. else the **standard gamepad** mapping above when the browser reports `mapping: 'standard'`;
    3. else the **default joystick** mapping: axis 0 = left/right, axis 1 = forward/back, button 0
       (trigger) = fire, 1 = missile, 2 = flare, 3 = special, 4 = switch, 5 = pause, 6 = cycle, no throttle.
  - Joystick actions → game actions: **fire** → fire + confirm, **missile** → secondary (air weapon) + back,
    **flare**, **special** (E: lock & launch on the carrier), **switch** → groundWeapon (the ground-weapon
    key; the profile key name stays `switch` so saved setups keep working), **cycle** → weaponSwitch
    (switch ground weapon, 2026-10-27; setups saved before have none until the setup is run again), **pause**.
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
    5–10. "Press the button for MISSILE / FLARE / SPECIAL / GROUND WEAPON / SWITCH GROUND WEAPON / PAUSE".
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
- **Audio** starts only after the first user gesture (browser autoplay policy). Volumes and the two
  switches persist in the device settings (doc 08) and apply live through `setSettings()` — no reload.
  - **Switches** (2026-10-25): `sfxOn` (title **SOUND: ON/OFF**, de **TON: AN/AUS**) and `musicOn`
    (title **MUSIC: ON/OFF**, de **MUSIK: AN/AUS**), both default on. They replace the old single
    `muted` flag. **Migration** in `parseSettings`: a stored boolean `sfxOn` / `musicOn` wins; a missing
    or non-boolean one falls back to the legacy flag — `muted: true` → that switch off, anything else
    (absent, `false`, garbage) → on. `muted` is never written again.
  - **M key** (`mute` action, CONTROLS sheet "Mute"): `toggleAllSound()` — if either switch is on, both
    go off; if both are off, both go on. The title menu rebuilds its labels whenever the settings
    change, so pressing M there updates SOUND / MUSIC at once.
  - **Buses**: `busGains(levels)` → sfx bus = `sfxOn ? sfx × 0.8 : 0`, music bus =
    `musicOn ? music × 0.42 : 0` (non-finite volume → 0, clamped 0–1). The gains glide (time constant
    40 ms) so switching never clicks. Sound off: `play()` drops new effects and the jet loop (sfx bus)
    falls silent. Music off: only the music bus goes to 0; the music scheduler keeps its place in the
    song but stops creating notes while off, so switching back on resumes the current song at the
    current bar (no burst, no restart). The Piano Bar deck (doc 23) also plays on the music bus, so
    MUSIC OFF silences that whole deck (band, piano, crowd); only its `audio.play()` effects remain.
  - **Impact bass**: heavy effects (`gun, missile, rocket, bombDrop, explosionSmall, explosionLarge,
    explosionHuge, hit, playerHit, catapult, special, splash, enemyMissile`) play into an **impact bus**
    — a low shelf (+4 dB below ~160 Hz) feeding the sfx bus. Their recipes add a sine **thump** layer:
    the pitch drops exponentially from ~110–240 Hz to ~36–80 Hz within 20–180 ms (`sw`, sweep time), then
    the tail decays; the big blasts' pitch floors moved up from 20–28 Hz (inaudible, only eating
    headroom) to 32–45 Hz. Thumps (from → to Hz, sweep s, decay s, level): gun 240→70/0.03/0.06/0.26 ·
    hit 200→80/0.02/0.035/0.16 · rocket 170→65/0.04/0.07/0.22 · bombDrop 160→70/0.03/0.06/0.2 ·
    missile 150→55/0.1/0.3/0.26 (+ low-pass noise body 500→140 Hz, 0.16) · enemyMissile 120→55/0.08/0.2/0.09 ·
    explosionSmall 120→52/0.07/0.26/0.42 · explosionLarge 150→45/0.1/0.55/0.7 (+ triangle 100→48 and a
    300→80 Hz noise rumble) · explosionHuge 130→36/0.18/1.2/0.9 and 110→40 at +0.35 s · playerHit
    150→50/0.06/0.22/0.45 · catapult 130→42 launch and 140→55 shuttle clank · special 140→45 · splash 220→60.
    Measured offline (pitch 1, incl. shelf) vs. before: 100–300 Hz energy gun +30 dB, hit +35, missile +15,
    rocket +10, explosionSmall +4, explosionLarge +3, explosionHuge +4, playerHit +7; total energy rises
    0.4–10 dB, almost all of it below 300 Hz. UI sounds (`uiMove, uiSelect, uiBack, pickup, cash, powerup, buy, radioClick`)
    stay on the plain sfx bus and have no layer below 200 Hz (the lowest is `powerup`'s 200 → 1600 Hz
    riser; clicks start at 440 Hz) — no boomy clicks.
  - **Master chain**: both buses → master → compressor (threshold −8 dB, knee 6, ratio 12, attack 3 ms,
    release 250 ms) → safety **ceiling** (wave shaper, 2× oversampled): transparent up to ±0.8, above it
    a tanh knee that approaches ±1 for inputs up to 2× full scale, so stacked explosions saturate softly
    instead of hard-clipping. Worst-case check (3 s: gun stream, 14 small + 4 large + 2 huge explosions,
    40 hits, 2 missiles, player hit, special, loud music bed, full volume): compressor alone peaks at 1.03
    (clips); with the ceiling the output peaks at 0.98 and spends ~10 ms above 0.8.
- **Save**: every read from localStorage passes through `parseSave(raw: unknown)`, which never
  trusts the JSON shape. Corrupt / unparseable data → defaults + console warning, never a crash.
  `persistSave` swallows quota/privacy-mode errors (game keeps running with in-memory state).
- **Scene transitions** fade to black over 0.25 s, swap scene, fade in; input pressed-state is
  cleared on swap so a key press can't leak into the next scene.
- **Pause**: losing window focus or tab visibility pauses gameplay scenes.
- Title menu: CONTINUE (→ pilot list) · NEW PILOT · CONTROLS · JOYSTICK · SOUND · MUSIC · AUTOFIRE · LANGUAGE (07, 08).
  The column is bottom-anchored at y 686 (above the hint line) and never starts above y 332 (below the
  tagline): row pitch = `min(46, floor(360 / n))`, button height = pitch − 6 — 7 items keep the 46 px rows,
  8 → 45 px, 9 (with a future LADDER item) → 40 px rows with 34 px buttons.
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
