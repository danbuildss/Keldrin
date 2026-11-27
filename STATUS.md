# Status | 2026-11-27 (Phase 3 done: production API live at https://keldrin.vercel.app)

**Phase 2 gate passed** (BACKEND_PROOF.md). The read-only API is live in production (founder decision 2026-11-27). No confirmed users, integrations or revenue.

## What exists
- Corporate-action feed for all 435 Coinbase tokenized stocks on Base, independently verified (13 applied actions).
- SEC linkage: company identity, declaration filings, dated dividend declarations (9), reconciliations (13).
- Leading calendar: 13 upcoming dated adjustments (SEC + issuer-announced), 34 issuer-announced without a dated declaration yet.
- Alchemy log index: full coverage; 47 announced-not-applied actions; 0 undisclosed multiplier changes.
- Supabase (private `keldrin` schema, RLS, read-only role, append-only) as the primary store; local PGlite for tests.
- Read-only API live: /v1/events, /v1/changes, /v1/calendar, /v1/actions, /v1/assets, /health, /openapi.json, /llms.txt.
- 80 tests; CI green; manual research workflow (disabled until enabled).

## Findings
- 8 of 9 dated dividends adjusted on the payable date; MRVLc 8 days late; PMc ×1.5588 vs a $1.60 dividend (lead, not a claim).

## Waiting on founder
- Phase 4 approval (scheduled research so the live API stays fresh before GOOGLc Dec 14 / NVDAc Dec 23).
- Decision on the proposed scope changes from Customer Discovery 001 (below).
- Gold-set annotation (research/gold/README.md).
- DMs with Hector (CD-001) and the live-API test request to Bankr (CD-002); founder sends, Claude only drafts.

## Phase 3 progress (approved 2026-11-27)
- Done: /v1/events (integrator field shape: status predicted|confirmed_onchain|verified_matched|late, confidence never guessed, warnings), /v1/changes?since= diff feed, rate limit, CDN cache headers, generic 500s, OpenAPI 0.3.0, docs/API_QUICKSTART.md, Vercel function bundle (api/index.mjs, CI checks it matches source), read-only Postgres adapter, reader role defaults pinned in Supabase. 80 tests.
- Live check on Supabase data: 60 events (13 predicted high, 7 verified_matched, 1 late, 5 confirmed_onchain, 34 predicted without date); PMc flagged with a magnitude warning.
- Waiting on founder: reader login password + Vercel project + DATABASE_URL (docs/DEPLOY_VERCEL.md); then preview verification; production only on approval.

## Phase 3 deployment (2026-11-27)
- LIVE: https://keldrin.vercel.app (deployed by founder; read-only DB login; TLS verified). All endpoints verified (BACKEND_PROOF.md).
- Decided 2026-11-27 (DECISIONS.md): production API; data rights handled (founder); Vercel Pro; x402 later. Still open: custom domain after brand clearance.
- Next: Phase 4 — scheduled research (GitHub Actions) writing to Supabase so the live API stays fresh; batch Supabase writes.

## Customer Discovery 001 (2026-11-27)
- CD-001 Hector (Stocks Maxxing Telegram admin): asked for earnings, dividends and onchain data; suggested a token. Prospect only. CD-002 Bankr unchanged (prospect). See CUSTOMER_DISCOVERY.md, docs/DEMAND_MATRIX.md, docs/INTEGRATION_PIPELINE.md.
- Token: exploratory only (docs/TOKEN_RESEARCH.md). "Public calls" and "a treasury of stocks" conflict with CLAUDE.md; nothing built.
- Proposed scope changes (NOT approved; TASKS.md T020–T026): earnings release events from 8-K 2.02; announced upcoming earnings dates; headline results; derived ex-dividend date; dividend history; asset context endpoint; DEX market data and fundamentals as P1. Excluded: results vs expectations (needs licensed consensus).
- Recommended order: Phase 4 scheduling first, then earnings.
