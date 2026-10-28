---
id: 40-chalkboard
title: Chalkboard - A Shared Chalk Board in the Hangar Base with a Sponge Micro-Game
edition: TopRun
depends_on: [30-hangar-base, 27-online-ladder, 28-ladder-screen, 20-retro-look, 07-i18n]
relates: [30-hangar-base, 27-online-ladder, 34-cloud-pilots]
source_files:
  - src/game/chalkboard.ts
  - src/game/chalkboard-ops.ts
  - src/game/chalkboard-codec.ts
  - src/game/chalkboard-sync.ts
  - src/game/chalkboard-room.ts
  - src/game/chalkboard-stroke.ts
  - src/data/chalkboard-layout.ts
  - src/core/chalkboard-api.ts
  - src/core/chalkboard-link.ts
  - src/scenes/chalkboard.ts
  - src/render/chalkboard/slate.ts
  - src/render/chalkboard/room.ts
  - src/render/chalkboard/fx.ts
  - src/render/chalkboard/wet.ts
  - src/render/base/chalk.ts
  - src/render/base/index.ts
  - src/core/sfx-recipes.ts
  - server/ladder/http.ts
  - server/ladder/main.ts
  - server/ladder/store.ts
  - server/Dockerfile
  - src/data/base-areas.ts
  - src/game/base-hangar.ts
  - server/ladder/board-http.ts
  - deploy/nginx/default.conf
  - src/i18n/ui-en-hangar.ts
  - src/i18n/ui-de-hangar.ts
routes:
  - GET /api/ladder/board?since=<rev>
  - POST /api/ladder/board
models:
  - "board.json on the ladder volume: { version: 1, rev, cells (base64 RLE), log: [{ rev, by, t, at }] }"
test_files:
  - tests/unit/chalkboard.test.ts
  - tests/unit/chalkboard-sync.test.ts
  - server/ladder/board-http.test.ts
  - tests/unit/base-hangar.test.ts
data_flow: mixed
last_synced: 2026-10-28
status: complete
phase: all
mdd_version: 11
tags: [chalkboard, chalk, sponge, base, hangar, shared, messages, ladder, server, minigame]
path: Game/Honours/Base/Chalkboard
integration_contracts:
  - function: "Route { to: 'chalkboard' } ← base area 'chalk'; BACK → { to: 'base' }"
    when: "the hangar base (doc 30) opens the board; leaving returns to the base with the pilot at the board"
  - function: "Ladder identity save.ladder { id, secret, share } (docs 27 / 28)"
    when: "chalk strokes are signed with the active pilot's ladder id + secret; the service checks them against ladder.json"
satisfies_contracts: []
known_issues: []
security_read_sites:
  - server/ladder/board-http.ts (untrusted POST body → parseOps; identity checked against the ladder table)
  - src/game/chalkboard-sync.ts (untrusted GET reply → parseBoardReply)
sister_projects: []
---

# 40 — Chalkboard

## Purpose

Owner request (2026-10-28): *"In the base, please add a chalkboard beneath the ladder (there is some space) where
players can leave messages drawn with chalk to all other players. Add also a sponge to wipe messages. Little micro
micro game. If the sponge is dry, the chalk is just smeared while removing the messages. If the sponge is dipped into
water it clears the board where you move the sponge fully (first a bit darker, then it dries and becomes the
original)."*

One board for everyone, kept by the ladder service. Owner decisions (2026-10-28): **only ladder pilots draw**
(the active pilot shares on the online ladder — the default — and its id + secret sign every chalk stroke, so the
service knows who drew what); **everyone may look and wipe**; **chalk stays until wiped** (the owner can reset the
board on the server).

## The board (pure model, `src/game/chalkboard.ts`, shared with the service)

- **300 × 100 cells**, one byte each: bits 0–5 chalk density 0…63 (0 = clean slate), bits 6–7 chalk colour
  (0 white, 1 yellow, 2 pink, 3 blue). Drawn at 4 logical px per cell in the board scene (1200 × 400) and at
  1 logical px per cell as the miniature in the hangar (300 × 100).
