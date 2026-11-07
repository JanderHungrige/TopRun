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
  - src/render/base/cast.ts
  - src/scenes/hangar.ts
  - src/scenes/shipyard-view.ts
  - src/render/loadout-backdrop.ts
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
last_synced: 2026-11-07
status: in_progress
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

- **Map buttons:** in the space dock the big windows are the way to the map (the exit hatch is gone); in the sea dock a
  globe on a stand, drawn in code, stands in the room and is the way to the map (the hatch is gone too). The windows'
  and the globe's brackets pulse like every other area's.
- **To scale:** each dock has its own pilot scale and floor line (`DockLayout.pilot`), set so the pilot is as tall as the
  picture's lockers and doors say a grown-up is; the carrier hangar keeps its own.
- **Space, new pictures:** two new space docks with a hangar door through which only part of an enormous starfighter is
  seen (its nose, cockpit and front gear), so the craft is big next to the pilot — like the sea dock's sub seen through the
  window. The owner picks one; it replaces `space.png` with its areas, board, slate, TV and neon positions measured on it.

## Loadout backgrounds

The loadout screen (the hangar, the SUB PEN, the shipyard) gets a generated picture per world behind its panels, dimmed so
the panels and texts stay readable: the carrier's hangar deck (maps 1–2), a helicopter base hangar (map 3), a submarine
pen (map 4), an orbital shipyard (map 5). `src/assets/loadout/<kit>.png` on the 320 × 180 art grid, drawn at 4 × with a
dark wash.

## The crew in each world's outfit

- Chief "Wrench" Kowalski (the mechanic) and Lt. "Shooter" Reyes (the launch officer) keep their faces; under the sea the
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
