# TopGun — Project Rules

Browser arcade game: carrier takeoff (side view) → top-down vertical shooter, 30-mission
campaign map, hangar shop. TypeScript + Vite + Canvas 2D, no game engine. Served as static
files from an nginx container behind the owner's reverse proxy.

## Workflow
- MDD: feature docs live in `.mdd/docs/` and are the source of truth. Update the doc first.
- Always branch — never commit to `main`.

## Code rules
- TypeScript strict, no `any`. Switches on string unions end with
  `default: throw new Error(\`unhandled: ${x satisfies never}\`)`.
- No file > 300 lines, no function > 50 lines.
- Anything that decides an outcome (economy, save parsing, waves, takeoff rating, damage,
  objectives) is a pure function in `src/game/` with a Vitest test in `tests/unit/`.
- Scenes (`src/scenes/`) orchestrate; drawing lives in `src/render/`; static tables in `src/data/`.
- All drawing is in logical 1280×720 units — never read `canvas.width` in game code.
- Persist only through `persistSave()`; never touch `localStorage` elsewhere.
- No asset files needed: art is vector-drawn in code, audio is synthesized with WebAudio.

## Testing in the browser
- `npm run dev` exposes `window.__topgun` (dev only, stripped from builds): `step(frames)`, `go(route)`,
  `scene()`, `game`. Use it to drive scenes and bot playtests when the browser tab is in the background
  (rAF is throttled there). Simulate keys with `KeyboardEvent` on `window` using `code` values.
- Balance changes must be justified by a playtest and recorded in the relevant `.mdd/docs` doc first.

## Commands
- `npm run dev` — Vite dev server (http://localhost:5173)
- `npm test` — Vitest unit tests
- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — typecheck + production build to `dist/`
- `docker compose up --build` — production container on http://localhost:8080

## Deployment
- Live: https://toprun.questenterprise.de/ — push to `main` → GHCR image → host cron rolls it
  (runbook: `.mdd/ops/deploy-toprun.md`). Merging to `main` IS a production deploy.
- On the server the app is bound to `172.17.0.1:8081` only (Nginx Proxy Manager in front).
