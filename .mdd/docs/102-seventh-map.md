---
id: 102-seventh-map
title: Seventh Map - The Alien Steppe of Kharsa, m181–m210, Drives and Defences in Turn
edition: TopRun
depends_on: [78-sixth-map, 74-world-order, 03-campaign-map]
relates: [103-tank-kit, 104-tank-drive, 105-steppe-world, 106-tower-defence]
source_files:
  - src/data/types.ts
  - src/data/theaters-7.ts
  - src/data/theaters.ts
  - src/data/missions-7.ts
  - src/data/missions.ts
  - src/data/mission-build.ts
  - src/data/reinforcements.ts
  - src/data/photo-looks.ts
  - src/game/map-three.ts
  - src/game/progress.ts
  - src/game/objectives.ts
  - src/game/dialogue-scripts.ts
  - src/i18n/missions-7-de.ts
  - src/i18n/missions-de.ts
  - src/i18n/lines-steppe-en.ts
  - src/i18n/lines-steppe-de.ts
  - src/i18n/ui-en-steppe.ts
  - src/i18n/ui-de-steppe.ts
  - src/i18n/content.ts
  - src/scenes/map.ts
  - src/scenes/map-render.ts
  - src/scenes/map-globe.ts
  - src/scenes/debrief.ts
  - src/scenes/routes.ts
  - src/data/base-areas.ts
  - src/game/ceremony-stage.ts
  - src/game/crew-looks.ts
routes: []
models: []
test_files:
  - tests/unit/missions-7.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: all
mdd_version: 11
tags: [map-7, steppe, aliens, campaign, theaters, bosses, tanks, tower-defence, balance]
path: Game/Campaign/Seventh Map
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
initiative: alien-steppe
wave: alien-steppe-wave-1
wave_status: complete
---

# 102 — Seventh Map: the Alien Steppe

## Purpose

Owner, 2026-11-14: *"Lass uns eine neue welt generieren. Mit allem drum und drann. … Machen wir einen mix aus arcade und
tower defence. Die neue welt ist eine steppenwelt mit aliens."* After the jungle's finale (HIVE QUEEN, m180) the fleet
lands on **Kharsa**, a steppe planet an alien army is overrunning. Map 7 is a full map like the others: 30 missions in
five theaters, a boss each, a mini-boss, a launch game, seven medals and a celebration. Its missions **alternate**
between the arcade drive and **tower defence** (doc 106).

## The map

| theater | id | missions | tagline | boss |
|---|---|---|---|---|
| Sea of Grass | `grass` | m181–m186 | Waves of gold | HARVESTER, reaper machine |
| Salt Flats | `saltflats` | m187–m192 | White and blinding | LONGSHANKS, giant tripod |
| Red Badlands | `badlands` | m193–m198 | Mesas and gullies | JUGGERNAUT, siege beast |
| Barrow Fields | `barrows` | m199–m204 | Dust over the old mounds | DREADNOUGHT, siege ship |
| The Crater | `impact` | m205–m210 | Where they came down | MOTHERSHIP, the invasion's heart (finale) |

- **Drives and defences in turn:** in every theater the 1st, 3rd and 5th mission are **drives** (the arcade game: the
  steppe scrolls, waves, an objective) and the 2nd, 4th and 6th **defences** (doc 106: hold the outpost for a number of
  waves). The boss mission is a defence: the boss marches on the outpost after the last wave. A defence mission carries
  `defend` (the waves to hold); a non-boss defence has the objective `{ type: 'defend', waves }`.
- Map 7 opens once m180 is cleared (`PREVIOUS[7] = 6`) and stays open once any of its missions is cleared (doc 74).
- The map picker gets a seventh chip; the map's "sea" is the steppe's dry gold, its land the theaters' colours.
- The threat climbs afresh (the kit is new, like maps 3–6): difficulty `2 + (n − 181) × 1.35`; drive length as map 6's;
  reward from the map-1 formula from m181, × the map's pay `MAP_SEVEN` (pay 12, ramp 3 % — set by the playtest) — the money buys the tank
  kit (doc 103) and the lab's level (doc 107).
- The WAR TRIPOD is map 7's mini-boss (from the Salt Flats on); the reinforcements add riders and landing pods late in
  each theater.
- The admiral opens the map (`adm.steppe`) and closes it (`adm.finale7`); the debrief's finale line, the globe's lock
  text and the campaign-complete banner have map-7 versions.

