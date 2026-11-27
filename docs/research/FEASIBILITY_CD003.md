# Feasibility report: MAXXAGENT feedback (CD-003), 2026-11-27

Scope: the founder's "Customer Discovery Update 002" brief. That builder is recorded as **CD-003**, because CD-002 is already Bankr. This is research only; nothing here is approved scope.

## Evidence base (what was actually checked)
| Source | How | Result |
|---|---|---|
| MAXXAGENT repo `0xAxelowETH/maxxagent` @ `995c4a2` | Cloned read-only | **MIT license** (reuse allowed with attribution). Read `b20Guard.ts`, `riskStats.ts`, `marketHours.ts`, `tokenizedStocks.ts`, `api/skill/stocks` |
| maxxagent.xyz/api/skill/stocks | curl | **Not reachable from this environment** (host not on the network allowlist). Its shape is taken from the source code, not a live call |
| Coinbase Tokenized Stocks API | Live calls | 138 live tokens with supply; `/nav-feeds` lists **14** Chainlink NAV feeds; corporate actions fetchable **by UUID only**; `nav_price` is **latest only** |
| BaseHub API reference (basehub.org, third-party docs by Will Binns) | Read | Documents the Coinbase endpoints above; states nav_price "is a reference value, not a quote" and "the feeds stop outside market hours" |
| Base blog: B20 (Aug 27 2026), Denim (Nov 5 2026) | Read | The Chainlink feed is a **total-return feed that "already bakes in the multiplier"**; Denim makes TRANSFER_EXECUTOR_POLICY apply to every transfer path; new `invertedPolicyId` |
| Chainlink docs: historical data | Read | roundId = phaseId << 64 \| aggregatorRoundId; history lives in several aggregators; aggregator round ids "may not be monotonic" |
| Base chain via Alchemy (`scripts/nav-probe.ts`, `scripts/nav-coverage.ts`) | Read onchain | NVDAc feed `0x0468…8513` ("Coinbase NVDA", 8 decimals, phase 2, 1,949 rounds; median update gap 11 min in session, longest gap in the sample 24.7 h). All 14 feeds start 2026-08-03 (ANTc 2026-11-19); **36,159 rounds in total** in the current phases |
| Chainlink "data.chain.link", DexScreener, GeckoTerminal terms | Not read | Not checked; see the legal section |

## The eight questions

### 1. What already solves these problems?
- **Latest NAV:** Chainlink onchain, plus Coinbase's API (`nav_price`, `nav_price_updated_at`).
- **Feed discovery:** Coinbase `/nav-feeds` (official). MAXXAGENT hardcodes its 10 feed addresses; the NVDAc address matches Coinbase's.
- **Corporate actions:** Coinbase `/corporate-actions/{uuid}` (one action, if you already know its id) and B20 onchain events. **Keldrin already serves** verified actions for all 435 tokens, SEC-linked, with a forward calendar.
- **Prices and liquidity 24/7:** DexScreener and GeckoTerminal (third-party, terms unknown); MAXXAGENT's own endpoint for its 10 stocks.
- **Risk, market hours and the B20 guard:** each builder builds their own. MAXXAGENT's versions are public under MIT.

### 2. Where are the actual gaps? (verified)
1. **No historical NAV API.** Coinbase gives the latest value only; history means walking `getRoundData` across Chainlink phases yourself.
2. **No list of corporate actions per token.** Coinbase needs the UUID, which you can only get by scanning onchain announcements. Keldrin already closes this gap.
3. **No series that combines NAV history with corporate actions.** Total-return NAV vs per-share value (NAV ÷ multiplier at that time) needs both datasets aligned in time. Nobody offers it, and it's where double-adjustment mistakes happen.
4. **No standard risk metrics** (volatility, drawdown) for these tokens.
5. **No machine-readable "is this NAV stale or just closed?" signal.** MAXXAGENT hardcodes a holiday list (it ends in 2027).
6. **B20 policy monitoring:** solved by MAXXAGENT for 10 tokens, open source; not offered as a service.

Not a verified gap: DEX prices and liquidity. Existing aggregators cover them; the question is the terms, not missing data.

### 3. What can Keldrin realistically ship before Stocks Maxxing ends?
MAXXAGENT's README says the Base Builder Quest runs Nov 5 – Dec 5. Our track deadline (HACKATHON.md) is Dec 12. By the end of next week:
- **NAV history** for all 14 feeds: full backfill plus incremental updates in the scheduled run. Cheap: about 36k rounds, roughly 200 batched calls.
- **Corporate actions per asset:** mostly a new route over data we already serve.
- **Risk:** NAV-based volatility and drawdown with an explicit `insufficient_data` status.
- **Market context:** session state and expected vs unexpected NAV staleness.
- **Transfer policy:** a read-only snapshot. Cheap, and MAXXAGENT's code shows exactly how.

Not realistic, or not wise, in that time: DEX liquidity and divergence (third-party terms, or our own pool indexing), and notifications or webhooks.

### 4. Operating costs (estimates from measurements)
- **Alchemy:** backfill ≈ 36k `getRoundData` reads in about 200 multicall requests (one batch of 200 took 0.5 s). Incremental ≈ 14 feeds × a few calls per run. Within the free or pay-as-you-go tier at current volume.
- **Supabase:** about 36k rows now, plus a few hundred a day. Negligible.
- **GitHub Actions:** about 1 extra minute per run.
- **Freshness trade-off:** the current schedule is 6-hourly. That's fine for daily risk and history. If builders need fresher NAV, a separate NAV-only job could run hourly: about 1 minute × 24 a day ≈ 720 minutes a month, a budget decision for the founder.

