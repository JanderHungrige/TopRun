---
id: 99-heli-arsenal
title: Heli Arsenal - Gatling Drive, Turret Link, Door Guns, Three Ammo Types, Pulse Laser, Sonic Cannon and Drone Swarm for the Helicopters
edition: TopRun
depends_on: [49-helicopter-kit, 51-heli-fleet, 45-incendiary-ammo, 43-deep-arsenal, 02-hangar-economy]
relates: [49-helicopter-kit, 51-heli-fleet, 45-incendiary-ammo, 46-bofors-he-gun, 48-third-map]
source_files:
  - src/data/heli-arms.ts
  - src/data/types.ts
  - src/data/weapons.ts
  - src/game/heli-arms.ts
  - src/game/heli-combat.ts
  - src/game/save.ts
  - src/game/economy.ts
  - src/game/loadout.ts
  - src/game/challenge.ts
  - src/scenes/mission/heli-arms.ts
  - src/scenes/mission/heli-waves.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/burn.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/boss.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/cockpit-view.ts
  - src/render/heli-fx.ts
  - src/render/cockpit/screens.ts
  - src/render/cockpit/types.ts
  - src/render/items.ts
  - src/render/icons.ts
  - src/scenes/hangar-items.ts
  - src/scenes/hangar-heli.ts
  - src/scenes/hangar-panels.ts
  - src/scenes/hangar.ts
  - src/scenes/hangar-chief.ts
  - src/scenes/hangar-mech.ts
  - src/core/sfx-recipes.ts
  - src/i18n/ui-en-heliarms.ts
  - src/i18n/ui-de-heliarms.ts
  - src/i18n/ui-en-frontiers.ts
  - src/i18n/ui-de-frontiers.ts
  - src/i18n/content-de.ts
  - src/assets/items/
  - src/assets/loadout/heli.png
  - dev/playtest.ts
routes: []
models:
  - "SaveData.heliArms: { gatling, turret, doorGuns, tracer, hedp, incendiary, loaded } — the helicopters' gun upgrades and ammo (new, missing = none)"
test_files:
  - tests/unit/heli-arms.test.ts
  - tests/unit/heli-combat.test.ts
data_flow: writes-existing
last_synced: 2026-11-13
status: complete
phase: all
mdd_version: 11
tags: [helicopters, weapons, gatling, tracer, hedp, incendiary, laser, sonic, drones, door-guns, turret, hangar, map-3]
path: Game/Hangar/Heli Arsenal
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (SaveData.heliArms parsed from the untrusted profile store / cloud save)
sister_projects: []
---

# 99 — Heli Arsenal

## Purpose

Owner, 2026-11-13: *"The helicopter world has too few different weapons to buy. Add more cool stuff: a Gatling motor
for faster shooting, more ammo types (tracer), a short-burst laser, ultrasound, …"* Question round: all of the
examples plus a **turret link**, **door-gun miniguns** and a **drone swarm**; the laser and the sonic cannon are
**station weapons** with energy that recharges; **map-3 pay stays** — more choice, not everything affordable.

The helicopters' WEAPONS tab grows from four goods (chain gun, Hydra, Hellfire, Stinger) to thirteen. Everything is
on sale once map 3 is open, at helicopter prices, in the helicopters' hangar only.

## The new goods

### Gun upgrades (the chain gun's own ladders, no hardpoint)

**Gatling Drive** (`gatling`, levels 1–4). An electric motor turns the M230 into a rotary gun: at full spin it fires
faster by the level's factor. The barrels **spin up** while the trigger is held (rate from × 1 to the full factor,
straight line over the spin-up time) and **coast down** over 1.5 s when it is let go, so short pauses keep them hot.
Damage per round is unchanged.

| level | rate at full spin | spin-up | price |
|---|---|---|---|
| 1 | × 1.15 | 0.8 s | 180,000 |
| 2 | × 1.30 | 0.7 s | 360,000 |
| 3 | × 1.45 | 0.6 s | 600,000 |
| 4 | × 1.60 | 0.5 s | 900,000 |

