---
id: 51-heli-fleet
title: Helicopter Fleet - Comanche, Tiger and Hind With Their Own E Abilities, the Stinger
edition: TopRun
depends_on: [49-helicopter-kit, 50-helicopter-flight, 48-third-map]
relates: [49-helicopter-kit, 50-helicopter-flight, 36-new-jets]
source_files:
  - src/data/types.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/game/jets.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/hangar-panels.ts
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/livery-art.ts
  - src/render/icons.ts
  - src/render/helis/heli-art.ts
  - src/render/helis/fleet.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/hangar-items.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
  - src/i18n/content-de.ts
test_files:
  - tests/unit/heli-fleet.test.ts
routes: []
models: []
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [helicopters, comanche, tiger, hind, stinger, specials, hangar, map-3]
path: Game/Hangar/Helicopter Fleet
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 51 — Helicopter Fleet

## Purpose

Wave 3 of New Frontiers. Owner, 2026-11-06: *"helicopters instead of airplanes. Apache, comanche, eurocopter,
hind."* The Apache came free with map 3 (doc 49); the other three are bought in the HELICOPTERS hangar, each with an
E ability of its own, so choosing one is a choice of play style. All four share the helicopter kit (chain gun level,
equipment, Hydra / Hellfire / Stinger and their marks): a new helicopter is a new airframe, not a new shop.

## The helicopters

| | hull | speed | stations | gun × | E (cooldown / duration) | price |
|---|---|---|---|---|---|---|
| AH-64 Apache | 140 | 240 | 4 | 1.0 | Longbow Salvo (14 s): a Hellfire for each of four ground targets (doc 50) | free |
| Eurocopter Tiger | 125 | 265 | 4 | 1.2 | **Gun Pods** (15 s / 8 s): the gun fires one level higher, like a power-up | 1,200,000 |
| RAH-66 Comanche | 115 | 285 | 4 | 1.0 | **Low Observable** (18 s / 6 s): the F-35's stealth — enemies hold fire, missiles lose lock | 1,800,000 |
| Mi-24 Hind | 220 | 215 | 6 | 1.1 | **Flying Tank** (16 s / 3 s): nothing gets through the armour (an amber shell shows it) | 2,800,000 |

- Real names like the jets; no national insignia (CLAUDE.md). The Tiger in a plain grey-green, the Comanche dark
  radar grey, the Hind in two-tone sand and green.
- Art in code like the Apache's (`src/render/helis/`): top-down with the spinning main rotor (Tiger 4 blades,
  Comanche 5 in a small disc and a shrouded fan tail, Hind 5 in the biggest disc) and a side view each.
- The Hind's six stations: the hangar's loadout row narrows its slots when a plane has more than four.
- The helicopters' hangar says FLY THIS HELICOPTER, shows no TWIN PODS button, and its mark note stops at Mk III.

## The Stinger

**FIM-92 Stinger** (`stinger`): the helicopters' air-to-air missile — heat-seeking, AIR key, four per station, Mk I–III,
mounts on helicopters only. Until now the helicopters fought aircraft with the gun and the Hydra fan.

## Business Rules

- `SpecialId` gains `gunpods` and `armour`; `specialRules('armour')` is invulnerable, `gunpods` neither; the
  Comanche uses `stealth` (doc 36).
- Gun Pods sets the power-up timer (doc 05) to at least its duration; Flying Tank is a plain invulnerable window.
- Helicopters on sale once map 3 is open, in the helicopters' hangar only (doc 49); owning one makes it selectable.

## Balance

**Shop ≈ 1.5 × pay.** The map-3 shop now costs ≈ 12.1 M: chain gun 2–10 3.98 M, Hydra / Hellfire / Stinger with
Mk II–III 0.78 M, equipment to the map-1 caps 1.55 M, Tiger + Comanche + Hind 5.8 M. Map 3 pays ≈ 8.1 M (doc 48),
so a pilot who buys as the money comes in owns the Apache's kit and one more helicopter by the finale and chooses the
rest — the doc-43 rule for each map. First try (Tiger 0.9 M, Comanche 1.4 M, Hind 2.2 M) gave 1.34 ×.

**The four helicopters** (bot playtest, `dev/playtest.ts`, doc 48 method; each flies the same kit — the buying
pilot's at that mission, with the Stinger; damage in hulls of its own maximum per minute / kill share / boss time,
three runs each):

| | m78 CAIMAN (gun 6, armour 4) | m88 (gun 9, armour 4) |
|---|---|---|
| AH-64 Apache | 2.5 / 0.63 / 37 s | 5.1 / 0.70 |
| Eurocopter Tiger | 2.4 / 0.79 / 24 s | 5.2 / 0.75 |
| RAH-66 Comanche | 2.5 / 0.66 / 30 s | 4.1 / 0.71 |
| Mi-24 Hind | 1.3 / 0.67 / 33 s | 2.9 / 0.65 |

- Each has its edge: the Tiger kills fastest (the gun's × 1.2 and the pods), the Comanche takes about a fifth less
  damage than the Apache late on (stealth), the Hind half as much in hulls (220 hull, Flying Tank) — the dearest
  airframe and the slowest. The free Apache is the all-rounder with the Longbow.
- In raw damage per minute (hulls × maximum hull) the Apache, Tiger and Hind take about the same; the Hind's edge is
  its bigger hull. No change to the airframes was needed.
