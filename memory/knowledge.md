# Verified knowledge ledger
Only add claims with evidence URL, retrieval time, source rights, review state and limitations. Separate product decisions (DECISIONS.md) from observations. No verified live findings yet.

## 2026-11-27 (Phase 0 observations; evidence in research/phase0/; review state: unreviewed, author probes)
- Coinbase Tokenized Stocks registry lists 435 B20 tokens on Base; records carry no chain_id; numeric fields are JSON doubles. Rights: unknown.
- Corporate-action records are fetchable only by the UUID in the onchain Announcement uri; one action may have several announcements with different `id` values (GOOGLc: "2097" and the UUID).
- GOOGLc dividend multiplier change was applied via the instant (deprecated) setter and emitted only `MultiplierUpdated`.
- Public Base RPC serves historical state but rate-limits long eth_getLogs ranges.
- SEC www.sec.gov requires a declared contact User-Agent; data.sec.gov accepted a generic one on this date.
- Limitation: single-day observations; behaviour may change.

## 2026-11-27 Phase 1 observations (independently verified by the Phase 1 verifier; evidence research/phase1/runs, records/)
- All 435 Coinbase tokenized stocks pass onchain identity checks (B20 factory, symbol, decimals, ISIN, multiplier).
- 13 corporate actions applied between 2026-08-12 and 2026-11-27 (12 "Cash Dividend", 1 "8-for-1 Stock Split" SNDKc on 2026-11-20 via the scheduled path). 12 used the deprecated instant setter.
- mainnet.base.org refuses eth_getLogs at any range (-32011) but serves historical eth_call and eth_getBlockReceipts.
- Limitation: notice-only announcements not exhaustively covered.
