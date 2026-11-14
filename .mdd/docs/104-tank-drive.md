---
id: 104-tank-drive
title: Tank Drive - Tracks and Wheels on the Steppe, Turret Swivel, Dust, the Four Specials
edition: TopRun
depends_on: [103-tank-kit, 80-mech-walk, 61-cockpit-skins]
relates: [103-tank-kit, 105-steppe-world]
source_files:
  - src/game/tank-drive.ts
  - src/game/sub-flight.ts
  - src/game/jets.ts
  - src/game/cockpit.ts
  - src/scenes/mission/tank-mission.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/shells.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-render.ts
  - src/render/tanks/tank-top.ts
  - src/render/tanks/tank-side.ts
  - src/render/tanks/tank-fx.ts
  - src/render/track-marks.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/livery-art.ts
  - src/render/cockpit/skin.ts
  - src/render/cockpit/backplate.ts
  - src/render/special-fx.ts
routes: []
models: []
test_files:
  - tests/unit/tank-drive.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [tanks, buggies, driving, tracks, wheels, turret, dust, nitro, sentry, salvo, main-gun, cockpit-skin, art, map-7]
path: Game/Mission/Tank Drive
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-1
wave_status: complete
---

# 104 — Tank Drive

## Purpose

The tanks and buggies drive over the steppe: they don't fly and they don't walk. A buggy is quick and twitchy, a tank
heavy and steady; both kick up dust and leave marks in the grass.

## How a vehicle moves

- **The driving scroll:** the steppe scrolls at 0.7 × the jets' speed (map 7's `flightScroll`), a touch faster than
  the walking mechs.
- **Handling** (`driveAccel(kind)`, pure): the velocity eases toward the stick — buggies with a quick 6 (and a slide:
  a buggy's heading leans into the turn), tanks with a slow 3.2 (they get going and stop late).
- **The hull turns** toward where it is going, at most 22° from straight up, back to straight when it stops
  (`hullYaw(vx, vy)`, pure); a tank's turret keeps pointing ahead (or at its target), a buggy's gun turns with the body.
- **Bounce:** a buggy bobs a pixel with the ground (a fast sine on its speed), a tank rumbles (a slower, smaller one).
- **Marks and dust:** a tank leaves two track marks, a buggy four tyre marks, laid every 10 px of ground covered and
  scrolling away with the floor (fading over 4 s); a dust plume trails behind while it moves, bigger at speed.

## The specials (E)

- **Nitro** (Jackal, cooldown 10 s, 1.2 s): double speed toward the stick (straight ahead without one), blue exhaust
  flames; nothing can hit it, and every ground enemy it touches takes 120 (a big one, armour as usual) — the SR-71's dash
  on the ground.
- **Sentry Drop** (Lynx, cooldown 16 s): a small auto-turret drops behind the tank and fires 6 rounds/s of 18 at the
  nearest enemy within 260 px for 12 s; it scrolls with the ground. One at a time.
- **Rocket Salvo** (Viper, cooldown 14 s): the Apache's Longbow salvo, a rocket at each target in sight.
- **Main Gun** (Bison, cooldown 8 s): one heavy shell straight up at 900 px/s that bursts on the first enemy or the boss
  it meets — 420 on that one, 140 to everything within 90 px; a muzzle flash and the tank rocks back.

## Art

Top-down, nose up, drawn in code (`src/render/tanks/`): the **Jackal** an open buggy with a roll cage, four big
knobbly wheels and a pintle gun; the **Viper** a longer buggy with a rocket rack over the rear axle; the **Lynx** a
compact tank on wide tracks with a small round turret and a short barrel; the **Bison** a broad tank with skirts, a big
turret and a long barrel with a muzzle brake. Tracks animate (link lines running with the speed), wheels spin (spokes),
the paint shows on the hull and the turret (doc 112 later). A side view of each for the MOTOR POOL. The cockpit HUD wears
a sand-and-steel tank skin with rivets and a periscope frame.

## Business Rules

- Pure (`src/game/tank-drive.ts`): `vehicleOf(id)`, `driveAccel(id)`, `hullYaw(vx, vy)`, `bounce(kind, driven, speed)`,
  `markDue`, `markOffsets(kind)`, the numbers `NITRO`, `MAIN_GUN`, `SENTRY`; the sentry's aim uses `headingTo`.
- A vehicle is a `PlaneDef` of kind `tank`; `VEHICLE` (`src/data/tank-kit.ts`) says which are buggies and which tanks
  (the handling, the turret, the marks). A tank's turret is the turret aim of doc 99 with a built-in 25° swivel
  (`tankArmsStats`, `src/game/tank-arms.ts`); the main gun's shell is a Bofors shell (doc 46) with its own speed and a
  hard `direct` hit on the first thing it meets.
- `src/scenes/mission/mission-render.ts` was at the line limit: the special effects of docs 36 and 51 (the Hind's armour
  shell, the A-10's muzzle flash, the nuke) moved to `src/render/special-fx.ts`.
