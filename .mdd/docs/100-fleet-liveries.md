---
id: 100-fleet-liveries
title: Fleet Liveries - Paint Jobs for the Helicopters, the Subs and the Spacecraft, Earned Theater by Theater
edition: TopRun
depends_on: [09-paint-jobs, 49-helicopter-kit, 66-sub-kit, 54-spacecraft, 55-shipyard]
relates: [09-paint-jobs, 87-mech-camo, 51-heli-fleet, 69-sub-fleet]
source_files:
  - src/data/liveries.ts
  - src/render/look.ts
  - src/render/livery-art.ts
  - src/render/fleet-looks.ts
  - src/render/fleet-paint.ts
  - src/game/liveries.ts
  - src/game/progress.ts
  - src/game/ship-loadout.ts
  - src/render/helis/ah64-side.ts
  - src/render/helis/heli-art.ts
  - src/render/helis/ah64-top.ts
  - src/render/subs/u212.ts
  - src/render/subs/fleet.ts
  - src/render/ship.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-paint.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/shipyard.ts
  - src/scenes/shipyard-paint.ts
  - src/scenes/shipyard-view.ts
  - src/scenes/rocket-launch.ts
  - src/scenes/mission/mission-render.ts
  - src/i18n/liveries-de.ts
  - src/i18n/ui-en.ts
  - src/i18n/ui-de.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
routes: []
models:
  - "SaveData.livery — unchanged: one LiveryId per PlaneId; helicopters, subs and the starship now get theirs"
test_files:
  - tests/unit/fleet-liveries.test.ts
data_flow: writes-existing
last_synced: 2026-11-13
status: complete
phase: all
mdd_version: 11
tags: [paint-jobs, liveries, camouflage, helicopters, submarines, spacecraft, hangar, shipyard, unlocks]
path: Game/PaintJobs/Fleet Liveries
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.livery parsed from the untrusted profile store; the new ids must stay earned)
sister_projects: []
---

# 100 — Fleet Liveries

## Purpose

Owner, 2026-11-13: *"There are no camo paints / skins for the helis. How is it for the boats, space and the jungle
world?"* — then *"Give the subs skin options too. The spaceship too."* Question round: earned like the jets' paint jobs
(doc 09) — per theater a region camo once it opens and a reward for 3★ on all its missions. The mechs keep their
hand-painted camo (doc 87).

## The paint jobs

Each world's five theaters bring two paint jobs each for that world's craft (30 new):

| world / craft | theater | region (theater opens) | 3★ reward |
|---|---|---|---|
| 3 helicopters | fjords | Fjord Splinter (grey-blue splinter) | Northern Lights (dark blue, green-teal stripes) |
| | highlands | Snowfield (white with grey blobs) | Mountain Rescue (white and signal red) |
| | delta | Delta Swamp (green-brown blobs) | Swamp Tiger (olive with black tiger stripes) |
| | mesa | Mesa Sand (tan and rust blobs) | Red Rock (rust red, sand trim) |
| | ashfall | Ash Grey (grey splinter) | Lava (black with orange glow) |
| 4 subs | reef | Reef Blue (two blues) | Coral (white over coral red) |
| | kelp | Kelp Green (green-black blobs) | Sea Serpent (green with yellow stripes) |
| | wrecks | Rust Hulk (rust blobs) | Ghost Ship (pale grey-green) |
| | trench | Trench Black (black-blue) | Angler (black with glowing yellow trim) |
| | abyss | Abyss Violet (dark violet blobs) | Kraken (deep red with black stripes) |
| 5 spacecraft | orbit | Orbital White (white, light grey) | Station Stripes (white with blue stripes) |
| | belt | Asteroid Grey (grey-brown) | Prospector (yellow and black) |
| | moon | Lunar Dust (light grey-beige) | Moonshot (silver with red trim) |
| | rings | Ring Gold (gold-brown) | Saturn (cream with gold bands) |
| | deep | Deep Space (black-violet) | Nebula (violet with magenta trim) |

Generic schemes, no insignia, no text.

## Which craft wears what

- A paint job belongs to its world's craft: the jets keep maps 1–2's 20, the helicopters wear map 3's, the subs map
  4's, the spacecraft map 5's (`liveryKit(id)`, pure). The standard paint is everyone's.
- **Helicopters and subs:** a PAINT tab in their hangar (HELICOPTERS · WEAPONS · EQUIPMENT · PAINT), the same rows as
  the jets' (locked ones show how they are earned); APPLY paints the selected craft.
- **Spacecraft:** the shipyard has no tabs, so its paint gets a **PAINT** button (key P) beside the title that opens a
  list of map 5's paint jobs over the yard (swatches, name, IN USE / UNLOCKED / how it is earned); ↑/↓ pick, ENTER or a
  tap paints the ship, P / ESC closes (`ShipPaint`, `src/scenes/shipyard-paint.ts`).
- The hangar's paint panel texts no longer speak of jets only: "paints only the craft you fly", and the side view is
  labelled SIDE VIEW (was ON THE CARRIER).
- Shown in the mission, the hangar, liftoff / dive launch / rocket launch and the celebrations.

## How it looks

- Helicopters and subs get the jets' camouflage generator (`drawCamo`, blobs and splinter) clipped to their body
  outline, top and side view (`paintFleet`, `src/render/fleet-paint.ts`), and a look's trim as stripes along the body
  (two along a top view, one along a side view). The old ellipse camo of the Tiger / Comanche / Hind top views is
  replaced by it (the Hind's factory camo now uses the generator too).
- The spacecraft maps a look onto its hull (base), its shading (under), its outlines (ink) and its accent strips
  (trim); the glass and the engines stay. It wears its paint in the mission, the shipyard and the rocket launch.
- `Look` and its helpers moved to `src/render/look.ts` (the fleet's looks live in `fleet-looks.ts`; livery-art
  re-exports the types).

## Business Rules

- `liveryKit(id)`, `liveriesFor(kit)` (pure, `src/game/liveries.ts`); `liveryOnShow` shows a world's paint jobs only once
  that world is open; `regionOpen` uses the map before (the first theater of maps 3–6 opens with its map).
- `applyLivery` refuses a paint job of another kit; `parseLiveries` drops any livery a craft may not wear.
- Debrief: "new paint" for these as for the jets.

## Verification

Browser (dev server on the branch): a sheet of all 30 on the Tiger and Hind, the Seawolf and Akula and the display
ship; the helicopters' PAINT tab (Mountain Rescue applied, IN USE); the shipyard's PAINT list (Asteroid Grey applied,
the ship repainted at once).

## Known Issues

(none)