- Coordinates in ops are **board px** (0…1199 × 0…399, the scene's logical units); cell = px ≫ 2.
- Everything is integer math (no `Math.sin`, no floats in the rules), so the browser and the service apply the
  same ops to the same bytes everywhere.
- `boardSum(cells)` (FNV-1a) lets a client notice drift and fetch the whole board.

### Ops (`src/game/chalkboard-ops.ts`)

| Op | Shape | Effect |
|----|-------|--------|
| chalk | `{ t: 'c', c: 0…3, p: [x, y, …] }` | A chalk line along the points: every 2 px a round nib (cells whose centre is within 5 px); each cell is stamped once per stroke with density + 30…57 (grain from a hash of the cell and the stroke's first point, every ~11th cell only + 12 — dry chalk skips), capped at 63; the stroke's colour wins where it adds more than half of what was there. |
| wipe | `{ t: 'w', w: 0…600, p: [x, y, …] }` | The sponge (16 × 10 cells around the point) moves along the points in 1-cell steps (the first point counts as one). `w` = wetness when the stroke starts (`WET_MAX` 600 ≈ 2 board widths of wiping); each step costs 1. **Wet** (w > 0): every cell under the sponge → 0 (clean). **Dry** (w = 0): **smear** — each cell under the sponge takes the average of itself and the cell behind it (drags the chalk along the motion), then loses ⅛ but never below a haze of 6; the sponge picks up what it lifts and leaves a faint haze (≤ 6) on clean cells while it carries dust. Dry wiping never gets the board clean. |
| reset | `{ t: 'r' }` | Server only (owner): the whole board clean. |

`applyOp(cells, op)` mutates in place and returns the wipe's remaining wetness (the client keeps it for the next
stroke); `applyOps` applies a list in order.

### Codec (`src/game/chalkboard-codec.ts`)

- Cells ↔ base64 of a run-length list (value, run 1…255); the empty board is a few bytes.
- `parseOps(v)` — untrusted → `Op[] | null`: at most 30 ops; chalk / wipe only (never reset); 1…300 points each;
  integer coordinates inside the board; colour 0…3; wetness 0…600.
- `parseBoardReply(v)` — untrusted GET / POST reply → `{ rev, ops } | { rev, cells }` plus `sum`.

## Service (doc 27 additions: `server/ladder/board-http.ts`, the pure room `src/game/chalkboard-room.ts`)

- `GET /api/ladder/board?since=<rev>` → `{ rev, sum, ops: [{ rev, op }] }` when the service still holds every op
  after `since` (it keeps the last 400 in memory), else `{ rev, sum, cells }`. No `since` → the whole board.
- `POST /api/ladder/board` body `{ id?, secret?, since, ops }` (JSON, ≤ 24 KB):
  - chalk ops need `id` + `secret` of a ladder entry (secret hash compared in constant time) → else **403**
    `ladder-only`; wipe-only posts may come without an identity (anyone may wipe), but a given identity must match.
  - Ops are applied in order, each gets the next `rev`; reply as GET with the caller's `since` (its own ops are
    in it). 400 malformed, 413 too large, 415 not JSON, 429 too many posts.
  - Writes per identity (or one shared bucket for anonymous wipes): 40 posts / min.
- Storage: `board.json` next to `ladder.json` (`BOARD_FILE`, default `/data/board.json`; same atomic, debounced store): `rev`, the cells, and a moderation
  log of the last 2 000 ops `{ rev, by (ladder id or null), t ('c' | 'w' | 'r'), at }` — the owner can see who
  drew what (`by` → `ladder.json`). The op list for `since` is memory only; after a restart clients get the whole
  board once.
- **Owner reset**: `docker compose kill -s SIGUSR2 ladder` clears the board (a `reset` op, logged with `by: null`).
- nginx forwards `= /api/ladder/board`: reads unlimited, writes in their own zone (40 / min per client IP,
  burst 20 — a LAN party shares one IP), body ≤ 24k.

## Sync (`src/game/chalkboard-sync.ts`, pure state + `src/core/chalkboard-api.ts`)

- The client keeps the **server board** (cells at `rev`), the **in-flight** ops (posted, no reply yet) and the
  **pending** ops (drawn since). What you see = server board + in-flight + pending, rebuilt whenever the server
  board changes.
- A finished stroke (pointer up / confirm released, or every 120 points while drawing — `Stroke`, points closer than
  3 px skipped) becomes a pending op. At most one request at a time (`BoardLink`, one per session, shared by the
  hangar and the board): pending ops are posted (≤ 30) at least 2 s apart; otherwise the board polls
  `GET since=rev` every 2.5 s (hangar: on entry and every 20 s). A reply's ops are applied to the server board in
  rev order; `cells` replaces it; a `sum` that does not match the rebuilt server board fetches the whole board.
- Failures never break the scene: offline / 5xx → "board offline" line, ops stay pending and retry with backoff
  (≤ 30 s); 403 `ladder-only` drops that post's chalk ops (the wipes go again) and greys the chalk out for this
  visit; 400 / 413 drop the post; 429 waits 5 s.
- **Ladder entry first**: entering the board calls `game.ladder.flush()` (doc 28) and holds every post until it has
  answered, so a pilot whose entry was not posted yet (new pilot, service restarted) is on the ladder before its
  first chalk goes out. Found while testing: without it, a message drawn right away was refused and vanished.

## Board scene (route `chalkboard`, `src/scenes/chalkboard.ts`)

Logical 1280 × 720, the rooms' pixel style:

