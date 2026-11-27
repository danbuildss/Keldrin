# gstack review of Keldrin (2026-11-27)

Source: garrytan/gstack @ 306ff23b9d2bd7951b7f6c408c7376f3237520c9 (MIT, Garry Tan). It was **read, not installed.** `./setup` writes into `~/.claude`, edits CLAUDE.md, adds auto-update hooks and runs telemetry at the end of each skill, so installing it needs founder approval.

Applied by hand:
- `office-hours`: startup diagnostic, premise challenge, alternatives
- `plan-eng-review`: scope challenge, engineering preferences
- `plan-devex-review`: DX principles, time-to-hello-world (TTHW)

gstack's own README reports no measurable coding gain in its November 2026 test (58/100 fixed with it vs 61/99 without). Its value is review discipline, not code quality.

## 1. Office hours: reality check

**Question:** "Has it produced one real outcome yet: one paying user, or one person who used it this week without being asked?"
**Answer:** No. Zero users, and zero recorded builder conversations. gstack would stop strategy, pricing and x402 discussion here, and route to status quo + specificity + an assignment.

| Forcing question | Keldrin today | Position |
|---|---|---|
| Q2 Status quo | Builders read `multiplier()` live from the chain or the Coinbase registry. BStocks does exactly this and shows no event data. For display and trading apps, that already works. | The pain is **not** universal. It is real only where a product references the underlying equity rather than the token. Examples: options strikes on a split, perps marking against the equity, index vaults rebalancing, lenders whose risk model uses equity prices. Unverified. |
| Q3 Desperate specificity | No named person. | Must name 3 people at real Base stock projects: Stocks Maxxing partners (o1 Exchange, Stonks Exchange, BaseStonk, Bankr, Hydrex, Sento, Clanker, Feel.cash) and BStocks itself, which lacks events and could be a customer. |
| Q4 Narrowest wedge | The plan has 12+ tables, 19 skills, x402, MCP, UI. | Smallest payable thing: **one keyless JSON feed of every corporate action for Coinbase tokenized stocks on Base.** Exact WAD before and after, announced vs applied, tx/block proof, plus upcoming SEC-declared dividends and splits. |
| Q5 Observation | Nobody has used it. | Unknown. |
| Q6 Future-fit | BaseHub saw 10 listed tokens on 2026-09-25; the registry listed 435 on 2026-11-27. More tokens, more actions, more agents. | Becomes more essential, **unless Coinbase ships its own corporate-action list endpoint**. That would erase the raw-feed wedge. The defensible part is SEC reconciliation and the leading calendar, which an issuer has less incentive to provide. |

## 2. Premises (founder: agree or disagree)

1. Builders whose products reference the underlying equity (options, perps, index vaults, some lenders) need corporate-action data that reading `multiplier()` live does not give them: timing, upcoming actions and history.
2. The first sellable product is the corporate-action feed. The SEC reconciliation and leading calendar are the paid layer.
3. Free keyless reads win adoption (BStocks sets that bar); payment goes only where work is real (verification, calendar).
4. Until three named builders confirm premise 1, x402, MCP and UI work stays behind the backend and feed.

## 3. Alternatives

| | A. Minimal: corporate-action feed | B. Ideal: full intelligence platform (current plan) | C. Lateral: agent-first tool |
|---|---|---|---|
| Summary | Index Announcement/multiplier logs for all 435 tokens; exact values; one REST endpoint + llms.txt | SEC ↔ token reconciliation, calendar, revisions, reviews, x402, UI | Same data exposed first as an MCP tool and llms.txt for agents |
| Effort | S | L | S (on top of A) |
| Risk | Low; chain facts are re-checkable deterministically | Medium/High on time (15 days to deadline) | Low; unclear buyers |
| Reuses | Phase 0 scripts, Aeon evidence-receipt pattern | All of the above + Orric gate | A |

**Recommendation:** A first, then B's SEC layer, then C as a thin wrapper.
A ships a working, verifiable product by ~Dec 1 across all tokens, rather than one deeply reviewed event. Its facts come straight from the chain, so independent verification is a deterministic re-read, not an opinion. The GOOGLc ↔ SEC reconciliation stays as the flagship deep proof and becomes the paid differentiator.

## 4. Engineering review lessons

- **Boring by default:** Node, Postgres and viem are proven. PGlite is the one small innovation token, and it is acceptable.
- **Every behaviour gets a test that would catch a regression.** In particular: bracket pairing, duplicate announcement ids (`2097` vs UUID), the instant vs scheduled path, reorg via block hash, WAD exactness.
- **Data model follows queries:** separate tables for `chain_logs`, `issuer_actions`, `events`. This is already in DATABASE.md v0.3.
- **Blast radius and reversibility:** kill switch, feature flags for the paid route; read-only by default.

## 5. Developer-experience lessons (apply as Phase 3 gate)

- **TTHW under 2 minutes:** one `curl` with no key and no signup returns NVDAc's corporate actions with tx hashes. This is the "magical moment".
- **Agents are users too:** `llms.txt`, an OpenAPI 3.1 spec, structured errors that tell an agent the next safe step, and explicit `unknown`/`stale` states.
- **Show code in context:** a TypeScript snippet that handles a pending split, not only "hello world".
- **Upgrade fear:** a versioned schema, changelog and deprecation policy before the first external integrator.

## 6. What to adopt from gstack into Keldrin's workflow (proposed)

- A reality-check question at every phase gate: "did one real person use it?"
- Premises as agree/disagree statements in plans (fits DECISIONS.md).
- Every plan carries minimal / ideal / lateral alternatives.
- The DX rubric and TTHW target in TESTING.md for Phase 3.
- Optionally, after founder approval, install gstack locally for `/review`, `/qa` and security review of Keldrin PRs. Do not let it rewrite CLAUDE.md.

**Do not adopt:** the installer's CLAUDE.md edits, auto-update or telemetry inside the Keldrin repo. "Boil the ocean" applies only *within* the wedge: complete tests for the feed, not breadth of features.

## 7. The assignment (one action)

Founder: this week, message three named builders at Base stock projects with one question. "When a stock you support splits or pays a dividend, what do you do today, and what breaks?" Record their answers verbatim in a new `docs/BUILDER_INTERVIEWS.md`. Claude can draft each message for your approval; you send them.
