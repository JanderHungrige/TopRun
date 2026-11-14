---
id: 113-detail-kit
title: Detail Kit - Cached, Shaded Code Art for Ground, Sea and Creature Units, With Flash, Shadow and Wreck Variants
edition: TopRun
depends_on: [104-tank-drive, 105-steppe-world]
relates: [114-vehicle-detail]
source_files:
  - src/render/detail/sprite.ts
  - src/render/detail/parts.ts
  - src/render/detail/unit.ts
  - src/render/detail/color.ts
routes: []
models: []
test_files:
  - tests/unit/detail-kit.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [art, rendering, sprites, cache, shading, enemies, vehicles, performance]
path: Game/Art/Detail Kit
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-1
wave_status: complete
---

# 113 — Detail Kit

## Purpose

Owner, 2026-11-14: *"Versuch mal richtig coole, detaillierte Modelle zu erzeugen … Auch die Gegner sollten detaillierter
sein."* The jets of maps 1–3 are drawn with a detail kit (`render/enemies/kit.ts` + `layer.ts`): one silhouette,
camouflage, cylinder shading, light and shade overlays, panel lines, an outline, painted once into a cached sprite. The
ground, sea and creature units of maps 4–7 and the map-7 vehicles get the same treatment through this kit: shared
painters for the parts they are made of and a cache that also serves the hit flash, the shadow and the wreck.

## Architecture

```
detail/color.ts   shade(hex, k), mix(a, b, k)              pure colour maths (tested)
detail/sprite.ts  scaleBucket, variantOf, spriteKey         pure (tested)
                  drawCached(ctx, key, box, paint, variant) offscreen canvas per key + scale bucket;
                                                            'mono' = the sprite tinted one colour (flash, shadow),
                                                            'burnt' = the sprite darkened to soot (wrecks)
detail/parts.ts   bevel, plate, bolts, grille, mesh, hatch, tube, lens, glow, antenna, cable
detail/unit.ts    DetailArt<P> { pal, mono(colour), box, body, under?, over? } → detailUnit(key, art): UnitFn
```

- **Light** comes from the upper left of the screen (−x, −y) like the jets'; parts get a light edge there and a dark
  edge opposite, plus a soft shade along the far side.
- **`drawCached`** paints `paint(g)` once into an offscreen canvas at the device's scale bucket (0.5 steps, never
  below 1; above 8 — dev zoom — it draws the vectors directly), and blits it. The `mono` variant is the same sprite
  filled with one colour through `source-atop` (so the flash and the shadow keep every detail of the outline); the
  `burnt` variant darkens it to soot brown (70 % over the colours, the shape kept). At most 160 sprites; on overflow
  the cache starts over (window resizes make new buckets).
- **`detailUnit`** turns a `DetailArt` into the `UnitFn` that `drawEnemy` already calls. Like the detailed aircraft it
  ignores the palette's colours and reads only `mono` / `live`: mono → the tinted sprite and the animated parts in
  the art's mono palette; not live (a wreck) → the burnt sprite, no animated parts' glow; else → the sprite and the
  animated parts (`under` below: legs, wakes; `over` on top: turrets that aim, rotors, glows).

## Business Rules

- `scaleBucket(m)` = max(1, ceil(2 · max(|col 1|, |col 2|)) / 2) of the transform (the scale a sprite is painted at).
- `variantOf(pal)`: `{ kind: 'mono', colour: pal.body }` when `pal.mono`; `{ kind: 'burnt' }` when not `pal.live`;
  else `{ kind: 'live' }`.
- `spriteKey(key, variant, k)` is unique per art key, variant (mono colours apart) and bucket.
- `shade(hex, k)`: k > 0 mixes toward white, k < 0 toward black, |k| ≤ 1; `mix(a, b, k)` linear in RGB; both return
  `#rrggbb`.
- Hitboxes, behaviours and data are untouched: the kit only draws.

## Data Flow

See `.mdd/audits/flow-detail-kit-2026-11-14.md`: `drawEnemy` → `DRAW[kind]` (a `detailUnit`) with `PALS[kind]`, `FLASH`,
the shadow's `SILHOUETTE` or the wreck's `BURNT` palette; the kit picks the variant from `mono` / `live`.

## Dependencies

- 104-tank-drive (the vehicles' motion values), 105-steppe-world (the first enemies to use it, wave 2).

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
