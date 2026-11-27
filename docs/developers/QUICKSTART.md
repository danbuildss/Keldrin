# Keldrin developer quickstart

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

Base URL: `https://keldrin.vercel.app`. No key, no sign-up. JSON only; read-only (non-GET → 405).

## Live now ✅
```bash
curl -s https://keldrin.vercel.app/health
curl -s "https://keldrin.vercel.app/v1/events?ticker=GOOGLc"
curl -s "https://keldrin.vercel.app/v1/calendar"
curl -s "https://keldrin.vercel.app/v1/changes?since=2026-11-27T00:00:00Z"
curl -s https://keldrin.vercel.app/openapi.json
```
Coverage: corporate actions for all Coinbase tokenized stocks on Base (435 registry entries; 13 applied actions verified so far), with an SEC-linked forward calendar. Refreshed by the scheduled research run every 6 hours.

## Planned 🛠 (first test milestone)
```bash
# NAV history with Chainlink round ids (NVDAc first, then the 14 feed-backed tokens)
curl -s "https://keldrin.vercel.app/v1/assets/0x...NVDAc/nav/history?interval=daily&from=2026-10-01"
# Session, live NAV age and staleness classification
curl -s "https://keldrin.vercel.app/v1/assets/0x...NVDAc/market-context"
# Verified corporate actions for one token (incl. uiMultiplier where present)
curl -s "https://keldrin.vercel.app/v1/assets/0x...NVDAc/corporate-actions"
```
Example responses will be added here once they're produced by the deployed endpoints. No invented examples.

## Errors
`{"error":{"code","message","hint"}}`: 400 bad input, 404 unknown, 405 non-GET, 429 rate limited, 503 data source unavailable (with a safe reason).

## Feedback
Tell the founder directly (channel to be set at launch). Report a wrong value with the URL, the time and what you expected.
