---
id: 15-air-refuelling
title: Air Refuelling - Probe and Drogue Behind a Tanker, Seen From the Cockpit
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core]
source_files:
  - src/game/minigames/refuel.ts
  - src/game/minigames/refuel-air.ts
  - src/scenes/minigames/refuel.ts
  - src/render/minigames/refuel-view.ts
  - src/render/minigames/refuel-tanker.ts
  - src/render/minigames/refuel-drogue.ts
  - src/render/minigames/refuel-cockpit.ts
  - src/render/minigames/refuel-hud.ts
  - src/render/minigames/refuel-panel.ts
  - src/render/minigames/refuel-icon.ts
  - src/i18n/minigames/refuel.ts
routes: []
models: []
test_files:
  - tests/unit/refuel.test.ts
  - tests/unit/refuel-pilot.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, air-refuelling, flying, tanker, drogue, turbulence, medals]
path: Game/Minigames/AirRefuelling
initiative: off-duty-minigames
wave: off-duty-minigames-wave-2
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "REFUEL is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
satisfies_contracts: []
known_issues:
  - "Keyboard players hold the gap by pulsing the throttle (neutral ≈ 32 %); intentional, watch in human playtests"
security_read_sites: []
sister_projects: []
---

# 15 — Air Refuelling

## Purpose