## The missions

| n | kind | name | objective | pool |
|---|---|---|---|---|
| m181 | drive | First Tracks | patrol | crawler, trooper, scoutdisc, rider |
| m182 | defence | Outpost Alpha | hold 5 waves | crawler, trooper, rider |
| m183 | drive | Pod Fall | strike 5 landing pods | landingpod, trooper, crawler, scoutdisc |
| m184 | defence | Grass Fire | hold 5 waves | crawler, rider, trooper, scoutdisc |
| m185 | drive | Riders on the Plain | intercept 26 | rider, crawler, discfighter, scoutdisc |
| m186 | defence | Harvester | 6 waves, then HARVESTER | crawler, rider, trooper |
| m187 | drive | White Out | patrol | tripod, trooper, discfighter, scoutdisc, crawler |
| m188 | defence | Salt Works | hold 6 waves | trooper, tripod, crawler, scoutdisc |
| m189 | drive | Tripod Hunt | strike 4 tripods | tripod, trooper, discfighter |
| m190 | defence | Mirage | hold 6 waves | crawler, rider, tripod, discfighter |
| m191 | drive | Glass Desert | intercept 28 | discfighter, scoutdisc, rider, crawler |
| m192 | defence | Longshanks | 7 waves, then LONGSHANKS | tripod, trooper, crawler |
| m193 | drive | Red Dust | patrol | siegebug, rider, crawler, trooper |
| m194 | defence | Gully Fort | hold 6 waves | siegebug, crawler, rider, manta |
| m195 | drive | Gun Mesas | strike 6 plasma guns | plasmagun, trooper, crawler |
| m196 | defence | Box Canyon | hold 7 waves | siegebug, tripod, crawler, manta, rider |
| m197 | drive | Manta Skies | intercept 30 | manta, discfighter, scoutdisc |
| m198 | defence | Juggernaut | 7 waves, then JUGGERNAUT | siegebug, rider, crawler |
| m199 | drive | Old Mounds | patrol | shieldbearer, trooper, broodcarrier, discfighter, crawler |
| m200 | defence | Standing Stones | hold 7 waves | shieldbearer, crawler, tripod, scoutdisc |
| m201 | drive | Brood Hunt | strike 6 brood carriers | broodcarrier, crawler, manta |
| m202 | defence | Dust Storm | hold 7 waves | broodcarrier, rider, shieldbearer, manta, crawler |
| m203 | drive | Shield Wall | strike 6 shield bearers | shieldbearer, trooper, tripod, discfighter |
| m204 | defence | Dreadnought | 8 waves, then DREADNOUGHT | shieldbearer, tripod, manta |
| m205 | drive | Crater Rim | patrol | trooper, tripod, siegebug, discfighter, manta, landingpod |
| m206 | defence | Last Line | hold 7 waves | crawler, rider, tripod, siegebug, broodcarrier, manta |
| m207 | drive | Pod Storm | strike 8 landing pods | landingpod, trooper, discfighter, scoutdisc |
| m208 | defence | Siege | hold 8 waves | siegebug, shieldbearer, tripod, rider, manta, broodcarrier |
| m209 | drive | Into the Crater | patrol | everything |
| m210 | defence | Mothership | 8 waves, then MOTHERSHIP | discfighter, manta, tripod, crawler |

Briefings in English in `src/data/missions-7.ts`, German in `src/i18n/missions-7-de.ts`.

### Stand-ins until the later waves
- Until doc 106 is built a defence mission plays as a drive.
- Map 7's sorties start straight in the mission (takeoff `skipped`) until the ramp start (doc 109).
- The home base shows the jungle camp and the ceremony the jungle camp stage on map 7 until the steppe's own pictures
  (docs 110, 111); the crew wear the carrier's outfits until their steppe portraits exist (`crewLook(7)` is `steppe`).

## Balance

By bot playtest once the whole map stands (wave 4): drives in the band of the other maps (1–3 hulls of damage per
minute, kill share 0.4–0.9, bosses 15–30 s), defences won by a bot that builds towers in a fixed order, lost when it
builds none.

### The playtest (2026-11-14)

`dev/playtest-tank.ts` on its own dev server: the kit a player has at mission n (every earlier mission won with its
first-clear money, the motor pool bought in `TANK_ORDER`, the lab researching `LAB_ORDER`), then the mission flown by
the bot; defences with the bot building and upgrading towers in a fixed order.

