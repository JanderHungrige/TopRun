---
id: 09-paint-jobs
title: Paint Jobs - Reward Liveries for the Player Jets
edition: TopRun
depends_on: [02-hangar-economy, 03-campaign-map, 06-talking-characters, 07-i18n]
relates: [02-hangar-economy, 03-campaign-map, 04-carrier-takeoff, 05-mission-combat, 06-talking-characters, 35-second-map, 36-new-jets]
source_files:
  - src/data/liveries.ts
  - src/game/liveries.ts
  - src/render/livery-art.ts
  - src/render/planes/livery-patterns.ts
  - src/render/planes/tail-art.ts
  - src/render/planes/paint-pass.ts
  - src/i18n/liveries-de.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
routes: []
models:
  - "SaveData.livery: Record<PlaneId, LiveryId> (per pilot, inside the profile store, doc 08)"
test_files:
  - tests/unit/liveries.test.ts
  - tests/unit/liveries-2.test.ts
data_flow: writes-existing
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [paint-jobs, liveries, camouflage, rewards, unlocks, hangar, debrief, f-14, f-16, sr-71, second-front, region-camo]
path: Game/PaintJobs
integration_contracts:
  - function: "drawPlaneTop(ctx, id, x, y, scale, { livery }) / drawPlaneSide(..., { livery })"
    when: "every place that draws the pilot's own jet passes its livery; the wingman, title fly-by and silhouettes stay standard"
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.livery parsed from the untrusted profile store)
sister_projects: []
---

# 09 — Paint Jobs

## Purpose

Rewards for campaign progress that the player can *see*: realistic military paint schemes for the
F-14, F-16 and SR-71. Beating a theater's boss unlocks a scheme; three stars on every mission of a
theater unlocks a rare one. The admiral announces each new scheme in the debrief, the player picks
one per jet in the hangar, and the jet wears it in the mission, on the carrier and in the hangar.

## Liveries

Eleven liveries. Each one is shared by all three jets (the art adapts it to each airframe). Names
are generic descriptions of real-world scheme types. The site and repo are public, so there are no
real squadron or team names, insignia, national markings or logos.

| id | EN name | DE name | Unlock | Look (all jets) |
|----|---------|---------|--------|-----------------|
| standard | Factory Standard | Werkslackierung | always | today's per-jet scheme: F-16 two-tone gray, F-14 low-vis gray, SR-71 black; A-10 two-tone grey, F-35 dark radar grey, Tornado grey-green splinter (doc 36, no insignia) |
| gullgray | Seventies Navy | Siebziger-Navy | boss Pacific (IRONCLAD) | glossy light gull gray, high-visibility tail: red with white chevrons, colourful wingtip bands |
| blackflag | Black Flag | Schwarze Flagge | 3★ Pacific | gray body, gloss-black tails with a white skull & crossbones, black/yellow nose stripe |
| desert | Desert Camo | Wüstentarnung | boss Gulf (SANDSTORM) | sand, brown and tan soft-edged camouflage blobs |
| sunburst | Sunburst | Sonnenaufgang | 3★ Gulf | light gray, red-orange sunburst rays on the tails, red nose band |
| arctic | Arctic Splinter | Arktis-Splitter | boss Arctic (BLACKJACK) | white, light gray and pale-blue angular splinter camouflage |
| aggressor | Aggressor Blue | Aggressor-Blau | 3★ Arctic | dark-blue, mid-blue and blue-gray splinter (adversary-squadron style) |
| woodland | European Woodland | Waldtarnung | boss Canyon (TYPHOON) | dark green and dark gray wraparound camouflage |
| tiger | Tiger Stripes | Tigerstreifen | 3★ Canyon | gray body, orange-and-black tiger stripes over tails, wingtips and nose |
| airshow | Air Show | Flugshow | boss Leviathan (LEVIATHAN) | white with sweeping red and blue stripes (demo-team style, no logos) |
| blackgold | Black & Gold | Schwarz-Gold | 3★ Leviathan | gloss black with gold trim lines and gold tails |

### Map 2 (Second Front wave 4, owner 2026-10-27)

