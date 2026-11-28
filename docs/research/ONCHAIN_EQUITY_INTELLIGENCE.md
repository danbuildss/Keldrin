# Onchain equity intelligence and wider coverage: feasibility, first pass (2026-11-28)

This is a research assignment from the founder (2026-11-28). It does not approve building anything. Nothing here is
built. The numbers below were measured on Base mainnet through our Alchemy RPC on 2026-11-28 (head block ≈ 63,264,635).

## 1. What we measured onchain

The window is the last 43,200 blocks, about 24 h at 2 s per block, read with `eth_getLogs` for ERC-20 `Transfer`
on the token contract:

| Token | Raw supply (tokens) | Transfers | Mints (from 0x0) | Burns (to 0x0) | Distinct addresses seen |
|---|---|---|---|---|---|
| NVDAc | 72,958.85 | 4,056 | 0 | 0 | 239 |
| AAPLc | 5,829.26 | 447 | 0 | 0 | 78 |

What this tells us:
- **Supply, mint and burn are cheap and exact.** `totalSupply()` gives supply at any block. Mint and burn events are
  `Transfer` logs from or to the zero address, and each one comes with a block number and transaction hash we can
  serve as proof. No mint or burn happened in this window, so issuance is lumpy and history has to be read from token
  creation onward. (An all-time mint/burn and holder scan was started, then stopped at the founder's request; still to do.)
- **Transfers are not trades.** About 4,000 NVDAc transfers a day touch only about 240 addresses. Many of them pass
  through pools and routers. Trading volume has to come from pool `Swap` events, not from token transfers.
- **Raw supply is not equity exposure.** Share-equivalents are raw × multiplier ÷ 1e18. A dollar value needs the
  multiplier at that block and a clear statement of which price is used: the NAV, which is a total-return reference,
  or the DEX price. We already store both inputs.

## 2. Feasibility by capability (13 NAV stocks first)

| Capability | How | Effort | Verifiable? | Recommendation |
|---|---|---|---|---|
| Supply history | `totalSupply()` at daily-close blocks (we already map session closes to blocks for NAV) | Small | Yes (block) | Was P0; see §4: already free elsewhere |
| Mint/burn history | Transfer logs from/to 0x0 since token creation | Small | Yes (tx hash) | Was P0; see §4: Pegproof reconciles this for free |
| Coverage levels L1/L2/L3 per token | From data we already hold (feeds, verified pools, identity) | Small | Yes | **P0**: makes "435 tracked vs 13 full" explicit in the API |
| Historical DEX volume | `Swap` events on our 416 verified pools, priced at the block | Medium | Yes (tx hash) | P1 |
| Holder counts and concentration | Replay every Transfer since creation per token, then label pools, routers, the issuer and custodians | Medium (labelling is the hard part) | Partly (counts addresses, not people) | P1, published with methodology |
| Large transfers | Threshold on the transfer stream | Small once transfers are indexed | Yes | P2 |
| Protocol exposure (lending, vaults) | Balances of curated protocol addresses | Medium (needs a curated list) | Yes for listed addresses | P2 |
| Other issuers (xStocks, Ondo, Robinhood) | New identity, corporate-action and price models per issuer | Large | Varies | Later, after Base usage is proven |
| Individual wallet analytics | — | — | — | **Exclude** (founder decision) |

**Build our own indexer or use a provider?** Build our own, narrowly. Our GitHub Actions research robot plus
Alchemy can index 13 tokens and 416 pools incrementally: store the last block we read, and re-read about 100 blocks
for reorg safety. Base's public RPC refuses `eth_getLogs` from our server ("request limit reached", seen
2026-11-28), so all log reading has to run in the robot on Alchemy, not in the API. Cost: within Alchemy's free
tier for 13 tokens. We need to measure it before extending to 435 tokens. We introduce no new paid provider.

## 3. Competitors: read on 2026-11-28 (live pages and machine files)

