---
id: 22-motorbike-vs-jet
title: Motorbike vs. Jet - Sunset Race Along the Perimeter Road Against a Jet Taking Off
edition: TopRun
depends_on: [10-minigames-core, 17-people-kit, 20-retro-look]
relates: [10-minigames-core, 13-tower-flyby, 14-formation-flying, 17-people-kit]
source_files:
  - src/game/minigames/motorbike.ts
  - src/game/minigames/motorbike-bike.ts
  - src/game/minigames/motorbike-course.ts
  - src/game/minigames/motorbike-jet.ts
  - src/scenes/minigames/motorbike.ts
  - src/scenes/minigames/motorbike-frame.ts
  - src/scenes/minigames/motorbike-input.ts
  - src/scenes/minigames/motorbike-radio.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/motorbike-view.ts
  - src/render/minigames/motorbike-world.ts
  - src/render/minigames/motorbike-bike.ts
  - src/render/minigames/motorbike-rider.ts
  - src/render/minigames/motorbike-obstacles.ts
  - src/render/minigames/motorbike-truck.ts
  - src/render/minigames/motorbike-gauge.ts
  - src/render/minigames/motorbike-hud.ts
  - src/render/minigames/motorbike-fx.ts
  - src/render/minigames/motorbike-icon.ts
  - src/i18n/minigames/motorbike.ts
routes: []
models: []
test_files:
  - tests/unit/motorbike.test.ts
  - tests/unit/motorbike-race.test.ts
  - tests/unit/motorbike-riders.test.ts
  - tests/unit/motorbike-riders.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, motorbike, race, jet, takeoff, gears, rev-meter, obstacles, sunset, medals]
path: Game/Minigames/MotorbikeVsJet
initiative: off-duty-minigames
wave: off-duty-minigames-wave-4
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "MOTORBIKE is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawPlaneSide(ctx, id, x, y, scale, { pitch, throttle, gear, t, livery })"
    when: "the jet on the runway is the pilot's selected jet in its paint job (doc 09), flown by Duke"
  - function: "drawSideVector + drawPixelated (people kit doc 17, pixel pipeline doc 20)"
    when: "the rider is a seated people-kit side figure with a flight jacket and helmet, pixelated and cached per pose frame"
  - function: "drawRadio (src/render/minigames/formation-radio.ts)"
    when: "Duke's radio strip (pixel portrait + typewriter line) is reused for his calls from the cockpit"
satisfies_contracts: []
known_issues:
  - "One second lost is worth ~85 m at the finish, so mishaps are expensive: a barrier hit (~200 m) or the truck (~570 m) ends medal hopes."
  - "A rider who always tucks clears the barriers for free; they punish riding upright or leaning back at the wrong moment."
  - "Touch tap-to-shift fires on release (up to 0.25 s), so touch players should tap a little early."
  - "A clearly winning rider has the jet off-screen behind for most of the race (the race strip shows it); it roars past only after lift-off."
  - "The rider's far arm and leg are hidden behind the near ones (one visible side of limbs)."
security_read_sites: []
sister_projects: []
---

# 22 — Motorbike vs. Jet

## Purpose

