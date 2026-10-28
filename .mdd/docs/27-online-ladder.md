---
id: 27-online-ladder
title: Online Ladder Service - Shared Leaderboard for All Pilots
edition: TopRun
depends_on: [26-pilot-rating, 08-pilot-profiles]
relates: [28-ladder-screen, 35-second-map]
source_files:
  - src/game/ladder.ts
  - server/ladder/main.ts
  - server/ladder/store.ts
  - server/ladder/http.ts
  - server/ladder/log.ts
  - server/Dockerfile
  - tsconfig.server.json
  - docker-compose.yml
  - .github/workflows/deploy.yml
  - deploy/compose.app.yml
  - deploy/nginx/default.conf
  - deploy/auto-deploy.sh
routes:
  - "GET /api/ladder"
  - "POST /api/ladder"
  - "DELETE /api/ladder"
  - "GET /api/ladder/health (container-internal, not proxied)"
models:
  - "ladder.json on the ladder-data volume: { version: 1, pilots: LadderEntry[] }"
test_files:
  - tests/unit/ladder.test.ts
  - tests/unit/ladder-client.test.ts
  - server/ladder/http.test.ts
  - server/ladder/store.test.ts
data_flow: greenfield
last_synced: 2026-10-27
status: complete
phase: all
mdd_version: 11
tags: [ladder, leaderboard, api, server, docker, nginx]
path: Game/Ladder/Service
integration_contracts: []
satisfies_contracts: []
known_issues:
  - "Scores are reported by the browser: a determined player can submit a fake (but plausible) rating. Accepted for a friends' game."
security_read_sites:
  - server/ladder/http.ts (untrusted JSON bodies)
  - server/ladder/store.ts (ladder.json from disk)
sister_projects: []
---

# 27 — Online Ladder Service

## Purpose

The owner wants one ladder for all friends' pilots, on any device (owner choice "online, all
friends"). The game is otherwise client-only, so a tiny service stores the ladder.

## Architecture

```
browser ──HTTPS──> Nginx Proxy Manager ──> app (nginx, static game, :8080)
                                              └─ location /api/ladder → ladder:8090 (compose network)
ladder (Node 24, TypeScript run natively, no npm deps) ── /data/ladder.json (named volume)
src/game/ladder.ts — the pure rules (validation, upsert, ranking), shared by service and tests
```

- `server/Dockerfile` builds `ghcr.io/janderhungrige/toprun-ladder` (CI builds it next to the app
  image). The service runs as an unprivileged user, read-only root filesystem, the data volume the
  only writable path.
- nginx forwards only `= /api/ladder`, uses Docker's DNS resolver (`127.0.0.11`, valid 10 s) with
  a variable `proxy_pass`, so a replaced ladder container is found again and the game still starts
  without the ladder (then `/api/ladder` → 502 and the screen says offline). It limits writes per
  client and the body size; the client address comes from Nginx Proxy Manager's
  `X-Forwarded-For` (`set_real_ip_from 172.16.0.0/12`, recursive).
- Type-checking: `tsconfig.server.json` (nodenext, `@types/node` 24, `erasableSyntaxOnly`) covers
  `server/` and the shared pure files; `npm run typecheck` runs both configs. The ladder image's
  build stage runs it plus `vitest run server`.
- `deploy/auto-deploy.sh` rolls both images; a one-time manual `git pull` + `compose up -d` on the
  server creates the new service and volume (runbook `.mdd/ops/deploy-toprun.md`).

## API

> Cloud saves and the callsign lookup (`/api/ladder/save`, `/api/ladder/pilots`) are doc 34; the shared chalkboard
> (`/api/ladder/board`, `board.json`, owner reset with `SIGUSR2`) is doc 40.

- `GET /api/ladder` → `{ pilots: [{ callsign, avatar, country, rating, rank, updatedAt }], updatedAt }` — every
  entry (≤ 1 000) by rating (ties: whoever reached that rating first, `ratedAt`). Never contains ids or
  secrets. `Cache-Control: no-store`.
- `POST /api/ladder` body `{ id, secret, callsign, avatar, country, stats }` (JSON, ≤ 2 KB; unknown fields
  are ignored):
  - `id`: random pilot id (22–40 chars `[A-Za-z0-9_-]`), `secret`: random 32–64 chars, both created
    in the browser and kept in the pilot's profile (doc 28).
  - `stats` = `RatingStats` (doc 26; `score` is optional — a post without it counts 0, doc 39); the service
    **computes the rating itself** from the stats
    (clamped to the caps), so a client cannot post an arbitrary number. The caps and ranks are doc 26's shared
    code: map 2 (doc 35) raised them to 180 stars / 28 000 and added Fleet Admiral and Top Gun Legend, so the
    service must roll out with the game (auto-deploy rolls the ladder first; an older service would clamp
    map-2 stars to 90).
  - New id → entry created (max 1 000 entries; above that the lowest-rated, then stalest entries
    are pruned — never the one just posted).
    Known id → updated only if `secret` matches (constant-time compare); else 403.
  - Callsign validated with the game's callsign rules.
  - `avatar` (owner, 2026-10-27: "add the avatars back to the ladder"): the pilot's portrait as a short
    key — a preset id `pilot1`…`pilot19` or a builder look `<age>-<gender>-<skin>-<hair>-<length>-<face>`
    (doc 29). Checked against those two fixed patterns (`parseAvatar`); anything else, or a missing
    field (older clients, entries stored before), becomes `null` and the row shows a silhouette. It is
    only ever mapped to a bundled portrait, never used as a URL or path.
  - `country` (owner, 2026-10-27: a flag "from the country the user is logged in the first time"): an
    ISO 3166-1 alpha-2 code from `COUNTRY_CODES` (`src/data/countries.ts`, the codes of the tz database's
    `zone.tab`; `parseCountry`), else `null`. The browser decides it once (doc 28); the service keeps a
    stored country when a later post has none, so a device that cannot tell does not erase it.
  - 200 → `{ place, rating, rank }`; 400 malformed; 403 wrong secret; 413 too large;
    415 not JSON; 429 rate.
- `DELETE /api/ladder` body `{ id, secret }` → `{ removed }` (opt-out, doc 28).
- `GET /api/ladder/health` → 200 `ok` (container healthcheck; not forwarded by nginx).

## Business Rules

- The store keeps `{ id, secretHash (sha-256), callsign, avatar, country, stats, rating, ratedAt, updatedAt }`;
  `ladder.json` is written atomically (temp file + rename) at most once per second (debounced),
  and flushed on SIGTERM. An unreadable file is moved aside (`ladder.json.corrupt-<ms>`) and the
  service starts empty instead of crash-looping.
- Rate limits: nginx 20 writes/min per client IP (burst 10 — friends at one LAN party share an IP),
  reads unlimited; the service also caps 30 writes/min per pilot id.
- Opt-out: the browser simply doesn't post when the device setting "Show my pilots on the online
  ladder" is OFF (doc 28); a DELETE with id+secret removes an entry.
- No cookies, no CORS (same origin), no third-party calls, no logging of bodies or secrets.

## Data Flow

Greenfield (service + volume). The game posts pilot stats and reads the table.

## Dependencies

26 (rating), 08 (profiles hold id + secret), 01 (deploy).

## Security

Untrusted JSON: strict schema, size limit, numeric clamps, callsign rules, secret per entry (only a
hash stored), rate limits, unprivileged read-only container, nothing but `/api/ladder` proxied.

## Known Issues

- Scores are reported by the browser (see frontmatter).

## Bugs

(none yet — populated by /mdd bug when issues are reported)
