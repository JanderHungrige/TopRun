---
id: deploy-toprun
title: Deploy TopGun to topgun.questenterprise.de (GHCR + host cron)
type: ops
platform: docker-compose + github-actions + cron
environments: [production]
deployment_strategy:
  order: sequential
  gate: health_check
  on_gate_failure: stop
  rollback_on_failure: true
regions:
  - slug: prod
    host: 159.195.148.193 (172.17.0.1:8081 behind Nginx Proxy Manager)
    platform: cron-auto-deploy
    deploy_order: 1
    role: primary
services:
  - slug: app
    image: ghcr.io/janderhungrige/toprun:main
    port: 8081
    health_check: "curl -fsS -o /dev/null https://topgun.questenterprise.de/ && ssh jan@159.195.148.193 'docker inspect -f {{.State.Health.Status}} toprun-prod-app-1' | grep -qx healthy"
    regions:
      prod:
        image: ghcr.io/janderhungrige/toprun:main
        status: healthy
        last_checked: 2026-10-25T07:58Z
  - slug: ladder
    image: ghcr.io/janderhungrige/toprun-ladder:main
    port: none (compose network only; nginx in app forwards /api/ladder)
    health_check: "curl -fsS https://topgun.questenterprise.de/api/ladder | grep -q '\"pilots\"'"
    regions:
      prod:
        image: ghcr.io/janderhungrige/toprun-ladder:main
        status: healthy
        last_checked: 2026-10-26T00:00Z
status: draft
last_synced: 2026-10-25
mdd_version: 11
tags: [deploy, docker-compose, github-actions, ghcr, cron, nginx-proxy-manager, nginx, prod]
known_issues:
  - "Fully automatic prod deploy on every push to main that changes the image (no approval gate) — same as the other apps on this host."
  - "The root cron needs a one-time sudo step by the owner (sudo needs a password on the host)."
  - "First rollout on 2026-10-25 was started by hand from ~/toprun-bootstrap (compose project toprun-prod); the /opt/toprun cron adopts the same project — the bootstrap checkout is removed in Step 1."
  - "NPM proxy host 25 has a certificate but Force SSL is off, so plain http:// is served too — enable Force SSL (and HSTS) in NPM."
  - "2026-10-25: the owner moved the site from toprun.questenterprise.de to topgun.questenterprise.de (same NPM upstream 172.17.0.1:8081); the old name no longer has a proxy host."
  - "The host never pulls the repo by itself: changes to deploy/compose.app.yml or deploy/*.sh only arrive with a manual `git pull` in /opt/toprun (Step 2b)."
---

# Deploy TopGun to topgun.questenterprise.de

## Overview
Push-to-deploy with no SSH from CI, the same mechanism as battlefuel, 3dmap2, ninanatur and
funding-tender-tracker on this host. GitHub Actions builds the image (tests + type-check run
inside the Docker build) and pushes it to GHCR; a root cron on the host polls GHCR every minute
and rolls the container with a health gate and automatic rollback.

```
push -> main   CI builds + pushes :main and :<sha>   -> root cron (deploy/roll-all.sh, :08)
               -> deploy/auto-deploy.sh pulls, starts, waits for healthy (or rolls back)
               -> container toprun-prod-app-1 on 172.17.0.1:8081
               -> Nginx Proxy Manager: topgun.questenterprise.de -> http://172.17.0.1:8081 (TLS)
               app nginx: /api/ladder -> toprun-prod-ladder-1:8090 (compose network, doc 27)
```

Since doc 27 the stack has two services, each rolled and rolled back on its own by
`auto-deploy.sh` (ladder first, then app). The ladder keeps its table on the named volume
`toprun-prod_ladder-data` (`/data/ladder.json`).

## Services & Ports
| Service | Image | Port | Health |
|---------|-------|------|--------|
| app (nginx-unprivileged, static game) | `ghcr.io/janderhungrige/toprun:main` | `172.17.0.1:8081` → container 8080 | container `GET http://127.0.0.1:8081/health` → `OK` (internal port, not published) |
| ladder (Node 24, online ladder, doc 27) | `ghcr.io/janderhungrige/toprun-ladder:main` | none — reached by the app's nginx as `ladder:8090` | container `GET http://127.0.0.1:8090/api/ladder/health` → `ok` |

Repository: https://github.com/JanderHungrige/TopRun (public). Host checkout: `/opt/toprun`.

## Environment Targets
- **prod** only (`deploy/.env.prod`: `COMPOSE_PROJECT_NAME=toprun-prod`, `IMAGE_TAG=main`,
  `APP_PORT=8081`). A dev stack can be added later with `deploy/.env.dev` (e.g. port 8082,
  `IMAGE_TAG=dev`) plus a `dev-deployment` branch in the workflow; `roll-all.sh` picks it up
  without a cron change.
- Port 8081 is bound to the Docker bridge gateway only — never 0.0.0.0.

