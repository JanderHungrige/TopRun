---
id: 18-carrier-landing
title: Carrier Landing - Three Night Passes to a Trap, Seen From the Cockpit
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core, 15-air-refuelling]
source_files:
  - src/game/minigames/landing.ts
  - src/game/minigames/landing-flight.ts
  - src/game/minigames/landing-deck.ts
  - src/game/minigames/landing-grade.ts
  - src/game/minigames/landing-lso.ts
  - src/scenes/minigames/landing.ts
  - src/scenes/minigames/landing-radio.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/landing-view.ts
  - src/render/minigames/landing-sky.ts
  - src/render/minigames/landing-carrier.ts
  - src/render/minigames/landing-lights.ts
  - src/render/minigames/landing-lens.ts
  - src/render/minigames/landing-hud.ts
  - src/render/minigames/landing-cockpit.ts
  - src/render/minigames/landing-panel.ts
  - src/render/minigames/landing-icon.ts
  - src/i18n/minigames/landing.ts
routes: []
models: []
test_files:
  - tests/unit/landing.test.ts
  - tests/unit/landing-pilots.test.ts
  - tests/unit/landing-pilot.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, carrier-landing, night, cockpit-view, meatball, lso, arrested-landing, medals]
path: Game/Minigames/CarrierLanding
initiative: off-duty-minigames
wave: off-duty-minigames-wave-3
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "LANDING is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
satisfies_contracts: []
known_issues:
  - "Slow pilots are mostly waved off (low in close, burble); simulated novice 42 % of passes — watch in human playtests"
  - "Keyboard players hold on-speed by tapping power (approach power is a little slow); a throttle lever is much smoother"
security_read_sites: []
sister_projects: []
---

# 18 — Carrier Landing

## Purpose