- Title "CHALKBOARD" / "KREIDETAFEL" top left, status top right ("Every pilot sees this board", "Fetching the
  board …", "Board offline: your strokes wait here"); a gold note under the ledge for 3.5 s when it matters
  ("Chalk is for pilots on the online ladder. Wiping is for everyone." / "A dry sponge only smears. Dip it in the
  bucket!").
- **The board** (`src/data/chalkboard-layout.ts`): 14-px wooden frame, dark green slate 1200 × 400 at x 40, y 92
  (`Slate`: one image pixel per cell with a fixed speckle and patch texture, drawn 4× with hard edges), chalk by
  density (alpha ≈ density · 1.3 with a little per-cell grain).
- **Ledge** under the frame (y 506): four chalk sticks (white, yellow, pink, blue) and the sponge (yellow with a green
  scouring layer, darker and glistening while wet); on the floor at x 940 a tin **water bucket** (rippling water,
  wire handle; underlined gold under the pointer).
- **Tools**: chalk (four colours) or sponge. The cursor is the held tool: a hand with the chalk stick, or the
  sponge (darker and dripping while wet, pale and dusty when dry; a small wetness bar under it).
- **Drawing**: press and drag on the slate (mouse / touch), or move the cursor with arrows / stick (520 px/s) and
  hold CONFIRM. Chalk dust specks fall from the nib; a soft scratch sound while moving.
- **Wiping**: the same with the sponge. Wet: the slate under the sponge comes clean and shows **darker** (wet),
  then dries back patchily over ~4–6 s to the normal slate; drops fall from a very wet sponge. Dry: the chalk
  smears into grey streaks and a dust puff rises.
- **Dipping**: click / tap the bucket, or press **E** → the sponge in hand, splash, full (wetness 600).
- Picking a tool: click / tap it on the ledge; **X** (weapon switch) cycles white → yellow → pink → blue → sponge.
- BACK button, ESC / Backspace / B → `{ to: 'base' }`. Pending ops are posted on the way out (fire and forget).
- Without a ladder identity the chalk sticks are greyed out and the board starts with the sponge in hand.
- Sounds: `chalk` (a short band-passed scratch, every ~0.07 s while drawing) and `wipe` (a soft low swish), new
  in `sfx-recipes.ts`; the existing `splash` for dipping.

## Hangar (doc 30 changes)

- New area **`chalk`** — CHALKBOARD / KREIDETAFEL, a third row **`mid`** between `wall` and `floor`:
  hotspot x 692, y 314, 316 × 122; the board's miniature (300 × 100 cells at 1 logical px, x 700…1000,
  y 324…424) in a wooden frame (art layer, `paintChalkFrame`) with a ledge, two chalk stubs and a sponge; its plate
  at (850, 440) on the ledge, the ladder's plate stays at y 296 between the flip board and the chalkboard.
  Stand x 850. Order: fun, locker, photos, ladder, chalk, exit.
- ↑ / ↓ go to the area with the nearest centre x in **any** row above / below (a tie: the nearer row): ladder ↓
  chalk, chalk ↑ ladder, chalk ↓ exit, exit ↑ chalk; fun / locker ↑ photos and photos ↓ locker as before.
- The miniature is drawn at device resolution over the composed art (the jet never reaches above y 447 under it;
  measured for all six jets). The hangar fetches the board on entry and every 20 s.

## Text

`hbase.chalk`, `hbase.hint.chalk`, `chalk.title`, `chalk.online`, `chalk.offline`, `chalk.ladderOnly`,
`chalk.loading`, `chalk.dry`, `chalk.keys`, `chalk.keysTouch` (EN + DE, `ui-*-hangar.ts`).

## Business Rules

- One shared board; nothing about it is stored in the save or the profile store.
- Only an identity the ladder knows can add chalk; anyone can wipe; nothing fades by itself.
- A dry sponge only smears (chalk never drops below the haze); only a wet sponge cleans.
- The browser and the service apply the same pure rules; the service's order is the truth.

## Security

Untrusted JSON both ways (strict schemas, size and count limits, integer ranges); chalk signed with the ladder
secret (only a hash stored, constant-time compare); rate limits in nginx and the service; the moderation log keeps
ids, never secrets; no free text is ever sent — only stroke coordinates. Abuse: anyone can wipe a drawing, and the
owner can reset the board and look up who drew it.

## Verification (2026-10-28)

`npm run typecheck` (app + server) clean; Vitest 75 files / 734 tests green — new `chalkboard.test.ts` (chalk
line width / grain / once-per-stroke / caps and edges, wet clean + wetness cost, dry smear keeps a haze and never
cleans, running dry part way, determinism, codec round trip and every malformed op, replies, room since / log /
limits / reset / restart, strokes), `chalkboard-sync.test.ts` (own strokes at once, one post at a time, others'
strokes in service order, whole board, drift, failed posts), `server/ladder/board-http.test.ts` (whole board then
deltas, ladder-only chalk / anonymous wipe / wrong secret, malformed, 415, 405, 429, owner reset);
`base-hangar.test.ts` updated (six areas, three rows). `nginx -t` on the new config OK.

Browser (dev build + local ladder service, DE): the hangar shows the chalkboard under the ladder (clear of all six
jets — tops measured ≥ 447 under it), ← / → / ↑ / ↓ reach it, the miniature shows the shared board; the board scene
draws with the mouse (HI!, a smiley, a pink heart, yellow and blue lines — 15 strokes accepted, rev 15), with the
keys (arrows + held SPACE, X to switch chalk), smears with a dry sponge, cleans with a dipped one (darker, then dry
again), and the hangar shows the result after leaving.

## Bugs

(none yet — populated by /mdd bug when issues are reported)
