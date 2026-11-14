---
id: detail-art
title: Detail Art
status: complete
version: 1
hash: 05639608
created: 2026-11-14
---

# Detail Art

## Overview
Owner (2026-11-14), after map 7 went live: *"Ich finde buggy und panzer etc nicht gut genug. Versuch mal richtig coole,
detaillierte Modelle zu erzeugen. Danke. Auch die Gegner sollten detaillierter sein."*

The map-7 vehicles and the enemies of the later worlds are flat vector shapes (a fill, a few rectangles, no shading),
well below the detailed jets of maps 1–3 (`src/render/enemies/kit.ts`: one silhouette path, camouflage, cylinder
shading, light and shade overlays, panel and hinge lines, an outline, painted once into a cached sprite). This
initiative redraws them at that level: the four vehicles of the motor pool, then every enemy and boss of the sea
(map 4), space (map 5), the jungle planet (map 6) and the alien steppe (map 7).

## Decisions (question round, 2026-11-14)
- **Technique: detailed art drawn in code**, the jets' way — vector parts with shading, highlights, panel lines and
  outlines, the static parts cached as sprites; no Blender renders, no generated sprites (CLAUDE.md: in-game art is
  drawn in code).
- **Vehicles: modern-military** — tanks with reactive-armour blocks, smoke dischargers, side skirts over road wheels
  and track links, commander's hatch and sight, stowage baskets, jerrycans, antennas; buggies with roll cages, spare
  wheels, light bars, jerrycans, gunners. Top view (the mission: hull yaw, turret turning on its own) and side view (the
  motor pool, the ramp start, the celebration); every paint job (doc 112) still lies on them.
- **Enemies: all of them**, maps 4–7, bosses included. Hitboxes, behaviour, animations (legs, rotors, fins, turrets
  aiming), the hit flash, the shadow and the wreck stay as they are; only the drawing changes.
- **Performance:** what does not move is painted once per kind and palette into a sprite (as `layer.ts` does for the
  jets); a frame draws the sprite and the animated parts.
- **Workflow:** `/mdd`, one question round, then through the gates; ask before commit and deploy.

## Open Product Questions
- [x] Technique — detailed art drawn in code (owner)
- [x] Which enemies — all of maps 4–7, bosses too (owner)
- [x] Vehicle look — modern-military (owner)

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/detail-art-wave-1.md | The Jackal, Lynx, Viper and Bison redrawn in modern-military detail: in the mission (hull turning, turret aiming on its own, tracks and wheels running), in the motor pool, the ramp start and the celebration, every paint job on them; the shared detail kit for ground units ready. | complete |
| Wave 2 | waves/detail-art-wave-2.md | The alien steppe's army (13 kinds with the war tripod) and its five bosses redrawn in detail; flash, shadow and wrecks as before. | complete |
| Wave 3 | waves/detail-art-wave-3.md | The jungle planet's 22 enemies and its five bosses redrawn in detail. | complete |
| Wave 4 | waves/detail-art-wave-4.md | Space's seven enemies and its five bosses redrawn in detail. | complete |
| Wave 5 | waves/detail-art-wave-5.md | The 13 enemies under the sea and its five bosses redrawn in detail. | complete |
