---
id: 115-steppe-enemy-detail
title: Steppe Enemy Detail - The Alien Invasion Army Redrawn With Shaded Chitin, Jointed Limbs and Glowing Organs
edition: TopRun
depends_on: [113-detail-kit, 105-steppe-world]
relates: [116-steppe-boss-detail]
source_files:
  - src/render/detail/organic.ts
  - src/render/enemies/steppe-pal.ts
  - src/render/enemies/steppe-kit.ts
  - src/render/enemies/steppe-army.ts
  - src/render/enemies/steppe-beasts.ts
  - src/render/enemies/steppe-machines.ts
  - src/render/enemies/steppe-air.ts
  - dev/art-detail.ts
  - dev/art-detail-kinds.ts
routes: []
models: []
test_files:
  - tests/unit/steppe-enemy-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [enemies, aliens, art, chitin, creatures, machines, steppe, map-7]
path: Game/Art/Enemies
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-2
wave_status: complete
---

# 115 — Steppe Enemy Detail

## Purpose

Owner, 2026-11-14: *"Auch die Gegner sollten detaillierter sein."* The thirteen kinds of the alien steppe's invasion army
(doc 105) are redrawn with the detail kit (doc 113): shaded chitin, jointed limbs, armour plates, vents, cables and glowing
organs, at the level of the jets.

## The look

One faction: violet-grey bio-armour with a gloss (light from the upper left), darker chitin seams, teal emissive trim,
magenta glowing eyes and cores. Generic aliens, no copied designs.

| kind | what is drawn |
|---|---|
| crawler | segmented abdomen with dorsal spines and a teal stripe, thorax, head with three pairs of glowing eyes; six jointed legs scuttling; mandibles biting |
| trooper | armoured shoulders and pauldrons, a power-cell backpack, the plasma rifle turning to its aim, the domed helmet with its visor; feet stepping |
| rider | a six-legged horned beast (banded hide, saddle cloth, armour on the brow, glowing eyes, a whipping tail) with an armoured rider whose lance-rifle aims |
| landing pod | the scorched crater with thrown-up rocks, the pod's ribbed core and four armoured petals opening and closing, its core pulsing |
| shield bearer | a heavy trooper behind a curved shield with emitter studs; the shimmer of its cover around it (live only) |
| brood carrier | a bloated translucent brood sac with veins and crawlers moving inside, plated head and legs |
| tripod | a domed hull with armour panels, vents and a teal light band, three long hydraulic legs striding, the heat-ray emitter glowing hotter before it fires |
| siege crawler | an armoured beetle of overlapping plates with bolts, eight stubby legs, the lobbing tube turning to its target |
| plasma cannon | a ring of bio-sacs, a hexagonal base with cables and panels, twin coil barrels turning, the core glowing |
| war tripod | the tripod at twice the size: an armoured head with a visor slit, missile pods, two emitters, heavy legs |
| scout disc | a small saucer with rim panels and a dome, lights running round the rim |
| disc fighter | a saucer with two forward prongs carrying cannons, cockpit dome, panel lines, rim lights, the engine glow |
| manta | a bio-machine ray: wing membranes with ribs beating slowly, the plated body, bomb sacs, eyes, a long tail |

## Architecture

- `detail/organic.ts` — painters for creatures and alien machines: `shell` (a glossy segmented ellipse), `plateShell`
  (a chitin plate), `limb` (a jointed leg: outline, colour, highlight, joints), `eyes`, `veins`, `spines`, `membrane`.
- `enemies/steppe-pal.ts` — the faction palette (`AlienPal`, its mono version) and the per-kind colours.
- `steppe-army.ts` (crawler, trooper, shield bearer, landing pod), `steppe-beasts.ts` (rider, brood carrier),
  `steppe-machines.ts`, `steppe-air.ts` — each kind a `DetailArt` behind `detailUnit` (doc 113): the static body cached,
  the moving parts (`under`: legs, tails, wings, the shimmer; `over`: rifles and tubes that aim, mandibles, glows,
  rim lights) drawn live in the art's palette or its one-colour version.
- The exports keep their names (`STEPPE_ARMY`, `STEPPE_MACHINES`, `STEPPE_AIR` and their `*Pals`), so `drawEnemy`,
  the wrecks and the shadow sprites take the new art without change.

## Business Rules

- Each kind's static box covers its hit radius (data/enemies-7.ts) and stays within 1.6 radii (legs and wings excepted,
  they are drawn live); `ART_BOX` holds them, tested against `ENEMIES_7`.
- The mono palette has every colour the same and `mono: true` (no glows, no shimmer); the burnt wreck draws no glow.
- Fronts point down (+y); the aim angle rotates rifles and tubes as before (`aim − π`).

## Verification

Unit: `steppe-enemy-detail.test.ts` (boxes against the radii, mono palettes uniform). Browser: `dev/art-detail.html` —
every kind large and at mission size, flashed, as a shadow and as a wreck; a drive and a defence mission.

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)

## As built (2026-11-14)

- `steppe-kit.ts` holds what the army files share (a kind's art from its palette and box, six scuttling legs, the
  helmet, the rifle), so steppe-army.ts and steppe-beasts.ts import it instead of each other.
- One-colour passes: the live parts check `p.mono` before anything with fixed colours (glows, eyes, gradients, the
  manta's membranes, the siege crawler's muzzle cylinder), so the flash and the shadow stay clean silhouettes.
- `dev/art-detail.html?world=7` (and `&part=bosses`) shows every kind large, at mission size, flashed, as its shadow
  and as a wreck; it draws once at a fixed time so a hidden tab renders it.
