---
id: 34-cloud-pilots
title: Cloud Pilots - Save on the Ladder Service, Load a Pilot by Callsign
edition: TopRun
depends_on: [27-online-ladder, 28-ladder-screen, 08-pilot-profiles]
relates: [08-pilot-profiles, 27-online-ladder, 28-ladder-screen]
source_files:
  - src/game/ladder-cloud.ts
  - src/game/cloud-pilot.ts
  - src/core/ladder-api.ts
  - src/core/cloud-sync.ts
  - server/ladder/http.ts
  - server/ladder/cloud-http.ts
  - server/ladder/store.ts
  - server/ladder/main.ts
  - server/Dockerfile
  - deploy/nginx/default.conf
  - src/scenes/pilot-load.ts
  - src/render/pilot-load.ts
  - server/ladder/reply.ts
  - src/scenes/pilots.ts
  - src/scenes/new-pilot.ts
  - src/main.ts
  - src/i18n/ui-en-cloud.ts
  - src/i18n/ui-de-cloud.ts
routes:
  - PUT /api/ladder/save
  - GET /api/ladder/save?ref=<id>
  - GET /api/ladder/pilots?callsign=<callsign>
models:
  - "saves.json on the ladder volume: { version: 1, saves: { [ladderId]: { save, savedAt } } }"
test_files:
  - tests/unit/ladder-cloud.test.ts
  - tests/unit/cloud-pilot.test.ts
  - tests/unit/cloud-sync.test.ts
  - server/ladder/cloud-http.test.ts
  - server/ladder/image.test.ts
data_flow: mixed
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [cloud-save, profiles, ladder, transfer, devices]
path: Game/Profiles/Cloud
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "No PIN (owner, 2026-10-27): anyone who knows a callsign can load that pilot and then fly — and post — as it. The load screen asks for the Top Gun pilot's honour instead."
security_read_sites:
  - server/ladder/cloud-http.ts (untrusted save bodies and query strings)
  - src/core/ladder-api.ts (saves and matches from the network)
sister_projects: []
---

# 34 — Cloud Pilots

## Purpose

Owner (2026-10-27): moving a pilot to another device should work by callsign and avatar, not by copying a long
text code. "Load a pilot by callsign only, then show the avatar to confirm it is the right one. Anyone could take
over another pilot — but we all know each other." No PIN for now; "rather a message that reminds of the Top Gun
pilot's honour". The pilot code and the PILOT ID card (doc 08) are switched off for now, "they only confuse".

## How it works

1. **Saving.** While a pilot is shown on the ladder (`share`, doc 28), the browser also uploads the pilot's whole
   save to the ladder service, a few seconds after each save and after the ladder post, only when it changed
   (`CloudSync`). The save already holds the ladder link (id + secret), the look and the country. Sharing OFF
   deletes the ladder entry and with it the cloud save.
2. **Loading on another device.** NEW PILOT and the pilot list have **LOAD PILOT** (where PILOT CODE was).
   The player types a callsign; the service lists the pilots with that exact callsign that have a cloud save —
   avatar, flag, rank, rating, last saved. Tapping one shows the **pilot's honour** check ("A Top Gun pilot only
   ever flies their own jet. Load this pilot only if it is really you."), then YES, THAT'S ME loads it.
3. **Joining.** The save is parsed like any untrusted save (`parseSave`); its ladder id must be the chosen entry.
   A pilot already on this device with the same ladder id is replaced in place (same as a pilot code); otherwise
   it joins as a new pilot (callsign taken / hangar full → message). The avatar comes from the ladder key: a
   preset id, or the builder look already in the save (`lookPreset`). It becomes the active pilot and flies on
   the same ladder entry.
4. **Two devices.** When a pilot is picked on the pilot list, the game first asks the service for that pilot's
   cloud save (≤ 2.5 s, silently skipped offline). If the cloud is **further** — a higher pilot rating (doc 26)
   than this device — it offers: "On another device you are further (rating 4,200 instead of 3,100). Load that
   progress?" LOAD / KEEP THIS ONE. Only after that answer does the pick post anything, so an older device never
   overwrites newer progress without being asked. Keeping this one simply uploads it (last one wins).

## Service (doc 27 additions)

- `PUT /api/ladder/save` body `{ id, secret, save }` (JSON, ≤ 48 KB): the ladder entry `id` must exist and its
  secret match (else 404 / 403); `save` must be a JSON object, ≤ 40 KB serialised. Stored as is with `savedAt`
  (server time). Same per-pilot write limit as the ladder (30/min). → `{ savedAt }`.
- `GET /api/ladder/pilots?callsign=ICE` → `{ pilots: [{ ref, callsign, avatar, country, rank, rating, savedAt }] }`:
  entries whose callsign equals the normalised query **and** that have a cloud save, best rating first, at most 10.
  `ref` is the entry id (public from here on; useless without the secret, which only the save carries).
- `GET /api/ladder/save?ref=<id>` → `{ save, savedAt }`, or 404.
- Storage: `saves.json` next to `ladder.json` on the data volume, same store (atomic, debounced). Saves of
  entries that left the ladder (opt-out DELETE, pruning) are dropped.
- nginx forwards `= /api/ladder/save` (body ≤ 48k, writes rate-limited like the ladder) and `= /api/ladder/pilots`
  (read only); `/api/ladder/health` stays internal.

## Switched off (doc 08)

The PILOT CODE button on NEW PILOT and on the pilot list (and its R key) are gone; LOAD PILOT takes their place.
The pilot-code scene, the code format and the ID card stay in the code (route `pilotCode`), unreachable, so they
can come back.

## Security

No PIN by the owner's choice (known issue). Untrusted input everywhere: the service checks ids, secrets, sizes and
shapes and never interprets a save; the browser parses every downloaded save with `parseSave` and checks its
ladder id. Saves hold callsign, progress, look, country and the ladder secret — no personal data beyond the
callsign; the ladder info line says that a callsign is enough to load a pilot.

## Business Rules

- Cloud save only while sharing is on; OFF removes it with the entry.
- Lookup only by exact callsign (no listing of all saves).
- The cloud copy is offered on pilot pick only when its rating is higher than the local one.

## Bugs

(none yet)
