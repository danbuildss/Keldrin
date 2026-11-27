# Phase 0 source ledger (2026-11-27, UTC)

User-Agent for HTTP probes: `Keldrin-Phase0-Research/0.1 (founder contact pending)`. Rights column is our current understanding, not legal review.

| Retrieved | Source | HTTP | Bytes | sha256 (first 16) | Result | Rights state |
|---|---|---|---|---|---|---|
| 07:07:32 | https://api.coinbase.com/v1/tokenized-stocks (page 1) | 200 | 243707 | a997402635fef286 | 100 records + next_page_token | unknown (no terms found) |
| 07:07:55 | same, all 5 pages | 200 | (1053171 combined) | 4c8051c14fd3b3f1 | 435 tokens | unknown |
| ~07:09 | /v1/tokenized-stocks/chains, /nav-feeds, /prospectuses, /metadata/NVDAc | 200 | — | not hashed | chain 8453 protocol addresses; NAV feed map; ADGM prospectus URLs | unknown |
| 07:10:01 | /v1/tokenized-stocks/corporate-actions/e82812a6-… | 200 | 907 | 0350427720760788 | APPLIED cash dividend | unknown |
| 07:07:33 | https://basehub.org/api-reference/tokenized-stocks-api/ | 200 | 127336 | cdbdb215453eddb0 | endpoint docs (community, not issuer) | discovery only |
| 07:07:33 | https://basestocks.finance/developers | 200 | 178950 | c3af483bae67c018 | competitor API docs | competitor reference |
| ~07:20 | https://basestocks.finance/api/v1 , /stocks/GOOGL , /openapi.json | 200 | — | not hashed | no corporate-event fields | competitor reference |
| 07:07:33 | https://www.base.org/blog/b20-tokenized-stocks-on-base | 200 | 125581 | 478a00cd708f43e8 | B20 overview (Aug 27, 2026) | public docs |
| 07:12:30 | https://www.base.org/stocksmaxxing/rules | 200 | 210897 | ca1935989735eaf6 | Quest Nov 5 – Dec 12, 2026 | public |
| 07:12:30 | https://www.base.org/stocksmaxxing | 200 | 290304 | c38044ffe887aba2 | Agentic Stock Finance $21,000 | public |
| 07:07 | https://docs.chain.link/data-feeds | 200 | 355890 | not hashed | reachable; feed reads done onchain | public docs |
| 07:10:27 | https://data.sec.gov/submissions/CIK0001652044.json | 200 | 152430 | ab48e93cbc5bfaa5 | Alphabet filings; tickers GOOGL, GOOG, GOOGM, GOOGN | public (SEC fair access) |
| 07:10:49 | https://data.sec.gov/api/xbrl/companyfacts/CIK0001652044.json | 200 | 3251685 | e4b7685f57b8d6fc | dividend per share facts | public (SEC fair access) |
| ~07:11 | https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/index.json | **403** | — | — | blocked: SEC requires a declared contact User-Agent | — |
| 07:07 | https://base.blockscout.com/api/v2/stats | **403** | 5499 | — | site refused automated request | not used |
| ~07:09 | https://mainnet.base.org JSON-RPC (eth_call, receipts, historical state) | 200 | — | — | worked; eth_getLogs over long ranges → `-32011 request limit reached` | public chain data |
| — | git https://github.com/base/base-std @ b97145b22f7152505c2bdc448fff69d710528d9a (2026-10-26) | clone | — | — | IB20Asset, ERC-8056, docs | MIT |
| — | git aeonfun/aeon @ d6c66c0dab2ea1ccebe91d9db631843def25b04d (2026-11-26) | clone | — | — | — | MIT (Aeon Inc) |
| — | git danbuildss/orric-aeon @ 449479e27d86d4bbb4a73d91ab4ae62d598a83f9 (2026-11-22) | clone | — | — | — | MIT (danbuildss) |
| — | git danbuildss/breakra-research @ 3a3760fdc53bca430a6b52b0f28982b5468d1f28 (2026-11-26) | clone | — | — | — | no LICENSE file; founder-owned private code |

Not yet fetched: company IR sites, ADGM prospectus PDFs (adgm.com not allowlisted), SEC filing documents (403), Chainlink feed terms, Coinbase API terms of use.
