# Status | 2026-11-27 (Phase 3: API live at https://keldrin.vercel.app)

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

## Phase 3 progress (approved 2026-11-27)
- Done: /v1/events (integrator field shape: status predicted|confirmed_onchain|verified_matched|late, confidence never guessed, warnings), /v1/changes?since= diff feed, rate limit, CDN cache headers, generic 500s, OpenAPI 0.3.0, docs/API_QUICKSTART.md, Vercel function bundle (api/index.mjs, CI checks it matches source), read-only Postgres adapter, reader role defaults pinned in Supabase. 80 tests.
- Live check on Supabase data: 60 events (13 predicted high, 7 verified_matched, 1 late, 5 confirmed_onchain, 34 predicted without date); PMc flagged with a magnitude warning.
- Waiting on founder: reader login password + Vercel project + DATABASE_URL (docs/DEPLOY_VERCEL.md); then preview verification; production only on approval.

## Phase 3 deployment (2026-11-27)
- LIVE: https://keldrin.vercel.app (deployed by founder; read-only DB login; TLS verified). All endpoints verified (BACKEND_PROOF.md).
- Open decisions: confirm the public deployment is intended as production; Coinbase data rights for publicly served registry fields; Vercel plan before any charging; custom domain after brand clearance.
- Next: Phase 4 — scheduled research (GitHub Actions) writing to Supabase so the live API stays fresh; batch Supabase writes.
