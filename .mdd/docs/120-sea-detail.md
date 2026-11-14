---
id: 120-sea-detail
title: Sea Detail - The 13 Enemies Under the Sea and Its Five Bosses Redrawn With Hulls, Hides and Lights
edition: TopRun
depends_on: [113-detail-kit, 115-steppe-enemy-detail, 116-steppe-boss-detail]
relates: []
source_files:
  - src/render/enemies/sea-pal.ts
  - src/render/enemies/sea-kit.ts
  - src/render/enemies/sea-arms.ts
  - src/render/enemies/sea-reef.ts
  - src/render/enemies/sea-flesh.ts
  - src/render/enemies/sea.ts
  - src/render/enemies/sea-2.ts
  - src/render/enemies/sea-deep.ts
  - src/render/enemies/creatures.ts
  - src/render/enemies/sea-fish.ts
  - src/render/enemies/sea-monster.ts
  - src/render/bosses-5.ts
  - src/render/bosses-5a.ts
  - src/render/bosses-5b.ts
  - src/render/boss-mounts-5.ts
  - src/render/bosses-later.ts
routes: []
models: []
test_files:
  - tests/unit/sea-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [enemies, bosses, sea, submarines, creatures, art, map-4]
path: Game/Art/Enemies
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-5
wave_status: complete
---

# 120 — Sea Detail

## Purpose

Owner, 2026-11-14: *"Auch die Gegner sollten detaillierter sein"* — question round: all of them, *"auch im Raumschiff,
jungle und uboot welt"*. The 13 enemies under the sea (mini-sub, sea drone, sea mine, sea turret, jelly, eel, hunter, torpedo boat, squid, crab, sea lab, angler, boomer; docs 68, 70) and its five bosses (BARRACUDA, MEDUSA, BASTION, GOLIATH, JORMUNGAND) are redrawn at the alien steppe's level of detail.

## The look

Submarines and machines with riveted hulls, portholes, props, sail fins, lamps; creatures with glossy translucent bodies, tentacles, scales, bioluminescent spots and veins; the bosses as sea monsters and a seabed fortress. Each keeps its identity.

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

Every kind is a `DetailArt` behind `detailUnit` with its static body cached (flash, shadow and wreck from the cache) and
its moving parts live; light from the upper left, fronts down (+y), the old colours, sizes and animations kept.

