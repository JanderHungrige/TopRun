---
id: 97-world-intros
title: World Intros - Duke Welcomes the Pilot to Each New World in a Short Pixel-Art Film, Worlds 2 to 6
edition: TopRun
depends_on: [64-world-celebrations, 76-world-looks, 06-talking-characters, 63-hangar-tv]
relates: [64-world-celebrations, 76-world-looks, 63-hangar-tv, 98-ceremony-looks]
source_files:
  - src/game/intro.ts
  - src/game/save.ts
  - src/game/crew-looks.ts
  - src/game/tapes.ts
  - src/scenes/intro.ts
  - src/scenes/map.ts
  - src/scenes/tapes.ts
  - src/scenes/routes.ts
  - src/render/intro.ts
  - src/render/portraits/index.ts
  - src/i18n/lines-intro-en.ts
  - src/i18n/lines-intro-de.ts
  - src/assets/intros/
  - src/assets/portraits/
  - dev/finale-plates.py
  - dev/crew-outfits.py
routes: []
models:
  - "SaveData.intros: CampaignId[] — the worlds whose welcome the pilot has seen"
test_files:
  - tests/unit/intro.test.ts
data_flow: writes-existing
last_synced: 2026-11-13
status: complete
phase: all
mdd_version: 11
tags: [intro, cut-scene, key-frames, comfyui, duke, wingman, portraits, tapes, map-2, map-3, map-4, map-5, map-6]
path: Game/Campaign/World Intros
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.intros is read from the untrusted profile store / cloud save)
sister_projects: []
---

# 97 — World Intros

## Purpose

Owner, 2026-11-09: *"Can we have a welcome movie / intro? Our friend in a jungle warrior outfit, giving a welcome to the
jungle planet X354b and telling about the struggles and enemies. … For space … a welcome story with our friend welcoming
us to a space station. He is in a star-wars-themed space helmet."* — then: *"I mean an intro to each new world except 1
and 2."* Question round: the friend is **Lt. "Duke" Carter** (the wingman); the intro is made **like the world
celebrations** (doc 64).

## The film

Each of worlds 2–6 has four generated pixel-art key frames and Duke telling the story in the speech box, one line per
shot, his portrait in that world's outfit; then a title card. About 36 s, the world's own music.

| time | what |
|---|---|
| 0–8 s | shot a, fading in from black; Duke's first line (the welcome, with the callsign) |
| 8–16 s | shot b (cross-fade 1 s); the second line (the world and its theaters) |
| 16–24 s | shot c; the third line (the enemies, the struggle) |
| 24–32 s | shot d; the fourth line (the bosses ahead, the send-off) |
| 32–37 s | the title card: WELCOME TO — the world's place — WORLD n · its name; fade to black, then `then` |

- **Camera:** every shot pans slowly over its plate. The plate is drawn at 5 logical px per art px (1600 × 900, so the
  screen shows 256 × 144 of its 320 × 180 art px) and the window moves in whole logical px along the shot's path (e.g.
  left → right, top → bottom); the pixels stay square and equal, nothing shimmers. `introCamera(world, shot, u)` (pure,
  `src/game/intro.ts`) gives the offset, always inside the plate.
- **Overlays** in whole art px (4 logical px), drawn over the pan: world 3 falling snow, world 4 rising bubbles, world 5
  drifting specks of starlight, world 6 fireflies and drifting spores.
- **Controls:** ENTER / tap goes to the next shot (the card after the last), ESC ends it. The hint "ENTER next · ESC
  skip" sits top right, like the celebration's.
- **Pure timeline** (`src/game/intro.ts`): `introBeat(t)` → the shot, the shot fading out and how far, black, the card,
  the end; `introNext(t)` → the time ENTER jumps to; `INTRO_WORLDS` = 2, 3, 4, 5, 6 (2 since 2026-11-13).

## The key frames (`src/assets/intros/`)

"Top Gun pixel scene 16:9" on the PC (FLUX.2 klein 4B, 4 steps), the gritty style sentence of the jungle camp (doc 95),
composed with room around the subject for the pan; `dev/finale-plates.py` (doc 64's pipeline, now also given the out
name) puts each world's four on the 320 × 180 grid with one shared 48-colour palette: `i<world><a–d>.png`. No text,
letters, logos, insignia, flags or national markings; no children; generic craft and uniforms; Duke himself is only in the
speech box, never in the frames.

