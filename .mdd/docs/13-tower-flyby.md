---
id: 13-tower-flyby
title: Tower Flyby - Three Low Passes Over the Control Tower
edition: TopRun
depends_on: [10-minigames-core]
relates: [10-minigames-core]
source_files:
  - src/game/minigames/flyby.ts
  - src/game/minigames/flyby-jet.ts
  - src/scenes/minigames/flyby.ts
  - src/render/minigames/flyby-base.ts
  - src/render/minigames/flyby-tower.ts
  - src/render/minigames/flyby-controller.ts
  - src/render/minigames/flyby-hud.ts
  - src/render/minigames/flyby-fx.ts
  - src/i18n/minigames/flyby.ts
routes: []
models: []
test_files:
  - tests/unit/flyby.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, off-duty, tower-flyby, flying, afterburner, scoring, medals]
path: Game/Minigames/TowerFlyby
initiative: off-duty-minigames
wave: off-duty-minigames-wave-1
wave_status: active
integration_contracts:
  - function: "MinigameModule (src/scenes/minigames/contract.ts)"
    when: "FLYBY is listed in PLAYABLE; the shell runs rules, 3-2-1, pause, result and saving"
  - function: "drawPlaneSide(ctx, id, x, y, scale, { pitch, throttle, gear, t, livery })"
    when: "the pilot's selected jet is drawn in its own paint job (doc 09)"
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 13 — Tower Flyby

## Purpose

Minigame 2 of the off-duty initiative (unlocks after mission 3, doc 10). Side view over the home air
base: the pilot's own jet (selected plane, its paint job) makes **three high-speed passes** over the
control tower. The lower over the roof, the more points; the afterburner adds a speed multiplier but
makes the jet twitchier. Skim the roof by less than 10 ft and the controller in the glass cab spills his
coffee for a bonus. For fun only (best score and medal per pilot, doc 10).

## Architecture

```
game/minigames/flyby-jet.ts    hull bottoms per jet, lowestPoint / jetSpan, flight step (pitch, speed, climb) — pure
game/minigames/flyby.ts        pass state machine, clearance, pass scoring, ground / tower hits, round end — pure
scenes/minigames/flyby.ts      FLYBY: MinigameModule; FlybyRound reads input, steps the rules, fires sounds / effects
render/minigames/flyby-base    sky, hills, hangars, radar, runway, grass (parallax on the camera x)
render/minigames/flyby-tower   control tower (base building, shaft, balcony, glass cab, roof, obstruction light)
render/minigames/flyby-controller  the controller in the cab: headset, coffee cup, look / sip / spill / flinch / duck
render/minigames/flyby-hud     altitude ladder + FEET OVER THE TOWER readout, pass popups, banner, burner gauge, icon
render/minigames/flyby-fx      sparks, dust, coffee drops (visual only)
i18n/minigames/flyby.ts        EN + DE strings (gameText)
```

World units are logical px. `x` runs along the runway with the tower at x = 0 in every pass; `alt` is the
height of the jet's draw origin (main-gear contact point) above the ground (ground line at screen y 640).
The camera follows the jet horizontally (jet at screen x 300) and never moves vertically, so the ladder
scale on screen is the true scale.

## Business Rules

### Flight model (per fixed 1/60 s tick)
- Input: `climb` −1 … 1 (↑ / W / stick up = +1, nose up) and `burner` (fire held: Space / J / pad A,
  joystick throttle lever > 85 %, or touch held on the right 40 % of the screen). Touch on the left 60 %:
  drag up/down, 70 px of drag = full deflection.
- Pitch target = `climb × 0.30 rad` (pull-up: 0.32 rad; at the ceiling alt 520 the target is capped at 0).
  Pitch eases towards it by `min(1, k·dt)` with k = **3.5 /s**, or **6 /s** with the afterburner.
- Speed eases towards **900 px/s** (normal) or **1300 px/s** (afterburner) with k = **1.6 /s**.
- **Bumpy air**: a deterministic vertical gust is added while the pass is open:
  `gust = 40 × (0.6·sin(1.9t + 0.7 + 2.3p) + 0.4·sin(4.7t + 2 + 1.1p))` px/s (t = seconds into the pass,
  p = pass index) — the same pattern every round, different per pass, roughly ±15 px of drift if left alone.
  `createFlyby(plane, turbulence)` scales it (1 in the game, 0 for the calm reference pilots in the tests).
- `x += speed·dt`, `alt += (speed·sin(pitch)·0.6 + gust)·dt`, alt ≤ 520.
- Jet drawn at scale **1.1**; its lowest point is the lowest of its hull-bottom points (plane units, y up,
  rotated by the pitch): F-16 nose 52/18.6, intake 25.6/8.6, belly 6/8.2, ventral fin −37.8/7.4, stabilator
  −56/15.4; F-14 nose 62/20.5, glove 17.5/13.2, belly −6/12.4, ventral fins −41/8.2 and −46.5/8.8, stabilator
  −65.6/18.8; SR-71 nose 80/18.4, nacelle 15/11.4 … −60/12.2, tail −64/17.6.

### Passes
- **3 passes.** Each starts at x = **−2300** (≈ 2.5 s to the tower without, ≈ 2 s with afterburner),
  alt **380**, level, 900 px/s. The tower roof is at alt **230**, the roof is **128 px** wide (±64).
