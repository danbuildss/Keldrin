# keldrin roadmap (proposed 2026-11-28; becomes binding only when the founder approves it)

**Direction:** keldrin becomes the verified NAV and corporate-action record for tokenized equities across issuers.
Coinbase on Base is live; Robinhood comes next, then Ondo. keldrin is not another registry, supply tracker or price
feed. Evidence: docs/research/ONCHAIN_EQUITY_INTELLIGENCE.md and docs/research/CROSS_ISSUER_FEASIBILITY.md.

**Rules that hold in every phase:**
- Each build step needs its own founder approval.
- Nothing is fabricated: no users, revenue or data.
- The founder does every external action (posts, listings, outreach, payments).
- Independent review and tests come before every merge that changes behaviour.

Owner: **F** = founder, **C** = Claude.

---

## Phase 1. Launch ready (target: by 2026-12-05)

Most of the product is live. What remains:

| # | Item | Owner | Status | Why it matters |
|---|---|---|---|---|
| 1.1 | Privacy note and terms of use page (the feedback form collects emails; the API serves data with a not-advice disclaimer) | C drafts, F approves | Open | Required before collecting emails publicly and before a startup launch |
| 1.2 | Risk endpoint `/v1/assets/{c}/risk` (30-day volatility, max drawdown from official closes), the same maths as the Explorer | C | Open (T034) | Today risk exists only on the website; agents need it through the API and MCP |
| 1.3 | Coverage level per token in the API and Explorer (full / market / identity) | C | Open | Makes "435 tracked, 13 full" explicit everywhere (POSITIONING §15) |
| 1.4 | x402 payment count on /transparency: the robot counts payments with Alchemy and stores them | C, F approves the new table | Open (T054); card hidden until done | Honest proof of usage on the transparency page |
| 1.5 | Separate verifier database login (verifier results not writable by the indexer) | F creates the login, C wires it | Open (T040) | Independence of verification, a security review finding |
| 1.6 | Enable Vercel Web Analytics; close the old PR #22 | F | Open (T050) | Measure real visits |
| 1.7 | Clean up stale docs (LAUNCH_REPORT checklist, TASKS statuses, STATUS.md) | C | Open | Docs must match reality before open-sourcing |
| 1.8 | Independent review of everything merged since the last review (Explorer speed and logos, positioning copy) plus the external test suite re-run on production | C | Open | Same gate as every phase |
| 1.9 | Listings: MCP Registry (done), others from docs/LISTINGS.md | F submits | MCP done; rest open | Discovery by agents and developers |
| 1.10 | Bankr skills catalog PR #879 | Bankr reviews | Waiting | Distribution to Bankr agents |

**Done already:**
- API, MCP (8 tools), CLI 0.7.1 and x402 ($0.05, real paid transaction).
- Website: Explorer, Playground and Transparency.
- Edge rate limit, status checks 8/8, external tests 30/30.
- MCP Registry listing live; positioning locked.

## Phase 2. Hackathon ready (Stocks Maxxing deadline: 2026-12-12 23:59 UTC; aim to submit by 12-10)

| # | Item | Owner | Status |
|---|---|---|---|
| 2.1 | Re-read the official rules and form (they can change) | C | Before recording |
| 2.2 | Record the demo video (script: docs/LAUNCH_KIT.md; record while the US market is open) | F | Open |
| 2.3 | Evidence pack, all real: live URLs, paid tx 0x5c3665…ab05, external test results, verify-nav output, MCP Registry listing, GitHub history | C | Open |
| 2.4 | X post with the video, tagging @buildonbase (thread in docs/LAUNCH_KIT.md) | F posts | Open |
| 2.5 | Submit the official form | F | Open |
| 2.6 | MAXXAGENT test result, if they have run it (only real feedback, quoted with permission) | F asks | Waiting |

**Claim rules for the hackathon:**
- Say "no confirmed users yet" until one exists.
- The one paid call was our own test.

## Phase 3. Prove usage (first 30 days after launch, about December–January)

The goal that decides everything else is **5 developer integrations and 1 paying user.**