Minigame 5 of the off-duty initiative (unlocks after mission 9, doc 10). Probe-and-drogue refuelling
seen **from the cockpit**: a big four-engine tanker (original design, plain grey, no markings) flies
ahead and above, trailing a hose with a **drogue basket**. The jet's refuelling probe sticks out on the
right of the nose; its tip is a fixed point low in the view. Fly the basket onto the probe at a gentle
closure rate, then hold position while the fuel flows. One minute; the score is the fuel received in lbs.
For fun only (best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/refuel-air.ts   seeded turbulence (basket wander), roughness, basket swing spring — pure
game/minigames/refuel.ts       RefuelState + stepRefuel: jet motion, closure, contact judgement, plugged
                               hold (box, push depth), fuel flow, pod light, status, round end — pure, tested
scenes/minigames/refuel.ts     REFUEL: MinigameModule; RefuelRound maps input, steps the rules, sounds,
                               popups, shake, seat / lean / tilt animation, holds the end banner
render/minigames/refuel-view   camera + pinhole projection (tanker frame → screen), sky, cloud deck, horizon
render/minigames/refuel-tanker the tanker from behind / below in true 3D: wings, four engines, tailplane, fin,
                               fuselage (convex hull of sections), hose drum pod with red / amber / green lights
render/minigames/refuel-drogue hose (sagging quadratic with push markings) and drogue basket (ring, canvas
                               panels, ribs, coupling) in perspective
render/minigames/refuel-cockpit probe (fixed in the view), canopy bow and glass, glareshield
render/minigames/refuel-hud    aim reticle, closure-rate tape + power bar + range, fuel gauge with medal marks
render/minigames/refuel-panel  plugged hold box + target diamond + hose-depth bar, glareshield status panel,
                               event popups, +1,000 LBS milestones, end banner
render/minigames/refuel-icon   hub / offer card icon (looking into the basket, probe sliding in)
i18n/minigames/refuel.ts       EN + DE strings (gameText), number format, m:ss clock
```

### Frame and units
Metres and seconds in the **tanker frame**: x right, y up, z forward along the flight path. The basket's
nominal free-trail position is the origin; the turbulence moves it around that point. The jet's state is
the position of its **probe tip** `(x, y, z)` and its velocity. `gap = basket.z − probe.z` (> 0: basket
ahead), `closure = −d(gap)/dt` (> 0: closing, measured per tick). `offset = basket − probe` in x / y.

## Business Rules

### Round
- **60 s**. Start: probe **7 m** behind the basket, **1.1 m right and 0.8 m below** it, zero closure,
  phase `approach`. When the time is up the phase is `over` (the scene holds the field 2.2 s with a
  "TIME! — n LBS ON BOARD" banner, then hands the score to the shell).
- Score = fuel received, rounded to whole lbs. `higherIsBetter: true`.

### Flying the jet (per fixed 1/60 s tick)
- Input `{ x, y, throttle }`: x / y −1 … 1 (right / up = +), throttle 0 … 1.
  Keys: arrows / WASD steer, fire (Space / J / pad A) held = throttle 1, otherwise the joystick throttle
  lever (0 … 1) or 0. Touch / mouse: drag on the left 60 % (70 px = full deflection, both axes), hold on
  the right 40 % = throttle 1.
- Lateral and vertical velocity ease towards `input × 1.6 m/s` with k = **2.6 /s** (≈ 0.4 s lag).
- Closure: the jet's forward speed relative to the tanker eases towards
  `−1.2 + 3.8 × throttle` m/s (idle drifts back at 1.2 m/s, full power closes at 2.6 m/s) with k = **1.0 /s**.
  Neutral (hold the gap) is about 32 % throttle — with a keyboard that means pulsing the throttle.
- The jet never falls back further than 16 m (`gap` clamped, closure ≥ 0 there) and stays within
  ±6 m of the basket sideways / vertically.

### Turbulence
- `wander(t)` = per axis a sum of seeded sine waves (smooth, deterministic for a round seed):
  x: periods ≈ 11 / 5.3 / 2.9 s (each ×0.85…1.15), amplitudes 0.30 / 0.17 / 0.07 m;
  y: ≈ 9 / 4.6 / 2.3 s, 0.22 / 0.13 / 0.05 m; z: ≈ 7 / 3.1 s, 0.20 / 0.08 m. Random phases.
  The scene picks a random seed per round.
- Roughness scales the wander: target `0.8 + 1.2 × t / 60 + 0.25 × min(contacts − 1, 3)` (contact term
  ≥ 0), eased with k = 0.5 /s so the basket never jumps. Calm-ish at the start (0.8), twice as rough at
  the end (2.0), and every new contact after the first adds 0.25.
- Basket **swing**: a damped spring offset (k = 7 /s², damping 2.2 /s) on top of the wander — set when the
  basket is knocked or released (below), decays back to the free trail in about 2 s.
- Free-trail basket position = `wander × roughness + swing`.

### Contact
- Judged when the probe reaches the basket plane (`gap` crosses from > 0 to ≤ 0) in `approach`:
  1. `|offset| > 0.33 m` → **MISS** (the probe passes beside the ring; basket knocked away 0.8 m/s).
  2. closure > **1.8 m/s** (3.5 kt) → **TOO FAST** (the basket bounces off, the hose whips: swing 1.5 m/s
     away + 1.5 m/s up).
  3. closure < **0.3 m/s** (0.6 kt) → **TOO SOFT** (no latch; the basket slides off).
  4. otherwise → **CONTACT**: phase `contact`, `contacts + 1`.
- A failed contact starts `backoff`: the jet drops back automatically (closure eases to −1.5 m/s with
  k = 3 /s, steering still works) until `gap ≥ 3 m` (TOO SOFT: 1.5 m), then `approach` again.

### Plugged (`contact`)
- The basket rides on the probe. `push = −gap` (how far the hose is pushed in). `hold = probe − free
  trail` must stay inside the **box ±0.7 m (x) × ±0.5 m (y)**.
- **Fuel flows** while `1.0 m ≤ push ≤ 3.0 m`: the valve opens linearly over 1.2 s and closes over 0.3 s
  outside that range. Flow = **150 lbs/s × valve**. 3.0–3.6 m: "TOO FAR — EASE BACK".
- Disconnects (fuel stops at once, `disconnects + 1`, `backoff`):
  - `push < 0` → **DROPPED OFF** (fell back out of the basket; back off to 1.5 m).
  - `push > 3.6 m` → **HOSE SLACK** (pushed too far, the hose whips: swing 0.8 + 1.5 m/s up; back off to 3 m).
  - outside the box → **BROKE CONTACT** (pulled out sideways; back off to 3 m).
  In each case the basket is released where the probe is and springs back to the free trail.
- Best possible: contact after ≈ 5 s, then 150 lbs/s for ≈ 54 s ≈ **8,000 lbs** (calm-air reference
  pilot closing at 1.6 m/s: 8,079; at 1.2 m/s: 7,871).

### Drogue pod lights (`podLight`) and status (`refuelStatus`)
- `approach` → **amber** (ready), `contact` with the valve open → **green** (fuel flowing), `contact`
  without flow → amber, `backoff` → **red** (flashing), `over` → off.
- Status: `approach` CLEARED TO CONTACT · `contact` push < 1 m CONTACT — PUSH IN · 1–3 m FUEL FLOWING ·
  > 3 m TOO FAR — EASE BACK · `backoff` BACK OFF · `over` TIME!

### Medals
- **bronze 2,000 · silver 5,000 · gold 7,250 lbs.** Gold needs the first contact within ≈ 10 s and no
  disconnect for the rest of the minute; one failed attempt or one break-off costs ≈ 5 s ≈ 750 lbs.

### Presentation
- Cockpit view: eye 4 m behind, 0.7 m left of and 0.75 m above the probe tip, focal length 900 px,
  vanishing point (640, 360). The probe tip is fixed at (797.5, 528.75); the basket's ring (0.38 m) is
  ≈ 31 px across at the start and ≈ 105 px once the probe has slid into the coupling (the basket eases
  0.75 m towards the eye over 0.3 s after contact, so the coupling sits on the probe tip).
- Tanker in true 3D projection (parallax against the basket): hose drum pod under the tail, hose exit at
  (0, 4.55, 21.2); fuselage 2.8 m radius up to 70 m ahead, swept low wing (tips ±21.5 m), engines at ±7.6
  and ±14.2 m, tailplane, fin. The hose sags 1.3 m, more once pushed past 2.5 m (slack).
- The basket leans against its own motion (coupling offset up to 0.2 m), spins slowly; the sky and cloud
  deck tilt with sideways motion (−0.03 rad per m/s); the view buffets ±1–2 px with the roughness and
  shakes on TOO FAST / HOSE SLACK.
- HUD: **aim reticle** where the probe meets the basket's plane (green inside the capture radius, amber
  outside, dashed line from the probe tip); left **closure-rate tape** −3 … 6 kt (grey < 0.6, green
  0.6–3.5, red above, "FAST"), power bar and RANGE readout; right **fuel gauge** 0–8,000 lbs with bronze /
  silver / gold medals at their marks (lit once reached) and rising bubbles while fuel flows; while plugged
  the **hold box** (corner brackets green → amber at 70 % → red at 90 %) with a target diamond showing where
  the hose wants to be (steer towards it) and the **HOSE** depth bar (grey 0–1, FLOW 1–3, amber 3–3.6,
  SLACK above); the glareshield **status panel** repeats the pod lights; event popups; "+1,000 LBS".
- Sound: `setJet(0.3 + 0.45 × throttle)` (0 on dispose); `radioClick` + `radioVoice` chatter at the start,
  after every failure / disconnect and at the end; `hit` + `uiSelect` on contact; `playerHit` on TOO FAST /
  HOSE SLACK; `uiBack` on MISS / TOO SOFT / DROPPED OFF / BROKE CONTACT; `pickup` every 1,000 lbs.

### Playtest (medal tuning, 2026-10-25)
- **Simulated keyboard pilots** (`tests/unit/refuel-pilot.ts`, unit-tested on 12 seeds): digital keys only,
  decisions every `every` s on a picture `delay` s old, a drifting judgement error of ±`noise` m, steering
  gain `gain`, aiming for `approach` m/s on the way in and 2 m of push while plugged.
  | Pilot | delay / every / noise / gain | 20 rounds: min – median – max | medals |
  |---|---|---|---|
  | ACE | 0.12 / 0.08 / 0.05 / 2.4 | 7,516 – 7,574 – 7,604 | gold 20 |
  | GOOD | 0.20 / 0.12 / 0.10 / 2.0 | 7,041 – 7,686 – 7,761 | gold 19, silver 1 |
  | AVERAGE | 0.25 / 0.14 / 0.13 / 1.7 | 6,153 – 7,574 – 7,786 | gold 15, silver 5 |
  | ROOKIE | 0.30 / 0.16 / 0.16 / 1.4 | 2,567 – 5,498 – 7,686 | gold 2, silver 11, bronze 7 |
  | NOVICE | 0.40 / 0.20 / 0.22 / 1.0 | 0 – 852 – 3,561 | bronze 2, none 18 |
- First draft (roughness 1 → 1.6, box ±0.7 × ±0.5, capture 0.30 m, start 9 m): ACE and GOOD both held one
  clean contact for the whole minute and the 0.30 s pilot fell apart (median 4,545, 2–4 contacts with
  break-offs); a tighter box (±0.6 × ±0.4) only made the cliff steeper (rookie median 1,411). Fix: calmer
  start (0.8) with a steeper rise (to 2.0), 0.33 m capture radius, 7 m start gap, and slower pilots steering
  more gently (the cliff came from the bot's gain, not the game). Then gold sits where the brief wants it —
  a quick clean first contact and a steady hold through the late turbulence.
- **Browser** (dev server, `window.__toprun` bot on the real keyboard path): one contact at 6.6 s, held
  for the minute → 7,694 lbs, gold, new best; TOO FAST at 4.8 kt (popup, red lamp, bounce, back-off),
  TOO FAR status, the DE texts and touch (hold right = power, drag left = steer) checked on screen.

## Data Flow

Greenfield: writes nothing itself; the shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 01 (input incl. joystick throttle, audio).

## Security

None (no persisted data of its own).

## Known Issues

- Keyboard players hold the gap by pulsing the throttle (neutral is ≈ 32 %); a joystick throttle lever
  makes it much easier. Intentional, but worth watching in human playtests.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
