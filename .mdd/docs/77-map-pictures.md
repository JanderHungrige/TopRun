---
id: 77-map-pictures
title: Map Pictures - A Painted Pixel-Art Terrain for Each Campaign Map, Generated on the Map's Own Layout
edition: TopRun
depends_on: [03-campaign-map, 35-second-map, 74-world-order]
relates: [03-campaign-map, 35-second-map, 48-third-map, 56-fourth-map, 65-fifth-map, 74-world-order]
source_files:
  - src/scenes/map-render.ts
  - src/render/map-picture.ts
  - src/assets/maps/
  - dev/map-pictures.py
routes: []
models: []
test_files:
  - tests/unit/map-pictures.test.ts
data_flow: reads-existing
last_synced: 2026-11-07
status: complete
phase: all
mdd_version: 11
tags: [campaign-map, map, pixel-art, comfyui, backgrounds]
path: Game/Campaign/Map Pictures
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 77 — Map Pictures

## Purpose

Owner, 2026-11-07: *"Ich hätte gerne bei den Karten passende Hintergrundsbilder. Das sieht derzeit ein bisschen öde aus.
Der PC ist belegt. Nutze den M1 und zeig mir zuerst die Vorschläge."* — the campaign maps are a gradient sea, a faint
grid and flat coloured blobs per theater; each map gets a painted pixel-art picture instead.

## How the pictures fit the missions

The mission nodes, the route and the theater names stay where they are (data, doc 03), so a picture must keep the land
where the map draws it. Each picture is therefore an **edit of the map's own layout**: the map's static layer (sea, grid,
landmasses — `staticLayer(c)`, no names, nodes or route) is exported at the map panel's size (846 × 628), scaled to
1040 × 768 and repainted by FLUX.2 klein on the M1 ("keep every landmass exactly where it is … add no new land"), one
prompt per map naming each theater's terrain by its colour:

| map | the sea becomes | the land becomes |
|---|---|---|
| 1 | a deep blue ocean with shallows | desert (Gulf), tropical islands (Pacific), pack ice (Arctic), red canyons, volcanic rocks (Leviathan) |
| 2 | a cold stormy northern sea | jungle, snowy mountains, a desert at night, rocky islands, storm-swept rocks |
| 3 | a grey-green northern sea | fjords, snowy passes, a river delta, mesas, an ash island |
| 4 | deep water over the sea floor | the coral reef, the kelp forest, the wreck field, the trench, the abyss |
| 5 | black space with stars and a nebula | low orbit over a planet, the asteroid belt, the moon, the ring giant, deep space |

`dev/map-pictures.py` puts each render on the map's art grid (212 × 157, 4 logical px per art px, 48 colours of its own,
no dither) as `src/assets/maps/map<c>.png`; the map panel draws it in place of the gradient, grid and blobs (the blobs
stay as the fallback while it loads). Names, route and nodes are drawn on top as before.

## The renders used

One take per map (seed 7) on the M1 (the PC was busy), ~8–10 min each; the owner took all five as shown (2026-11-07).
On map 2 the night desert came out brown with a violet crater rather than violet; on map 5 the ring giant reads as an
icy band. The layouts were exported from the dev build (`staticLayer(c)`, cropped to `MAP_RECT`) and the M1's renders
are in its ComfyUI output folder (`tgmaps/`).

