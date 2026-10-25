---
id: 14-formation-flying
title: Formation Flying - Hold the Slot on Duke's Right Wing Through an Air-Show Routine
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core, 13-tower-flyby]
source_files:
  - src/game/minigames/formation.ts
  - src/game/minigames/formation-script.ts
  - src/scenes/minigames/formation.ts
  - src/scenes/minigames/formation-radio.ts
  - src/scenes/minigames/registry.ts
  - src/render/minigames/formation-world.ts
  - src/render/minigames/formation-jets.ts
  - src/render/minigames/formation-smoke.ts
  - src/render/minigames/formation-hud.ts
  - src/render/minigames/formation-radio.ts
  - src/i18n/minigames/formation.ts
routes: []
models: []
test_files:
  - tests/unit/formation.test.ts
  - tests/unit/formation-pilots.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, formation-flying, flying, echelon, wingman, smoke, scoring, medals]
path: Game/Minigames/FormationFlying
initiative: off-duty-minigames
wave: off-duty-minigames-wave-2
wave_status: complete
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "FORMATION is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawPlaneTop(ctx, id, x, y, scale, { bank, sweep, throttle, t, livery, shadow })"
    when: "the lead (Duke, F-14, standard scheme) and the pilot's own jet in its paint job (doc 09)"
satisfies_contracts: []
known_issues:
  - "Medal limits come from simulated pilots, not human playtesters; re-check gold (5700) with real players (keyboard vs. analog stick)."
security_read_sites: []
sister_projects: []
---

# 14 — Formation Flying

## Purpose

