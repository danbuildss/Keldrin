# Data provenance

Legend: ✅ live now · 🛠 planned (docs/PLAN_DEVELOPER_RELEASE.md), not built yet.

Principle: every value names where it came from, so you can re-check it onchain or at the SEC yourself. Keldrin is read-only intelligence, not a replacement for execution-critical onchain checks.

| Data | Source | Proof fields | Status |
|---|---|---|---|
| Corporate actions (multiplier changes) | B20 events and `multiplier()` on Base | `onchain_tx`, block, `multiplier_before/after_wad`, record_id, payload sha256, independent review verdict | ✅ |
| Dividend declarations | SEC 8-K/6-K text (deterministic extraction) | `sec_filing_url`, `quoted_text` | ✅ |
| Token identity | Coinbase registry + onchain (`isB20`, symbol, ISIN metadata) | identity checks per token | ✅ |
| NAV history | Chainlink NAV proxy on Base (feed from Coinbase `/nav-feeds`, cross-checked onchain) | `feed`, `phase_id`, `aggregator`, `round_id`, `answer_raw`, `decimals`, `updated_at`, `retrieved_at`, verification sample | 🛠 |
| Market context | Live `latestRoundData` + deterministic NYSE calendar | `round_id`, `updated_at`, calendar version | 🛠 |

**Semantics to respect:**
- The Chainlink NAV is a **total-return** reference that already includes dividends and splits (Base B20 docs). Don't apply the multiplier again.
- The last NAV outside market hours is **the last published reference**, not a live equity price.
- `unknown` is a valid answer. Keldrin never fills missing data.