- **Over the tower** = the jet's horizontal span (nose … tail at the current pitch) overlaps the roof.
  While over it, `clearance = lowest point − 230` px; the pass keeps the **minimum** clearance. The speed
  when the jet's origin crosses x = 0 sets the multiplier.
- **Ground**: lowest point ≤ 0 before the pass is decided → pass scores **0** ("GROUND!"), the jet is
  lifted to 2 px, its pitch to ≥ 0, dust + sparks, automatic pull-up.
- **Tower**: clearance ≤ 0 while over the tower → pass scores **0**. Within 40 px below the roof it is a
  **scrape** (jet bounced to 4 px over the roof, sparks on the roof, "SCRAPE!"); deeper it is a **near
  miss** (the jet streaks past in front of the cab, "NEAR MISS!"). Automatic pull-up either way.
- When the jet's tail has passed the roof, the pass is scored (below) and the jet pulls up automatically.
  **1.5 s** after a pass is decided the next one starts; after the third the round ends.
- 1 px = **0.4 ft** on every readout (25 px = 10 ft, 150 px = 60 ft).

### Scoring
- `closeness = clamp(1 − clearance / 150, 0, 1)` — 0 at 60 ft or higher ("TOO HIGH", 0 points).
- `mult = 1 + 0.5 × clamp((speed − 900) / 400, 0, 1)` — 1.0 … **1.5** with a fully spooled afterburner.
- `points = round(600 × closeness × mult)`, plus **+200** "COFFEE SPILL" when clearance < **25 px** (10 ft).
  Best possible pass ≈ 1100.
- Score = sum of the 3 passes, `higherIsBetter: true`.
- **Medals: bronze 1200, silver 2000, gold 2700.** Gold needs three coffee spills with the afterburner
  lit; see the playtest below.

### Presentation
- Altitude ladder at the tower (on the right edge until the tower scrolls in): zero at the roof, ticks
  every 10 ft up to 60 ft, gold spill band 0–10 ft, the jet's lowest point as a marker; above it the live
  **"FEET OVER THE TOWER"** readout (red below 0, gold in the spill band, green while scoring, grey above).
  A dashed roof guide line runs from the jet to the ladder while the tower is still ahead.
- Camera: follows the jet at screen x 300 until 700 px before the tower, then eases to a stop with the
  tower at screen x 500, so the jet streaks across and out of the picture while the controller reacts.
- Per-pass popup over the tower: points, "{ft} FT · ×{mult}", "COFFEE SPILL +200" or the failure
  (SCRAPE! / NEAR MISS! / GROUND! / TOO HIGH); centred on the screen when the tower is out of view.
- "PASS n / 3" banner at each start, afterburner gauge bottom-left, three pass slots top-left.
- Controller: watches the jet, sips between passes; spill → jolts, coffee arcs out, stain on the shirt;
  close (< 60 ft) → flinches; tower hit → ducks behind the console. Cab glass rattles on close passes.
- Sound: `setJet` 0.55 → 1.0 with the afterburner, swelling as the jet passes the tower (back to 0 on
  dispose); `radioClick` + `radioVoice` tower chatter at each start; `splash` on a spill, `cash` /
  `pickup` for points, `playerHit` on scrape / ground, `uiBack` when too high.

### Playtest (medal tuning, 2026-10-25)
- **Calm-air reference pilots** (level at a fixed clearance, unit-tested): 50 px / 20 ft without
  afterburner → 1200 (bronze); 60 px → 1080 (none); 35 px / 14 ft with afterburner → 2040 (silver);
  20 px without → 2160 and 15 px without → 2220 (silver: spills alone are not gold); 15 px with → 2997,
  22 px with → 2871 (gold); 15 / 15 / 40 px with → 2647 (silver: one timid pass costs the gold).
  The afterburner multiplier at the tower is ×1.48 after a full-pass spool.
- **Bumpy-air autopilot** (arrow keys only, 0.3 s look-ahead, unit-tested): 14 px with afterburner →
  3061 gold, 35 px with → 2092 silver, 50 px without → 1216 bronze; aiming 8 px without afterburner
  already scrapes the roof once.
- **Simulated human pilots** (20 rounds each; perception delay 0.12 / 0.20 / 0.28 s, altitude judgement
  error ±3 / ±6 / ±8 px): before the gusts were added, every profile held 8–20 px with the afterburner
  and took gold 20/20 — holding level was trivial, hence the bumpy air. With gusts: the quick pilot
  takes gold 20/20 aiming 14 px with afterburner but fails 29/60 passes aiming 8 px; the average pilot
  takes gold 16/20 aiming 20 px (4/60 passes lost), 9/20 aiming 26 px; the slow pilot tops out at silver.
- **Browser** (dev server, `window.__toprun` bot on the real input path): an afterburner round aiming
  14 px scored 1052 + 1028 + 948 = 3028 (gold); scrape, near miss, ground contact, the DE texts and
  touch (drag left, hold right) checked on screen.

## Data Flow

Reads `save.selectedPlane` and `save.livery` for the jet's look. Writes nothing itself: the shell records
the score (doc 10).

## Dependencies

10 (contract, shell, medals, `gameText` / `mt`), 09 (`drawPlaneSide` with livery), 01 (input, audio).

## Security

None (no persisted data of its own).

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
