---
id: 05-mission-combat
title: Mission Combat - Top-Down Vertical Shooter
edition: TopGun
depends_on: [01-game-core, 02-hangar-economy, 03-campaign-map, 04-carrier-takeoff]
relates: [02-hangar-economy, 03-campaign-map]
source_files:
  - src/data/enemies.ts
  - src/data/bosses.ts
  - src/game/waves.ts
  - src/game/combat.ts
  - src/game/objectives.ts
  - src/scenes/mission/mission-scene.ts
  - src/scenes/mission/mission-render.ts
  - src/scenes/mission/world.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/enemy-ai.ts
  - src/scenes/mission/weapons-fire.ts
  - src/scenes/mission/projectiles.ts
  - src/scenes/mission/boss.ts
  - src/scenes/mission/pickups.ts
  - src/scenes/mission/hud.ts
  - src/render/draw-enemies.ts
  - src/render/draw-ground-units.ts
  - src/render/draw-bosses.ts
  - src/render/draw-terrain.ts
  - src/render/terrain-art.ts
routes: []
models: []
test_files:
  - tests/unit/waves.test.ts
  - tests/unit/combat.test.ts
data_flow: greenfield
last_synced: 2026-10-24
status: complete
phase: all
mdd_version: 11
tags: [shooter, top-down, enemies, waves, bosses, weapons, pickups, hud, objectives]
path: Game/Mission
integration_contracts:
  - function: "MissionResult"
    when: "handed to the debrief (03) when the mission ends"
satisfies_contracts:
  - from: 02-hangar-economy
    function: "derivePlayerStats(save)"
    when: "player is built at mission start"
    status: done
    verified_at: "src/scenes/mission/mission-scene.ts:44"
  - from: 04-carrier-takeoff
    function: "TakeoffRating"
    when: "carried through into MissionResult.takeoff"
    status: done
    verified_at: "src/scenes/takeoff.ts:71 → src/scenes/mission/mission-scene.ts:207"
known_issues:
  - "Balance tuned with an automated bot playtest only (missions 1, 6, 30); needs human playtesting across all 30 missions"
security_read_sites: []
sister_projects: []
---

# 05 — Mission Combat

## Purpose

The core action: a classic top-down vertical shooter. The terrain scrolls down, enemies come
in from the top, the player dodges, shoots, bombs ground targets, collects pickups and fights a
boss at the end of every theater. Mission data (03) and the player loadout (02) fully define a run.

## Architecture

```
Screen 1280×720:  [ left HUD 320 ][ playfield 640×720 ][ right HUD 320 ]

data/enemies.ts      ENEMIES: stats per kind (layer air|ground, hp, speed, radius, bounty, weapon)
data/bosses.ts       BOSSES: ironclad | sandstorm | blackjack | typhoon | leviathan (parts, patterns)
game/waves.ts        generateTimeline(mission) → SpawnEvent[] (seeded, deterministic, pure)
game/combat.ts       pure helpers: circleHit, applyDamage (ground modifier, ECM), steerHoming,
                     pickTarget, scaleEnemy(difficulty), rollDrop
game/objectives.ts   objectiveProgress / objectiveMet / isMissionOver (pure)
scenes/mission/      world container + systems (player, enemy AI, projectiles, boss,
                     pickups, HUD); mission-scene orchestrates update order and end state
render/              enemy / boss / terrain vector art, particle system
```

Update order per tick: input → player → spawns (timeline) → enemies/boss AI → projectiles →
collisions → pickups → particles → objective/end check. Render: terrain → ground units →
shadows → air units → projectiles → particles → clouds → HUD.

## Data Model

```ts
type EnemyKind = 'drone'|'fishbed'|'fulcrum'|'flanker'|'hind'|'bear'
               | 'aa'|'sam'|'tank'|'radar'|'depot'|'boat'|'destroyer';
type Behavior = 'straight'|'sine'|'dive'|'swoop'|'strafe'|'hover'|'kamikaze'|'ground';
type EnemyWeapon = 'none'|'single'|'aimed'|'spread3'|'missile'|'flak';
interface SpawnEvent { t: number; kind: EnemyKind; x: number; behavior: Behavior; delay?: number }
                     | { t: number; boss: BossId }
interface MissionResult { missionId; success; takeoff: TakeoffRating; kills; spawned;
                          objectiveDone; hullRatio; collected; bossKilled }
```

| Kind | Layer | HP | Speed | Bounty | Weapon (period s) | Behaviours |
|------|-------|---:|------:|-------:|-------------------|------------|
| drone | air | 12 | 170 | 15 | none | kamikaze, sine |
| fishbed (MiG-21) | air | 30 | 170 | 30 | single 2.2 | straight, sine, swoop |
| fulcrum (MiG-29) | air | 55 | 230 | 50 | aimed 1.6 | dive, swoop |
| flanker (Su-27) | air | 110 | 190 | 90 | missile 3.5 | strafe |
| hind (gunship) | air | 80 | 110 | 60 | spread3 2.0 | hover |
| bear (Tu-95) | air | 320 | 70 | 180 | aimed 1.2 | straight |
| aa | ground | 50 | — | 35 | flak 2.5 | ground |
| sam | ground | 70 | — | 55 | missile 4.0 | ground |
| tank | ground | 60 | 30 | 40 | aimed 2.8 | ground |
| radar | ground | 90 | — | 70 | none | ground |
| depot | ground | 120 | — | 80 | none | ground |
| boat | ground (sea) | 70 | 50 | 50 | aimed 2.4 | ground |
| destroyer | ground (sea) | 420 | 25 | 250 | aimed 1.4 + missile 5 | ground |

