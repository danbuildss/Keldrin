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

Phase 0 registry observations (2026-11-27). Proposed, not approved; class mapping still to verify:

| Ticker | Token | Contract (Base 8453) | ISIN | Registry multiplier | Onchain checked |
|---|---|---|---|---|---|
| NVDA | NVDAc | 0xb20000000000000000000078ee7ce2fE4908108C | US67066G1040 | 1.0005379… | yes (isB20, isin, supply, WAD multiplier) |
| AAPL | AAPLc | 0xb200000000000000000000C2e324d24d7eEcd1fb | US0378331005 | 1.0005003… | no |
| TSLA | TSLAc | 0xb2000000000000000000001e800a7f5189430cD0 | US88160R1014 | 1 | no |
| GOOGL | GOOGLc | 0xb2000000000000000000002D0BA3164cc74f58B7 | US02079K3059 | 1.0003771… | yes (multiplier history around the action) |
| META | METAc | 0xb2000000000000000000008bC8786B856E61707C | US30303M1027 | 1.0003137… | no |

Alphabet's SEC submissions list tickers GOOGL, GOOG, GOOGM, GOOGN, so a ticker alone must never select a class.
