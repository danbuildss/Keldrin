# Listings (Phase 13): text ready for the founder to submit

The founder submits every listing; Claude only prepares the text. Directory listings are distribution, not evidence
of demand (Breakra lesson). Measure with `node scripts/payers.ts` (onchain) and Supabase feedback.

| Where | What to submit | Notes |
|---|---|---|
| MCP Registry | `server.json` (remote `https://keldrin.vercel.app/mcp`) | Install `mcp-publisher`, `mcp-publisher login github` (as danbuildss), then `mcp-publisher publish` from the repo root. |
| Glama | Add server by URL `https://keldrin.vercel.app/mcp`; `glama.json` lists the maintainer | Glama may ask for a public repo; if so, wait for the open-source split (T044). |
| x402scan | Resource URLs `https://keldrin.vercel.app/api/snapshot` and `https://keldrin.vercel.app/api/report` | They read the payment terms from our own origin (forwarded to Bankr), as Breakra does. |
| Bankr skills | Skill URL `https://keldrin.vercel.app/skill.md` | See integrations/bankr/README.md for the one-message test. |
| awesome-x402 | PR line below | Needs a GitHub fork by the founder. |

**One-line description (all listings):**
keldrin: the verified record for Coinbase tokenized stocks on Base: corporate actions, Chainlink NAV with round ids, NAV freshness and onchain DEX prices, each with its proof. Free API, MCP and CLI; one-call snapshot/report at $0.05 USDC via x402.

**awesome-x402 line:**
- [keldrin](https://keldrin.vercel.app) - Verified data for tokenized stocks on Base (corporate actions, Chainlink NAV, DEX prices) with provenance; snapshot and report at $0.05 USDC per call via x402. Agent guide: https://keldrin.vercel.app/skill.md
