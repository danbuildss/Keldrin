# Rate limits and access

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

- ✅ Free and keyless; CORS open; server-side calls welcome.
- ✅ CDN caching on successful responses (`s-maxage=60`); repeated identical calls are usually served from cache.
- ✅ Application limit: 120 requests/min per client IP **per server instance** (best effort on serverless).
- 🛠 Planned for the test period: a documented **60 uncached requests/min per IP**, enforced at the edge (Vercel Firewall rule, set by the founder); `429` with a retry hint.
- 🛠 Later: optional free API keys for higher limits; x402 pay-per-call as an additional route for agents. **Basic access will never require a token or a payment.**