| # | Item | Owner |
|---|---|---|
| 3.1 | Builder conversations: Stocks Maxxing teams, lending protocols, agent builders (drafts by C, sent by F) | F, C drafts |
| 3.2 | Weekly shiplog and honest metrics (visits, API calls, MCP calls, paid calls, kept separate from tests) | C drafts, F posts |
| 3.3 | Fix what integrators report first; write each fix up in BACKEND_PROOF | C |
| 3.4 | Interview the lending, agent and portfolio users we target about what they would pay for | F |
| 3.5 | Decide pricing tiers from evidence (keys and subscriptions only if users ask) | F decides |

## Phase 4. Open-source release (after Phase 3 shows real usage; founder decision, T044)

| # | Item | Owner |
|---|---|---|
| 4.1 | Choose the licence: Apache-2.0 or MIT for code; data stays under its source terms (Chainlink, SEC, issuers) | F decides, C drafts options |
| 4.2 | A new public repository with code, tests and developer docs. This private repo (Notes, decisions, research, outreach) stays private | C prepares, F approves |
| 4.3 | Secret scan of all history; start the public repo with fresh history | C |
| 4.4 | Public files: README, CONTRIBUTING, SECURITY (private disclosure), CODE_OF_CONDUCT, issue templates | C |
| 4.5 | Public CI, npm provenance (`--provenance` needs a public repo), reproducible bundle check | C |
| 4.6 | Decide what stays closed: the hosted service, keys and infrastructure config, unpublished research | F |
| 4.7 | Independent review of the public repo before it goes public | C (separate context) |

## Phase 5. Startup foundation (in parallel with Phases 3–4)

| # | Item | Owner |
|---|---|---|
| 5.1 | Brand clearance for "keldrin" (pending since 2026-11-26), then a custom domain | F |
| 5.2 | Company entity, bank account and payout wallet ownership | F |
| 5.3 | Data rights per source: Chainlink feeds per issuer, Coinbase terms, SEC user agent (D2) | F, C researches |
| 5.4 | Reliability: status history page, uptime alerts, an incident note template | C (T049) |
| 5.5 | Cost model: Vercel, Supabase, Alchemy and GitHub Actions, per 1,000 users | C |
| 5.6 | YC or accelerator readiness: the pitch from POSITIONING.md, plus usage evidence from Phase 3 | F |

## Phase 6. Deepen the moat on Base (30–90 days after launch)

What only keldrin serves, made the best available:

| # | Item | Status |
|---|---|---|
| 6.1 | Corporate actions for all 435 Coinbase tokens: calendar, SEC links, late detection | Partly live (13 confirmed, 54 calendar) |
| 6.2 | Earnings events from SEC 8-K item 2.02, announced dates only (T020–T022) | Proposed |
| 6.3 | Derived ex-dividend date, labelled with its rule (T023) | Proposed |
| 6.4 | NAV history for every new Chainlink feed, automatically | Partly (13 feeds) |
| 6.5 | Cross-check our onchain reads against StocksOnChain and Pegproof (free sources), as independent verification | Proposed |
| 6.6 | Webhooks or alerts for corporate actions and stale NAV, only if integrators ask | Proposed (T016) |

## Phase 7. Cross-issuer (after Base usage exists)

| # | Item | Why |
|---|---|---|
| 7.1 | **Robinhood pilot** (Robinhood Chain): identity from its list, Chainlink total-return feeds, multiplier events (`UIMultiplierUpdated`, scheduled `effectiveAt`), SEC matching | Cleanest model: upcoming actions are onchain; Chainlink has no corporate-action calendar |
| 7.2 | **Ondo** (Ethereum, BNB, bridged copies): feeds, `sValue` history, pause schedule, native-supply rules | Largest issuer with an official feed |
| 7.3 | Cross-issuer API: `issuer` and `chain` on every record, "one stock across issuers", coverage level | One integration for all issuers |
| 7.4 | xStocks: corporate actions only, at a lower coverage level, until an official NAV source exists | No Chainlink feed |
| 7.5 | bStocks: re-check if they publish a token list or an official feed | No list today |

## Phase 8. Year 2 (only after earlier evidence)

Enterprise access (higher limits, SLAs, data exports), standardised historical datasets, more chains as issuers
move, and possibly additional asset classes (tokenized ETFs).

---

## Still excluded unless the founder explicitly approves

- A token, treasury, token-gated access or trading.
- Individual wallet tracking or portfolio P&L.
- Investment advice.
- Paid providers beyond today's stack.
- Automated outreach or posting.