| world | a | b | c | d |
|---|---|---|---|---|
| 3 — Low Level | dawn: helicopters flying low through a deep fjord between snowy cliffs | the forward base on a mountain shelf: helipad, tents, fuel drums, mechanics | a hidden valley at dusk: SAM launchers and anti-aircraft guns under camouflage nets, tanks on the road, smoke | a dark volcanic island under ash clouds, a fortress on the crater rim, lightning |
| 4 — Deep Water | a submarine diving from the bright surface into blue water, sun shafts | the sea-floor base: domes and tubes on the seabed under lamps, small subs docking | hunter submarines and sea turrets in a field of shipwrecks, a giant squid in the shadows | the abyss: glowing angler fish over a black trench, a monstrous shape far below |
| 5 — Deep Space | a huge ring-shaped space station over a blue planet, shuttles | inside the station's vast hangar: rows of starfighters, crew in orange flight suits | a swarm of raider starfighters and a corvette attacking near the asteroid belt, laser fire | a colossal dark warship emerging from a nebula behind a ringed gas giant |
| 6 — X354b | a dropship descending through clouds over an endless alien rainforest, two moons | the run-down jungle field camp under camouflage nets, mechs, soldiers | an alien swamp: spore pods, a tentacle plant, acid toads, an enemy walker in the ruins | the hive on the horizon: purple organic mounds with glowing pods under a storm |

### The renders used

All sixteen on the PC (GTX 1080, about a minute each), seed 7, except 4a (seed 11: seed 7 drew little picture tiles into
a corner), 4d (seed 11: seed 7 turned the anglers into hanging lanterns) and 5d (seed 11, "no watermark, no inset
picture": seed 7 signed itself with fake lettering and a portrait). 5b keeps a strip of fake lettering along its bottom
edge, which its pan (y 18) never shows.

## Duke in each world's outfit

Duke keeps his face; his portrait is edited into each world's outfit like the crew's (doc 76, `dev/crew-outfits.py`,
the talk / half / blink frames transplanted): **mountain** (world 3) a cold-weather flight jacket with a fur collar and a
helicopter helmet with the visor up, a snowy forward base behind; **sea** (world 4) a navy submariner's coverall and
headset in a submarine's red-lit control room; **space** (world 5) an orange flight suit and an original white space-pilot
helmet with a raised dark visor, rounded, with orange trim — space-opera in spirit, no copy of a film's helmet, no
emblems — the station hangar behind; **jungle** (world 6) no helmet: an olive bandana, camouflage paint stripes on the
face, a worn camouflage shirt and a battered tactical vest, the rainforest behind.

- **The renders:** the flight-helmet edit workflow, seed 7. Mountain, sea and space on the PC from Duke's carrier portrait
  (uploaded small, 240 × 288); jungle on the M1 from his helmet-less raw. The mountain's first render put the helicopter's
  rotor right over his helmet and a second (seed 11) moved his head; the kept one says "head position … exactly the same"
  and parks the helicopter far off in a corner.
- `dev/crew-outfits.py` now keeps one palette slot for the picture's own white (teeth and eye whites went mint in the
  jungle's green palette) and lays the talk / half / blink pixels where the new face sits (the shift that best matches
  the old face, within 16 px; all four came out at 0, 0).
- World 3 gets its own crew look, `mountain` (`crewLook(3)`): only Duke has a portrait for it, everyone else falls back
  to the carrier's (`portraitKey` falls back when a file is missing, doc 76).
- Duke now has an outfit per world (`portraitKey` gives `wingman-<look>`), so on the mission radio he wears it too.

## When it plays

- **Once, on arrival:** when the campaign map shows a world of `INTRO_WORLDS` whose welcome this pilot has not seen
  (`introDue(save, world)`, pure) — the map opening on it, or the globe's picker switching to it — the map hands over to
  `{ to: 'intro', world, then: { to: 'map', select } }`. When the film ends (or is skipped) the world goes into
  `save.intros` (`markIntroSeen`, pure) through `setSave`. Pilots already on a world see its welcome once, the next
  time its map shows.
- **Again from the TV** (doc 63): the tape shelf's tape of a world has two recordings, the **welcome** (once seen) and the
  **victory** (once the world is finished, doc 64). `tapeShelf` lists both; ←/→ switches the side of the picked tape,
  ENTER / tap plays it; a tape with neither stays "not recorded yet".

## The second front (2026-11-13)

Owner, 2026-11-13: *"The second world needs an intro too. They're great."* World 2 joins `INTRO_WORLDS` (2–6): Duke
in his own flight gear (the carrier look, his usual portrait) welcomes the pilot to the second front; the card reads
WELCOME TO THE SECOND FRONT / WILLKOMMEN AN DER ZWEITEN FRONT; the overlay is rain driving across the storm. Pilots
already on map 2 see it once the next time map 2 shows; the TV's world-2 tape gets its welcome side.

| a | b | c | d |
|---|---|---|---|
| dawn on a grey-green northern sea in a storm: the carrier ploughing through the waves, jets on deck, oil rigs with burning flare stacks on the horizon | sunrise on the flight deck: the three new jets (a straight-winged ground-attack jet with rear engines and a nose gun, a stealth fighter, a swing-wing strike jet) with deck crew | the armoured train with gun turrets crossing an iron bridge over a jungle gorge | the colossal flying fortress in a dark red thunderstorm over a black sea, escort fighters, lightning |