Minigame 6 of the off-duty initiative (unlocks after mission 12, doc 10). Sunset at the home air base: the
player rides a generic sport motorbike (crimson / white, no brand, no logo) along the perimeter road beside the
runway, in a brown flight jacket and a helmet, and races **their own jet** — the selected plane in its paint
job — which the wingman Lt. "Duke" Carter is taking off in. Shift up in the green, wheelie over speed bumps,
duck under half-open barriers, coast across oil, brake for a fuel truck crossing. The jet lifts off at a fixed
marker: **be past the lift-off marker before its wheels leave the ground.** About 33 s per race. For fun only
(best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/motorbike-bike.ts    gears, rev meter, torque curve, shift ratings (perfect / early / late / auto),
                                    limiter, auto up/downshift, lean (wheelie / tuck), drive, drag, brakes — pure
game/minigames/motorbike-course.ts  the fixed course (bumps, oil, barrier gates, fuel truck), what each needs, the
                                    truck's crossing window, judgeObstacle, the mishap table — pure
game/minigames/motorbike-jet.ts     Duke's take-off roll: rolling start, acceleration phases, lift-off marker and
                                    time, rotation, climb-out — pure, a function of race time only
game/minigames/motorbike.ts         RaceState + stepRace: bike, obstacles, mishaps, the truck trigger, marker,
                                    lift-off margin, events per tick, truckHint, score, MOTORBIKE_MEDALS — pure
scenes/minigames/motorbike-input.ts keys / pad / joystick throttle / touch → RideInput (shift re-tap, swipes)
scenes/minigames/motorbike-radio.ts Duke on the radio (typed lines, clicks, voice syllables)
scenes/minigames/motorbike-frame.ts race state → view models for the renderer and the HUD (no outcome logic)
scenes/minigames/motorbike.ts       MOTORBIKE: MinigameModule; MotorbikeRound steps the rules, camera, sounds,
                                    popups, effects, holds the end banner
render/minigames/motorbike-view     one frame in depth order (world, boards, jet, road, truck / bike by depth, fg)
render/minigames/motorbike-world    sunset sky, sun, clouds, hills, base skyline, runway + edge lights, road, fence
render/minigames/motorbike-bike     the sport bike (vector): spoked wheels with blur, fairing, tank, exhaust flame
render/minigames/motorbike-rider    the rider: seated people-kit pose per posture, jacket + helmet, pixelated
render/minigames/motorbike-obstacles speed bump, oil, barrier gate + booth, warning signs, start / lift-off boards
render/minigames/motorbike-truck    the airfield fuel truck crossing towards the camera (front view, beacon)
render/minigames/motorbike-gauge    the tachometer (bands, needle, gear, km/h, shift lamp)
render/minigames/motorbike-hud      race strip with the gap, obstacle prompt with key caps, popups, banner
render/minigames/motorbike-fx       dust, exhaust puffs, tyre smoke, speed streaks (visual only)
render/minigames/motorbike-icon     hub / offer card icon
i18n/minigames/motorbike.ts         EN + DE strings (gameText), signedMetres
```

World units are **metres** and seconds; the bike's `x` is its front wheel, the jet's `x` its nose, both from
the start line. Rendering uses 8 px per metre along the road (vehicles are drawn larger than true scale, arcade
style), so the screen shows about 160 m of road. Across the road the view is oblique: the far kerb is drawn
56 px right of the near kerb, so things that span the road (bumps, the barrier boom, the start line, the truck's
path) lean into depth and read as crossing it.

## Business Rules

### Controls (`RideInput` per fixed 1/60 s tick, `motorbike-input.ts`)
- **Throttle** 0…1: Space / J / ↑ held, pad A, joystick throttle lever (analog), touch held on the right half.
- **Brake**: ↓ / S, pad down, touch held on the left half for 0.25 s without a swipe.
- **Lean** −1 / 0 / +1: ← / A / stick left = lean back (**wheelie**), → / D / stick right = **tuck**; touch: a
  sideways swipe of ≥ 30 px on either half (held while the finger stays down).
- **Shift up**: E / pad Y; ↑ pressed while another throttle (Space / A / lever / touch) is held; ↑ pressed again
  within 0.35 s of releasing it (a re-tap — the first ↑ press of a ride is just throttle); a short tap (< 0.25 s,
  no swipe) on the left half, on release. Otherwise the gearbox shifts by itself (below).

### The bike (`motorbike-bike.ts`)
- 6 gears; redline speed **26 / 38 / 50 / 62 / 75 / 90 m/s**; drive at peak torque **11 / 9 / 7.6 / 6.4 / 5.4 /
  4.6 m/s²**. Rev meter `rpm = max(0.25, v / redline)`.
- Torque: 0.5 below 0.3 rpm, rising to 1.0 at **0.80**, flat to **0.92**, falling to **0.6** at the redline (an
  over-revving engine pulls badly, so the green band is also where shifting pays).
- Drive = throttle × gear drive × torque × 1.6 (boost) / 0.4 (bog) × (1 − 0.2 × wheelie); none on the limiter.
- Resistance = 5·10⁻⁴·v² (× 0.7 in a full tuck, × 1.15 in a full wheelie) + 0.15 rolling; + 0.8 engine braking
  with the throttle closed; + **14 m/s²** on the brake. Top speed ≈ 89 m/s (321 km/h) tucked, ≈ 86 upright.
- Lean: wheelie rises 3.5 /s while leaning back, falls 5 /s; tuck rises / falls 4 /s; one cancels the other; a
  mishap drops both.
- **Shift press** by rpm: below 0.55 ignored; 0.55–0.80 **EARLY** (drive × 0.4 for 0.35 s); **0.80–0.92 = PERFECT**
  (drive × 1.6 for 0.7 s, exhaust flame); above 0.92 **LATE** (no bonus). At the redline the engine bounces off
  the limiter (no drive, it keeps bouncing down to 0.97) and after 0.3 s the gearbox shifts up by itself (**AUTO**).
  In 6th gear nothing happens.
- Auto downshift while rpm < 0.35 on the throttle, or < 0.6 off the throttle, braking or in a mishap.

### The course (`motorbike-course.ts`, fixed so it can be learned)
| # | Obstacle | at (m) | Needs | Mishap if not (speed kept, seconds without drive) |
|---|----------|--------|-------|---------------------------------------------------|
| 1 | speed bump | 230 | wheelie ≥ 0.5 when the front wheel reaches it (or < 12 m/s) | BUMP: × 0.85, 0.2 s |
| 2 | oil patch | 470 (26 m) | throttle ≤ 0.25 and no brake on the oil (0.1 s grace) | SLIDE: × 0.75, 0.5 s |
| 3 | barrier gate | 720 | tuck ≥ 0.6 under the half-open boom | OUCH (gate): × 0.68, 0.6 s, boom knocked up |
| 4 | speed bump | 960 | wheelie | BUMP |
| 5 | fuel truck | 1240 | reach its lane outside the crossing window | SKID STOP: stops at the truck, waits until it has passed + 0.3 s (≥ 0.8 s) |
| 6 | oil patch | 1530 (30 m) | coast | SLIDE |
| 7 | speed bump | 1760 | wheelie | BUMP |
| 8 | barrier gate | 1840 | tuck | OUCH |
- The **fuel truck** pulls out when the front wheel is **170 m** short of its lane and blocks the lane from
  **1.3 s to 2.1 s** after that. Flat out at ~88 m/s the bike would arrive at ~1.93 s, so a fast rider must brake a
  little; at ≤ 81 m/s it passes behind without braking. Passing within 0.25 s after the lane cleared is a
  "CLOSE ONE!". `truckHint`: while the truck rolls, the HUD says BRAKE if the arrival at the current speed falls
  between 1.2 s and 2.15 s, else GO.
- A warning sign stands 150 m before each obstacle; the HUD prompt (what it is, what to do, the key) appears 2.2 s
  ahead and turns green while the rider does the right thing. Every obstacle counts once.

### Duke's jet (`motorbike-jet.ts`)
- **Rolling start**: at GO Duke's nose passes the start line at 16 m/s (it stands beside the bike during the 3-2-1).
- Acceleration: **4.1 m/s² to 12 s** (military power), **0.6 m/s² to 25 s** (Duke eases off and lets you lead),
  **2.8 m/s² from 25 s** (afterburner: "Burner's lit. Here I come!").
- **Lift-off marker 2050 m**: the wheels leave the ground when the nose reaches it — at **32.9 s** and 95 m/s
  (185 kt). Rotation over the last 1.5 s to 0.16 rad.
- After lift-off (race decided, visual only): climb 3·τ² m, extra 22 m/s² so the jet roars past overhead even when
  the bike won, gear up from 1 s to 2.5 s.
- The jet never depends on the rider: same schedule every race. A par rider has the jet within about ±100 m all
  race (ahead early, behind mid-race, closing at the end).

### Score and medals
- **Score = margin at lift-off in metres** = bike front wheel − lift-off marker at the lift-off moment
  (interpolated inside the tick), rounded; positive = past the marker = beat the jet. `higherIsBetter: true`,
  shown as "+42 m" / "−17 m".
- **Medals: bronze 0 (beat the jet), silver 40, gold 150** — tuned below.
- After lift-off the bike rolls out on a light brake for 4 s while the jet climbs out; banner "YOU BEAT THE JET!"
  / "DUKE WINS" with "{m} m ahead / behind at lift-off"; then the shell's result card.

### Presentation
- Side view at sunset: low sun with a glow, lit cloud streaks, two hill ridges, the base skyline (hangars, control
  tower with lit cab and a blinking beacon, water tower, radar dome), runway with centreline and glowing edge
  lights, the perimeter road with a dashed yellow line, kerb, grass and the perimeter fence passing in front.
- Camera: the front wheel sits at screen x 420 and leans up to −50 / +130 px towards a jet within 70 m so a close
  jet stays in view.
- Rider: people-kit pixel figure (docs 17 / 20) posed on the bike — upright, tuck (chest on the tank) or leaning
  back on a wheelie, foot down when stopped, swaying in a mishap; brown flight jacket with a light collar, knit
  cuffs and gloves, flight-suit trousers in the avatar's suit colour, a white helmet with a stripe in that colour
  and a dark sunset-tinted visor. The pose is turned with the wheelie before pixelation, so the sprite never
  rotates. The bike: crimson / white fairing, gold forks, spoked rims that blur at speed, brake light, headlight,
  exhaust flame on a perfect shift.
- HUD: tachometer bottom left (amber early band, green perfect band, red over-rev band, needle, gear, km/h above,
  shift lamp + "SHIFT!" in the green, blinking red on the limiter, green / amber ring flash on a shift); race strip
  top right (start tick, checkered flag, DUKE and the callsign as markers, gap in metres green ahead / red behind);
  the obstacle prompt top centre; popups over the bike (PERFECT SHIFT!, TOO EARLY, LATE SHIFT, REV LIMITER,
  CLEAN!, CLOSE ONE!, BUMP!, SLIDE!, OUCH!, SKID STOP!, PAST THE MARKER!).
- Duke on the radio (Formation's strip, doc 14): start, when the bike leads by 40 m, at the afterburner, when the
  jet overtakes, after a crash (cooldown 6 s), when the truck rolls, at rotation, win / lose.
- Sound (existing SFX only): `setJet` as the engine drone (rpm, louder with a close jet), `uiMove` gear clicks,
  `pickup` perfect shift, `uiBack` early, `hit` bump and limiter bounce, `flare` (low pitch) skid, `playerHit` crash,
  `warning` truck beacon, `catapult` lift-off roar, `cash` past the marker, `powerup` / `denied` at the end,
  `radioClick` / `radioVoice` for Duke. `setJet(0)` on dispose.

## Playtest (medal tuning, 2026-10-25)

Simulated riders on the pure rules (`tests/unit/motorbike-riders.ts`; asserted in `motorbike-riders.test.ts`).
The perfect rider shifts at 0.86, leans back 0.3 s before a bump, closes the throttle 0.05 s before oil, rides
tucked and brakes for the truck until a flat-out arrival would be 0.05 s after the window.

| Rider | Margin | Medal |
|-------|--------|-------|
| Perfect | +197 m | gold |
| Perfect, over-brakes the truck by 0.15 s / 0.30 s | +163 / +93 | gold / silver |
| Perfect, reacts to the truck 0.5 s late | +172 | gold |
| Shifts late every time (0.96) | +143 | silver |
| One bump (first / last) | +101 / +148 | silver |
| One oil slide | +82 | silver |
| Rides upright (never tucks) | +118 | silver |
| Clean, never shifts (limiter auto-shifts) | +63 | silver |
| Upright and hits the first barrier | −82 | none |
| Crashes into the fuel truck | −371 | none |
| Throttle only (never leans or brakes) | −434 | none |

Human-like riders (20 seeds each; Gaussian timing error per shift and per obstacle action, extra truck margin,
reaction delay to the truck):

| Profile | Spread (median) | Medals |
|---------|-----------------|--------|
| Skilled — σ 0.05 s, truck +0.15 s, react 0.25 s | +42 … +167 (+144) | 6 gold, 14 silver |
| Average — σ 0.09–0.10 s, truck +0.25 s, react 0.4 s | −59 … +124 (+1) | 6 silver, 6 bronze, 8 none |
| Novice — σ 0.14–0.18 s, truck +0.4 s, react 0.55 s, upright | −212 … +10 (−120) | 1 bronze, 19 none |

Tuning history: the first bike was too slow in the upper gears (shifting late beat shifting in the green, and a
speed loss took ~10 s to win back); a steeper over-rev torque fall-off, punchier upper gears and a soft top-speed
cap fixed both. The brake was raised to 14 m/s² because 10 m/s² could not wait out the truck from top speed. The
first jet trailed every rider by 150–280 m mid-race; the rolling start with an eased-off middle phase keeps it
near a par rider. Silver moved from 60 to 40 because a clean no-shift race landed on either side of 60.

**Browser** (dev server, `window.__toprun`, keyboard events on the real input path): a scripted rider (Space held,
↑ taps at 0.85–0.90 rpm, ← for bumps, → tucked, Space released on oil, ↓ for the truck by a constant-speed
estimate) rode clean with 5 perfect shifts: **+176 m (gold)**; the same rider without shifting: +48 (bronze before
the silver change, silver now). Checked on screen: countdown, every obstacle (clean and mishap: BUMP!, SLIDE!,
OUCH! with the boom knocked up, SKID STOP! behind the truck), truck CLOSE ONE!, radio lines, win and lose banners
with the jet climbing out, result card, rules card and HUD in German, hub icon. Touch via pointer events: hold right
= throttle, left tap = perfect shift, swipe left / right = wheelie / tuck, hold left = brake; keyboard: first ↑
press is not a shift, a quick ↑ re-tap and E are. Real-time frame pacing (600 frames, game's own loop): median
16.7 ms, max 18.7 ms.

## Data Flow

Reads `save.selectedPlane`, `save.livery` (the jet), `profile.avatar` / `profile.callsign` (rider colours, strip
label, Duke's lines). Writes nothing itself: the shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 17 + 20 (people kit, pixel pipeline), 09 (`drawPlaneSide` with
livery), 14 (Duke's radio strip), 12 (`PLAYER_LOOKS` avatar colours), 01 (input, audio).

## Security

None (no persisted data of its own).

## Known Issues

- One second lost is worth ~85 m at the finish, so mishaps are expensive: a barrier hit (~200 m) or the truck
  (~570 m) ends medal hopes.
- A rider who always tucks clears the barriers for free; they punish riding upright or leaning back at the wrong
  moment.
- Touch tap-to-shift fires on release (up to 0.25 s), so touch players should tap a little early.
- A clearly winning rider has the jet off-screen behind for most of the race (the race strip shows it); it roars
  past only after lift-off.
- The rider's far arm and leg are hidden behind the near ones.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
