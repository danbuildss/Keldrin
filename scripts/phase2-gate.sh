#!/usr/bin/env bash
# Phase 2 gate: three controlled end-to-end runs. Evidence goes to research/phase2/runs/.
# Requires: BASE_RPC_URL (log-capable), SEC_USER_AGENT, Supabase access (network secret or SUPABASE_ACCESS_TOKEN).
set -u
cd "$(dirname "$0")/.."
OUT=research/phase2/runs
mkdir -p "$OUT"
LOCAL_DB=data/gate-db
rm -rf "$LOCAL_DB"
for i in 1 2 3; do
  D="$OUT/run$i"
  mkdir -p "$D"
  echo "== run $i $(date -u +%FT%TZ)" | tee "$D/summary.txt"
  for step in "discover" "reconcile" "calendar" "supabase migrate" "supabase sync" "supabase check"; do
    name=$(echo "$step" | tr ' ' '-')
    start=$(date +%s)
    node src/cli.ts $step --db=$LOCAL_DB > "$D/$name.log" 2>&1
    code=$?
    echo "  $step: exit $code, $(( $(date +%s) - start ))s" | tee -a "$D/summary.txt"
    [ $code -ne 0 ] && echo "  STOP: $step failed" | tee -a "$D/summary.txt" && exit 1
  done
  cp records/_last_run.json "$D/discover-summary.json"
  cp records/calendar-latest.json "$D/calendar.json"
done
echo "== gate runs complete $(date -u +%FT%TZ)" | tee -a "$OUT/run3/summary.txt"
