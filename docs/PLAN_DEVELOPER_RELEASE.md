# Developer release plan: first endpoints for MAXXAGENT (for founder approval)

Date: 2026-11-27. Driver: CD-003 (MAXXAGENT agreed to test endpoints; no integration committed). Research: `docs/research/FEASIBILITY_CD003.md`. **Nothing in this file is built yet unless marked ✅.**

## 1. Their requirements vs what exists today
| Requirement (CD-003) | Today | Gap |
|---|---|---|
| NAV points with feed + round ids (verifiable) | Partial: reconciliation already reads a Chainlink feed at a block with feed, raw answer, decimals and updated_at (`src/pipeline/reconcile.ts`); `navFeeds()` adapter exists | No round history, no storage, no endpoint |
| Multipliers / corporate actions per token, incl. uiMultiplier, with dates | ✅ Mostly: `/v1/events` and `/v1/actions` serve verified actions with multiplier before/after (WAD), tx, dates and SEC evidence; UIMultiplierUpdated is indexed and verified | No per-asset route; uiMultiplier values not surfaced as their own fields |
| Clear freshness across weekends and holidays | Partial: `updated_at` per record, `/health` run age | No session calendar; no NAV staleness classification |
| Free server-side tier with reasonable limits | ✅ Partial: keyless, CORS open, CDN caching, 120 requests/min per server instance | Per-instance limit is weak on serverless; no documented tiers; no keys |
| Keep their own onchain fallback | — | Design for verifiability: every value names its onchain source |

**Conclusion: no architecture restart.** The existing pipeline (registry, chain adapter, independent verifier, Supabase writer/reader roles, scheduled run, Vercel API) carries all of this. We add one indexer, one calendar module and three routes.

## 2. Milestones and acceptance criteria

### Phase 5: `GET /v1/assets/{contract}/nav/history` (Fri–Sat)
Build:
- Migrations `004_nav.sql` + `005_nav_phases.sql`: `nav_feeds`, `nav_rounds`, `nav_reviews`, `nav_phases` (append-only). Writer: INSERT; reader: SELECT. (`nav_index_state` was replaced by retrying gaps found in `nav_rounds` itself.)
- `src/pipeline/navIndex.ts`: discovery from Coinbase `/nav-feeds`, cross-checked onchain (`description()`, `decimals()`, proxy `phaseId()`/`phaseAggregators()`); phase-aware walk over all phases; batched reads; incremental from `nav_index_state`; never fills gaps.
- Independent verification (in `src/verify/`, its own RPC client): re-reads a random sample of stored rounds per feed (and every phase's first and last round) and compares them byte for byte. Only feeds whose latest sample is CONFIRMED are served.
- CLI `nav-index`; a step in `research.yml` after discover.
- Route with `from`, `to`, `interval=round|daily`, `limit` (max 1,000), `cursor`.
- Session calendar module (shared with Phase 6), needed for daily closes.

Response fields per observation: `chain_id`, `token`, `feed`, `phase_id`, `aggregator`, `round_id` (proxy id, decimal string), `aggregator_round_id`, `answer_raw`, `decimals`, `nav` (exact decimal string), `updated_at`, `retrieved_at`, `session_day` (for daily). Response `quality`: `first_round_at`, `last_round_at`, `rounds_indexed`, `missing_round_ids`, `max_in_session_gap_s`, `verification` (verdict, sampled n, checked_at), `coverage_note`.

Acceptance:
1. **NVDAc first:** every round from phase 1 round 1 to the latest indexed is stored. The count equals the onchain counts per phase, measured independently.
2. A 50-round random sample re-read by the verifier matches exactly (answer, updatedAt, roundId).
3. Re-running the indexer adds 0 rows; a new run adds only new rounds.
4. Then all feeds pass criteria 1–3. A feed that fails is **not served** (503 `NAV_NOT_VERIFIED`, fail closed); the stricter choice replaces the earlier "served as unconfirmed" wording (2026-11-27).
5. Daily closes: the last round per New York trading day; weekend and holiday rounds excluded; tested on fixtures including a DST switch and an early close.
6. Gaps are reported, never filled. A test asserts no synthetic rows.
7. Bad input → 400; unknown token → 404; a token without a feed → 404 with code `NO_NAV_FEED`.
8. Unit and integration tests, the real-Postgres test, the bundle check and an independent code review all pass.

### Phase 6: `GET /v1/assets/{contract}/market-context` + `…/corporate-actions` + testing package (Sat–Sun)
Build:
- `src/lib/sessions.ts`: NYSE regular hours, holidays and early closes for 2026–2027 (source cited in the file), DST via the IANA timezone; **fails closed** (`calendar_not_covered`) beyond the last covered date.
- Market context: `session` (open/pre/after/closed/weekend/holiday/early_close), `next_open`, `next_close`; latest NAV read **live at request time** from the public Base RPC (no new secret; cached 30 s): `last_nav`, `updated_at`, `age_s`, `round_id`; `nav_staleness` = `fresh` | `expected_closed` | `unexpectedly_stale` (threshold per feed from the indexed in-session gaps); label "last published total-return reference, not a live equity price".
- **DEX price and NAV/DEX premium:** fields present with `null` plus `unavailable_reason: "no_approved_dex_source"` until a source is approved. Option to research in parallel: read the main Uniswap v4 pool onchain (no third-party terms), which needs pool discovery per token.
- `…/corporate-actions`: a per-asset view of verified records, adding `ui_multiplier_before/after` where the UIMultiplierUpdated event exists, announcement/effective/record/payable dates and evidence links, plus a double-adjustment note.
- Developer testing package (below).

Acceptance:
1. Session tests: a normal day, a weekend, Thanksgiving 2026-11-26, the 2026-11-27 early close, both DST switches, and a date beyond coverage → `calendar_not_covered`.
2. Staleness: a fixture in session with an old NAV → `unexpectedly_stale`; the same age on a weekend → `expected_closed`.
3. The live NAV in a response equals `latestRoundData` from an independent read at about the same block.
4. Corporate actions per asset equal `/v1/events` for that token (consistency test).
5. All docs' curl examples run against the deployed preview and their outputs are recorded.

### Phase 7: launch check (Sun–Mon)
Independent review of the whole release, outside-in tests from a clean machine, a docs-drift test, front page (live data only), founder go-live decision.

### After Monday (not in this plan)
`…/risk` (volatility, drawdown) once NAV coverage is verified; DEX price after source approval; API keys and higher tiers; x402 as an extra agent access route; MCP.

## 3. Developer access (proposed for the test period)
- **Free and keyless**, server-side friendly. CORS open. CDN caching on 200s (history pages are cacheable for minutes; market context for 30 s).
- Documented limit: **60 requests/min per IP** for uncached calls. The current in-memory limit is per serverless instance, so it's weak. **Recommended:** a Vercel Firewall rate-limit rule (available on Pro, which the founder has), set in the Vercel dashboard by the founder. Optional free API keys later, for higher limits and usage visibility.
- No token or x402 is required for basic access (founder instruction).

## 4. Decisions needed from the founder
1. Approve Phase 5.
2. Chainlink data: serve NAV history labelled "derived from public onchain Chainlink data, with round ids" while rights are reviewed, or wait.
3. The rate-limit approach above (a Vercel Firewall rule when we launch).
4. DEX price: ship market context without it first (recommended), or research the onchain Uniswap pool route now.
