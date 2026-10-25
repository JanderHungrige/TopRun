---
id: 16-missile-evasion
title: Missile Evasion - Out-Fly Homing Missiles With Break Turns and Flares
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core, 05-mission-combat]
source_files:
  - src/game/minigames/evasion.ts
  - src/game/minigames/evasion-flight.ts
  - src/game/minigames/evasion-missiles.ts
  - src/game/minigames/evasion-waves.ts
  - src/scenes/minigames/evasion.ts
  - src/scenes/minigames/evasion-effects.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/evasion-world.ts
  - src/render/minigames/evasion-ordnance.ts
  - src/render/minigames/evasion-rwr.ts
  - src/render/minigames/evasion-hud.ts
  - src/render/minigames/evasion-icon.ts
  - src/i18n/minigames/evasion.ts
routes: []
models: []
test_files:
  - tests/unit/evasion.test.ts
  - tests/unit/evasion-waves.test.ts
  - tests/unit/evasion-pilots.test.ts
  - tests/unit/evasion-bots.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, missile-evasion, flares, break-turn, high-g, rwr, homing, waves]
path: Game/Minigames/MissileEvasion
initiative: off-duty-minigames
wave: off-duty-minigames-wave-2
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "EVASION is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawPlaneTop(ctx, id, x, y, scale, { bank, sweep, throttle, t, livery, shadow, flash })"
    when: "the pilot's selected jet is drawn top-down in its own paint job (doc 09)"
  - function: "headingTo (src/game/combat.ts), wrapAngle / approach / lerp (src/core/math.ts)"
    when: "the jet and the missiles share the mission's heading convention (0 = up, clockwise)"
satisfies_contracts: []
known_issues:
  - "The high-G break does not raise simulated pilots' scores measurably: it moves the break window later (a save for late reactions), it does not widen it."
  - "A break-only pilot with machine-precise timing still takes gold on ~20 % of seeds; gold is much likelier with flares but not impossible without."
  - "Even skilled simulated pilots are shot down before 90 s in most rounds (about a third survive); the score keeps counting until then."
  - "Launch points lie 620–820 px from the jet, mostly off screen: launchers show as edge markers and on the RWR; SAM sites are only seen when the jet flies over them."
security_read_sites: []
sister_projects: []
---

# 16 — Missile Evasion

## Purpose

