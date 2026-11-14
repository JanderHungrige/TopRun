---
id: 101-sub-arsenal
title: Sub Arsenal - Rapid Loader, Homing Tips, Side Tubes, Three Harpoon Ammo Types, Torpedo Swarm, Sonar Pulse, Decoy Drone and Drift Net
edition: TopRun
depends_on: [66-sub-kit, 69-sub-fleet, 99-heli-arsenal, 02-hangar-economy]
relates: [99-heli-arsenal, 66-sub-kit, 69-sub-fleet, 67-sub-flight]
source_files:
  - src/data/sub-arms.ts
  - src/data/types.ts
  - src/data/weapons.ts
  - src/data/weapons-fleet.ts
  - src/game/sub-arms.ts
  - src/game/gear.ts
  - src/game/heli-arms.ts
  - src/game/save.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/game/challenge.ts
  - src/scenes/mission/sub-arms.ts
  - src/scenes/mission/heli-arms.ts
  - src/scenes/mission/heli-waves.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-render.ts
  - src/render/heli-fx.ts
  - src/scenes/hangar-gear.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/hangar-chief.ts
  - src/scenes/hangar-mech.ts
  - src/render/items.ts
  - src/render/icons.ts
  - src/render/shots.ts
  - src/i18n/ui-en-subarms.ts
  - src/i18n/ui-de-subarms.ts
  - src/i18n/content-de.ts
  - src/assets/items/
  - dev/playtest.ts
routes: []
models:
  - "SaveData.subArms: { loader, homing, sideTubes, explosive, electric, cavitation, loaded } — the subs' gun upgrades and ammo (new, missing = none)"
test_files:
  - tests/unit/sub-arms.test.ts
  - tests/unit/heli-arms.test.ts
  - tests/unit/item-pictures.test.ts
  - tests/unit/loadout.test.ts
data_flow: writes-existing
last_synced: 2026-11-14
status: complete
phase: 3
mdd_version: 11
tags: [submarines, weapons, harpoon, torpedo, sonar, decoy, net, ammo, hangar, map-4]
path: Game/Hangar/Sub Arsenal
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.subArms parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 101 — Sub Arsenal

## Purpose

Owner, 2026-11-13, after the helicopters' arsenal (doc 99): *"Do the underwater and space worlds have enough weapons
and equipment to buy?"* — they don't (the SUB PEN sold the harpoon gun, three weapons and the equipment). Question round:
everything offered — three harpoon upgrades, three ammo types, four new station weapons; the pay stays (more choice).
Space comes later, differently (its arsenal is built onto the ship).

The SUB PEN's WEAPONS tab grows from four goods to fourteen, the sub version of doc 99: the same mechanics where they
fit, under the sea's own names, at sub prices.

## The harpoon gun's upgrades (no hardpoint)

| good | like (doc 99) | levels | numbers | prices |
|---|---|---|---|---|
| **Rapid Loader** (`loader`) | the Gatling Drive | 1–4 | rate × 1.15 / 1.3 / 1.45 / 1.6 at full speed, spin-up 0.8 / 0.7 / 0.6 / 0.5 s | 300k / 600k / 1.0M / 1.5M |
| **Homing Tips** (`homing`) | the Turret Link | 1–3 | the bolts turn toward the nearest target ahead, up to ± 8 / 14 / 20° | 200k / 420k / 700k |
| **Side Tubes** (`sideTubes`) | the door guns | 1–3 | two small tubes fire on their own at enemies beside the sub, 20°–160° off the bow, 10 bolts/s; reach 220 / 270 / 320 px, 6 / 11 / 16 per bolt | 170k / 370k / 640k |

## Three harpoon ammo types — load one per sortie

Levels 1–3 each at 150k / 400k / 750k; LOAD / LOADED as for the helicopters' rounds (doc 99). The gun and the side
tubes fire the loaded bolts.

| type | what a hit does | level 1 / 2 / 3 |
|---|---|---|
| **Explosive Tips** (`explosive`) | the bolt bursts: a share of the hit hurts every other enemy within the radius (doc 99's HEDP, wider: the sea's swimmers keep further apart) | 30 / 40 / 50 % within 34 / 40 / 46 px |
| **Electric Harpoons** (`electric`) | the hit arcs to the nearest other enemies within 70 px for a share of it and stuns them (they hold fire, slow to a third); the struck enemy itself is not stunned | 2 / 3 / 4 enemies, 25 / 35 / 45 %, 0.3 / 0.45 / 0.6 s |
| **Cavitation Tips** (`cavitation`) | the bolt flies 25 % faster and passes through enemies, hitting the next ones too — each with half the hit of the one before | through 1 / 2 / 3 more |

Bosses take the hit, never a stun.

## Four new station weapons (Mk I–III)

