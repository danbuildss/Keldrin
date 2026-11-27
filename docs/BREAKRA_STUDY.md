# What Keldrin can learn from Breakra (study, 2026-11-27)

Source: `danbuildss/breakra` at `1ebe6a5` (public, MIT), read only. Nothing in Breakra was changed. Everything below is analysis; items marked **PROPOSED** are not approved scope.

## 1. How Breakra works, end to end

| Layer | What it is | Where |
|---|---|---|
| Engine | Deterministic OpenAPI diff + rule classification, no LLM. Same input → same `analysis_id` (sha256) | `src/core/*` |
| Free local | npm package `breakra` (zero dependencies): CLI `breakra check` and a stdio MCP server, one tool `check_openapi_change` (readOnly/idempotent annotations) | `src/cli.ts`, `src/mcp.ts` (~150 lines, no SDK) |
| Hosted paid API | One handler on **Bankr x402 Cloud**: $0.02 USDC on Base, x402 v2, scheme `exact` | `src/index.ts`, built by `scripts/build.ts` |
| Website / discovery | Static site on Vercel (breakra.dev) with `/skill.md`, `/openapi.json`, `/llms.txt`, `/.well-known/x402`; `/api/analyze` is a pure **rewrite** to the Bankr URL | `vercel.json`, `site/` |
| Agent guide | `SKILL.md`: when to call, safety rules for agents, the exact payment terms to check before signing, how to read results | `SKILL.md` |
| Listings | MCP Registry (`server.json`), Glama, Tessl, skills.sh, Bankr skills catalog PR, x402scan, awesome-x402, Circle Agent Marketplace | `docs/project/EXPERIMENT.md` |
| CI and ops | Typecheck, lint, tests, build, smoke, oracle cross-check, docs-drift tests; release workflow with SHA256SUMS; status workflow every 15 min (unpaid 402 probe checks the terms) writing to a `status` branch; CodeQL | `.github/workflows/*` |
| Metrics | On-chain payer counting from USDC Transfer logs; owner wallets excluded; "a wallet is never a person" | `scripts/lib/metrics.ts` |

### The x402 mechanics Breakra proved (T-001, Phase 3)
- Bankr returns the 402 with terms, verifies the signature, runs the handler, and **settles only on 2xx**. So: 2xx only for a complete result; every error is 4xx/5xx JSON and free (D-023).
- Bankr hosts **one self-contained file with no imports**, ending in a literal `export default async function handler(req: Request)`; minified, ~99 KB limit (deploy API returned 413 at 137 KB). No npm installs on Bankr (D-022, D-025).
- Deploy only with `bankr x402 deploy` from a clean, tagged build; no built-in rollback (redeploy the old commit); pause/resume available.
- Buyers pay Bankr's router `0x8AEE…01a0`, which forwards to the payout wallet in the same transaction. No receipt header.
- Bankr's 402 has no `extensions.bazaar`, and x402scan reads schemas only from the endpoint's own origin. That's why breakra.dev forwards `/api/analyze` to Bankr (D-038).
- Gateway errors and timeouts are **unknown outcomes**, not free errors: never re-sign, wait 60 s and check the wallet first.

### What the market said (Breakra's own evidence)
- 14-day experiment (D-033): by day 7, **0 external paid calls** (all 6 payers were owner wallets) despite X, GitHub and directory listings.
- Feedback: "make it an installable agent skill" (install friction); a would-be integrator (CashBoard) hit **payment/integration confusion**.
- Works end to end with Bankr's agent: install from GitHub in one message, two paid checks, matching `analysis_id`s.

## 2. Lessons for Keldrin

