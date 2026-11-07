---
id: 74-world-order
title: World Order - Under the Sea Becomes Map 4 (m91–m120), Space Map 5 (m121–m150); Saves Follow Their Worlds
edition: TopRun
depends_on: [56-fourth-map, 58-map-four-campaign, 65-fifth-map, 70-map-five-campaign, 72-map-five-honours]
relates: [56-fourth-map, 58-map-four-campaign, 65-fifth-map, 66-sub-kit, 67-sub-flight, 69-sub-fleet, 70-map-five-campaign, 72-map-five-honours, 73-home-docks, 64-world-celebrations]
source_files:
  - src/data/types.ts
  - src/data/missions-4.ts
  - src/data/missions-5.ts
  - src/data/theaters-4.ts
  - src/data/theaters-5.ts
  - src/data/planes.ts
  - src/data/weapons.ts
  - src/data/fleet.ts
  - src/data/reinforcements.ts
  - src/data/medals.ts
  - src/data/ranks.ts
  - src/data/base-areas.ts
  - src/game/kit.ts
  - src/game/map-three.ts
  - src/game/progress.ts
  - src/game/save.ts
  - src/game/world-order.ts
  - src/game/medals.ts
  - src/game/ship-shop.ts
  - src/game/sub-flight.ts
  - src/game/dialogue-scripts.ts
  - src/scenes/routes.ts
  - src/scenes/map.ts
  - src/scenes/map-render.ts
  - src/scenes/tapes.ts
  - src/scenes/celebration.ts
  - src/scenes/hangar-items.ts
  - src/render/celebration.ts
  - src/render/ranks.ts
  - src/i18n/missions-4-de.ts
  - src/i18n/missions-5-de.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
  - src/i18n/ui-en-deep.ts
  - src/i18n/ui-de-deep.ts
  - src/assets/finales/
  - dev/playtest.ts
routes: []
models:
  - "SaveData.worlds: 2 — the world order the save's mission ids are in (missing = the old order: space at m91–m120)"
test_files:
  - tests/unit/world-order.test.ts
  - tests/unit/missions-4.test.ts
  - tests/unit/missions-5.test.ts
data_flow: writes-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [campaign, world-order, map-4, map-5, underwater, space, save-migration]
path: Game/Campaign/World Order
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "A tab left open across the deploy still runs the old order; if it pulls a cloud save written by the new code and pushes it back, the save loses its `worlds` mark and is moved again on its next read. Reloading open tabs after the deploy avoids it."
security_read_sites:
  - src/game/save.ts (the save's mission ids are moved to the new order once, from the untrusted profile store / cloud save)
sister_projects: []
---

# 74 — World Order

## Purpose

Owner, 2026-11-07: *"order: helicopter world, underwater, space"*. Space came fourth (docs 56, 58) and the sea fifth
(docs 65, 70); now **under the sea is map 4** and **space is map 5**, the finale of the whole campaign.

## What moves

| | before | now |
|---|---|---|
| Under the sea (Coral Reef … the Abyss) | map 5, m121–m150 | **map 4, m91–m120** |
| Space (Low Orbit … Deep Space) | map 4, m91–m120 | **map 5, m121–m150** |

Each world keeps everything that is its own, only its place changes:

- its missions (names, objectives, pools, theaters, bosses) and its formulas counted from its first mission — threat
  `2 + (n − first) × 1.35`, the reward from 1,200, the length — so the balance of docs 58 and 70 holds;
- its pay factor (`MAP_FOUR` is now the sea's ×10, `MAP_FIVE` space's ×8, both +3 % a mission) and its kit: map 4 the
  subs (`kitOf(4)` = `'sub'`), map 5 the ship; its launch (map 4 the dive, map 5 the rocket), its hangar (the SUB PEN,
  the shipyard), its scroll speed, its mini-boss from its second theater (map 4 the missile sub from m97, map 5 the
  battlecruiser from m127) and its reinforcements (by mission number, moved by 30);
- the craft and weapons are on sale once their map is open (subs and their weapons: map 4; the ship: map 5);
- its medals: the ids stay (`reef` … `allstars5` under the sea, `orbit` … `allstars4` in space — stored nowhere, the
  medals are derived), but each victory medal and golden star counts its world's map; the catalogue lists the sea's
  seven before space's;
- its celebration (the plates are renamed: `w4*` the sea's, `w5*` space's), its tape, its base dock (map 4 the sea dock,
  map 5 the space dock);
- the admiral: after m90 he sends the pilot under the sea (`adm.deepWater`, reworded), after m120 up to the stars
  (`adm.space`); the finale lines and the celebration lines follow their worlds — the last word is space's: *"That was
  the last frontier"*;
- the ranks: above Ace of Aces now **Admiral of the Deep** (48,000, four wide stripes), then **Star Admiral** (60,000,
  five) — the top rank goes with the last world.
- Map titles, map colours and the German mission texts move with their worlds.

## Saves follow their worlds

- A save carries `worlds: 2` once its mission ids are in the new order. A save without it (from before this change)
  is moved once when it is read (`parseSave` → `reorderWorlds`, pure, `src/game/world-order.ts`): progress entries and
  sortie-log missions m91–m120 become m121–m150 and m121–m150 become m91–m120. Pilot codes and cloud saves go through
  the same parse, so they are moved the same way.
- **A map stays open once flown in:** a pilot who had already flown space missions keeps space open even before
  clearing the sea's finale — `mapOpen` is true for a map whose missions have any progress (its first unflown
  mission still unlocks one by one).

## Not moved

- Everything that is the world's own keeps its name: the boss files (`data/bosses-4.ts` space's, `bosses-5.ts` the sea's),
  the render files, the medal ids, the dock pictures. The raw celebration renders in the ComfyUI output keep their old
  world numbers; `dev/finale-plates.py` writes `w<world>` plates, so convert the sea's raws as world 4 and space's as 5.
- No balance change: every world's threat, reward, length and pay are counted from its own first mission, and pay is
  the only number-based factor past map 2 (`payScale`), so a world flies and pays as it did before the swap.