Minigame 3 of the off-duty initiative (unlocks after mission 5, doc 10). Top-down, like the missions.
The lead — Lt. "Duke" Carter, the squadron's wingman (F-14, standard scheme) — flies a scripted ~60 s
air-show routine over the sea; the pilot flies their own jet (selected plane, its paint job) and must hold
the **slot on Duke's right wing** (echelon right) through weaves, power changes, a hard 180° turn, a
pitch-up and a SMOKE ON pass. Your jet has inertia: it drifts, so the pilot has to anticipate. No shooting.
For fun only (best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/formation-script.ts  the routine as keyframed channels (lead x / y, altitude, turn rate,
                                    ground speed), segments, radio-call schedule, leadPose(t) — pure, deterministic
game/minigames/formation.ts         slots, wing physics (inertia, turn drift, jet wash), zones, scoring, rating,
                                    prediction, round end, medals — pure
scenes/minigames/formation.ts       FORMATION: MinigameModule; FormationRound reads input (keys / pad / touch stick),
                                    steps the rules, banners, sounds, smoke and vapour emission
scenes/minigames/formation-radio.ts DukeRadio: the scripted calls plus "tighten up" / "give me room" / "looking good"
                                    chirps with cooldowns, typewriter + radio babble
render/minigames/formation-world    sea, islands, reefs, whitecaps, boats with wakes, low clouds — scrolled and rotated
                                    with the formation's track
render/minigames/formation-jets     jets + sun-fixed shadows, slot ghost, tolerance rings, prediction pip
render/minigames/formation-smoke    air-fixed smoke puffs (red / blue) and wingtip vapour
render/minigames/formation-hud      routine timeline, IN SLOT gauge + zone readout, ×2 badge, segment banner,
                                    touch stick, hub icon
render/minigames/formation-radio    Duke's radio strip: live portrait (radio feed) + typed line
i18n/minigames/formation.ts         EN + DE strings (gameText), including all of Duke's lines
tests/unit/formation-pilots.ts      test helpers: state setup and the simulated pilots of the playtest
```

**Frame.** Everything happens in the camera frame = the 1280×720 screen. The camera flies with the
formation: it moves along the formation's track at the ground speed and **turns with it**, so in a turn
the sea rotates under the jets. The lead's on-screen position is scripted; the pilot's jet has its own
position and velocity in that frame.

## Business Rules

### The routine (deterministic, `formation-script.ts`)
Times are seconds after GO. Channels are keyframe tables: lead **x / y** (Catmull-Rom spline through the
keys), **altitude** 0…1 (smooth-step between keys), **turn rate** ω in rad/s (linear, + = right turn) and
**ground speed** factor (linear). The lead's centre rests at (560, 400).

| Segment | Time | What the lead does | Duke on the radio |
|---------|------|--------------------|-------------------|
| JOIN UP | 0 – 4 | holds steady; not scored | join up on my right wing / show starts |
| WEAVES | 4 – 16 | gentle S-weaves, about ±90 px | gentle weaves |
| CLOSURE | 16 – 25 | power back (slides ~95 px back), then power up (surges ~170 px forward) | power back… / …and power up |
| TURN | 25 – 34 | hard **180° left turn**: ω ramps to −0.42 rad/s, holds, ramps out | hard left — you're outside, add power |
| PITCH-UP | 34 – 43 | on "NOW!" (36 s) pulls up: altitude 0 → 1 → 0, bleeds speed (slides back), pushes over | pitch-up on my call… NOW! |
| SMOKE ON | 43 – 58 | calm, a gentle right curve; **smoke on 44 – 58 s, points ×2** | smoke on… now / smoke off |
| BREAK | 58 – 61 | breaks away left; not scored | end call by the rating |

The round ends at **61 s** (the shell's result card follows).

### Slots (co-op ready)
- Echelon slot = a fixed offset from the lead, behind and to the side, **rotated with the lead's yaw** and
  scaled with altitude (`× (1 + 0.22 · alt)`, the jets come closer to the camera in the pitch-up).
- Offsets per pilot jet so the wingtips never overlap (lead F-14, drawn at scale 1.35):
  F-16 **(94, 72)**, F-14 **(106, 74)**, SR-71 **(100, 90)** px (right of and behind the lead's centre).
- `SlotId = 'right' | 'left'`; the left slot is the same offset mirrored. The state holds an **array of
  wings**, each with its own slot, jet, input and score — the game creates one (`['right']`).
  A later **co-op mode** (with the LAN co-op backlog item) adds a second player as a `'left'` wing:
  that is data only (`createFormation([{ slot: 'right', … }, { slot: 'left', … }])`), the rules need no change.

### Your jet (per fixed 1/60 s tick)
- Input: a stick vector (keys / d-pad / analog stick via `moveVector()`; touch: a virtual stick — drag from
  where the finger went down, **60 px = full deflection**), clamped to length 1.
- Inertia: `dv/dt = stick · 400 − v · 1.6` px/s², integrated exactly per tick (top speed **250 px/s**; let go
  and it coasts on for ~0.6 s, `v / 1.6` px).
- **Turn drift**: in a turn the outside wing has to fly a bigger circle. With `r` = jet − lead,
  the jet is moved by `(ω · r.y, −ω · r.x) · dt` on top of its own velocity — in the left turn the right
  wing falls behind and slides in unless the pilot holds forward (adds power).
- **Jet wash**: the lead's wake bumps your jet by a deterministic drift of up to **45 px/s** per axis
  (`45 · (0.6 · sin(a·t + p) + 0.4 · sin(b·t + q))`, slow and fast part, different per slot) — about ±20 px if
  left alone, so even a quiet segment needs small corrections. `createFormation(wings, wash)` scales it
  (1 in the game, 0 for the calm-air physics tests).
- The jet stays inside x 40…1240, y 90…690 (velocity into the edge is dropped).
- Start: slot + (70, 120) — behind and right, so the first 4 s are a join-up.
- **Prediction pip** (anticipation aid): where the jet will be in **0.5 s** with the stick centred
  (`p + v · (1 − e^(−1.6·0.5)) / 1.6` plus the turn drift; the jet wash is not predicted).

### Zones and score
- Distance `d` from the jet's centre to the slot: **inner** `d ≤ 18 px` (TIGHT, full points), **outer**
  `d ≤ 40 px` (LOOSE, half points), otherwise **out** (no points).
- Scored from 4 s to 58 s: inner **100 pts/s**, outer **50 pts/s**, out 0; **×2 while the smoke is on**.
  Best possible: 54 s × 100 + 14 s × 100 = **6800**.
- Score = rounded formation points, `higherIsBetter: true`, format "5,240 pts" / "5.240 Pkt.".
- Live: the top bar shows the points; the HUD shows **"IN SLOT 94 %"** = points / best possible so far.
- Out for **1 s** in a row (scored time) → Duke chirps "Tighten up!" (cooldown 5 s, three variations).
  Closer than 70 px to the lead's centre → "Easy — give me some room!" (cooldown 5 s).
  8 s in a row in the inner zone → "Looking good!" (cooldown 12 s).
- **Medals: bronze 2000, silver 4000, gold 5700** (29 / 59 / 84 % of the best possible), set by the playtest below.

### Presentation
- Sea from the Pacific theater (sea tile, islands and reefs from the mission terrain art), small boats with
  wakes, low clouds drifting faster than the sea; the whole ground rotates in the turn and slows in the
  pitch-up. Jets cast shadows on the sea (further away and fainter in the pitch-up).
- Lead: F-14 standard scheme, wings at 25 % sweep, banks from turn rate and lateral acceleration, yaws
  slightly with lateral speed. Your jet: same scale (1.35 × (1 + 0.22 · alt)), your paint job, banks from
  your lateral acceleration and the turn. Shadows keep the sun fixed in the world: their offset turns with
  the sea in the turn.
- Slot: a faint dashed ghost silhouette of **your** jet under the jets; over the jets an inner ring (solid)
  and an outer ring (dashed) with a centre cross; the ring of the zone you are in lights up (gold TIGHT,
  amber LOOSE), out of the slot the outer ring pulses red. The prediction pip is a small cyan diamond on a
  thin dashed line from your jet.
- Smoke: lead red, you blue; air-fixed puffs that billow, stream away behind the jets at ground speed and
  curve in the turn. Wingtip vapour streams off both jets in the hard turn and the pull of the pitch-up.
- HUD: routine timeline (segments, a cursor; the smoke segment marked ×2) at the bottom; IN SLOT % gauge
  and the zone word (TIGHT / LOOSE / OUT OF SLOT) bottom right; "SMOKE ×2" badge while smoking; a segment
  banner at each segment start; Duke's radio strip (live portrait as a radio feed + typed line) top left.
- Sound: `setJet` 0.42 … 0.74 with your forward stick and the pitch-up (0 on dispose / pause);
  `radioClick` + `radioVoice` babble for Duke's lines; `flare` hiss at smoke on / off; `uiMove` (high) on
  entering the inner zone, `uiMove` (low) on dropping out of the slot (show time only).
- Touch: the virtual stick is drawn while a finger is down (ring where it went down, knob at the drag).
- The scenery (islands, boats, clouds) is seeded by the play count, so it changes per round; the routine
  and the jet wash never do.

### Playtest (medal tuning, 2026-10-25)
Simulated pilots on the pure rules (`tests/unit/formation-pilots.ts`; jet wash on). The keyboard pilot
extrapolates the slot 0.3–0.5 s ahead from what it saw *delay* s ago, compares it with the prediction pip,
misjudges by up to ±*noise* px and presses full keys per axis outside a 3 px dead band; "12 Hz" = it changes
its keys at most 12 times a second (a realistic tapping rate).

- **Physics tuning.** The first draft (accel 640, drag 1.6, no jet wash) was too easy at the top and too
  steep below: every zero-delay bot scored 6800, a quick pilot (0.15 s / ±4 px) 6704, an average one
  (0.20 s / ±6 px) 5476, a slow one (0.25 s / ±8 px) 3791 — the routine alone barely separates good
  pilots. Adding the **jet wash** (45 px/s) spread the field; lowering the stick authority to **accel 400, drag 1.6** (top speed 250 px/s) made taps finer and
  kept slow pilots from oscillating (slow 12 Hz pilot 2255 – 2556 at accel 540 / drag 1.8 → 2711 – 3183)
  without making gold easy. A key
  ramp (keys reaching full deflection over 0.12 s) was tried and dropped: it adds lag that destabilises
  delayed pilots (average pilot 5121 → 2814).
- **Final tuning** (6 seeds each):

  | Pilot | reaction / misjudgement | full-rate keys | 12 Hz keys | medal |
  |-------|------------------------|----------------|------------|-------|
  | lets go of the stick | — | 0 | — | none |
  | no anticipation (chases the slot) | 0.20 s / ±6 px | 902 – 1207 | — | none |
  | quick, anticipating | 0.12 s / ±3 px | 6226 – 6629 | 5787 – 6069 | gold |
  | average | 0.20 s / ±6 px | 5012 – 5284 | 4513 – 4781 | silver |
  | slow, uses the pip | 0.28 s / ±8 px | 3417 – 3799 | 2711 – 3032 | bronze |
  | casual | 0.35 s / ±10 px | — | 1805 – 2506 | bronze or none |
  | analog stick (proportional), average | 0.20 s / ±6 px | 5486 – 5774 | — | silver (gold at the top) |

  The F-14 and SR-71 slots play the same as the F-16 (average pilot 5242 – 5350). Gold = a quick pilot who
  anticipates; the "outer ring only" pilot (half points throughout) would score 3400 = bronze.
- **Browser** (dev server, `window.__toprun` bot pressing the real arrow keys every tick): zero-delay bot
  6782 / 6787 gold; 12 Hz human-like bots: quick 5906 gold, average 4748 silver, slow 2705 bronze; no
  anticipation 742. Checked on screen: join-up, weaves, closure, the 180° turn (sea rotates, shadows swing,
  vapour), pitch-up (jets grow, shadows drift away), smoke pass (×2 badge, billowing trails), break and
  the result card with medal and personal best; Duke's scripted calls and all chirps (EN and DE); the
  touch stick; F-16, F-14 and SR-71 in the slot without overlapping the lead.

## Data Flow

Reads `save.selectedPlane`, `save.livery` and the profile's callsign (for Duke's lines). Writes nothing
itself: the shell records the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 09 (`drawPlaneTop` with livery), 05 (terrain art),
06 (the wingman's portrait), 01 (input, audio).

## Security

None (no persisted data of its own).

## Known Issues

- The medal limits come from simulated pilots, not from human playtesters; re-check gold (5700) once real
  players have flown it, especially on keyboard vs. analog stick.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
