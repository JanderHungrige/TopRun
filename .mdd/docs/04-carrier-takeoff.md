---
id: 04-carrier-takeoff
title: Carrier Takeoff - Side-View Catapult Launch Mini-Game
edition: TopRun
depends_on: [01-game-core, 02-hangar-economy, 03-campaign-map]
relates: [05-mission-combat, 06-talking-characters, 07-i18n]
source_files:
  - src/game/takeoff-logic.ts
  - src/scenes/takeoff.ts
  - src/scenes/takeoff-hud.ts
  - src/render/draw-carrier.ts
  - src/render/carrier/geometry.ts
  - src/render/carrier/pen.ts
  - src/render/carrier/hull.ts
  - src/render/carrier/fittings.ts
  - src/render/carrier/deck.ts
  - src/render/carrier/island.ts
  - src/render/carrier/mast.ts
  - src/render/carrier/aircraft.ts
  - src/render/carrier/crew.ts
  - src/render/carrier/water.ts
  - src/render/carrier/sky-sea.ts
  - src/render/draw-planes-side.ts
  - src/render/planes/f16-side.ts
  - src/render/planes/f14-side.ts
  - src/render/planes/sr71-side.ts
  - src/render/planes/side-kit.ts
routes: []
models: []
test_files:
  - tests/unit/takeoff.test.ts
data_flow: greenfield
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [carrier, takeoff, catapult, side-view, countdown, afterburner, joystick-throttle, mini-game]
path: Game/Takeoff
integration_contracts:
  - function: "TakeoffRating ('perfect'|'good'|'early'|'late'|'skipped')"
    when: "passed into the mission scene and on to computePayout"
satisfies_contracts: []
known_issues:
  - "Catapult shuttle is hidden during the stroke instead of tracking the jet (CarrierView carries no shuttle position)"
security_read_sites: []
sister_projects: []
---

# 04 — Carrier Takeoff

> **2026-10-25 update (art detail pass):** the carrier is redrawn finer: island with bridge windows,
> mast, radars and antennas; deck with markings, catapult track and blast deflector detail, parked
> aircraft and deck crew; hull with sponsons, hangar-bay openings, hull number band and waterline. The
> side-view jets are redrawn finer as well (panel lines, canopy frame, gear detail, nozzle) and wear the
> pilot's livery (doc 09). `DECK_Y`, the shooter poses and the deflector/launch parameters are unchanged.

## Purpose

Every mission starts on the deck of an aircraft carrier, seen **from the side**. The launch is a
short, readable ritual (simplified 2026-10-25 at the owner's request — the old rotation timing and
ditching were "a bit complicated"): hold **Space** to spool the afterburner, press **E** to lock the
throttle in the green, wait for the **3-second countdown**, press **E** again — the catapult fires and
the jet lifts off by itself. Reacting fast after GO earns a cash bonus.

## Architecture

```
game/takeoff-logic.ts  pure state machine: createTakeoff() / stepTakeoff(state, input, dt)
scenes/takeoff.ts      drives the state machine, camera, particles, deck officer, audio
scenes/takeoff-hud.ts  throttle gauge, countdown numbers, prompts, LOCK/LAUNCH touch button
render/draw-carrier.ts sky, sun, clouds, sea with waves, carrier hull, island, deck crew, JBD, steam
render/draw-planes-side.ts  side-view vector art: F-16, F-14, SR-71, A-10, F-35, Tornado (+ afterburner), each drawn
                            from real dimensions through realProfile() (side-kit.ts)
```

State machine:

```
spool ──(E, needle in green)──▶ locked ──(3 s countdown)──▶ ready ──(E)──▶ catapult ──(1.4 s)──▶ climb ──(2.2 s)──▶ done(rating)
  ▲  └─(E outside green: rejected low/high, stay in spool)
any phase ──(S / SKIP)──▶ done('skipped')
```

## Side views from real dimensions (Fair Challenge wave 4, owner 2026-10-27)

