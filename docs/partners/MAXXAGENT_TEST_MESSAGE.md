# Draft message to MAXXAGENT (founder sends; not sent by Claude)

**Send only after the Phase 7 switch-on (NAV_HISTORY_PUBLIC=true), the post-switch checks, and re-captured production examples.** Until then nav/history and market-context return 503 NAV_NOT_ENABLED.

gm! As promised, Keldrin's first endpoints are up for you to test (free, no key):

1. **NAV history with proof**: every point has the Chainlink feed, phase, aggregator and round id, so your agent can cite it and you can re-check it with getRoundData:
   `GET https://keldrin.vercel.app/v1/assets/{token}/nav/history?interval=daily&from=2026-10-01`
   (`interval=round` for every official round; `include=all` to see the overlapping Aug rounds we exclude)
2. **Market context**: session, next open, latest NAV read live with its age, and expected_closed vs unexpectedly_stale:
   `GET https://keldrin.vercel.app/v1/assets/{token}/market-context`
3. **Corporate actions per token**: dividends/splits with the multiplier before/after (and uiMultiplier where the issuer emitted it), dates and evidence links:
   `GET https://keldrin.vercel.app/v1/assets/{token}/corporate-actions`

Coverage: corporate actions for all Coinbase tokens; NAV history for the 13 with a verified Chainlink feed (your 10 included).
Two things we found that might matter for your volatility/drawdown: the feeds switched aggregators on Aug 7 (both aggregators published Aug 5–14, and the old one reports 18 decimals), and in-session gaps between rounds can reach several hours.

Docs: https://keldrin.vercel.app/llms.txt and /openapi.json. Honest feedback very welcome, especially anything that doesn't match your own onchain reads.
