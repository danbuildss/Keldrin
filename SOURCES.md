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
