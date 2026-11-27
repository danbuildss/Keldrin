# Status | 2026-11-27 (Phase 2 complete)

**Phase 2 gate passed** (BACKEND_PROOF.md). Nothing is deployed or published; no external users or revenue.

## What exists
- Corporate-action feed for all 435 Coinbase tokenized stocks on Base, independently verified (13 applied actions).
- SEC linkage: company identity, declaration filings, dated dividend declarations (9), reconciliations (13).
- Leading calendar: 13 upcoming dated adjustments (SEC + issuer-announced), 34 issuer-announced without a dated declaration yet.
- Alchemy log index: full coverage; 47 announced-not-applied actions; 0 undisclosed multiplier changes.
- Supabase (private `keldrin` schema, RLS, read-only role, append-only) as the primary store; local PGlite for tests.
- Read-only API (/v1/actions, /v1/assets, /v1/calendar, /health, /openapi.json, /llms.txt) — localhost only.
- 75 tests; CI green; manual research workflow (disabled until enabled).

## Findings
- 8 of 9 dated dividends adjusted on the payable date; MRVLc 8 days late; PMc ×1.5588 vs a $1.60 dividend (lead, not a claim).

## Waiting on founder
- Phase 3 approval (deploy the read-only API on Vercel).
- Gold-set annotation (research/gold/README.md).
- Supabase data-API key on the environment returns "Invalid API key" (not blocking; check its value).

## Next
Phase 3: deploy the read-only API (Vercel), with a read-only database login, rate limits and docs; then builder outreach drafts for approval.
