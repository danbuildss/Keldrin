# BankrBot/skills PR (prepared; the founder opens it)

Files to add to a fork of github.com/BankrBot/skills, in a folder named `keldrin/` (rules read from their README on
2026-11-28: SKILL.md with name + description frontmatter, catalog.json whose slug equals the folder, optional logo):

- `keldrin/SKILL.md`: identical copy of https://keldrin.vercel.app/skill.md (a test keeps them in sync)
- `keldrin/catalog.json`
- `keldrin/logo.svg`

README row (add to their table):

| [keldrin](https://keldrin.vercel.app) | [keldrin](keldrin/) | Verified record for Coinbase tokenized stocks on Base: corporate actions with SEC and onchain evidence, Chainlink NAV history with round ids, NAV freshness and onchain DEX prices. Free API, MCP and CLI; one-call snapshot and report at $0.05 USDC via x402. |

PR title: `Add keldrin skill (verified tokenized-stock data on Base)`

PR description:

> keldrin is the verified record for Coinbase tokenized stocks on Base: corporate actions (dividends, splits, multipliers)
> matched to SEC filings and onchain events, official Chainlink NAV history with the round id behind every point,
> market session and NAV freshness, and DEX prices read onchain at one block. The free REST API, remote MCP and CLI need
> no key; the one-call snapshot and report are $0.05 USDC on Base via x402 (hosted on Bankr x402 Cloud), charged only on
> a complete answer. The skill tells agents when to use keldrin, how to read every field, and which payment terms to
> check before signing. Live: https://keldrin.vercel.app · guide: https://keldrin.vercel.app/skill.md

Expect a slow review (Breakra's PR #771 has been open since 2026-10-09).
