---
id: 76-world-looks
title: World Looks - The Docks to Scale, Their Map Buttons, Loadout Backgrounds per World, the Crew in Each World's Outfit
edition: TopRun
depends_on: [73-home-docks, 74-world-order, 33-image-portraits, 06-talking-characters]
relates: [73-home-docks, 74-world-order, 33-image-portraits, 06-talking-characters, 66-sub-kit, 55-shipyard, 30-hangar-base]
source_files:
  - src/game/kit.ts
  - src/main.ts
  - src/data/base-docks.ts
  - src/render/base/dock.ts
  - src/render/base/dock-globe.ts
  - src/render/base/dock-ambient.ts
  - src/render/base/ambient.ts
  - dev/scene-plates.py
  - src/render/base/cast.ts
  - src/scenes/hangar.ts
  - src/scenes/shipyard-view.ts
  - src/render/loadout-backdrop.ts
  - src/ui/picture-view.ts
  - src/scenes/shipyard.ts
  - src/scenes/outpost.ts
  - src/scenes/lab.ts
  - src/render/portraits/index.ts
  - src/ui/speech.ts
  - src/scenes/hangar-chief.ts
  - src/i18n/lines-launch-en.ts
  - src/i18n/lines-launch-de.ts
  - dev/crew-outfits.py
  - src/game/crew-looks.ts
  - src/scenes/dive-launch.ts
  - src/scenes/rocket-launch.ts
  - src/game/dialogue-scripts.ts
  - src/i18n/lines-en.ts
  - src/i18n/lines-de.ts
  - src/assets/docks/
  - src/assets/loadout/
  - src/assets/portraits/
routes: []
models: []
test_files:
  - tests/unit/route-kit.test.ts
  - tests/unit/crew-looks.test.ts
  - tests/unit/base-docks.test.ts
  - tests/unit/dialogue.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: complete
phase: all
mdd_version: 11
tags: [hangar-base, docks, loadout, portraits, crew, comfyui, map-4, map-5, underwater, space]
path: Game/Base/World Looks
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Fixed 2026-11-07: from the base the hangar opened the jets' LOADOUT on maps 3–5 — every route but the hangar and the map reset the kit to the jets, and the base is one. The hangar now takes the kit of the world the pilot is on (`routeKit(route, current, home)`)."
security_read_sites: []
sister_projects: []
---

# 76 — World Looks

## Purpose

Owner, 2026-11-07, after the docks (doc 73) and the world order (doc 74):

- *"In the space world make the windows the button to the map. In the deep sea place a globe in the room."*
- *"Generally, the person is too small in space and underwater scenario. Compare the height to the elements in the room.
  The problem is mainly that the spacecraft is too small in comparison. … Maybe let's create two new images for space
  with an additional hangar door where the spaceship is partially seen. The person should be to scale in all of them."*
- *"I do not see yet the new submarines in the loadout."* — from the base, the wrong hangar opened (answer to the question
  round).
- *"Create background images for the loadout screen. For each world a different one (fighter worlds the same)."*
- *"The mechanic and the lift-off crew person need also to be visually adapted to the new worlds."* — same people, new
  outfits (answer to the question round).
- *"Show the new images to me to decide."*

## The hangar from the base

`routeKit` reset the kit to the jets for every route but the hangar and the map; going to the base did, so the base's
craft area opened the jets' LOADOUT even on maps 3–5. The hangar now always shows the kit of the world the pilot is on
(`GameContext.home`, set by the map): the helicopters on map 3, the SUB PEN on map 4, the shipyard on map 5.

## The docks

- **Space lounge (doc 94, 2026-11-08):** the space dock is now the roomier lounge H81 in picture G's cozy style — the big
  square window with a planet and the starfighter (the craft), the holographic map table (the way to the map), a flat-screen
  TV, a big chalkboard; what follows of picture G and its portholes is history.
- **Sea lounge (doc 93, 2026-11-08):** the sea dock is now the bigger lounge D41 — the submarine's bow in a window filling
  the left wall, the globe and the TV with its video recorder painted into the picture, a big chalkboard; what follows of
  picture C, its round window and the globe drawn in code is history.
- **Map buttons:** in the space dock a porthole is the way to the map (the exit hatch is gone); in the sea dock a
  globe on a stand, drawn in code, stands in the room and is the way to the map (the hatch is gone too). The windows'
  and the globe's brackets pulse like every other area's.