| | key | what it does | Mk I | price |
|---|---|---|---|---|
| **Torpedo Swarm** (`torpswarm`) | GROUND | six small homing torpedoes per salvo that fan out and hunt anything in the water | 40 each, 2 salvos | 200k |
| **Sonar Pulse** (`sonarpulse`) | GROUND | a pressure wave all round the sub, out to 220 px in 0.45 s: everything it passes takes the hit and is stunned 1.5 s, enemy torpedoes and rounds in it are wiped out; energy that recharges (doc 99) | 35 per hit, 4 charges, one back every 4 s | 250k |
| **Decoy Drone** (`decoy`) | AIR | a small sub-shaped drone that swims ahead and off toward the open water for 6 s: enemies within 520 px aim their guns at it, and enemy torpedoes in the water turn to it (the noise-makers only shake off a torpedo close by) | 4 drones | 150k |
| **Drift Net** (`net`) | GROUND | a net thrown ahead that drifts down for 6 s: enemies swimming inside it are slowed to 30 % | 3 nets, radius 70 | 180k |

- AIR now fires the MK48 or the decoy (the first mounted with ammo), GROUND cycles the mine, the Shkval, the torpedo
  swarm, the sonar pulse and the net (SWITCH, doc 05).
- Marks: damage × 1.25 / 1.5, +1 / +2 per tube; Mk III's radius × 1.2 for the pulse's reach and the net's size.

### Look and sound

