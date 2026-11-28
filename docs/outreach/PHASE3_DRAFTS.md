# Phase 3 outreach and build-in-public drafts (2026-11-28)

Approved by the founder on 2026-11-28 ("I approve A and B"). These are **drafts**: the founder edits and sends
every message personally. Nothing here is automated, and no message is sent by Claude.

Rules for every message:
- No claims of users, partners, integrations or revenue. Today there are none confirmed; MAXXAGENT agreed to test.
- Ask one specific question. Don't pitch a token.
- Link to the live product.
- Record every reply verbatim in CUSTOMER_DISCOVERY.md.

**Before sending, check that the earnings feature is live.** It is in a PR under review until the founder merges
it. Until then, leave out the earnings sentences.

---

## 1. People who already asked for something we now have (send first)

### Hector (CD-001: asked for "earnings, dividends and onchain data")
> Hey Hector, you mentioned earnings, dividends and onchain data would be most useful. All three are now live in
> keldrin, free and without a key:
> - earnings releases from SEC filings, with SEC's exact acceptance time
> - dividends and splits matched to the SEC filing and the onchain multiplier change
> - Chainlink NAV history and DEX prices on Base
>
> NVDAc example: https://keldrin.vercel.app/explorer?token=NVDAc
>
> What are you building, and which of these would you plug in first?

### Bankr (CD-002: asked for fields, a diff feed, a late flag and x402)
> Hi Bankr team. Following up on your field list: `/v1/events` now serves ticker, event_type,
> expected_adjustment_date, multiplier_delta, sec_filing_url, quoted_text, status (including late), onchain_tx and
> confidence, and `/v1/changes` is the diff feed.
>
> keldrin's snapshot and report also run on your x402 Cloud at $0.05, and the skill PR is open at
> BankrBot/skills#879.
>
> Could one of your agents test `/v1/events` against GOOGLc's Dec 14 and NVDAc's Dec 23 adjustments and tell us
> what's missing?

### MAXXAGENT (CD-003: agreed to test)
> Hey! Quick update since the test package:
> - NAV-based risk is now an API call: `/v1/assets/{token}/risk` (30/60-day volatility, max drawdown with round ids).
> - Every token has a coverage level.
> - The MCP server now has 10 tools, and is listed in the MCP Registry.
>
> Has the team had a chance to try it? Even a one-line "this worked / this didn't" helps us a lot.

---

## 2. Stocks Maxxing launchpad partners (first contact)

Before sending, add one sentence on what each team actually builds, taken from their own profile. Don't guess.

### Generic first message (adapt per partner)
> Hi [team]! I'm building keldrin for Stocks Maxxing: the verified record for tokenized stocks on Base.
> Corporate actions matched to SEC filings, Chainlink NAV history with round ids, freshness, onchain DEX prices
> and earnings releases. It's free through an API, MCP and CLI, with $0.05 x402 snapshots.
>
> For [what they build]: do your users or your agents need any of this? Which data do you currently collect
> yourselves?
>
> https://keldrin.vercel.app

Partners listed on the Stocks Maxxing page:
- o1 Exchange
- Bankr (see section 1)
- Stonks Exchange
- BaseStonk
- Feel.cash
- Hydropump by Hydrex
- Clanker
- Sento

### Agent and lending angle (for teams building agents, vaults or lending)
> Agents and lending apps need to know, before acting, whether the NAV is fresh, whether a dividend or split is
> coming, and how volatile the stock has been. keldrin answers all three with proof (round ids, SEC links, tx
> hashes), and says "unknown" instead of guessing.
>
> Would a single MCP call that returns that be useful in your product?

---

## 3. Build-in-public posts on X (tag @buildonbase; the $6,000 community award counts these)

Post about one a week. Check every number on /transparency the same day.

**Post 1: what we built and why**
> Building keldrin for #StocksMaxxing: the verified record for tokenized stocks on Base.
>
> Every number has its proof: Chainlink round ids for NAV, SEC filings for dividends, tx hashes onchain.
>
> 435 tokens tracked, 13 with full NAV coverage. "Unknown" is a valid answer.
>
> keldrin.vercel.app @buildonbase

**Post 2: a real finding (only once it's verified that day)**
> Something we noticed while indexing Chainlink NAV on Base: [one verified, sourced observation, e.g. a dividend
> applied N days after its payable date, with the tx link].
>
> That's why keldrin links every corporate action to the SEC filing and the onchain change. @buildonbase

**Post 3: for agents**
> Gave keldrin to agents: 10 MCP tools (NAV with proof, risk from official closes, corporate actions, earnings
> from SEC filings, DEX prices).
>
> Paid one-call snapshots via x402 on @bankrbot, $0.05, charged only on a complete answer.
>
> `claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp` @buildonbase

**Post 4: transparency**
> We publish our own numbers: keldrin.vercel.app/transparency
>
> Tokens tracked, NAV rounds indexed, verified pools, research runs and x402 payments counted onchain. So far the
> payments are our own tests, and we say so. @buildonbase

---

## 4. After each conversation
Add an entry to CUSTOMER_DISCOVERY.md with the date, who, the channel, the verbatim reply, the evidence level
(payment > signed commitment > integration in progress > specific request > praise) and the next action.
