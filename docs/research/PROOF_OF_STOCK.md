# Competitive review: Proof of Stock (2026-11-27)

Source: public repo `proofofstock/proof-of-stock` @ `fef37fc` (MIT), read only, nothing changed. Their README says the code is developed privately and exported at each release, so **absence in the public export is evidence, not proof**. proofofstock.xyz itself was **not reachable** from this environment (not on the network allowlist), so no live endpoint was tested.

## What they are
"Is this stock token the real one?" An address or ticker is checked against the issuer's own registry (Coinbase on Base, Robinhood on Robinhood Chain); look-alikes are flagged. For listed tokens: the issuer's reference price, its age, and the premium of the deepest onchain pool over it.

## Verified from code and docs
| Capability | Evidence |
|---|---|
| Authenticity vs issuer registries (Base + Robinhood Chain), impostor list, /denylist.json, /tokenlist.json | README, `scripts/stocks/impostor-*.mjs`, docs/reference |
| Reference price = **Coinbase API `nav_price`** (latest value), labelled `issuer_api_not_reproducible` | `evm/core/stocks/peg.mjs`, `registries.mjs`, `scripts/stocks/stock-peg.mjs` |
| DEX price read **onchain** at a pinned block via Multicall3 (Uniswap v3 forks slot0, v2 reserves, v4 StateView price), with replayable calldata as evidence; DexScreener/GeckoTerminal as a cross-check | `scripts/stocks/onchain-pools.mjs`, `peg.mjs` |
| NAV/DEX premium, recorded every 15 min, **forward-only since ~2026-11-08** ("the series only grows forward") | `stock-peg.mjs`, CHANGELOG |
| Market session (pre/regular/post/closed/holiday, early closes; past the table → `unknown`) | `evm/core/stocks/market-session.mjs` |
| Data freshness per component; status page | MCP `data_freshness` |
| Daily cryptographic anchoring of their records | MCP `verify_anchor`, `scripts/stocks/anchor*.mjs` |
| MCP (11 tools), Telegram bot, Node guard + AgentKit action, Bankr skill (in review) | README |
| x402: free 60 units/min; pass 0.01 USDC for 10 min at 600 units/min | `docs/how-to/pay-per-call.md` |

## The eight questions (public export)
| # | Capability | Found? |
|---|---|---|
| 1 | Historical Chainlink rounds with feed + round ids | **No.** No `getRoundData`/`latestRoundData` in the code; the reference is Coinbase's API value |
| 2 | Long-term NAV backfill | **No.** Forward-only premium series from ~Nov 8, 15-minute sampling |
| 3 | Dividend / split history | **No** (no corporate-action code or docs) |
| 4 | Historical B20 multiplier changes | **No.** Only the current multiplier is recorded per row and listed |
| 5 | Realized volatility / max drawdown | **No** (no matches) |
| 6 | Earnings / corporate-event intelligence | **No** (no SEC/EDGAR/earnings code) |
| 7 | B20 transfer-policy monitoring | **No** (no policy/pause code) |
| 8 | Autonomous corporate research | **No** |

## Positioning
- **Proof of Stock:** "Is this the real token, and is its price sane *right now*?" (authenticity, live premium, sessions)
- **Keldrin:** "What has happened to this token over time, and what's coming?" (Chainlink round history with ids, verified corporate actions and multiplier history, risk, research)
- Overlap is limited to **market session** and **NAV/DEX premium**. Keldrin should not rebuild a DEX price engine: theirs is onchain, evidenced and MIT-licensed.

## Collaboration options (founder decides; Claude only drafts)
1. Keldrin links to, or calls, Proof of Stock for authenticity and the live premium; Proof of Stock could link to Keldrin for history and corporate actions.
2. Reuse their MIT onchain pool-reading approach with attribution if Keldrin ever needs DEX prices itself.
3. Calling their API from Keldrin needs their terms and rate limits checked first.
