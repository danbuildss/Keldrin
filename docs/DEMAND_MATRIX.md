# Demand matrix: needs → Keldrin capabilities

The evidence column counts distinct builders (CUSTOMER_DISCOVERY.md). The availability column records what can be built **reliably from legally accessible data**, checked against our sources. It is not an approval to build.

| Need | Requested by | Keldrin today | Feasible next | Data source and availability | Notes |
|---|---|---|---|---|---|
| Corporate actions applied to B20 tokens (dividends, splits) | CD-001, CD-002 | ✅ Live: `/v1/events`, `/v1/actions`, all 435 tokens | — | Base chain (Alchemy) + issuer record | Exact WAD values with tx proof |
| Forward calendar of token adjustments | CD-002 | ✅ Live: 13 dated, 34 announced | Keep fresh on a schedule (Phase 4) | SEC 8-K text + onchain announcements | Expected date is an observed pattern (8 of 9) |
| Late or missed adjustment flag | CD-002 | ✅ Live (`status=late`) | — | Chain + SEC | MRVLc, 8 days late |
| Dividend amounts, record and pay dates | CD-001, CD-002 | ✅ For 9 declarations | Broaden extraction coverage | SEC filing text (deterministic) | Foreign filers (6-K) are weaker |
| Ex-dividend date | CD-001 (implied) | ❌ | Serve as **derived** | Not in SEC filings (set by the exchange). Under T+1 settlement ex-date usually equals the record date | Must be labelled derived, with the rule shown |
| Historical dividends | CD-001 (implied) | Partial (XBRL per quarter) | Endpoint per company | SEC XBRL + 8-Ks | — |
| Earnings release events (when results came out) | CD-001 | ❌ | Detect 8-K item 2.02 filings and link the press release | SEC submissions (keyless) | Exact filing time available |
| Upcoming earnings dates | CD-001 | ❌ | Only when the company files or announces it | Company filings and press releases. Full calendars are **licensed** data | No guessing; mark unknown |
| Earnings results (revenue, EPS, margins, guidance) | CD-001 | ❌ | Headline numbers from release text; XBRL after the 10-Q | SEC 8-K text and XBRL (free) | Guidance is narrative: quote it, don't interpret |
| Results vs expectations | CD-001 (implied) | ❌ | **Not feasible without a licensed consensus feed** | Analyst consensus is licensed (FactSet/LSEG/Zacks and similar) | Exclude rather than fake |
| Onchain reference value and freshness | CD-001, CD-002 | Partial (Chainlink NAV reads in reconciliation) | `/v1/assets/{contract}/context` | Chainlink NAV feeds onchain | Total-return reference, not a price; stops outside market hours |
| Onchain prices, liquidity, volume | CD-001 | ❌ | DEX pool indexing via Alchemy, or a partner source | Base chain (pools); BStocks API as a possible partner (terms to check) | Sizeable; P1 unless demand grows |
| Price discrepancies (DEX vs reference) | CD-001 (implied) | ❌ | After the two items above | Both | Units, market hours and total-return semantics make naive comparisons wrong |
| Company fundamentals | CD-001 (P1) | ❌ | XBRL company facts | SEC XBRL (free) | — |
| MCP tool | CD-002 | ❌ | Wrapper over REST (Phase 5) | — | — |
| Webhooks or alerts | CD-002 (secondary) | ❌ | After scheduling | — | — |
| Pay per call (x402) | CD-002 | ❌ | Phase 5 (founder approved later) | — | Bankr offered to host |

## Added 2026-11-27 from CD-003 (MAXXAGENT); availability verified in docs/research/FEASIBILITY_CD003.md
| Need | Requested by | Keldrin today | Feasible next | Data source and availability | Notes |
|---|---|---|---|---|---|
| Historical NAV (rounds, daily closes) | CD-003 ("biggest wish") | ❌ | Phase-aware indexer, `…/nav/history` | Chainlink onchain; **14 of 138 tokens have feeds**; ~36k rounds since 2026-08-03 | Redistribution terms to check |
| Corporate actions per asset | CD-001, CD-002, CD-003 | ✅ via /v1/events | `…/corporate-actions` route | Already verified | Coinbase offers by-UUID only |
| Per-share vs total-return series | CD-003 (implied) | ❌ | NAV ÷ multiplier in force | Chainlink + Keldrin multipliers | Prevents double adjustment |
| Volatility, drawdown | CD-003 | ❌ | `…/risk` (NAV-based) | Derived from NAV history | `insufficient_data` when short |
| Market session / stale vs closed | CD-003 | ❌ | `…/market-context` | Deterministic calendar + feed age | Holiday list must be maintained |
| B20 transfer policy | CD-003 | ❌ | `…/transfer-policy` snapshot | Onchain (PolicyRegistry) | MIT reference code exists |
| DEX liquidity / NAV-DEX gap | CD-001, CD-003 | ❌ | Partner or own pool indexing | DexScreener/GeckoTerminal terms unknown | Deferred |
