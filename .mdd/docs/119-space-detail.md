---
id: 119-space-detail
title: Space Detail - Space's Seven Enemies and Five Bosses Redrawn With Plated Hulls, Engines and Lights
edition: TopRun
depends_on: [113-detail-kit, 115-steppe-enemy-detail, 116-steppe-boss-detail]
relates: []
source_files:
  - src/render/enemies/space-pal.ts
  - src/render/enemies/space-kit.ts
  - src/render/enemies/space-gear.ts
  - src/render/enemies/space-guns.ts
  - src/render/enemies/space-surface.ts
  - src/render/enemies/space.ts
  - src/render/enemies/space-ships.ts
  - src/render/bosses-4.ts
  - src/render/bosses-4a.ts
  - src/render/bosses-4b.ts
  - src/render/bosses-4c.ts
  - src/render/boss-mounts-4.ts
  - src/render/bosses-later.ts
routes: []
models: []
test_files:
  - tests/unit/space-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [enemies, bosses, space, spacecraft, art, map-5]
path: Game/Art/Enemies
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-4
wave_status: complete
---

# 119 — Space Detail

## Purpose

Owner, 2026-11-14: *"Auch die Gegner sollten detaillierter sein"* — question round: all of them, *"auch im Raumschiff,
jungle und uboot welt"*. Space's seven enemies (raider, sat gun, corvette, interceptor, gunship, battery, warden; docs 56, 58) and its five bosses (HALO, QUARRY, CRATER, TRIDENT, ARK) are redrawn at the alien steppe's level of detail.

## The look

Hard-surface spacecraft: plated hulls with panel seams and greebles, engine bells glowing, cockpit glass, running lights, solar panels, turrets; the bosses as battle stations and capital ships. Each keeps its identity.

## Architecture

- Each kind becomes a `DetailArt` behind `detailUnit` (doc 113), the way the alien steppe's army is built (doc 115,
  `src/render/enemies/steppe-*.ts`): a world palette with its one-colour version and the half extents of each kind's
  cached body in a `*-pal.ts`, the static body cached, the moving parts (`under` / `over`) drawn live and checking
  `p.mono` before any fixed colour.
- The exports keep their names, so `drawEnemy`, the shadow sprites and the wrecks take the new art unchanged.
- Bosses follow doc 116: the static hull through `drawCached` in the variant its palette asks for, moving parts live,
  the weapon parts drawn by the world's own mounts registered in `CUSTOM_MOUNTS` (bosses-later.ts).

## Business Rules

- Each kind's cached body box is sized to its hit radius: its larger half extent between 0.6 and 1.7 radii (tested).
- Each boss's cached hull box covers all its hitboxes and parts (tested); every boss of the world has a custom mount.
- One-colour palettes (flash, shadow) have every colour the same; no glow, gradient or fixed colour leaks into them.
- Hitboxes, behaviour, data and animations stay as they are; fronts point down (+y); the aim turns guns as before.

## Verification

Unit tests as listed. Browser: `dev/art-detail.html?world=N` (and `&part=bosses`), the kinds large, at mission size,
flashed, as shadows and wrecks; a mission of the world.

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)

## As built (2026-11-14)

