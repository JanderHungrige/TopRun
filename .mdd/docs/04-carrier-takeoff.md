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
  - src/render/draw-planes-side.ts
routes: []
models: []
test_files:
  - tests/unit/takeoff.test.ts
data_flow: greenfield
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [carrier, takeoff, catapult, side-view, timing, mini-game]
path: Game/Takeoff
integration_contracts:
  - function: "TakeoffRating ('perfect'|'good'|'early'|'late'|'skipped')"
    when: "passed into the mission scene and on to computePayout"
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 04 — Carrier Takeoff

## Purpose

Every mission starts on the deck of an aircraft carrier, seen **from the side**. The player
spools the engines, gets shot off the catapult and must rotate (pull up) at the right moment.
A good launch earns a cash bonus; a missed one ends in the sea and a retry.

## Architecture

```
game/takeoff-logic.ts  pure state machine: createTakeoff() / stepTakeoff(state, input, dt)
scenes/takeoff.ts      drives the state machine, camera, particles, HUD prompts, audio
render/draw-carrier.ts sky, sun, clouds, sea with waves, carrier hull, island, deck crew, JBD, steam
render/draw-planes-side.ts  side-view vector art: F-16, F-14, SR-71 (+ afterburner)
```

State machine:

```
spool ──(needle in green ≥ 1.0 s)──▶ catapult ──(press ROTATE)──▶ climb ──▶ done(rating)
                                       │
                                       └─(deck end, no press)──▶ edge ──(press within 0.7 s)──▶ climb (late)
                                                                   └──(no press)──▶ ditched ──(press)──▶ spool
any state ──(SKIP key S)──▶ done('skipped')
```

## Data Model

```ts
interface TakeoffState {
  phase: 'spool' | 'catapult' | 'edge' | 'climb' | 'ditched' | 'done';
  throttle: number;      // 0..1 actual needle incl. jitter
  greenTime: number;     // seconds continuously in green zone
  t: number;             // time in current phase
  deckPos: number;       // 0..DECK_LENGTH px travelled along catapult
  altitude: number;      // px above deck (negative = below deck level)
  rating: TakeoffRating | null;
  attempts: number;
}
```

Constants: `GREEN = [0.86, 0.97]`, throttle up 0.55/s while held, down 0.45/s when released,
needle jitter ±0.02 (deterministic sine noise), `DECK_LENGTH = 560`, catapult stroke 1.4 s with
`deckPos = DECK_LENGTH × (t/1.4)²`, `PERFECT ≤ 50 px` remaining, `GOOD ≤ 150 px`, earlier = `early`,
edge grace 0.7 s, climb 2.2 s.

## API Endpoints

None.

## Business Rules

- Input: THROTTLE = fire action held (Space / J / ↑ / touch hold / gamepad A).
  ROTATE = a **fresh press** of the same action after the catapult fired (holding from spool
  does not count). SKIP = `S` key or on-screen "SKIP" button → rating `skipped`, no bonus.
  Esc leaves the deck and returns to the map (no penalty).
- Spool: throttle in the red zone (≥ 0.97) shows "OVERSPEED — ease off" and resets the green
  timer; the player has to feather the throttle to keep the needle in green for 1 s.
- Rating by remaining deck distance at press: ≤ 50 px `perfect`, ≤ 150 px `good`, else `early`
  (plane sags briefly, no bonus). After the deck end: altitude drops (gravity), a press within
  0.7 s → `late` (dramatic recovery near the waves); otherwise → `ditched` (splash) and
  "Press FIRE to retry" — attempts counter increments, no money penalty.
- Bonus (applied in 02's payout): perfect +15 %, good +5 % of base reward.
- Visuals: camera follows the plane horizontally; catapult steam; afterburner length tracks
  throttle; deck crew "shooter" gives the launch signal; launch shakes the camera.
- After `done` the scene fades to the mission (05) with the rating.
- Plane art reflects the selected plane (F-16 / F-14 / SR-71).

- **Talking character (06):** shooter (deck officer coaches the launch). All visible text goes through i18n (07).

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
