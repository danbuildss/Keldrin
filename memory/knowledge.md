# Verified knowledge ledger
Only add claims with evidence URL, retrieval time, source rights, review state and limitations. Separate product decisions (DECISIONS.md) from observations. No verified live findings yet.

## 2026-11-27 (Phase 0 observations; evidence in research/phase0/; review state: unreviewed, author probes)
- Coinbase Tokenized Stocks registry lists 435 B20 tokens on Base; records carry no chain_id; numeric fields are JSON doubles. Rights: unknown.
- Corporate-action records are fetchable only by the UUID in the onchain Announcement uri; one action may have several announcements with different `id` values (GOOGLc: "2097" and the UUID).
- GOOGLc dividend multiplier change was applied via the instant (deprecated) setter and emitted only `MultiplierUpdated`.
- Public Base RPC serves historical state but rate-limits long eth_getLogs ranges.
- SEC www.sec.gov requires a declared contact User-Agent; data.sec.gov accepted a generic one on this date.
- Limitation: single-day observations; behaviour may change.