Renders (the PC, "Top Gun pixel scene 16:9"): 2a and 2c seed 7; 2b seed 11 (seed 7 drew the ground-attack jet with a
gun barrel reaching into its neighbour), 2d seed 11 with "the whole frame is the scene itself: no watermark, no inset
picture …" (seed 7 signed itself with a fake logo and a portrait in a corner). Pans: 2a from the rigs down to the
carrier, 2b along the three jets, 2c from the trees to the train, 2d up towards the fortress.

Duke's lines (EN): *"Welcome to the second front, {callsign}! Duke here. Same carrier, colder water, and a meaner
enemy."* · *"We get new birds for this one: the A-10, the F-35 and the Tornado. Each has a trick of its own. Learn
them."* · *"North Sea rigs, the roof of the world, a green hell of a jungle and the desert at night. They guard every
one with a monster."* · *"And somewhere in the storm waits their flying fortress, the Colossus. Let's go bring it down.
Wheels up!"*

## Fixes to world 3's frames (2026-11-13)

Owner: *"In the heli video pictures 2 and 3 aren't right. Picture 2 is great, but there are too many tail parts.
Picture 3 has odd-looking roads in the mountains."*

- **3b:** the helicopter had a second tail boom sticking out to the left of its cabin. Four inpaint runs (doc 93's
  workflow in editor mode: the left boom, the right one instead, the whole helicopter redrawn) all drew the same
  two-tailed helicopter again — the editor keeps the reference's shapes. So the boom was covered by hand: the patch of
  mountain slope right beside it (222 px to the left on the 1280 × 720 render) pasted over it with a soft edge; the rest
  of the picture is untouched, and the helicopter now reads nose left, one tail right.
- **3c:** rendered again with the tanks on "a narrow gravel track beside a small river at the bottom of the valley
  floor … no bridges, no paved roads and no roads on the steep slopes" (the old frame had a road running into a
  launcher tower and another on a bridge across the slope). Of seeds 7, 11 and 23 the owner chose 7: a column of tanks
  on the gravel track in the valley floor, guns under nets on the slopes, tracers into the sky.
- World 3's four plates were rebuilt together (`dev/finale-plates.py --intro`, one shared palette).

## Business Rules

- Route `{ to: 'intro'; world: CampaignId; then: Route }`.
- `SaveData.intros`: parsed from untrusted JSON as the distinct members of `INTRO_WORLDS` (anything else dropped),
  `[]` by default; the admin view keeps it.
- Lines: `duke.intro<w><a–d>` in `src/i18n/lines-intro-en.ts` / `-de.ts`, `{callsign}` in the first; UI strings
  `intro.*` in both UI files.
- Generated illustrations of nobody real; Duke is the game's own fictional wingman.

## Duke's lines (EN)

| world | a | b | c | d |
|---|---|---|---|---|
| 3 | Welcome to low level, {callsign}! Duke here. Up north we fly under their radar, and that means helicopters. | Fjords, mountain passes, a river delta, red mesas and an island buried in ash. Every one hides a forward base. | They've tucked Hind gunships, Shilkas and SAM sites into every valley. Hug the ground and they won't see you coming. | And behind it all wait their big ones. We clear the valleys first, then we go hunting. Rotors up! |
| 4 | Welcome to the deep, {callsign}! Duke here, wet for once. Our base sits on the sea floor now. | Coral reefs, kelp forests, a field of wrecks, and below them the trench and the abyss, where the light ends. | Hunter subs, minisubs and sea turrets, and the sea bites back too: squids, eels, giant crabs, anglers in the dark. | Watch your hull. Down here nobody hears you call for help. Dive, dive, dive! |
| 5 | Welcome aboard Station Aurora, {callsign}! Duke here. Mind your step, the gravity has moods. | From here we hold low orbit, the asteroid belt, the lunar front, the ring giant, and then deep space. | Raiders and interceptors come in fast, satellite guns cover the lanes and their corvettes hit hard. | Nobody has fought out there before. Your starfighter is fuelled in the hangar. Let's fly where the stars are. |
| 6 | Welcome to X354b, {callsign}! Duke here. They dropped me in ahead of you. Mind the mud, it bites. | No runways, no ocean, just jungle: the canopy, a mangrove swamp, temple ruins, and the hive at the heart of it. | Walkers and hover tanks hold the clearings, and the planet itself wants us gone: spore pods, lasher vines, acid toads. | We walk in mechs here, one theater at a time, right up to the queen in her hive. Stay on my wing. |

## Known Issues

(none)
