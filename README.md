# TopGun — Carrier Strike

A browser arcade game. Launch from the deck of an aircraft carrier (side view), then fly a classic
top-down vertical shooter. 30 missions across 5 theaters, a hangar to spend your pay on new jets,
guns, missiles and equipment, and a boss at the end of every theater.

- **Jets:** F-16 Fighting Falcon (starter), F-14 Tomcat, SR-71 Blackbird, each with its own special move
- **Weapons:** M61 cannon (5 levels), AIM-9 Sidewinder, Zuni rockets, Mk-82 bombs, AGM-65 Maverick, AIM-54 Phoenix (F-14 only)
- **Equipment:** armor, engine tuning, flares, ECM pod, damage control, cargo magnet
- **Controls:** keyboard, gamepad and touch. Progress is saved in the browser (localStorage).

No game engine and no asset files: all art is vector-drawn on a canvas and all sound is synthesized
with Web Audio.

## Develop

Requires Node 22.12+ or 24 (LTS recommended).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run typecheck
npm run build      # production build into dist/
```

Dev-only art previews: `http://localhost:5173/dev/art.html` and `/dev/art-enemies.html`.

## Deploy (Docker)

The image builds the game, runs the tests and serves `dist/` from an unprivileged nginx on port
**8080**. TLS and HSTS are left to your reverse proxy.

```bash
docker compose up -d --build
```

By default the container is published on `127.0.0.1:8080`, which suits a proxy running on the
same host. Override with `TOPGUN_BIND` / `TOPGUN_PORT` (e.g. in a `.env` file next to
`docker-compose.yml`).

Point your reverse proxy at `http://127.0.0.1:8080`. Example nginx location for a sub-path or a
dedicated host:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The build uses relative asset paths, so the game also works when served under a sub-path
(e.g. `https://example.com/topgun/`).

Health check: the container answers `GET /health` on port 8081 (internal networks only); Docker's
`HEALTHCHECK` uses it.

## Project layout

```
src/core     engine: canvas scaling, fixed-step loop, input, scenes, audio, music
src/data     static tables: planes, weapons, equipment, enemies, bosses, theaters, 30 missions
src/game     pure rules (unit-tested): save, economy, loadout, waves, takeoff, combat, objectives
src/render   vector art and effects
src/scenes   title, campaign map, hangar, carrier takeoff, mission, debrief
.mdd/docs    feature docs (the source of truth for each system)
```