1. **Free first; pay-per-call is not demand.** Breakra had a working x402 API and many listings, and still no outside payers. Keldrin should get integrators *using* the free API (Bankr, Hector) before putting anything behind x402. This supports the current plan (free calendar, paid detail later).
2. **Bankr x402 Cloud does not fit Keldrin's paid route as-is.** Breakra's handler is pure computation. Keldrin's answers come from a database. On Bankr we would either (a) put database credentials on a third-party host (no), or (b) have the Bankr handler call keldrin.vercel.app, which leaves the data free at the origin unless the origin requires a secret Bankr can hold (unverified: does Bankr x402 Cloud support secrets?). The alternative is **x402 directly on Vercel** with a facilitator. This is a Phase 5 design decision; it needs evidence, not assumption.
3. **Error semantics carry over regardless of host:** 200 only for a complete answer. `status: unknown` *is* a complete answer, but a database outage or timeout must never be a 200.
4. **One agent guide.** Breakra's `SKILL.md` is the thing agents actually read: when to call, rules for agents, how to interpret every field. Keldrin has `/llms.txt` and the quickstart but no `SKILL.md`. **PROPOSED:** `SKILL.md` served at `/skill.md`, with rules such as "a `predicted` date is not a confirmed adjustment" and "`unknown` is never safe".
5. **MCP is cheap.** Breakra's MCP server is ~150 lines of plain JSON-RPC, no SDK. Keldrin's data is remote, so the shape differs. **PROPOSED (Phase 5, T015):** a remote streamable-HTTP MCP endpoint on the same Vercel function (`/mcp`, read-only tools `get_events`, `get_calendar`, `get_changes`, `get_asset`), plus listing in the MCP Registry. Remote is lower friction than an npm install.
6. **Reproducibility is the trust story.** Anyone can reproduce a Breakra `analysis_id` for free. Keldrin's equivalent is the independent verifier: **PROPOSED:** let anyone re-verify a record against Base and the SEC themselves (a documented `verify` command, or a published package), so "verified" can be checked rather than taken on trust.
7. **Discovery files belong on the origin:** `/openapi.json` and `/llms.txt` (Keldrin has both), plus `/skill.md` and, once x402 exists, `/.well-known/x402`.
8. **Status and freshness as a public, checkable signal.** Breakra's status workflow every 15 minutes is the model for Keldrin's Phase 4 freshness check: the scheduled run records its outcome, and `/health` exposes the data age.
9. **Metrics discipline:** count external wallets or callers separately from the founder's own; never equate a wallet with a person; define a "continue" bar in advance. **PROPOSED:** add a Keldrin success bar to CUSTOMER_DISCOVERY.md (for example, at least 2 outside builders calling the API on 2+ days each by a set date).
10. **Release discipline:** pinned versions, a tagged build with checksums, docs-drift tests that fail when docs and code disagree, and live verification scripts with spend caps. Keldrin already rebuilds and diffs its Vercel bundle in CI; docs-drift tests are worth adding.
11. **Token precedent (D-042, $BRKR):** an optional community token, **separate from the product**, never required for use, not on product surfaces, no revenue rights or return claims; the founder handles all keys and deployment. That is a fourth option for `docs/TOKEN_RESEARCH.md`, but Hector's "public calls" and "treasury of stocks" parts still conflict with Keldrin's rules, and a token tied to a securities product carries more regulatory risk than one tied to an API-diff tool.

## 3. One API, several doors: how Keldrin would mirror Breakra

| Door | Breakra | Keldrin today | Keldrin proposed |
|---|---|---|---|
| REST, free | Local CLI only | ✅ keldrin.vercel.app `/v1/*` | Keep the calendar and events free |
| REST, paid | Bankr x402, $0.02 | ❌ | Phase 5: x402 on one detail route; host decision per lesson 2 |
| MCP | Local stdio (npm) | ❌ | Remote `/mcp` on the same function, read-only |
| Agent guide | `SKILL.md` | `/llms.txt` | `/skill.md` |
| Machine contract | `/openapi.json` | ✅ `/openapi.json` | Keep in sync with a docs-drift test |
| Status | `/status` (15-min checks) | `/health` | Freshness from scheduled runs (Phase 4) |
| Listings | MCP Registry, Glama, x402scan, Bankr skills… | none | After MCP and SKILL.md exist; the founder submits each one |

## 4. Open questions (need evidence)
1. Does Bankr x402 Cloud support per-service secrets or environment variables? (Decides lesson 2.)
2. Which facilitator would Keldrin use for x402 on Vercel, and what does it cost?
3. Would Bankr's agent install a Keldrin skill from GitHub the way it installed Breakra's?