| Who | What they serve (as read) | Price | Overlap with keldrin | Not offered (in what we read) |
|---|---|---|---|---|
| **StocksOnChain** (stocksonchain.io, llms.txt + JSON files) | 1,017 stocks, 3,833 listings, **5 issuers on 5 chains**. Holders reconstructed from the full Transfer tape and checked against `totalSupply()`. Daily history of supply, multiplier, holders, price and volume. Corporate-action feed with tx hashes. MCP, agent skill, OpenAPI. CC BY 4.0 | Free | **High for the onchain layer** (holders, supply, daily history) | For Coinbase, only `created`, `listing` and `minted` events (157 of 160): no dividends or multiplier changes. No SEC links, no Chainlink NAV. Snapshot dated 2026-11-17 (11 days old when read) |
| **Pegproof** (pegproof.com, llms.txt + /v1/issuers + Coinbase page) | Integrity checks across **5 issuers**: supply reconciled with the full mint/burn ledger, who can mint, freeze, seize or upgrade, multiplier control, look-alikes. Coinbase: 138/138 supply checks pass, checked every 10 min, seizures listed with tx. Robinhood checked in full. MCP, JSON API, verify.sh | Free | **High for supply / mint-burn / issuer controls** | No NAV history, no corporate-action calendar or SEC linkage, no DEX prices |
| **BStocks** (basestocks.finance, OpenAPI 1.0.0) | Trading app plus API: DEX price, Chainlink reference, liquidity, 24h volume, multiplier, staleness, wallet portfolio, trade calls. Candle history and a model-written report at $0.10 x402 | Free, plus $0.10 calls | High for live prices, volume and history candles | No corporate-action, dividend, split or filing endpoints. No round-id NAV history |
| **Proof of Stock** (proofofstock.xyz, llms.txt v0.9.0) | Token authenticity vs issuer registries (Base + Robinhood Chain), look-alike list, NAV/DEX premium, MCP. Strong proof culture (list hashes, receipts, kill switch) | Free; $0.01 x402 passes | Medium (session, premium, MCP) | No round-id NAV history, no corporate-action reconciliation |
| **Allium** (allium.so, tokenized-asset page) | Enterprise data: supply, market cap, holders and transfers for tokenized assets incl. stocks across 17 chains, in SQL, REST or warehouse. Research reports | Sales-led, no public price | High for the onchain layer, at enterprise level | Not Coinbase-B20-specific in what we read. No NAV round history or SEC linkage mentioned |
| RWA.xyz | **Not read**: app.rwa-xyz.com and rwa.xyz are still blocked (the hosts allowed so far don't include those exact names) | — | — | — |

**Market size context** (from Pegproof's /v1/issuers, which takes values from CoinGecko and states
`checked_by_pegproof: false`; keldrin has not verified them): bStocks about $1.13B, xStocks about $1.03B, Ondo
about $802M, Robinhood about $151M, **Coinbase about $38M** (data time 2026-11-26). StocksOnChain's tracked total is
about $1.67B (2026-11-17). If these figures are roughly right, Coinbase on Base is the smallest of the five issuers
by value.

## 4. What this means: where to double down

The onchain adoption layer is already served **for free**:
- **StocksOnChain:** holders, supply and daily history across 5 issuers.
- **Pegproof:** supply reconciliation, mint/burn ledgers and issuer controls.
- **Allium:** the same at enterprise level.

Building supply, mint/burn and holder counts as our P0 would make keldrin the sixth source of something that is free
elsewhere.

What none of them serves, in what we read, is what keldrin already has:
1. **Chainlink NAV history with the round id behind every point.** Plus daily closes in NYSE time, and freshness
   judged against each feed's own rhythm.
2. **Corporate actions reconciled across issuer, SEC and chain.** Dividends and splits matched to the SEC filing
   and the onchain multiplier change, with predicted and late states. StocksOnChain has no Coinbase dividends or
   multiplier events; Pegproof and BStocks have no corporate-action feed.
3. **NAV-based risk and context in one answer.** Volatility, drawdown, the gap to the DEX price, session and
   freshness, delivered as a single verified answer to agents (MCP, x402).

This is the "history plus truth" layer a lending protocol, a portfolio app or a trading agent needs before acting.
It is also exactly what MAXXAGENT said they had to rebuild themselves.

**Recommendation:**
- **Double down** on NAV history, corporate-action reconciliation and NAV-based risk, and make them the best and
  most reliable available.
- **Use or link** the free onchain sources instead of rebuilding them: StocksOnChain and Pegproof are CC BY or
  free, and Proof of Stock covers authenticity. Their figures can also serve as an independent cross-check
  against our own reads.
- **Watch the issuer question.** Coinbase may be the smallest issuer by value. Long term, the moat could be the
  same NAV-plus-corporate-action truth across issuers. That depends on whether other issuers publish NAV feeds and
  corporate-action mechanics we can verify; this has not been researched yet.

## 5. Proposed roadmap (for founder approval; nothing approved here)

1. **Now, 0–30 days:** launch and developer adoption. Target 5 integrations and 1 paying user. Interview the users
   keldrin is meant for (lending, agents, portfolio apps) on NAV, corporate actions and risk.
2. **Deepen the moat, 30–90 days:**
   - corporate-action coverage across all 435 Coinbase tokens (calendar, SEC links, late detection);
   - NAV history for every new Chainlink feed;
   - a risk endpoint (volatility, drawdown) in the API rather than only on the Explorer page;
   - coverage levels per token.
3. **Onchain layer:** cross-check against StocksOnChain and Pegproof rather than building it first. Build our own
   only where a customer needs something they don't serve, or where we need independent verification.
4. **Cross-issuer research:** check whether xStocks, Ondo and Robinhood publish NAV feeds and corporate-action
   events we can verify. Expand only after usage on Base exists.

## 6. Open items

- An all-time mint/burn and holder scan for the 13 tokens (about 1 robot run). It gives real history numbers and
  measures the Alchemy cost.
- RWA.xyz: needs the exact hosts app.rwa-xyz.com and rwa.xyz allowed.
- Cross-issuer feasibility: NAV and corporate-action sources for xStocks, Ondo and Robinhood.
- Data rights for redistributing derived onchain metrics. Onchain data is public. Third-party labels would not be.
