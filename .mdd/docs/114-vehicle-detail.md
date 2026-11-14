---
id: 114-vehicle-detail
title: Vehicle Detail - The Jackal, Lynx, Viper and Bison Redrawn as Modern-Military Vehicles, Top and Side View
edition: TopRun
depends_on: [113-detail-kit, 103-tank-kit, 104-tank-drive, 112-tank-liveries]
relates: [113-detail-kit, 109-ramp-start]
source_files:
  - src/render/tanks/vehicle-build.ts
  - src/render/tanks/tank-top.ts
  - src/render/tanks/turret-top.ts
  - src/render/tanks/buggy-top.ts
  - src/render/tanks/tank-side.ts
  - src/render/tanks/buggy-side.ts
  - src/render/tanks/vehicle-parts.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - dev/art-vehicles.ts
routes: []
models: []
test_files:
  - tests/unit/vehicle-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [tanks, buggies, vehicles, art, top-view, side-view, liveries, modern-military, map-7]
path: Game/Art/Vehicles
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-1
wave_status: complete
---

# 114 — Vehicle Detail

## Purpose

Owner, 2026-11-14: *"Ich finde buggy und panzer etc nicht gut genug. Versuch mal richtig coole, detaillierte Modelle zu
erzeugen."* Question round: modern-military. The motor pool's four vehicles are redrawn with the detail kit (doc 113)
at the jets' level of detail, from above (the mission, the motor pool's lists) and from the side (the motor pool's
picture, the ramp start, the celebration), wearing every paint job (doc 112).

## The vehicles

| vehicle | role | from above | from the side |
|---|---|---|---|
| **Jackal** | fast patrol buggy, pintle MG | open tube chassis on four knobbly off-road tyres with fenders; a bull bar and winch, the roll cage with a four-lamp light bar; driver and gunner in helmets; the pintle MG on its ring behind them (turns); the spare wheel, two jerrycans and an ammo box on the rear deck; a whip antenna | long-travel coil-over suspension, the big tyres with tread and rims, the tube frame and cage, the crew, the MG, the spare wheel upright at the back |
| **Viper** | rocket buggy | the longer chassis, sand ladders along the sides, a rolled camouflage net; the eight-tube rocket pod on its cradle at the back; crew of two | the pod tilted up on its cradle, the rockets' red noses |
| **Lynx** | light tank | an angular hull with a sloped glacis, tracks under side skirts, the driver's hatch with periscopes, the engine grilles and exhaust at the back, tow hooks, headlights; the turret (turns): the 20 mm cannon with its coax, an ATGM launcher box, the commander's panoramic sight and hatch, two banks of smoke dischargers, two antennas, a stowage basket | six road wheels, sprocket, idler and return rollers, the skirts with bolts, the low turret with the sight and the launcher box, the rear door |
| **Bison** | heavy main battle tank | the wide hull, tracks under skirts with reactive-armour blocks at the front, the big engine deck with grilles and jerrycans, tow cables along the sides; the wedge-armoured turret (turns): the long 120 mm gun with thermal sleeve and fume extractor, the commander's remote MG, the loader's hatch, smoke dischargers, the bustle's stowage basket, antennas | seven road wheels, sprocket and idler, the skirts with the armour blocks, the wedge turret and the long gun |

Generic modern designs, no real vehicle copied, no insignia, no text.

## Architecture

- `vehicle-build.ts` — pure tables and geometry: each vehicle's dimensions (hull, tracks or wheels, turret ring and
  pivot, barrel), `linkOffset(driven, pitch)`, `roadWheelXs(build)`, the top and side extents. Tested.
- `tank-top.ts` (tracks, hull), `turret-top.ts` (the turrets and the Jackal's MG), `buggy-top.ts`, `tank-side.ts`,
  `buggy-side.ts` — the painters; `vehicle-parts.ts` — parts the views share (jerrycan, stowage basket, smoke
  dischargers, light bar, tyre, crew helmet).
- **Paint:** the painted surfaces (hull, skirts, turret; the buggies' tub and fenders) are filled with the look's base
  and get its camouflage and trim through `paintFleet`; shading, light edges, panel lines and bolts are colour-neutral
  overlays on top, so every paint job reads as painted metal. Metal, rubber, glass and crew keep their own colours.
- **Cache:** the static hull and the turret are painted once per vehicle, look and scale bucket (`drawCached`, doc 113;
  a look's key comes from a WeakMap over the look objects) and blitted; the turret's sprite is rotated to its angle;
  the track links, the wheels' tread and the spokes are drawn live, they move.
- The flash and the shadow keep filling `tankTopSilhouette(id)` (draw-planes.ts); the silhouette grows with the new
  parts so it still covers them.

## Business Rules

- Top view: front up (−y), centred on the hull's middle; scale 1 in the mission. Side view: facing right, ground at
  y = 0, every wheel touching it.
- `linkOffset(driven, pitch)` ∈ [0, pitch) for any driven distance (negative too).
- `roadWheelXs(build)` — the road wheels evenly spaced between the sprocket and the idler, inside the track's length.
- The top extents (hull, tracks, turret ring, fenders) stay inside the silhouette rectangle, and the silhouette's
  half-width is at least the player's hit radius (13).
- The turret pivot is on the hull's centre line; the barrel points to −y at angle 0.

## Verification

Unit: `vehicle-detail.test.ts`. Browser: a sheet of the four vehicles from above and the side in the standard paint and
in several paint jobs (`dev/art-steppe.html`), the motor pool's picture, a drive mission in each (the turret turning
on its own), the ramp start.

## Dependencies

113-detail-kit, 103-tank-kit (the vehicles), 104-tank-drive (yaw, turret, driven), 112-tank-liveries (the looks).

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)

## As built (2026-11-14)

- The turret and the Jackal's MG cast a soft shadow onto the hull (their sprite in black at 30 %, offset toward the
  lower right); hatches are painted lids with a rim, side hinge and handle bar (dark round hatches read as faces).
- The flash and the shadow fill a shaped silhouette now: the tanks' track band, hull and turret ring; the buggies'
  chassis and four tyres.
- Side views draw the track run and wheels live (the ground run slides back, the top run forward, sprocket teeth and
  rims turn) and the rest cached; the buggies cache two layers (body behind the tyres, fenders over them).
- `dev/art-vehicles.html?still` shows every vehicle large and at mission size in four paints (it draws once without
  waiting for an animation frame, so a hidden tab renders it too).
