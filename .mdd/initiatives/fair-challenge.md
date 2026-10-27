---
id: fair-challenge
title: Fair Challenge
status: in_progress
version: 1
hash: 5933b394
created: 2026-10-27
---

# Fair Challenge

Queued after Second Front (owner, 2026-10-27: "things to put on the list after current waves are finished").

## Overview

Three changes from playing the live game:

1. **Paint jobs before the region, not after it.** Today a theater's camo (desert, arctic, woodland …) unlocks when
   that theater's boss is beaten — so the pilot gets desert camo just as they leave the desert and fly it over the
   ice. The region camos move forward: they unlock when their region opens (the previous boss beaten), so they fit
   where they are flown. The debrief announces them for "the next front".
2. **A game that keeps up with the pilot.** The owner, a seasoned gamer, flew from mission 1 to the Arctic without
   dying once and without upgrading beyond the gun and rockets; their young son struggles with mission 1. Today's
   settings stay the **floor** — the game never gets easier than it is now. On top of it a per-pilot **challenge
   level** rises for pilots who win convincingly and only steps back down after a long struggle **despite**
   upgrading. Moves are rare and small, never a constant up and down. Higher challenge earns **no extra points or
   money** (owner: very good players must not get a bonus on top). Mission results get a finer score (kill share,
   damage avoided, accuracy, power-ups, …).
3. **Side views that look like the real aircraft.** The top views are good; the side views (F-16, F-14, SR-71 and the
   three new jets) look like toys. Rework every side profile to real proportions.

## Design proposal for the challenge level (to confirm in the question round)

- **Measure every sortie** (pure function, bounded log of the last 20 sorties in the save, sent with the cloud save
  so the owner can review real play data): mission, outcome (win / shot down / abort), hull lost, kill share,
  accuracy (hits ÷ shots), power-ups collected and missed, the **kit score** at take-off (gun level, equipment
  levels, secondaries, jet) and the challenge level flown.
- **Challenge level 0–10 per pilot**, 0 = today's game. A mission is flown at `difficulty + 2 · level` through the
  existing scaling (enemy HP, fire rate, bullet speed, boss HP, formation size, wave gap), so level 10 on map 1 feels
  like the start of map 2. Rewards, stars and rating are computed exactly as at level 0.
- **Up:** 3 convincing wins in a row (won, not shot down on the way, ≥ 70 % hull left, ≥ 60 % of enemies killed)
  → +1. A death resets the streak.
- **Down (only above 0):** 7 failed sorties in a row on one mission or across missions, **and** the kit improved
  during that streak (something bought that raises the kit score) **or** the gun is already maxed → −1, and the
  streak starts again. Dying without upgrading changes nothing ("your problem").
- Hysteresis by design: going up needs a clean streak, going down needs seven failures plus an upgrade, so the
  level settles where the pilot wins most missions but has to work for three stars.
- Tuned with the bot playtests (doc 35 method) per level, before it ships.

## Open Product Questions
- [x] Show the challenge level → yes, small: "+3" next to the threat on the briefing, and the admiral says when it
      goes up (owner, 2026-10-27).
- [x] Stars at a higher level → same rules as today: no bonus, no relief — three stars simply get harder (owner).
- [x] The son → yes, a **Rookie** option per pilot (slower enemy bullets, more hull), outside the adaptive rules,
      clearly labelled (owner).
- [x] Mission score → **counts into the pilot rating**, "to make it more distinct. Most players just started, so just
      roll it out to all. For current players it starts now" (owner): no protection for today's ratings; missions flown
      before the release simply have no score until they are flown again.
- [x] Pacific's region camo (Seventies Navy) → available from the start: the Pacific is open from mission 1.
- [x] Side views → real proportions from public three-view dimensions only, no traced artwork.

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/fair-challenge-wave-1.md | A pilot who beats SANDSTORM unlocks the Arctic Splinter for the Arctic missions ahead; each region's camo is ready when the region opens. | complete |
| Wave 2 | waves/fair-challenge-wave-2.md | A pilot who wins three missions in a row with most of the hull left flies the next one at challenge level 1; seven deaths in a row after an upgrade bring it back down; level 0 is today's game. | planned |
| Wave 3 | waves/fair-challenge-wave-3.md | The debrief shows a mission score built from kill share, damage avoided, accuracy and power-ups, with no bonus for the challenge level. | planned |
| Wave 4 | waves/fair-challenge-wave-4.md | All six jets look like the real aircraft from the side on the carrier, in the hangar and in the minigames. | planned |
