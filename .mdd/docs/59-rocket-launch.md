---
id: 59-rocket-launch
title: Rocket Launch - The Spacecraft Rides a Two-Stage Rocket; the Pilot Separates Each Spent Stage, Rated Like the Catapult
edition: TopRun
depends_on: [04-carrier-takeoff, 53-deck-liftoff, 56-fourth-map]
relates: [53-deck-liftoff, 04-carrier-takeoff, 56-fourth-map]
source_files:
  - src/game/rocket-launch.ts
  - src/scenes/rocket-launch.ts
  - src/scenes/rocket-hud.ts
  - src/render/rocket.ts
  - src/scenes/routes.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
routes: []
models: []
test_files:
  - tests/unit/rocket-launch.test.ts
data_flow: greenfield
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [takeoff, launch, rocket, staging, spacecraft, rating, map-4, minigame]
path: Game/Takeoff/RocketLaunch
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 59 — Rocket Launch

## Purpose

Wave 7 of New Frontiers. Decided with the owner (2026-11-06): *"the spacecraft rides a rocket and the pilot times the
stage separations. Both are rated like the catapult (doc 04)."* Until now a map-4 sortie went straight into the
mission (`skipped`, doc 56).

## The launch

1. **Countdown** — 3 s: "3 · 2 · 1 · IGNITION". The stack stands on the pad: the booster (stage 1), the upper stage
   (stage 2) and the ship on top under its fairing.
2. **Stage 1 burns** — 4 s. Its fuel bar drains; the stack climbs, faster and faster, the sky darkening.
3. **Burnout** — the engine cuts out, the stage light flashes **SEPARATE!** The pilot presses **E** (gamepad Y,
   joystick special, the SEPARATE button on touch).
4. **Stage 2 burns** — 3.2 s, the same again.
5. **Orbit** — the fairing opens, the ship flies free; 1.5 s later the mission starts.

## Rating (like the catapult)

Each separation is graded by the time from burnout to the press:

| press | grade |
|---|---|
| before burnout (the stage still burning) | early — fuel thrown away |
| within 0.35 s | perfect |
| within 0.9 s | good |
| later, or never (the stage drops on its own after 2 s) | late — dead weight |

The launch takes the **worse** of the two grades: any early → `early`, else any late → `late`, else any good →
`good`, else `perfect`. The bonus is the catapult's: perfect +15 %, good +5 % of the mission reward.

- **S / SKIP** skips the launch (`skipped`, no bonus); **ESC** goes back to the map.

## Business Rules

- Pure state machine in `src/game/rocket-launch.ts`: `createLaunch`, `stepLaunch(state, input, dt)`, `gradeSeparation`,
  `rateLaunch`; constants `LAUNCH`.
- `routes.ts`: campaign 4 → `RocketLaunchScene`, which goes to the mission with the rating when `done`.
- Drawing in code: `src/render/rocket.ts` (the stack, falling stages, exhaust); the HUD (prompt, fuel bars, altitude,
  SEPARATE button) in `src/scenes/rocket-hud.ts`.
