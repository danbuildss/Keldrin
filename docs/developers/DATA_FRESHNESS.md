# Data freshness

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

- ✅ Research runs every 6 hours (01:23, 07:23, 13:23, 19:23 UTC) on GitHub Actions; GitHub can delay or skip runs. `/health` shows the last run's time and outcome.
- ✅ Every event has `updated_at`; responses carry `meta.as_of`.
- 🛠 NAV history: indexed in each run (up to ~6 h behind for the newest rounds).
- 🛠 Market context: the latest NAV is read live at request time (cached ≤ 30 s), with `age_s` and `nav_staleness`:
  - `fresh`: in session and within the feed's normal update gap
  - `expected_closed`: weekend, holiday, outside the session or after an early close; the NAV is not expected to move
  - `unexpectedly_stale`: in session and older than the feed's normal gap; treat with caution
  - `calendar_not_covered`: the date is beyond Keldrin's maintained calendar (fails closed)

## Market context staleness (Phase 6, measured 2026-11-27)
- Threshold per feed = max(2 × p99 of in-session gaps between official rounds, 30 min). Measured p99 is large for these feeds (NVDAc: 13,448 s, about 3.7 h; the longest in-session gaps reach about 6 h). Chainlink publishes on deviation or heartbeat, so long quiet spells in session are normal.
- So `unexpectedly_stale` fires only after a long silence. It's a conservative alarm, not a minute-level freshness guarantee. Always read `nav.age_s` and decide for your own use.
- During a closure: `expected_closed` when the last round falls within the threshold of the last session close; otherwise `unexpectedly_stale` (the feed went quiet during the session).
