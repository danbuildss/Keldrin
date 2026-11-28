# Rate limits and access

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

- ✅ Free and keyless; CORS open; server-side calls welcome.
- ✅ CDN caching on successful responses (`s-maxage=60`); repeated identical calls are usually served from cache.
- ✅ Application limit: 120 requests/min per client IP **per server instance** (best effort on serverless).
- ✅ Edge limit: **300 requests/min per IP** on `/v1` and `/mcp` (Vercel Firewall rule "API fair use", published by the founder 2026-11-28); `429` when exceeded.
- ✅ One-stock routes (`/v1/assets/...`, `/v1/events`, `/v1/calendar`, MCP, CLI) stay free. **Basic access will never require a token or a payment.**
- ✅ `/v1/snapshot` (all stocks with a verified NAV feed in one answer) and `/v1/report?token=` (everything about one token): **3 free complete answers per client per day** (shared), then `402` with the paid links. The counter is per server instance, so it is a trial allowance, not an access control. Incomplete answers are `503` and don't use a try. Header `x-keldrin-free-tries-left` and `meta.free_tries_left_today` show what's left.
- ✅ Paid, x402 ($0.05 USDC on Base, hosted on Bankr x402 Cloud; charged only on a complete answer): `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot` and `.../keldrin-report` (input `token`).
- 🛠 Later: optional free API keys for higher limits.