Difficulty scaling (d = mission difficulty 1–30): HP × (1 + 0.06 (d−1)), fire period
÷ (1 + 0.03 (d−1)), bullet speed × (1 + 0.015 (d−1)), bounty × (1 + 0.03 (d−1)).

Bounties were cut to ~35 % after the first playtest (2026-10-24): a perfect run of mission 1
earned $5,420 in bounties against a $1,200 mission reward, which would empty the shop far too early.
Boss bounties: ironclad 2,000 · sandstorm 3,000 · blackjack 4,000 · typhoon 5,000 · leviathan 8,000;
each destroyed boss weapon part pays 100.

## API Endpoints

None.

## Business Rules

- **Movement**: 8-way, plane speed from PlayerStats, clamped to the playfield. Banking visual
  when moving sideways; the F-14 sweeps its wings back while moving forward. Shadow on terrain.
- **Gun** fires while FIRE is held (or always, with autofire setting / touch). Pattern per gun level.
  Guns hit air and ground; ground takes 50 %.
- **Secondary**: fires the selected mounted weapon if ammo > 0 and its cooldown is ready;
  SWITCH cycles through mounted weapons with ammo. Homing weapons pick the nearest valid target
  in a forward cone; with no target they fly straight.
- **Flares**: FLARE drops a flare (if any left); every enemy missile within 260 px retargets
  to the flare. Enemy missiles otherwise home on the player (turn rate limited, 5 s life).
- **Special** per plane (02): F-16 barrel roll, F-14 wingman, SR-71 Mach dash.
- **Damage**: enemy bullet 8 × scale, missile 22, flak 12, collision with air enemy 25 (enemy
  takes 80). ECM −25 % bullet damage. 0.6 s invulnerability after any hit (blink).
  Hull ≤ 0 → explosion → mission failed. Damage control restores 40 % once below 25 %.
- **Pickups** (drop roll per kill): cash 14 % (bounty × 0.5, min 25), repair 5 % (+25 % hull),
  power 4 % (gun level +1 for 12 s, max 5), ammo 4 % (+50 % of each secondary's start ammo).
  Pickups drift down with the scroll; magnet pulls within 160 px.
- **Timeline** (`generateTimeline`): seeded by mission number; deterministic; events sorted by
  `t`; waves every lerp(3.2 s → 1.5 s by difficulty) with jitter; formations: line, V, column,
  sine group, single heavy, ground cluster. Guarantees: strike missions spawn ≥ count + 2 of the
  target kind; intercept missions spawn ≥ ceil(count × 1.3) air enemies; only pool kinds; x
  inside the playfield; boss missions end with exactly one boss event at `t = length`.
  Heavy ground units (destroyer) spawn at most one per wave; when a pool's only ground unit is heavy,
  85 % of waves are air waves (playtest: mission 30 produced columns of destroyers).
- **Bosses**: enter from top, settle at y ≈ 150, sway; multi-part (turrets with own HP + core).
  Core takes damage at any time; at 50 % core HP the boss enrages (faster fire, extra pattern).
  Some bosses launch escorts (leviathan: fishbeds/fulcrums; blackjack: drones). Boss HP scales
  with difficulty (× (1 + 0.05 (d−1))). Core HP: ironclad 2,600 · sandstorm 4,000 · blackjack 5,000 ·
  typhoon 6,000 · leviathan 8,000 (raised ~2.4× after playtest: a mid-game F-14 sank the Ironclad in 6 s).
  Boss music + warning banner on entry.
- **Objectives / end**:
  - patrol: survive until timeline end.
  - intercept: shoot down ≥ count air enemies.
  - strike: destroy ≥ count of the target kind.
  - boss: destroy the boss.
  - Mission ends when the player dies (fail), the boss dies (evaluate), or `t ≥ length` and no
    enemies are on screen (max 8 s extra) → evaluate objective → success / failed.
- **Pause** (P / Esc / button): overlay with Resume / Abort (abort = failed, salvage only).
- **HUD** left: plane, hull bar, gun level (+ power timer), secondaries with ammo (active
  highlighted), flares, special cooldown ring. Right: mission name, objective progress, cash
  collected, kills, mission progress bar, boss HP bar when present. Touch buttons over the HUD
  panels when a touch device is used.

## Data Flow

Greenfield. `MissionDef` (03) + `PlayerStats` (02) + `TakeoffRating` (04) in →
`MissionResult` out to the debrief (03).

## Dependencies

01 (loop, input, audio, scenes), 02 (PlayerStats), 03 (MissionDef, debrief), 04 (rating).

## Security

None.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
