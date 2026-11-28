# Listings (Phase 13): requirements and ready-to-submit text

The founder submits every listing; Claude only prepares. Directory listings are distribution, not evidence of demand
(Breakra lesson). Measure with `node scripts/payers.ts` (onchain) and the Supabase feedback table.

Sources (read 2026-11-28): the MCP Registry API and schema (reachable from this session), base-org/web's README
(raw.githubusercontent.com), and Breakra's own listing history in danbuildss/breakra docs (its real submissions in
Oct–Nov 2026). x402scan, Glama, Tessl, Circle, skills.sh and docs.bankr.bot are blocked by this session's network, so
their current pages were **not** read; rows marked "from Breakra's history" may have changed.

| Where | How to submit | Requirements (verified?) | Status for keldrin |
|---|---|---|---|
| **MCP Registry** | `mcp-publisher login github` (as danbuildss), then `mcp-publisher publish` in the repo root (`server.json`) | Remote-only servers allowed (`remotes`, no package); GitHub login proves the `io.github.danbuildss/` namespace; description ≤ 100 chars, title ≤ 100 (official docs and schema 2025-12-11, **verified**). keldrin is not listed yet (registry API search: 0). | **Ready.** `server.json` 0.7.1, description 93 chars (tested). Publish with the "Publish to MCP Registry" Actions button (GitHub OIDC, no terminal). |
| **x402scan** | Register each resource at x402scan.com/resources/register | From Breakra's history: Bankr-hosted URLs failed with "Missing input schema"; the schema must come from the origin's `openapi.json` (x402scan discovery spec). keldrin serves `/api/snapshot` and `/api/report` on its own origin with `x-payment-info` in `/openapi.json`. **Not re-verified.** | **Ready after the merge.** Register `https://keldrin.vercel.app/api/snapshot` and `/api/report`. |
| **Bankr skills catalog** | Fork github.com/BankrBot/skills, add `keldrin/SKILL.md` (+ catalog entry and README row, as Breakra did), open a PR | From Breakra's history: PR-based; Breakra's PR #771 opened 2026-10-09 and was still under review on 2026-11-20 (changes requested), so expect weeks. The skill file lives in Bankr's repo, so keldrin's repo can stay private. | **Ready:** copy of `public/skill.md`. Founder opens the PR. |
| **Base ecosystem page** | Google form https://forms.gle/hJhc2PqfAsQp86YL8 | PRs no longer accepted (base-org/web README, **verified**). Form fields not read. | **Ready:** use the one-liner below, site URL, logo (keystone SVG). |
| **Circle (agent marketplace)** | Application form | From Breakra's history: the founder applied 2026-11-16; review pending. Eligibility not verified. | Founder decides; text below. |
| **Glama** | Sign in with GitHub, add or claim the server; `glama.json` lists the maintainer | From Breakra's history: Glama installs and checks the server from its **public GitHub repo**. | **Blocked until the open-source split (T044)**, or ask Glama whether a remote-only URL is accepted. |
| **skills.sh / Tessl** | Listed from a public GitHub repo (skills.sh/danbuildss/breakra/breakra; tessl.io/registry/skills/submit) | From Breakra's history: both read the skill from the public repo; Tessl also scores it. | **Blocked until the open-source split (T044).** |
| **awesome-x402** | PR to xpaysh/awesome-x402 (README reachable) | From Breakra's history: Breakra's PR #1766 (2026-10-09) was still open on 2026-10-15. | **Ready:** line below. |

**One-line description (all listings):**
keldrin: the verified record for Coinbase tokenized stocks on Base: corporate actions, Chainlink NAV with round ids, NAV freshness and onchain DEX prices, each with its proof. Free API, MCP and CLI; one-call snapshot/report at $0.05 USDC via x402.

**awesome-x402 line:**
- [keldrin](https://keldrin.vercel.app) - Verified data for tokenized stocks on Base (corporate actions, Chainlink NAV, DEX prices) with provenance; snapshot and report at $0.05 USDC per call via x402. Agent guide: https://keldrin.vercel.app/skill.md

**To verify the blocked rows from this session**, the founder can allow these hosts in the environment's network
settings: www.x402scan.com, glama.ai, tessl.io, skills.sh, developers.circle.com, docs.bankr.bot, github.com.
