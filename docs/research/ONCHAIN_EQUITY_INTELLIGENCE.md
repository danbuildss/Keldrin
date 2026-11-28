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
| Supply history | `totalSupply()` at daily-close blocks (we already map session closes to blocks for NAV) | Small | Yes (block) | **P0** |
| Mint/burn history | Transfer logs from/to 0x0 since token creation | Small | Yes (tx hash) | **P0** |
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

## 3. Competitors: what was checked today

| Who | Read on 2026-11-28 | Overlap | Not offered (in what we read) |
|---|---|---|---|
| BStocks (basestocks.finance, OpenAPI 1.0.0 + llms.txt) | Trading app plus API. Free: stocks (DEX price, Chainlink reference, liquidity, **24h volume**, multiplier, status), news titles, earn venues, **wallet portfolio**, trade calls. Paid $0.10 x402: model-written report, **candle history** | Prices, liquidity, volume, multiplier and staleness handling | No corporate-action, dividend, split or filing endpoints. No Chainlink round-id history. No SEC linkage |
| Proof of Stock (proofofstock.xyz, llms.txt v0.9.0) | Authenticity vs issuer registries on **Base and Robinhood Chain**, look-alike list, NAV/DEX premium, MCP, x402 passes at $0.01. Strong verification culture: list hashes, receipts, factory checks, an external kill switch | Market session, premium, MCP, verification ethos | Earlier review (docs/research/PROOF_OF_STOCK.md): no round-id NAV history, no corporate-action reconciliation |
| Pegproof, StocksOnChain, RWA.xyz, Allium | **Not checked**: their sites are not reachable from this session's network | Founder's research says high overlap | Unknown. Do not assume until read |

The founder's research says BStocks documents corporate actions. Its current OpenAPI has no such endpoint, and it
mentions corporate actions only to explain why feeds pause. We should re-check if their docs change.

## 4. Where keldrin can win (hypotheses to test with developers)

1. **History with proof.** Every NAV point carries its round id, every corporate action links its SEC filing and
   onchain transaction, and anyone can re-verify with `npx keldrin verify-*`. Neither competitor we read serves this.
2. **Corporate-action reconciliation.** We link issuer, SEC and onchain multiplier events, including late and
   predicted actions. This is the gap MAXXAGENT named.
3. **Supply and issuance history** as the first onchain layer, served with tx-hash proof, the same way.

Be careful about:
- **Live prices and volume:** BStocks does this well, for free. Don't compete on it.
- **Authenticity:** Proof of Stock does this well. Link to it rather than rebuild it.

## 5. Proposed roadmap (for founder approval; nothing approved here)

1. **Now, 0–30 days:** launch and developer adoption. Target 5 integrations and 1 paying user. Ship the cheap P0s
   only if a developer asks: coverage levels, supply history, mint/burn history.
2. **30–90 days:** historical DEX volume, then holder counts with published methodology, for the 13 stocks; then
   level-2 tokens.
3. **Later:** protocol exposure, other issuers, once repeat usage exists.

## 6. Open items

- An all-time mint/burn and holder scan for the 13 tokens (about 1 robot run). It gives real history numbers and
  measures the Alchemy cost.
- A competitor read of Pegproof, StocksOnChain, RWA.xyz and Allium, which needs those hosts allowed in this
  environment.
- Data rights for redistributing derived onchain metrics. Onchain data is public. Third-party labels would not be.