**First passes** found the defences too easy (won without a single tower), the Red Badlands' drives far too hard (m193:
7.2 hulls a minute in the Jackal) and the defences too long. Changed then: bigger waves, so a run without towers loses
(m184, m190); the wave counts capped at 5–8 and the waves growing slower; the kit's prices (×8 the jets') and map 7's pay
(×12); the disc fighter, siege crawler, plasma cannon and manta softened (doc 105); m191 and m193 without the siege
crawler and plasma cannon in their pools (m191: disc fighters, scout discs, riders, crawlers; m193: siege crawlers,
riders, crawlers, troopers).

**The full pass** with those numbers, one run each:

| drive | vehicle, gun, armour | hulls/min | kill share | | defence | outpost left | leaks | waves | length | boss |
|---|---|---|---|---|---|---|---|---|---|---|
| m181 | Jackal, 1, 0 | 0.85 | 0.81 | | m182 | 100 | 0 | 5 | 2.5 min | — |
| m183 | Jackal, 2, 0 | 1.27 | 0.80 | | m184 | 100 | 0 | 5 | 3.3 min | — |
| m185 | Jackal, 3, 0 | 1.24 | 0.80 | | m186 | 86 | 0 | 6 | 4.7 min | 20 s |
| m187 | Jackal, 3, 1 | 1.31 | 0.72 | | m188 | 100 | 0 | 6 | 2.8 min | — |
| m189 | Jackal, 4, 1 | 1.57 | 0.71 | | m190 | 100 | 0 | 6 | 3.6 min | — |
| m191 | Jackal, 4, 1 | 1.19 | 0.73 | | m192 | 82 | 0 | 7 | 4.6 min | 23 s |
| m193 | Jackal, 4, 1 | 1.84 | 0.62 | | m194 | 86 | 2 | 6 | 3.7 min | — |
| m195 | Jackal, 4, 1 | **4.69** | 0.25 | | m196 | 100 | 0 | 7 | 3.5 min | — |
| m197 | Lynx, 6, 2 | 3.13 | 0.75 | | m198 | 75 | 0 | 7 | 4.5 min | 28 s |
| m199 | Lynx, 6, 2 | 1.91 | 0.70 | | m200 | 100 | 0 | 7 | 3.8 min | — |
| m201 | Lynx, 7, 3 | 2.86 | 0.82 | | m202 | 100 | 0 | 7 | 4.0 min | — |
| m203 | Lynx, 7, 3 | 2.36 | 0.61, **lost** | | m204 | 75 | 1 | 8 | 4.8 min | 23 s |
| m205 | Lynx, 7, 3 | 3.21 | 0.45 | | m206 | 100 | 0 | 7 | 3.6 min | — |
| m207 | Bison, 8, 3 | 0.86 | 0.85 | | m208 | 100 | 0 | 8 | 4.5 min | — |
| m209 | Bison, 9, 3 | 1.71 | 0.76 | | m210 | 90 | 0 | 8 | 6.4 min | 18 s |

Two outliers, changed after this pass:

- **m195 Gun Mesas** — 4.7 hulls a minute in the Jackal: six dug-in plasma cannons with siege crawlers lobbing flak
  between them. The siege crawlers leave its pool (plasma cannons, troopers, crawlers).
- **m203 Shield Wall** — lost: shield bearers walk close together and shield each other, so the bot broke too few of 8
  by the end of the route. The strike asks for **6**, like Brood Hunt.

Re-flown after the change, two runs each: **m195** 2.43 and 2.05 hulls a minute, kill share 0.57, won both; **m203**
2.20 and 2.07, kill share 0.66 / 0.63, won both. Every drive is now in the band (0.9–3.2), every defence won with towers
(outpost 75–100 left), the bosses fall in 18–28 s, the longest defence (m210) runs 6.4 minutes.

## Business Rules

- `CampaignId` gains 7; `MISSIONS_7` (m181–m210) joins `ALL_MISSIONS`; `THEATERS_7` the theaters; `BOSSES_7` the
  bosses (doc 105).
- `MissionDef.defend?: number` — the waves a defence mission holds; missing on every drive and on every older map.
- `Objective` gains `{ type: 'defend'; waves: number }`: met when the outpost stands after the last wave (doc 106).
- `MAP_SEVEN = { from: 180, pay: 12, ramp: 0.03 }`; `onMapSeven(n)`.