| kind / boss | what it shows now |
|---|---|
| raider | a forward-swept dart: hull rounded across with a lit spine, tinted plates, seams, intakes, a red spine stripe and red wing tips, wing cannons in their pods, the canopy with its glint, twin engine bells with flickering plumes, a beacon blinking |
| interceptor | a long-nosed delta: plated wings with elevon hinges, canted fins, the radome, the dorsal intake, an amber missile under each wing, one big engine bell and plume, nav lights blinking red and green |
| gun satellite | a hexagonal bus of six facets shaded by where they face, corner thrusters, bolts, two solar wings on their arms (cells, grid, glint), the twin turret tracking, the red beacon blinking on its mast |
| lunar battery | a berm of regolith bags lit from the upper left round a plated pad with radial seams and a blue painted ring, the twin turret, a two-missile launcher, a sensor dish, ammunition crates, the blue beacon |
| corvette | a long hull with armour belts and bolts, radiator sponsons, a raised deck with its drop shadow, red bow chevrons, lit ports, the domed bridge, the missile rack aft, three engine bells; its twin turret tracks, nav lights and a bow strobe blink |
| gunship | an armoured hull of bolted plates in four tones, the lit glacis with viewport slits, side skirts, weapon pods with vents and thrusters, a dish and hatches; a triple turret forward and a twin flak mount aft both track |
| battlecruiser (warden) | a long wedge with launch-cell nacelles and their engines, armour belts, rows of lit ports, a raised spine, the bow deck with chevrons, the bridge tower with windows, dish and antenna, the missile rack, three main engines; two triple turrets track, nav lights and a strobe blink |
| HALO | a torus of 24 plated segments rounded and lit, habitat windows, four trussed spokes with pipes, four domed docking pods with clamps, the armoured hub with vanes and docking arms; lights run round the ring, the core pulses |
| QUARRY | a faceted asteroid with rock grain and real craters (shaded bowl, lit rim), dark cracks whose ore seams glow, four dug-in gun pits with bolted collars, pipes, a dish with a beacon, the drill housing and its grooved cone, the core shaft glowing, smoke |
| CRATER | the regolith crater with its inner wall in shade and in light, small craters, the citadel's armoured walls round a recessed yard of floor plates and clutter, four bastions, the silo's blast doors between hazard stripes, the geodesic dome, a landing pad, solar arrays, pipes and dishes; the core pulses, lights chase along the front wall, the fire burns |
| TRIDENT | three plated hulls joined by trusses: the central one with its raised spine of launch cells and vents, bridge tower, hangar doors, bow chevrons and keel stripe, the side hulls with decks and ports; every engine glows pink, nav lights and a bow strobe blink |
| ARK | a broad hull with a darker armour skirt round its raised deck, plates in several tones with clutter, ribs, the prow's armour with chevrons, two recessed launch bays with hazard stripes, sponsons and flak platforms, the core's armoured well, rows of ports, dishes and antennae, five engines; the core pulses, the bays' landing lights run in, a hit smokes |

- Files: `space-pal.ts` (the palette `ShipPal`, `shipMono`, `SPACE_PAL`, `SPACE_BOX`, `shipArt`), `space-kit.ts` (plating,
  `keel`, `tints`, `drop`, `seams`, engine `bell` and live `plume`, `canopy`, `greebles`, live `lamp`), `space-gear.ts`
  (missile `rack`, launch `cells`, `solar`, `dish`, `windows`), `space-guns.ts` (`turretRing`, the live `turret` whose
  housing stays lit from the upper left however it turns), `space-surface.ts` (`scatter`ed hull clutter, rock `grain`);
  `space.ts` (raider, interceptor, gun satellite, battery and `SPACE_UNITS`), `space-ships.ts` (corvette, gunship,
  battlecruiser).
- Bosses: `bosses-4.ts` keeps `PALS_4` and `LIGHTS_4` (unchanged) and adds `BOSS_BOX_4`, `SHIP_4` (each boss's colours
  as a ship palette, its own engine light), `liveOf`, `cachedHull`; the hulls are in `bosses-4a.ts` (HALO, QUARRY),
  `bosses-4b.ts` (CRATER, TRIDENT, and `HULLS_4`, which bosses-later.ts now imports from there) and `bosses-4c.ts` (ARK).
- Mounts (`MOUNTS_4`, one per boss in its own colours): an octagonal barbette cached per boss, kind and radius; aimed →
  twin railgun turret, single → one barrel, spread3 → heavy triple turret, flak → twin turret between ammunition drums,
  missile → an armoured block of launch cells between hazard stripes with its ready light, ray / ring → a domed emitter
  whose lens glows toward the aim. The weapon switch ends in the `satisfies never` guard.
- One-colour passes: every live part (plumes, lamps, glows, turrets' shading, the core glows) checks `mono` first; crescent
  shading (craters, the crater wall) is clipped to its circle so nothing half-transparent leaks outside a silhouette.
- Keys of the sprite cache are prefixed (`space-<kind>`, `boss4-<id>`, `space-mount-<id>-<kind>-<r>`).