| kind / boss | what it now shows (live parts in italics) |
|---|---|
| mini-sub | riveted pressure hull rounded by the light, frames and ballast seams, a deck hatch and grab rail, the sail with masts and bridge, X-fins with yellow tips, the bow lamp in a yellow collar; *bronze screw turning, bubbles, the lamp's beam and glow* |
| sea drone | yellow torpedo with frames, a red nose band, a dark sensor nose, black-and-yellow hazard stripes, a ducted tail; *three-bladed screw, bubbles, a green nav light blinking* |
| sea mine | glossy black sphere with lead-capped horns round its rim and end-on on top, a welded belt with bolts, rust streaks, barnacles, the mooring eye and a broken chain; *the red lamp blinking* |
| seabed turret | an armoured, bolted collar on a faceted rock with coral polyps; *kelp swaying, twin barrels with muzzle brakes on a plated housing with a sight and hatch tracking the sub, the lamp flaring* |
| jellyfish | a glassy dome with radial and ring canals, four glowing gonads, the mouth and a gloss; *the frilled margin pulsing, frilly oral arms and fine stinging tentacles trailing, bioluminescent spots breathing* |
| electric eel | a flat head with rounded snout, yellow slit-pupil eyes, nostrils, gill slits and pectoral fins; *the body swims in waves (rounded, mottled, a translucent fin ribbon), the electric organ glows along the flanks and sparks crackle when it charges* |
| hunter sub | anechoic-tiled hull with frames, limber holes, a sonar dome, four launch hatches, the tall sail with masts and planes, an X-tail; *twin screws, bubbles, the red bow light blinking* |
| torpedo boat | seen from below: strakes, the flat of the bottom, a keel, bilge keels, rust-red torpedo sponsons with their mouths, shafts on brackets, rudders, a sonar bulb and an intake grille; *the bright skin of the water, bow foam, twin screws churning* |
| squid | a freckled mantle with its pen and a glassy rim, the head with silver-ringed eyes; *fins beating, eight arms with suckers and two feeding tentacles with clubs curling, chromatophores flushing* |
| giant crab | a granular carapace with grooves and a toothed front rim, stalked eyes, mouthparts, two heavy claws with toothed fingers; *six jointed legs stepping, the movable fingers snapping* |
| sea lab | four braced legs on bolted pads, a pipeline with flanges and a red valve wheel, a ring of plates and portholes round a geodesic glass dome; *portholes lighting in turn, vent bubbles, a two-missile launcher turning to the player* |
| anglerfish | a dark warty body with mottles, lateral lines and dorsal spines, a cavernous mouth with needle teeth of many lengths, small pale eyes; *tail and pectoral fins fluttering, the lure on its arched stalk swinging and glowing* |
| missile sub | long tiled hull with frames, limber holes, a lit turtleback of twelve missile hatches, escape hatches, the sail with masts and planes, tail planes and the upper rudder; *seven-bladed screw, bubbles, twin gun turret tracking the player, nav lights* |
| BARRACUDA | tiled hull with frames and limber holes, bow torpedo pods, sonar dome, towed-array fairing, the light sail with planes and masts, gun rings fore and aft, X-tail and rudder; *great screw, bubble trail, red bow lamp and beam*; mounts: bolted tube mouths with torpedo noses, triple and twin turrets on armoured rings |
| MEDUSA | a glassy dome with forking canals, four glowing gonads, the mouth's lips, freckles and a gloss; *the frilled margin pulsing, frilled oral arms and stinging tentacles streaming, rim lights breathing, a glow inside*; mounts: glands with veins and a rim of bumps, their cores glowing toward the player |
| BASTION | a faceted rock shelf with pebbles, branching coral and polyps, flanged pipes to four octagonal gun pads with hazard rings, a plated ring of windows round a geodesic glass dome, an airlock; *windows breathing, vent bubbles, a beacon*; mounts: single and twin turrets on armoured rings, a four-cell missile silo |
| GOLIATH | a freckled, rounded mantle with its pen, ribbed fin membranes, the head with eye sockets; *eight arms writhing with suckers, chromatophores flushing*; mounts: eyes whose amber iris and pupil follow the player, tentacle clubs ringed with suckers and hooks round a light organ, the ink sac with its siphon turned to the aim |
| JORMUNGAND | a scaled body (overlapping scales, the lit back, a dorsal fin of spines, glowing spots, a tail fluke) and the horned head with brow plates, glowing slit-pupil eyes, nostrils and a toothed maw; *the whole coil sways, its eyes glow*; mounts: a bony crest with three glands turning with the aim, glands along the body |

- Files: `sea-pal.ts` (the `SeaPal` palette, `seaMono`, `SEA_PAL`, `SEA_BOX`), `sea-kit.ts` (hulls, fins, sails, portholes,
  screws, bubbles, beams, lamps), `sea-arms.ts` (turrets, missiles, launchers, tube mouths, the mono-safe `blob`/`tone`),
  `sea-reef.ts` (rock, coral, polyps, pebbles, kelp), `sea-flesh.ts` (ribbons, flesh, suckers, fin rays), `sea-deep.ts`
  (crab, sea lab), `sea-fish.ts` (squid, angler), `sea-monster.ts` (jelly bell, serpent body and head for the bosses).
  `sea.ts`, `sea-2.ts`, `creatures.ts` keep their exports (`SEA_UNITS`, `SEA_UNITS_2`, `CREATURES`, `screwBlur`).
- Bosses: `bosses-5.ts` keeps `PALS_5`, `LIGHTS_5`, `ORGANIC`, `organPart` and adds `SEA_5`, `BOSS_BOX_5`, `liveOf`,
  `cachedHull`; the hulls are in `bosses-5a.ts` / `bosses-5b.ts`, and `HULLS_5` moved to `bosses-5b.ts` (bosses-later.ts
  imports it from there, avoiding a cycle). `MOUNTS_5` (boss-mounts-5.ts) gives every sea boss its own mounts.
- JORMUNGAND's whole coil moves: its cached sprite is drawn in 12-unit strips, each shifted by the wave that ran along
  the old spine points (`sin(1.4 t + (150 − y) / 64) · 6`), so the detailed body keeps its sway without being repainted.
- Bodies that swim (the eel, tentacles, arms) are drawn live as smooth tapered ribbons; the eel's head is cached and held
  still, the wave growing toward the tail. Jellies light their spots with plain dots instead of gradients (they come in
  swarms).

