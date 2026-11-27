# Historical NAV indexing

Research only (2026-11-27, CD-003). Not approved scope. Main report: docs/research/FEASIBILITY_CD003.md.

## Facts measured onchain (scripts/nav-probe.ts, scripts/nav-coverage.ts)
- Coinbase `/nav-feeds` lists 14 feeds; 138 live tokens have supply. So NAV history exists for about 10% of tokens.
- Feeds are Chainlink proxies ("Coinbase NVDA", 8 decimals, version 6). 12 feeds have 2 phases; ANTc started 2026-11-19 with 1 phase. **Correction (independent review, 2026-11-27):** phases overlap. The proxy switched every two-phase feed to phase 2 at block 49,669,080 (2026-08-07), while phase-2 aggregators already published from 2026-08-05 and phase-1 aggregators kept publishing until about 2026-08-14. Phase-1 aggregators also report 18 decimals while the proxy reports 8. Only rounds inside their phase's live window, from an aggregator whose decimals match the proxy, are official (Phase 5b).
- 36,159 rounds across current phases. A 200-round multicall took 0.5 s.
- NVDAc: median gap between rounds 11 min during sessions; gaps up to ~25 h over closures (the 85-hour sample included Thanksgiving).

## Design (proposed)
- **Discovery:** Coinbase `/nav-feeds` → cross-check onchain (`description()` names the ticker, `decimals()`; the token↔feed pair is recorded with its source). If they disagree, fail closed.
- **Phases:** for each `p` in `1..phaseId()`, read `phaseAggregators(p)` and walk proxy ids `(p<<64)|n` from n=1 until a revert or zero `updatedAt`. Store `phase_id`, `aggregator_round_id`, `proxy_round_id`, the aggregator address, and `answer` as an exact integer string plus `decimals`. Ids "may not be monotonic" (Chainlink docs), so key by (feed, proxy_round_id) and order by (`updated_at`, `round_id`).
- **Incremental:** keep the last indexed round per phase. Each run reads `latestRoundData` and fetches new ids in batches. A new phase means a migration: the old phase is marked closed.
- **Quality:** per feed, a count of rounds, missing or reverted ids, rounds with `answer <= 0`, and the max gap inside sessions (gaps on closures are expected). Never interpolate or fill.
- **Daily close:** last round with `updated_at` inside the NY trading day (weekends and holidays excluded; Friday rounds after UTC midnight belong to Friday). This matches MAXXAGENT's method.
- **Total-return vs per-share:** the feed "already bakes in the multiplier" (Base B20 blog). Per-share = answer ÷ multiplier in force at `updated_at`, with the multiplier history from Keldrin's verified records. **Never multiply NAV by the multiplier again.** To verify empirically in the build phase: NAV continuity across a known multiplier change (GOOGLc, block 51310619).
- **Storage:** Supabase `nav_rounds` (append-only) plus `nav_feeds`. **API:** `/v1/assets/{chain}/{contract}/nav/history`.

## Cost
Backfill ≈ 200 batched calls; daily increments ≈ hundreds of rounds in total. Negligible on Alchemy and Supabase.

## Open
Chainlink data redistribution terms (legal); freshness target (6-hourly vs hourly).