Minigame 9 of the off-duty initiative (unlocks after mission 21, doc 10). A **night carrier landing seen
from the cockpit**: dark sea and starry sky, the carrier ahead only as lights — the deck-edge lights and the
centreline of the angled landing area, the drop lights down the stern, the optical landing aid ("the
meatball") on the left of the deck. Fly the ball, stay lined up, hold on-speed and catch a wire. Three passes;
the landing signal officer ("Paddles") talks you down and grades every pass. Score = total LSO points
(0–12). For fun only (best score and medal per pilot, doc 10). The carrier is an original, unnamed design:
no hull number, no national markings.

## Architecture

```
game/minigames/landing-deck.ts   deck geometry (wires, target, lens, landing area), seeded deck pitch / heave,
                                 gusts, burble, the per-pass sea state and start offsets — pure
game/minigames/landing-flight.ts rules table, jet state, one tick of flying, ball, AoA indexer — pure
game/minigames/landing-grade.ts  approach statistics per segment, grade of a pass, points, main fault — pure
game/minigames/landing-lso.ts    which call Paddles makes this tick (priorities, cooldowns) — pure
game/minigames/landing.ts        LandingState + stepLanding: wave-off / touchdown / wire / bolter, rollout,
                                 go-around, grade card, pass sequence, score — pure, tested
scenes/minigames/landing.ts      LANDING: MinigameModule; LandingRound maps input, steps the rules, sounds,
                                 popups, shake, camera smoothing, holds the end banner
scenes/minigames/landing-radio   Paddles on the radio: typed lines with radio clicks and voice syllables
render/minigames/landing-view    camera (yaw / pitch / roll pinhole), near-plane clipping of polygons and lines
render/minigames/landing-sky     night sky, stars, crescent moon, sea, moon glitter, horizon haze
render/minigames/landing-carrier hull, flight deck, landing-area paint and wires, island, wake (dim shapes)
render/minigames/landing-lights  every light on the ship (edge, centreline, drop, ramp, island, mast) + escort
render/minigames/landing-lens    the lens on the deck in 3D and the magnified BALL repeater with LINE-UP bar
render/minigames/landing-hud     HUD: velocity vector, horizon and −3.5° glide-slope bar, range; AoA indexer
render/minigames/landing-cockpit canopy bow, HUD combiner glass, glareshield at night
render/minigames/landing-panel   Paddles radio strip, LSO board (greenie board), grade card, popups, banner
render/minigames/landing-icon    hub / offer card icon (lens with the ball, centreline lights)
i18n/minigames/landing.ts        EN + DE strings (gameText)
```

### Frame and units
Metres and seconds in the **landing frame**, which moves with the ship: x right, y up (0 = flight-deck level
at rest), z forward along the landing-area centreline, 0 = the ramp (the stern edge of the landing area),
negative behind the ship. The jet's state is the position of its **hook point** `(x, y, z)`; the pilot's eye is
4.2 m above and 10 m ahead of it. Angles in degrees in this doc (radians in code).

## Business Rules

### Round
- **3 passes.** Each pass starts **2,222 m (1.2 nm)** behind the touchdown target, near the glide path but
  off it (seeded per pass): ball ±(1.0 … 2.2) balls, line-up ±(6 … 18) m, speed ±(0.5 … 2.5) m/s, flight
  path −3.5° ± 0.3°. At on-speed closure a pass takes ≈ 26 s to touchdown.
- After the outcome (trap rollout / bolter / wave-off, **2.6 s**) the **grade card** shows for 3.6 s (fire /
  confirm / tap skips it after 1 s), then the next pass starts. After the third card the phase is `over`
  (the scene holds a "RECOVERY COMPLETE — n POINTS" banner 2.4 s, then hands the score to the shell).
- Score = sum of the pass points (0–12). `higherIsBetter: true`.

### The ship
- Wires at **z = 48 / 60 / 72 / 84 m** (1–4). Glide-slope target (where the hook path meets the deck)
  **z = 66 m**, between wires 2 and 3 — on the glide path you catch the **3-wire**.
- Landing area ±11 m wide, 210 m long; the lens stands 20 m left of the centreline at z = 66.
- The angled deck is 9° off the ship's axis, so the landing area **drifts right at 1.0 m/s**: with the stick
  neutral the jet ends up left of the centreline ("Right for line-up").
- **Deck motion** per pass (seeded periods and phases): pitch about a point 120 m forward of the ramp
  (period 8.5–10 s) and heave (10–12.5 s). Amplitudes pass 1 / 2 / 3: pitch 0.3° / 0.6° / 0.9°, heave
  0.2 / 0.4 / 0.6 m. Deck height `deckY(z) = heave + (z − 120) · sin(pitch)`.
- **Gusts**: seeded smooth sines on the vertical and lateral velocity, amplitude 0.35 / 0.55 / 0.75 m/s.
- **Burble** (the ship's air wake): a smooth sink between 450 m and 60 m before the ramp, peak
  0.3 / 0.45 / 0.6 m/s (`sin²` profile) — a touch of "Power" in close.

### Flying the jet (per fixed 1/60 s tick)
- Input `{ x, y, throttle, next }`: x / y −1 … 1 (right / up = +), throttle 0 … 1.
  Keys: arrows / WASD fly, fire (Space / J / pad A) held = throttle 1, otherwise the joystick throttle lever
  or **0.35** ("approach power", a little below what on-speed needs). Touch / mouse: drag on the left 60 %
  (70 px = full deflection, both axes), hold on the right 40 % = throttle 1.
- **Glide path with inertia**: the flight-path rate eases towards `y × 1.5 °/s` (k = 4 /s); the flight path
  angle γ integrates it (−9° … +6°). Neutral stick holds the current path.
- **Line-up**: lateral air velocity eases towards `x × 4 m/s` (k = 1.8 /s); relative to the deck minus the
  1.0 m/s drift, plus gusts.
- **Speed** (error `dv` against on-speed 86 m/s closure): engine eases towards the throttle (k = 1.5 /s);
  `dv' = 6 · (engine − 0.5) − 0.3 · dv − g · (γ + 3.5°)` (climbing costs speed, diving gains it). Full power
  settles ≈ 19 kt fast, approach power ≈ 6 kt slow.
- Vertical speed `= (86 + dv) · sin γ + 0.1 · dv + gust`: slow sinks, fast balloons.
- **Ball** = glide-slope error seen from the target: `atan2(y − deckY(66), 66 − z) − 3.5°`, in balls of
  **0.25°**; frozen in the last 20 m. Shown up to ±3.2 balls; **red below −2 balls**.
- **AoA indexer** from `dv`: |dv| ≤ 1.3 m/s on speed (donut), ≤ 2.6 m/s slightly slow / fast (donut +
  chevron), beyond slow (top chevron) / fast (bottom chevron).

### Outcomes
- **Wave-off** (LSO, 0 points): inside the last **320 m** before the ramp when the ball is red or the hook
  would clear the ramp by less than 1 m on the current path (`low`), or the jet is more than **6 m** off the
  centreline (`lineup`); anywhere from 1,500 m in when the ball is below −4 (`low`). The jet then pulls up at
  full power automatically (the hook never touches the ship — no crash scene).
- **Touchdown** when the hook reaches the deck surface over the landing area (z ≥ 0):
  - more than **6 m/s (≈ 12 kt) fast** → **bolter** (`fast`, hook skip);
  - touchdown beyond the 4-wire, or still airborne 40 m past it → **bolter** (`long`);
  - otherwise the hook catches the **first wire at or past the touchdown point** → **trap**.
- Trap rollout: deceleration **38 m/s²** (≈ 4 g) to a stop, ≈ 2.3 s and ≈ 100 m.
- Bolter: full power, the jet climbs off the angled deck.

### Grade (Paddles)
- Sampled every tick from **1,100 m before the ramp** to the touchdown in three segments: **middle**
  (−1,100 … −500 m), **in close** (−500 … −150 m), **at the ramp** (−150 m … touchdown).
- Normalised deviations: glide slope = balls / 0.6, line-up = x / (1.2 + 0.0048 · |z|) m (6.5 m at the
  start of the middle, 1.2 m at the ramp), speed = dv in kt / 5. Quality `q` = the largest of the three
  time-weighted mean |values| over the whole window.
- **OK (4)**: q ≤ 1 and the 3-wire. **Fair (3)**: q ≤ 1 with the 2- or 4-wire, or q ≤ 1.8 with wires 2–4.
  **No grade (2)**: any other trap (incl. the 1-wire). **Bolter (1)**. **Wave-off (0)**.
- The comment names the worst segment mean (signed): "a little high in the middle", "slow at the ramp",
  "lined up left in close"… ("a little" up to 1.6, none below 0.7 → "steady all the way"), plus the wire;
  bolters and wave-offs name their reason.

### Paddles on the radio (`lsoCall`)
- During the approach between 1,400 m out and the ramp, one call at most every 1.6 s, the same call at
  most every 3.5 s, in this priority: **Roger ball** (once, at 1,400 m) · **Power** (ball < −1 or slow) ·
  **You're high** (ball > 1.2) · **Right / Left for line-up** (off by 0.8 × the line-up tolerance) ·
  **You're fast** · **Easy with it** (flight-path rate ≥ 1 °/s while the ball is within 1.5) ·
  **Looking good** (once, after 4 s steady).
- Events interrupt: **Wave off, wave off!**, **Bolter, bolter!**, "Welcome aboard" after an OK trap.

### Medals
- **bronze 6 · silver 9 · gold 11.** Gold = at most one Fair in three passes (e.g. OK · OK · Fair); silver
  allows a few Fairs or one bolter; bronze is three trapped passes of any grade.

### Presentation
- Cockpit view: pinhole camera at the eye, focal length 1,250 px, boresight at (640, 255) — on the glide path
  the deck sits at y ≈ 430 inside the HUD; yaw = the jet's heading (air velocity), pitch = γ + AoA (8.1° on
  speed, +0.35° per m/s slow), roll with lateral acceleration (≤ 0.3 rad). Polygons and lines are clipped at
  the near plane so the deck draws correctly during the rollout. On deck the camera follows the deck pitch.
- Night scene: sky gradient with seeded twinkling stars and a crescent moon, its glitter path on the sea, a
  faint horizon haze, the wake trailing behind the ship along its own axis, an escort's running lights.
- Ship lights in 3D with glow: landing-area edge lights, centreline lights, the drop line down the stern,
  ramp lights, island and mast lights. The lens shows the green datum arms, the amber ball (red when low) and
  the red wave-off lights flashing on a wave-off.
- HUD (green): velocity vector, horizon and the −3.5° glide-slope bar, range in nm; AoA indexer beside the
  HUD; magnified **BALL** repeater with a **LINE-UP** bar on the left; Paddles radio strip top left; the
  **LSO board** (greenie board) top right fills with each pass's grade colour and wire.
- Trap: the hook thump, shake, the view pitches down and the deck lights stop; "3-WIRE!" popup. Bolter /
  wave-off: popup, full power, the lights slide away below.
- Sound: `setJet(0.25 + 0.5 × engine)` (full on touchdown, idle after the trap stops, 0 on dispose);
  `radioClick` + `radioVoice` for Paddles; trap `explosionSmall` + `hit` + `catapult`; bolter
  `explosionSmall` + `uiBack`; wave-off `denied`; grade card `pickup` (OK) / `uiSelect` / `uiBack`.

### Playtest (medal tuning, 2026-10-25)
- **Simulated keyboard pilots** (`tests/unit/landing-pilot.ts`): digital keys only, deciding every `every` s
  on a picture `delay` s old; they see only the ball, the line-up and the AoA indexer, misjudge the ball by a
  drifting ±`noise` balls (line-up ±4 m per ball), ask for a ball rate of `gain` × ball and anticipate the
  pitch inertia `lead` s ahead; power held while the indexer shows slow.
  | Pilot | delay / every / noise / gain / lead | 30 rounds: min – median – max | medals |
  |---|---|---|---|
  | ACE | 0.15 / 0.08 / 0.15 / 0.9 / 0.4 | 10 – 12 – 12 | gold 27, silver 3 |
  | GOOD | 0.20 / 0.10 / 0.25 / 0.8 / 0.35 | 10 – 11 – 12 | gold 28, silver 2 |
  | AVERAGE | 0.25 / 0.13 / 0.35 / 0.7 / 0.3 | 8 – 11 – 12 | gold 17, silver 12, bronze 1 |
  | ROOKIE | 0.32 / 0.16 / 0.5 / 0.6 / 0.2 | 3 – 8 – 11 | gold 4, silver 10, bronze 13, none 3 |
  | NOVICE | 0.42 / 0.20 / 0.75 / 0.5 / 0.1 | 0 – 3 – 7 | bronze 5, none 25 |
  Pass outcomes (90 passes each): ACE 72 OK / 18 Fair; AVERAGE 53 / 34 / 2 bolters / 1 wave-off; ROOKIE 22 /
  42 / 9 no grade / 5 bolters / 12 wave-offs; NOVICE 15 Fair / 22 no grade / 15 bolters / 38 wave-offs.
- First draft (pitch 0.2 / 0.45 / 0.7°, heave 0.15 / 0.3 / 0.45 m, gusts 0.25 / 0.4 / 0.55 m/s, no burble,
  glide-slope unit 1 ball, line-up 1.5 + 0.006·|z|): ACE, GOOD and AVERAGE all scored like aces (AVERAGE 18 of 20
  gold) because every bot caught the 3-wire and the means stayed far inside the tolerances; the speed term was
  the same for all (keyboard pulsing). Fix: stronger later passes plus the burble in close (spreads the
  touchdown for slow reactions: |touchdown − 66 m| ACE 3.2 m, AVERAGE 5.1 m, ROOKIE 7.9 m) and tighter
  glide-slope / line-up units (0.6 ball, 0.8 × line-up), speed unchanged. Then gold needs near-perfect passes.
- **Browser** (dev server, `window.__toprun`, an in-page bot on the real keyboard path): three passes at
  ≈ 26 s each, OK 3-wire · OK 3-wire · (deliberately two balls high) No grade "High in close · 3-wire" →
  10 points, silver, new best; a staged high, flat pass bolters (popup, urgent radio, climb-away); a staged low
  pass is waved off at 214 m with the red ball and flashing wave-off lights; Space skips the grade card after
  1 s; touch: hold right = power, drag left = stick, tap skips the card; DE texts on the rules card, HUD,
  radio and grade card.

## Data Flow

Greenfield: writes nothing itself; the shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 01 (input incl. joystick throttle, audio), 06 (typewriter
timing for the radio lines).

## Security

None (no persisted data of its own).

## Known Issues

- Slow pilots are mostly waved off (low in close, where the burble sinks the jet): the simulated novice is
  waved off on 42 % of passes. Intentional (the LSO never lets a pass hit the ramp), but watch it in human
  playtests; the burble strength is the first knob.
- Keyboard players hold on-speed by tapping power (approach power settles ≈ 6 kt slow); a joystick throttle
  lever makes it much smoother.
- A constant off-centre ball converges on the target (the ball is an angle from the lens), so being high
  costs grade points but only a flat, high path in close bolters.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
