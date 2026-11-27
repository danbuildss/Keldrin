# Backend proof register — PHASE 1 PASSED LOCALLY (release pending)
No live event or implementation verified. This file is the frontend gate.

| Gate | Required evidence | State |
|---|---|---|
| Source access | live request and response shape, rights ledger | PARTIAL: live and reproducible (Coinbase registry/actions, Base RPC, SEC data.sec.gov); rights for Coinbase payloads still unknown; SEC Archives blocked (D2) |
| Asset identity | issuer record, chain/contract and underlying class | PASS for token identity (435/435 verified onchain ×3 runs); underlying share class not yet evidenced |
| Real event | source document, typed record, facts and locators | PASS: 13 real applied corporate actions, schema v0.2, every value with tx/block locator |
| Independent verification | reviewer context/run, claim verdicts and payload hash | PASS: separate code path, 39/39 reviews CONFIRMED (13 records × 3 runs), hash-bound; tamper tests REJECT |
| Storage and correction | migration, duplicate/revision tests | PASS: append-only triggers; 3 runs → 13 records, max revision 1 (idempotent); correction → revision 2 tested |
| REST | reproducible request, response and errors | PASS (localhost only): sample consumer validates schema, arithmetic, freshness for 4 tokens; 400/404/409 paths tested |
| Controlled runs | 3 successful runs, latency and failures | PASS: 3/3 runs ok, ~95 s and ~435 RPC calls each, 0 failures |
| Release | founder approves scope, entitlement, data policy and deploy | PENDING: not deployed; needs founder approval |

For each proof append date, commit, command, actual exit code, output path, source URL/retrieval time, review verdict, known limitations and next action. Do not use synthetic fixture as real proof. No polished frontend before the backend gate is accepted. A minimal local evidence page may be planned, not treated as product proof.

## 2026-11-27 Phase 0 observations (research probes, not backend proof)
- Commit: this session's Phase 0 commit. Commands: research/phase0/README.md. Outputs: research/phase0/evidence/onchain-observations-2026-11-27.md.
- Exit codes: onchain/receipt/nav scripts 0. Log-scan script failed (`-32011 request limit reached`, exit 2). SEC Archives HTTP 403.
- Review verdict: none (no independent review has run). These are probes by the plan's author, so they do not satisfy the "Real event" or "Independent verification" gates.
- Next action: Phase 1 after founder approval (PHASE0_PLAN.md).

## 2026-11-27 Phase 1 proof (local)
- Commands: `rm -rf data && npm run discover` ×3, `npm run proof:googl` after run 1, `npm test`, `npm run serve` + `node examples/consumer.ts`. Logs: research/phase1/runs/.
- Results: identity 435/435 verified each run; 13 corporate actions (12 cash dividends, 1 8-for-1 split); verdicts CONFIRMED 13/13 per run; DB after 3 runs: 13 records (max revision 1), 39 CONFIRMED reviews, 13 served. RPC calls 436 / 437 / 434. Tests 47/47 pass (offline, on recorded real responses).
- Deep proof: GOOGLc ↔ Alphabet XBRL $0.22 (accn 0001652044-26-000084); reviewer CONFIRMED all claims; status `partially_reconciled` (share class and record/pay dates unknown, D2).
- Coverage cross-check: the 13 actions found by onchain bisection are exactly the 13 tokens the issuer registry shows with multiplier ≠ 1.
- Independent code review (fresh context): 10 findings (7 important), all fixed with regression tests before the final runs.
- Limitations: notice-only announcements are included only when the issuer record lists them (no eth_getLogs on the public RPC); A→B→A multiplier changes between samples could be missed; not deployed; no external users.
- Next action: founder reviews the PR and decides D2, D9 and Phase 2 scope.

## 2026-11-27 Phase 2 gate — PASSED (Supabase primary store; local API only, not deployed)
- Command: `bash scripts/phase2-gate.sh` (3 runs: supabase migrate → discover → reconcile → calendar → supabase check; then API on Supabase + outside consumer). Logs: research/phase2/runs/.
- Per run: identity 435/435 verified; 13/13 issuer actions CONFIRMED; 13/13 SEC reconciliations (partially_reconciled) with reviews CONFIRMED; calendar 54 entries all CONFIRMED (13 upcoming, 34 announced-only, 7 applied; 9 pre-issuance declarations listed as not applicable). Step times ~600 s discover, ~80 s reconcile, ~400 s calendar.
- Idempotency: Supabase records 26 after runs 1, 2 and 3 (13 originals + 13 correction revisions created once when the RPC source changed to Alchemy); confirmed 13 each run; reviews/calendar snapshots append only.
- Security (each run): RLS on 8/8 tables; anon and authenticated denied; read-only role reads 13 confirmed and cannot write; records append-only; Data API exposes only public, graphql_public. Rollback test: migrations replay idempotently and the test schema drops.
- API on Supabase + consumer: /health 200, /v1/actions 200, /v1/calendar?state=upcoming 200 (13 entries, GOOGLc 2026-12-14 … CSCOc 2027-01-20), bad input 400; consumer schema-valid, confirmed, arithmetic-checked, fresh.
- Coverage: Alchemy log index (blocks 49851727–62907003): 60 actions; all 13 applied match bisection; 47 announced not yet applied; 0 undisclosed multiplier changes.
- Bugs found by the gate and fixed with regression tests: local/Supabase revision divergence (0 servable, fail-closed); SQL literal corruption in parameter inlining.
- Not done / limitations: gold set unannotated (0/16, needs a human); share class not evidenced; Supabase writes are one statement per request (~10 min per discover run; batch in Phase 4); API still localhost.
