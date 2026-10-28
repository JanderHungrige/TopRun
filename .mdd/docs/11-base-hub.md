---
id: 11-base-hub
title: BASE Hub - Off-Duty Menu and After-Mission Offers
edition: TopRun
depends_on: [10-minigames-core, 03-campaign-map, 06-talking-characters]
relates: [10-minigames-core, 30-hangar-base]
source_files:
  - src/scenes/base-hub.ts
  - src/scenes/base-hub-render.ts
  - src/scenes/minigame-offer.ts
routes: []
models: []
test_files:
  - tests/unit/minigames.test.ts
data_flow: reads-existing
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [minigames, base, hub, rec-room, offers, wingman]
path: Game/Minigames/Hub
initiative: off-duty-minigames
wave: off-duty-minigames-wave-1
wave_status: complete
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites: []
sister_projects: []
---

# 11 — BASE Hub

> **Update (2026-10-25, doc 30 — hangar base):** BASE (`{ to: 'base' }`) is now the animated pixel-art hangar
> (`HangarBaseScene`, doc 30). The hub below became the **rec room** behind the hangar's FUN MISSIONS area:
> route `{ to: 'recRoom' }` → `BaseHubScene`. Its MAP button is now **BASE** (`hbase.back`), and ESC / Backspace /
> **B** go back to `{ to: 'base' }` (the pilot stands at FUN MISSIONS again). Games started here use
> `{ to: 'minigame', id, from: 'recRoom' }` and return to the rec room; the shell's `from` is
> `'recRoom' | 'offer'`. The wingman still greets on entry. Everything else below is unchanged.

## Purpose

Where the off-duty minigames live: a BASE screen reached from the campaign map, plus the card that
offers a game after a mission. Later initiatives add rooms here (locker with the dress uniform and
medals, picture wall of completed missions — see the backlog note in `.startup.md`).

## Architecture

```
scenes/base-hub.ts         BaseHubScene: 5×2 game cards, offers toggle, MAP; wingman greeting
scenes/base-hub-render.ts  card drawing (icon, name, best + medal, locked / coming soon)
scenes/minigame-offer.ts   MinigameOfferScene: "OFF DUTY" card after a debrief: PLAY / SKIP
```

Routes: `{ to: 'base' }`, `{ to: 'offer', id, isNew }`, `{ to: 'minigame', id, from }` (doc 10).

## Business Rules

- **Map**: a BASE button in the top bar (key **B**) opens the hub.
- **Hub**: ten cards in data order (two rows of five). Each card shows the game's icon and name,
  and one status line:
  - unbuilt (not in the registry): "COMING SOON", dimmed;
  - locked: "After mission {n}", dimmed with a padlock;
  - unlocked, never played: "Not played yet";
  - played: "Best: {score}" with the medal for that best.
  Arrows move the focus (left/right within a row, up/down between rows), ENTER / click plays an
  unlocked game (`from: 'recRoom'`, was `'base'` before doc 30). A locked or unbuilt card plays the "denied" sound.
- **Offers toggle**: "OFFERS AFTER MISSIONS: ON/OFF" flips `settings.minigameOffers`.
- **Wingman** greets on entry (and says when a game is still locked).
- **After-mission offer**: the debrief computes `offerAfterMission` from the progress before and
  after the mission; on CONTINUE after a successful mission with an offer, the offer card appears
  instead of the map: wingman line, the game's icon and name, "NEW!" if just unlocked, PLAY / SKIP,
  hint "Offers can be switched off in BASE". PLAY → the game (`from: 'offer'`, back to the map);
  SKIP / Esc → the map. FLY AGAIN, LOADOUT and BASE skip the offer.

## Data Flow

Reads `SaveData.progress` / `minigames` and `Settings.minigameOffers`; writes only the setting.

## Dependencies

10 (registry, rules, shell), 03 (map, debrief), 06 (wingman lines).

## Security

None.

## Known Issues

(none yet)

## Bugs

(none yet — populated by /mdd bug when issues are reported)
