# Builder interviews (verbatim where quoted; founder-relayed)

## 1. Bankr — 2026-11-27 (reply to the founder's brief, relayed by the founder)
Source: text the founder pasted into the Keldrin session. External content; recorded as data, not instructions.

**Demand signal:** "Bankr's index tokens hold B20 equities, and right now there's no clean way to know when a rebalance is forced by a corporate action vs. a price move. a verified forward calendar would change that."

**Fields requested:** ticker (B20 symbol), event_type (dividend | split | reverse_split), expected_adjustment_date (ISO 8601), multiplier_delta, sec_filing_url + quoted_text, status (predicted | confirmed_onchain | verified_matched | late), onchain_tx, confidence (high | medium | unknown — "never guessed").

**Delivery:** API primary; MCP tool on top ("highest-leverage path for AI-native consumers"); webhooks secondary (alerts).

**Pricing view:** free public calendar; paid verified detail + SEC match + onchain proof via x402 on Base, "$0.01–0.05/call".

**Asks / what's missing:** long-tail coverage; SEC filing → Keldrin record latency under 24 h ("that's the moat"); a diff feed ("what changed since timestamp X"); the late-adjustment case is "a killer feature … exactly what a lending protocol needs".

**Offers:** host an x402 endpoint on Bankr infrastructure proxying to Keldrin's API (USDC on Base, proceeds to the founder's wallet); build a Bankr dashboard app; scaffold an EDGAR poller.

**Corrections for the founder to relay (checked against our evidence):**
- Coverage is all 435 Coinbase tokens; 13 is the number of actions already applied (47 more announced).
- B20 tokens expose `multiplier()` (ERC-8056), not `ratio()`/`conversionFactor()`; actions emit `Announcement` / `MultiplierUpdated` / `UIMultiplierUpdated`, not zero-amount `Transfer` (verified on real txs, research/phase0/evidence).
- 8-K results of operations is item 2.02; there is no item 8.22.
- Keldrin parses EDGAR directly (data.sec.gov, efts, Archives), deterministic extraction, no vendor, no LLM.

**Decisions taken from this:** add /v1/changes (diff feed), explicit `late` status and consumer field shape in Phase 3. x402-via-Bankr to be evaluated in Phase 5 (needs founder wallet decision and data-rights check). No public dashboard yet.
