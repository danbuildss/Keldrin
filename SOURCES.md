# Source registry and discovery checklist
References checked in public documentation on 2026-11-27; not live adapter tests or redistribution approvals. Claude must record actual HTTP status, schema, sample response hash, license/terms URL and permitted operations before enabling a source.

| Source | Candidate access | Purpose | Caveat |
|---|---|---|---|
| SEC EDGAR | https://www.sec.gov/search-filings/edgar-application-programming-interfaces | submissions and XBRL company facts | Identify user agent; obey fair access; confirm document rights; amendments matter |
| SEC submissions | https://data.sec.gov/submissions/CIK##########.json | filing discovery | 10-digit CIK; pagination/older files; do not treat filing date as event effective date |
| SEC company facts | https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json | typed facts | choose correct unit, taxonomy, period, accession and amendment |
| Company IR | official issuer site; discover per equity | earnings releases and announcements | source-specific permissions; no generic scraping |
| Coinbase tokenized stock registry | https://api.coinbase.com/v1/tokenized-stocks | candidate identity and NAV metadata | documented by BaseHub; verify live contract and entitlement; paginate; missing values unknown |
| Coinbase corporate actions | same base + /corporate-actions/{id} | issuer action and timing | action ID from verified announcement URI; never infer applied from announced |
| Base B20 | https://www.base.org/blog/b20-tokenized-stocks-on-base ; https://github.com/base/base-std | protocol semantics and events | issuer controls asset; verify ABI and deployment |
| Chainlink NAV | issuer registry /nav-feeds and verified feed docs | reference observations | distinguish total return, units, feed heartbeat, market closure; no trading quote |
| Base RPC | approved endpoint; chain 8453 | read-only contract/log evidence | check chain, finalized block policy, reorg and rate limits |
| BStocks | https://basestocks.finance/developers | competitive benchmark and optional source | not required; check rights; avoid trade API |
| News / X | licensed API or public permitted access | discovery only | official evidence required for material claims |

API guide: https://basehub.org/api-reference/tokenized-stocks-api/ (community documentation; validate against issuer). SEC fair access: https://www.sec.gov/about/developer-resources. x402: https://github.com/x402-foundation/x402. Aeon config: https://github.com/aeonfun/aeon/blob/main/docs/CONFIGURATION.md.

Registry rules: maintain provider, entitlement state (unknown/approved/restricted/denied), permitted fields, caching/redistribution policy, rate caps, retrieval timestamp, last success, schema version, source owner and fallback policy. Unknown rights block paid/public redistribution. Avoid storing full documents unless permitted; store extracted facts and locators. No bypass of authentication, robots, rate limits or paywalls. Secondary stories and provider claims do not replace primary evidence. Never apply the multiplier twice; normalize only after feed semantics confirmed.

## Phase 0 live verification (2026-11-27)
Full ledger with HTTP status, hashes and times: research/phase0/evidence/ledger.md.
- **Coinbase registry:** 200, 435 tokens over 5 pages (`next_page_token`).
  - Fields: contract_address, symbol, name, decimals, icon_url, total_supply, isin, adgm_isin, multiplier, nav_price, nav_price_updated_at, first_mint_date, description.
  - **No chain_id** per record; `/chains` gives chain 8453 protocol addresses.
  - Numbers are JSON doubles; use onchain WAD values for anything exact.
  - Endpoints verified: `/chains`, `/nav-feeds`, `/prospectuses`, `/metadata/{ticker}`, `/corporate-actions/{uuid}`. There is no list endpoint for corporate actions; UUIDs come from onchain `Announcement.uri`.
  - Terms of use not found, so rights are **unknown**.
- **Base RPC (mainnet.base.org):** eth_call, receipts and historical-state reads work; long eth_getLogs → `-32011 request limit reached`. B20 factory precompile `0xB20f000000000000000000000000000000000000` `isB20()` works.
- **B20 events** (base-std @ b97145b):
  - `Announcement(address indexed caller,string id,string description,string uri)`, topic0 `0xccebf8218a62875909564adef86a6f4df81503cb617221e793357d62f8e813f7`
  - `EndAnnouncement(string id)`, topic0 `0x96d64dafe2c790596430196b982ad1da3221cb3b0f4e6e2df77f2e4f71a90037`
  - `UIMultiplierUpdated(uint256,uint256,uint256)` and legacy `MultiplierUpdated(uint256)`. In practice the GOOGLc dividend emitted only the legacy one.
- **SEC:**
  - data.sec.gov submissions and companyfacts: 200 with a generic UA.
  - www.sec.gov Archives: **403** without a declared contact UA.
- **Chainlink NAV:** feed address from `/nav-feeds`, read onchain (`description` "Coinbase GOOGL", 8 decimals, `latestRoundData`), historical reads OK. Total-return reference, not a price. Feed terms not reviewed.
- **BStocks:** `https://basestocks.finance/api/v1` reachable, keyless, x402 v2 on two endpoints at $0.10. No corporate-event fields.
- **Not yet reached:** ADGM prospectus PDFs (adgm.com not allowlisted), company IR sites, Blockscout (403 from the site).
