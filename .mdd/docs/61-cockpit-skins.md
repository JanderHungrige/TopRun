---
id: 61-cockpit-skins
title: Cockpit Skins - The Mission Consoles Restyled per Craft: Gunmetal Jets, Olive-Drab Helicopters, Holo-Glass Spacecraft
edition: TopRun
depends_on: [05-mission-combat, 49-helicopter-kit, 54-spacecraft]
relates: [05-mission-combat, 54-spacecraft]
source_files:
  - src/game/cockpit.ts
  - src/render/cockpit/skin.ts
  - src/render/cockpit/backplate.ts
  - src/render/cockpit/index.ts
  - src/render/cockpit/types.ts
  - src/render/cockpit/metal.ts
  - src/render/cockpit/plates.ts
  - src/render/cockpit/screens.ts
  - src/render/cockpit/radar.ts
  - src/render/cockpit/gauges.ts
  - src/render/cockpit/mission.ts
  - src/render/cockpit/lamps.ts
  - src/render/cockpit/buttons.ts
  - src/scenes/mission/cockpit-view.ts
routes: []
models: []
test_files:
  - tests/unit/cockpit-skins.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [cockpit, hud, consoles, skins, helicopters, spacecraft, art]
path: Game/Mission/Cockpit
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 61 — Cockpit Skins

## Purpose

Owner, 2026-11-07: *"with the spaceship, and the helicopters change the 'cockpit' design. Same elements at the same
place, but different look."* Question round: **rugged olive** for the helicopters, **holo glass** for the spacecraft;
the jets keep today's 80s gunmetal (doc 05).

## What stays

Everything in `layout.ts` — every rect, dial and button, so hit-testing, touch and the playfield are untouched — and
every element: name plate, radar, hull dial, cannon lamps and power bar, STORES screen, AIR / GROUND buttons, the
mission screen, the six warning lamps, FLARE, SPECIAL, the attitude indicator, the toggles and PAUSE. The lit colours of
the buttons and lamps keep their meaning (AIR red, GROUND green, SPECIAL cyan, FLARE amber; warnings red / amber /
green).

## The three skins

| | Jet (gunmetal, doc 05) | Helicopter (rugged olive) | Spacecraft (holo glass) |
|---|---|---|---|
| Console | brushed gunmetal, scratches | olive-drab paint, worn chips showing bare metal, rivet rows | near-black blue glass, a faint grid, a glowing seam |
| Panels | rounded, bevelled, screws | rounded, bevelled, domed rivets | angled (chamfered) corners, thin cyan glowing edges, no screws |
| Name plate | light metal, cut lettering | olive plate, yellow stencil lettering | dark glass, cyan lettering |
| Legends | light grey | stencil cream | pale cyan |
| Screens & radar | green phosphor | amber night-vision | cyan hologram |
| Attitude card | blue sky, brown ground | the same, olive bezel | deep blue over violet, cyan lines |

## Business Rules

- `cockpitSkin(kind)` (`src/game/cockpit.ts`, pure): the plane's kind picks the skin — `jet` → `jet`, `heli` → `heli`,
  `ship` → `ship`.
- `src/render/cockpit/skin.ts` holds the three palettes (`COCKPIT_SKINS`, every field filled for every skin — the
  compiler checks) and the active skin, set by `drawLeftConsole` / `drawRightConsole` from the view's `skin` and reset
  to the jet's afterwards, so anything else drawing with the cockpit primitives keeps gunmetal.
- The console plate cache (doc 05) keys on the skin too: switching craft repaints the plates once.
- `LeftConsoleView.skin` / `RightConsoleView.skin` are filled by `cockpit-view.ts` from the flying plane's kind.
- The console backplate (`backplate.ts`) adds each skin's surface: brushed streaks and scratches, worn paint chips
  and rivet rows, or a faint grid with a few glowing traces. `rr()` cuts corners at an angle on the spacecraft;
  `bevel()` strokes a glowing edge there; fasteners become small status lights.
