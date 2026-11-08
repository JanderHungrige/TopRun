---
id: 84-drop-launch
title: Drop Launch - The Mech Drops From a Dropship Over the Jungle and Fires Its Retros to Land Soft
edition: TopRun
depends_on: [78-sixth-map, 79-mech-kit, 71-dive-launch, 04-carrier-takeoff]
relates: [71-dive-launch, 59-rocket-launch, 86-jungle-looks]
source_files:
  - src/game/drop-launch.ts
  - src/scenes/drop-launch.ts
  - src/render/drop.ts
  - src/scenes/routes.ts
  - src/game/dialogue-scripts.ts
  - src/i18n/lines-jungle-en.ts
  - src/i18n/lines-jungle-de.ts
routes: []
models: []
test_files:
  - tests/unit/drop-launch.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [launch, drop, dropship, retro-rockets, mechs, minigame, takeoff-rating, map-6]
path: Game/Launch/Drop
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 84 — Drop Launch

## Purpose

*"We land on a jungle planet."* Every map-6 sortie starts with the drop: the dropship opens its bay over the jungle, the
mech falls, and the pilot fires the retro rockets to land softly on the pad in the clearing. Rated like the catapult
(doc 04): perfect, good, early, late, skipped — the launch bonus and the medals that count launches work unchanged.

## Rules (`stepDrop`, pure)

- 1.6 s with the bay doors opening, then the fall from 120 m: gravity 9 m/s², terminal 25 m/s.
- Holding the retros (SPACE, ↑, or holding the screen) brakes the fall at 13 m/s² net down to a **soft descent** of
  2 m/s and holds it there, while the fuel (5 s) lasts.
- Touchdown at ≤ 3 m/s is **perfect**, ≤ 8 m/s **good**; harder is **early** when the fuel ran out above the ground
  (lit too soon) and **late** when there was fuel left (lit too late). Lighting them between 24 and 31 m is perfect.
- The altitude gauge shows that band in green and the good band in yellow; the fuel bar runs down under it.

## The scene

Side view, drawn in code: a green-gold sky with two moons, mountains and a waterfall, cloud wisps the mech falls past,
the canopy closing in with the red clearing and its yellow pad, the dropship overhead. The camera follows the mech until
the ground comes into view. Retro flames under the feet, dust on touchdown, the screen shaking by the impact. Shooter
(the drop controller in her jungle kit, doc 86) calls the bay, the drop and every grade.
