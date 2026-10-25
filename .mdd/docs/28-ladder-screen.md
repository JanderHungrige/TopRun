---
id: 28-ladder-screen
title: Ladder Screen - Online Ladder in the Game, Pilot Ranks, Posting the Rating
edition: TopRun
depends_on: [26-pilot-rating, 27-online-ladder, 08-pilot-profiles]
relates: [24-medals-core, 10-minigames-core]
source_files:
  - src/game/ladder-stats.ts
  - src/core/ladder-api.ts
  - src/core/ladder-sync.ts
  - src/scenes/ladder.ts
  - src/scenes/pilot-rating.ts
  - src/core/math.ts
  - src/render/ranks.ts
  - src/render/ladder.ts
  - src/scenes/title.ts
  - src/scenes/pilots.ts
  - src/scenes/minigames/registry.ts
  - src/game/save.ts
  - src/main.ts
  - src/i18n/ui-en-ladder.ts
  - src/i18n/ui-de-ladder.ts
routes: []
models:
  - "SaveData.ladder: { id, secret, share } | null (per pilot, in the profile store)"
test_files:
  - tests/unit/ladder-client.test.ts
  - tests/unit/ladder-sync.test.ts
data_flow: mixed
last_synced: 2026-10-25
status: complete
phase: all
mdd_version: 11
tags: [ladder, leaderboard, ranks, ui, profiles]
path: Game/Ladder/Screen
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Medals and kills count 0 until Home Base Honours wave 1 (doc 24) is merged; then medals = earnedMedals().length, kills = save.record.kills."
  - "Resolved 2026-10-25: merged with doc 24 — pilotStats now counts earnedMedals() and save.record.kills."
security_read_sites:
  - src/core/ladder-api.ts (ladder JSON from the network)
sister_projects: []
---

# 28 — Ladder Screen

## Purpose

The game side of the online ladder (doc 27): every friend's pilot on one list with rating and naval
rank (doc 26), reachable from the title menu, kept up to date without the player doing anything.

## Ladder identity (per pilot)

- `SaveData.ladder = { id, secret, share }`, created the first time a pilot's save is written
  (`withLadderLink`, 48 bytes from `crypto.getRandomValues`): `id` = `p_` + 22 base64url chars,
  `secret` = 43 base64url chars. `share` defaults to **true** (owner: "all registered pilots").
- Old saves have no link (`null`) until their next save. Deleting a pilot does not remove the
  ladder entry (it ages out, doc 27 pruning); switching SHOW MY PILOT off does (DELETE).
- Stored through `setSave()` like the rest of the pilot (CLAUDE.md persistence rule).

## Posting (automatic)

- After every `setSave()` the game pokes `LadderSync`; 2.5 s later (debounced) it posts the active
  pilot's `{ id, secret, callsign, avatar, stats }` if `share` is on and the submission differs from
  the last one accepted this session. That covers debriefs, minigame bests and hangar purchases
  without touching those scenes.
- Stats: `pilotStats(save)` = `ladderStats(save, tiers, medals, kills)` — stars summed over
  progress, minigame tiers from the registry (`minigameTiers(save)`: each built game's
  personal-best medal), medals = `earnedMedals(save, goldCount(save)).length` (doc 24), kills =
  `save.record.kills`.
- Network errors and non-200 answers are silent (the game never blocks on the ladder).

## Screen (route `ladder`)

- Title menu item **LADDER** (after CONTINUE); with eight or more items the menu rows tighten
  so they stay below the tagline. Header "ONLINE LADDER", backdrop like the pilot list.
- Table: place, rank board + rank name, callsign, rating; 10 rows per page, ↑/↓ scroll a row,
  the ▲/▼ buttons right of the table a page (touch), the active pilot's row (same callsign)
  highlighted. Footer: "YOUR PLACE #n · rating · rank" for the
  active pilot after a post, otherwise the local rating.
- States: loading ("RADIO CHECK…"), offline ("LADDER OFFLINE — try again later"), empty. While
  offline the footer shows the local rating, never a stale place.
- Buttons: BACK, REFRESH, SHOW MY PILOT: ON/OFF (active pilot only; OFF deletes the entry and
  stops posting, ON posts at once). While sharing is off, every visit retries the DELETE, so an
  opt-out that hit a network error still lands. Keyboard: ←/→ between buttons, ↑/↓ scroll, Esc back.
- A small info line: "Callsign, avatar and rating are visible to everyone with the game's link."

## Ranks elsewhere

- Pilot list cards show the pilot's rank board and rank name (local rating, no network).
- `drawRankBoard(ctx, rank, x, y, scale)` (sleeve-stripe style: 1–4 gold stripes, a wide stripe for
  admirals; generic, no national insignia) — reused by the locker uniform later (doc 29+).

## Business Rules

- Rating and rank always come from doc 26's pure functions; the screen shows the service's rating.
- No new persistence path: the link lives in the save; the device keeps no ladder settings.
- Dev: `vite.config.ts` proxies `/api/ladder` to `127.0.0.1:8090` (run the service locally with
  `node --experimental-strip-types server/ladder/main.ts`); without it the screen shows offline.

## Data Flow

Reads the save and the public ladder; writes `SaveData.ladder` and posts to `/api/ladder`.

## Dependencies

26 (rating), 27 (service), 08 (profiles), 10 (minigame medals), 24 (medals, after merge).

## Security

The ladder JSON is untrusted: parsed field by field (callsign rules, known avatars, numbers);
callsigns are drawn as canvas text only (no DOM). The secret never leaves the save except in the
POST/DELETE body to the same origin.

## Known Issues

- Medals/kills counted 0 before doc 24 merged (resolved, see frontmatter).

## Bugs

(none yet — populated by /mdd bug when issues are reported)
