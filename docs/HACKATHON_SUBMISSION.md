# Stocks Maxxing submission pack (Phase 2; drafts for the founder, who submits)

The rules were re-read on 2026-11-28 from https://www.base.org/stocksmaxxing and its Official Rules page. Re-check
both on the day of submitting: the rules say "dates, reward amounts, partner participation, and judging criteria
may change."

## 1. What the rules require (as read)

| Rule | keldrin |
|---|---|
| Deadline: 2026-12-12, 11:59 PM UTC | Aim to submit by 12-10 |
| Public X post with a video demo (e.g. a Loom) explaining how it works, tagging @buildonbase | Founder records and posts |
| The official Submission Form: link to the X post, track(s), other info | Founder submits; draft answers below |
| Built on or meaningfully integrating Base | Yes: Base tokens, Chainlink feeds on Base, DEX pools on Base, x402 in USDC on Base |
| The form must clearly describe what was built during the Quest Period (Nov 5–Dec 12) | Everything: the repo's first commit is 2026-11-27 |
| No misrepresenting a relationship with Base, partners, issuers or public companies | Our footer and /legal say "not affiliated". Logos are used only to identify companies |
| Projects that enable trading for US users are not eligible | keldrin enables no trading (read-only data) |
| One submission per track; one project in several tracks only if the page allows it (it doesn't say) | Pick one track |
| No automated submissions; the founder's own identity throughout | Founder submits manually |
| Ages 18+, not OFAC-sanctioned; winners verify identity and tax | Founder's responsibility |
| Judging criteria: "included on the Quest Page" | **Not published on the page we read**; weighted equally unless stated. Check again before submitting |
| Build-in-public award: $6,000, community vote; share the journey on X tagging @buildonbase | Weekly progress posts help (Phase 3 shiplog) |

## 2. Track: Agentic Stock Finance (founder's choice, 2026-11-28)

The founder picked **Agentic Stock Finance** and thinks keldrin also fits Programmable Stock Markets. The rules
allow one project in several tracks only if the Quest Page allows it, and the page doesn't say so. Even then, a
project can win in only one. **If the Submission Form lets you tick more than one track, tick both. If it allows
one, keep Agentic Stock Finance.** For this track the demo must lead with an agent using keldrin (script below).

Earlier options considered:

- **Programmable Stock Markets** ($23,000, 4 partners): "net-new stock market primitives, e.g. … market
  infrastructure". **Recommended.** keldrin is market infrastructure: the verified data layer other products
  build on.
- **Agentic Stock Finance** ($21,000, 3 partners): "agents that research, earn or trade around tokenized stocks".
  keldrin serves agents (MCP, x402, a skill) but is not itself an agent that researches or trades. It would fit
  if the demo leads with an agent using keldrin.

## 3. Draft form answers (edit freely; every claim checked on 2026-11-28)

**Project:** keldrin. Intelligence for programmable equities.

**One line:** The verified record for tokenized stocks on Base: historical NAV, corporate actions, market context
and onchain DEX prices, each with its proof, through one integration.

**What it does:**
- **NAV history:** Chainlink NAV history for 13 Coinbase tokenized stocks on Base, with the round id behind every
  point.
- **Corporate actions:** dividends, splits and multiplier changes for all 435 tokens, matched to SEC filings and
  onchain events, including announced and late actions.
- **Context and risk:** NAV freshness in NYSE trading time, onchain DEX prices read at one block with verified
  pools, and NAV-based risk (volatility, drawdown).
- **Coverage label** on every token, saying what is verified for it.
- **Verified before served:** an independent verifier re-reads everything through a second provider before it is
  served. "Unknown" is a valid answer.

**How to use it:**
- **API and agents:** a free REST API (no key), a remote MCP server with 10 tools (listed in the official MCP
  Registry), a CLI (`npx keldrin`) that re-checks served values against Base, and an agent guide (/skill.md).
- **Paid answers:** one-call snapshot and report at $0.05 USDC on Base via x402 on Bankr x402 Cloud, 3 free a day.
- **Website:** Explorer, API Playground and a Transparency page.

**What was built during the Quest Period:** all of it, 2026-11-27 to submission. That is 144+ commits in a private
repository, deployed to production with an independent review at each phase.

**Links:**
- Live: https://keldrin.vercel.app
- Explorer: https://keldrin.vercel.app/explorer
- Playground: https://keldrin.vercel.app/playground
- Transparency: https://keldrin.vercel.app/transparency
- Agent guide: https://keldrin.vercel.app/skill.md
- npm: https://www.npmjs.com/package/keldrin
- MCP Registry: io.github.danbuildss/keldrin
- Bankr skills catalog PR: https://github.com/BankrBot/skills/pull/879

**Proof (all real):**
- x402 payment tx `0x5c3665fc952fb619bd869e4641ad391e30e2396281ea7a458596006bd7caab05`. Say it plainly: this was
  our own test payment.
- 30/30 external tests on production.
- `npx keldrin verify-nav NVDAc` → 20/20 served rounds match `getRoundData`.

**Users:** say "none confirmed yet; one builder team (MAXXAGENT) agreed to test", and only if that is still true
on the day. Add their feedback only with their permission.

## 4. Demo video for Agentic Stock Finance (Loom, about 90 s; record during US market hours)

| Time | Screen | Say |
|---|---|---|
| 0–8 s | Home page | "keldrin: intelligence for programmable equities, built for agents. The verified record for tokenized stocks on Base." |
| 8–30 s | Claude (or any MCP agent) with keldrin connected. Ask: "Is NVDAc's NAV fresh right now, how volatile has it been, and is there a dividend coming?" | "The agent calls keldrin's MCP tools (market context, risk, corporate actions) and answers with the Chainlink round id, the volatility from official closes and the SEC-linked dividend. If something is unknown, it says so." |
| 30–45 s | The agent asks for a full snapshot; the 402 appears with the x402 terms | "For everything in one call, agents pay five cents in USDC on Base via x402 on Bankr, and are charged only for a complete answer." |
| 45–60 s | Explorer: NVDAc page with chart, risk, corporate actions, proof links | "Humans see the same record: every point is an official round, every dividend links its filing and transaction." |
| 60–72 s | Terminal: `npx keldrin verify-nav NVDAc` | "Agents shouldn't trust blindly either: one command re-reads our numbers from Base." |
| 72–90 s | Transparency, then the URL and /skill.md | "Any agent can start from one file, keldrin.vercel.app/skill.md. Research once, verify independently, serve many." |

## 5. Before submitting (checklist)

- [ ] Re-read the rules and the judging criteria (C, on the day)
- [ ] Production checks: external tests 30/30, status 8/8 (C)
- [ ] Track chosen (F)
- [ ] Video recorded and posted on X with @buildonbase (F)
- [ ] Form submitted with the X link (F)
- [ ] Record the submission in DECISIONS.md / HACKATHON.md (C, after F confirms)
