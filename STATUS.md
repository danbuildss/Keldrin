# Status | 2026-11-28 (roadmap approved; Phase 1 "launch ready" in progress)

**Current state.** Live at https://keldrin.vercel.app:
- REST API, remote MCP (9 tools), CLI 0.7.1 on npm, and the MCP Registry listing (0.7.1, active).
- x402 snapshot and report on Bankr ($0.05; 3 payments onchain, all keldrin's own tests).
- Website: Explorer (company logos), Playground and Transparency.
- Positioning locked (POSITIONING.md); roadmap approved (ROADMAP.md).
- No confirmed users, integrations or revenue. MAXXAGENT agreed to test. BankrBot/skills PR #879 is open.

**Phase 1 (ROADMAP.md), built on branch claude/awesome-brahmagupta-9y3hiy, awaiting review and merge:**
- risk endpoint (1.2);
- coverage levels (1.3);
- payment count stored by the robot (1.4; migration applied to Supabase);
- privacy and terms page (1.1; text needs the founder's approval).

**Open:**
- verifier login (1.5, founder creates it);
- independent review and external tests (1.8);
- listings (1.9);
- hackathon (Phase 2, deadline 2026-12-12).

---
## History: 2026-11-27 (Phase 3 done: production API live)

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

## Phase 4 (approved 2026-11-27) — DONE
- Done: keldrin_writer role (live, NOLOGIN), writer adapter, 6-hourly schedule (disabled until RESEARCH_ENABLED), real-Postgres test, full pipeline proven as the writer role (BACKEND_PROOF.md).
- LIVE: GitHub Actions runs research every 6 hours (01:23, 07:23, 13:23, 19:23 UTC); first run succeeded (BACKEND_PROOF.md). Pause by setting RESEARCH_ENABLED=false.
- Next (agreed route): founder sends Bankr and Hector the live link (Claude drafts); then SKILL.md + MCP (needs approval of T028/T029); demo and submission Dec 5–12.
- Minor: GitHub warns that the pinned actions target Node 20 (still running on Node 24); bump the pins in a later PR.
- Breakra study: docs/BREAKRA_STUDY.md (lessons for x402, MCP, SKILL.md and metrics; proposals not approved).

## Customer Discovery CD-003 (2026-11-27)
- MAXXAGENT: strongest signal so far (they built NAV history, risk, sessions and a B20 watcher themselves). Feasibility report: docs/research/FEASIBILITY_CD003.md.
- Verified gaps: no NAV-history API; corporate actions only by UUID at Coinbase. Coverage limit: NAV feeds exist for 14 of 138 tokens.
- Proposed revised plan (awaiting approval): Phase 5 NAV history → Phase 6 per-asset intelligence + skill.md → Phase 7 front page + launch check (Monday); MCP after Monday.
- Open: Chainlink data rights; freshness (6-hourly vs hourly).
- CD-003 follow-up: MAXXAGENT agreed to test endpoints (not an integration). Plan with acceptance criteria: docs/PLAN_DEVELOPER_RELEASE.md. Developer docs drafted (live vs planned labelled). Waiting on founder: approve Phase 5; the Chainlink-data decision; rate-limit approach; DEX price now or later.

## Phase 5 (approved 2026-11-27): NAV history built and verified locally
- 13 feeds / 36,375 rounds / 0 missing / 13 of 13 independently CONFIRMED (BACKEND_PROOF.md). The endpoint is built and **switched off** (NAV_HISTORY_PUBLIC) until the founder decides on Chainlink data rights.
- Supabase tables are live (empty until the first scheduled run after merge).
- Next: founder merges the PR → the scheduled run fills Supabase → founder decides on rights → enable → send MAXXAGENT the test link. Independent reviewer pass before go-live. Then Phase 6 (market-context) on approval.

## Competitive review 001 (2026-11-27): Proof of Stock
- Complementary: they do authenticity plus the live premium and sessions; Keldrin does history, corporate actions, risk and research. In their public code, none of our 8 core capabilities were found (docs/research/PROOF_OF_STOCK.md). No direction change.
- Effect on Phase 6 (proposed): don't build DEX price or premium; keep market context focused on Chainlink round age and staleness, plus corporate actions per stock.

## Phases 5b + 6 (approved 2026-11-27)
- 5b: official NAV history (live windows; phase-1 decimals conflict excluded); verifier on Base's public RPC; 13/13 CONFIRMED. Independent re-review running.
- 6: market context, per-asset corporate actions, testing package built; 99 tests. Not deployed (needs a merge; NAV-based routes stay off until NAV_HISTORY_PUBLIC=true).
- Next, Phase 7 (approved): front page, final independent review, outside-in tests on the preview, go-live by the founder, message to MAXXAGENT. Founder inputs needed: feedback channel, name on the page.

## Phases 8–10 (approved 2026-11-27: "approve 8–13")
- Phase 8, DEX price: built, independently reviewed (1 blocker + 7 findings, all fixed: depth capped by real pool balances, uncapped v4 pools need corroboration, >1% fee pools excluded, gap vs NAV withheld when the NAV is stale). 416 pools, 13/13 CONFIRMED locally after the fixes. Not deployed: needs the PR merged, then one scheduled run fills dex_pools and dex_reviews in Supabase.
- Phase 9, remote MCP at POST /mcp (6 read-only tools) + server.json for the MCP Registry: built, not deployed (same PR).
- Phase 10, CLI `npx keldrin` (npm/): built, 4 offline tests, CI checks the bundle matches the source. The name `keldrin` was free on npm on 2026-11-27. The founder publishes (`npm publish` from npm/).
- Tests: 119 pass, 1 skipped.
- LIVE (2026-11-27): PR #16 merged, run #6 green; /dex live for 11/13 tokens and independently re-checked; /mcp live; CLI published as keldrin@0.6.0 on npm (founder). Next: Phase 11 x402 on approval of the host + payout address. Then Phase 11 (x402: needs payout wallet address, facilitator route, price), 12 (website from the founder's design + feedback form), 13 (launch).

## Phase 11 (approved 2026-11-27): paid x402 on Bankr + 3 free tries
- Live on Bankr (deployed by the founder from Bankr chat; Bankr's test calls cost $0.10): keldrin-snapshot and keldrin-report, $0.05 USDC on Base, payout to the founder's Bankr wallet 0xb98f…fa91. Self-contained (read the free API), never charged on incomplete answers. Bankr's reported answers match production data. Not verified from this session: the 402 terms (x402.bankr.bot is blocked by this session's network).
- LIVE: /v1/snapshot and /v1/report with 3 free complete answers per client per day (counted in Supabase), then 402 with the Bankr links (PRs #18–#20). Single-browser check by the founder pending.

## Phase 12 (approved 2026-11-27): website
- Built: public/index.html (keystone logo, lowercase wordmark, Base colours, halftone/flow/count/marquee/reveal animations with reduced-motion support, live numbers from /health, /mcp and one market-context call; never the metered snapshot), POST /v1/feedback (validated, honeypot, 5 per client per day, stored only through feedback_submit; IP never stored). API index also at /v1.
- LIVE: site at keldrin.vercel.app (PR #21); feedback storage approved, applied and checked. The founder reads submissions in Supabase → Table Editor → schema keldrin → feedback. Next: Phase 13 (launch).

## Phase 13 (approved 2026-11-27, expanded scope 2026-11-28): launch readiness, IN PROGRESS
- Done: /skill.md and /start.md; x402 forwards on our origin + OpenAPI paid paths; MCP/CLI snapshot+report (never auto-pay); status checks; payer counter; independent launch review (10 findings fixed or accepted); NAV before_coverage fix; MCP Registry description fix; external tests 30/30 + CLI; real paid x402 tx 0x5c3665fc…ab05; MAXXAGENT package; listings research; operations audit; launch report (docs/LAUNCH_REPORT.md); research schedule every 8 h (GitHub Free).
- Not complete until the founder actions in LAUNCH_REPORT §9 are done (rate-limit rule, Bankr redeploy, CLI 0.7.0, MAXXAGENT message, listings, hackathon submission).

- 2026-11-28: founder actions done: rate-limit rule live, MAXXAGENT package sent, Bankr snapshot redeployed (v2); CLI 0.7.0 publish running. Analytics added (same-origin). Next-phase proposal written (docs/PUBLIC_PRODUCT_EXPERIENCE.md), awaiting approval. Brand unchanged by founder's instruction.
- 2026-11-28 (later): approved public product built: snapshot batched into one multicall (1.3 s locally), /v1/overview + /v1/stats, Explorer, Playground, Transparency pages; README rewritten; Bankr skill PR prepared. Awaiting merge, then outside tests.