Owner: "From the side the planes don't look like the original airframes — they look like kids' toys. That also counts
for the new planes. Top view is good in all." The side views were too tall: deep tube fuselages, canopy bubbles a
metre too high, fins a fifth too tall, short noses (the F-16's main gear at 46 % of the length instead of 61 %), and
none of the type marks (the F-16's chin intake, ventral fins, chute housing).

- Every side view is rebuilt from **real dimensions in metres** — distance from the nose and height above the deck,
  gear down — converted by `realProfile(k, xMain)` (side-kit.ts): `x = (xMain − m) · k`, `y = −h · k`, so the
  origin stays the main-gear contact and the nose points right. `k` keeps each jet's drawn length (F-16 ≈ 113 units).
- Proportions from public figures only (length, height, span, wheelbase, canopy and intake positions from published
  three-views' dimensions) — no traced artwork. Gear stance, wheel sizes and canopy heights follow the real jets.
- Thinner outline in the side view (the ink halo that made them read as cartoons is lighter).
- Everything that measures the side view follows: `SIDE_TAIL_X`, the flyby hull (doc 13), the motorbike nose (doc 22),
  the picture-wall metrics (doc 32).
- Used figures (m): F-16 15.06 long / 4.88 high, main gear 9.2 from the nose; F-14 19.1 / 4.88, 12.2; SR-71 32.6 / 5.64,
  21.0; A-10 16.26 / 4.47, 8.0; F-35 15.67 / 4.38, 9.6; Tornado 16.72 / 5.95, 10.8. Canopy tops ≈ 3.0–3.3 m, bellies
  ≈ 0.9–1.5 m, wheel radii 0.27–0.47 m.

## Data Model

```ts
interface TakeoffState {
  phase: 'spool' | 'locked' | 'ready' | 'catapult' | 'climb' | 'done';
  throttle: number;        // 0..1 needle incl. jitter
  rawThrottle: number;     // lever position
  t: number;               // time in the current phase
  clock: number;           // total time (needle jitter)
  countdown: number;       // seconds left while locked (3 → 0)
  deckPos: number;         // 0..DECK_LENGTH px travelled on the catapult
  speed: number;
  altitude: number;
  climbRate: number;
  rating: TakeoffRating | null;
  overspeed: boolean;      // needle in the red
  rejected: 'low' | 'high' | null;  // why the last lock attempt failed (cleared when locked)
  earlyPresses: number;    // E presses during the countdown (feedback only, no penalty)
}
```

Constants: `GREEN = [0.80, 0.97)`, lever up 0.5/s while Space is held; when released it **stays put**,
except in the red, where it bleeds back down at 0.25/s until it is safely inside the green (0.95, clear of the needle jitter)
(playtest 2026-10-25: a drifting needle left the green before E could be pressed), needle jitter ±0.012, `COUNTDOWN = 3 s`, reaction `PERFECT ≤ 0.6 s`, `GOOD ≤ 1.5 s`,
`DECK_LENGTH = 560`, catapult stroke 1.4 s (`deckPos = DECK_LENGTH × (t/1.4)²`), climb 2.2 s.
`TakeoffRating` keeps the legacy value `early` for old saves/labels; it is no longer produced.

## API Endpoints

None.

## Business Rules

- **Inputs**: THROTTLE = fire action *held* (Space / J / ↑, gamepad A, touch: hold anywhere on the
  sky/sea). LOCK/LAUNCH = **special** action *pressed* (E, gamepad Y, touch: the big LOCK / LAUNCH
  button). SKIP = `S` or the SKIP button → `skipped`, no bonus. Esc leaves the deck for the map.
- **Spool**: the lever rises while Space is held and stays where it is when released, so the player
  can let go inside the green and press E calmly. Above 0.97 the needle is in the red (overspeed),
  cannot be locked, and sinks back into the green on its own once Space is released.
- **Joystick throttle** (doc 01): with a throttle axis bound, the lever position *is* the throttle
  (0 idle … 1 full, no rise rate, no bleed) — but only once it has moved more than 0.05 from where it
  sat when the deck scene started, so a lever parked at full doesn't put the jet in the red and the
  trigger / Space still work. Joystick players lock and launch with their SPECIAL button.
- **Lock**: E in the green → `locked`, the throttle freezes at its value, countdown starts at 3.
  E below the green → rejected `low`; E in the red → rejected `high`; both stay in `spool`.
- **Countdown**: 3 s, shown as big 3 · 2 · 1 with a beep per second; E during the countdown is
  ignored (counted as `earlyPresses`, deck officer says "Wait for it!").
- **Ready**: "GO!" — the next E launches. Rating by reaction time since GO:
  ≤ 0.6 s `perfect` (+15 % in 02's payout), ≤ 1.5 s `good` (+5 %), later `late` (no bonus).
  There is no time-out and no failure: the jet waits on the catapult.
- **Catapult → climb**: automatic — the jet runs down the deck, gear retracts, nose rotates up and
  it climbs away; the scene then fades to the mission (05) with the rating.
- **Deck officer** (06) lines: spool · green (first time the needle enters the green) · notYet
  (rejected low) · overspeed (rejected high / red) · locked (countdown) · waitForIt (early E) ·
  go · launch · perfect / good / late.
- Visuals: camera follows the plane horizontally; afterburner length tracks throttle; locked
  throttle shows a padlock on the gauge; catapult steam and a camera shake on launch.

## Data Flow

Greenfield. `MissionDef` + `save.selectedPlane` in → `TakeoffRating` out → Mission scene.

## Dependencies

01-game-core (scene, input, audio), 02 (plane ids / art), 03 (MissionDef in, scene flow).

## Security

None.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