Bolts: explosive with an orange tip and a small orange puff, electric with a blue glow and blue arcs to the struck
neighbours, cavitation with a trail of bubbles. Mini torpedoes: small dark torpedoes with a bubble trail. Sonar pulse:
a ring of pale blue running out (the Type 212's sonar look). Decoy: a small dark sub shape with a blinking light. Net:
a drifting criss-cross mesh. Side tubes: small puffs of bubbles at the sub's flanks.

## Hangar

WEAPONS tab of the SUB PEN: Harpoon Gun, Rapid Loader, Homing Tips, Explosive Tips, Electric Harpoons, Cavitation
Tips, Side Tubes, MK48, Depth Mine, Shkval, Torpedo Swarm, Sonar Pulse, Decoy Drone, Drift Net. Item pictures through
doc 02's pipeline for the ten new goods (`loader homing sidetubes explosive electric cavitation torpswarm sonarpulse
decoy net`) and the SUB PEN's missing ones (`harpoon mk48 depthmine shkval`).

## Business Rules

- The gear of both fleets runs through one generic layer (`src/game/gear.ts`): `ShopItem` `{ type: 'mod' }` /
  `{ type: 'rounds' }` with ids unique across the kits (the helicopters' `gatling turret doorGuns tracer hedp incendiary`,
  the subs' `loader homing sideTubes explosive electric cavitation`); each id belongs to one kit and is sold only in its
  hangar once its map is open (`locked` otherwise).
- Pure tables in `src/data/sub-arms.ts`, the save entry and the numbers in `src/game/sub-arms.ts` (`subArmsStats` gives
  the same mission numbers as `heliArmsStats` plus the chain and the pierce).
- Kit score (doc 38): the subs' gear counts like gun levels in the sub kit.

## Save

`subArms` = `{ loader 0–4, homing 0–3, sideTubes 0–3, explosive 0–3, electric 0–3, cavitation 0–3, loaded }`, clamped;
`loaded` one of `explosive | electric | cavitation`, anything else → `explosive`. Older builds ignore it.

## Balance

**Shop:** map 4's shop grows from ≈ 23.0 M by ≈ 14.9 M (Rapid Loader 3.4 M, Homing Tips 1.32 M, Side Tubes 1.18 M,
ammo 3 × 1.3 M, the four weapons with their marks 5.07 M) against ≈ 15.3 M of pay — by design (owner: more choice, pay
stays): the ammo types are alternatives, and a pilot picks gun levels, a loader, a second sub or the new weapons rather
than all of them.

**Bot playtest** (doc 48 method, `dev/playtest.ts` `flySubWith`, the buying pilot's kit changed by one good; damage in
hulls per minute / kill share, four runs each at m100, three at m112). Kits: m100 — Type 212, gun 4, armour 2, MK48 /
mine / MK48 / mine, 0.72 M earned on map 4; m112 — gun 8, armour 4, MK48 / mine / Shkval / MK48, 5.2 M earned. Neither
mission has a boss. The bot fires GROUND only at seabed targets, so the GROUND weapons are judged at m100 (turrets,
crabs and boomers on the bottom); m112's swimmers are AIR targets.

| m100 | hulls/min | kills | cost |
|---|---|---|---|
| kit as bought (four batches of four) | 1.68 / 2.02 / 1.57 / 1.74 | 0.73 / 0.73 / 0.72 / 0.71 | — |
| + gun level 5 (reference) | 1.64 | 0.82 | 260,000 |
| + Rapid Loader 1 | 1.63 | 0.78 | 300,000 |
| + Homing Tips 1 | 1.61 | 0.77 | 200,000 |
| + Side Tubes 1 (10 dmg → 8 → final 6) | 1.48 → 1.49 → 1.65 | 0.86 → 0.87 → 0.85 | 170,000 |
| + Explosive 1 (HEDP's 20 % in 22 px → 25 % in 30 px → final 30 % in 34 px) | 1.75 → 1.78 → 1.64 | 0.74 → 0.76 → 0.77 | 150,000 |
| + Electric 1 (struck enemy stunned too, 0.4 s → neighbours only, 0.3 s → final, 25 % of the hit) | 1.03 → 1.45 → 1.46 | 0.86 → 0.83 → 0.84 | 150,000 |
| + Cavitation 1 (40 % faster → 25 % → final, half the hit per pass) | 1.38 → 1.34 → 1.49 | 0.84 → 0.88 → 0.82 | 150,000 |
| torpedo swarm in place of a mine | 1.60 | 0.77 | 200,000 |
| sonar pulse in place of a mine | 1.49 | 0.81 | 250,000 |
| drift net in place of a mine | 1.73 | 0.76 | 180,000 |
| decoy in place of an MK48 (3 drones, 5 s, straight ahead → 4, 6 s → final, off to the side) | 1.84 → 1.84 → 1.98 | 0.71 → 0.71 → 0.70 | 150,000 |
| decoy in place of the first MK48, bot fires one at a time | 1.76 | 0.73 | 150,000 |

| m112 | hulls/min | kills | cost |
|---|---|---|---|
| kit as bought (two batches of three) | 3.85 / 3.66 | 0.42 / 0.42 | — |
| + gun level 9 (reference) | 3.30 | 0.54 | 1,600,000 |
| + Rapid Loader 2 | 3.61 | 0.54 | 900,000 |
| + Homing Tips 2 | 3.42 | 0.48 | 620,000 |
| + Side Tubes 2 (12 dmg; final 11) | 3.47 | 0.44 | 540,000 |
| + Explosive 2 (first → final) | 2.89 → 2.82 | 0.61 → 0.64 | 550,000 |
| + Electric 2 (first → final) | 2.64 → 2.92 | 0.69 → 0.67 | 550,000 |
| + Cavitation 2 (first → final) | 2.31 → 2.82 | 0.76 → 0.60 | 550,000 |
| torpedo swarm / sonar pulse / net in place of the mine (few seabed targets) | 3.65 / 3.75 / 3.49 | 0.43 / 0.46 / 0.44 | 200–250,000 |
| decoy in place of the first MK48, one at a time (final) | 3.22 | 0.47 | 150,000 |
| decoy in place of the second MK48, all four at once (first numbers) | 3.84 | 0.43 | 150,000 |
| Rapid Loader 2, Electric 2, Side Tubes 1, decoy and sonar pulse (≈ 2.0 M, first numbers) | 1.70 | 0.83 | — |

- The electric harpoons first stunned the struck enemy as well as its neighbours: at ten hits a second whole groups
  held fire for good (damage taken down 40 % for 150k). Now only the neighbours are stunned, shorter, for a little less
  of the hit.
- Cavitation was the strongest ammo at both missions. The speed was not the cause (40 % → 25 % changed nothing); the
  free second hit was. A bolt now keeps half its hit for each enemy it passes through.
- The explosive tips began as the helicopters' HEDP and did nothing at m100, because the sea's swimmers keep further
  apart than the helicopters' convoys. They are wider and a little stronger now, and the swarm-clearer at m112's dense
  swarms.
- The Side Tubes first out-killed a gun level for less money: 6 / 11 / 16 per bolt now.
- Ammo levels 2 and 3 cost more than first planned (340k / 600k → 400k / 750k). At level 2 the three types now land
  together at m112 (2.8–2.9 hulls/min, 0.60–0.67 kills), each with its own job.
- Level 1 of each good sits at about a gun level for less money. Late on, the new goods are cheap next to the sub gun's
  top levels (gun 9 costs 1.6 M) and a big step: at m112 an ammo type at level 2 takes damage down by a quarter. That
  makes them a second line of upgrades beside the gun, as for the helicopters (doc 99). The enemies keep their map-4
  tuning, so map 4 grows easier for a pilot who spends there.
- The decoy is a defensive pick. Fired all at once (the bot's first habit) it did nothing. One at a time, it does as
  much as the 1.6 M gun level against m112's aiming swimmers; at m100, where the hurt comes from the seabed, it is an
  even trade for an MK48. The playtest bot now fires its AIR weapon only while no decoy is out.
- The torpedo swarm, sonar pulse and net each sit at about a gun level at m100; the pulse is the strongest of the
  three in damage taken (it wipes out enemy rounds in its ring).

## Known Issues

(none)
