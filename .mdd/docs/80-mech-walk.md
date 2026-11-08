---
id: 80-mech-walk
title: Mech Walk - The Mechs in the Mission, Striding Legs, the Gait, Footprints, Jump Jets
edition: TopRun
depends_on: [79-mech-kit, 67-sub-flight, 50-helicopter-flight]
relates: [81-jungle-world, 87-mech-camo, 61-cockpit-skins]
source_files:
  - src/game/mech-walk.ts
  - src/game/sub-flight.ts
  - src/game/jets.ts
  - src/scenes/mission/player.ts
  - src/scenes/mission/specials.ts
  - src/scenes/mission/weapons-fire.ts
  - src/render/mechs/
  - src/render/draw-planes.ts
  - src/render/draw-planes-side.ts
  - src/render/cockpit/skin.ts
routes: []
models: []
test_files:
  - tests/unit/mech-walk.test.ts
data_flow: reads-existing
last_synced: 2026-11-08
status: in_progress
phase: all
mdd_version: 11
tags: [mechs, walking, gait, footprints, jump-jets, stomp, cockpit-skin, art, map-6]
path: Game/Mission/Mech Walk
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 80 — Mech Walk

## Purpose

*"We have mechwarriors as machines. Walking around."* The mechs walk through the jungle; they don't fly.

## How a mech moves

- **The walking scroll:** the jungle floor scrolls at 0.6 × the jets' speed (map 6's `flightScroll`).
- **The gait:** a mech eases toward the stick like the other fleet kits (accel 4.5), and its speed surges with every
  step: `gaitSpeed(phase) = 0.75 + 0.25 × |sin(phase × π)|` of its top speed, the phase running on with the distance
  walked (one step per 34 px). Standing still, the legs come to rest.
- **The legs** stride in turn top-down: the foot of the stepping leg swings forward, the other pushes back; the body
  sways a pixel to the planted side. Each footfall leaves a footprint on the floor that scrolls away with it, and
  shakes the screen a hair on the heavy mechs.
- **Jump Jets** (the Strider's E, cooldown 9 s): a 0.9 s leap — the mech rises (drawn larger, its shadow left behind),
  nothing can hit it, and it lands with a **stomp**: a ring out to 130 px dealing 80 to everything on the ground it
  reaches, and a cloud of dust.
- The other mechs' E use the existing specials: the Ranger's barrage is the Apache's salvo with seeker missiles, the
  Hornet's camo field is stealth, the Titan's bulwark is the armour special.

## Art

Top-down, nose up, drawn in code like the subs (`src/render/mechs/`): two legs with feet under a hip, a torso with
armour plates (the paint, doc 87), two arms with the guns, a cockpit glass; each mech has its own build (the Strider slim
with a round head, the Ranger boxy with shoulder pods, the Hornet narrow with swept armour, the Titan broad with a big
hump). A side view for the hangar. The cockpit HUD wears a riveted olive mech skin.
