---
id: deploy-toprun
title: Deploy TopRun to toprun.questenterprise.de (GHCR + host cron)
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
    health_check: "curl -fsS -o /dev/null https://toprun.questenterprise.de/ && ssh jan@159.195.148.193 'docker inspect -f {{.State.Health.Status}} toprun-prod-app-1' | grep -qx healthy"
    regions:
      prod:
        image: ghcr.io/janderhungrige/toprun:main
        status: unknown
        last_checked: ~
status: draft
last_synced: 2026-10-25
mdd_version: 11
tags: [deploy, docker-compose, github-actions, ghcr, cron, nginx-proxy-manager, nginx, prod]
known_issues:
  - "Fully automatic prod deploy on every push to main that changes the image (no approval gate) — same as the other apps on this host."
  - "The root cron needs a one-time sudo step by the owner (sudo needs a password on the host)."
---

# Deploy TopRun to toprun.questenterprise.de

## Overview
Push-to-deploy with no SSH from CI, the same mechanism as battlefuel, 3dmap2, ninanatur and
funding-tender-tracker on this host. GitHub Actions builds the image (tests + type-check run
inside the Docker build) and pushes it to GHCR; a root cron on the host polls GHCR every minute
and rolls the container with a health gate and automatic rollback.

```
push -> main   CI builds + pushes :main and :<sha>   -> root cron (deploy/roll-all.sh, :08)
               -> deploy/auto-deploy.sh pulls, starts, waits for healthy (or rolls back)
               -> container toprun-prod-app-1 on 172.17.0.1:8081
               -> Nginx Proxy Manager: toprun.questenterprise.de -> http://172.17.0.1:8081 (TLS)
```

## Services & Ports
| Service | Image | Port | Health |
|---------|-------|------|--------|
| app (nginx-unprivileged, static game) | `ghcr.io/janderhungrige/toprun:main` | `172.17.0.1:8081` → container 8080 | container `GET http://127.0.0.1:8081/health` → `OK` (internal port, not published) |

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
- Host: root crontab line installed by `deploy/install-cron.sh`:
  `* * * * * sleep 8; cd /opt/toprun && /usr/bin/env bash deploy/roll-all.sh >> /var/log/toprun-deploy.log 2>&1`

## Credentials & API Keys
| Credential | Where | Notes |
|------------|-------|-------|
| GHCR push | `GITHUB_TOKEN` (built-in) | workflow `permissions: packages: write` — nothing to configure |
| GHCR pull (host) | root's / jan's docker config | package is public → no login needed; the host is logged in to ghcr.io anyway |
| NPM admin | Nginx Proxy Manager UI (`127.0.0.1:81` on the host, via SSH tunnel) | owner only — never stored in the repo |

No application secrets: the game is static and keeps saves in the browser.

## MCP Servers
(none)

## Deployment Procedure

One-time host setup (owner, needs sudo once):

Step 1 (Checkout + cron):
  Action:  `sudo install -d -o jan -g jan /opt/toprun && git clone https://github.com/JanderHungrige/TopRun.git /opt/toprun && cp /opt/toprun/deploy/.env.prod.example /opt/toprun/deploy/.env.prod && sudo /opt/toprun/deploy/install-cron.sh`
  Verify:  `sudo crontab -l | grep -q /opt/toprun`

Step 2 (Proxy host — already present on 2026-10-25):
  Action:  NPM → Proxy Hosts → `toprun.questenterprise.de` → `http://172.17.0.1:8081`, SSL cert + Force SSL.
  Verify:  `curl -fsS -o /dev/null -w '%{http_code}' https://toprun.questenterprise.de/` → `200`

Steady state:

Step 3 (Ship a change):
  Action:  merge into `main` and push (`git push origin main`).
  Verify:  `gh run watch --repo JanderHungrige/TopRun` green, then within ~1 min
           `ssh jan@159.195.148.193 'tail -n 3 /opt/toprun/deploy/.state/deploy.log'` shows `live: ghcr.io/janderhungrige/toprun@sha256:…`

Step 4 (Smoke test):
  Action:  `curl -fsS https://toprun.questenterprise.de/ | grep -q '<canvas id="game"'`
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
   (NPM then answers 502 for the domain).