- **To scale:** each dock has its own pilot scale and floor line (`DockLayout.pilot`), set so the pilot is as tall as the
  picture's lockers and doors say a grown-up is; the carrier hangar keeps its own. Since doc 92 the docks (not the
  jungle base) have depth: the scale is the front line's, and the pilot shrinks towards the picture's horizon — the sea
  dock's front scale is now 0.92, the space dock's 0.94, so beside the lockers at the back he is a little shorter than
  they are.
- **Space, new picture (G):** the first round (C–F: a room with a window and a big starfighter in a door) was turned down —
  *"they all look like a room with a window. Generally please more cozy. The fighter jet does not need to be that
  prominent … just hinted."* The second round's G is the space dock now: cozy crew quarters inside the hull — ribs and
  pipes, fairy lights, a couch on a rug, plants, the pink rec room alcove with the arcade, the lockers, the scoreboard
  over the chalkboard, a shelf of framed photos — with two portholes: the left one leads to the map, the right one shows
  a sliver of the docked starfighter and is the craft (the hangar). The joystick neon hangs over the rec room's door, the
  TV cart stands on the rug by the couch, the photo wall is the shelf. Its life: stars twinkling in the portholes, the
  fairy lights and three lamps glowing, warm dust motes. Pilot scale 0.86 (as tall as the lockers and the arcade; 0.94 on
  the front line since the dock has depth, doc 92).

## Loadout backgrounds

The loadout screen (the hangar, the SUB PEN, the shipyard) gets a generated picture per world behind its panels, dimmed so
the panels and texts stay readable: the carrier's hangar deck (maps 1–2), a helicopter base hangar (map 3), a submarine
pen (map 4), an orbital shipyard (map 5). `src/assets/loadout/<kit>.png` on the 320 × 180 art grid (the workflow's own
48-colour pixel branch, sampled at its art-pixel centres), drawn at 4 × under a wash of 36 % so the scene shows around and
through the panels. The owner took all four as rendered (2026-11-07); map 6's mech bay (`mech.png`) came with the
jungle planet (doc 86).

### Picture mode

Owner, 2026-11-08: *"Add a hide button in the hangar so one can admire the new backgrounds too."* The screens with a
generated picture behind their panels — the LOADOUT (every kit), the shipyard, the GROUND BASE and the LAB — have an
**eye button** beside their exits (the loadout and the shipyard: left of BASE; the ground base and the lab: left of
BACK) and the key **V**. It hides every panel, text, button and speech box and lifts the dark wash, so the picture shows
whole and at full brightness; the ground base keeps its buildings (they stand on the picture). Only the eye button
stays, faint, and a hint line that fades after three seconds. V, ESC, ENTER, a click or a tap anywhere brings the panels
back; nothing else reacts meanwhile (ESC does not leave the screen). The mode is the scene's own and starts off every
time the screen opens (`PictureView`, `src/ui/picture-view.ts`).

## The crew in each world's outfit

- Chief "Wrench" Kowalski (the mechanic) and Lt. "Shooter" Reyes (the launch officer) keep their faces (owner took all four,
  2026-11-07); under the sea the
  chief wears a submariner's coverall in a sub's machine room and Shooter is the diving officer in a sub's control room; in
  space the chief wears a station technician's suit in the station hangar and Shooter is the launch controller in front of
  the rocket on its pad. Maps 1–3 stay as they are.
- The portraits are klein edits of the base portrait only; their talk / half / blink frames are the base's with the
  original frame's eye and mouth pixels laid over (the frames differ from the base only there, doc 33).
- Which outfit shows follows the world: the hangar's chief by the kit's world (`kitCrewLook`), the launch officer by the
  mission's (`crewLook`); `portraitKey` names the file (`chief-sea`, `shooter-space`, …) and a missing one falls back to
  the carrier portrait. Shooter now calls the dive (map 4) and the rocket launch (map 5) as she calls the catapult
  launch: the flooding, the release, each dive grade; the countdown, the liftoff, each stage separation, the orbit — new
  lines in `src/i18n/lines-launch-en.ts` / `-de.ts`.
- The shipyard (map 5) has no room for the chief yet (grid, list and detail fill the screen); his space outfit is ready
  for when he gets a place there.
