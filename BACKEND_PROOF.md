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

## 2026-11-27 Phase 3 — live deployment verified (https://keldrin.vercel.app)
- Deployed by the founder from `main` on Vercel; DATABASE_URL uses the read-only `keldrin_reader` login (transaction pooler); TLS verified with DATABASE_CA_CERT (Supabase root CA).
- Live checks: `/`, `/health` (status ok, 435/435 identities, 13 confirmed), `/v1/events` (60: 47 predicted, 7 verified_matched, 5 confirmed_onchain, 1 late), `/v1/events?status=late` (MRVLc), `/v1/changes?since=…`, `/v1/calendar?state=upcoming`, `/v1/actions`, `/v1/assets` all 200; bad input 400; unknown route 404; POST/PUT/DELETE/PATCH 405; headers `access-control-allow-origin: *`, `x-content-type-options: nosniff`, CDN cache HIT.
- Outside consumer (examples/consumer.ts) against the live URL for GOOGLc, MRVLc, NVDAc: schema-valid, confirmed, arithmetic re-checked, data fresh.
- PMc served as verified_matched/medium with warning `multiplier_change_unusually_large_for_cash_dividend`.
- Issues found during deployment and fixed: catch-all routing (PR #6), root path (PR #7), TLS verification needed the Supabase CA (config). 
- Limitations: data refreshes only when a research run writes to Supabase (no schedule yet — Phase 4); Coinbase registry rights still unknown while some registry-derived fields (symbol, ISIN, issuer status) are now publicly served; Vercel plan/commercial use to confirm before charging.

## Phase 4 — scheduled research (2026-11-27, in progress)
- Approved by the founder ("approve Phase 4").
- Built: least-privilege `keldrin_writer` role (supabase/006_writer.sql), a direct Postgres writer adapter (`--db=pg`, KELDRIN_WRITER_URL), and a 6-hourly schedule in research.yml (still gated by RESEARCH_ENABLED). Runbook: docs/PHASE4_SCHEDULE.md.
- Live Supabase: migration applied; `supabase check` shows the writer can read confirmed records and is denied DELETE, UPDATE on records, schema_migrations and CREATE TABLE; anon/authenticated still denied; records still append-only.
- Real Postgres 16 (local, throwaway): test/pg-writer.test.ts passes (writes, idempotent rerun, same payload hash as PGlite, 8 denied operations, reader sees the writer's rows). The full pipeline as keldrin_writer: discover 13/13 CONFIRMED → reconcile 13 (partially_reconciled/CONFIRMED) → calendar 54 entries (47 issuer-announced) → discover again added 0 revisions. 9m07s total.
- PROVEN in GitHub Actions (2026-11-27, run 46001591228, #3, success in 8m51s): discover wrote to Supabase as keldrin_writer (13/13 CONFIRMED, created=false: no duplicates), then reconcile and calendar. The live API showed it right away: /health last_run 12:47 UTC; /v1/calendar snapshot 12:51 UTC with 54 entries. Earlier runs: #1 skipped (RESEARCH_ENABLED added as a secret, not a variable); #2 failed at the first RPC call (BASE_RPC_BEARER dropped from the workflow; fixed in PR #11). Neither wrote anything.
- Known behaviour: changing the RPC provider changes `sources[].url`, which creates a new record revision (a correction, by design).

## Phase 5: NAV history (2026-11-27)
- Approved by the founder ("approve the direction and Phase 5"). Acceptance criteria: docs/PLAN_DEVELOPER_RELEASE.md §2.
- Built: `004_nav.sql` (nav_feeds, nav_rounds, nav_reviews; append-only), `supabase/007_nav_grants.sql` (RLS; reader SELECT; writer SELECT+INSERT), `src/pipeline/navIndex.ts` (Coinbase /nav-feeds discovery cross-checked onchain; every phase walked to its true last round: current phase = latestRoundData, closed phase = the aggregator's latestRound()), `src/verify/navVerify.ts` (independent transport and decoding), `src/lib/sessions.ts` (NYSE 2026–2027, fails closed outside), `GET /v1/assets/{contract}/nav/history` (round and daily intervals), CLI `nav-index`/`nav-verify`, and a step in the scheduled run.
- **Off in production** until the founder decides on Chainlink data rights: the route returns 503 `NAV_NOT_ENABLED` unless `NAV_HISTORY_PUBLIC=true` is set in Vercel.
- Proof (local store, live Base data, research/phase5/runs/):
  1. **NVDAc first:** 2,065 rounds (phase 1: 115 = aggregator latestRound 115; phase 2: 1,950 = aggregator latestRound 1950), 0 missing; verifier sample of 54 matched exactly; re-run added 0.
  2. **All feeds:** 13 feeds, 36,375 rounds, 0 missing; nav-verify 13/13 CONFIRMED (~700 rounds re-read, 0 mismatches). ANTc's feed is named "Coinbase ANT / USD" (accepted as one of two exact forms).
  3. One Coinbase-listed feed (token 0xb200…c85a) was rejected: the token wasn't in that local registry copy. It fails closed; the scheduled run uses a fresh registry.
  4. Endpoint served locally: daily closes skip Thanksgiving; the first round equals the onchain value measured earlier (206.70999999 on 2026-08-03); bad input → 400; no feed → 404; unverified → 503.
- Tests: 93 pass + the real-Postgres writer test (now covering the NAV tables). Supabase: migrations applied; rollback test replays cleanly; writer INSERT yes / UPDATE no; anon no access; RLS on.
- Review: an in-session code review found 8 issues; 7 were fixed (closed-phase truncation at a window gap, the public-before-rights gate, impossible dates, pre-market values as closes, an unbounded daily query, the summary file in records/, timestamp precision). **An independent reviewer context has not been run yet** (the founder asked not to re-run the review in this pass): still to do before go-live.
- Not yet proven: the GitHub Actions run filling Supabase (after merge) and the deployed endpoint (after merge + the founder's enable decision).

## Phase 5b: independent review fixes (2026-11-27)
- An independent reviewer (a separate context given only the diff and the acceptance criteria) found 1 blocker and 9 other items. Blocker: aggregators overlap in time (phase 2 published from 2026-08-05, the proxy switched at block 49,669,080 on 2026-08-07, and phase 1 kept publishing to about 08-14), so overlapping rounds were served as one history.
- Fixed: live window per phase (binary search on historical phaseId(), stored in `nav_phases`); aggregator decimals per phase (phase 1 = 18 vs proxy 8 → not official); "official" rounds only by default, `include=all` with flags; time-ordered round paging; review-covered rounds filtered by the max round id the review saw (not by timestamp); gaps retried every run; the verifier checks phase/aggregator/decimals per row, one aggregator per phase, the live-window boundary block and the aggregator decimals, and uses Base's public RPC (a different provider from the indexer); UNKNOWN_ASSET vs NO_NAV_FEED; quality fields (missing round ids, in-session gaps p99/max, overlap excluded, phases, coverage note); DST daily-close tests; CI symbols input.
- Not done: a separate verifier database role (nav_reviews is still written by keldrin_writer). It needs a new founder-created login; recorded as a follow-up.
- Live proof (local store, research/phase5/runs/2026-11-27-nav-verify-5b-public-rpc.log): all 12 two-phase feeds switched at block 49,669,080 (matches the reviewer's independent measurement for GOOGLc); 13/13 CONFIRMED via the public RPC; official rounds e.g. NVDAc 1,920 of 2,065 (30 overlap excluded; phase 1 excluded for its decimals conflict).
- Observation for Phase 6: the longest in-session gaps between rounds reach about 6 h on some feeds, so staleness must be judged per feed (p99), not by one fixed threshold.
- Tests: 94 pass + the real-Postgres test. Supabase migration 005/008 applied.

## Phase 5b re-review (2026-11-27)
- A second independent review found no blocker (the overlap blocker is resolved) and 5 should-fix items, all fixed: per-row decimals served from the round's own aggregator (phase-1 rows: 18 decimals, raw answer only, `nav: null` with a reason; found on TSLAc); phase-boundary search throws on transient errors, self-checks, and re-searches a stored boundary that fails; the review pins the phase rows it checked (`phase_observed_block` in `covered`) and the API serves only those; the verifier checks each window's end, that the current phase has none, and the stored times against block timestamps; the verifier marks UNSURE if it reads through the same RPC host as the indexer, and records its host.
- Not done (nits): `nav_feeds.decimals` is stored once (a proxy decimals change makes the verifier reject; it fails closed); no mocked-chain test of `indexFeed` gap retry; quality field names now `official_rounds` / `first_official_round_at` (plan wording updated).
- Live: 13/13 CONFIRMED with all new checks (research/phase5/runs/2026-11-27-nav-verify-5b-rereview-fixes.log).

## Phase 6: market context, per-asset corporate actions, testing package (2026-11-27)
- Approved by the founder ("i approve everything so start 5b and the rest").
- Built: `src/lib/marketSession.ts` (session open/pre/after/closed/weekend/holiday/calendar_not_covered, next open/close, last close; staleness classes with a per-feed threshold from the verified p99 in-session gap), `GET /v1/market/session`, `GET /v1/assets/{contract}/market-context` (latest NAV read live from Base's public RPC, round id, age, staleness; degrades to nav: null with a reason; no DEX price; behind the NAV switch), `GET /v1/assets/{contract}/corporate-actions` (per-asset verified events with multiplier/uiMultiplier before/after, effective time, announcement txs, evidence links). OpenAPI 0.5.0, llms.txt.
- Real outputs (local verified store + live Base reads) in docs/developers/examples/. The first capture showed NVDAc pre-market with NAV 152.84717833 (round 36893488147419105182, updated 13:23:06Z), expected_closed; the re-capture now in market-context-NVDAc.json shows 152.07176143 (round 36893488147419105183). Both were live reads at their times; the test fixture reuses the first values. Daily closes Nov 17–25 had no missing days; GOOGLc corporate actions with evidence links.
- Measured limitation: in-session gaps between official rounds are long (NVDAc p99 ≈ 3.7 h, max ≈ 6 h), so `unexpectedly_stale` is a conservative alarm. Documented in docs/developers/DATA_FRESHNESS.md.
- Tests: 99 pass (+ the real-Postgres test). Independent review of Phase 6: still to run in Phase 7.
- Testing package: docs/developers/QUICKSTART.md (rewritten), examples/, docs/partners/MAXXAGENT_TEST_MESSAGE.md (draft for the founder to send).

## Phase 6 independent review (2026-11-27)
- An independent reviewer found 1 blocker and 6 should-fix items (plus nits). Blocker: in an open session the staleness clock restarted at each open, so a NAV stuck for days read "fresh". Fixed with method v2 (trading seconds since the round, across days).
- Also fixed: the live round must come from a reviewed phase with matching decimals; impossible values refused; market-context and session never CDN-cached; corporate actions label issuer text (`issuer_context`), select the matching UIMultiplierUpdated, explain empty uiMultiplier fields (`legacy_event_only`) and state the calendar basis for unrecorded events; calendar edges explained (`note`, `calendar_coverage`); QUICKSTART `?ticker` corrected; the MAXXAGENT draft now says it must be sent only after switch-on; DST and edge tests added.
- Still to do at switch-on (Phase 7): re-capture the examples from production; record an independent latestRoundData comparison against market-context.
- Pre-existing, not changed: /v1/events recomputes `updated_at`, which makes /v1/changes noisy (to fix separately).

## Go-live of NAV history and market context (2026-11-27)
- The founder set NAV_HISTORY_PUBLIC=true after run #5 wrote pinned, CONFIRMED reviews for all 13 feeds (verifier host mainnet.base.org).
- Outside-in checks on production at about 14:43 UTC: market context for NVDAc → session open, NAV 146.90263224, round 36893488147419105190, age 68 s, staleness fresh. An **independent latestRoundData read through a different provider (Alchemy) returned the same round and answer (14690263224)**. Daily history: 9 trading days Nov 16–27, none missing, CONFIRMED. Audit view: phase-1 rows with 18 decimals and nav null. GOOGLc corporate actions: upcoming Dec 14 dividend (confirmed calendar entry) plus the applied one (legacy_event_only). Bad input 400, unknown asset 404, POST 405, market-context `cache-control: no-store`.
- Examples re-captured from production into docs/developers/examples/.