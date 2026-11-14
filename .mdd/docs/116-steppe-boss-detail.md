---
id: 116-steppe-boss-detail
title: Steppe Boss Detail - HARVESTER, LONGSHANKS, JUGGERNAUT, DREADNOUGHT and the MOTHERSHIP Redrawn in Detail
edition: TopRun
depends_on: [113-detail-kit, 115-steppe-enemy-detail, 105-steppe-world]
relates: [115-steppe-enemy-detail]
source_files:
  - src/render/bosses-7.ts
  - src/render/bosses-7a.ts
  - src/render/bosses-7b.ts
  - src/render/boss-mounts.ts
  - src/render/draw-bosses.ts
  - src/render/bosses-later.ts
routes: []
models: []
test_files:
  - tests/unit/steppe-boss-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [bosses, aliens, art, steppe, map-7, mounts, cache]
path: Game/Art/Bosses
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-2
wave_status: complete
---

# 116 — Steppe Boss Detail

## Purpose

The alien steppe's five bosses (doc 105) are redrawn at the detail of their army (doc 115): their hulls shaded and
plated, the moving parts (legs, the reaper drums, the beast's stride) live, and their weapon parts drawn as alien
mounts instead of the shared naval turrets.

## The bosses

| boss | hull | its parts |
|---|---|---|
| HARVESTER | a squat reaper machine on six legs: plated body with vents and a cab dome, the reaper bar with spinning drums across the front, the chimney smoking | reaper drums (spread3), chimney (missile), dome (aimed) |
| LONGSHANKS | a giant tripod: the armoured head with a visor, cooling fins, three huge striding legs, the pod on its back | two heat-ray emitters, the missile pod, the eye |
| JUGGERNAUT | a siege beast: banded hide, armoured brow and tusks, a gun fort (howdah) strapped to its back, two riders, the swinging tail | its parts are organs: tusks, howdah, riders, tail |
| DREADNOUGHT | a siege ship hovering: a long plated hull with ribs, engine pods glowing, hangar doors, antennae | two turrets, the bomb bay, the missile rack |
| MOTHERSHIP | the invasion's heart: a vast disc of armour segments with a glowing core, rim emitters, hangar mouths and lights | four rim emitters, the core beam, the hangar |

## Architecture

- `bosses-7.ts` — palettes, lights, the cached hulls' boxes and the shared helpers; `bosses-7a.ts` / `bosses-7b.ts` — the hulls: the static hull painted once per boss and palette variant through the
  sprite cache (doc 113; the flash is its mono variant), the moving parts drawn live.
- `boss-mounts.ts` — `MOUNTS_7`: alien mounts for the steppe bosses' parts (emitters, pods, alien guns; the
  JUGGERNAUT's organs), looked up by `draw-bosses.ts` before its shared mounts (`CUSTOM_MOUNTS` in bosses-later.ts).
- Hitboxes, parts, weapons, warning lights and damage marks are untouched.

## Business Rules

- Each boss's static box covers all its hitboxes and parts (data/bosses-7.ts); tested.
- A custom mount draws within its part's radius × 1.8 (turning barrels excepted).

## Verification

Unit: `steppe-boss-detail.test.ts`. Browser: `dev/art-detail.html?part=bosses` — each boss with its parts alive,
flashing and destroyed; each boss mission once.

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)

## As built (2026-11-14)

- `draw-bosses.ts` asks `CUSTOM_MOUNTS` (bosses-later.ts) first; the steppe's mounts (boss-mounts.ts) cache their
  housings per weapon and radius and draw barrels, lenses and glows live; the JUGGERNAUT's tusks, tail club and
  riders are organic parts, its fort a twin plasma gun.
- `ALIEN_7` derives each hull's palette from its boss palette; `liveOf` gives the moving parts the one-colour palette
  while the boss flashes.
