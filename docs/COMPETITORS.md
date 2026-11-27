# Competitive discovery — not exhaustive
BStocks exposes tokenized-stock market and metadata APIs; issuer registry and Chainlink provide reference data; SEC/IR already provide official corporate disclosures. Keldrin's proposed gap: evidence-backed normalized corporate events tied to specific token assets with review, revision history and machine-consumable access. Do not claim uniqueness until comparing actual endpoints and user needs. Research competitors on coverage, verification, history, latency, pricing, licensing and developer effort. Interview builders in each target category; prioritize fields they actually need. If raw API already solves the need, do not duplicate it.

## Phase 0 findings (2026-11-27, live API inspection)
**BStocks** (`basestocks.finance/api/v1`, keyless, open CORS, `{data, meta}` envelope):
- Free endpoints: `/stocks`, `/stocks/{symbol}`, `/news` (titles and links only), `/earn`, `/stats`, `/portfolio/{address}`, POST `/trade` (builds calls for the user's wallet, ERC-8021 builder code).
- x402 at $0.10 USDC for `/pro/report` (model-written brief) and `/pro/history/{symbol}`.
- It handles B20 subtleties correctly: exact multiplier string, total-return reference named as such, staleness, address as identity.
- Gap: its OpenAPI has **no corporate-action, dividend, split, filing or announcement fields**. Keldrin should not duplicate prices, liquidity, positions or trading.

**Coinbase registry:** token-side identity and per-action records by UUID. No action history list, no link to SEC disclosures, doubles only.

**SEC EDGAR:** authoritative company events, no token linkage.

**Keldrin's proposed gap:**
- reconciliation of issuer token actions with official company disclosures
- leading calendar (declared but not yet applied)
- exact point-in-time values with block evidence
- share-class identity resolution
- audit trail

This remains a hypothesis until builders confirm the need (T013). Not compared yet: commercial equity data vendors (corporate-action feeds exist but are not linked to Base contracts; licensing likely restrictive).

## Added 2026-11-27 (CD-003 research)
| Who | What they offer | Overlap with Keldrin | Gap Keldrin fills |
|---|---|---|---|
| Coinbase Tokenized Stocks API (official) | Token list, latest NAV, `/nav-feeds`, corporate action by UUID, prospectuses | Reference data | No NAV history; no action list per token; no SEC linkage or verification |
| Chainlink feeds (onchain) | Total-return NAV rounds | Source for NAV | Raw rounds across phases; no daily closes, risk or session context |
| MAXXAGENT (`/api/skill/stocks`, MIT repo) | Live NAV, DEX price, 24h, liquidity for 10 stocks; risk inside their app | Partly (live snapshot) | No history API; 10 stocks only; it's a product, not infrastructure |
| DexScreener / GeckoTerminal | DEX prices, pools, liquidity | None today | Not pursued until terms are checked |
