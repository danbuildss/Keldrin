# Data freshness

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

- ✅ Research runs every 8 hours (02:23, 10:23, 18:23 UTC) on GitHub Actions (GitHub Free minutes); GitHub can delay or skip runs. `/health` shows the last run's time and outcome.
- ✅ Every event has `updated_at`; responses carry `meta.as_of`.
- 🛠 NAV history: indexed in each run (up to ~6 h behind for the newest rounds).
- 🛠 Market context: the latest NAV is read live at request time (cached ≤ 30 s), with `age_s` and `nav_staleness`:
  - `fresh`: in session and within the feed's normal update gap
  - `expected_closed`: weekend, holiday, outside the session or after an early close; the NAV is not expected to move
  - `unexpectedly_stale`: in session and older than the feed's normal gap; treat with caution
  - `calendar_not_covered`: the date is beyond Keldrin's maintained calendar (fails closed)

## Market context staleness (method v2, after the independent review, 2026-11-27)
- Keldrin counts only **regular-session (trading) seconds** between the latest round and now, across days. Nights, weekends and holidays don't count; a NAV stuck through whole sessions keeps accumulating.
- Threshold per feed = max(2 × p99 of in-session gaps between official rounds, 30 min). Measured p99s are large (NVDAc ≈ 13,448 s, so its threshold ≈ 7.5 trading hours, a bit over one full session), because Chainlink publishes on deviation or heartbeat.
- `fresh` (market open) / `expected_closed` (market closed) while that trading time is within the threshold; `unexpectedly_stale` once it exceeds it. So a feed stuck through about 1.2 sessions is flagged; a short quiet spell isn't. It's a conservative alarm, not a minute-level freshness guarantee: read `nav.age_s` and `staleness.trading_seconds_since_round` and decide for your use.
- The live round is served only if its phase was covered by the latest CONFIRMED review and its aggregator's decimals match the proxy (`phase_not_reviewed` / `aggregator_decimals_differ_from_proxy` otherwise). Impossible values (answer ≤ 0, a zero or future timestamp) are refused (`rpc_result_invalid`).
- Market context and market session responses are never CDN-cached.
