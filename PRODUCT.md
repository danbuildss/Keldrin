# Product definition
## First product: Keldrin Event Feed
One canonical event stream indexed by underlying company and verified Base contract. Initial event types: earnings releases, material filings, dividend/split announcements, acquisition announcements, issuer-confirmed multiplier/pause changes. Separate planned versus confirmed versus effective events. Track corrections and source history.

## Consumers
- Lending: events, liquidity observations, feed freshness; not LTV or underwriting.
- Portfolio: earnings, company changes and risk context; not trade recommendations.
- Perps: reference freshness, market session and event timing; not settlement oracle.
- Options: event calendar and corporate actions; no implied volatility or Greeks until licensed data and independent validation.
- Index vaults: constituents' event history and action metadata; not automated rebalances.

## MVP
One manual reproducible event, then five issuer-verified assets; SEC/IR + issuer/RPC references; canonical JSON records, versioned storage, REST events endpoint, public evidence page, example integration, approved x402 endpoint. MCP is a wrapper after REST; defer webhooks/Telegram if needed. No broad chatbot. Public report is generated from stored records, not independent hallucinated narrative.

Acceptance: a third-party app retrieves a verified event by contract, validates schema, checks source and age, and consumes without web search. Missing or stale data must be obvious. Prove with real data and integration logs.

## Proposed changes (CD-003, 2026-11-27): NOT approved
- Flagship framing: **corporate-action-aware NAV history**, meaning verified corporate actions for every token, plus NAV history, per-share values and NAV-based risk for the feed-backed tokens (14 today). See docs/research/FEASIBILITY_CD003.md.
- Supporting: market context (session, expected vs unexpected staleness) and a read-only transfer-policy snapshot.
- Not now: DEX liquidity, NAV/DEX divergence, alerts, earnings (after launch).

- CD-003 follow-up: first developer release = `nav/history` + `market-context` (+ per-asset corporate actions). Risk after NAV coverage is verified. See docs/PLAN_DEVELOPER_RELEASE.md. (Proposed; awaiting approval.)