### 5. What can we legally redistribute?
- **SEC data:** public. Fine.
- **Onchain values** (multipliers, events, policy ids, Chainlink rounds): publicly readable. But **Chainlink price data may be covered by Chainlink's or the data provider's terms. Not checked; legal review needed before serving NAV history publicly or commercially.** The founder's earlier "data rights handled" decision covered the fields served then, not NAV history.
- **Coinbase API fields:** the founder stated rights are handled for the served fields. Extending this to `nav-feeds` needs the founder's confirmation.
- **DexScreener / GeckoTerminal:** terms unknown. Assume no redistribution until checked.
- **MAXXAGENT code:** MIT. Reuse with attribution (copyright notice kept).

### 6. What would MAXXAGENT need to integrate?
- Replace their `dailyCloses()` and `getRiskStats()` (RPC-heavy, cached per instance) with `GET …/nav/history?interval=daily` and `GET …/risk`.
- Replace their dividend multiplier lookup with `GET …/corporate-actions`.
- Optionally replace the hardcoded holiday list with `GET …/market-context`.
- Their non-functional needs (to confirm with them): no key, stable field names, a freshness timestamp on every response, and good uptime. They already cache, so latency is less critical.

### 7. The smallest useful API for them
1. `GET /v1/assets/{chain_id}/{contract}/nav/history?from=&to=&interval=round|daily`: rounds with `round_id`, `phase_id`, `answer` (decimal string), `updated_at`; daily NY-session closes flagged; per-share value alongside, using the multiplier in force; completeness indicators. Never filled in.
2. `GET /v1/assets/{chain_id}/{contract}/corporate-actions`: a per-asset view of what `/v1/events` already serves.
3. `GET /v1/assets/{chain_id}/{contract}/risk`: NAV-based volatility and max drawdown, with method, window and `insufficient_data`.

Item 1 is the "biggest wish". Items 2 and 3 are cheap once 1 exists.

### 8. How this should change the plan
See the final section. In short: **pull NAV history + corporate actions + risk ahead of the front page and MCP**, keep the agent guide (`skill.md`), and move MCP to just after Monday if time runs short.

## Challenging the founder's assumption
> "Historical NAV + corporate actions as the initial flagship."

**Supporting evidence:**
- It's the builder's explicit "biggest wish".
- The gap is verified: Coinbase has no history and no per-token action list.
- It's cheap to build.
- Keldrin is the only one that already has the verified corporate-action side, so the combined, correctly adjusted series is a real advantage, not just aggregation.

**Evidence against, or limits:**
1. **Coverage is narrow.** NAV history exists for only **14 of 138** live tokens. Corporate actions cover all of them. So the flagship must lead with corporate actions and treat NAV history as the deep layer for feed-backed tokens.
2. **History is short.** Feeds start 2026-08-03, so about 80 trading days. 60-day volatility is possible; long-horizon risk isn't, and must say so.
3. **It's easy to rebuild.** MAXXAGENT did it in about 150 lines. The value is convenience and correctness (phases, adjustments, staleness), not exclusivity. Builders will only depend on it if it's reliable and fresher than their own cache.
4. **Rights are unresolved** for Chainlink data, as above.
5. **The market is small:** today it's the Stocks Maxxing builders. That's fine for design partners; it doesn't yet prove a business.

**Verdict:** agree, refined. The flagship is **"corporate-action-aware NAV history"**: verified actions for all tokens, plus NAV history, per-share values and risk for the 14 feed-backed tokens, all with provenance. Keep DEX and liquidity out until terms are checked or partners exist.

## Architecture principle (agreed with the brief)
- **Deterministic workers** do indexing, calculations, monitoring and serving. They already do: discovery, verification and the calendar. NAV history and risk are more deterministic workers.
- **The LLM agent layer** (Aeon/Orric patterns) does research, explanation and evaluation. Not for scheduled computation. No new LLM skill is needed for any of this.

## Revised implementation plan (for approval, one phase at a time)
| Phase | When | Build | Proof |
|---|---|---|---|
| 5 NAV history | Fri–Sat | Feed discovery (Coinbase `/nav-feeds`, cross-checked onchain), phase-aware round indexer, Supabase table, incremental updates in the scheduled run, `…/nav/history`. **Proven on NVDAc first, then all 14** | Independent re-read of sampled rounds; completeness report; no filled gaps |
| 6 Per-asset intelligence | Sat–Sun | `…/corporate-actions`, `…/risk`, `…/market-context` (sessions, expected vs unexpected staleness), optional `…/transfer-policy` snapshot; `skill.md` agent guide | Unit tests of the maths on fixtures; verifier checks of the inputs |
| 7 Launch | Sun–Mon | Simple front page (live data only), docs, independent review, outside-in tests; founder decides go-live | Checklist |
| After Monday | — | MCP endpoint, DEX liquidity (after terms), alerts, earnings | — |

**Decisions the founder needs to make:**
1. Approve Phase 5 as above.
2. Chainlink data rights: check them, or accept serving NAV history as "derived from public onchain Chainlink data" pending review.
3. Is 6-hourly freshness acceptable for now, or should we budget an hourly NAV job?
