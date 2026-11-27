# Session journal (append-only)
2026-11-27 — Build kit v0.2 prepared. No implementation or live source testing claimed. Founder application submitted; next phase is read-only audit and plan. Add future dated entries using templates/SESSION.md.

2026-11-27 — Phase 0 research session (Claude).
- Scope: Phase 0 read-only research as instructed by the founder; no production features.
- Commit: baseline 18eb2c0, then the Phase 0 docs commit.
- Sources: see research/phase0/evidence/ledger.md (retrieval 07:07–07:25 UTC).
- Created a separate "Keldrin research" environment (host allowlist) with founder approval.
- Inspected Aeon d6c66c0, orric-aeon 449479e and breakra-research 3a3760f read-only.
- Reproduced the GOOGLc dividend action from Base. Found SEC XBRL $0.22 Q3 2026 dividend. Confirmed BStocks has no event data.
- Failures: SEC Archives 403 (UA); public RPC log-scan limit; Blockscout 403; Node fetch needed NODE_USE_ENV_PROXY=1.
- Review: none yet. Costs: $0 spent.
- Decisions needed: D1–D9 in PHASE0_PLAN.md §13.
- Next: founder approval, then Phase 1.

2026-11-27 (later) — Founder asked to apply garrytan/gstack (306ff23, MIT). Read, not installed (setup edits ~/.claude and CLAUDE.md, adds hooks/telemetry). Applied office-hours, plan-eng-review and plan-devex-review by hand → docs/GSTACK_REVIEW.md. Main result: no real user outcome yet; recommend re-sequencing so Phase 1 ships a keyless corporate-action feed for all tokens, with GOOGLc↔SEC as the deep proof; founder to contact 3 named builders. Proposal only; not approved.

2026-11-27 — Phase 1 session (Claude). Approved scope: re-sequenced Phase 1 (founder: "I approve the new order, start Phase 1"; later "keep going, finish Phase 1 and give me the PR too").
- Built: registry/identity, multiplier bisection discovery, evidence + records (schema v0.2), independent verifier, PGlite store (append-only), read-only API, sample consumer, GOOGLc↔SEC reconciliation.
- Evidence: research/phase1/runs (3 controlled runs ok; 13/13 CONFIRMED each; idempotent). Tests 47/47.
- Failures found and fixed: public RPC refuses eth_getLogs (redesigned discovery); jsonb key reordering broke idempotency (fixed + regression test); reconciliation called missing data "inconsistent" (fixed: unknown); 10 code-review findings (fixed).
- Costs: $0 spent. Decisions needed: D2, D9, default branch, Phase 2 approval.

2026-11-27 — Phase 2 session part 2 (Claude). Approved: "approve Phase 2"; SEC contact provided by founder; Alchemy chosen; PR #1 merged by founder; Phase 2 is PR #2.
- Built: SEC CIK resolution (efts + submissions), declaration candidates, deterministic dividend declaration extraction from filing text, generalised reconciliation, leading calendar (/v1/calendar), company_context, OpenAPI, pinned Actions, RPC URL redaction.
- Results: 13/13 reconciliations CONFIRMED; 9 dated declarations; 8/9 adjusted on payable date; MRVLc 8 days late; upcoming GOOGLc 2026-12-14 and NVDAc 2026-12-23. Tests 68/68.
- Blocked: Alchemy key (network secret must be added by founder; secure form tool unavailable), Supabase project.

2026-11-27 — Phase 2 completed (Claude). Founder: "keep going and finish Phase 2". Keys added by founder (Alchemy, Supabase). Built Alchemy indexer, Supabase schema/hardening/primary store, issuer-announced calendar, not-applicable rule. Gate: 3/3 runs passed against Supabase (research/phase2/runs). Bugs fixed: revision divergence on sync; SQL literal corruption. Costs: Alchemy and Supabase free-tier usage only; $0 billed to my knowledge (not verified on the providers' dashboards).

2026-11-27 — Customer Discovery 001 (Claude). Founder decisions recorded: production API, data rights handled, Vercel Pro, x402 later. Created CUSTOMER_DISCOVERY.md (CD-001 Hector, prospect only; CD-002 Bankr), DEMAND_MATRIX, INTEGRATION_PIPELINE, TOKEN_RESEARCH. Proposed (not approved) T020–T026; token kept exploratory. Nothing built.
