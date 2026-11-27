# Status | 2026-11-27 (Phase 2 in progress, PR #2)

**Phase 1: backend proof passed locally; PR open for founder review.** Nothing is deployed or published. There are no external users or revenue.

## Done
- **Keyless corporate-action feed** for all 435 Coinbase tokenized stocks on Base:
  - onchain identity checks (435/435 verified)
  - discovery by `multiplier()` bisection, because the public RPC refuses `eth_getLogs`
  - receipt and bracket decoding, cross-checked against the issuer record
- **13 real corporate actions**, all independently CONFIRMED in 3 of 3 controlled runs (idempotent: 13 records, revision 1):
  - 12 cash dividends
  - 1 scheduled 8-for-1 split (SNDKc, 2026-11-20)
- **Independent verifier**: its own RPC client, ABI decoding, arithmetic and hash. It re-scans action blocks for completeness and REJECTS every tamper case tested.
- **Storage**: append-only Postgres (PGlite locally); corrections become revisions.
- **API**: read-only localhost API serving confirmed records only. A sample outside consumer validates schema, arithmetic and freshness.
- **Deep proof**: GOOGLc linked to Alphabet's SEC XBRL dividend ($0.22) and the Chainlink reference. Implied net reinvestment is $0.1309 (interpretation). Status `partially_reconciled`.
- **Code review**: a fresh-context review found 10 issues (7 important), all fixed with regression tests. 47/47 tests pass.

## Findings worth your attention
- **PMc**: multiplier ×1.5588, labelled "Cash Dividend" by the issuer. This is a lead, not a claim.
- **Issuer conventions** all integrators must handle:
  - 12 of 13 actions used the deprecated instant setter.
  - 2 emitted only the legacy event.
  - Most have two announcement IDs.

## Blockers / decisions
- **D2**: SEC contact User-Agent, needed for record/payment dates and share-class evidence.
- **D9**: a log-capable RPC provider, for full announcement coverage (notice-only announcements).
- **Make `main` the default branch** (repo setting; the founder's action).
- Coinbase API rights: unknown. Brand clearance: pending.

## Next
Founder reviews the PR. On approval:
- Phase 2: SEC-side company events and the leading calendar, earnings second, a gold set of 10+ events, Supabase.
- Builder interviews (the GSTACK_REVIEW assignment) run in parallel.

## Phase 2 progress (PR #2, draft)
- PR #1 (Phase 0+1) merged by founder. Phase 2 approved.
- Done: SEC company linkage for all 13 actions; dated dividend declarations from SEC text (9 found); leading calendar with 2 upcoming adjustments (GOOGLc Dec 14, NVDAc Dec 23); `/v1/calendar`, company_context, OpenAPI; pinned Actions; RPC URL redaction. 68/68 tests.
- Findings: 8/9 tokens adjusted on the payable date; MRVLc 8 days late; PMc ×1.5588 vs a $1.60 declared dividend (lead).
- Waiting on founder: Alchemy network secret (host base-mainnet.g.alchemy.com, header Authorization: Bearer …) and Supabase project.
- Remaining: gold set (10+, annotated independently), Alchemy indexer, Supabase migrations + RLS, manual research workflow, Phase 2 gate runs.
