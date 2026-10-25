# TopRun — Carrier Strike

A browser arcade game. Launch from the deck of an aircraft carrier (side view), then fly a classic
top-down vertical shooter. 30 missions across 5 theaters, a hangar to spend your pay on new jets,
guns, missiles and equipment, and a boss at the end of every theater.

- **Jets:** F-16 Fighting Falcon (starter), F-14 Tomcat, SR-71 Blackbird, each with its own special move
- **Weapons:** M61 cannon (5 levels), AIM-9 Sidewinder, Zuni rockets, Mk-82 bombs, AGM-65 Maverick, AIM-54 Phoenix (F-14 only)
- **Equipment:** armor, engine tuning, flares, ECM pod, damage control, cargo magnet
- **Characters:** Admiral "Ace" Kincaid debriefs you while your pay is counted out, Chief "Wrench"
  Kowalski runs the hangar, Lt. "Shooter" Reyes launches you off the deck and Lt. "Duke" Carter
  flies your wing on the radio — animated vector portraits that talk in speech bubbles
- **Languages:** English and German (language button in the start menu)
- **Controls:** keyboard, gamepad and touch. Progress is saved in the browser (localStorage).

No game engine and no asset files: all art is vector-drawn on a canvas and all sound — including the
original 80s-style anthem soundtrack and the characters' babble voices — is synthesized with Web Audio.

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

## Deploy

Live at **https://toprun.questenterprise.de/**. Every push to `main` that changes the game is
built and tested by GitHub Actions, pushed to `ghcr.io/janderhungrige/toprun`, and rolled out
by a cron job on the server within about a minute (health-checked, with automatic rollback).
The full procedure, one-time host setup and rollback steps are in
[`.mdd/ops/deploy-toprun.md`](.mdd/ops/deploy-toprun.md).

The image serves `dist/` from an unprivileged nginx on container port 8080; on the server it is
published only on the Docker bridge (`172.17.0.1:8081`) where Nginx Proxy Manager picks it up and
terminates TLS.

Run the production image locally:

```bash
docker compose up -d --build     # http://127.0.0.1:8080
```

## Project layout

```
src/core     engine: canvas scaling, fixed-step loop, input, scenes, audio, music
src/data     static tables: planes, weapons, equipment, enemies, bosses, theaters, 30 missions
src/game     pure rules (unit-tested): save, economy, loadout, waves, takeoff, combat, objectives
src/render   vector art and effects
src/scenes   title, campaign map, hangar, carrier takeoff, mission, debrief
.mdd/docs    feature docs (the source of truth for each system)
```
