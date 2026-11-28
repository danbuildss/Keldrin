# Cross-issuer feasibility: can keldrin be the verified record beyond Coinbase? (2026-11-28)

This is research only, at the founder's request ("research issuers"). Nothing is built. Sources were read on
2026-11-28:
- Chainlink docs: the tokenized-equity feeds page, the 24/7 page, and the Ondo, Robinhood and Coinbase provider
  pages (`.md` versions).
- Pegproof issuer pages: Ondo, xStocks, bStocks and Coinbase.
- RWA.xyz stocks page, and StocksOnChain events.

Facts below are as read from those sources. They are not independently verified onchain unless stated.

## 1. What keldrin's core needs from an issuer

keldrin's moat is three things:
1. official NAV history with round ids;
2. corporate actions reconciled across company filing, issuer and chain;
3. risk and freshness built on the NAV.

To do that for an issuer we need:
- **(a)** an official, verifiable NAV source (today: Chainlink tokenized-equity feeds);
- **(b)** a readable onchain multiplier with change events, so applied corporate actions can be seen;
- **(c)** a published token list, for identity;
- **(d)** chain access (RPC, logs) that we are allowed to use.

## 2. Issuer by issuer

| Issuer (value, RWA.xyz) | (a) Chainlink NAV feed | (b) Multiplier / corporate actions onchain | (c) Official list | Chains | Fit |
|---|---|---|---|---|---|
| **Coinbase** ($55.5M, 423 tokens) | **Yes**: the provider page "Coinbase". Total Return Value = equity price × multiplier read from Coinbase's onchain oracle registry | Yes. B20 multiplier; Pegproof: one key announces and schedules changes; our records already reconcile them with SEC | Yes, Coinbase registry | Base | **Live in keldrin today** |
| **Robinhood** ($148.0M, 200 tokens) | **Yes**: the provider page "Robinhood". Multiplier read from the token's `uiMultiplier()` | **Yes, and the cleanest.** `updateMultiplier` (immediate) and a scheduled `updateMultiplier(value, effectiveAt)` with `newUIMultiplier()`, `effectiveAt()` and an `oraclePause` flag. The event `UIMultiplierUpdated(old, new, effectiveAt)` means **scheduled corporate actions are visible onchain before they apply** | Yes. Robinhood publishes a list (Pegproof copies it; 205 tokens) | Robinhood Chain (id 4663) | **Strong fit**: same model as Coinbase. Chainlink says it "does not provide corporate-action calendar data", which is exactly the gap keldrin fills |
| **Ondo Global Markets** ($891.2M, 437 tokens) | **Yes**: the provider page "Ondo". Total Return = equity price × `sValue` from Ondo's `SyntheticSharesOracle` | Yes. `sValue` small updates (≤1%/day, dividends) are automatic. Large ones (splits) need a pause scheduled ≥24 h ahead plus manual unpause, so splits are visible ahead. Pegproof: multiplier "limited", code behind 2 h timelocks | Yes. Ondo publishes a list (Pegproof recognises it, not yet reconciled) | Ethereum, BNB Chain (Pegproof read 484 tokens each); more via bridges (948 bridge contracts) | **Strong fit, largest prize with a feed.** Multi-chain and bridged copies add work (count natively, as Allium warns) |
| **xStocks** ($716.9M, 1,503 tokens) | **Not in Chainlink's tokenized-equity catalog** (catalog lists Ondo, Robinhood, Coinbase) | Yes. `multiplierUpdater()` (one key) on every token, per Pegproof | Yes. Pegproof copies its list for Ethereum and BNB | Ethereum, BNB, others (Solana per general knowledge, not read here) | **Partial**: corporate actions possible; official NAV needs another source (issuer NAV or another oracle, not researched) |
| **bStocks** ($1.4B, 116 tokens) | **Not in Chainlink's catalog** | Yes. `setUIMultiplier` by one key: any value 1e-9×–1e9×, effective 1 s to 365 days later (Pegproof) | **No published address list** (Pegproof: "what is known without a published address list") | BNB Chain (127 tokens per Pegproof) | **Weak**: no official list (identity can't be verified the keldrin way) and no Chainlink NAV |

## 3. What this means

1. **The keldrin model carries over to two more issuers, Robinhood and Ondo**, with the same pieces we use today:
   official Chainlink total-return feeds, readable multipliers and published lists. Together with Coinbase that is
   about **$1.1B of the ~$3.77B** tokenized-stock value (RWA.xyz figures), against **$55.5M** for Coinbase alone.
2. **The gap we fill is confirmed by Chainlink's own docs.** For Robinhood: "Chainlink does not provide
   corporate-action calendar data". The feed is a total-return value that can freeze during corporate actions.
   Turning that into a history with round ids, a corporate-action calendar and freshness is keldrin's job for every
   issuer.
3. **Robinhood is the best second issuer technically.** Scheduled multiplier changes and pause flags are onchain
   events, so a calendar of upcoming actions can be read from the chain itself. Ondo is the bigger market, but
   needs multi-chain and bridge handling.
4. **xStocks and bStocks are not a fit for full NAV coverage yet.** Neither is in Chainlink's catalog, and bStocks
   has no published list. We could still serve corporate actions (multiplier changes) for xStocks later, marked as
   a lower coverage level.

## 4. What it would take (estimates, to verify)

| Step | Work | New dependencies |
|---|---|---|
| Robinhood Chain support | Identity from Robinhood's list. NAV indexer and verifier pointed at Robinhood feeds. Multiplier events (`UIMultiplierUpdated`) for applied and scheduled actions. Session and freshness logic reused | RPC access to Robinhood Chain (host to allow; check provider terms). Feed addresses from Chainlink's docs. Corporate-action matching to SEC is the same as today |
| Ondo support | Identity from Ondo's list. Feeds per chain. `sValue` history and pause schedule. Native-supply rules for bridged copies | Ethereum and BNB RPC (Alchemy covers both). More chains later |
| Cross-issuer API shape | `issuer` and `chain` on every record. One stock across issuers (like Pegproof's /v1/stock/TSLA). Coverage level per token | None |

Each step reuses the existing pipeline: indexer, independent verifier, session calendar, MCP, x402. It is an
extension, not a rebuild.

## 5. Risks and unknowns

- **Data rights:** the founder reviewed Chainlink terms for Base feeds. The same review is needed per issuer feed
  and chain.
- **RPC access:** whether Robinhood Chain has a public or provider RPC we may use at our volume is unknown; not
  checked yet.
- **Third-party figures:** issuer values come from RWA.xyz and CoinGecko and are not verified by keldrin.
- **No customer evidence yet.** Nobody has asked us for Robinhood or Ondo data yet. Validate demand before building
  (MAXXAGENT and Stocks Maxxing builders are Base-focused).
- **Competitors already do cross-issuer identity and supply** (Pegproof, StocksOnChain, RWA.xyz). The
  differentiation must stay NAV history plus corporate-action reconciliation, not another registry.

## 6. Recommended direction (for founder decision)

**keldrin becomes the verified NAV and corporate-action record for tokenized equities across issuers, starting
with Coinbase (live), then Robinhood, then Ondo.** It does not become another registry, supply tracker or price feed.

Sequence:
1. Prove usage on Base first: integrations and one paying user.
2. Robinhood, as the technical pilot: a small, clean model with onchain scheduled actions.
3. Ondo, as the market: the largest issuer with an official feed.
4. Re-check xStocks and bStocks if they gain official feeds or lists.
