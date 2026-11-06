---
id: 47-admin-pilot
title: Admin Pilot - Preset Pilot 4 Called ADMIN Opens Every Mission and Has Unlimited Money, Off the Ladder
edition: TopRun
depends_on: [08-pilot-profiles, 03-campaign-map, 02-hangar-economy, 27-online-ladder]
relates: [08-pilot-profiles, 28-ladder-screen, 34-cloud-pilots, 35-second-map, 10-minigames-core]
source_files:
  - src/game/admin.ts
  - src/game/save.ts
  - src/game/progress.ts
  - src/game/minigames/core.ts
  - src/core/math.ts
  - src/main.ts
  - src/scenes/new-pilot.ts
  - src/scenes/pilots.ts
  - src/scenes/map.ts
  - src/scenes/ladder.ts
  - src/scenes/base-hub.ts
  - src/render/admin-badge.ts
  - src/i18n/ui-en.ts
  - src/i18n/ui-de.ts
  - src/i18n/ui-en-ladder.ts
  - src/i18n/ui-de-ladder.ts
routes: []
models:
  - "SaveData.admin: boolean (runtime only: parseSave always reads false, GameContext.save sets it for the admin pilot)"
test_files:
  - tests/unit/admin.test.ts
data_flow: writes-existing
last_synced: 2026-11-06
status: complete
phase: all
mdd_version: 11
tags: [admin, test-pilot, cheat, unlock-all, unlimited-money, profiles, ladder]
path: Game/Pilots/Admin Pilot
integration_contracts: []
satisfies_contracts: []
known_issues: []
security_read_sites:
  - src/game/save.ts (admin is never read from the untrusted profile store / cloud save — always false)
sister_projects: []
---

# 47 — Admin Pilot

## Purpose

Wave 1 of New Frontiers. Owner, 2026-11-06: *"We need an 'admin' pilot. If I choose the 4th pilot and call him
admin, this enables all levels and infinitive money, so I can try stuff ingame later."* A test pilot for the owner,
so maps 3 and 4 (and everything else) can be tried without flying the whole campaign first.

## Who is the admin

A pilot is the admin when both hold (`isAdminPilot`, pure, `src/game/admin.ts`):

1. its card is **`pilot4`** — the 4th card in NEW PILOT's first row (doc 08). A look built in the avatar builder is
   filed under pilot1–3 (`lookPreset`), never pilot4;
2. its callsign is **ADMIN** (callsigns are upper-cased, so "admin" typed counts).

A pilot's card and callsign never change after it is made, so the admin stays the admin (EDIT LOOK included) and
no other pilot can become one later. The callsign rules don't change: ADMIN stays a valid callsign for any card,
and a pilot called ADMIN with another face is an ordinary pilot. Nothing is stored: the admin is recognised every
time from the profile.

## What the admin gets

`GameContext.save` hands every scene an **admin view** of the active pilot's save (`adminView`, pure):

- **Every mission on every map unlocked** — `isUnlocked` is true for all missions; `mapTwoOpen` is true, so the
  globe opens map 2 and everything the hangar sells once map 2 is open is on sale (new jets, second gun, ladders,
  incendiary ammo, the HE gun). Later maps (3 and 4) follow the same rule.
- **Unlimited money** — the view always holds `ADMIN_MONEY` = $999,999,999, refilled on every read, so a purchase
  never runs out. Money of that size is shown as **$∞** wherever money is shown (map, hangar, pilot list, debrief).
- **Every rec-room game open** — the rec room offers all playable minigames, not only those unlocked by missions.
- **Where the campaign map opens:** with everything unlocked, "the highest unlocked mission" would always be m60, so
  the admin's default selection is the first mission not yet cleared (on the map shown, when switching maps).
- Unchanged: stars, medals, photos, ranks and paint jobs are still earned by flying (they are records, not gates),
  missions pay as usual, the challenge level (doc 38) works as for anyone.

Where the view comes from: `adminView(save)` = `{ ...save, money: ADMIN_MONEY, admin: true }`. The scenes keep
writing through `setSave`, which stores `adminStored(save)`: no admin flag, a full purse, the ladder link unshared.
`admin` is never read back from storage (`parseSave` always reads false), so a forged profile store or cloud save
can't make anyone admin. A new admin pilot is saved once right after it is made, so the pilot list shows $∞ at
once.

## Off the ladder and the cloud

The site is public and the ladder must stay fair, so the admin **never appears on the online ladder** (doc 27) and
its save is **never uploaded to the cloud** (doc 34):

- `setSave` keeps the admin's ladder link at `share: false`, and the ladder submission and the cloud upload refuse
  the admin outright (`isAdminPilot` in `GameContext`), so nothing is sent. If an older pilot that is now recognised
  as admin was shared, its entry is deleted from the ladder the first time it is saved; the ladder screen's
  usual opt-out retry deletes it too.
- The ladder screen shows no SHOW/HIDE button for the admin, and the status line reads
  "ADMIN is an admin pilot and stays off the ladder."

## Look

- **Badge:** a small gold **ALL ACCESS** / **VOLLZUGRIFF** plate (the callsign already reads ADMIN) on the portrait's
  corner of the pilot list card (CONTINUE) and after the callsign in the campaign map's top bar (`drawAdminBadge`,
  `src/render/admin-badge.ts`).
- **NEW PILOT:** while the 4th card is picked and the callsign field reads ADMIN, the line under the field turns gold:
  "ADMIN PILOT: every mission, unlimited money, no ladder".

## Business Rules

- Pure logic in `src/game/admin.ts`: `isAdminPilot`, `adminView`, `ADMIN_MONEY`; gates read `save.admin` in
  `src/game/progress.ts` (missions, map 2) and `src/game/minigames/core.ts` (`openMinigames`).
- `formatMoney(v)` prints $∞ for `v ≥ UNLIMITED_MONEY` (`src/core/math.ts`; `ADMIN_MONEY` is the same number — no
  ordinary pilot gets anywhere near a billion).

## Verified (2026-11-06)

Unit tests `tests/unit/admin.test.ts` (who is admin, every mission and map 2 open, first-uncleared start, ten HE gun
levels bought with the purse still full, every rec-room game open, stored off the ladder, flag never parsed). In the
browser (dev build): ADMIN + card 4 → map with all 30 nodes open and the globe unlocked, ALL ACCESS plate and $∞ in
the top bar; the hangar sells the map-2 jets and buying the A-10 leaves $∞; the ladder screen has no SHOW/HIDE
button, reads "ADMIN is an admin pilot and stays off the ladder" and sends no POST; the pilot list card carries the
plate and $∞; NEW PILOT shows the gold hint; the rec room has every built game open.
- Strings in `ui-en.ts`/`ui-de.ts` and the ladder files.

## Save

`SaveData.admin: boolean` — runtime only. `defaultSave()` and `parseSave()` set false; it is written to storage
only as a side effect of saving the view and ignored when read. No migration.
