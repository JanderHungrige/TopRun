---
id: 118-jungle-boss-detail
title: Jungle Boss Detail - RAVAGER, MANTIS, BASILISK, SENTINEL and the HIVE QUEEN Redrawn in Detail
edition: TopRun
depends_on: [113-detail-kit, 116-steppe-boss-detail, 117-jungle-enemy-detail]
relates: [117-jungle-enemy-detail]
source_files:
  - src/render/bosses-6.ts
  - src/render/bosses-6a.ts
  - src/render/bosses-6b.ts
  - src/render/bosses-6c.ts
  - src/render/boss-mounts-6.ts
  - src/render/bosses-later.ts
routes: []
models: []
test_files:
  - tests/unit/jungle-boss-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [bosses, jungle, art, map-6, mounts]
path: Game/Art/Bosses
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-3
wave_status: complete
---

# 118 — Jungle Boss Detail

## Purpose

Owner, 2026-11-14: *"Auch die Gegner sollten detaillierter sein"* — question round: all of them, *"auch im Raumschiff,
jungle und uboot welt"*. The jungle planet's five bosses (doc 81) are redrawn at the detail of their army (doc 117).

## The look

RAVAGER (the assault walker), MANTIS (the bio-machine), BASILISK (the swamp beast), SENTINEL (the stone guardian) and the HIVE QUEEN, each keeping its silhouette, colours and moving parts; their parts as the world's own mounts (organs for the creatures).

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

| boss | hull | its parts (MOUNTS_6) |
|---|---|---|
| RAVAGER | a worn armoured body with a light top plate, side skirts, engine grilles, exhaust stacks smoking, a hatch, the cockpit's glowing visor, the rack base's red lamps, two gun pods on hydraulic hoses with arm cannons; hydraulic legs with pistons, bolted feet striding | autocannon turrets (aimed), a triple gun (spread3), a six-tube missile box (missile) |
| MANTIS | a banded, bolted abdomen, a thorax laced with cables and vents, the triangular head with yellow compound eyes and mouthparts; six jointed legs stepping, veined wings quivering, serrated scythes swaying | claw tips on venom glands turned to the aim, three ocelli, the sting on its venom sac |
| BASILISK | a scaled, mottled hide with rows of bony knobs and golden dorsal spines, weed hanging, the long head with nostrils, teeth, brow ridges and glowing eyes; four clawed legs paddling, the banded tail sweeping | its maw (teeth, glowing throat) turned to the aim, quill clusters, the spiked tail club |
| SENTINEL | carved stone blocks with masonry joints, a glyph ring round the core, cracks with crystal veins, moss and a hanging vine, the carved head with three glowing eyes; the stone fists bobbing, the core glowing | the crystal eye in its carved socket (its pupil on the target), crystal palms turned to the aim, the crystal crown |
| HIVE QUEEN | a glossy banded abdomen with veins, egg sacs glowing in it and an ovipositor, the plated thorax, the head with mandibles, the golden crown and pink eyes; two pairs of veined wings beating | her maw between the mandibles, wing-root glands with barbs, the egg sac with eggs showing, the ovipositor's tip |

- `bosses-6.ts` keeps `PALS_6`, `LIGHTS_6`, `ORGANIC_6` and adds `BOSS_BOX_6`, `JUNGLE_6` (the hulls' detail palettes),
  `liveOf` and `cachedHull`; the hulls are in `bosses-6a.ts` (RAVAGER, SENTINEL), `bosses-6b.ts` (MANTIS, HIVE QUEEN)
  and `bosses-6c.ts` (BASILISK and `HULLS_6`, imported by bosses-later.ts from there to avoid an import cycle).
- The moving rigid parts (the RAVAGER's feet, the SENTINEL's fists, the MANTIS's scythes) are cached sprites too
  (`cachedPart`, doc 117); mount housings are cached per boss, weapon and radius, barrels and organs drawn live.
- Mounts get no time, so they do not pulse; the glowing egg sacs, core and eyes pulse in the hulls.

