---
id: 117-jungle-enemy-detail
title: Jungle Enemy Detail - The Jungle Planet's 22 Enemies Redrawn With Shaded Armour, Hides and Glowing Organs
edition: TopRun
depends_on: [113-detail-kit, 115-steppe-enemy-detail]
relates: [118-jungle-boss-detail]
source_files:
  - src/render/enemies/jungle-pal.ts
  - src/render/enemies/jungle-kit.ts
  - src/render/enemies/jungle.ts
  - src/render/enemies/jungle-craft.ts
  - src/render/enemies/jungle-creatures.ts
  - src/render/enemies/jungle-plants.ts
  - src/render/enemies/jungle-beasts.ts
  - src/render/enemies/jungle-hive.ts
  - src/render/enemies/jungle-floaters.ts
  - src/render/enemies/alien-ground.ts
  - src/render/enemies/alien-air.ts
routes: []
models: []
test_files:
  - tests/unit/jungle-enemy-detail.test.ts
data_flow: .mdd/audits/flow-detail-kit-2026-11-14.md
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [enemies, jungle, creatures, walkers, art, map-6]
path: Game/Art/Enemies
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: detail-art
wave: detail-art-wave-3
wave_status: complete
---

# 117 — Jungle Enemy Detail

## Purpose

Owner, 2026-11-14: *"Auch die Gegner sollten detaillierter sein"* — question round: all of them, *"auch im Raumschiff,
jungle und uboot welt"*. The jungle planet's 22 enemies (docs 81, 96) are redrawn at the alien steppe's level of detail.

## The look

The machines (walker, brute, hover tank, artillery, gun drone, dropship) as worn, plated war machines — panels, bolts, vents, hydraulics, glowing sensors; the creatures (raptor, beetle, spitter, wasp, spore pod, lasher, rhino, toad, spire, totem, lurker) and fliers (glider, leatherwing, dragonfly, balloon, sky jelly) with glossy hides, scales, chitin, membranes, veins and glowing eyes. Each keeps its identity: its shape, colours and animation.

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

| kind | what it now shows |
|---|---|
| walker | a worn plated hull (light top strip, engine grille, shoulder plates, hatch, exhaust stubs, two gun pods with grilles, the orange visor with its red sensor glowing) turning to its aim on a hip girder with two drums; hydraulic legs with pistons, splayed bolted feet striding |
| brute | the walker at 2.6× with hip armour and two missile racks of six red warheads on its shoulders |
| hover tank | a rubber-skirted hull with sponsons, a lit glacis, lift-fan grilles, tow hooks and a stowage box on a swirling dust cushion; the twin-barrel turret (mantlet, hatch, sensor) turning; the front lamps flickering |
| artillery | a dirt pit in a ring of tied sandbags with shells and a crate, the bolted turntable; the barrel with recoil cylinders, breech block, gun shield and slotted muzzle brake turning |
| gun drone | four ducted fans on struts round an armoured pod with seams, a chin gun and an antenna; the blades spinning in their wells, the red eye pulsing |
| dropship | a plated lifting body with a raised spine, troop-bay doors, framed canopy, nacelles with intakes and nozzles, missile pods, tail fins and the red tail band; engines burning, wingtip lights blinking |
| raptor | a scaled hide with dark chevrons and a quill crest, small clawed arms, a long snout with yellow eyes; clawed legs running, the banded tail swaying |
| beetle | glossy steel-blue wing cases with gold seams and rows of pits, the thorax shield, a dark head with compound eyes and antennae; six legs rowing, gold mandibles biting |
| spitter | a rosette of short leaves round a thorny stem, six big veined leaves swaying; two glossy pink jaw halves with white teeth parting toward the aim round a glowing throat |
| wasp | a banded abdomen with its sting, a furred thorax, red compound eyes, mandibles; two pairs of veined wings buzzing, legs twitching |
| spore pod | a fleshy root crown on seven creeping roots; the cluster of glossy veined pods breathing, spores and heart glowing in time |
| lasher | a ridged bulb on a ring of broad leaves; five thorned tendrils whipping; the toothed maw with its glowing throat gaping toward the aim |
| rhino | a scaled hide under four bands of knobbed armour, flank spikes, scars, ears, a great horn and a lesser one, glowing red eyes; four clawed feet pounding |
| toad | a mottled, warty body with glandular ridges that swells as it hops, webbed front feet, folded hind legs kicking; the acid-green throat sac glowing, bulging yellow eyes |
| brood spire | a stepped chitin mound with radial ribs, a ring of thorns and four fleshy vents breathing a pink glow round its glowing mouth; larvae crawling round its foot |
| crystal totem | a carved stone block with a raised centre, notched glyph borders, cracks and moss; the faceted crystal turning in its socket, its white core pulsing |
| swamp lurker | a back of crocodilian scutes with a spiked ridge rising and sinking under the water among the ripples; eye bulges and nostrils above it, slit pupils blinking |
| glider | wide ribbed wings beating round a dark plated body with a light stripe, gill slits, horn-like fins and teal eyes; glowing spots on the wings, the whip tail swaying |
| leatherwing | a furred body with a shaded beak and crest; leathery wings on finger bones with a wrist claw, flapping |
| dragonfly | a banded abdomen with claspers, a striped thorax, huge red compound eyes, small legs; four veined wings buzzing |
| spore balloon | a ribbed, veined gas bag with a pale inner chamber, its outer skin swelling and sinking; spores glowing inside; tendrils with glossy sacs swaying |
| sky jelly | a translucent pink bell with radial canals, a scalloped rim and a glossy body round its dark core, its skirt pulsing; rim lights running; tentacles trailing |

- `jungle-pal.ts` holds the world palette (`JunglePal`, `jungleMono`), each kind's colours (`JUNGLE_PAL`, from the old
  per-kind palettes) and the cached-body boxes (`JUNGLE_BOX`); `jungle-kit.ts` the shared pieces: `cachedPart` (a
  moving part that keeps its shape — a turning hull or turret, a jaw, a leaf, a foot — painted once through the sprite
  cache and drawn in the variant the palette asks for; `variantFor` maps detailUnit's wreck colour to the sooted sprite),
  `glowOf`, `orb` (a shell that turns plain in one-colour passes), `fang`, `taper`, `quadAt`, `scaleRows`, `warts`,
  `wear`, `armour` and `insectWing`.
- The kinds are split by family: `jungle.ts` (walker, brute, hover tank, artillery), `jungle-craft.ts` (gun drone,
  dropship), `jungle-creatures.ts` (raptor, beetle, wasp), `jungle-plants.ts` (spitter, spore pod, lasher),
  `jungle-beasts.ts` (rhino, toad, lurker), `jungle-hive.ts` (spire, totem), `alien-air.ts` (glider, leatherwing,
  dragonfly), `jungle-floaters.ts` (balloon, sky jelly); the exported tables and `*Pals` keep their names.
- What breathes, swells or hops (spore pod, toad, balloon, sky jelly) is a cached sprite scaled live, or the cached body
  at its smallest with the swelling skin drawn round it, so the animations stay as they were.
- Small changes for readability: the spitter's jaw halves now part outward, the wasp's wings sweep back, the
  leatherwing's arm runs along the front edge of its wings; the brute's racks and the walker's hull also show in the
  flash and the shadow; the hover tank leaves no dust cushion under its wreck.
- The brute does not appear in `dev/art-detail.html?world=6` (it joins through reinforcements, not the pools); it was
  checked by drawing it into the same page.

