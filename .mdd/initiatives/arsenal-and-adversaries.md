---
id: arsenal-and-adversaries
title: Arsenal and Adversaries
status: in_progress
version: 1
hash: bb1cf7fc
created: 2026-10-28
---

# Arsenal and Adversaries

Owner, 2026-10-28, after playing the live game: "Played to the end of area three of four and everything is already
maxed out. Maybe let's add two more minigun levels and uranium ammo, and increase the cost for the higher levels.
However this also needs an enemy adjustment at a later stage to keep it balanced. I'd rather have stronger enemies
and more levels per weapon/equipment, to make the player fail more often but with better weapons to progress. You
will find an optimal adjustment, I fully trust you." And: "Can you think of more enemy types, to keep the
surprises/changes coming more often? Maybe at later levels add mini bosses. Stealth fighters, a base with anti-air …
just to keep it interesting."

## Overview

Measured before planning (income from `generateTimeline` and the bounty scaling, all first clears, 80 % of the
spawned enemies killed, perfect take-offs):

| | income | the whole shop |
|---|---|---|
| map 1, after the Arctic (m18) | ≈ 195,000 | 267,000 (180,000 without the two jets) |
| map 1, all 30 missions | ≈ 574,000 | |
| map 2, m31–m60 | ≈ 2,060,000 | ≈ 1,050,000 (jets 305,000 + doc 37 kit) |

Bounties are more than half of the income, so a good pilot can buy the whole map-1 shop by about the Arctic, which
is what the owner did. Enemy HP grows linearly (+6 % per difficulty step: × 2.0 at m18, × 2.7 at m30, × 4.5 at m60),
while gun damage per second grows 8× from level 1 to 5 and 17× to level 8. Enemy hits do the same damage at m60 as
at m01 (bullet 8, missile 22, flak 12), while armour adds up to +100 % hull. The kit outgrows the enemies.

The fix has three parts:

1. **Deeper arsenal (more to buy, dearer at the top).** Gun levels 1–10 (map 1 gets 6 and 7, map 2 gets 8–10);
   **uranium ammo** (depleted-uranium rounds: more gun damage and armour piercing against ground targets);
   **Mk II / Mk III** for every missile, rocket pod and bomb; more levels for all seven pieces of equipment. Each
   map's shop costs about what the map pays out (map 1 ≈ 660,000, map 2 ≈ 2.1–2.4 million), so the kit keeps growing
   until the last theater instead of being complete halfway.
2. **Stronger enemies.** HP grows faster than linearly with difficulty, and enemy hits do more damage at higher
   difficulty, so the new levels are needed. The Pacific (m01–m06), where the owner's son plays, stays within a few
   percent of today. The challenge level (doc 38) stays on top as it is.
3. **New adversaries.** New enemy types from the middle of map 1 on (stealth fighters, a fast interceptor, a jammer
   plane, hardened bunkers, missile frigates) and **mini-bosses** in the middle of later missions (an anti-aircraft
   fortress, a bomber leader, a missile cruiser). Every theater introduces something new.

Balance is justified by bot playtests (doc 35 method) and written into the docs before it ships (CLAUDE.md).

## Open Product Questions
- [x] Ask before building? → no: "You will find an optimal adjustment. I fully trust you" (owner, 2026-10-28).
- [x] Where do the two new gun levels go → map 1 gets levels 6–7 (the owner is on map 1), the old map-2 levels move
      up to 8–10, so both maps gain two levels. The new jets' main gun and their second gun go to 7, and two level-7
      guns match one level-10 gun (doc 37's rule).
- [x] Existing pilots → nothing they own gets weaker beyond one small DPS trim (gun level 7, 1,260 → 1,120). Armour,
      flares and gun levels keep their effects, and the new levels are added on top. Higher prices only apply to
      what is not yet bought.
- [x] Rookie (doc 38) → unchanged: the son's Rookie switch still gives 1.5 × hull and slower enemy fire. The new
      scaling barely touches the Pacific.

## Waves
| Wave | File | Demo-state | Status |
|------|------|------------|--------|
| Wave 1 | waves/arsenal-and-adversaries-wave-1.md | A map-1 pilot can buy gun levels 6–7, uranium ammo, Mk II weapons and new equipment levels at rising prices; later missions hit harder and need them; the Pacific plays as today. | complete |
| Wave 2 | waves/arsenal-and-adversaries-wave-2.md | From the Gulf on, every theater brings new enemy types (stealth fighters, interceptors, jammers, bunkers, frigates), and later missions have a mini-boss halfway through. | planned |