**Turret Link** (`turret`, levels 1–3), after the Apache's helmet sight: the gun turret follows the pilot's look, so
every burst **swivels toward the nearest target ahead** — any enemy not hidden by stealth (or the boss's aim point)
within 480 px, above the helicopter and no more than the swivel + 12° off the nose. The rounds turn by the target's
bearing, clamped to the swivel.

| level | swivel | price |
|---|---|---|
| 1 | ± 8° | 120,000 |
| 2 | ± 14° | 250,000 |
| 3 | ± 20° | 420,000 |

**M134 Door Guns** (`doorGuns`, levels 1–3): two miniguns in the side doors fire **on their own** at enemies beside
the helicopter — each gun its side, at bearings 20°–160° off the nose, up to the level's range; air and ground alike
(full damage on the ground, like the chain gun). Each gun fires 10 rounds a second at the nearest enemy in its arc.
Their rounds carry the loaded ammo (below) but don't count toward the gun's accuracy (doc 39).

| level | range | damage per round | price |
|---|---|---|---|
| 1 | 220 px | 10 | 100,000 |
| 2 | 270 px | 15 | 220,000 |
| 3 | 320 px | 20 | 380,000 |

### Three ammo types — load one per sortie

Like the jets' ammo (doc 45): the pilot owns levels of every type and **loads one** (`heliArms.loaded`); the ammo's
detail panel shows **LOAD** for an owned type that isn't loaded, the loaded one's row says **LOADED**; buying the first
level of a type loads it when the loaded type has no level yet. The chain gun and the door guns fire the loaded
rounds. Each type: levels 1–3 at 90,000 / 200,000 / 360,000.

| type | what a hit does | level 1 / 2 / 3 | tracer look |
|---|---|---|---|
| **Tracer** (`tracer`) | **paints** the target for 3 s: a painted target takes more damage from **everything** (gun, door guns, rockets, missiles, laser, sonic wave, drones); the Hellfire, Stinger and drones go for painted targets first; a painted stealth fighter can be seen | + 12 / 20 / 28 % | a long bright red streak |
| **HEDP** (`hedp`) | the round **bursts**: a share of the hit hurts every other enemy (air or ground) within the radius | 20 / 30 / 40 % within 22 / 26 / 30 px | yellow with a dark tip, a small orange puff on a hit |
| **Incendiary** (`incendiary`) | the target **burns** — planes, helicopters **and ground targets** (on a low pass the trucks, tents and nests burn too); bosses don't | 25 / 40 / 55 % of each hit over 1.5 s | the jets' incendiary look (doc 45) |

- Painting: the boss can be painted too (the whole boss, 3 s, the same bonus); each new hit restarts the 3 s.
- Splash and burn damage don't paint and don't burst again.

### Station weapons (hardpoints, AIR / GROUND keys, Mk I–III)

| | key | hits | what it does | Mk I | price |
|---|---|---|---|---|---|
| **HEL Pulse Laser** (`pulselaser`) | AIR | any | a **burst of four pulses** over 0.24 s, each an instant beam at the nearest target within ± 30° and 460 px (straight ahead when there is none); never misses what it aims at | 25 per pulse, **5 charges**, a charge back every 3.5 s | 150,000 |
| **Sonic Cannon** (`sonic`) | GROUND | any | an **ultrasonic wave** (± 40°) that runs out 260 px in 0.45 s: everything it passes takes the hit and is **stunned for 1.5 s** (holds fire, air units slow to a third); enemy rounds, flak and missiles it passes are wiped out; bosses take the hit but aren't stunned | 40 per hit, **4 charges**, a charge back every 4 s | 150,000 |
| **Drone Swarm** (`drones`) | GROUND | any | **three small loitering drones** per launch, out to the sides and ahead; they turn sharply, hunt for 6 s and pick a new target when theirs dies | 90 per drone, **3 launches** | 120,000 |

- **Energy weapons** (laser, sonic): no rounds — the charges are energy that **recharges in the mission**, one charge
  per recharge time (divided by the number of stations carrying it), up to the station's full charge; an ammo pickup
  doesn't top them up beyond it. The cockpit's STORES page shows an **energy bar** instead of a count.
- Marks as for every helicopter weapon (doc 43, Mk III cap): damage × 1.25 / 1.5, one / two more charges or launches,
  Mk III's radius × 1.2 is the sonic wave's reach.
- Mounted like the Hydra (helicopters only). AIR fires the Stinger or the laser (the first mounted one with ammo); the
  drones sit on GROUND with the Hydra, the Hellfire and the sonic cannon, where SWITCH picks (doc 05) — on AIR, where
  there is no SWITCH, the laser's ever-returning charge would have kept the drones from ever launching (browser test).

### Look and sound

Laser pulses: a thin white-hot beam with a pink glow from the nose to the target, 0.06 s each, a sharp zap. Sonic
wave: three thin pale arcs running out with a wobble, a low falling whoop. Stunned enemies wear two small circling
rings. Painted enemies wear red corner brackets. Drones: small dark delta drones with a blinking light and a faint
trail, a buzzing launch. Door guns: short muzzle flashes at the helicopter's sides. The Gatling's gun sound rises a
little with the spin.

## Hangar

WEAPONS tab of the helicopters' hangar, in this order: M230 chain gun, Gatling Drive, Turret Link, Tracer, HEDP,
Incendiary, M134 Door Guns, Hydra, Hellfire, Stinger, Pulse Laser, Sonic Cannon, Drone Swarm. The detail panel shows
each item's numbers at the current and the next level (like the uranium ammo's and the Bofors' panels).

**Item pictures** (doc 02's pipeline, generated pixel art on magenta, `dev/item-pictures.py`): the new goods
`gatling turret doorguns tracer hedp incendiary pulselaser sonic drones`, and the helicopter kit's pictures that never
existed — `chaingun hydra hellfire stinger` (the jets' incendiary ammo gets its picture with it). Generic hardware, no
insignia, no text. Rendered on the PC ('Top Gun pixel crew portrait' at 768², seed 7); the chain gun and the door guns
came out as rifles with shoulder stocks and the drones grown into one another, so those three were rendered again with
seed 11 and "not a rifle: no shoulder stock …" / "separate … with clear gaps" in their prompts.

**Loadout background** (owner, 2026-11-13: *"the heli loadout background — make better pictures again"*): the
helicopters' LOADOUT picture (`src/assets/loadout/heli.png`, doc 76) is new, in the style of the world intros (doc 97):
a worn forward-base maintenance hangar at dusk, one attack helicopter with two mechanics on a ladder, rocket tubes,
crates, drums and tool boards, the open doors onto snowy mountains over a fjord in an orange-violet sky. Three seeds
were shown beside the old picture; the owner chose seed 11 ("B"). Prompt asked for "exactly one long tail boom ending in
one small tail rotor" (the intros' helicopters had grown extra tails).

## Business Rules

- Pure: tables in `src/data/heli-arms.ts`; on sale, prices, loading and the mission numbers in `src/game/heli-arms.ts`
  (`heliArmsOnSale`, `heliModPrice`, `heliRoundsPrice`, `withHeliLevel`, `afterHeliRoundsBought`, `canLoadHeliRounds`,
  `loadHeliRounds`, `heliArmsStats`); buying through `economy.ts` (`ShopItem` `heliMod` / `heliRounds`); the combat
  math in `src/game/heli-combat.ts` (`spinStep`, `spinRate`, `turretAim`, `doorTarget`, `laserTarget`, `inWave`,
  `paintedDamage`, `splashTargets`, `rechargeStep`).
- Everything here: helicopter kit only (`save.kit === 'heli'`), map 3 open, else `locked` (forged clicks included); one
  level at a time; at the top `max-level`.
- The three station weapons are `SecondaryId`s with `campaign: 3`, `planes: HELI_IDS` (doc 49); their energy is
  `SecondaryDef.recharge` (seconds per charge; absent = rounds).
- `loaded` is a type owned at level ≥ 1 to fire it; with none owned ordinary rounds fly.
- Kit score (doc 38): in the helicopter kit the gear's levels count like gun levels (× 10).
- No text, logos, insignia or flags in the pictures; real weapon names as for the jets.

## Save

`heliArms` = `{ gatling 0–4, turret 0–3, doorGuns 0–3, tracer 0–3, hedp 0–3, incendiary 0–3, loaded }`, each level
clamped, missing or broken → 0; `loaded` one of `tracer | hedp | incendiary`, anything else → `tracer`. The new
weapon ids go into `ownedSecondaries` / `weaponLevels` / loadouts like the others. Older builds drop the unknown ids and
ignore `heliArms`: the usual one-way upgrade.

## Balance

**Shop:** the map-3 shop grows from ≈ 12.1 M to ≈ 20.3 M (gatling 2.04 M, turret 0.79 M, door guns 0.70 M, ammo 3 ×
0.65 M, laser and sonic with marks 0.98 M each, drones 0.78 M) against ≈ 8.1 M of pay — by design (owner: more choice,
pay stays): the ammo types are alternatives, and a pilot picks gun levels, a Gatling, a second helicopter or the
energy weapons rather than all of them.

**Bot playtest** (doc 48 method, `dev/playtest.ts` `flyHeliWith`, the buying pilot's kit — Apache, gun 6, armour 4,
Hydra / Hellfire / Stinger / Hydra at m78; gun 9 at m88 — changed by one good; damage in hulls per minute / kill share
/ boss time, four runs each at m78, three at m88). The bot fires AIR only at planes and GROUND at ground targets and the
boss, so a weapon swapped onto the other key is judged by its key.

| m78 | hulls/min | kills | boss | cost |
|---|---|---|---|---|
| kit as bought (two runs of four) | 2.52 / 2.59 | 0.66 / 0.57 | 35 / 32 s | — |
| + gun level 7 (reference) | 2.11 | 0.86 | 27 s | 420,000 |
| + Gatling 2 | 2.47 | 0.76 | 26 s | 540,000 |
| + Tracer 2 loaded | 2.28 | 0.81 | 29 s | 290,000 |
| + HEDP 2 loaded (first numbers 25/35/45 %) | 2.01 | 0.90 | 34 s | 290,000 |
| + HEDP 2 loaded (final 20/30/40 %) | 2.06 | 0.91 | 33 s | 290,000 |
| + Incendiary 2 loaded (final 25/40/55 %) | 2.52 | 0.77 | 41 s | 290,000 |
| + Turret Link 2 | 2.54 | 0.79 | 33 s | 370,000 |
| + Door Guns 2 (first: 35°–150°, 230 px, 11 dmg) | 2.52 | 0.66 | 34 s | — |
| + Door Guns 2 (final: 20°–160°, 270 px, 15 dmg) | 2.69 | 0.72 | 36 s | 320,000 |
| laser in place of a Hydra (GROUND slot, the bot never fired it at the boss) | 2.56 | 0.68 | 39 s | 150,000 |
| laser in place of the Stinger | 2.50 | 0.71 | 29 s | 150,000 |
| sonic cannon in place of a Hydra | 2.39 | 0.59 | 30 s | 150,000 |
| drones in place of a Hydra (first: 60 dmg, 2 launches) | 2.60 | 0.70 | 35 s | 120,000 |
| drones in place of a Hydra (final: 90 dmg, 3 launches) | 2.68 | 0.69 | 33 s | 120,000 |
| everything at the top (≈ 8 M, an upper bound) | 0.76 | 1.00 | 16 s | — |

| m88 (kit: gun 9, armour 4, 0.64 M unspent) | hulls/min | kills |
|---|---|---|
| kit as bought | 5.33 | 0.73 |
| + Gatling 3, Tracer 3 (≈ 1.8 M) | 3.17 | 0.95 |
| + Gatling 2, HEDP 2, Door Guns 1, laser for the Stinger, sonic for a Hydra (≈ 1.2 M) | 3.84 | 0.90 |

- Per money the new goods sit at or a little under a gun level, as meant: HEDP and Tracer about match gun 7 for less
  money (HEDP in kills, Tracer also in boss time), the Gatling buys boss time, the Turret Link kills. The first HEDP
  numbers out-killed gun 7; lowered to 20/30/40 % within 22/26/30 px (the second run kept about the same kills, within
  the noise of ±0.1 the two kit-as-bought runs show — HEDP stays the swarm-clearer).
- The door guns first barely fired (≈ 150 rounds in 40 s): their arc left out what comes from ahead. Widened to
  20°–160°, 10 rounds/s, longer reach, more damage, cheaper (100k / 220k / 380k).
- The drones first did no better than the Hydra they replaced: 90 per drone and 3 launches now.
- Incendiary at level 2 (first 20/30/40 %) did little: 25/40/55 % now. Bosses don't burn, so it is the swarm-and-
  convoy choice next to HEDP, without the burst.
- Late on the new goods are a big step (m88: damage taken down by a third to two fifths) — but cost what a second
  helicopter costs; the enemies keep their map-3 tuning, so map 3 grows easier for a pilot who spends there.

## Known Issues

(none)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