"Camo/paints for the new jets and new camos to unlock in general." Ten more, shown in the PAINT tab only once
map 2 is open. Each map-2 theater has a **region camo that unlocks when the region opens** — its first mission
becomes playable (the previous theater's boss beaten; North Sea: mission 30 cleared) — so the pilot flies it where it
fits (owner: "the desert camo comes after winning the desert … let's shift it to just before the region starts";
map 1 follows in the Fair Challenge initiative). The rare one stays the 3★ reward.

| id | EN name | DE name | Unlock | Look |
|----|---------|---------|--------|------|
| seagrey | North Sea Grey | Nordsee-Grau | region North Sea opens | grey, slate and sea-green soft blobs |
| deepblue | Deep Blue | Tiefseeblau | 3★ North Sea | gloss navy blue, white wingtip bands, gold pinstripes |
| snowrock | Mountain Snow | Bergschnee | region Roof of the World opens | white with rock-brown and grey splinter |
| polarred | Polar Red | Polarrot | 3★ Roof of the World | white with high-visibility red wingtips, nose band, tails |
| jungle | Jungle | Dschungel | region Green Hell opens | tan with two jungle greens, soft blobs |
| emerald | Emerald | Smaragd | 3★ Green Hell | gloss emerald green, gold trim and gold tails |
| nightops | Night Ops | Nachteinsatz | region Desert Night opens | dark slate and navy splinter, low gloss |
| nighthawk | Night Hawk | Nachtfalke | 3★ Desert Night | matte black with dark-grey stripes and chevrons |
| stormgrey | Storm Ghost | Sturmgeist | region Operation Thunderhead opens | two-tone storm grey, dark-red tail band |
| legend | Top Gun Legend | Top-Gun-Legende | 3★ Operation Thunderhead | polished silver with gold sweep stripes and gold trim |

- PAINT tab with map 2 open: 21 rows in two columns (name and status stacked); the unlock line reads
  "Unlocks when {theater} opens".

## Architecture

```
data/liveries.ts      LIVERY_IDS, LIVERIES (id, EN name, unlock condition) — what exists
game/liveries.ts      unlockedLiveries / isLiveryUnlocked / newlyUnlocked / applyLivery /
                      liveryOf / parseLiveries — the rules (pure, tested)
render/livery-art.ts  how each livery looks: colours, camouflage pattern, tail art, swatch;
                      used by render/draw-planes.ts (top-down) and draw-planes-side.ts (side view)
i18n/liveries-de.ts   German names; content.ts liveryName() picks the language
```

Drawing: each airframe is drawn from parts (fuselage, wings, tails, intakes …). A livery sets
the base colours; a camouflage pattern is drawn clipped to the airframe's outline; tail art is
drawn on the fins; panel lines, canopy, glare and exhaust go on top. `shadow` / `flash` draws
ignore the livery.

## Data Model

```ts
type LiveryId = 'standard' | 'gullgray' | 'blackflag' | 'desert' | 'sunburst' | 'arctic' | 'aggressor'
              | 'woodland' | 'tiger' | 'airshow' | 'blackgold';
type LiveryUnlock = { theater: TheaterId; kind: 'boss' | 'stars' | 'region' } | null;   // null = always
SaveData.livery: Record<PlaneId, LiveryId>   // default: every jet 'standard'
PlayerStats.livery: LiveryId                 // the selected jet's livery, for the mission renderer
```

Unlocks are **derived from campaign progress**, never stored, so they cannot drift out of sync:
- `boss` — the theater's boss mission (its 6th) is in `progress` (cleared).
- `stars` — all six missions of the theater are in `progress` with 3 stars.
- `region` — the theater's first mission is unlocked (doc 03/35 unlock rules: the mission before it in its
  campaign is cleared; the first theater of map 2 needs mission 30). Both maps' missions count (`ALL_MISSIONS`).

## Business Rules

- `standard` is always unlocked. A fresh save has only `standard`.
- Unlocking is retroactive: a pilot who has already cleared theaters sees those liveries unlocked as
  soon as this version runs.
- **Hangar — PAINT tab** (4th tab, LACKIERUNG): lists all eleven liveries for the *selected* jet.
  - Each row shows a colour swatch and the name. Locked rows show a padlock and the unlock condition:
    "Beat {boss} — {theater}" / "3★ on every {theater} mission".
  - The detail panel previews the selected jet in that livery (top-down and side view), locked ones
    included, so the player sees what to fight for.
  - Action button: **APPLY** (free) for an unlocked livery not in use; **IN USE** (disabled) for the
    current one; **LOCKED** (disabled, condition as the note) otherwise.
  - Applying sets only the selected jet's livery; the crew chief comments ("Fresh paint!").
- **Debrief**: liveries unlocked by this mission (`newlyUnlocked(before, after)`) are announced
  by the admiral after the pay line, one line each ("The paint shop has something for you:
  {livery}. …"; the rare 3★ ones get their own line). A gold banner reads
  "NEW PAINT JOB: {livery}". If several unlock at once, all are listed in data order.
- **Where the livery shows**: mission (player jet), carrier launch (side view), hangar preview and the
  hangar JETS tab preview. Wingman, title fly-by, cockpit silhouettes and radar stay standard.
- **Save parsing**: `livery` is validated per jet. An unknown id, or a livery that the parsed
  progress has not unlocked, becomes `standard`. A missing field means all `standard`, so old saves
  load unchanged.

## Data Flow

Writes-existing: extends `SaveData` (02/08) with `livery`; reads `progress` (03). Debrief (03)
computes `newlyUnlocked` from the save before and after `applyResult`.

## Dependencies

02 (save, hangar, loadout/PlayerStats), 03 (progress, debrief), 06 (admiral, chief lines),
07 (EN/DE names and UI text). Art for the jets lives with 02/04 (draw-planes*.ts).

## Security

The livery field comes from the untrusted profile store: parsed against the id list and the unlock
rules (see Business Rules). No other input.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