Minigame 7 of the off-duty initiative (unlocks after mission 15, doc 10). A defensive-flying drill,
top-down: surface-to-air (SAM) and air-to-air (AAM) missiles launch from beyond the screen edges in
escalating waves and home in on the pilot's own jet (selected plane, its paint job). There are no
guns — only manoeuvres and flares. Survive up to 90 s; the score is the number of missiles evaded.
For fun only (best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/evasion-flight.ts   the jet: heading + turn rate with roll-in, momentum (grip), high-G break, G load — pure
game/minigames/evasion-missiles.ts missile kinds, launch, lead pursuit with a lagging velocity estimate, turn-rate and
                                   turn-acceleration limits, seeker gimbal (overshoot), burn-out, flare decoy chance,
                                   closing / impact time — pure
game/minigames/evasion-waves.ts    seeded wave plans (count, sides, kinds, spacing, per-wave speed-up), launch offsets — pure
game/minigames/evasion.ts          round state machine: waves, launches, flares, hits, hull, events, end — pure
scenes/minigames/evasion.ts        EVASION: MinigameModule; EvasionRound maps input, steps the rules, camera, draws
scenes/minigames/evasion-effects   events → sounds, particles, smoke trails, pop-ups, launchers (no outcome logic)
render/minigames/evasion-world     endless ground (a seeded campaign theatre's tile + hash-grid features), clouds and
                                   their shadows, SAM sites, enemy fighters
render/minigames/evasion-ordnance  missiles (SAM / AAM), motor flames, smoke trails, flares
render/minigames/evasion-rwr       RWR ring around the jet, flare decoy cone, edge markers
render/minigames/evasion-hud       hull + wave, round clock, G meter, BREAK / FLARE buttons (touch targets), pop-ups,
                                   banners, vision tunnel
render/minigames/evasion-icon      hub / offer card icon
i18n/minigames/evasion.ts          EN + DE strings (gameText), clock and G number formatting
```

The pure step gets one input per fixed 1/60 s tick — `{ steerX, steerY, flare, brk }` (steer = the
direction the pilot pushes in screen space, length ≤ 1; flare / brk = pressed this tick) — and returns
the next state with that tick's `events` (wave, launch warning, launch, flare, break, evaded
(overshoot / burn-out / decoyed), resisted flare, hit, missile pop, end). The scene turns events into
sounds and effects; it never decides an outcome. `createEvasion(seed, false)` is a drill mode without
waves for the unit tests.

World units are logical px; the camera follows the jet with a small look-ahead (north stays up, the
field never rotates), so the jet stays near the centre (640, 388) of the field below the top bar.

## Business Rules

### Controls
- **Steer**: push the direction the jet should fly — arrows / WASD (8 directions), gamepad stick or
  flight stick, or touch / mouse drag on the left 1000 px (a virtual stick: the drag from where the
  touch started, 60 px = full deflection). Under 25 % deflection the jet holds its heading.
- **Flares**: F or Space (also gamepad X / A — the `flare` and `fire` actions) or the FLARE button.
- **High-G break**: E or R (also gamepad Y / B — `special` and `secondary`) or the BREAK button.
- The buttons bottom right show the key letters for keyboard (F / E) and gamepad (X / Y).

### The jet (evasion-flight.ts)
- Cruise **250 px/s**. Heading 0 = up, clockwise positive (as in missions).
- Commanded turn rate = `clamp(5 × heading error, ±1.9 rad/s)`; the actual turn rate follows with
  **k = 9 /s** (roll-in; it also drives the drawn bank).
- **Momentum**: the velocity eases towards `heading × speed` with **k = 7 /s** (the jet slides a
  little through hard turns).
- **High-G break** (when ready): for **1.0 s** the turn limit is **3.4 rad/s** and the speed eases
  (k = 4 /s) towards **290 px/s**, then back to cruise (k = 5 /s). Ready again **6 s** after it was
  triggered (cooldown ring on the BREAK button).
- **G load** (display) = `1 + |turn rate| × speed / 120`: 1 G level, ≈ 5 G in a full turn, ≈ 9 G in a
  break. Above 6 G the edges of the view close in (vision tunnel).

### Missiles (evasion-missiles.ts)

| | SAM | AAM |
|---|---|---|
| Launch speed → top speed | 120 → 380 px/s over 1.0 s | 300 → 470 px/s over 0.5 s |
| Turn limit | 2.9 rad/s | 3.6 rad/s |
| Turn-acceleration limit | 6 rad/s² | 9 rad/s² |
| Motor burn | 6.0 s | 4.5 s |
| Look / launcher | larger, white, red band; ground site | slim, grey, yellow band; enemy fighter |

- Missiles turn tighter than the jet (both turning circles ≈ 130 px, the jet's sustained circle is
  132 px), so circling does not shake them; only the break's 85 px circle does.
- **Guidance**: lead pursuit — aim at `jet + v̂ × t_go × 0.6` (`t_go = range / missile speed`),
  commanded turn = `clamp(5 × aim error, ±limit)`, the turn rate moves towards it by at most the
  turn-acceleration limit. `v̂` is the missile's **estimate** of the jet's velocity: it follows the
  real one at **3 /s**. At range the lead is accurate; a sudden break close in goes unseen for a
  moment — missiles are slow to correct when the jet crosses their nose.
- **Hit**: a tracking missile whose closest approach to the jet within the tick is **≤ 14 px**
  explodes: hull −1, unless the jet is in its **1.2 s** grace after a hit (explodes, no damage,
  not evaded).
- **Overshoot**: the jet more than **72°** off a tracking missile's nose → lock lost, harmless, flies
  on 1.2 s and pops: **+1 evaded** ("OVERSHOOT").
- **Burn-out**: motor time used up while tracking → harmless, tumbles and fades over 1 s:
  **+1 evaded** ("BURNED OUT").
- **Flares**: a pack (two flares, 2 s life, ejected backwards and sideways) goes out when a charge is
  left — **3 charges**, one recharges every **4 s**. Each tracking missile within **260 px** rolls once
  (seeded) against the decoy chance by the angle θ between the missile and the jet's tail:
  **90 %** for θ ≤ 45°, falling linearly to **15 %** at θ ≥ 135°. Success → it chases the flare and
  pops on it (within 16 px or after 1.6 s): **+1 evaded** ("DECOYED"); failure → "NOT FOOLED".
- Per wave missiles get faster and turn harder: speed ×(1 + 0.05 (k − 1)) up to ×1.4, turn and
  turn-acceleration limits ×(1 + 0.04 (k − 1)) up to ×1.35.

### Break-turn windows (single SAM, 90° break towards the missile's side)
Seconds before impact at which the break starts and still makes the missile overshoot:

| Missile from | Normal break | High-G break |
|---|---|---|
| astern (tail chase) | 0.7 – 1.2 | 0.45 – 0.7 |
| the beam | 0.55 – 1.2 | 0.45 – 2.2 |
| ahead (head-on) | 0.55 – 0.7 | 0.45 – 0.55 |

Earlier → the missile re-aims and hits later; later → hit. The G-break moves the window later (it
saves a late reaction). The RWR shows it: a blip turns **red under 1.3 s** to impact (break now) and
**flashes under 0.65 s** (only the G-break still helps). Time to impact = `impactTime`: the closing
time, or sooner if the missile would close faster pointing straight at the jet.

### Waves (evasion-waves.ts) and round
- Wave 1 starts at **0.5 s**. Wave k has `min(6, 1 + ⌈k/2⌉)` missiles from `min(4, ⌈k/2⌉)` screen
  sides (seeded order, round robin), the AAM share is `min(0.6, 0.15 (k − 1))` (wave 1: SAMs only),
  launches are `max(0.8, 1.6 − 0.1 k)` s apart.
- Every launch is announced **0.9 s** ahead (RWR arc, edge marker with a countdown ring, "MISSILE
  LAUNCH", `warning`). The launch point is kept relative to the jet: north / south `(±520 u, ∓620)`,
  east / west `(±760, ±300 u)`, u ∈ [−1, 1] seeded — beyond the visible field. The missile starts
  pointing at the jet.
- The next wave starts **1.5 s** after no missile is tracking and nothing is pending. Faster evasion →
  more waves → more missiles (a clean round reaches wave 11–12, ≈ 45 missiles).
- **Hull 3**. A hit: camera shake, explosion, "HIT!"; the jet trails smoke (fire at hull 1). Hull 0 →
  shot down, the round ends. At **90 s** the round ends ("SURVIVED!"); missiles still in the air pop
  and do not count.
- **Score = missiles evaded** (overshoot + burn-out + decoyed), `higherIsBetter: true`, formatted
  "{n} missiles evaded". The scene holds the end banner for 2.6 s, then returns the score.
- **Medals: bronze 12, silver 24, gold 38** (playtest below).

### Presentation
- Ground: one of the five campaign theatres per round (seeded): its tile pattern plus islands / reefs,
  dunes / rocks / roads / oases, floes, mesas or whitecaps on a 300 px hash grid; clouds above
  (parallax ×1.35) with shadows on the ground.
- The jet: `drawPlaneTop` in the selected plane and paint job, banked by its turn rate, afterburner
  and F-14 sweep with the break, offset shadow, blinking in the grace, smoke trail when damaged.
- Missiles with motor flame and 1.8 s fading smoke trails; flares as flickering glows with sparks.
- SAM sites stay on the ground at their launch points; AAM launchers are enemy fighters streaking
  away from the launch point for 4 s.
- RWR ring (80 px) around the jet: a blip per tracking missile (amber / red / flashing, green outline
  when a flare would likely work, SAM / AAM label), launch arcs. Edge markers for announced launches
  and off-screen missiles.
- Decoy cone behind the jet (±45° bright, ±90° faint, 260 px), glowing when a missile sits in it and
  a flare is ready — then the FLARE button pulses with "FLARE!".
- HUD: hull pips + wave top left, round clock top centre, G meter bottom left, BREAK (cooldown ring,
  READY / HIGH G) and FLARE (charges + recharge pie) bottom right; pop-ups at the missiles ("+1
  DECOYED / OVERSHOOT / BURNED OUT", "NOT FOOLED", "HIT!"), wave banner, end banner.
- Sounds (existing SFX only): warning `warning`, launch `enemyMissile` (panned), flares `flare`, break
  `special`, evaded `pickup` (pitch rises with the streak), resisted `denied`, missile pop
  `explosionSmall`, hit `playerHit` + `explosionLarge`, shot down `explosionHuge`, wave `radioClick`,
  last 5 s `uiMove`, survived `powerup`; engine `setJet` 0.45 → 0.85 in the break (0 on dispose).

## Balance playtest (2026-10-25)

Simulated pilots on the pure rules (`tests/unit/evasion-bots.ts`): a skilled pilot drags the threats
(announced launches included) towards its tail, flares when the missiles in range add up to ≥ 0.7
decoy chance within 1.2 s of impact, breaks 90° towards the most urgent missile at ~0.9 s to impact
(held until it is beaten or 1 s), and uses the G-break for missiles already under 0.6 s. Perception
delay = it reacts to the state that many seconds old; timing error = seeded jitter on every threshold.
60 seeds each (none / bronze / silver / gold, median, 90th percentile):

| Pilot | None | Bronze | Silver | Gold | p50 | p90 |
|---|---|---|---|---|---|---|
| Idle (flies straight) | 60 | 0 | 0 | 0 | 0 | 1 |
| Circler (hard turn all round) | 46 | 14 | 0 | 0 | 8 | 16 |
| Spinner (circling + flares + break spam) | 31 | 23 | 6 | 0 | 10 | 23 |
| Flare spammer (straight, flares in range) | 60 | 0 | 0 | 0 | 3 | 5 |
| Flares only (drags, no breaks) | 42 | 18 | 0 | 0 | 7 | 14 |
| Breaks only (ace timing, no flares) | 1 | 22 | 25 | 12 | 28 | 40 |
| Ace (0.15 s, ± 0.05 s) | 0 | 6 | 28 | 26 | 35 | 44 |
| Average (0.25 s, ± 0.15 s) | 1 | 18 | 26 | 15 | 31 | 40 |
| Slow (0.35 s, ± 0.25 s) | 2 | 17 | 29 | 12 | 28 | 41 |
| Late breaker (breaks ~0.45 s out) | 11 | 25 | 19 | 5 | 20 | 37 |
| Early breaker (breaks ~1.15 s out) | 4 | 10 | 22 | 24 | 32 | 43 |

An ace round averages 13.6 decoys + 19.5 overshoots, 19.5 flare packs, 2.5 hits; 13 of 40 survive the
90 s (break-only: 24.8 overshoots + 1.4 burn-outs, 2.8 hits, 6 of 40 survive). `tests/unit/evasion-pilots.test.ts` asserts the key rows over 30 seeds (passive / circling /
flares-only never reach silver, the ace's median is silver with ≥ 30 % gold, late breakers and
break-only pilots take clearly less gold than the ace).

How the numbers got here (each step re-run against the pilots above):
- First draft (missiles 440 / 520 px/s, 22 px hit radius, launches 400 px out, up to 8 missiles per
  wave 0.35 s apart): no simulated pilot lived past ~30 s. Pure proportional navigation was
  unbeatable; plain lead pursuit was beaten by beaming at any range → the lagging velocity estimate.
- Launch points moved out to 620–820 px (head-on shots from the near edge hit within 0.7 s).
- Deaths were then mostly beam shots while a second missile was tracking → slower missiles (380 /
  470), the 14 px hit radius, flare falloff widened to 45° / 135°, gentler waves (max 6, ≥ 0.8 s
  apart), flares every 4 s.
- Circling still beat missiles (smaller turning circle than theirs) → missile turn limits raised to
  2.9 / 3.6 rad/s; the break's speed bonus cut from +36 % to +16 % (it widened its turning circle).
- Late waves made to lean on flares (flares ignore missile speed): per-wave speed / turn scaling up
  to ×1.4 / ×1.35, AAMs tighter (3.6 rad/s, 9 rad/s²).

**Browser** (dev server, real-time loop, a keyboard pilot sending real `KeyboardEvent`s every 50 ms
with the same strategy): 41 evaded (gold), three hits, shot down at 89 s in wave 11. Touch (drag to
steer, FLARE / BREAK taps with a second finger), the German texts, the five theatres, the hub card
and the result card checked on screen.

## Data Flow

Reads `save.selectedPlane` and `save.livery` for the jet's look and `input.device` for the key
letters. Writes nothing itself: the shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 09 (`drawPlaneTop` with livery), 05 (heading
convention, `headingTo`), 01 (input, audio, particles).

## Security

None (no persisted data of its own).

## Known Issues

See `known_issues` in the frontmatter (balance observations from the playtest).

## Bugs

(none yet — populated by /mdd bug when issues are reported)
