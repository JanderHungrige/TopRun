#!/usr/bin/env bash
# Install (or refresh) TopRun's line in root's crontab, matching the other deploys on this host.
#
#   sudo /opt/toprun/deploy/install-cron.sh
#
# Idempotent: existing /opt/toprun lines are removed before the current one is appended. The
# previous crontab is backed up first — this file also drives battlefuel, funding-tender-tracker,
# 3dmap2, ninanatur and pdf2audiobook, so a mistake here takes the others down with it.
set -uo pipefail

[ "$(id -u)" -eq 0 ] || { echo "✖ run with sudo — this line belongs in root's crontab" >&2; exit 1; }

ROOT=/opt/toprun
[ -d "$ROOT" ] || { echo "✖ $ROOT does not exist" >&2; exit 1; }
[ -f "$ROOT/deploy/.env.prod" ] || { echo "✖ $ROOT/deploy/.env.prod missing — cp deploy/.env.prod.example deploy/.env.prod" >&2; exit 1; }

# The leading sleep staggers this deploy against the others (each auto-deploy.sh only locks
# against itself). Taken: :00 battlefuel, :15 ninanatur, :30 funding-tender-tracker, :45 3dmap2.
OFFSET=8
LOG=/var/log/toprun-deploy.log

BACKUP="/root/crontab.backup.$(date +%Y%m%d-%H%M%S)"
crontab -l >"$BACKUP" 2>/dev/null || : >"$BACKUP"

{
  grep -v "$ROOT" "$BACKUP" || true
  echo "* * * * * sleep $OFFSET; cd $ROOT && /usr/bin/env bash deploy/roll-all.sh >> $LOG 2>&1"
} | crontab -

echo "Backup: $BACKUP"
echo "--- root crontab now ---"
crontab -l
