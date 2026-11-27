#!/usr/bin/env bash
# Phase 2 gate: three controlled end-to-end runs against Supabase as the primary store.
# Evidence goes to research/phase2/runs/. Requires BASE_RPC_URL (log-capable), SEC_USER_AGENT and
# Supabase access (network secret or SUPABASE_ACCESS_TOKEN).
set -u
cd "$(dirname "$0")/.."
OUT=research/phase2/runs
rm -rf "$OUT" && mkdir -p "$OUT"
for i in 1 2 3; do
  D="$OUT/run$i"
  mkdir -p "$D"
  echo "== run $i $(date -u +%FT%TZ)" | tee "$D/summary.txt"
  for step in "supabase migrate" "discover" "reconcile" "calendar" "supabase check"; do
    name=$(echo "$step" | tr ' ' '-')
    start=$(date +%s)
    node src/cli.ts $step --db=supabase > "$D/$name.log" 2>&1
    code=$?
    echo "  $step: exit $code, $(( $(date +%s) - start ))s" | tee -a "$D/summary.txt"
    [ $code -ne 0 ] && echo "  STOP: $step failed" | tee -a "$D/summary.txt" && exit 1
  done
  cp records/_last_run.json "$D/discover-summary.json"
  cp records/calendar-latest.json "$D/calendar.json"
done
# API on top of Supabase + an outside consumer (localhost only; nothing is deployed).
node src/cli.ts serve --db=supabase --port=8788 > "$OUT/serve.log" 2>&1 &
SRV=$!
for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8788/health && break; sleep 1; done
{
  for p in /health "/v1/actions?limit=50" "/v1/calendar?state=upcoming" "/v1/actions?contract=0x12"; do
    curl -s -o /dev/null -w "GET $p -> %{http_code} %{size_download}B %{time_total}s\n" "http://127.0.0.1:8788$p"
  done
  node examples/consumer.ts http://127.0.0.1:8788 0xb2000000000000000000002D0BA3164cc74f58B7
  echo "consumer exit $?"
} > "$OUT/api-consumer.txt" 2>&1
curl -s "http://127.0.0.1:8788/v1/calendar?state=upcoming" > "$OUT/api-calendar-upcoming.json"
kill $SRV
echo "== gate runs complete $(date -u +%FT%TZ)" | tee -a "$OUT/run3/summary.txt"