## Webhooks & Triggers
- `.github/workflows/deploy.yml` (`build-and-push`) on push to `main` (ignores `.mdd/**`,
  `deploy/**`, `**.md`), on `workflow_dispatch`, and on pull requests (build + test only, no push).
  It builds and pushes both images, `toprun` and `toprun-ladder`, as `:main` and `:<sha>`.
- Host: root crontab line installed by `deploy/install-cron.sh`:
  `* * * * * sleep 8; cd /opt/toprun && /usr/bin/env bash deploy/roll-all.sh >> /var/log/toprun-deploy.log 2>&1`

## Credentials & API Keys
| Credential | Where | Notes |
|------------|-------|-------|
| GHCR push | `GITHUB_TOKEN` (built-in) | workflow `permissions: packages: write` — nothing to configure |
| GHCR pull (host) | root's / jan's docker config | `toprun` is public → no login needed; the host is logged in to ghcr.io anyway. A brand-new package (`toprun-ladder`) may start private on GHCR: if the host's pull fails, set it to public under GitHub → Packages → toprun-ladder → Settings. |
| NPM admin | Nginx Proxy Manager UI (`127.0.0.1:81` on the host, via SSH tunnel) | owner only — never stored in the repo |

No application secrets: the game is static and keeps saves in the browser. The ladder stores
only a SHA-256 hash of each pilot's browser-generated secret.

## MCP Servers
(none)

## Deployment Procedure

One-time host setup (owner, needs sudo once):

Step 1 (Checkout + cron):
  Action:  `sudo install -d -o jan -g jan /opt/toprun && git clone https://github.com/JanderHungrige/TopRun.git /opt/toprun && cp /opt/toprun/deploy/.env.prod.example /opt/toprun/deploy/.env.prod && sudo /opt/toprun/deploy/install-cron.sh`
  Verify:  `sudo crontab -l | grep -q /opt/toprun`

Step 2 (Proxy host — already present on 2026-10-25):
  Action:  NPM → Proxy Hosts → `topgun.questenterprise.de` → `http://172.17.0.1:8081`, SSL cert + Force SSL.
  Verify:  `curl -fsS -o /dev/null -w '%{http_code}' https://topgun.questenterprise.de/` → `200`

Step 2b (Ladder service — one time, after the first deploy that contains doc 27; done by the owner 2026-10-26):
  Action:  `cd /opt/toprun && sudo git pull && sudo docker compose --env-file deploy/.env.prod -f deploy/compose.app.yml up -d`
           (git pull brings the new compose file and auto-deploy.sh; `up -d` creates the ladder
           service and its volume. Wait until CI has pushed `toprun-ladder:main` first.)
  Verify:  `curl -fsS https://topgun.questenterprise.de/api/ladder` → `{"pilots":[…],"updatedAt":…}`
           and `sudo docker compose --env-file deploy/.env.prod -f deploy/compose.app.yml ps` shows
           `ladder` healthy. Until this step runs, the game works and the ladder screen says offline.

Steady state:

Step 3 (Ship a change):
  Action:  merge into `main` and push (`git push origin main`).
  Verify:  `gh run watch --repo JanderHungrige/TopRun` green, then within ~1 min
           `ssh jan@159.195.148.193 'tail -n 3 /opt/toprun/deploy/.state/deploy.log'` shows `live: ghcr.io/janderhungrige/toprun@sha256:…`

Step 4 (Smoke test):
  Action:  `curl -fsS https://topgun.questenterprise.de/ | grep -q '<canvas id="game"'`
  Verify:  exit 0; open the page and start a mission.

## Rollback Plan
1. **Automatic:** a new image that is not healthy within 120 s is rolled back to
   `:main-previous` by `auto-deploy.sh` and its id stored in `/opt/toprun/deploy/.state/prod.bad`
   so it is not retried until CI pushes a different build.
2. **Manual, to any past build:** every CI build is also tagged `:<sha>`. On the host:
   `cd /opt/toprun && IMAGE_TAG=<good-sha> docker compose --env-file deploy/.env.prod -f deploy/compose.app.yml up -d app`,
   then `git revert` the bad commit on `main` and push, so the cron does not re-pull the broken `:main`.
3. **Pause auto-deploy:** `sudo crontab -e` and comment out the `/opt/toprun` line — the site keeps
   running, it just stops updating.
4. **Take the site offline:** `cd /opt/toprun && docker compose --env-file deploy/.env.prod -f deploy/compose.app.yml down`
   (NPM then answers 502 for the domain). Never add `-v`: that deletes the ladder volume.
5. **Ladder only:** roll back with `IMAGE_TAG=<good-sha> docker compose … up -d ladder`; stop it with
   `docker compose … stop ladder` (the game keeps working, the ladder screen says offline).
   Back up the table: `docker run --rm -v toprun-prod_ladder-data:/data:ro alpine cat /data/ladder.json > ladder-$(date +%F).json`.
