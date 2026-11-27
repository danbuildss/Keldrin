# Proposed targets
All rows proposed pending founder approval and live issuer mapping. No token contract address is assumed from ticker alone.

| Equity | Candidate | Status |
|---|---|---|
| NVIDIA | NVDA | verify CIK, issuer identity, B20 contract, chain ID 8453, feed coverage |
| Apple | AAPL | same |
| Tesla | TSLA | same |
| Alphabet | GOOGL (class A) | same; do not conflate classes |
| Meta Platforms | META | same |

Source priorities: SEC EDGAR submissions and company facts; issuer investor relations; Coinbase tokenized stock registry/corporate actions; Chainlink official feed documentation; Base RPC and approved DEX adapter. Record mapping evidence and effective dates. Onchain status is read-only. If feed missing, expose unavailable; do not invent a fallback.

Official references: https://www.sec.gov/search-filings/edgar-application-programming-interfaces ; https://www.base.org/blog/b20-tokenized-stocks-on-base ; https://www.base.org/stocksmaxxing ; https://www.base.org/stocksmaxxing/rules ; https://basestocks.finance/developers (competitor reference).

v0.2: start with whichever of these five proposed companies has a verified issuer mapping and sufficient licensed primary evidence; do not approve ticker list implicitly.
