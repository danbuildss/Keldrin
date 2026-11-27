# Customer discovery

The central record of builder conversations and evidence of demand. Rules:
- Quotes are verbatim as relayed by the founder.
- Nobody is a customer, partner or integration until there is an **explicit commitment**.
- Interest is not demand: rank evidence as payment > signed commitment > integration in progress > specific request > praise.

Detail lives in `docs/DEMAND_MATRIX.md` (needs → capabilities), `docs/INTEGRATION_PIPELINE.md` (who and status) and `docs/TOKEN_RESEARCH.md` (exploratory, separate from approved scope).

## Summary (as of 2026-11-27)

| ID | Who | Channel | Strongest evidence | Status | Next action (owner) |
|---|---|---|---|---|---|
| CD-001 | Hector, admin of a Stocks Maxxing Telegram group | Telegram, then DM | Specific request: earnings, dividends, onchain data | Conversation open; **not** a customer or partner | Founder continues in DM; ask what he would integrate and for what |
| CD-003 | MAXXAGENT builder (Stocks Maxxing, Agentic Stock Finance) | Public post relayed by founder | **Built it themselves**: NAV history from raw rounds, risk, market hours, liquidity checks, B20 watcher; open-source code (MIT) | Potential design partner; **no commitment** | Founder replies; ask whether a NAV-history/corporate-actions API would replace their own code |
| CD-002 | Bankr (agent / team) | Reply to founder's brief | Specific requests (fields, statuses, diff feed, late flag) plus an offer to host x402 | Interested; no commitment | Founder shares the live API; ask them to test `/v1/events` against GOOGLc (Dec 14) and NVDAc (Dec 23) |

## CD-001 — Hector (2026-11-27)
- **Context:** the founder asked Stocks Maxxing builders which financial data or infrastructure they use, struggle to access or build themselves, and described Keldrin as an autonomous stock-intelligence agent and API.
- **Verbatim:**
  > "Love this. Earnings, dividends and onchain data would be the most useful.
  > Honestly it could be a great token too, holders get agent access, it posts public calls around earnings, and fees build a treasury of the stocks it likes. If you're open to launching it, happy to chat in DM!"
- **Requested data points:** earnings, dividends, onchain data.
- **What he builds / needs it for:** unknown. Ask.
- **Existing solutions he uses:** unknown. Ask.
- **Pain point stated:** none specific yet.
- **Proposal:** a token model (gated access, public earnings calls, fee-funded stock treasury). This goes to `docs/TOKEN_RESEARCH.md` only; nothing is committed.
- **Evidence level:** specific request plus praise. **Classification:** prospect; not a customer, partner or integration.
- **Follow-up questions for the DM (founder):**
  1. What are you building, and where would Keldrin data plug in?
  2. For earnings: dates, results or both? How far ahead, and how fast after the release?
  3. Which tokens or companies matter most to you?
  4. What do you use today, and what does it cost or what breaks?
  5. Would you call an API, an MCP tool or a webhook?

## CD-002 — Bankr (2026-11-27)
Full record: `docs/BUILDER_INTERVIEWS.md` §1.
- **Demand signal:** index tokens holding B20 equities can't tell a corporate-action rebalance from a price move.
- **Requested:** ticker, event_type, expected_adjustment_date, multiplier_delta, sec_filing_url and quoted_text, status (including late), onchain_tx, confidence; a diff feed; API first, then MCP, then webhooks; free calendar and paid detail ($0.01–0.05 per call over x402).
- **Delivered since:** `/v1/events` in their field shape and `/v1/changes`, both live at https://keldrin.vercel.app.
- **Evidence level:** specific request plus an offer. **Classification:** prospect; not a customer or partner.

## Patterns so far (3 conversations, still too few to conclude)
- **Dividends and corporate actions with onchain effect:** both.
- **Onchain data:** both (Bankr: multiplier and tx proof; Hector: unspecified).
- **Earnings:** Hector only.
- **Token interest:** Hector only. Bankr's interest is in x402 per-call payment, not a token.
- **Historical NAV, risk, market sessions, B20 policies:** CD-003 only, but backed by code they wrote themselves.

## CD-003 — MAXXAGENT (2026-11-27)
(The founder's brief called this "Update 002"; CD-002 is already Bankr, so this is CD-003.)
- **Who:** the builder of MAXXAGENT (agent-picked baskets of Coinbase tokenized stocks on Base). Repo github.com/0xAxelowETH/maxxagent (MIT).
- **Verbatim (as relayed):**
  > "Using: Chainlink NAV feeds for every stock (the price of record); DexScreener / GeckoTerminal for 24/7 DEX prices and pool liquidity; KyberSwap for routing, with our own cost guard vs NAV; SEC EDGAR 10-K data for revenue / net income.
  > Had to build: Weekend/holiday handling … Risk data: there's no API for volatility or max drawdown on these tokens, so we read Chainlink round history onchain and cache it (lots of RPC calls) … Liquidity checks … A B20 watcher …
  > Biggest wish: an official historical NAV / corporate-actions API (dividends, splits, multipliers) so nobody has to rebuild it from raw rounds."
- **Verified:** their code does what they describe (riskStats.ts walks Chainlink rounds; marketHours.ts hardcodes NYSE holidays to 2027; b20Guard.ts reads policies). Gaps checked against Coinbase's API: no NAV history, corporate actions only by UUID. Details: docs/research/FEASIBILITY_CD003.md.
- **Evidence level:** described infrastructure they built themselves (stronger than a request). **Classification:** potential design partner; not a customer, partner or integration.
- **Questions for the founder's reply:** Would a NAV-history + corporate-actions + risk API replace your code? Which interval (rounds or daily closes)? How fresh? Would you test an early endpoint for NVDAc?
