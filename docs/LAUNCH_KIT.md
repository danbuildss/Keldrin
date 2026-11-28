# keldrin launch kit (drafts; the founder edits and posts)

Every number below was read from production on 2026-11-28 (`/v1/stats`, `/v1/overview`). Re-check them on
https://keldrin.vercel.app/transparency before posting. They change as the robot runs.

Do not claim users, partners, integrations or revenue: none are confirmed yet. The one x402 payment so far is
our own test.

## Launch thread (X)

**1/**
Introducing keldrin: the verified record for tokenized stocks on Base.

Corporate actions, Chainlink NAV, freshness and onchain DEX prices for Coinbase's tokenized stocks, every value with its proof.

keldrin.vercel.app

**2/**
The problem: the facts around a tokenized stock are scattered. Dividends live in SEC filings. Multipliers live onchain. NAV lives in Chainlink rounds. Prices are spread across DEX pools.

Every app and agent rebuilds this plumbing and guesses at the gaps.

**3/**
keldrin researches it once and verifies it independently:

- 435 tokens tracked
- 13 Chainlink NAV feeds, all independently confirmed
- 36,000+ official NAV rounds, each with its round id
- 416 verified DEX pools

When we don't know, the answer is "unknown" plus a reason. Never a guess.

**4/**
Proof behind every number:
- the NAV round id re-reads onchain with getRoundData
- the DEX price is pinned to one block
- corporate actions link to the SEC filing and the onchain tx

Check it yourself: `npx keldrin verify-nav NVDAc`

**5/**
Built for apps and agents:
- free REST API, no key
- remote MCP (9 tools) for Claude and other agents
- CLI: `npx keldrin`
- agent guide: keldrin.vercel.app/skill.md

**6/**
Need everything in one call? The snapshot (all verified stocks) and the report (one stock) cost $0.05 USDC on Base via x402, on @bankrbot x402 Cloud.

3 free a day. You're charged only for a complete answer.

**7/**
See it live:
- Explorer: every stock, NAV chart, risk numbers and proof links
- Playground: run the API in your browser
- Transparency: our own numbers, read live

Facts with provenance, not investment advice. Built by SOMEHOW.

## Short video script (60–75 s, screen recording + voice)

| Time | Screen | Voice |
|---|---|---|
| 0–5 s | Home page, hero | "This is keldrin, the verified record for tokenized stocks on Base." |
| 5–15 s | Explorer list (/explorer) | "Every Coinbase stock with a Chainlink NAV: the NAV, the onchain DEX price, the gap between them and how fresh it is." |
| 15–28 s | Click NVDAc: chart, then the proof links | "Every point on this chart is an official Chainlink round. Here's the round id. Here's the pool and block the price came from. Corporate actions link to the SEC filing and the onchain transaction." |
| 28–38 s | Terminal: `npx keldrin verify-nav NVDAc` → match | "Don't trust us. Verify. One command re-reads our numbers straight from Base." |
| 38–50 s | Playground: pick market-context, Run, show JSON, copy code | "Developers get a free API with no key. Pick an endpoint, run it, copy the code." |
| 50–60 s | Claude with the MCP: ask "what's NVDAc's NAV and is it fresh?" | "Agents connect over MCP, or pay five cents in USDC via x402 for a full snapshot in one call." |
| 60–70 s | Transparency page | "And we show our own numbers: what we've verified, what's live and what's unknown." |
| 70–75 s | keldrin.vercel.app + "built by SOMEHOW" | "keldrin. Proof behind every stock on Base." |

Recording tips: record during US market hours so the session reads "open". Hide your bookmarks bar. Use the
Explorer stock page for NVDAc, which has the longest history.

## Stocks Maxxing form (short answer)

keldrin is the verified record for Coinbase tokenized stocks on Base. It covers corporate actions matched to SEC
filings and onchain events, Chainlink NAV history with round ids, freshness, and onchain DEX prices. It serves a free
API, MCP and CLI, plus $0.05 x402 snapshots on Bankr. Every value carries its proof, and "unknown" is a valid answer.
